-- ═══════════════════════════════════════════════════════════════
-- ASI — Datos de DEMO / prueba
-- Usuarios de prueba (supervisor/admin/dueno), objetivos ficticios,
-- vigiladores, historial y sanciones de ejemplo.
-- NO ejecutar en la base de producción.
-- Requiere schema.sql aplicado antes. Idempotente:
--   psql asi -f schema.sql && psql asi -f seed_demo.sql
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
  ('Barrio Demo Cercano',            'Barrios',    'barrio_unipersonal',  'unipersonal', 'Mendoza, Argentina (ubicación de prueba)', -32.939449, -68.850794, 1000, 4)
ON CONFLICT (nombre) DO UPDATE SET
  subtipo          = EXCLUDED.subtipo,
  modalidad        = EXCLUDED.modalidad,
  direccion        = EXCLUDED.direccion,
  lat              = EXCLUDED.lat,
  lng              = EXCLUDED.lng,
  radio_geocerca_m = EXCLUDED.radio_geocerca_m,
  visitas_meta_mes = EXCLUDED.visitas_meta_mes;

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
   (SELECT id FROM objetivos WHERE nombre='Local Comercial Av. Corrientes')),

  (1276, 'Marcelo Ariel Funes', '27.845.112', 'Vigilador Diurno A', 'FN-2210-A', '2026-11-05',
   TRUE, 'B1', '2027-05-18', FALSE, 'activo',
   '261-455-7823', 'Godoy Cruz 1450, Mendoza', '1990-06-14', 'Argentina', 'UPSRA', TRUE,
   (SELECT id FROM objetivos WHERE nombre='Barrio Demo Cercano')),

  (1319, 'Yamila Soledad Paredes', '34.117.890', 'Vigiladora Nocturna B', 'YP-3387-B', '2026-09-22',
   FALSE, NULL, NULL, FALSE, 'activo',
   '261-398-2246', 'Las Heras 620, Mendoza', '1994-02-27', 'Argentina', 'UPSRA', TRUE,
   (SELECT id FROM objetivos WHERE nombre='Barrio Demo Cercano'))

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
