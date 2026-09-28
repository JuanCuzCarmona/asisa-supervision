-- ═══════════════════════════════════════════════════════════════
-- ASI — Argentina Seguridad Integral
-- Schema completo según PRD 1 (Panel de Supervisión) · rev. 22/04/2026
-- Idempotente: se puede volver a ejecutar sin duplicar datos.
--   psql asi -f schema.sql
-- ═══════════════════════════════════════════════════════════════

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

CREATE TABLE IF NOT EXISTS sanciones (
  id            SERIAL PRIMARY KEY,
  vigilador_id  INTEGER NOT NULL REFERENCES vigiladores(id),
  descripcion   TEXT NOT NULL,
  estado        TEXT NOT NULL DEFAULT 'activa' CHECK (estado IN ('activa','cumplida','apelada')),
  fecha         DATE NOT NULL DEFAULT CURRENT_DATE
);

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
EXCEPTION WHEN duplicate_table OR duplicate_object THEN NULL;
END $$;

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
EXCEPTION WHEN duplicate_table OR duplicate_object THEN NULL;
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

-- ═══════════════════════════════════════════════════════════════
-- SEED
-- ═══════════════════════════════════════════════════════════════

/* Usuarios — un acceso por rol (passwords en README de arranque) */
INSERT INTO usuarios (username, password_hash, nombre, rol) VALUES
  ('supervisor', '$2a$10$RwCbqmT8e2WdrSLCTSTUae0U/h6UYmgN5wHMxy4iaYrIl8cEQ.rxm', 'María González',  'supervisor'),
  ('admin',      '$2a$10$XGjj2BB8W38cwe3yBMoY2esLG/L397qPAEHbnd1CV2gsbTPM5Y/Di', 'Roberto Valente', 'admin'),
  ('dueno',      '$2a$10$REBj9BQ2drqPo4ZvT0gsxeW5jZFGmxVCj4O9zoXMip0TSLbJ4Deqe', 'Gerencia General','dueno')
ON CONFLICT (username) DO NOTHING;

/* Objetivos con subtipo, geocerca y meta mensual */
INSERT INTO objetivos (nombre, tipo, subtipo, modalidad, direccion, lat, lng, radio_geocerca_m, visitas_meta_mes) VALUES
  ('Barrio Privado La Alameda',      'Barrios',    'barrio_multipuesto',  'multipuesto', 'Ruta 8 km 42, Pilar',            -34.4589, -58.9142, 400, 8),
  ('Barrio Privado Los Pinos',       'Barrios',    'barrio_unipersonal',  'unipersonal', 'Av. Los Pinos 1200, Escobar',    -34.3487, -58.7934, 250, 6),
  ('Industria Metalúrgica Del Sur',  'Industrias', 'industria',           'multipuesto', 'Parque Ind. Norte, Malvinas',    -34.5012, -58.7021, 500, 10),
  ('Industria Agroexport SA',        'Industrias', 'industria',           'multipuesto', 'Ruta 9 km 61, Campana',          -34.1634, -58.9591, 500, 6),
  ('Local Comercial Av. Corrientes', 'Locales',    'local_comercial',     'unipersonal', 'Av. Corrientes 2450, CABA',      -34.6037, -58.3968, 120, 12),
  ('Shopping Norte',                 'Locales',    'local_comercial',     'multipuesto', 'Av. Cabildo 3100, CABA',         -34.5567, -58.4614, 200, 8),
  ('Corporativo Torre Madero',       'Locales',    'empresa_oficinas',    'unipersonal', 'Juana Manso 1150, Pto. Madero',  -34.6098, -58.3627, 150, 6),
  ('Barrio Demo Cercano',            'Barrios',    'barrio_unipersonal',  'unipersonal', 'Mendoza, Argentina (ubicación de prueba)', -32.93945, -68.85075, 500, 4)
ON CONFLICT (nombre) DO UPDATE SET
  subtipo          = EXCLUDED.subtipo,
  modalidad        = EXCLUDED.modalidad,
  direccion        = EXCLUDED.direccion,
  lat              = EXCLUDED.lat,
  lng              = EXCLUDED.lng,
  radio_geocerca_m = EXCLUDED.radio_geocerca_m,
  visitas_meta_mes = EXCLUDED.visitas_meta_mes;

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

/* Ajustes del checklist por objetivo — solo las diferencias contra la plantilla */
INSERT INTO objetivo_checklist (objetivo_id, item_id, incluido, nota)
SELECT o.id, i.id, x.incluido, x.nota
FROM (VALUES
  /* Shopping Norte: es un local, pero tiene móvil propio y accesos vehiculares */
  ('Shopping Norte',             'Estado del móvil',                  TRUE,  'El objetivo tiene móvil de ronda asignado'),
  ('Shopping Norte',             'Garitas y portones',                TRUE,  'Accesos vehiculares en subsuelo'),
  ('Shopping Norte',             'Control de acceso a cocheras',      TRUE,  'Cochera de 400 lugares'),

  /* Torre Madero: oficinas premium con recepción y cocheras */
  ('Corporativo Torre Madero',   'Registro de visitas y proveedores', TRUE,  'Exigido por el contrato'),
  ('Corporativo Torre Madero',   'Control de acceso a cocheras',      TRUE,  'Barrera vehicular en Juana Manso'),

  /* Agroexport: planta con balanza de camiones */
  ('Industria Agroexport SA',    'Balanza y control de carga',        TRUE,  'Salida de mercadería a granel'),

  /* Local Corrientes: sin perímetro propio, el botón de pánico lo gestiona el shopping vecino */
  ('Local Comercial Av. Corrientes', 'Botón de pánico',               FALSE, 'Depende del sistema del edificio, no del puesto'),

  /* Los Pinos: barrio chico sin cámaras propias */
  ('Barrio Privado Los Pinos',   'DVR / NVR operativo',               FALSE, 'El monitoreo es externo, no hay grabador en el objetivo')
) AS x(objetivo, item, incluido, nota)
JOIN objetivos       o ON o.nombre       = x.objetivo
JOIN checklist_items i ON i.titulo_corto = x.item
ON CONFLICT (objetivo_id, item_id) DO UPDATE SET
  incluido = EXCLUDED.incluido,
  nota     = EXCLUDED.nota;

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

