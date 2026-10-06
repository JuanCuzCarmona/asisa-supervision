require("dotenv").config();

/* Hora argentina para todo el proceso: los códigos ACTA-AAAAMMDD y la lectura
   de las columnas TIMESTAMP (sin zona) dependen de esto. Los servidores en la
   nube corren en UTC y, sin esta línea, una ronda de las 22 h quedaría fechada
   al día siguiente. Se fija antes de crear cualquier Date. */
const ZONA_HORARIA = "America/Argentina/Buenos_Aires";
process.env.TZ = ZONA_HORARIA;
const express   = require("express");
const cors      = require("cors");
const helmet    = require("helmet");
const rateLimit = require("express-rate-limit");
const bcrypt    = require("bcryptjs");
const jwt       = require("jsonwebtoken");
const { Pool }  = require("pg");

const app  = express();
const PORT = process.env.PORT || 3000;

/* ════════════════════════════════════════════
   VALIDACIÓN DE VARIABLES DE ENTORNO
   El servidor no arranca si falta algo crítico.
════════════════════════════════════════════ */
// En la nube la base suele venir como una sola DATABASE_URL; en local, en partes.
const REQUIRED_ENV = process.env.DATABASE_URL
  ? ["JWT_SECRET"]
  : ["DB_HOST","DB_PORT","DB_NAME","DB_USER","DB_PASSWORD","JWT_SECRET"];
for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    console.error(`❌ Variable de entorno faltante: ${key}`);
    process.exit(1);
  }
}
if (process.env.JWT_SECRET.length < 32) {
  console.error("❌ JWT_SECRET debe tener al menos 32 caracteres.");
  process.exit(1);
}

/* ════════════════════════════════════════════
   CONEXIÓN A POSTGRESQL
════════════════════════════════════════════ */
/* DB_SSL: "off" (local, por defecto) · "require" (cifra la conexión sin validar el
   certificado — lo que piden la mayoría de las bases gestionadas) · "verify"
   (cifra y valida el certificado contra las CA del sistema). */
const DB_SSL = (process.env.DB_SSL || "off").toLowerCase();
if (!["off","require","verify"].includes(DB_SSL)) {
  console.error('❌ DB_SSL debe ser "off", "require" o "verify".');
  process.exit(1);
}

const pool = new Pool({
  ...(process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL }
    : {
        host:     process.env.DB_HOST,
        port:     parseInt(process.env.DB_PORT),
        database: process.env.DB_NAME,
        user:     process.env.DB_USER,
        password: process.env.DB_PASSWORD,
      }),
  ssl:      DB_SSL === "off" ? false : { rejectUnauthorized: DB_SSL === "verify" },
  // Cada conexión arranca en hora argentina (parámetro de inicio, antes de
  // cualquier consulta): NOW() y las fechas sin zona se interpretan igual que
  // en el proceso de Node, esté donde esté el servidor.
  options:  `-c timezone=${ZONA_HORARIA}`,
  max:      10,               // máximo de conexiones simultáneas en el pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.connect((err, client, release) => {
  if (err) {
    console.error("❌ Error al conectar con PostgreSQL:", err.message);
    process.exit(1);
  }
  release();
  console.log("✅ Conectado a PostgreSQL:", process.env.DATABASE_URL ? new URL(process.env.DATABASE_URL).hostname : process.env.DB_NAME);
});

/* ════════════════════════════════════════════
   SEGURIDAD — HEADERS, CORS, RATE LIMIT
════════════════════════════════════════════ */

// Detrás del proxy HTTPS de la plataforma (Railway, Render…) la IP real del
// cliente llega en X-Forwarded-For. Sin esto el rate limit ve a todos los
// usuarios como una sola IP (la del proxy) y los bloquea juntos.
// TRUST_PROXY = cantidad de proxies delante (1 en Railway/Render; 0 en local).
const TRUST_PROXY = parseInt(process.env.TRUST_PROXY || "0", 10);
if (TRUST_PROXY > 0) app.set("trust proxy", TRUST_PROXY);

// Headers de seguridad HTTP (X-Frame-Options, CSP, etc.)
app.use(helmet());

// CORS: solo acepta requests del origen configurado o localhost
const ALLOWED_ORIGINS = [...new Set([
  ...(process.env.CORS_ORIGIN || "http://localhost:5500").split(",").map(o => o.trim()),
  "https://asi-supervision.pages.dev",
])];

app.use(cors({
  origin: (origin, cb) => {
    // Permite requests sin origin (Tailscale directo, curl, apps móviles nativas).
    // No se acepta el Origin literal "null": lo envían tanto file:// (la app se
    // sirve siempre por HTTP/HTTPS) como cualquier iframe sandboxeado, y aceptarlo
    // ampliaba la superficie de ataque sin habilitar ningún flujo real.
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    cb(new Error("Origen no permitido por CORS"));
  },
  methods:     ["GET","POST","PATCH","DELETE","OPTIONS"],
  credentials: true,
}));

// Rate limit general: 200 requests por IP cada 15 minutos
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      200,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { ok: false, mensaje: "Demasiadas solicitudes. Esperá unos minutos." },
}));

// Rate limit estricto solo para login: 10 intentos cada 15 minutos.
// LOGIN_MAX_INTENTOS permite subirlo temporalmente mientras se prueba; en
// producción normal la variable no se define y vale 10.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      parseInt(process.env.LOGIN_MAX_INTENTOS || "10", 10),
  message:  { ok: false, mensaje: "Demasiados intentos de login. Esperá 15 minutos." },
});

// Las evidencias fotográficas viajan en base64 → límite generoso
app.use(express.json({ limit: "25mb" }));

/* ════════════════════════════════════════════
   MIDDLEWARES DE AUTENTICACIÓN Y AUTORIZACIÓN
════════════════════════════════════════════ */

// Caché corto de usuarios activos: evita consultar la base en cada request
// pero detecta bajas en menos de 2 minutos.
const _userActiveCache = new Map();
const USER_CACHE_TTL_MS = 120_000;

// Verifica que el request tenga un JWT válido y que el usuario siga activo
async function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ ok: false, mensaje: "Autenticación requerida." });
  }
  try {
    req.user = jwt.verify(header.slice(7), process.env.JWT_SECRET);
  } catch (err) {
    const msg = err.name === "TokenExpiredError"
      ? "Sesión expirada. Volvé a iniciar sesión."
      : "Token inválido.";
    return res.status(401).json({ ok: false, mensaje: msg });
  }
  // Verificar que el usuario no haya sido dado de baja
  const cached = _userActiveCache.get(req.user.id);
  if (cached && Date.now() - cached.ts < USER_CACHE_TTL_MS) {
    if (!cached.activo) return res.status(401).json({ ok: false, mensaje: "Tu cuenta fue deshabilitada." });
    return next();
  }
  try {
    const r = await pool.query("SELECT activo FROM usuarios WHERE id = $1", [req.user.id]);
    const activo = r.rows[0]?.activo !== false;
    _userActiveCache.set(req.user.id, { activo, ts: Date.now() });
    if (!activo) return res.status(401).json({ ok: false, mensaje: "Tu cuenta fue deshabilitada." });
  } catch { /* Si falla la consulta, dejamos pasar — fail-open */ }
  next();
}

// Verifica que el usuario tenga uno de los roles permitidos
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.rol)) {
      return res.status(403).json({ ok: false, mensaje: "No tenés permisos para esta acción." });
    }
    next();
  };
}

// Helpers de validación rápida
const isPositiveInt = (v) => Number.isInteger(Number(v)) && Number(v) > 0;
const isString      = (v, min = 1, max = 20000) =>
  typeof v === "string" && v.trim().length >= min && v.trim().length <= max;
const isValidLat    = (v) => v == null || (typeof v === "number" && Number.isFinite(v) && v >= -90  && v <= 90);
const isValidLng    = (v) => v == null || (typeof v === "number" && Number.isFinite(v) && v >= -180 && v <= 180);
const isValidDate   = (v) => v == null || !Number.isNaN(new Date(v).getTime());

/* Distancia Haversine en metros — misma fórmula que el cliente (asi_prototype.html),
   pero acá es la que vale: el geocerco se recalcula en el servidor y no se confía
   en el `en_geocerca` que declara el dispositivo. */
