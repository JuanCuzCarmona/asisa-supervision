require("dotenv").config();
const express = require("express");
const cors    = require("cors");
const { Pool } = require("pg");

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "10mb" })); // límite alto para firmas en Base64

/* ── Conexión a PostgreSQL ──────────────────── */
const pool = new Pool({
  host:     process.env.DB_HOST,
  port:     process.env.DB_PORT,
  database: process.env.DB_NAME,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

pool.connect((err, client, release) => {
  if (err) {
    console.error("❌ Error al conectar con la base de datos:", err.message);
  } else {
    release();
    console.log("✅ Conectado a PostgreSQL - Base de datos: argentina_seguridad");
  }
});

/* ════════════════════════════════════════════
   POST /api/login
   Body: { username, password }
   Devuelve: { ok, usuario: { id, nombre, rol } }
════════════════════════════════════════════ */
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ ok: false, mensaje: "Usuario y contraseña requeridos." });
  }

  try {
    const result = await pool.query(
      "SELECT id, nombre, rol FROM usuarios WHERE username = $1 AND password = $2",
      [username, password]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ ok: false, mensaje: "Usuario o contraseña incorrectos." });
    }

    res.json({ ok: true, usuario: result.rows[0] });
  } catch (err) {
    console.error("Error en /api/login:", err.message);
    res.status(500).json({ ok: false, mensaje: "Error interno del servidor." });
  }
});

/* ════════════════════════════════════════════
   GET /api/inicializar
   La app lo llama al iniciar sesión para tener
   los datos cargados localmente (modo offline).
   Devuelve: { objetivos, vigiladores }
════════════════════════════════════════════ */
app.get("/api/inicializar", async (req, res) => {
  try {
    const [objetivos, vigiladores] = await Promise.all([
      pool.query("SELECT * FROM objetivos ORDER BY nombre"),
      pool.query("SELECT * FROM vigiladores WHERE estado = 'Activo' ORDER BY nombre"),
    ]);

    res.json({
      ok: true,
      objetivos:   objetivos.rows,
      vigiladores: vigiladores.rows,
    });
  } catch (err) {
    console.error("Error en /api/inicializar:", err.message);
    res.status(500).json({ ok: false, mensaje: "Error al cargar los datos iniciales." });
  }
});

