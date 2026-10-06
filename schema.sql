-- ═══════════════════════════════════════════════════════════════
-- ASI — Argentina Seguridad Integral
-- Schema completo según PRD 1 (Panel de Supervisión) · rev. 22/04/2026
-- Idempotente: se puede volver a ejecutar sin duplicar datos.
-- Estructura + configuración del negocio (checklist, observaciones).
--   Producción:  psql <url> -f schema.sql
--   Desarrollo:  psql asi -f schema.sql && psql asi -f seed_demo.sql
-- ═══════════════════════════════════════════════════════════════

/* Hora argentina por defecto en esta base: las columnas son TIMESTAMP sin zona,
   así que NOW() y las consultas a mano tienen que interpretarse en hora local
   aunque el servidor en la nube corra en UTC. server.js además fija la zona en
   cada conexión; esto cubre psql y cualquier otra herramienta. */
DO $$ BEGIN
  EXECUTE format('ALTER DATABASE %I SET timezone TO %L', current_database(), 'America/Argentina/Buenos_Aires');
EXCEPTION WHEN insufficient_privilege THEN
  RAISE NOTICE 'Sin permiso para fijar la zona horaria de la base; server.js la fija por conexión.';
END $$;
SET timezone TO 'America/Argentina/Buenos_Aires';

/* ─────────────────────────────────────────────
   USUARIOS
───────────────────────────────────────────── */
CREATE TABLE IF NOT EXISTS usuarios (
  id            SERIAL PRIMARY KEY,
  username      TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  nombre        TEXT NOT NULL,
  rol           TEXT NOT NULL CHECK (rol IN ('supervisor','admin','dueno')),
  activo        BOOLEAN NOT NULL DEFAULT TRUE
);