function distanciaMetros(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const toRad = (d) => d * Math.PI / 180;
  const dLat = toRad(lat2 - lat1), dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Precisión del GPS reportada por el dispositivo, en metros. Se tolera hasta 1 km:
// más que eso es un fix de torre de celular, no sirve para validar presencia.
const isValidPrecision = (v) =>
  v == null || (typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= 1000);

/* ════════════════════════════════════════════
   POST /api/login
   Pública — rate limit estricto
   Body: { username, password }
════════════════════════════════════════════ */
app.post("/api/login", loginLimiter, async (req, res) => {
  const { username, password } = req.body;

  if (!isString(username) || !isString(password)) {
    return res.status(400).json({ ok: false, mensaje: "Usuario y contraseña requeridos." });
  }

  try {
    const result = await pool.query(
      // Los usuarios dados de alta por Administración no entran hasta que el dueño los aprueba
      "SELECT id, nombre, rol, password_hash FROM usuarios WHERE username = $1 AND activo = TRUE AND NOT pendiente_aprobacion",
      [username.trim()]
    );

    const user = result.rows[0];

    // Siempre hace la comparación (evita timing attack de enumeración de usuarios)
    const hashToCompare = user?.password_hash || "$2b$10$invalidhashpadding000000000000000000000000000000000000";
    const valid = await bcrypt.compare(password, hashToCompare);

    if (!user || !valid) {
      // Mensaje genérico: no revelar si el usuario existe o no
      return res.status(401).json({ ok: false, mensaje: "Usuario o contraseña incorrectos." });
    }

    // PRD §10 — expiración de 8 horas (una jornada de supervisión)
    const token = jwt.sign(
      { id: user.id, nombre: user.nombre, rol: user.rol },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.json({
      ok: true,
      token,
      usuario: { id: user.id, nombre: user.nombre, rol: user.rol },
    });

  } catch (err) {
    console.error("[login] Error interno:", err.message);
    res.status(500).json({ ok: false, mensaje: "Error interno del servidor." });
  }
});

/* ════════════════════════════════════════════
   GET /api/inicializar
   Requiere: cualquier rol autenticado
   Devuelve todo lo que la app necesita para operar:
   objetivos (con visitas del mes), vigiladores, checklist
   configurable y catálogo de observaciones.
════════════════════════════════════════════ */
app.get("/api/inicializar", requireAuth, async (req, res) => {
  try {
    const [objetivos, vigiladores, secciones, items, ajustes, observaciones] = await Promise.all([
      // Objetivos + contador de visitas del mes en curso (PRD §7)
      pool.query(`
        SELECT o.id, o.nombre, o.tipo, o.subtipo, o.modalidad, o.direccion,
               o.lat, o.lng, o.radio_geocerca_m, o.visitas_meta_mes, o.activo,
               COUNT(r.id)::int AS visitas_mes
        FROM objetivos o
        LEFT JOIN rondas_actas r
          ON r.objetivo_id = o.id
         AND date_trunc('month', r.fecha_hora) = date_trunc('month', NOW())
        WHERE o.activo = TRUE
        GROUP BY o.id
        ORDER BY o.nombre
      `),

      // Vigiladores con perfil completo (PRD §9)
      pool.query(`
        SELECT v.id, v.legajo, v.nombre, v.dni, v.puesto,
               v.credencial_numero, v.credencial_venc,
               v.es_chofer, v.licencia_cat, v.licencia_venc, v.armado, v.estado,
               v.telefono, v.domicilio, v.fecha_nacimiento, v.nacionalidad,
               v.convenio, v.tiene_radio, v.foto_url,
               o.nombre AS objetivo_asignado
        FROM vigiladores v
        LEFT JOIN objetivos o ON v.objetivo_asignado_id = o.id
        WHERE v.activo = TRUE
        ORDER BY v.nombre
      `),

      pool.query("SELECT id, clave, nombre, color, orden FROM checklist_secciones ORDER BY orden"),

      pool.query(`
        SELECT i.id, i.seccion_id, s.clave AS seccion_clave,
               i.titulo_corto, i.criterio_completo, i.area_responsable,
               i.tipos_objetivo, i.orden
        FROM checklist_items i
        JOIN checklist_secciones s ON i.seccion_id = s.id
        WHERE i.activo = TRUE
        ORDER BY s.orden, i.orden
      `),

      // Diferencias del checklist respecto de la plantilla del tipo de objetivo
      pool.query("SELECT objetivo_id, item_id, incluido, nota FROM objetivo_checklist"),

      pool.query("SELECT id, area, texto FROM observaciones_catalogo WHERE activo = TRUE ORDER BY area, texto"),
    ]);

    res.json({
      ok:            true,
      objetivos:     objetivos.rows,
      vigiladores:   vigiladores.rows,
      secciones:     secciones.rows,
      checklist:     items.rows,
      ajustes:       ajustes.rows,
      observaciones: observaciones.rows,
    });

  } catch (err) {
    console.error("[inicializar] Error interno:", err.message);
    res.status(500).json({ ok: false, mensaje: "Error al cargar los datos iniciales." });
  }
});

/* ════════════════════════════════════════════
   POST /api/rondas
   Requiere: rol supervisor
   Guarda el acta completa en una transacción atómica.
   `en_geocerca` NO se acepta del body: se calcula acá con lat/lng contra las
   coordenadas del objetivo. Una ronda presencial fuera del radio se rechaza.
   Body: {
     objetivo_id, tipo, lat, lng, precision_gps_m,
     justificacion_fuera, sincronizado_offline, hora_inicio, hora_fin,
     vigiladores:  [{ id, firma_base64, nego_firmar }],
     checklist:    [{ item_id, pregunta, valoracion, observacion_pred, observacion_libre }],
     incidencias:  [{ item_id, item_titulo, valoracion, vigilador_id,
                      area_responsable, categoria, descripcion }],
     evidencias:   [{ imagen_base64, lat, lng }]
   }
════════════════════════════════════════════ */
app.post("/api/rondas", requireAuth, requireRole("supervisor"), async (req, res) => {
  const {
    objetivo_id,
    tipo                 = "presencial",
    lat,
    lng,
    precision_gps_m,
    justificacion_fuera,
    sincronizado_offline = false,
    hora_inicio,
    hora_fin,
    checklist            = [],
    incidencias          = [],
    evidencias           = [],
  } = req.body;

  // Acepta `vigiladores` (formato nuevo, con firma por persona) o `vigilador_ids` (legacy)
  const vigiladoresRaw = Array.isArray(req.body.vigiladores) && req.body.vigiladores.length > 0
    ? req.body.vigiladores
    : (req.body.vigilador_ids || []);

  // Normaliza a { id, firma_base64, nego_firmar } acepte números u objetos
  const vigiladores = vigiladoresRaw
    .map(v => (typeof v === "object" && v !== null)
      ? { id: v.id, firma_base64: v.firma_base64 || null, nego_firmar: Boolean(v.nego_firmar) }
      : { id: v, firma_base64: null, nego_firmar: false })
    .filter(v => isPositiveInt(v.id));

  // Validación de inputs
  if (!isPositiveInt(objetivo_id)) {
    return res.status(400).json({ ok: false, mensaje: "objetivo_id inválido." });
  }
  if (vigiladores.length === 0) {
    return res.status(400).json({ ok: false, mensaje: "Se requiere al menos un vigilador válido." });
  }
  if (!["presencial","remota"].includes(tipo)) {
    return res.status(400).json({ ok: false, mensaje: "tipo debe ser 'presencial' o 'remota'." });
  }
  if (tipo === "remota" && !isString(justificacion_fuera, 10, 2000)) {
    return res.status(400).json({ ok: false, mensaje: "Justificación obligatoria para ronda remota (mínimo 10 caracteres)." });
  }
  if (!isValidLat(lat)) {
    return res.status(400).json({ ok: false, mensaje: "lat inválida (debe estar entre -90 y 90)." });
  }
  if (!isValidLng(lng)) {
    return res.status(400).json({ ok: false, mensaje: "lng inválida (debe estar entre -180 y 180)." });
  }
  if (!isValidPrecision(precision_gps_m)) {
    return res.status(400).json({ ok: false, mensaje: "precision_gps_m inválida (debe estar entre 0 y 1000 metros)." });
  }
  if (!isValidDate(hora_inicio)) {
    return res.status(400).json({ ok: false, mensaje: "hora_inicio inválida." });
  }
  if (!isValidDate(hora_fin)) {
    return res.status(400).json({ ok: false, mensaje: "hora_fin inválida." });
  }
  // PRD §5.2 — no se guarda un acta sin al menos una firma o una negativa registrada
  if (!vigiladores.some(v => v.firma_base64 || v.nego_firmar)) {
    return res.status(400).json({ ok: false, mensaje: "Se requiere al menos una firma o una negativa registrada." });
  }
  for (const v of vigiladores) {
    if (v.firma_base64 && !String(v.firma_base64).startsWith("data:image/")) {
      return res.status(400).json({ ok: false, mensaje: `Firma inválida para el vigilador ${v.id}.` });
    }
  }

  const supervisor_id = req.user.id; // viene del JWT, no del body — no se puede falsificar

  /* ── Geocerco: se recalcula acá, no se acepta el que declara el dispositivo ──
     El diferenciador del producto es que el acta sea defendible ante un reclamo
     del cliente; un booleano enviado por el teléfono no prueba presencia, así que
     la distancia se calcula contra las coordenadas del objetivo en la base.
     La precisión del GPS se descuenta del radio: en interiores o entre galpones
     un fix puede tener ±50 m y no queremos rebotar a un supervisor que sí está
     adentro. Se guardan distancia y precisión para poder auditar el margen. */
  const objRes = await pool.query(
    "SELECT lat, lng, radio_geocerca_m FROM objetivos WHERE id = $1 AND activo = TRUE",
    [objetivo_id]
  );
  if (objRes.rowCount === 0) {
    return res.status(400).json({ ok: false, mensaje: "El objetivo no existe o está inactivo." });
  }
  const objetivo = objRes.rows[0];

  let distanciaM = null;
  let enGeocerca = false;
  if (lat != null && lng != null && objetivo.lat != null && objetivo.lng != null) {
    distanciaM = distanciaMetros(lat, lng, objetivo.lat, objetivo.lng);
    const margen = precision_gps_m != null ? precision_gps_m : 0;
    enGeocerca = (distanciaM - margen) <= (objetivo.radio_geocerca_m || 0);
  }

  // Una ronda presencial sin ubicación verificable no se guarda: es exactamente
  // el caso que la supervisión remota (con justificación obligatoria) cubre.
  if (tipo === "presencial") {
    if (distanciaM == null) {
      return res.status(400).json({
        ok: false,
        mensaje: "Una ronda presencial requiere coordenadas GPS del dispositivo. Registrala como supervisión remota si no hay señal.",
      });
    }
    if (!enGeocerca) {
      return res.status(400).json({
        ok: false,
        mensaje: `Fuera del geocerco: ${Math.round(distanciaM)} m del objetivo (radio permitido ${objetivo.radio_geocerca_m} m). Registrala como supervisión remota justificando el motivo.`,
        distancia_m: Math.round(distanciaM),
        radio_m: objetivo.radio_geocerca_m,
      });
    }
  }

  if (evidencias.some(foto => foto.item_id != null &&
    (!isPositiveInt(foto.item_id) || !checklist.some(r => Number(r.item_id) === Number(foto.item_id))))) {
    return res.status(400).json({ ok: false, mensaje: "El punto asociado a una foto no pertenece al checklist." });
  }
  if (evidencias.some(foto => foto.tomada_en != null && !isValidDate(foto.tomada_en))) {
    return res.status(400).json({ ok: false, mensaje: "Fecha de captura de una foto inválida." });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Código de acta: se genera DESPUÉS de insertar usando el ID (sin race condition)
    const actaResult = await client.query(
      `INSERT INTO rondas_actas
         (supervisor_id, objetivo_id, tipo, en_geocerca, lat, lng,
          distancia_geocerca_m, precision_gps_m,
          justificacion_fuera, sincronizado_offline, hora_inicio, hora_fin)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::timestamptz,$12::timestamptz)
       RETURNING id`,
      [
        supervisor_id, objetivo_id, tipo,
        enGeocerca,                                            // calculado acá, no el del body
        lat ?? null,                                            // ?? y no || — la coordenada 0 es válida
        lng ?? null,
        distanciaM != null ? Math.round(distanciaM) : null,
        precision_gps_m ?? null,
        justificacion_fuera || null,
        Boolean(sincronizado_offline),
        hora_inicio || null,
        hora_fin    || null,
      ]
    );
    const rondaId = actaResult.rows[0].id;

    // Código basado en el ID — garantiza unicidad sin race condition
    const now       = new Date();
    const codigoActa = `ACTA-${now.getFullYear()}${String(now.getMonth()+1).padStart(2,"0")}${String(now.getDate()).padStart(2,"0")}-${String(rondaId).padStart(6,"0")}`;
    await client.query("UPDATE rondas_actas SET codigo_acta = $1 WHERE id = $2", [codigoActa, rondaId]);

    // 2. Una fila por vigilador inspeccionado, con su firma individual (PRD §5.2)
    for (const v of vigiladores) {
      await client.query(
        `INSERT INTO ronda_vigiladores (ronda_id, vigilador_id, firma_base64, nego_firmar)
         VALUES ($1,$2,$3,$4)`,
        [rondaId, v.id, v.firma_base64, v.nego_firmar]
      );
    }

    // 3. Insertar respuestas del checklist
    for (const item of checklist) {
      if (!item.item_id && !item.pregunta) continue;
      await client.query(
        `INSERT INTO checklist_respuestas
           (ronda_id, item_id, pregunta_texto, valoracion, observacion_pred, observacion_libre)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [
          rondaId,
          isPositiveInt(item.item_id) ? parseInt(item.item_id) : null,
          isString(item.pregunta, 1, 300) ? item.pregunta.trim() : null,
          ["B","R","M"].includes(item.valoracion) ? item.valoracion : "B",
          isString(item.observacion_pred, 1, 2000)  ? item.observacion_pred.trim()  : null,
          isString(item.observacion_libre, 1, 2000) ? item.observacion_libre.trim() : null,
        ]
      );
    }

    // 4. Evidencia fotográfica con marca de agua GPS (PRD §8 paso 5)
    for (const foto of evidencias) {
      if (!isString(foto.imagen_base64) || !foto.imagen_base64.startsWith("data:image/")) continue;
      if (!isValidLat(foto.lat) || !isValidLng(foto.lng)) continue;
      const itemId = foto.item_id ?? null;
      await client.query(
        `INSERT INTO evidencias_fotos (ronda_id, checklist_item_id, imagen_base64, lat, lng, tomada_en)
         VALUES ($1,$2,$3,$4,$5,COALESCE($6::timestamptz,NOW()))`,
        [rondaId, itemId, foto.imagen_base64, foto.lat ?? null, foto.lng ?? null, foto.tomada_en ?? null]
      );
    }

    // 5. Tickets — código generado desde el ID (sin race condition)
    const ticketsCreados = [];
    for (const inc of incidencias) {
      if (!isString(inc.descripcion, 1, 2000)) continue;

      const ticketResult = await client.query(
        `INSERT INTO tickets_incidencias
           (ronda_id, area_responsable, categoria, descripcion,
            checklist_item_id, item_titulo, valoracion, vigilador_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         RETURNING id`,
        [
          rondaId,
          isString(inc.area_responsable, 1, 100) ? inc.area_responsable.trim() : "Operaciones",
          isString(inc.categoria, 1, 100)         ? inc.categoria.trim()        : "General",
          inc.descripcion.trim(),
          isPositiveInt(inc.item_id)      ? parseInt(inc.item_id)      : null,
          isString(inc.item_titulo, 1, 200) ? inc.item_titulo.trim() : null,
          ["R","M"].includes(inc.valoracion) ? inc.valoracion : null,
          isPositiveInt(inc.vigilador_id) ? parseInt(inc.vigilador_id) : null,
        ]
      );
      const ticketId     = ticketResult.rows[0].id;
      const mes          = String(now.getMonth()+1).padStart(2,"0");
      const codigoTicket = `INC-${now.getFullYear()}${mes}-${String(ticketId).padStart(4,"0")}`;

      await client.query(
        "UPDATE tickets_incidencias SET codigo_ticket = $1 WHERE id = $2",
        [codigoTicket, ticketId]
      );
      ticketsCreados.push({ id: ticketId, codigo_ticket: codigoTicket, item_titulo: inc.item_titulo || null });
    }

    // 6. Si la visita estaba en la ruta del supervisor para ese día, queda realizada.
    //    El día es el del inicio de la ronda (un acta sincronizada tarde cuenta para su día).
    await client.query(
      `UPDATE rutas_visitas SET ronda_id = $1
       WHERE supervisor_id = $2 AND objetivo_id = $3 AND ronda_id IS NULL
         AND fecha = COALESCE($4::timestamptz, NOW())::date`,
      [rondaId, supervisor_id, objetivo_id, hora_inicio || null]
    );

    await client.query("COMMIT");

    res.status(201).json({
      ok:          true,
      mensaje:     "Acta guardada correctamente.",
      ronda_id:    rondaId,
      codigo_acta: codigoActa,
      tickets:     ticketsCreados,
    });

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("[rondas] ROLLBACK ejecutado:", err.message);
    res.status(500).json({ ok: false, mensaje: "Error al guardar el acta. Operación revertida." });
  } finally {
    client.release();
  }
});

/* ════════════════════════════════════════════
   GET /api/tickets
   Requiere: admin o dueno
   Query opcional: ?estado=ABIERTO|RESUELTO&objetivo_id=X&area=RRHH&limite=50&pagina=1
════════════════════════════════════════════ */
app.get("/api/tickets", requireAuth, requireRole("admin","dueno"), async (req, res) => {
  const { estado, objetivo_id, area } = req.query;
  const limite = Math.min(parseInt(req.query.limite) || 50, 200);
  const pagina = Math.max(parseInt(req.query.pagina) || 1, 1);
  const offset = (pagina - 1) * limite;

  try {
    const params  = [];
    const wheres  = [];

    if (estado && ["ABIERTO","RESUELTO"].includes(estado.toUpperCase())) {
      params.push(estado.toUpperCase());
      wheres.push(`t.estado = $${params.length}`);
    }
    if (isPositiveInt(objetivo_id)) {
      params.push(parseInt(objetivo_id));
      wheres.push(`r.objetivo_id = $${params.length}`);
    }
    if (isString(area)) {
      params.push(area.trim());
      wheres.push(`t.area_responsable = $${params.length}`);
    }

    const whereClause = wheres.length ? "WHERE " + wheres.join(" AND ") : "";

    params.push(limite, offset);
    const query = `
      SELECT
        t.id, t.codigo_ticket, t.area_responsable, t.categoria, t.descripcion,
        t.estado, t.resolucion, t.fecha_creacion, t.fecha_resolucion,
        t.item_titulo, t.valoracion,
        u.nombre  AS supervisor,
        o.nombre  AS objetivo,
        v.nombre  AS vigilador,
        r.tipo    AS tipo_ronda,
        r.id      AS ronda_id,
        r.codigo_acta,
        r.en_geocerca
      FROM tickets_incidencias t
      JOIN rondas_actas r ON t.ronda_id      = r.id
      JOIN usuarios     u ON r.supervisor_id = u.id
      JOIN objetivos    o ON r.objetivo_id   = o.id
      LEFT JOIN vigiladores v ON t.vigilador_id = v.id
      ${whereClause}
      ORDER BY t.fecha_creacion DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `;

    const [tickets, total] = await Promise.all([
      pool.query(query, params),
      pool.query(
        `SELECT COUNT(*) FROM tickets_incidencias t
         JOIN rondas_actas r ON t.ronda_id = r.id
         ${whereClause}`,
        params.slice(0, -2)
      ),
    ]);

    res.json({
      ok:      true,
      tickets: tickets.rows,
      paginacion: {
        total:   parseInt(total.rows[0].count),
        pagina,
        limite,
        paginas: Math.ceil(parseInt(total.rows[0].count) / limite),
      },
    });

  } catch (err) {
    console.error("[tickets] Error interno:", err.message);
    res.status(500).json({ ok: false, mensaje: "Error al obtener los tickets." });
  }
});

/* Acta completa para auditoría de Administración y Dirección. */
app.get("/api/actas/:codigo", requireAuth, requireRole("admin", "dueno"), async (req, res) => {
  const codigo = String(req.params.codigo || "");
  if (!/^ACTA-[A-Za-z0-9-]{4,60}$/.test(codigo)) {
    return res.status(400).json({ ok: false, mensaje: "Código de acta inválido." });
  }
  try {
    const cabecera = await pool.query(`
      SELECT r.id, r.codigo_acta, r.tipo, r.en_geocerca, r.lat, r.lng,
             r.distancia_geocerca_m, r.precision_gps_m, r.justificacion_fuera,
             r.sincronizado_offline, r.hora_inicio, r.hora_fin, r.fecha_hora,
             u.nombre AS supervisor, o.nombre AS objetivo, o.direccion,
             o.tipo AS objetivo_tipo, o.radio_geocerca_m
      FROM rondas_actas r
      JOIN usuarios u ON u.id = r.supervisor_id
      JOIN objetivos o ON o.id = r.objetivo_id
      WHERE r.codigo_acta = $1`, [codigo]);
    if (!cabecera.rowCount) return res.status(404).json({ ok: false, mensaje: "Acta no encontrada." });
    const id = cabecera.rows[0].id;
    const [checklist, vigiladores, evidencias, tickets] = await Promise.all([
      pool.query(`SELECT cr.item_id, cr.pregunta_texto, cr.valoracion, cr.observacion_pred, cr.observacion_libre,
                        ci.criterio_completo, ci.area_responsable
                  FROM checklist_respuestas cr LEFT JOIN checklist_items ci ON ci.id = cr.item_id
                  WHERE cr.ronda_id = $1 ORDER BY cr.id`, [id]),
      pool.query(`SELECT v.nombre, v.legajo, v.puesto, rv.firma_base64, rv.nego_firmar
                  FROM ronda_vigiladores rv JOIN vigiladores v ON v.id = rv.vigilador_id
                  WHERE rv.ronda_id = $1 ORDER BY rv.id`, [id]),
      pool.query(`SELECT e.id, e.checklist_item_id, ci.titulo_corto AS item_titulo,
                        e.imagen_base64, e.lat, e.lng, e.tomada_en
                  FROM evidencias_fotos e LEFT JOIN checklist_items ci ON ci.id = e.checklist_item_id
                  WHERE e.ronda_id = $1 ORDER BY e.id`, [id]),
      pool.query(`SELECT codigo_ticket, area_responsable, descripcion, valoracion, estado, resolucion
                  FROM tickets_incidencias WHERE ronda_id = $1 ORDER BY id`, [id]),
    ]);
    res.json({ ok: true, acta: cabecera.rows[0], checklist: checklist.rows,
      vigiladores: vigiladores.rows, evidencias: evidencias.rows, tickets: tickets.rows });
  } catch (err) {
    console.error("[actas] Error interno:", err.message);
    res.status(500).json({ ok: false, mensaje: "Error al consultar el acta." });
  }
});

/* ════════════════════════════════════════════
   PATCH /api/tickets/:id/resolver
   Requiere: admin
   Body: { resolucion }
════════════════════════════════════════════ */
app.patch("/api/tickets/:id/resolver", requireAuth, requireRole("admin"), async (req, res) => {
  const id         = parseInt(req.params.id);
  const { resolucion } = req.body;

  if (!isPositiveInt(id)) {
    return res.status(400).json({ ok: false, mensaje: "ID de ticket inválido." });
  }
  if (!isString(resolucion, 5)) {
    return res.status(400).json({ ok: false, mensaje: "La resolución es obligatoria (mínimo 5 caracteres)." });
  }

  try {
    const result = await pool.query(
      `UPDATE tickets_incidencias
       SET estado = 'RESUELTO',
           resolucion = $1,
           fecha_resolucion = NOW(),
           resuelto_por = $2
       WHERE id = $3 AND estado = 'ABIERTO'
       RETURNING id, codigo_ticket, estado`,
      [resolucion.trim(), req.user.id, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ ok: false, mensaje: "Ticket no encontrado o ya estaba resuelto." });
    }

    res.json({ ok: true, mensaje: "Ticket cerrado correctamente.", ticket: result.rows[0] });

  } catch (err) {
    console.error("[tickets/resolver] Error interno:", err.message);
    res.status(500).json({ ok: false, mensaje: "Error al cerrar el ticket." });
  }
});

/* ════════════════════════════════════════════
   GET /api/kpis
   Requiere: admin o dueno
   Devuelve: métricas del mes actual
════════════════════════════════════════════ */
app.get("/api/kpis", requireAuth, requireRole("admin","dueno"), async (req, res) => {
  try {
    const [rondas, ticketsAbiertos, ticketsPorArea, cumplimiento, tiempoResolucion] = await Promise.all([

      // Total de rondas del mes actual
      pool.query(`
        SELECT COUNT(*) AS total_rondas,
               COUNT(*) FILTER (WHERE tipo = 'presencial') AS presenciales,
               COUNT(*) FILTER (WHERE tipo = 'remota')     AS remotas
        FROM rondas_actas
        WHERE date_trunc('month', fecha_hora) = date_trunc('month', NOW())
      `),

      // Tickets abiertos — 'criticos' son los de valoración MALO
      pool.query(`
        SELECT COUNT(*) AS abiertos,
               COUNT(*) FILTER (WHERE valoracion = 'M') AS criticos,
               COUNT(*) FILTER (WHERE fecha_creacion >= NOW() - INTERVAL '48 hours') AS ultimas_48h,
               COUNT(*) FILTER (WHERE fecha_creacion < NOW() - INTERVAL '48 hours') AS anteriores_48h
        FROM tickets_incidencias
        WHERE estado = 'ABIERTO'
      `),

      // Tickets abiertos agrupados por área responsable
      pool.query(`
        SELECT area_responsable, COUNT(*) AS cantidad
        FROM tickets_incidencias
        WHERE estado = 'ABIERTO'
        GROUP BY area_responsable
        ORDER BY cantidad DESC
      `),

      // Rondas completadas vs meta por objetivo este mes
      pool.query(`
        SELECT o.id, o.nombre, o.tipo, o.subtipo, o.visitas_meta_mes,
               COUNT(r.id)::int AS rondas_realizadas
        FROM objetivos o
        LEFT JOIN rondas_actas r
          ON r.objetivo_id = o.id
          AND date_trunc('month', r.fecha_hora) = date_trunc('month', NOW())
        WHERE o.activo = TRUE
        GROUP BY o.id, o.nombre, o.tipo, o.subtipo, o.visitas_meta_mes
        ORDER BY o.nombre
      `),

      // Tiempo promedio de resolución de tickets (días)
      pool.query(`
        SELECT ROUND(AVG(EXTRACT(EPOCH FROM (fecha_resolucion - fecha_creacion))/86400)::numeric, 1)
               AS dias_promedio_resolucion
        FROM tickets_incidencias
        WHERE estado = 'RESUELTO'
          AND fecha_resolucion >= date_trunc('month', NOW())
      `),
    ]);

    const r = rondas.rows[0];
    const t = ticketsAbiertos.rows[0];

    // Total de tickets cerrados este mes (para el panel del dueño)
    const cerrados = await pool.query(`
      SELECT COUNT(*) AS cerrados FROM tickets_incidencias
      WHERE estado = 'RESUELTO'
        AND date_trunc('month', fecha_resolucion) = date_trunc('month', NOW())
    `);

    res.json({
      ok: true,
      kpis: {
        rondas: {
          total_mes:    parseInt(r.total_rondas),
          presenciales: parseInt(r.presenciales),
          remotas:      parseInt(r.remotas),
        },
        tickets: {
          abiertos:       parseInt(t.abiertos),
          criticos:       parseInt(t.criticos),
          cerrados:       parseInt(cerrados.rows[0].cerrados),
          ultimas_48h:    parseInt(t.ultimas_48h),
          anteriores_48h: parseInt(t.anteriores_48h),
          por_area:       ticketsPorArea.rows,
          dias_promedio_resolucion: parseFloat(tiempoResolucion.rows[0].dias_promedio_resolucion) || 0,
        },
        cumplimiento_objetivos: cumplimiento.rows,
      },
    });

  } catch (err) {
    console.error("[kpis] Error interno:", err.message);
    res.status(500).json({ ok: false, mensaje: "Error al calcular los KPIs." });
  }
});

/* Tendencia mensual para Dirección: rondas, modalidades e incidencias. */
app.get("/api/kpis/historico", requireAuth, requireRole("admin", "dueno"), async (req, res) => {
  const meses = Math.min(Math.max(parseInt(req.query.meses, 10) || 6, 2), 12);
  try {
    const result = await pool.query(`
      SELECT to_char(m.mes, 'YYYY-MM') AS mes,
             COUNT(DISTINCT r.id)::int AS rondas,
             COUNT(DISTINCT r.id) FILTER (WHERE r.tipo = 'remota')::int AS remotas,
             COUNT(DISTINCT t.id) FILTER (WHERE t.valoracion = 'M')::int AS criticas
      FROM generate_series(date_trunc('month', NOW()) - (($1::int - 1) * INTERVAL '1 month'),
                           date_trunc('month', NOW()), INTERVAL '1 month') AS m(mes)
      LEFT JOIN rondas_actas r ON r.fecha_hora >= m.mes AND r.fecha_hora < m.mes + INTERVAL '1 month'
      LEFT JOIN tickets_incidencias t ON t.ronda_id = r.id
      GROUP BY m.mes ORDER BY m.mes`, [meses]);
    res.json({ ok: true, historico: result.rows });
  } catch (err) {
    console.error("[kpis/historico] Error interno:", err.message);
    res.status(500).json({ ok: false, mensaje: "Error al consultar la tendencia." });
  }
});

/* ════════════════════════════════════════════
   GET /api/actividad
   Requiere: admin o dueno
   Últimas rondas registradas — alimenta el feed en vivo.
════════════════════════════════════════════ */
app.get("/api/actividad", requireAuth, requireRole("admin","dueno"), async (req, res) => {
  const limite = Math.min(parseInt(req.query.limite) || 8, 50);
  const soloRemotas = req.query.tipo === "remota";
  try {
    const result = await pool.query(`
      SELECT r.id, r.codigo_acta, r.tipo, r.en_geocerca, r.fecha_hora,
             r.justificacion_fuera, r.distancia_geocerca_m,
             u.nombre AS supervisor,
             o.nombre AS objetivo,
             COUNT(t.id)::int AS tickets
      FROM rondas_actas r
      JOIN usuarios  u ON r.supervisor_id = u.id
      JOIN objetivos o ON r.objetivo_id   = o.id
      LEFT JOIN tickets_incidencias t ON t.ronda_id = r.id
      ${soloRemotas ? "WHERE r.tipo = 'remota'" : ""}
      GROUP BY r.id, u.nombre, o.nombre
      ORDER BY r.fecha_hora DESC
      LIMIT $1
    `, [limite]);

    res.json({ ok: true, actividad: result.rows });
  } catch (err) {
    console.error("[actividad] Error interno:", err.message);
    res.status(500).json({ ok: false, mensaje: "Error al obtener la actividad reciente." });
  }
});

/* ════════════════════════════════════════════
   GET /api/vigilador/:legajo
   Requiere: supervisor
   Perfil completo del vigilador (PRD §9): datos personales,
   características, historial de actas, sanciones e incidencias.
════════════════════════════════════════════ */
app.get("/api/vigilador/:legajo", requireAuth, requireRole("supervisor"), async (req, res) => {
  const legajo = parseInt(req.params.legajo);
  if (!isPositiveInt(legajo)) {
    return res.status(400).json({ ok: false, mensaje: "Legajo inválido." });
  }

  try {
    const vigilador = await pool.query(
      `SELECT v.id, v.legajo, v.nombre, v.dni, v.puesto,
              v.credencial_numero, v.credencial_venc,
              v.es_chofer, v.licencia_cat, v.licencia_venc, v.armado, v.estado,
              v.telefono, v.domicilio, v.fecha_nacimiento, v.nacionalidad,
              v.convenio, v.tiene_radio, v.foto_url,
              o.nombre AS objetivo_asignado
       FROM vigiladores v
       LEFT JOIN objetivos o ON v.objetivo_asignado_id = o.id
       WHERE v.legajo = $1`,
      [legajo]
    );

    if (vigilador.rows.length === 0) {
      return res.status(404).json({ ok: false, mensaje: `No se encontró el legajo ${legajo}.` });
    }

    const vigId = vigilador.rows[0].id;

    const [historial, sanciones, incidencias] = await Promise.all([
      pool.query(
        `SELECT tipo, descripcion, fecha
         FROM historial_vigiladores
         WHERE vigilador_id = $1 AND activo = TRUE
         ORDER BY fecha DESC LIMIT 10`,
        [vigId]
      ),
      pool.query(
        `SELECT id, descripcion, estado, fecha
         FROM sanciones
         WHERE vigilador_id = $1 AND activo = TRUE
         ORDER BY fecha DESC`,
        [vigId]
      ),
      pool.query(
        `SELECT t.codigo_ticket, t.descripcion, t.estado, t.valoracion,
                t.item_titulo, t.fecha_creacion, o.nombre AS objetivo
         FROM tickets_incidencias t
         JOIN rondas_actas r ON t.ronda_id    = r.id
         JOIN objetivos    o ON r.objetivo_id = o.id
         WHERE t.vigilador_id = $1
         ORDER BY t.fecha_creacion DESC LIMIT 10`,
        [vigId]
      ),
    ]);

    res.json({
      ok:          true,
      vigilador:   vigilador.rows[0],
      historial:   historial.rows,
      sanciones:   sanciones.rows,
      incidencias: incidencias.rows,
    });

  } catch (err) {
    console.error("[vigilador] Error interno:", err.message);
    res.status(500).json({ ok: false, mensaje: "Error al buscar el vigilador." });
  }
});

/* ════════════════════════════════════════════
   CAMBIO DE CONTRASEÑA CON APROBACIÓN DEL DUEÑO
   Cada usuario pide su propia clave nueva (confirmando la actual); el pedido
   queda pendiente hasta que Dirección lo aprueba. La clave se guarda ya
   hasheada, así que quien aprueba nunca la ve. El dueño cambia la suya sin
   pasar por aprobación: no hay nadie por encima que deba autorizarlo.
════════════════════════════════════════════ */
const CLAVE_MIN = 8, CLAVE_MAX = 128;

/* GET /api/cuenta/clave — estado del último pedido propio */
app.get("/api/cuenta/clave", requireAuth, async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT id, estado, creada_en, resuelta_en
       FROM solicitudes_clave WHERE usuario_id = $1
       ORDER BY creada_en DESC LIMIT 1`, [req.user.id]);
    res.json({ ok: true, solicitud: r.rows[0] || null });
  } catch (err) {
    console.error("[clave] Error interno:", err.message);
    res.status(500).json({ ok: false, mensaje: "Error al consultar el pedido." });
  }
});

/* POST /api/cuenta/clave — Body: { clave_actual, clave_nueva } */
app.post("/api/cuenta/clave", requireAuth, async (req, res) => {
  const { clave_actual, clave_nueva } = req.body || {};
  if (typeof clave_actual !== "string" || !clave_actual) {
    return res.status(400).json({ ok: false, mensaje: "Ingresá tu contraseña actual." });
  }
  if (typeof clave_nueva !== "string" || clave_nueva.length < CLAVE_MIN || clave_nueva.length > CLAVE_MAX) {
    return res.status(400).json({ ok: false, mensaje: `La contraseña nueva debe tener entre ${CLAVE_MIN} y ${CLAVE_MAX} caracteres.` });
  }
  if (clave_nueva === clave_actual) {
    return res.status(400).json({ ok: false, mensaje: "La contraseña nueva tiene que ser distinta de la actual." });
  }

  const client = await pool.connect();
  try {
    const u = await client.query(
      "SELECT id, rol, password_hash FROM usuarios WHERE id = $1 AND activo = TRUE", [req.user.id]);
    if (!u.rowCount || !(await bcrypt.compare(clave_actual, u.rows[0].password_hash))) {
      return res.status(400).json({ ok: false, mensaje: "La contraseña actual no es correcta." });
    }
    const hash = await bcrypt.hash(clave_nueva, 10);

    await client.query("BEGIN");
    // Un pedido nuevo reemplaza al pendiente anterior (índice único parcial).
    await client.query(
      `UPDATE solicitudes_clave SET estado = 'cancelada', resuelta_en = NOW()
       WHERE usuario_id = $1 AND estado = 'pendiente'`, [req.user.id]);

    if (u.rows[0].rol === "dueno") {
      await client.query("UPDATE usuarios SET password_hash = $1 WHERE id = $2", [hash, req.user.id]);
      await client.query(
        `INSERT INTO solicitudes_clave (usuario_id, password_hash, estado, resuelta_en, resuelta_por)
         VALUES ($1, $2, 'aprobada', NOW(), $1)`, [req.user.id, hash]);
      await client.query("COMMIT");
      return res.json({ ok: true, estado: "aprobada", mensaje: "Contraseña actualizada." });
    }

    await client.query(
      "INSERT INTO solicitudes_clave (usuario_id, password_hash) VALUES ($1, $2)", [req.user.id, hash]);
    await client.query("COMMIT");
    res.status(201).json({ ok: true, estado: "pendiente",
      mensaje: "Pedido enviado. La contraseña nueva rige cuando Dirección lo apruebe." });
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("[clave] Error interno:", err.message);
    res.status(500).json({ ok: false, mensaje: "Error al registrar el pedido." });
  } finally {
    client.release();
  }
});

/* GET /api/solicitudes-clave — pedidos pendientes (dueño) */
app.get("/api/solicitudes-clave", requireAuth, requireRole("dueno"), async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT s.id, s.creada_en, u.nombre, u.username, u.rol, p.nombre AS pedido_por
       FROM solicitudes_clave s
       JOIN usuarios u ON u.id = s.usuario_id
       LEFT JOIN usuarios p ON p.id = s.solicitada_por AND p.id <> s.usuario_id
       WHERE s.estado = 'pendiente'
       ORDER BY s.creada_en`);
    res.json({ ok: true, solicitudes: r.rows });
  } catch (err) {
    console.error("[solicitudes-clave] Error interno:", err.message);
    res.status(500).json({ ok: false, mensaje: "Error al consultar los pedidos." });
  }
});

/* PATCH /api/solicitudes-clave/:id — Body: { aprobar: true|false } (dueño) */
app.patch("/api/solicitudes-clave/:id", requireAuth, requireRole("dueno"), async (req, res) => {
  const { id } = req.params;
  const { aprobar } = req.body || {};
  if (!isPositiveInt(id)) return res.status(400).json({ ok: false, mensaje: "ID inválido." });
  if (typeof aprobar !== "boolean") {
    return res.status(400).json({ ok: false, mensaje: "Indicá si el pedido se aprueba o se rechaza." });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const s = await client.query(
      `SELECT usuario_id, password_hash FROM solicitudes_clave
       WHERE id = $1 AND estado = 'pendiente' FOR UPDATE`, [id]);
    if (!s.rowCount) {
      await client.query("ROLLBACK");
      return res.status(404).json({ ok: false, mensaje: "El pedido no existe o ya fue resuelto." });
    }
    if (aprobar) {
      await client.query("UPDATE usuarios SET password_hash = $1 WHERE id = $2",
        [s.rows[0].password_hash, s.rows[0].usuario_id]);
    }
    await client.query(
      `UPDATE solicitudes_clave SET estado = $1, resuelta_en = NOW(), resuelta_por = $2 WHERE id = $3`,
      [aprobar ? "aprobada" : "rechazada", req.user.id, id]);
    await client.query("COMMIT");
    res.json({ ok: true, estado: aprobar ? "aprobada" : "rechazada" });
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("[solicitudes-clave] Error interno:", err.message);
    res.status(500).json({ ok: false, mensaje: "Error al resolver el pedido." });
  } finally {
    client.release();
  }
});

/* ════════════════════════════════════════════
   HELPERS DE ADMINISTRACIÓN
════════════════════════════════════════════ */
const SUBTIPOS_VALIDOS = ['barrio_multipuesto','barrio_unipersonal','local_comercial','industria','empresa_oficinas'];
const AREAS_VALIDAS = ['Logística','Supervisión','Operaciones','RRHH','Mantenimiento'];

function derivarTipo(subtipo) {
  if (subtipo.startsWith('barrio_')) return 'Barrios';
  if (subtipo === 'industria') return 'Industrias';
  return 'Locales';
}

async function auditar(db, uid, accion, entidad, eid, detalle) {
  await db.query(
    'INSERT INTO auditoria (usuario_id, accion, entidad, entidad_id, detalle) VALUES ($1,$2,$3,$4,$5)',
    [uid, accion, entidad, eid, detalle ? JSON.stringify(detalle) : null]
  );
}

function diasHabiles(anio, mes, desdeHoy) {
  const dias = [];
  const hoy = new Date();
  const desde = desdeHoy && anio === hoy.getFullYear() && mes === (hoy.getMonth() + 1)
    ? hoy.getDate() : 1;
  const ultimo = new Date(anio, mes, 0).getDate();
  for (let d = desde; d <= ultimo; d++) {
    const dow = new Date(anio, mes - 1, d).getDay();
    if (dow >= 1 && dow <= 5) dias.push(d);
  }
  return dias;
}

/* ════════════════════════════════════════════
   ADMINISTRACIÓN DE OBJETIVOS
════════════════════════════════════════════ */
app.get("/api/admin/objetivos", requireAuth, requireRole("admin","dueno"), async (req, res) => {
  try {
    const r = await pool.query(`
      SELECT id, nombre, tipo, subtipo, modalidad, direccion, lat, lng,
             radio_geocerca_m, visitas_meta_mes, activo, notas
      FROM objetivos ORDER BY activo DESC, nombre`);
    res.json({ ok: true, objetivos: r.rows });
  } catch (err) {
    console.error("[admin/objetivos]", err.message);
    res.status(500).json({ ok: false, mensaje: "Error al listar los objetivos." });
  }
});

app.post("/api/admin/objetivos", requireAuth, requireRole("admin"), async (req, res) => {
  const { nombre, subtipo, modalidad, direccion, lat, lng, radio_geocerca_m, visitas_meta_mes, notas } = req.body;
  if (!isString(nombre, 2, 200)) return res.status(400).json({ ok: false, mensaje: "Nombre obligatorio (2 a 200 caracteres)." });
  if (!SUBTIPOS_VALIDOS.includes(subtipo)) return res.status(400).json({ ok: false, mensaje: `Subtipo inválido. Valores: ${SUBTIPOS_VALIDOS.join(', ')}.` });
  if (modalidad && !['unipersonal','multipuesto'].includes(modalidad)) return res.status(400).json({ ok: false, mensaje: "Modalidad inválida." });
  if (lat != null && !isValidLat(lat)) return res.status(400).json({ ok: false, mensaje: "Latitud inválida." });
  if (lng != null && !isValidLng(lng)) return res.status(400).json({ ok: false, mensaje: "Longitud inválida." });
  if (radio_geocerca_m != null && (typeof radio_geocerca_m !== 'number' || radio_geocerca_m < 30 || radio_geocerca_m > 5000))
    return res.status(400).json({ ok: false, mensaje: "Radio de geocerca: entre 30 y 5000 m." });
  if (visitas_meta_mes != null && (!Number.isInteger(visitas_meta_mes) || visitas_meta_mes < 0))
    return res.status(400).json({ ok: false, mensaje: "Meta de visitas mensual inválida." });
  const tipo = derivarTipo(subtipo);
  try {
    const r = await pool.query(
      `INSERT INTO objetivos (nombre, tipo, subtipo, modalidad, direccion, lat, lng, radio_geocerca_m, visitas_meta_mes, notas)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
      [nombre.trim(), tipo, subtipo, modalidad || (subtipo.includes('multipuesto') ? 'multipuesto' : 'unipersonal'),
       direccion?.trim() || null, lat ?? null, lng ?? null, radio_geocerca_m ?? 150, visitas_meta_mes ?? 0, notas?.trim() || null]);
    await auditar(pool, req.user.id, 'crear', 'objetivos', r.rows[0].id, { nombre: nombre.trim(), subtipo });
    res.status(201).json({ ok: true, id: r.rows[0].id, mensaje: "Objetivo creado." });
  } catch (err) {
    if (err.code === '23505' && err.constraint?.includes('nombre'))
      return res.status(409).json({ ok: false, mensaje: "Ya existe un objetivo con ese nombre." });
    console.error("[admin/objetivos/crear]", err.message);
    res.status(500).json({ ok: false, mensaje: "Error al crear el objetivo." });
  }
});

app.patch("/api/admin/objetivos/:id", requireAuth, requireRole("admin"), async (req, res) => {
  const id = parseInt(req.params.id);
  if (!isPositiveInt(id)) return res.status(400).json({ ok: false, mensaje: "ID inválido." });
  const { nombre, subtipo, modalidad, direccion, lat, lng, radio_geocerca_m, visitas_meta_mes, notas } = req.body;
  if (nombre != null && !isString(nombre, 2, 200)) return res.status(400).json({ ok: false, mensaje: "Nombre: 2 a 200 caracteres." });
  if (subtipo != null && !SUBTIPOS_VALIDOS.includes(subtipo)) return res.status(400).json({ ok: false, mensaje: "Subtipo inválido." });
  if (modalidad != null && !['unipersonal','multipuesto'].includes(modalidad)) return res.status(400).json({ ok: false, mensaje: "Modalidad inválida." });
  if (lat !== undefined && lat != null && !isValidLat(lat)) return res.status(400).json({ ok: false, mensaje: "Latitud inválida." });
  if (lng !== undefined && lng != null && !isValidLng(lng)) return res.status(400).json({ ok: false, mensaje: "Longitud inválida." });
  if (radio_geocerca_m != null && (typeof radio_geocerca_m !== 'number' || radio_geocerca_m < 30 || radio_geocerca_m > 5000))
    return res.status(400).json({ ok: false, mensaje: "Radio: 30–5000 m." });
  if (visitas_meta_mes != null && (!Number.isInteger(visitas_meta_mes) || visitas_meta_mes < 0))
    return res.status(400).json({ ok: false, mensaje: "Meta mensual inválida." });
  const sets = []; const vals = []; let idx = 1;
  const add = (col, val) => { sets.push(`${col} = $${idx++}`); vals.push(val); };
  if (nombre != null) add('nombre', nombre.trim());
  if (subtipo != null) { add('subtipo', subtipo); add('tipo', derivarTipo(subtipo)); }
  if (modalidad != null) add('modalidad', modalidad);
  if (direccion !== undefined) add('direccion', direccion?.trim() || null);
  if (lat !== undefined) add('lat', lat ?? null);
  if (lng !== undefined) add('lng', lng ?? null);
  if (radio_geocerca_m != null) add('radio_geocerca_m', radio_geocerca_m);
  if (visitas_meta_mes != null) add('visitas_meta_mes', visitas_meta_mes);
  if (notas !== undefined) add('notas', notas?.trim() || null);
  if (sets.length === 0) return res.status(400).json({ ok: false, mensaje: "Nada que modificar." });
  vals.push(id);
  try {
    const r = await pool.query(`UPDATE objetivos SET ${sets.join(', ')} WHERE id = $${idx} RETURNING id`, vals);
    if (!r.rowCount) return res.status(404).json({ ok: false, mensaje: "Objetivo no encontrado." });
    await auditar(pool, req.user.id, 'editar', 'objetivos', id, req.body);
    res.json({ ok: true, mensaje: "Objetivo actualizado." });
  } catch (err) {
    if (err.code === '23505' && err.constraint?.includes('nombre'))
      return res.status(409).json({ ok: false, mensaje: "Ya existe un objetivo con ese nombre." });
    console.error("[admin/objetivos/editar]", err.message);
    res.status(500).json({ ok: false, mensaje: "Error al editar el objetivo." });
  }
});

app.patch("/api/admin/objetivos/:id/baja", requireAuth, requireRole("admin"), async (req, res) => {
  const id = parseInt(req.params.id);
  if (!isPositiveInt(id)) return res.status(400).json({ ok: false, mensaje: "ID inválido." });
  try {
    const r = await pool.query("UPDATE objetivos SET activo = FALSE WHERE id = $1 AND activo = TRUE RETURNING id", [id]);
    if (!r.rowCount) return res.status(404).json({ ok: false, mensaje: "Objetivo no encontrado o ya dado de baja." });
    await auditar(pool, req.user.id, 'baja', 'objetivos', id, null);
    res.json({ ok: true, mensaje: "Objetivo dado de baja." });
  } catch (err) {
    console.error("[admin/objetivos/baja]", err.message);
    res.status(500).json({ ok: false, mensaje: "Error al dar de baja." });
  }
});

app.patch("/api/admin/objetivos/:id/reactivar", requireAuth, requireRole("admin"), async (req, res) => {
  const id = parseInt(req.params.id);
  if (!isPositiveInt(id)) return res.status(400).json({ ok: false, mensaje: "ID inválido." });
  try {
    const r = await pool.query("UPDATE objetivos SET activo = TRUE WHERE id = $1 AND activo = FALSE RETURNING id", [id]);
    if (!r.rowCount) return res.status(404).json({ ok: false, mensaje: "Objetivo no encontrado o ya activo." });
    await auditar(pool, req.user.id, 'reactivar', 'objetivos', id, null);
    res.json({ ok: true, mensaje: "Objetivo reactivado." });
  } catch (err) {
    console.error("[admin/objetivos/reactivar]", err.message);
    res.status(500).json({ ok: false, mensaje: "Error al reactivar." });
  }
});

/* ════════════════════════════════════════════
   ADMINISTRACIÓN DE VIGILADORES
════════════════════════════════════════════ */
app.get("/api/admin/vigiladores", requireAuth, requireRole("admin","dueno"), async (req, res) => {
  try {
    const r = await pool.query(`
      SELECT v.*, o.nombre AS objetivo_asignado
      FROM vigiladores v
      LEFT JOIN objetivos o ON v.objetivo_asignado_id = o.id
      ORDER BY v.activo DESC, v.nombre`);
    res.json({ ok: true, vigiladores: r.rows });
  } catch (err) {
    console.error("[admin/vigiladores]", err.message);
    res.status(500).json({ ok: false, mensaje: "Error al listar los vigiladores." });
  }
});

app.post("/api/admin/vigiladores", requireAuth, requireRole("admin"), async (req, res) => {
  const { legajo, nombre, dni, puesto, credencial_numero, credencial_venc,
          es_chofer, licencia_cat, licencia_venc, armado, estado,
          telefono, domicilio, fecha_nacimiento, nacionalidad, convenio,
          tiene_radio, objetivo_asignado_id } = req.body;
  if (!isPositiveInt(legajo)) return res.status(400).json({ ok: false, mensaje: "Legajo obligatorio (número positivo)." });
  if (!isString(nombre, 2, 200)) return res.status(400).json({ ok: false, mensaje: "Nombre obligatorio." });
  if (objetivo_asignado_id != null) {
    if (!isPositiveInt(objetivo_asignado_id)) return res.status(400).json({ ok: false, mensaje: "ID de objetivo inválido." });
    const obj = await pool.query("SELECT id FROM objetivos WHERE id = $1 AND activo = TRUE", [objetivo_asignado_id]);
    if (!obj.rowCount) return res.status(400).json({ ok: false, mensaje: "El objetivo asignado no existe o está dado de baja." });
  }
  try {
    const r = await pool.query(
      `INSERT INTO vigiladores (legajo, nombre, dni, puesto, credencial_numero, credencial_venc,
        es_chofer, licencia_cat, licencia_venc, armado, estado,
        telefono, domicilio, fecha_nacimiento, nacionalidad, convenio,
        tiene_radio, objetivo_asignado_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18) RETURNING id`,
      [parseInt(legajo), nombre.trim(), dni?.trim() || null, puesto?.trim() || null,
       credencial_numero?.trim() || null, credencial_venc || null,
       Boolean(es_chofer), licencia_cat?.trim() || null, licencia_venc || null,
       Boolean(armado), estado || 'activo',
       telefono?.trim() || null, domicilio?.trim() || null, fecha_nacimiento || null,
       nacionalidad?.trim() || 'Argentina', convenio?.trim() || 'UPSRA',
       Boolean(tiene_radio), objetivo_asignado_id || null]);
    await auditar(pool, req.user.id, 'crear', 'vigiladores', r.rows[0].id, { legajo, nombre: nombre.trim() });
    res.status(201).json({ ok: true, id: r.rows[0].id, mensaje: "Vigilador creado." });
  } catch (err) {
    if (err.code === '23505' && err.constraint?.includes('legajo'))
      return res.status(409).json({ ok: false, mensaje: "Ya existe un vigilador con ese legajo." });
    console.error("[admin/vigiladores/crear]", err.message);
    res.status(500).json({ ok: false, mensaje: "Error al crear el vigilador." });
  }
});

app.patch("/api/admin/vigiladores/:id", requireAuth, requireRole("admin"), async (req, res) => {
  const id = parseInt(req.params.id);
  if (!isPositiveInt(id)) return res.status(400).json({ ok: false, mensaje: "ID inválido." });
  const { legajo, nombre, dni, puesto, credencial_numero, credencial_venc,
          es_chofer, licencia_cat, licencia_venc, armado, estado,
          telefono, domicilio, fecha_nacimiento, nacionalidad, convenio,
          tiene_radio, objetivo_asignado_id } = req.body;
  if (nombre != null && !isString(nombre, 2, 200)) return res.status(400).json({ ok: false, mensaje: "Nombre inválido." });
  if (objetivo_asignado_id != null) {
    if (!isPositiveInt(objetivo_asignado_id)) return res.status(400).json({ ok: false, mensaje: "ID de objetivo inválido." });
    const obj = await pool.query("SELECT id FROM objetivos WHERE id = $1 AND activo = TRUE", [objetivo_asignado_id]);
    if (!obj.rowCount) return res.status(400).json({ ok: false, mensaje: "El objetivo asignado no existe o está dado de baja." });
  }
  const sets = []; const vals = []; let idx = 1;
  const add = (col, val) => { sets.push(`${col} = $${idx++}`); vals.push(val); };
  if (legajo != null) add('legajo', parseInt(legajo));
  if (nombre != null) add('nombre', nombre.trim());
  if (dni !== undefined) add('dni', dni?.trim() || null);
  if (puesto !== undefined) add('puesto', puesto?.trim() || null);
  if (credencial_numero !== undefined) add('credencial_numero', credencial_numero?.trim() || null);
  if (credencial_venc !== undefined) add('credencial_venc', credencial_venc || null);
  if (es_chofer !== undefined) add('es_chofer', Boolean(es_chofer));
  if (licencia_cat !== undefined) add('licencia_cat', licencia_cat?.trim() || null);
  if (licencia_venc !== undefined) add('licencia_venc', licencia_venc || null);
  if (armado !== undefined) add('armado', Boolean(armado));
  if (estado != null && ['activo','suspendido'].includes(estado)) add('estado', estado);
  if (telefono !== undefined) add('telefono', telefono?.trim() || null);
  if (domicilio !== undefined) add('domicilio', domicilio?.trim() || null);
  if (fecha_nacimiento !== undefined) add('fecha_nacimiento', fecha_nacimiento || null);
  if (nacionalidad !== undefined) add('nacionalidad', nacionalidad?.trim() || null);
  if (convenio !== undefined) add('convenio', convenio?.trim() || null);
  if (tiene_radio !== undefined) add('tiene_radio', Boolean(tiene_radio));
  if (objetivo_asignado_id !== undefined) add('objetivo_asignado_id', objetivo_asignado_id || null);
  if (sets.length === 0) return res.status(400).json({ ok: false, mensaje: "Nada que modificar." });
  vals.push(id);
  try {
    const r = await pool.query(`UPDATE vigiladores SET ${sets.join(', ')} WHERE id = $${idx} RETURNING id`, vals);
    if (!r.rowCount) return res.status(404).json({ ok: false, mensaje: "Vigilador no encontrado." });
    await auditar(pool, req.user.id, 'editar', 'vigiladores', id, req.body);
    res.json({ ok: true, mensaje: "Vigilador actualizado." });
  } catch (err) {
    if (err.code === '23505' && err.constraint?.includes('legajo'))
      return res.status(409).json({ ok: false, mensaje: "Ya existe un vigilador con ese legajo." });
    console.error("[admin/vigiladores/editar]", err.message);
    res.status(500).json({ ok: false, mensaje: "Error al editar el vigilador." });
  }
});

app.patch("/api/admin/vigiladores/:id/baja", requireAuth, requireRole("admin"), async (req, res) => {
  const id = parseInt(req.params.id);
  if (!isPositiveInt(id)) return res.status(400).json({ ok: false, mensaje: "ID inválido." });
  try {
    const r = await pool.query("UPDATE vigiladores SET activo = FALSE WHERE id = $1 AND activo = TRUE RETURNING id", [id]);
    if (!r.rowCount) return res.status(404).json({ ok: false, mensaje: "Vigilador no encontrado o ya dado de baja." });
    await auditar(pool, req.user.id, 'baja', 'vigiladores', id, null);
    res.json({ ok: true, mensaje: "Vigilador dado de baja." });
  } catch (err) {
    console.error("[admin/vigiladores/baja]", err.message);
    res.status(500).json({ ok: false, mensaje: "Error al dar de baja." });
  }
});

app.patch("/api/admin/vigiladores/:id/reactivar", requireAuth, requireRole("admin"), async (req, res) => {
  const id = parseInt(req.params.id);
  if (!isPositiveInt(id)) return res.status(400).json({ ok: false, mensaje: "ID inválido." });
  try {
    const r = await pool.query("UPDATE vigiladores SET activo = TRUE WHERE id = $1 AND activo = FALSE RETURNING id", [id]);
    if (!r.rowCount) return res.status(404).json({ ok: false, mensaje: "Vigilador no encontrado o ya activo." });
    await auditar(pool, req.user.id, 'reactivar', 'vigiladores', id, null);
    res.json({ ok: true, mensaje: "Vigilador reactivado." });
  } catch (err) {
    console.error("[admin/vigiladores/reactivar]", err.message);
    res.status(500).json({ ok: false, mensaje: "Error al reactivar." });
  }
});

/* ════════════════════════════════════════════
   SANCIONES POR VIGILADOR
════════════════════════════════════════════ */
app.get("/api/admin/vigiladores/:id/sanciones", requireAuth, requireRole("admin","dueno"), async (req, res) => {
  const id = parseInt(req.params.id);
  if (!isPositiveInt(id)) return res.status(400).json({ ok: false, mensaje: "ID inválido." });
  try {
    const r = await pool.query(
      "SELECT id, descripcion, estado, fecha, activo FROM sanciones WHERE vigilador_id = $1 ORDER BY fecha DESC", [id]);
    res.json({ ok: true, sanciones: r.rows });
  } catch (err) {
    console.error("[admin/sanciones]", err.message);
    res.status(500).json({ ok: false, mensaje: "Error al listar las sanciones." });
  }
});

app.post("/api/admin/vigiladores/:id/sanciones", requireAuth, requireRole("admin"), async (req, res) => {
  const vigilador_id = parseInt(req.params.id);
  if (!isPositiveInt(vigilador_id)) return res.status(400).json({ ok: false, mensaje: "ID de vigilador inválido." });
  const { descripcion, estado, fecha } = req.body;
  if (!isString(descripcion, 3, 2000)) return res.status(400).json({ ok: false, mensaje: "Descripción obligatoria (mínimo 3 caracteres)." });
  if (estado && !['activa','cumplida','apelada'].includes(estado)) return res.status(400).json({ ok: false, mensaje: "Estado inválido." });
  try {
    const r = await pool.query(
      "INSERT INTO sanciones (vigilador_id, descripcion, estado, fecha) VALUES ($1,$2,$3,$4) RETURNING id",
      [vigilador_id, descripcion.trim(), estado || 'activa', fecha || new Date().toISOString().slice(0,10)]);
    await auditar(pool, req.user.id, 'crear', 'sanciones', r.rows[0].id, { vigilador_id, descripcion: descripcion.trim() });
    res.status(201).json({ ok: true, id: r.rows[0].id, mensaje: "Sanción registrada." });
  } catch (err) {
    console.error("[admin/sanciones/crear]", err.message);
    res.status(500).json({ ok: false, mensaje: "Error al registrar la sanción." });
  }
});

app.patch("/api/admin/sanciones/:id", requireAuth, requireRole("admin"), async (req, res) => {
  const id = parseInt(req.params.id);
  if (!isPositiveInt(id)) return res.status(400).json({ ok: false, mensaje: "ID inválido." });
  const { descripcion, estado, fecha } = req.body;
  if (descripcion != null && !isString(descripcion, 3, 2000)) return res.status(400).json({ ok: false, mensaje: "Descripción muy corta." });
  if (estado != null && !['activa','cumplida','apelada'].includes(estado)) return res.status(400).json({ ok: false, mensaje: "Estado inválido." });
  const sets = []; const vals = []; let idx = 1;
  if (descripcion != null) { sets.push(`descripcion = $${idx++}`); vals.push(descripcion.trim()); }
  if (estado != null) { sets.push(`estado = $${idx++}`); vals.push(estado); }
  if (fecha != null) { sets.push(`fecha = $${idx++}`); vals.push(fecha); }
  if (sets.length === 0) return res.status(400).json({ ok: false, mensaje: "Nada que modificar." });
  vals.push(id);
  try {
    const r = await pool.query(`UPDATE sanciones SET ${sets.join(', ')} WHERE id = $${idx} RETURNING id`, vals);
    if (!r.rowCount) return res.status(404).json({ ok: false, mensaje: "Sanción no encontrada." });
    await auditar(pool, req.user.id, 'editar', 'sanciones', id, req.body);
    res.json({ ok: true, mensaje: "Sanción actualizada." });
  } catch (err) {
    console.error("[admin/sanciones/editar]", err.message);
    res.status(500).json({ ok: false, mensaje: "Error al editar la sanción." });
  }
});

app.patch("/api/admin/sanciones/:id/baja", requireAuth, requireRole("admin"), async (req, res) => {
  const id = parseInt(req.params.id);
  if (!isPositiveInt(id)) return res.status(400).json({ ok: false, mensaje: "ID inválido." });
  try {
    const r = await pool.query("UPDATE sanciones SET activo = FALSE WHERE id = $1 AND activo = TRUE RETURNING id", [id]);
    if (!r.rowCount) return res.status(404).json({ ok: false, mensaje: "Sanción no encontrada o ya dada de baja." });
    await auditar(pool, req.user.id, 'baja', 'sanciones', id, null);
    res.json({ ok: true, mensaje: "Sanción dada de baja." });
  } catch (err) {
    console.error("[admin/sanciones/baja]", err.message);
    res.status(500).json({ ok: false, mensaje: "Error al dar de baja la sanción." });
  }
});

/* ════════════════════════════════════════════
   HISTORIAL POR VIGILADOR
════════════════════════════════════════════ */
app.get("/api/admin/vigiladores/:id/historial", requireAuth, requireRole("admin","dueno"), async (req, res) => {
  const id = parseInt(req.params.id);
  if (!isPositiveInt(id)) return res.status(400).json({ ok: false, mensaje: "ID inválido." });
  try {
    const r = await pool.query(
      "SELECT id, tipo, descripcion, fecha, activo FROM historial_vigiladores WHERE vigilador_id = $1 ORDER BY fecha DESC", [id]);
    res.json({ ok: true, historial: r.rows });
  } catch (err) {
    console.error("[admin/historial]", err.message);
    res.status(500).json({ ok: false, mensaje: "Error al listar el historial." });
  }
});

app.post("/api/admin/vigiladores/:id/historial", requireAuth, requireRole("admin"), async (req, res) => {
  const vigilador_id = parseInt(req.params.id);
  if (!isPositiveInt(vigilador_id)) return res.status(400).json({ ok: false, mensaje: "ID de vigilador inválido." });
  const { tipo, descripcion, fecha } = req.body;
  if (!tipo || !['Acta','Sanción'].includes(tipo)) return res.status(400).json({ ok: false, mensaje: "Tipo inválido (Acta o Sanción)." });
  if (!isString(descripcion, 3, 2000)) return res.status(400).json({ ok: false, mensaje: "Descripción obligatoria." });
  try {
    const r = await pool.query(
      "INSERT INTO historial_vigiladores (vigilador_id, tipo, descripcion, fecha) VALUES ($1,$2,$3,$4) RETURNING id",
      [vigilador_id, tipo, descripcion.trim(), fecha || new Date().toISOString()]);
    await auditar(pool, req.user.id, 'crear', 'historial_vigiladores', r.rows[0].id, { vigilador_id, tipo });
    res.status(201).json({ ok: true, id: r.rows[0].id, mensaje: "Registro de historial creado." });
  } catch (err) {
    console.error("[admin/historial/crear]", err.message);
    res.status(500).json({ ok: false, mensaje: "Error al crear el registro." });
  }
});

app.patch("/api/admin/historial/:id", requireAuth, requireRole("admin"), async (req, res) => {
  const id = parseInt(req.params.id);
  if (!isPositiveInt(id)) return res.status(400).json({ ok: false, mensaje: "ID inválido." });
  const { tipo, descripcion, fecha } = req.body;
  if (tipo != null && !['Acta','Sanción'].includes(tipo)) return res.status(400).json({ ok: false, mensaje: "Tipo inválido." });
  if (descripcion != null && !isString(descripcion, 3, 2000)) return res.status(400).json({ ok: false, mensaje: "Descripción muy corta." });
  const sets = []; const vals = []; let idx = 1;
  if (tipo != null) { sets.push(`tipo = $${idx++}`); vals.push(tipo); }
  if (descripcion != null) { sets.push(`descripcion = $${idx++}`); vals.push(descripcion.trim()); }
  if (fecha != null) { sets.push(`fecha = $${idx++}`); vals.push(fecha); }
  if (sets.length === 0) return res.status(400).json({ ok: false, mensaje: "Nada que modificar." });
  vals.push(id);
  try {
    const r = await pool.query(`UPDATE historial_vigiladores SET ${sets.join(', ')} WHERE id = $${idx} RETURNING id`, vals);
    if (!r.rowCount) return res.status(404).json({ ok: false, mensaje: "Registro no encontrado." });
    await auditar(pool, req.user.id, 'editar', 'historial_vigiladores', id, req.body);
    res.json({ ok: true, mensaje: "Registro actualizado." });
  } catch (err) {
    console.error("[admin/historial/editar]", err.message);
    res.status(500).json({ ok: false, mensaje: "Error al editar." });
  }
});

app.patch("/api/admin/historial/:id/baja", requireAuth, requireRole("admin"), async (req, res) => {
  const id = parseInt(req.params.id);
  if (!isPositiveInt(id)) return res.status(400).json({ ok: false, mensaje: "ID inválido." });
  try {
    const r = await pool.query("UPDATE historial_vigiladores SET activo = FALSE WHERE id = $1 AND activo = TRUE RETURNING id", [id]);
    if (!r.rowCount) return res.status(404).json({ ok: false, mensaje: "Registro no encontrado o ya dado de baja." });
    await auditar(pool, req.user.id, 'baja', 'historial_vigiladores', id, null);
    res.json({ ok: true, mensaje: "Registro dado de baja." });
  } catch (err) {
    console.error("[admin/historial/baja]", err.message);
    res.status(500).json({ ok: false, mensaje: "Error al dar de baja." });
  }
});

/* ════════════════════════════════════════════
   CHECKLIST POR OBJETIVO
   Ver los ítems con la plantilla de su subtipo + ajustes de objetivo_checklist.
   Agregar o quitar ítems. Volver a la plantilla (borrar el ajuste).
════════════════════════════════════════════ */
app.get("/api/admin/checklist/:objetivo_id", requireAuth, requireRole("admin","dueno"), async (req, res) => {
  const oid = parseInt(req.params.objetivo_id);
  if (!isPositiveInt(oid)) return res.status(400).json({ ok: false, mensaje: "ID de objetivo inválido." });
  try {
    const obj = await pool.query("SELECT id, subtipo FROM objetivos WHERE id = $1", [oid]);
    if (!obj.rowCount) return res.status(404).json({ ok: false, mensaje: "Objetivo no encontrado." });
    const subtipo = obj.rows[0].subtipo;
    const [items, ajustes] = await Promise.all([
      pool.query(`SELECT i.id, i.seccion_id, s.clave AS seccion_clave, s.nombre AS seccion_nombre,
                         i.titulo_corto, i.criterio_completo, i.area_responsable, i.tipos_objetivo, i.orden
                  FROM checklist_items i JOIN checklist_secciones s ON i.seccion_id = s.id
                  WHERE i.activo = TRUE ORDER BY s.orden, i.orden`),
      pool.query("SELECT item_id, incluido, nota FROM objetivo_checklist WHERE objetivo_id = $1", [oid]),
    ]);
    const ajusteMap = {};
    for (const a of ajustes.rows) ajusteMap[a.item_id] = a;
    // Resolver checklist: un ajuste explícito gana; si no, pertenece si su tipos_objetivo incluye el subtipo
    const resultado = items.rows.map(i => {
      const ajuste = ajusteMap[i.id];
      const enPlantilla = (i.tipos_objetivo || []).includes(subtipo);
      const incluido = ajuste ? ajuste.incluido : enPlantilla;
      return { ...i, incluido, ajuste_nota: ajuste?.nota || null, en_plantilla: enPlantilla, tiene_ajuste: !!ajuste };
    });
    res.json({ ok: true, subtipo, checklist: resultado });
  } catch (err) {
    console.error("[admin/checklist]", err.message);
    res.status(500).json({ ok: false, mensaje: "Error al cargar el checklist." });
  }
});

/* POST — agregar o quitar un ítem del checklist de un objetivo */
app.post("/api/admin/checklist/:objetivo_id", requireAuth, requireRole("admin"), async (req, res) => {
  const oid = parseInt(req.params.objetivo_id);
  if (!isPositiveInt(oid)) return res.status(400).json({ ok: false, mensaje: "ID de objetivo inválido." });
  const { item_id, incluido, nota } = req.body;
  if (!isPositiveInt(item_id)) return res.status(400).json({ ok: false, mensaje: "item_id inválido." });
  if (typeof incluido !== 'boolean') return res.status(400).json({ ok: false, mensaje: "incluido debe ser true o false." });
  try {
    await pool.query(
      `INSERT INTO objetivo_checklist (objetivo_id, item_id, incluido, nota)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (objetivo_id, item_id) DO UPDATE SET incluido = $3, nota = $4`,
      [oid, parseInt(item_id), incluido, nota?.trim() || null]);
    await auditar(pool, req.user.id, incluido ? 'agregar_item' : 'quitar_item', 'objetivo_checklist', oid, { item_id, incluido });
    res.json({ ok: true, mensaje: incluido ? "Ítem agregado." : "Ítem quitado." });
  } catch (err) {
    console.error("[admin/checklist/ajustar]", err.message);
    res.status(500).json({ ok: false, mensaje: "Error al ajustar el checklist." });
  }
});

/* DELETE — volver a la plantilla: borra todos los ajustes de un objetivo */
app.delete("/api/admin/checklist/:objetivo_id", requireAuth, requireRole("admin"), async (req, res) => {
  const oid = parseInt(req.params.objetivo_id);
  if (!isPositiveInt(oid)) return res.status(400).json({ ok: false, mensaje: "ID de objetivo inválido." });
  try {
    const r = await pool.query("DELETE FROM objetivo_checklist WHERE objetivo_id = $1", [oid]);
    await auditar(pool, req.user.id, 'reset_checklist', 'objetivo_checklist', oid, { eliminados: r.rowCount });
    res.json({ ok: true, mensaje: `Checklist restaurado a la plantilla (${r.rowCount} ajustes eliminados).` });
  } catch (err) {
    console.error("[admin/checklist/reset]", err.message);
    res.status(500).json({ ok: false, mensaje: "Error al restaurar el checklist." });
  }
});

/* ════════════════════════════════════════════
   ADMINISTRACIÓN DE OBSERVACIONES
════════════════════════════════════════════ */
app.get("/api/admin/observaciones", requireAuth, requireRole("admin","dueno"), async (req, res) => {
  try {
    const r = await pool.query("SELECT id, area, texto, activo FROM observaciones_catalogo ORDER BY activo DESC, area, texto");
    res.json({ ok: true, observaciones: r.rows });
  } catch (err) {
    console.error("[admin/observaciones]", err.message);
    res.status(500).json({ ok: false, mensaje: "Error al listar las observaciones." });
  }
});

app.post("/api/admin/observaciones", requireAuth, requireRole("admin"), async (req, res) => {
  const { area, texto } = req.body;
  if (!AREAS_VALIDAS.includes(area)) return res.status(400).json({ ok: false, mensaje: `Área inválida. Valores: ${AREAS_VALIDAS.join(', ')}.` });
  if (!isString(texto, 3, 500)) return res.status(400).json({ ok: false, mensaje: "Texto obligatorio (3 a 500 caracteres)." });
  try {
    const r = await pool.query(
      "INSERT INTO observaciones_catalogo (area, texto) VALUES ($1,$2) RETURNING id",
      [area, texto.trim()]);
    await auditar(pool, req.user.id, 'crear', 'observaciones_catalogo', r.rows[0].id, { area, texto: texto.trim() });
    res.status(201).json({ ok: true, id: r.rows[0].id, mensaje: "Observación creada." });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ ok: false, mensaje: "Ya existe una observación con ese texto." });
    console.error("[admin/observaciones/crear]", err.message);
    res.status(500).json({ ok: false, mensaje: "Error al crear la observación." });
  }
});