/* ════════════════════════════════════════════
   POST /api/rondas
   Guarda el acta completa usando una transacción
   (si algo falla, no queda nada a medias).
   Body: {
     supervisor_id, objetivo_id, vigilador_id,
     en_geocerca, justificacion_fuera,
     firma_base64, sincronizado_offline,
     checklist: [{ pregunta, categoria, observacion, foto_evidencia_base64 }],
     incidencias: [{ categoria, descripcion }]
   }
════════════════════════════════════════════ */
app.post("/api/rondas", async (req, res) => {
  const {
    supervisor_id,
    objetivo_id,
    vigilador_id,
    en_geocerca,
    justificacion_fuera,
    firma_base64,
    sincronizado_offline = false,
    checklist   = [],
    incidencias = [],
  } = req.body;

  if (!supervisor_id || !objetivo_id || !vigilador_id) {
    return res.status(400).json({ ok: false, mensaje: "Faltan datos obligatorios del acta." });
  }

  // Generar código único de acta: ACTA-YYYYMMDD-HHMMSS
  const ahora      = new Date();
  const codigoActa = `ACTA-${ahora.getFullYear()}${String(ahora.getMonth()+1).padStart(2,"0")}${String(ahora.getDate()).padStart(2,"0")}-${String(ahora.getHours()).padStart(2,"0")}${String(ahora.getMinutes()).padStart(2,"0")}${String(ahora.getSeconds()).padStart(2,"0")}`;

  const client = await pool.connect(); // cliente para la transacción

  try {
    await client.query("BEGIN");

    // 1. Insertar el acta principal
    const actaResult = await client.query(
      `INSERT INTO rondas_actas
         (codigo_acta, supervisor_id, objetivo_id, vigilador_id,
          en_geocerca, justificacion_fuera, firma_base64, sincronizado_offline)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING id`,
      [codigoActa, supervisor_id, objetivo_id, vigilador_id,
       en_geocerca, justificacion_fuera || null, firma_base64 || null, sincronizado_offline]
    );
    const rondaId = actaResult.rows[0].id;

    // 2. Insertar cada ítem del checklist
    for (const item of checklist) {
      await client.query(
        `INSERT INTO checklist_respuestas (ronda_id, pregunta, categoria, observacion, foto_evidencia_base64)
         VALUES ($1,$2,$3,$4,$5)`,
        [rondaId, item.pregunta, item.categoria, item.observacion || null, item.foto_evidencia_base64 || null]
      );
    }

    // 3. Insertar tickets de incidencias generados
    const ticketsCreados = [];
    for (let i = 0; i < incidencias.length; i++) {
      const inc        = incidencias[i];
      // Código: INC-YYYYMM-XXXX (XXXX = número correlativo del mes)
      const countResult = await client.query(
        "SELECT COUNT(*) FROM tickets_incidencias WHERE fecha_creacion >= date_trunc('month', NOW())"
      );
      const correlativo = String(parseInt(countResult.rows[0].count) + 1 + i).padStart(4, "0");
      const codigoTicket = `INC-${ahora.getFullYear()}${String(ahora.getMonth()+1).padStart(2,"0")}-${correlativo}`;

      const ticketResult = await client.query(
        `INSERT INTO tickets_incidencias (codigo_ticket, ronda_id, categoria, descripcion)
         VALUES ($1,$2,$3,$4)
         RETURNING id, codigo_ticket`,
        [codigoTicket, rondaId, inc.categoria, inc.descripcion]
      );
      ticketsCreados.push(ticketResult.rows[0]);
    }

    await client.query("COMMIT");

    res.status(201).json({
      ok:            true,
      mensaje:       "Acta guardada correctamente.",
      ronda_id:      rondaId,
      codigo_acta:   codigoActa,
      tickets:       ticketsCreados,
    });

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error en /api/rondas (ROLLBACK ejecutado):", err.message);
    res.status(500).json({ ok: false, mensaje: "Error al guardar el acta. Operación revertida." });
  } finally {
    client.release();
  }
});

/* ════════════════════════════════════════════
   GET /api/tickets
   Devuelve todos los tickets con datos del acta.
   Query opcional: ?estado=ABIERTO | RESUELTO
════════════════════════════════════════════ */
app.get("/api/tickets", async (req, res) => {
  const { estado } = req.query;

  try {
    let query = `
      SELECT
        t.id, t.codigo_ticket, t.categoria, t.descripcion,
        t.estado, t.resolucion, t.fecha_creacion, t.fecha_resolucion,
        u.nombre  AS supervisor,
        o.nombre  AS objetivo,
        v.nombre  AS vigilador
      FROM tickets_incidencias t
      JOIN rondas_actas  r ON t.ronda_id      = r.id
      JOIN usuarios      u ON r.supervisor_id = u.id
      JOIN objetivos     o ON r.objetivo_id   = o.id
      JOIN vigiladores   v ON r.vigilador_id  = v.id
    `;
    const params = [];

    if (estado) {
      query += " WHERE t.estado = $1";
      params.push(estado.toUpperCase());
    }

    query += " ORDER BY t.fecha_creacion DESC";

    const result = await pool.query(query, params);
    res.json({ ok: true, tickets: result.rows });
  } catch (err) {
    console.error("Error en GET /api/tickets:", err.message);
    res.status(500).json({ ok: false, mensaje: "Error al obtener los tickets." });
  }
});

