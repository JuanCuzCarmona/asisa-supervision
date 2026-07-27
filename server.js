require("dotenv").config();
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
const REQUIRED_ENV = ["DB_HOST","DB_PORT","DB_NAME","DB_USER","DB_PASSWORD","JWT_SECRET"];
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
const pool = new Pool({
  host:     process.env.DB_HOST,
  port:     parseInt(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
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
  console.log("✅ Conectado a PostgreSQL:", process.env.DB_NAME);
});

/* ════════════════════════════════════════════
   SEGURIDAD — HEADERS, CORS, RATE LIMIT
════════════════════════════════════════════ */

// Headers de seguridad HTTP (X-Frame-Options, CSP, etc.)
app.use(helmet());

// CORS: solo acepta requests del origen configurado o localhost
const ALLOWED_ORIGINS = (process.env.CORS_ORIGIN || "http://localhost:5500")
  .split(",")
  .map(o => o.trim());

app.use(cors({
  origin: (origin, cb) => {
    // Permite requests sin origin (Tailscale directo, curl, móvil, file://)
    if (!origin || origin === "null" || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    cb(new Error("Origen no permitido por CORS"));
  },
  methods:     ["GET","POST","PATCH","OPTIONS"],
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

// Rate limit estricto solo para login: 10 intentos cada 15 minutos
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      10,
  message:  { ok: false, mensaje: "Demasiados intentos de login. Esperá 15 minutos." },
});

// Las evidencias fotográficas viajan en base64 → límite generoso
app.use(express.json({ limit: "25mb" }));

/* ════════════════════════════════════════════
   MIDDLEWARES DE AUTENTICACIÓN Y AUTORIZACIÓN
════════════════════════════════════════════ */

// Verifica que el request tenga un JWT válido
function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ ok: false, mensaje: "Autenticación requerida." });
  }
  try {
    req.user = jwt.verify(header.slice(7), process.env.JWT_SECRET);
    next();
  } catch (err) {
    const msg = err.name === "TokenExpiredError"
      ? "Sesión expirada. Volvé a iniciar sesión."
      : "Token inválido.";
    res.status(401).json({ ok: false, mensaje: msg });
  }
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
const isString      = (v, min = 1) => typeof v === "string" && v.trim().length >= min;

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
      "SELECT id, nombre, rol, password_hash FROM usuarios WHERE username = $1 AND activo = TRUE",
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

      pool.query("SELECT id, area, texto FROM observaciones_catalogo ORDER BY area, texto"),
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
   Body: {
     objetivo_id, tipo, en_geocerca, lat, lng,
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
    en_geocerca,
    lat,
    lng,
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
  if (tipo === "remota" && !isString(justificacion_fuera, 10)) {
    return res.status(400).json({ ok: false, mensaje: "Justificación obligatoria para ronda remota (mínimo 10 caracteres)." });
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
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Código de acta: se genera DESPUÉS de insertar usando el ID (sin race condition)
    const actaResult = await client.query(
      `INSERT INTO rondas_actas
         (supervisor_id, objetivo_id, tipo, en_geocerca, lat, lng,
          justificacion_fuera, sincronizado_offline, hora_inicio, hora_fin)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING id`,
      [
        supervisor_id, objetivo_id, tipo,
        Boolean(en_geocerca),
        lat  || null,
        lng  || null,
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
          item.pregunta   || null,
          item.valoracion || "B",
          item.observacion_pred  || null,
          item.observacion_libre || null,
        ]
      );
    }

    // 4. Evidencia fotográfica con marca de agua GPS (PRD §8 paso 5)
    for (const foto of evidencias) {
      if (!isString(foto.imagen_base64) || !foto.imagen_base64.startsWith("data:image/")) continue;
      await client.query(
        `INSERT INTO evidencias_fotos (ronda_id, imagen_base64, lat, lng)
         VALUES ($1,$2,$3,$4)`,
        [rondaId, foto.imagen_base64, foto.lat || null, foto.lng || null]
      );
    }

    // 5. Tickets — código generado desde el ID (sin race condition)
    const ticketsCreados = [];
    for (const inc of incidencias) {
      if (!isString(inc.descripcion)) continue;

      const ticketResult = await client.query(
        `INSERT INTO tickets_incidencias
           (ronda_id, area_responsable, categoria, descripcion,
            checklist_item_id, item_titulo, valoracion, vigilador_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         RETURNING id`,
        [
          rondaId,
          inc.area_responsable || "Operaciones",
          inc.categoria        || "General",
          inc.descripcion.trim(),
          isPositiveInt(inc.item_id)      ? parseInt(inc.item_id)      : null,
          inc.item_titulo || null,
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
               COUNT(*) FILTER (WHERE fecha_creacion >= NOW() - INTERVAL '48 hours') AS ultimas_48h
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

/* ════════════════════════════════════════════
   GET /api/actividad
   Requiere: admin o dueno
   Últimas rondas registradas — alimenta el feed en vivo.
════════════════════════════════════════════ */
app.get("/api/actividad", requireAuth, requireRole("admin","dueno"), async (req, res) => {
  const limite = Math.min(parseInt(req.query.limite) || 8, 50);
  try {
    const result = await pool.query(`
      SELECT r.id, r.codigo_acta, r.tipo, r.en_geocerca, r.fecha_hora,
             u.nombre AS supervisor,
             o.nombre AS objetivo,
             COUNT(t.id)::int AS tickets
      FROM rondas_actas r
      JOIN usuarios  u ON r.supervisor_id = u.id
      JOIN objetivos o ON r.objetivo_id   = o.id
      LEFT JOIN tickets_incidencias t ON t.ronda_id = r.id
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
         WHERE vigilador_id = $1
         ORDER BY fecha DESC LIMIT 10`,
        [vigId]
      ),
      pool.query(
        `SELECT id, descripcion, estado, fecha
         FROM sanciones
         WHERE vigilador_id = $1
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
   GET / — Health check (pública)
════════════════════════════════════════════ */
app.get("/", (req, res) => {
  res.json({
    ok:      true,
    sistema: "Argentina Seguridad Integral — API v3.0",
    estado:  "Servidor activo",
    endpoints: [
      "POST  /api/login",
      "GET   /api/inicializar          [auth]",
      "POST  /api/rondas               [supervisor]",
      "GET   /api/vigilador/:legajo    [supervisor]",
      "GET   /api/tickets              [admin, dueno]",
      "PATCH /api/tickets/:id/resolver [admin]",
      "GET   /api/kpis                 [admin, dueno]",
      "GET   /api/actividad            [admin, dueno]",
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
  console.log(`\n🚀 Servidor ASI v3.0 — http://localhost:${PORT}`);
  console.log(`🔐 JWT 8h · Rate limiting activo · CORS restringido`);
  console.log(`📋 Checklist configurable · Evidencia fotográfica · Firmas múltiples\n`);
});