app.patch("/api/admin/observaciones/:id", requireAuth, requireRole("admin"), async (req, res) => {
  const id = parseInt(req.params.id);
  if (!isPositiveInt(id)) return res.status(400).json({ ok: false, mensaje: "ID inválido." });
  const { area, texto } = req.body;
  if (area != null && !AREAS_VALIDAS.includes(area)) return res.status(400).json({ ok: false, mensaje: "Área inválida." });
  if (texto != null && !isString(texto, 3, 500)) return res.status(400).json({ ok: false, mensaje: "Texto: 3 a 500 caracteres." });
  const sets = []; const vals = []; let idx = 1;
  if (area != null) { sets.push(`area = $${idx++}`); vals.push(area); }
  if (texto != null) { sets.push(`texto = $${idx++}`); vals.push(texto.trim()); }
  if (sets.length === 0) return res.status(400).json({ ok: false, mensaje: "Nada que modificar." });
  vals.push(id);
  try {
    const r = await pool.query(`UPDATE observaciones_catalogo SET ${sets.join(', ')} WHERE id = $${idx} RETURNING id`, vals);
    if (!r.rowCount) return res.status(404).json({ ok: false, mensaje: "Observación no encontrada." });
    await auditar(pool, req.user.id, 'editar', 'observaciones_catalogo', id, req.body);
    res.json({ ok: true, mensaje: "Observación actualizada." });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ ok: false, mensaje: "Ya existe una observación con ese texto." });
    console.error("[admin/observaciones/editar]", err.message);
    res.status(500).json({ ok: false, mensaje: "Error al editar la observación." });
  }
});