/* Vigiladores con perfil completo */
INSERT INTO vigiladores
  (legajo, nombre, dni, puesto, credencial_numero, credencial_venc,
   es_chofer, licencia_cat, licencia_venc, armado, estado,
   telefono, domicilio, fecha_nacimiento, nacionalidad, convenio, tiene_radio,
   objetivo_asignado_id)
VALUES
  (1024, 'Carlos Alberto Rodríguez', '28.541.730', 'Vigilador Nocturno B', 'CR-4521-B', '2026-08-15',
   TRUE, 'B2', '2027-03-10', FALSE, 'activo',
   '11-5423-9087', 'Av. Rivadavia 8842, CABA', '1981-04-22', 'Argentina', 'UPSRA', TRUE,
   (SELECT id FROM objetivos WHERE nombre='Barrio Privado La Alameda')),

  (1087, 'Miguel Ángel Sosa', '31.208.446', 'Vigilador Diurno A', 'MS-4890-A', '2026-09-02',
   FALSE, NULL, NULL, FALSE, 'activo',
   '11-6012-3345', 'Belgrano 455, Pilar', '1985-11-08', 'Argentina', 'UPSRA', TRUE,
   (SELECT id FROM objetivos WHERE nombre='Barrio Privado La Alameda')),

  (1153, 'Jorge Luis Benítez', '26.774.219', 'Jefe de Puesto', 'JB-3312-C', '2026-08-04',
   TRUE, 'D1', '2026-08-20', TRUE, 'activo',
   '11-4477-2210', 'San Martín 1290, Escobar', '1978-02-14', 'Argentina', 'UPSRA', TRUE,
   (SELECT id FROM objetivos WHERE nombre='Industria Metalúrgica Del Sur')),

  (1201, 'Néstor Fabián Quiroga', '33.901.556', 'Vigilador Nocturno C', 'NQ-5104-B', '2027-01-30',
   FALSE, NULL, NULL, FALSE, 'suspendido',
   '11-3388-9921', 'Mitre 733, Campana', '1988-07-30', 'Argentina', 'UPSRA', FALSE,
   (SELECT id FROM objetivos WHERE nombre='Local Comercial Av. Corrientes'))

ON CONFLICT (legajo) DO UPDATE SET
  nombre               = EXCLUDED.nombre,
  puesto               = EXCLUDED.puesto,
  credencial_numero    = EXCLUDED.credencial_numero,
  credencial_venc      = EXCLUDED.credencial_venc,
  es_chofer            = EXCLUDED.es_chofer,
  licencia_cat         = EXCLUDED.licencia_cat,
  licencia_venc        = EXCLUDED.licencia_venc,
  armado               = EXCLUDED.armado,
  estado               = EXCLUDED.estado,
  telefono             = EXCLUDED.telefono,
  domicilio            = EXCLUDED.domicilio,
  fecha_nacimiento     = EXCLUDED.fecha_nacimiento,
  nacionalidad         = EXCLUDED.nacionalidad,
  convenio             = EXCLUDED.convenio,
  tiene_radio          = EXCLUDED.tiene_radio,
  objetivo_asignado_id = EXCLUDED.objetivo_asignado_id;

/* Historial y sanciones de ejemplo (solo si están vacíos) */
INSERT INTO historial_vigiladores (vigilador_id, tipo, descripcion, fecha)
SELECT v.id, x.tipo, x.descripcion, x.fecha
FROM vigiladores v
JOIN (VALUES
  (1024, 'Acta',    'Demora de 22 min en inicio de turno',              '2026-05-12'::timestamp),
  (1024, 'Sanción', 'Uniforme incompleto — sin chaleco reflectivo',     '2026-03-08'::timestamp),
  (1024, 'Acta',    'Ausencia sin aviso previo',                        '2025-11-20'::timestamp),
  (1153, 'Acta',    'Observación por libro de guardia incompleto',      '2026-06-02'::timestamp),
  (1201, 'Sanción', 'Abandono de puesto durante el turno noche',        '2026-06-28'::timestamp)
) AS x(legajo, tipo, descripcion, fecha) ON v.legajo = x.legajo
WHERE NOT EXISTS (SELECT 1 FROM historial_vigiladores);

INSERT INTO sanciones (vigilador_id, descripcion, estado, fecha)
SELECT v.id, x.descripcion, x.estado, x.fecha
FROM vigiladores v
JOIN (VALUES
  (1024, 'Apercibimiento escrito por uniforme incompleto', 'cumplida', '2026-03-10'::date),
  (1201, 'Suspensión 3 días por abandono de puesto',       'activa',   '2026-06-30'::date),
  (1153, 'Llamado de atención por libro de guardia',       'apelada',  '2026-06-05'::date)
) AS x(legajo, descripcion, estado, fecha) ON v.legajo = x.legajo
WHERE NOT EXISTS (SELECT 1 FROM sanciones);