/* ─────────────────────────────────────────────
   PEDIDOS DE CAMBIO DE CONTRASEÑA
   Cada usuario pide su propia clave nueva; no se aplica hasta que el dueño
   la aprueba. Se guarda ya hasheada: el dueño nunca ve la contraseña.
   Solo puede haber un pedido pendiente por usuario (índice parcial).
───────────────────────────────────────────── */
CREATE TABLE IF NOT EXISTS solicitudes_clave (
  id             SERIAL PRIMARY KEY,
  usuario_id     INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  password_hash  TEXT NOT NULL,
  estado         TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente','aprobada','rechazada','cancelada')),
  creada_en      TIMESTAMP NOT NULL DEFAULT NOW(),
  resuelta_en    TIMESTAMP,
  resuelta_por   INTEGER REFERENCES usuarios(id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_solicitudes_clave_pendiente
  ON solicitudes_clave(usuario_id) WHERE estado = 'pendiente';

/* ─────────────────────────────────────────────
   OBJETIVOS
   subtipo → PRD §6 (define qué checklist aplica)
───────────────────────────────────────────── */
CREATE TABLE IF NOT EXISTS objetivos (
  id                SERIAL PRIMARY KEY,
  nombre            TEXT NOT NULL,
  tipo              TEXT NOT NULL,
  direccion         TEXT,
  lat               DOUBLE PRECISION,
  lng               DOUBLE PRECISION,
  radio_geocerca_m  INTEGER DEFAULT 150,
  visitas_meta_mes  INTEGER DEFAULT 0,
  activo            BOOLEAN NOT NULL DEFAULT TRUE
);

ALTER TABLE objetivos ADD COLUMN IF NOT EXISTS subtipo TEXT DEFAULT 'barrio_unipersonal';
ALTER TABLE objetivos ADD COLUMN IF NOT EXISTS modalidad TEXT DEFAULT 'unipersonal';

DO $$ BEGIN
  ALTER TABLE objetivos ADD CONSTRAINT objetivos_nombre_key UNIQUE (nombre);
EXCEPTION WHEN duplicate_table OR duplicate_object OR unique_violation THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE objetivos ADD CONSTRAINT objetivos_tipo_check CHECK (tipo IN ('Barrios','Industrias','Locales'));
EXCEPTION WHEN duplicate_table OR duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE objetivos ADD CONSTRAINT objetivos_subtipo_check
    CHECK (subtipo IN ('barrio_multipuesto','barrio_unipersonal','local_comercial','industria','empresa_oficinas'));
EXCEPTION WHEN duplicate_table OR duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE objetivos ADD CONSTRAINT objetivos_modalidad_check CHECK (modalidad IN ('unipersonal','multipuesto'));
EXCEPTION WHEN duplicate_table OR duplicate_object THEN NULL;
END $$;

/* ─────────────────────────────────────────────
   VIGILADORES — perfil completo PRD §9
───────────────────────────────────────────── */
CREATE TABLE IF NOT EXISTS vigiladores (
  id                 SERIAL PRIMARY KEY,
  legajo             INTEGER UNIQUE NOT NULL,
  nombre             TEXT NOT NULL,
  dni                TEXT,
  puesto             TEXT,
  credencial_numero  TEXT,
  credencial_venc    DATE,
  es_chofer          BOOLEAN DEFAULT FALSE,
  licencia_cat       TEXT,
  licencia_venc      DATE,
  armado             BOOLEAN DEFAULT FALSE,
  estado             TEXT NOT NULL DEFAULT 'activo'
);

ALTER TABLE vigiladores ADD COLUMN IF NOT EXISTS telefono             TEXT;
ALTER TABLE vigiladores ADD COLUMN IF NOT EXISTS domicilio            TEXT;
ALTER TABLE vigiladores ADD COLUMN IF NOT EXISTS fecha_nacimiento     DATE;
ALTER TABLE vigiladores ADD COLUMN IF NOT EXISTS nacionalidad         TEXT DEFAULT 'Argentina';
ALTER TABLE vigiladores ADD COLUMN IF NOT EXISTS convenio             TEXT DEFAULT 'UPSRA';
ALTER TABLE vigiladores ADD COLUMN IF NOT EXISTS tiene_radio          BOOLEAN DEFAULT FALSE;
ALTER TABLE vigiladores ADD COLUMN IF NOT EXISTS objetivo_asignado_id INTEGER REFERENCES objetivos(id);
ALTER TABLE vigiladores ADD COLUMN IF NOT EXISTS foto_url             TEXT;

DO $$ BEGIN
  ALTER TABLE vigiladores ADD CONSTRAINT vigiladores_estado_check CHECK (estado IN ('activo','suspendido'));
EXCEPTION WHEN duplicate_table OR duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_vigiladores_objetivo_asignado ON vigiladores(objetivo_asignado_id);

/* ─────────────────────────────────────────────
   HISTORIAL Y SANCIONES DEL VIGILADOR
───────────────────────────────────────────── */
CREATE TABLE IF NOT EXISTS historial_vigiladores (
  id            SERIAL PRIMARY KEY,
  vigilador_id  INTEGER NOT NULL REFERENCES vigiladores(id),
  tipo          TEXT NOT NULL,
  descripcion   TEXT,
  fecha         TIMESTAMP NOT NULL DEFAULT NOW()
);

DO $$ BEGIN
  ALTER TABLE historial_vigiladores ADD CONSTRAINT historial_vigiladores_tipo_check CHECK (tipo IN ('Acta','Sanción'));
EXCEPTION WHEN duplicate_table OR duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_historial_vigilador ON historial_vigiladores(vigilador_id);

CREATE TABLE IF NOT EXISTS sanciones (
  id            SERIAL PRIMARY KEY,
  vigilador_id  INTEGER NOT NULL REFERENCES vigiladores(id),
  descripcion   TEXT NOT NULL,
  estado        TEXT NOT NULL DEFAULT 'activa' CHECK (estado IN ('activa','cumplida','apelada')),
  fecha         DATE NOT NULL DEFAULT CURRENT_DATE
);

CREATE INDEX IF NOT EXISTS idx_sanciones_vigilador ON sanciones(vigilador_id);

/* ─────────────────────────────────────────────
   CHECKLIST CONFIGURABLE — PRD §3.3
   Secciones fijas + ítems filtrados por subtipo de objetivo
───────────────────────────────────────────── */
CREATE TABLE IF NOT EXISTS checklist_secciones (
  id      SERIAL PRIMARY KEY,
  clave   TEXT UNIQUE NOT NULL,
  nombre  TEXT NOT NULL,
  color   TEXT NOT NULL,
  orden   INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS checklist_items (
  id                SERIAL PRIMARY KEY,
  seccion_id        INTEGER NOT NULL REFERENCES checklist_secciones(id),
  titulo_corto      TEXT NOT NULL,
  criterio_completo TEXT NOT NULL,
  area_responsable  TEXT NOT NULL,
  tipos_objetivo    TEXT[] NOT NULL DEFAULT ARRAY['barrio_multipuesto','barrio_unipersonal','local_comercial','industria','empresa_oficinas'],
  orden             INTEGER NOT NULL DEFAULT 0,
  activo            BOOLEAN NOT NULL DEFAULT TRUE
);

DO $$ BEGIN
  ALTER TABLE checklist_items ADD CONSTRAINT checklist_items_titulo_key UNIQUE (titulo_corto);
EXCEPTION WHEN duplicate_table OR duplicate_object OR unique_violation THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_checklist_items_seccion ON checklist_items(seccion_id);

/* ─────────────────────────────────────────────
   AJUSTES DEL CHECKLIST POR OBJETIVO
   Modelo plantilla + excepciones:
     · checklist_items.tipos_objetivo define la PLANTILLA BASE por tipo
     · esta tabla guarda solo las DIFERENCIAS de un objetivo puntual
         incluido = FALSE → el objetivo no evalúa un ítem de su plantilla
         incluido = TRUE  → el objetivo suma un ítem que su plantilla no trae
     · un ítem con tipos_objetivo = '{}' no pertenece a ninguna plantilla:
       es exclusivo de los objetivos que lo incluyan explícitamente
───────────────────────────────────────────── */
CREATE TABLE IF NOT EXISTS objetivo_checklist (
  id          SERIAL PRIMARY KEY,
  objetivo_id INTEGER NOT NULL REFERENCES objetivos(id) ON DELETE CASCADE,
  item_id     INTEGER NOT NULL REFERENCES checklist_items(id) ON DELETE CASCADE,
  incluido    BOOLEAN NOT NULL,
  nota        TEXT,
  UNIQUE (objetivo_id, item_id)
);

/* ─────────────────────────────────────────────
   CATÁLOGO DE OBSERVACIONES PREDEFINIDAS — PRD §4.1
───────────────────────────────────────────── */
CREATE TABLE IF NOT EXISTS observaciones_catalogo (
  id     SERIAL PRIMARY KEY,
  area   TEXT NOT NULL,
  texto  TEXT NOT NULL
);

DO $$ BEGIN
  ALTER TABLE observaciones_catalogo ADD CONSTRAINT observaciones_texto_key UNIQUE (texto);
EXCEPTION WHEN duplicate_table OR duplicate_object OR unique_violation THEN NULL;
END $$;

/* ─────────────────────────────────────────────
   ACTAS DE RONDA
───────────────────────────────────────────── */
CREATE TABLE IF NOT EXISTS rondas_actas (
  id                    SERIAL PRIMARY KEY,
  codigo_acta           TEXT,
  supervisor_id         INTEGER NOT NULL REFERENCES usuarios(id),
  objetivo_id           INTEGER NOT NULL REFERENCES objetivos(id),
  tipo                  TEXT NOT NULL CHECK (tipo IN ('presencial','remota')),
  en_geocerca           BOOLEAN DEFAULT FALSE,
  lat                   DOUBLE PRECISION,
  lng                   DOUBLE PRECISION,
  justificacion_fuera   TEXT,
  sincronizado_offline  BOOLEAN DEFAULT FALSE,
  fecha_hora            TIMESTAMP NOT NULL DEFAULT NOW()
);

ALTER TABLE rondas_actas ADD COLUMN IF NOT EXISTS hora_inicio TIMESTAMP;
ALTER TABLE rondas_actas ADD COLUMN IF NOT EXISTS hora_fin    TIMESTAMP;

-- Evidencia del geocerco: `en_geocerca` lo calcula el servidor (no el dispositivo),
-- y estas dos columnas guardan el margen con el que se tomó esa decisión para que
-- el acta sea auditable — "confirmado a 47 m con ±12 m de precisión", no un booleano.
ALTER TABLE rondas_actas ADD COLUMN IF NOT EXISTS distancia_geocerca_m INTEGER;
ALTER TABLE rondas_actas ADD COLUMN IF NOT EXISTS precision_gps_m      DOUBLE PRECISION;

DO $$ BEGIN
  ALTER TABLE rondas_actas ADD CONSTRAINT rondas_actas_codigo_key UNIQUE (codigo_acta);
EXCEPTION WHEN duplicate_table OR duplicate_object OR unique_violation THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_rondas_supervisor ON rondas_actas(supervisor_id);
CREATE INDEX IF NOT EXISTS idx_rondas_objetivo   ON rondas_actas(objetivo_id);
CREATE INDEX IF NOT EXISTS idx_rondas_fecha_hora  ON rondas_actas(fecha_hora);

CREATE TABLE IF NOT EXISTS ronda_vigiladores (
  id            SERIAL PRIMARY KEY,
  ronda_id      INTEGER NOT NULL REFERENCES rondas_actas(id),
  vigilador_id  INTEGER NOT NULL REFERENCES vigiladores(id),
  firma_base64  TEXT,
  nego_firmar   BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS checklist_respuestas (
  id                  SERIAL PRIMARY KEY,
  ronda_id            INTEGER NOT NULL REFERENCES rondas_actas(id),
  item_id             INTEGER,
  pregunta_texto      TEXT,
  valoracion          TEXT,
  observacion_pred    TEXT,
  observacion_libre   TEXT
);

-- Agregadas por separado (no en el CREATE TABLE) para que apliquen retroactivamente
-- en bases donde la tabla ya existía sin estas constraints.
DO $$ BEGIN
  ALTER TABLE checklist_respuestas
    ADD CONSTRAINT checklist_respuestas_item_fk
    FOREIGN KEY (item_id) REFERENCES checklist_items(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_table OR duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE checklist_respuestas
    ADD CONSTRAINT checklist_respuestas_valoracion_check CHECK (valoracion IN ('B','R','M'));
EXCEPTION WHEN duplicate_table OR duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_checklist_respuestas_ronda ON checklist_respuestas(ronda_id);

/* ─────────────────────────────────────────────
   EVIDENCIA FOTOGRÁFICA — PRD §8 paso 5
───────────────────────────────────────────── */
CREATE TABLE IF NOT EXISTS evidencias_fotos (
  id            SERIAL PRIMARY KEY,
  ronda_id      INTEGER NOT NULL REFERENCES rondas_actas(id),
  imagen_base64 TEXT NOT NULL,
  lat           DOUBLE PRECISION,
  lng           DOUBLE PRECISION,
  tomada_en     TIMESTAMP NOT NULL DEFAULT NOW()
);
ALTER TABLE evidencias_fotos ADD COLUMN IF NOT EXISTS checklist_item_id INTEGER;
DO $$ BEGIN
  ALTER TABLE evidencias_fotos
    ADD CONSTRAINT evidencias_fotos_checklist_item_fk
    FOREIGN KEY (checklist_item_id) REFERENCES checklist_items(id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

/* ─────────────────────────────────────────────
   TICKETS DE INCIDENCIA — PRD §4.2
───────────────────────────────────────────── */
CREATE TABLE IF NOT EXISTS tickets_incidencias (
  id                SERIAL PRIMARY KEY,
  codigo_ticket     TEXT,
  ronda_id          INTEGER NOT NULL REFERENCES rondas_actas(id),
  area_responsable  TEXT NOT NULL DEFAULT 'Operaciones',
  categoria         TEXT NOT NULL DEFAULT 'General',
  descripcion       TEXT NOT NULL,
  estado            TEXT NOT NULL DEFAULT 'ABIERTO' CHECK (estado IN ('ABIERTO','RESUELTO')),
  resolucion        TEXT,
  resuelto_por      INTEGER REFERENCES usuarios(id),
  fecha_creacion    TIMESTAMP NOT NULL DEFAULT NOW(),
  fecha_resolucion  TIMESTAMP
);

ALTER TABLE tickets_incidencias ADD COLUMN IF NOT EXISTS checklist_item_id INTEGER;
ALTER TABLE tickets_incidencias ADD COLUMN IF NOT EXISTS item_titulo       TEXT;
ALTER TABLE tickets_incidencias ADD COLUMN IF NOT EXISTS valoracion        TEXT;
ALTER TABLE tickets_incidencias ADD COLUMN IF NOT EXISTS vigilador_id      INTEGER REFERENCES vigiladores(id);

-- Constraints agregadas por separado (no en el ADD COLUMN) para que apliquen
-- retroactivamente en bases ya existentes donde la columna se creó antes sin ellas.
DO $$ BEGIN
  ALTER TABLE tickets_incidencias
    ADD CONSTRAINT tickets_incidencias_checklist_item_fk
    FOREIGN KEY (checklist_item_id) REFERENCES checklist_items(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_table OR duplicate_object THEN NULL;
END $$;

-- Un ticket solo se genera para respuestas problemáticas (R=regular, M=malo);
-- 'B' (bien) nunca produce un ticket, coincide con la validación de server.js.
DO $$ BEGIN
  ALTER TABLE tickets_incidencias
    ADD CONSTRAINT tickets_incidencias_valoracion_check CHECK (valoracion IN ('R','M'));
EXCEPTION WHEN duplicate_table OR duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE tickets_incidencias ADD CONSTRAINT tickets_incidencias_codigo_key UNIQUE (codigo_ticket);
EXCEPTION WHEN duplicate_table OR duplicate_object OR unique_violation THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_tickets_estado     ON tickets_incidencias(estado);
CREATE INDEX IF NOT EXISTS idx_tickets_ronda       ON tickets_incidencias(ronda_id);
CREATE INDEX IF NOT EXISTS idx_tickets_vigilador   ON tickets_incidencias(vigilador_id);

/* ─────────────────────────────────────────────
   ADMINISTRACIÓN DESDE EL PANEL
   Administración (Lucía) da de alta, edita y da de baja los datos del sistema.
   "Baja" = activo FALSE: desaparece de la app y de los listados, pero las actas
   viejas siguen mostrando a qué objetivo/vigilador correspondían.
───────────────────────────────────────────── */
ALTER TABLE vigiladores            ADD COLUMN IF NOT EXISTS activo BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE historial_vigiladores  ADD COLUMN IF NOT EXISTS activo BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE sanciones              ADD COLUMN IF NOT EXISTS activo BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE observaciones_catalogo ADD COLUMN IF NOT EXISTS activo BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE objetivos              ADD COLUMN IF NOT EXISTS notas  TEXT;

/* Usuarios creados por Administración: no pueden ingresar hasta que el dueño los aprueba */
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS pendiente_aprobacion BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS telefono             TEXT;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS creado_por           INTEGER REFERENCES usuarios(id);
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS creado_en            TIMESTAMP DEFAULT NOW();

/* Blanqueo de contraseña pedido por Administración para otro usuario: usa el mismo
   circuito de aprobación del dueño; solicitada_por distingue quién lo pidió. */
ALTER TABLE solicitudes_clave ADD COLUMN IF NOT EXISTS solicitada_por INTEGER REFERENCES usuarios(id);

/* ─────────────────────────────────────────────
   RUTAS MENSUALES
   Qué objetivo visita cada supervisor y qué día. La arma Administración; el
   supervisor la ve como "Tu ruta de hoy". Al guardar el acta de ese objetivo
   ese día, la visita queda vinculada a la ronda (ronda_id) = realizada.
───────────────────────────────────────────── */
CREATE TABLE IF NOT EXISTS rutas_visitas (
  id             SERIAL PRIMARY KEY,
  supervisor_id  INTEGER NOT NULL REFERENCES usuarios(id),
  objetivo_id    INTEGER NOT NULL REFERENCES objetivos(id),
  fecha          DATE NOT NULL,
  orden          INTEGER NOT NULL DEFAULT 0,
  nota           TEXT,
  ronda_id       INTEGER REFERENCES rondas_actas(id),
  creado_por     INTEGER REFERENCES usuarios(id),
  creado_en      TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (supervisor_id, objetivo_id, fecha)
);
CREATE INDEX IF NOT EXISTS idx_rutas_fecha            ON rutas_visitas(fecha);
CREATE INDEX IF NOT EXISTS idx_rutas_supervisor_fecha ON rutas_visitas(supervisor_id, fecha);

/* ─────────────────────────────────────────────
   AUDITORÍA — quién cambió qué y cuándo (altas, ediciones, bajas, aprobaciones)
───────────────────────────────────────────── */
CREATE TABLE IF NOT EXISTS auditoria (
  id          SERIAL PRIMARY KEY,
  usuario_id  INTEGER REFERENCES usuarios(id),
  accion      TEXT NOT NULL,
  entidad     TEXT NOT NULL,
  entidad_id  INTEGER,
  detalle     JSONB,
  fecha       TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_auditoria_fecha ON auditoria(fecha DESC);

-- ═══════════════════════════════════════════════════════════════
-- CONFIGURACIÓN DEL NEGOCIO (va también a producción)
-- Checklist relevado con el cliente y catálogo de observaciones.
-- Los datos de prueba (usuarios demo, objetivos, vigiladores, historial)
-- viven aparte en seed_demo.sql y NO se cargan en producción.
-- ═══════════════════════════════════════════════════════════════

/* Secciones del checklist — PRD §3.3 */
INSERT INTO checklist_secciones (clave, nombre, color, orden) VALUES
  ('seguridad',  'Elementos de seguridad',      'azul',    1),
  ('habilidades','Comprobación de habilidades', 'verde',   2),
  ('logistica',  'Logística / Infraestructura', 'naranja', 3),
  ('rrhh',       'RRHH / Personal',             'rojo',    4)
ON CONFLICT (clave) DO UPDATE SET nombre = EXCLUDED.nombre, color = EXCLUDED.color, orden = EXCLUDED.orden;

/* Ítems del checklist — título corto + criterio completo (tooltip long-press) */
INSERT INTO checklist_items (seccion_id, titulo_corto, criterio_completo, area_responsable, tipos_objetivo, orden) VALUES
  /* ── Elementos de seguridad ── */
  ((SELECT id FROM checklist_secciones WHERE clave='seguridad'),
   'Uniforme completo',
   'Verificar camisa con identificación de la empresa, pantalón reglamentario, chaleco reflectante y calzado de seguridad en buen estado.',
   'Supervisión', ARRAY['barrio_multipuesto','barrio_unipersonal','local_comercial','industria','empresa_oficinas'], 1),

  ((SELECT id FROM checklist_secciones WHERE clave='seguridad'),
   'Credencial visible y vigente',
   'La credencial habilitante debe estar a la vista, en buen estado y con fecha de vencimiento posterior al día de la inspección.',
   'RRHH', ARRAY['barrio_multipuesto','barrio_unipersonal','local_comercial','industria','empresa_oficinas'], 2),

  ((SELECT id FROM checklist_secciones WHERE clave='seguridad'),
   'Elementos reglamentarios',
   'Linterna con carga suficiente, radio operativa con batería, bastón retráctil y silbato según corresponda al puesto.',
   'Logística', ARRAY['barrio_multipuesto','barrio_unipersonal','industria'], 3),

  ((SELECT id FROM checklist_secciones WHERE clave='seguridad'),
   'Elementos de protección personal',
   'EPP acorde al riesgo del objetivo: guantes, calzado con puntera, casco o chaleco antibalas si el contrato lo requiere.',
   'Logística', ARRAY['industria'], 4),

  /* ── Comprobación de habilidades ── */
  ((SELECT id FROM checklist_secciones WHERE clave='habilidades'),
   'Protocolo de emergencia',
   'El vigilador debe describir correctamente los pasos ante incendio, robo o emergencia médica, y los teléfonos de contacto.',
   'Operaciones', ARRAY['barrio_multipuesto','barrio_unipersonal','local_comercial','industria','empresa_oficinas'], 1),

  ((SELECT id FROM checklist_secciones WHERE clave='habilidades'),
   'Manejo de radio',
   'Verificar que sabe encender, cambiar de canal, emitir y responder comunicaciones usando el código operativo de la empresa.',
   'Operaciones', ARRAY['barrio_multipuesto','barrio_unipersonal','industria'], 2),

  ((SELECT id FROM checklist_secciones WHERE clave='habilidades'),
   'Procedimiento ante intrusión',
   'Debe explicar la secuencia: no confrontar, dar aviso por radio, registrar características y esperar refuerzos policiales.',
   'Operaciones', ARRAY['barrio_multipuesto','barrio_unipersonal','local_comercial','industria','empresa_oficinas'], 3),

  ((SELECT id FROM checklist_secciones WHERE clave='habilidades'),
   'Identificación de zonas de riesgo',
   'Reconoce los puntos ciegos, accesos vulnerables y sectores restringidos del objetivo donde presta servicio.',
   'Operaciones', ARRAY['barrio_multipuesto','industria','empresa_oficinas'], 4),

  ((SELECT id FROM checklist_secciones WHERE clave='habilidades'),
   'Protocolo de control de acceso',
   'Verificar que aplica correctamente el registro de visitas, identificación de proveedores y autorización previa de ingresos.',
   'Operaciones', ARRAY['local_comercial','empresa_oficinas'], 5),

  /* ── Logística / Infraestructura ── */
  ((SELECT id FROM checklist_secciones WHERE clave='logistica'),
   'Estado del móvil',
   'Kilometraje registrado, nivel de combustible, luces, cubiertas y ausencia de daños nuevos en la carrocería.',
   'Logística', ARRAY['barrio_multipuesto','industria'], 1),

  ((SELECT id FROM checklist_secciones WHERE clave='logistica'),
   'Cámaras activas',
   'Todas las cámaras del objetivo deben mostrar imagen en vivo, sin pérdida de señal ni lentes obstruidos.',
   'Mantenimiento', ARRAY['barrio_multipuesto','barrio_unipersonal','local_comercial','industria','empresa_oficinas'], 2),

  ((SELECT id FROM checklist_secciones WHERE clave='logistica'),
   'DVR / NVR operativo',
   'El grabador debe estar encendido, con espacio de almacenamiento disponible y grabando las últimas 24 horas.',
   'Mantenimiento', ARRAY['barrio_multipuesto','barrio_unipersonal','local_comercial','industria','empresa_oficinas'], 3),

  ((SELECT id FROM checklist_secciones WHERE clave='logistica'),
   'Botón de pánico',
   'Probar el disparo del botón de pánico y confirmar recepción de la alarma en la central de monitoreo.',
   'Mantenimiento', ARRAY['barrio_multipuesto','barrio_unipersonal','local_comercial','industria'], 4),

  ((SELECT id FROM checklist_secciones WHERE clave='logistica'),
   'Garitas y portones',
   'Estructura de la garita en condiciones, iluminación perimetral funcionando y portones automáticos operativos.',
   'Mantenimiento', ARRAY['barrio_multipuesto','barrio_unipersonal','industria'], 5),

  /* ── RRHH / Personal ── */
  ((SELECT id FROM checklist_secciones WHERE clave='rrhh'),
   'Puntualidad',
   'Verificar que el vigilador ingresó en el horario pactado y que el relevo del turno anterior se realizó sin demoras.',
   'RRHH', ARRAY['barrio_multipuesto','barrio_unipersonal','local_comercial','industria','empresa_oficinas'], 1),

  ((SELECT id FROM checklist_secciones WHERE clave='rrhh'),
   'Presentación personal',
   'Higiene, afeitado, cabello prolijo y uniforme limpio y planchado acorde a la imagen institucional.',
   'RRHH', ARRAY['barrio_multipuesto','barrio_unipersonal','local_comercial','industria','empresa_oficinas'], 2),

  ((SELECT id FROM checklist_secciones WHERE clave='rrhh'),
   'Estado de alerta',
   'El vigilador debe estar despierto, atento al entorno y sin usar el celular con fines personales durante la guardia.',
   'Supervisión', ARRAY['barrio_multipuesto','barrio_unipersonal','local_comercial','industria','empresa_oficinas'], 3),

  ((SELECT id FROM checklist_secciones WHERE clave='rrhh'),
   'Conducta y trato',
   'Trato cordial y profesional con residentes, clientes y proveedores. Sin conflictos reportados en el turno.',
   'RRHH', ARRAY['barrio_multipuesto','barrio_unipersonal','local_comercial','industria','empresa_oficinas'], 4),

  ((SELECT id FROM checklist_secciones WHERE clave='rrhh'),
   'Comunicación con supervisión',
   'Reportó novedades del turno, respondió a las comunicaciones y completó el libro de guardia correctamente.',
   'Supervisión', ARRAY['barrio_multipuesto','barrio_unipersonal','local_comercial','industria','empresa_oficinas'], 5),

  /* ── Ítems exclusivos de un objetivo (tipos_objetivo vacío = fuera de toda plantilla) ── */
  ((SELECT id FROM checklist_secciones WHERE clave='habilidades'),
   'Registro de visitas y proveedores',
   'El libro digital de visitas debe estar completo: nombre, DNI, empresa, piso de destino y horario de ingreso y egreso.',
   'Operaciones', ARRAY[]::TEXT[], 6),

  ((SELECT id FROM checklist_secciones WHERE clave='logistica'),
   'Control de acceso a cocheras',
   'Verificar que la barrera vehicular responde al control remoto y que se registra la patente de cada vehículo que ingresa.',
   'Mantenimiento', ARRAY[]::TEXT[], 6),

  ((SELECT id FROM checklist_secciones WHERE clave='logistica'),
   'Balanza y control de carga',
   'La balanza de camiones debe estar calibrada y operativa, con registro de pesaje de cada salida de mercadería.',
   'Logística', ARRAY[]::TEXT[], 7)

ON CONFLICT (titulo_corto) DO UPDATE SET
  criterio_completo = EXCLUDED.criterio_completo,
  area_responsable  = EXCLUDED.area_responsable,
  tipos_objetivo    = EXCLUDED.tipos_objetivo,
  orden             = EXCLUDED.orden;

/* Catálogo de observaciones predefinidas — PRD §4.1 */
INSERT INTO observaciones_catalogo (area, texto) VALUES
  ('Logística',     'Sin elementos de protección personal'),
  ('Logística',     'Móvil sin combustible'),
  ('Logística',     'Cámara sin señal'),
  ('Logística',     'DVR apagado'),
  ('Logística',     'Linterna sin carga'),
  ('Logística',     'Radio sin batería'),

  ('Supervisión',   'Ausencia en puesto'),
  ('Supervisión',   'Abandono de guardia'),
  ('Supervisión',   'Uso de celular en horario'),
  ('Supervisión',   'Uniforme incompleto'),
  ('Supervisión',   'Falta de presentación'),

  ('Operaciones',   'No conoce protocolo de emergencia'),
  ('Operaciones',   'No sabe operar la radio'),
  ('Operaciones',   'Desconoce procedimiento de intrusión'),
  ('Operaciones',   'No identifica zona de riesgo'),

  ('RRHH',          'Trato inadecuado'),
  ('RRHH',          'Actitud negligente'),
  ('RRHH',          'Falta de comunicación'),
  ('RRHH',          'Reincidencia en falta ya sancionada'),
  ('RRHH',          'Negativa a firmar el acta de supervisión'),

  ('Mantenimiento', 'Portón automático sin funcionar'),
  ('Mantenimiento', 'Garita en mal estado'),
  ('Mantenimiento', 'Iluminación perimetral apagada'),
  ('Mantenimiento', 'Cerradura forzada')
ON CONFLICT (texto) DO UPDATE SET area = EXCLUDED.area;