app.patch("/api/admin/observaciones/:id/baja", requireAuth, requireRole("admin"), async (req, res) => {
  const id = parseInt(req.params.id);
  if (!isPositiveInt(id)) return res.status(400).json({ ok: false, mensaje: "ID inválido." });
  try {
    const r = await pool.query("UPDATE observaciones_catalogo SET activo = FALSE WHERE id = $1 AND activo = TRUE RETURNING id", [id]);
    if (!r.rowCount) return res.status(404).json({ ok: false, mensaje: "Observación no encontrada o ya dada de baja." });
    await auditar(pool, req.user.id, 'baja', 'observaciones_catalogo', id, null);
    res.json({ ok: true, mensaje: "Observación dada de baja." });
  } catch (err) {
    console.error("[admin/observaciones/baja]", err.message);
    res.status(500).json({ ok: false, mensaje: "Error al dar de baja." });
  }
});

app.patch("/api/admin/observaciones/:id/reactivar", requireAuth, requireRole("admin"), async (req, res) => {
  const id = parseInt(req.params.id);
  if (!isPositiveInt(id)) return res.status(400).json({ ok: false, mensaje: "ID inválido." });
  try {
    const r = await pool.query("UPDATE observaciones_catalogo SET activo = TRUE WHERE id = $1 AND activo = FALSE RETURNING id", [id]);
    if (!r.rowCount) return res.status(404).json({ ok: false, mensaje: "Observación no encontrada o ya activa." });
    await auditar(pool, req.user.id, 'reactivar', 'observaciones_catalogo', id, null);
    res.json({ ok: true, mensaje: "Observación reactivada." });
  } catch (err) {
    console.error("[admin/observaciones/reactivar]", err.message);
    res.status(500).json({ ok: false, mensaje: "Error al reactivar." });
  }
});