/* ════════════════════════════════════════════
   PATCH /api/tickets/:id/resolver
   El Administrador cierra un ticket.
   Body: { resolucion }
════════════════════════════════════════════ */
app.patch("/api/tickets/:id/resolver", async (req, res) => {
  const { id }         = req.params;
  const { resolucion } = req.body;

  if (!resolucion || resolucion.trim().length < 5) {
    return res.status(400).json({ ok: false, mensaje: "La resolución es obligatoria (mínimo 5 caracteres)." });
  }

  try {
    const result = await pool.query(
      `UPDATE tickets_incidencias
       SET estado = 'RESUELTO', resolucion = $1, fecha_resolucion = NOW()
       WHERE id = $2
       RETURNING id, codigo_ticket, estado`,
      [resolucion.trim(), id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ ok: false, mensaje: "Ticket no encontrado." });
    }

    res.json({ ok: true, mensaje: "Ticket cerrado correctamente.", ticket: result.rows[0] });
  } catch (err) {
    console.error("Error en PATCH /api/tickets/:id/resolver:", err.message);
    res.status(500).json({ ok: false, mensaje: "Error al cerrar el ticket." });
  }
});

/* ════════════════════════════════════════════
   GET /api/kpis
   Para el Dashboard del Dueño.
   Devuelve métricas calculadas del mes actual.
════════════════════════════════════════════ */
app.get("/api/kpis", async (req, res) => {
  try {
    const [rondas, ticketsCriticos, ticketsPorCategoria, cumplimientoPorObjetivo] = await Promise.all([

      // Total de rondas del mes actual
      pool.query(`
        SELECT COUNT(*) AS total_rondas
        FROM rondas_actas
        WHERE date_trunc('month', fecha_hora) = date_trunc('month', NOW())
      `),

      // Tickets abiertos con categoría de criticidad
      pool.query(`
        SELECT COUNT(*) AS criticos
        FROM tickets_incidencias
        WHERE estado = 'ABIERTO'
      `),

      // Tickets agrupados por categoría
      pool.query(`
        SELECT categoria, COUNT(*) AS cantidad
        FROM tickets_incidencias
        WHERE estado = 'ABIERTO'
        GROUP BY categoria
        ORDER BY cantidad DESC
      `),

      // Rondas completadas por objetivo este mes
      pool.query(`
        SELECT o.nombre, COUNT(r.id) AS rondas_realizadas
        FROM objetivos o
        LEFT JOIN rondas_actas r
          ON r.objetivo_id = o.id
          AND date_trunc('month', r.fecha_hora) = date_trunc('month', NOW())
        GROUP BY o.id, o.nombre
        ORDER BY o.nombre
      `),
    ]);

    res.json({
      ok: true,
      kpis: {
        total_rondas_mes:       parseInt(rondas.rows[0].total_rondas),
        tickets_criticos:       parseInt(ticketsCriticos.rows[0].criticos),
        tickets_por_categoria:  ticketsPorCategoria.rows,
        cumplimiento_objetivos: cumplimientoPorObjetivo.rows,
      },
    });
  } catch (err) {
    console.error("Error en GET /api/kpis:", err.message);
    res.status(500).json({ ok: false, mensaje: "Error al calcular los KPIs." });
  }
});

/* ── Ruta de salud del servidor ─────────────── */
app.get("/", (req, res) => {
  res.json({
    ok:       true,
    sistema:  "Argentina Seguridad Integral — API v1.0",
    estado:   "Servidor activo",
    endpoints: [
      "POST /api/login",
      "GET  /api/inicializar",
      "POST /api/rondas",
      "GET  /api/tickets",
      "PATCH /api/tickets/:id/resolver",
      "GET  /api/kpis",
    ],
  });
});

/* ── Iniciar servidor ───────────────────────── */
app.listen(PORT, () => {
  console.log(`\n🚀 Servidor ASI corriendo en http://localhost:${PORT}`);
  console.log(`📋 Endpoints disponibles:`);
  console.log(`   POST  http://localhost:${PORT}/api/login`);
  console.log(`   GET   http://localhost:${PORT}/api/inicializar`);
  console.log(`   POST  http://localhost:${PORT}/api/rondas`);
  console.log(`   GET   http://localhost:${PORT}/api/tickets`);
  console.log(`   PATCH http://localhost:${PORT}/api/tickets/:id/resolver`);
  console.log(`   GET   http://localhost:${PORT}/api/kpis\n`);
});