/* ════════════════════════════════════════════
   ADMINISTRACIÓN DE USUARIOS
   Admin crea supervisores y admins con contraseña inicial (quedan
   con pendiente_aprobacion = TRUE). El dueño los aprueba o rechaza.
   Si los crea el dueño, quedan activos al instante.
   Admin no puede tocar usuarios dueno ni darse de baja a sí mismo.
════════════════════════════════════════════ */
app.get("/api/admin/usuarios", requireAuth, requireRole("admin","dueno"), async (req, res) => {
  try {
    const r = await pool.query(`
      SELECT id, username, nombre, rol, activo, pendiente_aprobacion, telefono, creado_en
      FROM usuarios ORDER BY activo DESC, nombre`);
    res.json({ ok: true, usuarios: r.rows });
  } catch (err) {
    console.error("[admin/usuarios]", err.message);
    res.status(500).json({ ok: false, mensaje: "Error al listar los usuarios." });
  }
});

app.post("/api/admin/usuarios", requireAuth, requireRole("admin","dueno"), async (req, res) => {
  const { username, password, nombre, rol, telefono } = req.body;
  if (!isString(username, 3, 50)) return res.status(400).json({ ok: false, mensaje: "Usuario: 3 a 50 caracteres." });
  if (!isString(password, 8, 128)) return res.status(400).json({ ok: false, mensaje: "Contraseña: 8 a 128 caracteres." });
  if (!isString(nombre, 2, 200)) return res.status(400).json({ ok: false, mensaje: "Nombre obligatorio." });
  // Admin solo puede crear supervisor y admin; dueño puede crear cualquiera
  const rolesPermitidos = req.user.rol === 'dueno' ? ['supervisor','admin','dueno'] : ['supervisor','admin'];
  if (!rolesPermitidos.includes(rol)) return res.status(400).json({ ok: false, mensaje: `Rol inválido. Podés crear: ${rolesPermitidos.join(', ')}.` });
  const pendiente = req.user.rol !== 'dueno'; // Si lo crea el dueño, queda activo al instante
  try {
    const hash = await bcrypt.hash(password, 10);
    const r = await pool.query(
      `INSERT INTO usuarios (username, password_hash, nombre, rol, pendiente_aprobacion, telefono, creado_por, creado_en)
       VALUES ($1,$2,$3,$4,$5,$6,$7,NOW()) RETURNING id`,
      [username.trim().toLowerCase(), hash, nombre.trim(), rol, pendiente, telefono?.trim() || null, req.user.id]);
    await auditar(pool, req.user.id, 'crear', 'usuarios', r.rows[0].id, { username: username.trim(), rol, pendiente });
    res.status(201).json({ ok: true, id: r.rows[0].id, pendiente,
      mensaje: pendiente ? "Usuario creado. Queda pendiente de aprobación por Dirección." : "Usuario creado y activo." });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ ok: false, mensaje: "Ya existe un usuario con ese nombre de usuario." });
    console.error("[admin/usuarios/crear]", err.message);
    res.status(500).json({ ok: false, mensaje: "Error al crear el usuario." });
  }
});

app.patch("/api/admin/usuarios/:id", requireAuth, requireRole("admin","dueno"), async (req, res) => {
  const id = parseInt(req.params.id);
  if (!isPositiveInt(id)) return res.status(400).json({ ok: false, mensaje: "ID inválido." });
  // Admin no puede tocar a un usuario dueño
  if (req.user.rol === 'admin') {
    const target = await pool.query("SELECT rol FROM usuarios WHERE id = $1", [id]);
    if (target.rows[0]?.rol === 'dueno') return res.status(403).json({ ok: false, mensaje: "No podés modificar un usuario de Dirección." });
  }
  const { nombre, telefono } = req.body;
  if (nombre != null && !isString(nombre, 2, 200)) return res.status(400).json({ ok: false, mensaje: "Nombre inválido." });
  const sets = []; const vals = []; let idx = 1;
  if (nombre != null) { sets.push(`nombre = $${idx++}`); vals.push(nombre.trim()); }
  if (telefono !== undefined) { sets.push(`telefono = $${idx++}`); vals.push(telefono?.trim() || null); }
  if (sets.length === 0) return res.status(400).json({ ok: false, mensaje: "Nada que modificar." });
  vals.push(id);
  try {
    const r = await pool.query(`UPDATE usuarios SET ${sets.join(', ')} WHERE id = $${idx} RETURNING id`, vals);
    if (!r.rowCount) return res.status(404).json({ ok: false, mensaje: "Usuario no encontrado." });
    await auditar(pool, req.user.id, 'editar', 'usuarios', id, req.body);
    res.json({ ok: true, mensaje: "Usuario actualizado." });
  } catch (err) {
    console.error("[admin/usuarios/editar]", err.message);
    res.status(500).json({ ok: false, mensaje: "Error al editar el usuario." });
  }
});

app.patch("/api/admin/usuarios/:id/baja", requireAuth, requireRole("admin","dueno"), async (req, res) => {
  const id = parseInt(req.params.id);
  if (!isPositiveInt(id)) return res.status(400).json({ ok: false, mensaje: "ID inválido." });
  if (id === req.user.id) return res.status(400).json({ ok: false, mensaje: "No podés darte de baja a vos mismo." });
  if (req.user.rol === 'admin') {
    const target = await pool.query("SELECT rol FROM usuarios WHERE id = $1", [id]);
    if (target.rows[0]?.rol === 'dueno') return res.status(403).json({ ok: false, mensaje: "No podés dar de baja a un usuario de Dirección." });
  }
  try {
    const r = await pool.query("UPDATE usuarios SET activo = FALSE WHERE id = $1 AND activo = TRUE RETURNING id", [id]);
    if (!r.rowCount) return res.status(404).json({ ok: false, mensaje: "Usuario no encontrado o ya dado de baja." });
    // Invalidar el caché para que el usuario sea rechazado de inmediato
    _userActiveCache.set(id, { activo: false, ts: Date.now() });
    await auditar(pool, req.user.id, 'baja', 'usuarios', id, null);
    res.json({ ok: true, mensaje: "Usuario dado de baja." });
  } catch (err) {
    console.error("[admin/usuarios/baja]", err.message);
    res.status(500).json({ ok: false, mensaje: "Error al dar de baja." });
  }
});

app.patch("/api/admin/usuarios/:id/reactivar", requireAuth, requireRole("admin","dueno"), async (req, res) => {
  const id = parseInt(req.params.id);
  if (!isPositiveInt(id)) return res.status(400).json({ ok: false, mensaje: "ID inválido." });
  if (req.user.rol === 'admin') {
    const target = await pool.query("SELECT rol FROM usuarios WHERE id = $1", [id]);
    if (target.rows[0]?.rol === 'dueno') return res.status(403).json({ ok: false, mensaje: "No podés reactivar un usuario de Dirección." });
  }
  try {
    const r = await pool.query("UPDATE usuarios SET activo = TRUE WHERE id = $1 AND activo = FALSE RETURNING id", [id]);
    if (!r.rowCount) return res.status(404).json({ ok: false, mensaje: "Usuario no encontrado o ya activo." });
    _userActiveCache.delete(id);
    await auditar(pool, req.user.id, 'reactivar', 'usuarios', id, null);
    res.json({ ok: true, mensaje: "Usuario reactivado." });
  } catch (err) {
    console.error("[admin/usuarios/reactivar]", err.message);
    res.status(500).json({ ok: false, mensaje: "Error al reactivar." });
  }
});

/* Blanqueo de contraseña de otro usuario — Admin crea una solicitud con
   solicitada_por para que el dueño la apruebe con el circuito existente. */
app.post("/api/admin/usuarios/:id/blanqueo", requireAuth, requireRole("admin"), async (req, res) => {
  const id = parseInt(req.params.id);
  if (!isPositiveInt(id)) return res.status(400).json({ ok: false, mensaje: "ID inválido." });
  if (id === req.user.id) return res.status(400).json({ ok: false, mensaje: "Para cambiar tu propia clave usá /api/cuenta/clave." });
  const { clave_nueva } = req.body;
  if (!isString(clave_nueva, 8, 128)) return res.status(400).json({ ok: false, mensaje: "Contraseña nueva: 8 a 128 caracteres." });
  const target = await pool.query("SELECT id, rol FROM usuarios WHERE id = $1 AND activo = TRUE", [id]);
  if (!target.rowCount) return res.status(404).json({ ok: false, mensaje: "Usuario no encontrado." });
  if (target.rows[0].rol === 'dueno') return res.status(403).json({ ok: false, mensaje: "No podés blanquear la clave de Dirección." });
  const client = await pool.connect();
  try {
    const hash = await bcrypt.hash(clave_nueva, 10);
    await client.query("BEGIN");
    await client.query(
      `UPDATE solicitudes_clave SET estado = 'cancelada', resuelta_en = NOW()
       WHERE usuario_id = $1 AND estado = 'pendiente'`, [id]);
    await client.query(
      `INSERT INTO solicitudes_clave (usuario_id, password_hash, solicitada_por)
       VALUES ($1,$2,$3)`, [id, hash, req.user.id]);
    await client.query("COMMIT");
    await auditar(pool, req.user.id, 'blanqueo_clave', 'usuarios', id, null);
    res.status(201).json({ ok: true, mensaje: "Solicitud de blanqueo enviada. Dirección tiene que aprobarla." });
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("[admin/usuarios/blanqueo]", err.message);
    res.status(500).json({ ok: false, mensaje: "Error al solicitar el blanqueo." });
  } finally { client.release(); }
});

/* Aprobar o rechazar un usuario pendiente de aprobación (solo dueño) */
app.patch("/api/admin/usuarios/aprobar/:id", requireAuth, requireRole("dueno"), async (req, res) => {
  const id = parseInt(req.params.id);
  if (!isPositiveInt(id)) return res.status(400).json({ ok: false, mensaje: "ID inválido." });
  const { aprobar } = req.body;
  if (typeof aprobar !== 'boolean') return res.status(400).json({ ok: false, mensaje: "Indicá si se aprueba o se rechaza." });
  try {
    if (aprobar) {
      const r = await pool.query(
        "UPDATE usuarios SET pendiente_aprobacion = FALSE WHERE id = $1 AND pendiente_aprobacion = TRUE RETURNING id", [id]);
      if (!r.rowCount) return res.status(404).json({ ok: false, mensaje: "Usuario no encontrado o ya aprobado." });
    } else {
      const r = await pool.query(
        "UPDATE usuarios SET pendiente_aprobacion = FALSE, activo = FALSE WHERE id = $1 AND pendiente_aprobacion = TRUE RETURNING id", [id]);
      if (!r.rowCount) return res.status(404).json({ ok: false, mensaje: "Usuario no encontrado o ya procesado." });
    }
    await auditar(pool, req.user.id, aprobar ? 'aprobar_usuario' : 'rechazar_usuario', 'usuarios', id, null);
    res.json({ ok: true, mensaje: aprobar ? "Usuario aprobado." : "Usuario rechazado." });
  } catch (err) {
    console.error("[admin/usuarios/aprobar]", err.message);
    res.status(500).json({ ok: false, mensaje: "Error al procesar la aprobación." });
  }
});

/* Usuarios pendientes de aprobación (para la tarjeta del dueño) */
app.get("/api/admin/usuarios/pendientes", requireAuth, requireRole("dueno"), async (req, res) => {
  try {
    const r = await pool.query(`
      SELECT u.id, u.username, u.nombre, u.rol, u.telefono, u.creado_en, c.nombre AS creado_por_nombre
      FROM usuarios u LEFT JOIN usuarios c ON c.id = u.creado_por
      WHERE u.pendiente_aprobacion = TRUE AND u.activo = TRUE
      ORDER BY u.creado_en`);
    res.json({ ok: true, pendientes: r.rows });
  } catch (err) {
    console.error("[admin/usuarios/pendientes]", err.message);
    res.status(500).json({ ok: false, mensaje: "Error al listar los usuarios pendientes." });
  }
});

/* ════════════════════════════════════════════
   RUTAS MENSUALES
   Administración arma la ruta de cada supervisor para el mes.
════════════════════════════════════════════ */
app.get("/api/admin/rutas", requireAuth, requireRole("admin","dueno"), async (req, res) => {
  const { mes, supervisor_id } = req.query;
  if (!mes || !/^\d{4}-\d{2}$/.test(mes)) return res.status(400).json({ ok: false, mensaje: "Indicá el mes en formato YYYY-MM." });
  try {
    let query = `
      SELECT rv.id, rv.supervisor_id, rv.objetivo_id, rv.fecha, rv.orden, rv.nota,
             rv.ronda_id, o.nombre AS objetivo_nombre, u.nombre AS supervisor_nombre
      FROM rutas_visitas rv
      JOIN objetivos o ON o.id = rv.objetivo_id
      JOIN usuarios u ON u.id = rv.supervisor_id
      WHERE rv.fecha >= $1::date AND rv.fecha < ($1::date + INTERVAL '1 month')`;
    const params = [`${mes}-01`];
    if (supervisor_id && isPositiveInt(supervisor_id)) {
      query += ` AND rv.supervisor_id = $2`;
      params.push(parseInt(supervisor_id));
    }
    query += " ORDER BY rv.fecha, rv.orden";
    const r = await pool.query(query, params);
    res.json({ ok: true, visitas: r.rows });
  } catch (err) {
    console.error("[admin/rutas]", err.message);
    res.status(500).json({ ok: false, mensaje: "Error al consultar las rutas." });
  }
});

app.post("/api/admin/rutas", requireAuth, requireRole("admin"), async (req, res) => {
  const { supervisor_id, objetivo_id, fecha, orden, nota } = req.body;
  if (!isPositiveInt(supervisor_id)) return res.status(400).json({ ok: false, mensaje: "supervisor_id inválido." });
  if (!isPositiveInt(objetivo_id)) return res.status(400).json({ ok: false, mensaje: "objetivo_id inválido." });
  if (!fecha || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return res.status(400).json({ ok: false, mensaje: "Fecha inválida (YYYY-MM-DD)." });
  try {
    const r = await pool.query(
      `INSERT INTO rutas_visitas (supervisor_id, objetivo_id, fecha, orden, nota, creado_por)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
      [parseInt(supervisor_id), parseInt(objetivo_id), fecha, orden || 0, nota?.trim() || null, req.user.id]);
    await auditar(pool, req.user.id, 'crear', 'rutas_visitas', r.rows[0].id, { supervisor_id, objetivo_id, fecha });
    res.status(201).json({ ok: true, id: r.rows[0].id, mensaje: "Visita agregada a la ruta." });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ ok: false, mensaje: "Ese supervisor ya tiene esa visita ese día." });
    console.error("[admin/rutas/crear]", err.message);
    res.status(500).json({ ok: false, mensaje: "Error al crear la visita." });
  }
});

app.delete("/api/admin/rutas/:id", requireAuth, requireRole("admin"), async (req, res) => {
  const id = parseInt(req.params.id);
  if (!isPositiveInt(id)) return res.status(400).json({ ok: false, mensaje: "ID inválido." });
  try {
    const r = await pool.query("DELETE FROM rutas_visitas WHERE id = $1 AND ronda_id IS NULL RETURNING id", [id]);
    if (!r.rowCount) return res.status(404).json({ ok: false, mensaje: "Visita no encontrada o ya fue realizada." });
    await auditar(pool, req.user.id, 'eliminar', 'rutas_visitas', id, null);
    res.json({ ok: true, mensaje: "Visita eliminada de la ruta." });
  } catch (err) {
    console.error("[admin/rutas/eliminar]", err.message);
    res.status(500).json({ ok: false, mensaje: "Error al eliminar la visita." });
  }
});

/* Generar ruta automática: reparte las visitas_meta_mes de cada objetivo
   elegido entre los días hábiles del mes, desfasando los objetivos para
   no amontonarlos el mismo día. ON CONFLICT DO NOTHING. */
app.post("/api/admin/rutas/generar", requireAuth, requireRole("admin"), async (req, res) => {
  const { mes, supervisor_id, objetivo_ids } = req.body;
  if (!mes || !/^\d{4}-\d{2}$/.test(mes)) return res.status(400).json({ ok: false, mensaje: "Mes inválido (YYYY-MM)." });
  if (!isPositiveInt(supervisor_id)) return res.status(400).json({ ok: false, mensaje: "supervisor_id inválido." });
  if (!Array.isArray(objetivo_ids) || objetivo_ids.length === 0) return res.status(400).json({ ok: false, mensaje: "Seleccioná al menos un objetivo." });
  const [anio, mesNum] = mes.split('-').map(Number);
  const hoy = new Date();
  const esMesCorriente = anio === hoy.getFullYear() && mesNum === (hoy.getMonth() + 1);
  const dias = diasHabiles(anio, mesNum, esMesCorriente);
  if (dias.length === 0) return res.status(400).json({ ok: false, mensaje: "No hay días hábiles disponibles en ese mes." });
  try {
    const objs = await pool.query(
      "SELECT id, visitas_meta_mes FROM objetivos WHERE id = ANY($1) AND activo = TRUE",
      [objetivo_ids.map(Number)]);
    if (!objs.rowCount) return res.status(400).json({ ok: false, mensaje: "Ninguno de los objetivos es válido." });
    let creadas = 0;
    let offset = 0;
    for (const obj of objs.rows) {
      const meta = obj.visitas_meta_mes || 0;
      if (meta === 0) continue;
      const cant = Math.min(meta, dias.length);
      const intervalo = dias.length / cant;
      for (let i = 0; i < cant; i++) {
        const diaIdx = Math.floor((i * intervalo + offset) % dias.length);
        const dia = dias[diaIdx];
        const fecha = `${anio}-${String(mesNum).padStart(2,'0')}-${String(dia).padStart(2,'0')}`;
        const r = await pool.query(
          `INSERT INTO rutas_visitas (supervisor_id, objetivo_id, fecha, orden, creado_por)
           VALUES ($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING RETURNING id`,
          [parseInt(supervisor_id), obj.id, fecha, i, req.user.id]);
        if (r.rowCount) creadas++;
      }
      offset += Math.max(1, Math.floor(dias.length / objs.rows.length));
    }
    await auditar(pool, req.user.id, 'generar_ruta', 'rutas_visitas', null,
      { mes, supervisor_id, objetivos: objetivo_ids.length, creadas });
    res.status(201).json({ ok: true, creadas, mensaje: `Se generaron ${creadas} visitas.` });
  } catch (err) {
    console.error("[admin/rutas/generar]", err.message);
    res.status(500).json({ ok: false, mensaje: "Error al generar la ruta." });
  }
});

/* ════════════════════════════════════════════
   GET /api/mi-ruta — ruta del día para el supervisor
   Query: ?fecha=YYYY-MM-DD (por defecto hoy)
════════════════════════════════════════════ */
app.get("/api/mi-ruta", requireAuth, requireRole("supervisor"), async (req, res) => {
  const fecha = req.query.fecha || new Date().toISOString().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return res.status(400).json({ ok: false, mensaje: "Fecha inválida." });
  try {
    const r = await pool.query(`
      SELECT rv.id, rv.objetivo_id, rv.fecha, rv.orden, rv.nota, rv.ronda_id,
             o.nombre AS objetivo_nombre, o.tipo, o.subtipo, o.direccion,
             o.lat, o.lng, o.radio_geocerca_m
      FROM rutas_visitas rv
      JOIN objetivos o ON o.id = rv.objetivo_id
      WHERE rv.supervisor_id = $1 AND rv.fecha = $2
      ORDER BY rv.orden`, [req.user.id, fecha]);
    res.json({ ok: true, fecha, visitas: r.rows });
  } catch (err) {
    console.error("[mi-ruta]", err.message);
    res.status(500).json({ ok: false, mensaje: "Error al consultar tu ruta." });
  }
});

/* ════════════════════════════════════════════
   GET / — Health check (pública)
════════════════════════════════════════════ */
app.get("/", (req, res) => {
  res.json({
    ok:      true,
    sistema: `${process.env.SYSTEM_NAME || "Argentina Seguridad Integral"} — API v4.0`,
    estado:  "Servidor activo",
    endpoints: [
      "POST  /api/login",
      "GET   /api/inicializar              [auth]",
      "POST  /api/rondas                   [supervisor]",
      "GET   /api/vigilador/:legajo        [supervisor]",
      "GET   /api/mi-ruta                  [supervisor]",
      "GET   /api/tickets                  [admin, dueno]",
      "PATCH /api/tickets/:id/resolver     [admin]",
      "GET   /api/kpis                     [admin, dueno]",
      "GET   /api/kpis/historico           [admin, dueno]",
      "GET   /api/actividad               [admin, dueno]",
      "GET   /api/actas/:codigo            [admin, dueno]",
      "GET   /api/cuenta/clave             [auth]",
      "POST  /api/cuenta/clave             [auth]",
      "GET   /api/solicitudes-clave        [dueno]",
      "PATCH /api/solicitudes-clave/:id    [dueno]",
      "--- Administración ---",
      "GET|POST       /api/admin/objetivos         [admin, dueno]",
      "PATCH          /api/admin/objetivos/:id      [admin]",
      "PATCH          /api/admin/objetivos/:id/baja|reactivar [admin]",
      "GET|POST       /api/admin/vigiladores        [admin, dueno]",
      "PATCH          /api/admin/vigiladores/:id     [admin]",
      "GET|POST       /api/admin/vigiladores/:id/sanciones [admin]",
      "GET|POST       /api/admin/vigiladores/:id/historial [admin]",
      "PATCH          /api/admin/sanciones/:id       [admin]",
      "PATCH          /api/admin/historial/:id       [admin]",
      "GET|POST|DEL   /api/admin/checklist/:oid      [admin]",
      "GET|POST       /api/admin/observaciones       [admin]",
      "PATCH          /api/admin/observaciones/:id   [admin]",
      "GET|POST       /api/admin/usuarios            [admin, dueno]",
      "PATCH          /api/admin/usuarios/:id        [admin, dueno]",
      "POST           /api/admin/usuarios/:id/blanqueo [admin]",
      "PATCH          /api/admin/usuarios/aprobar/:id [dueno]",
      "GET            /api/admin/usuarios/pendientes  [dueno]",
      "GET|POST|DEL   /api/admin/rutas               [admin]",
      "POST           /api/admin/rutas/generar       [admin]",
    ],
  });
});

/* ════════════════════════════════════════════
   MANEJO GLOBAL DE ERRORES
════════════════════════════════════════════ */
app.use((err, req, res, _next) => {
  console.error("[error global]", err.message);
  res.status(500).json({ ok: false, mensaje: "Error interno del servidor." });
});

/* ════════════════════════════════════════════
   INICIO
════════════════════════════════════════════ */
app.listen(PORT, () => {
  console.log(`\n🚀 Servidor ASI v4.0 — http://localhost:${PORT}`);
  console.log(`🔐 JWT 8h · Rate limiting activo · CORS restringido`);
  console.log(`📋 Checklist configurable · Evidencia fotográfica · Administración completa\n`);
});

