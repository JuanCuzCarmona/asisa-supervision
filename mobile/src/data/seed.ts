/* Datos de ejemplo del modo demo — GENERADO por scripts/gen-seed.js desde los SEED_*
   de asi_prototype.html. No editar a mano: correr `npm run seed`. */
import type { Objetivo, Vigilador, Seccion, ItemChecklist, Ajuste, Observacion } from "../types";

export const SEED_OBJETIVOS: Objetivo[] = [
  {
    "id": 1,
    "nombre": "Barrio Privado La Alameda",
    "tipo": "Barrios",
    "subtipo": "barrio_multipuesto",
    "modalidad": "multipuesto",
    "direccion": "Ruta 8 km 42, Pilar",
    "lat": -34.4589,
    "lng": -58.9142,
    "radio_geocerca_m": 400,
    "visitas_meta_mes": 8,
    "visitas_mes": 5
  },
  {
    "id": 2,
    "nombre": "Barrio Privado Los Pinos",
    "tipo": "Barrios",
    "subtipo": "barrio_unipersonal",
    "modalidad": "unipersonal",
    "direccion": "Av. Los Pinos 1200, Escobar",
    "lat": -34.3487,
    "lng": -58.7934,
    "radio_geocerca_m": 250,
    "visitas_meta_mes": 6,
    "visitas_mes": 4
  },
  {
    "id": 3,
    "nombre": "Industria Metalúrgica Del Sur",
    "tipo": "Industrias",
    "subtipo": "industria",
    "modalidad": "multipuesto",
    "direccion": "Parque Ind. Norte, Malvinas",
    "lat": -34.5012,
    "lng": -58.7021,
    "radio_geocerca_m": 500,
    "visitas_meta_mes": 10,
    "visitas_mes": 7
  },
  {
    "id": 4,
    "nombre": "Industria Agroexport SA",
    "tipo": "Industrias",
    "subtipo": "industria",
    "modalidad": "multipuesto",
    "direccion": "Ruta 9 km 61, Campana",
    "lat": -34.1634,
    "lng": -58.9591,
    "radio_geocerca_m": 500,
    "visitas_meta_mes": 6,
    "visitas_mes": 2
  },
  {
    "id": 5,
    "nombre": "Local Comercial Av. Corrientes",
    "tipo": "Locales",
    "subtipo": "local_comercial",
    "modalidad": "unipersonal",
    "direccion": "Av. Corrientes 2450, CABA",
    "lat": -34.6037,
    "lng": -58.3968,
    "radio_geocerca_m": 120,
    "visitas_meta_mes": 12,
    "visitas_mes": 9
  },
  {
    "id": 6,
    "nombre": "Shopping Norte",
    "tipo": "Locales",
    "subtipo": "local_comercial",
    "modalidad": "multipuesto",
    "direccion": "Av. Cabildo 3100, CABA",
    "lat": -34.5567,
    "lng": -58.4614,
    "radio_geocerca_m": 200,
    "visitas_meta_mes": 8,
    "visitas_mes": 6
  },
  {
    "id": 7,
    "nombre": "Corporativo Torre Madero",
    "tipo": "Locales",
    "subtipo": "empresa_oficinas",
    "modalidad": "unipersonal",
    "direccion": "Juana Manso 1150, Pto. Madero",
    "lat": -34.6098,
    "lng": -58.3627,
    "radio_geocerca_m": 150,
    "visitas_meta_mes": 6,
    "visitas_mes": 3
  },
  {
    "id": 8,
    "nombre": "Barrio Demo Cercano",
    "tipo": "Barrios",
    "subtipo": "barrio_unipersonal",
    "modalidad": "unipersonal",
    "direccion": "Mendoza, Argentina (ubicación de prueba)",
    "lat": -32.939449,
    "lng": -68.850794,
    "radio_geocerca_m": 1000,
    "visitas_meta_mes": 4,
    "visitas_mes": 0
  }
];

export const SEED_VIGILADORES: Vigilador[] = [
  {
    "id": 1,
    "legajo": 1024,
    "nombre": "Carlos Alberto Rodríguez",
    "dni": "28.541.730",
    "puesto": "Vigilador Nocturno B",
    "estado": "activo",
    "credencial_numero": "CR-4521-B",
    "credencial_venc": "2026-08-15",
    "es_chofer": true,
    "licencia_cat": "B2",
    "licencia_venc": "2027-03-10",
    "armado": false,
    "telefono": "11-5423-9087",
    "domicilio": "Av. Rivadavia 8842, CABA",
    "fecha_nacimiento": "1981-04-22",
    "nacionalidad": "Argentina",
    "convenio": "UPSRA",
    "tiene_radio": true,
    "objetivo_asignado": "Barrio Privado La Alameda"
  },
  {
    "id": 2,
    "legajo": 1087,
    "nombre": "Miguel Ángel Sosa",
    "dni": "31.208.446",
    "puesto": "Vigilador Diurno A",
    "estado": "activo",
    "credencial_numero": "MS-4890-A",
    "credencial_venc": "2026-09-02",
    "es_chofer": false,
    "licencia_cat": null,
    "licencia_venc": null,
    "armado": false,
    "telefono": "11-6012-3345",
    "domicilio": "Belgrano 455, Pilar",
    "fecha_nacimiento": "1985-11-08",
    "nacionalidad": "Argentina",
    "convenio": "UPSRA",
    "tiene_radio": true,
    "objetivo_asignado": "Barrio Privado La Alameda"
  },
  {
    "id": 3,
    "legajo": 1153,
    "nombre": "Jorge Luis Benítez",
    "dni": "26.774.219",
    "puesto": "Jefe de Puesto",
    "estado": "activo",
    "credencial_numero": "JB-3312-C",
    "credencial_venc": "2026-08-04",
    "es_chofer": true,
    "licencia_cat": "D1",
    "licencia_venc": "2026-08-20",
    "armado": true,
    "telefono": "11-4477-2210",
    "domicilio": "San Martín 1290, Escobar",
    "fecha_nacimiento": "1978-02-14",
    "nacionalidad": "Argentina",
    "convenio": "UPSRA",
    "tiene_radio": true,
    "objetivo_asignado": "Industria Metalúrgica Del Sur"
  },
  {
    "id": 4,
    "legajo": 1201,
    "nombre": "Néstor Fabián Quiroga",
    "dni": "33.901.556",
    "puesto": "Vigilador Nocturno C",
    "estado": "suspendido",
    "credencial_numero": "NQ-5104-B",
    "credencial_venc": "2027-01-30",
    "es_chofer": false,
    "licencia_cat": null,
    "licencia_venc": null,
    "armado": false,
    "telefono": "11-3388-9921",
    "domicilio": "Mitre 733, Campana",
    "fecha_nacimiento": "1988-07-30",
    "nacionalidad": "Argentina",
    "convenio": "UPSRA",
    "tiene_radio": false,
    "objetivo_asignado": "Local Comercial Av. Corrientes"
  },
  {
    "id": 5,
    "legajo": 1276,
    "nombre": "Marcelo Ariel Funes",
    "dni": "27.845.112",
    "puesto": "Vigilador Diurno A",
    "estado": "activo",
    "credencial_numero": "FN-2210-A",
    "credencial_venc": "2026-11-05",
    "es_chofer": true,
    "licencia_cat": "B1",
    "licencia_venc": "2027-05-18",
    "armado": false,
    "telefono": "261-455-7823",
    "domicilio": "Godoy Cruz 1450, Mendoza",
    "fecha_nacimiento": "1990-06-14",
    "nacionalidad": "Argentina",
    "convenio": "UPSRA",
    "tiene_radio": true,
    "objetivo_asignado": "Barrio Demo Cercano"
  },
  {
    "id": 6,
    "legajo": 1319,
    "nombre": "Yamila Soledad Paredes",
    "dni": "34.117.890",
    "puesto": "Vigiladora Nocturna B",
    "estado": "activo",
    "credencial_numero": "YP-3387-B",
    "credencial_venc": "2026-09-22",
    "es_chofer": false,
    "licencia_cat": null,
    "licencia_venc": null,
    "armado": false,
    "telefono": "261-398-2246",
    "domicilio": "Las Heras 620, Mendoza",
    "fecha_nacimiento": "1994-02-27",
    "nacionalidad": "Argentina",
    "convenio": "UPSRA",
    "tiene_radio": true,
    "objetivo_asignado": "Barrio Demo Cercano"
  }
];

export const SEED_HISTORIAL = {
  "1024": [
    {
      "tipo": "Acta",
      "descripcion": "Demora de 22 min en inicio de turno",
      "fecha": "2026-05-12"
    },
    {
      "tipo": "Sanción",
      "descripcion": "Uniforme incompleto — sin chaleco reflectivo",
      "fecha": "2026-03-08"
    },
    {
      "tipo": "Acta",
      "descripcion": "Ausencia sin aviso previo",
      "fecha": "2025-11-20"
    }
  ],
  "1153": [
    {
      "tipo": "Acta",
      "descripcion": "Observación por libro de guardia incompleto",
      "fecha": "2026-06-02"
    }
  ],
  "1201": [
    {
      "tipo": "Sanción",
      "descripcion": "Abandono de puesto durante el turno noche",
      "fecha": "2026-06-28"
    }
  ]
};

export const SEED_SANCIONES = {
  "1024": [
    {
      "descripcion": "Apercibimiento escrito por uniforme incompleto",
      "estado": "cumplida",
      "fecha": "2026-03-10"
    }
  ],
  "1153": [
    {
      "descripcion": "Llamado de atención por libro de guardia",
      "estado": "apelada",
      "fecha": "2026-06-05"
    }
  ],
  "1201": [
    {
      "descripcion": "Suspensión 3 días por abandono de puesto",
      "estado": "activa",
      "fecha": "2026-06-30"
    }
  ]
};

export const SEED_SECCIONES: Seccion[] = [
  {
    "id": 1,
    "clave": "seguridad",
    "nombre": "Elementos de seguridad",
    "color": "azul",
    "orden": 1
  },
  {
    "id": 2,
    "clave": "habilidades",
    "nombre": "Comprobación de habilidades",
    "color": "verde",
    "orden": 2
  },
  {
    "id": 3,
    "clave": "logistica",
    "nombre": "Logística / Infraestructura",
    "color": "naranja",
    "orden": 3
  },
  {
    "id": 4,
    "clave": "rrhh",
    "nombre": "RRHH / Personal",
    "color": "rojo",
    "orden": 4
  }
];

export const SEED_CHECKLIST: ItemChecklist[] = [
  {
    "id": 1,
    "seccion_clave": "seguridad",
    "titulo_corto": "Uniforme completo",
    "area_responsable": "Supervisión",
    "tipos_objetivo": [
      "barrio_multipuesto",
      "barrio_unipersonal",
      "local_comercial",
      "industria",
      "empresa_oficinas"
    ],
    "orden": 1,
    "criterio_completo": "Verificar camisa con identificación de la empresa, pantalón reglamentario, chaleco reflectante y calzado de seguridad en buen estado."
  },
  {
    "id": 2,
    "seccion_clave": "seguridad",
    "titulo_corto": "Credencial visible y vigente",
    "area_responsable": "RRHH",
    "tipos_objetivo": [
      "barrio_multipuesto",
      "barrio_unipersonal",
      "local_comercial",
      "industria",
      "empresa_oficinas"
    ],
    "orden": 2,
    "criterio_completo": "La credencial habilitante debe estar a la vista, en buen estado y con fecha de vencimiento posterior al día de la inspección."
  },
  {
    "id": 3,
    "seccion_clave": "seguridad",
    "titulo_corto": "Elementos reglamentarios",
    "area_responsable": "Logística",
    "tipos_objetivo": [
      "barrio_multipuesto",
      "barrio_unipersonal",
      "industria"
    ],
    "orden": 3,
    "criterio_completo": "Linterna con carga suficiente, radio operativa con batería, bastón retráctil y silbato según corresponda al puesto."
  },
  {
    "id": 4,
    "seccion_clave": "seguridad",
    "titulo_corto": "Elementos de protección personal",
    "area_responsable": "Logística",
    "tipos_objetivo": [
      "industria"
    ],
    "orden": 4,
    "criterio_completo": "EPP acorde al riesgo del objetivo: guantes, calzado con puntera, casco o chaleco antibalas si el contrato lo requiere."
  },
  {
    "id": 5,
    "seccion_clave": "habilidades",
    "titulo_corto": "Protocolo de emergencia",
    "area_responsable": "Operaciones",
    "tipos_objetivo": [
      "barrio_multipuesto",
      "barrio_unipersonal",
      "local_comercial",
      "industria",
      "empresa_oficinas"
    ],
    "orden": 1,
    "criterio_completo": "El vigilador debe describir correctamente los pasos ante incendio, robo o emergencia médica, y los teléfonos de contacto."
  },
  {
    "id": 6,
    "seccion_clave": "habilidades",
    "titulo_corto": "Manejo de radio",
    "area_responsable": "Operaciones",
    "tipos_objetivo": [
      "barrio_multipuesto",
      "barrio_unipersonal",
      "industria"
    ],
    "orden": 2,
    "criterio_completo": "Verificar que sabe encender, cambiar de canal, emitir y responder comunicaciones usando el código operativo de la empresa."
  },
  {
    "id": 7,
    "seccion_clave": "habilidades",
    "titulo_corto": "Procedimiento ante intrusión",
    "area_responsable": "Operaciones",
    "tipos_objetivo": [
      "barrio_multipuesto",
      "barrio_unipersonal",
      "local_comercial",
      "industria",
      "empresa_oficinas"
    ],
    "orden": 3,
    "criterio_completo": "Debe explicar la secuencia: no confrontar, dar aviso por radio, registrar características y esperar refuerzos policiales."
  },
  {
    "id": 8,
    "seccion_clave": "habilidades",
    "titulo_corto": "Identificación de zonas de riesgo",
    "area_responsable": "Operaciones",
    "tipos_objetivo": [
      "barrio_multipuesto",
      "industria",
      "empresa_oficinas"
    ],
    "orden": 4,
    "criterio_completo": "Reconoce los puntos ciegos, accesos vulnerables y sectores restringidos del objetivo donde presta servicio."
  },
  {
    "id": 9,
    "seccion_clave": "habilidades",
    "titulo_corto": "Protocolo de control de acceso",
    "area_responsable": "Operaciones",
    "tipos_objetivo": [
      "local_comercial",
      "empresa_oficinas"
    ],
    "orden": 5,
    "criterio_completo": "Verificar que aplica correctamente el registro de visitas, identificación de proveedores y autorización previa de ingresos."
  },
  {
    "id": 10,
    "seccion_clave": "logistica",
    "titulo_corto": "Estado del móvil",
    "area_responsable": "Logística",
    "tipos_objetivo": [
      "barrio_multipuesto",
      "industria"
    ],
    "orden": 1,
    "criterio_completo": "Kilometraje registrado, nivel de combustible, luces, cubiertas y ausencia de daños nuevos en la carrocería."
  },
  {
    "id": 11,
    "seccion_clave": "logistica",
    "titulo_corto": "Cámaras activas",
    "area_responsable": "Mantenimiento",
    "tipos_objetivo": [
      "barrio_multipuesto",
      "barrio_unipersonal",
      "local_comercial",
      "industria",
      "empresa_oficinas"
    ],
    "orden": 2,
    "criterio_completo": "Todas las cámaras del objetivo deben mostrar imagen en vivo, sin pérdida de señal ni lentes obstruidos."
  },
  {
    "id": 12,
    "seccion_clave": "logistica",
    "titulo_corto": "DVR / NVR operativo",
    "area_responsable": "Mantenimiento",
    "tipos_objetivo": [
      "barrio_multipuesto",
      "barrio_unipersonal",
      "local_comercial",
      "industria",
      "empresa_oficinas"
    ],
    "orden": 3,
    "criterio_completo": "El grabador debe estar encendido, con espacio de almacenamiento disponible y grabando las últimas 24 horas."
  },
  {
    "id": 13,
    "seccion_clave": "logistica",
    "titulo_corto": "Botón de pánico",
    "area_responsable": "Mantenimiento",
    "tipos_objetivo": [
      "barrio_multipuesto",
      "barrio_unipersonal",
      "local_comercial",
      "industria"
    ],
    "orden": 4,
    "criterio_completo": "Probar el disparo del botón de pánico y confirmar recepción de la alarma en la central de monitoreo."
  },
  {
    "id": 14,
    "seccion_clave": "logistica",
    "titulo_corto": "Garitas y portones",
    "area_responsable": "Mantenimiento",
    "tipos_objetivo": [
      "barrio_multipuesto",
      "barrio_unipersonal",
      "industria"
    ],
    "orden": 5,
    "criterio_completo": "Estructura de la garita en condiciones, iluminación perimetral funcionando y portones automáticos operativos."
  },
  {
    "id": 15,
    "seccion_clave": "rrhh",
    "titulo_corto": "Puntualidad",
    "area_responsable": "RRHH",
    "tipos_objetivo": [
      "barrio_multipuesto",
      "barrio_unipersonal",
      "local_comercial",
      "industria",
      "empresa_oficinas"
    ],
    "orden": 1,
    "criterio_completo": "Verificar que el vigilador ingresó en el horario pactado y que el relevo del turno anterior se realizó sin demoras."
  },
  {
    "id": 16,
    "seccion_clave": "rrhh",
    "titulo_corto": "Presentación personal",
    "area_responsable": "RRHH",
    "tipos_objetivo": [
      "barrio_multipuesto",
      "barrio_unipersonal",
      "local_comercial",
      "industria",
      "empresa_oficinas"
    ],
    "orden": 2,
    "criterio_completo": "Higiene, afeitado, cabello prolijo y uniforme limpio y planchado acorde a la imagen institucional."
  },
  {
    "id": 17,
    "seccion_clave": "rrhh",
    "titulo_corto": "Estado de alerta",
    "area_responsable": "Supervisión",
    "tipos_objetivo": [
      "barrio_multipuesto",
      "barrio_unipersonal",
      "local_comercial",
      "industria",
      "empresa_oficinas"
    ],
    "orden": 3,
    "criterio_completo": "El vigilador debe estar despierto, atento al entorno y sin usar el celular con fines personales durante la guardia."
  },
  {
    "id": 18,
    "seccion_clave": "rrhh",
    "titulo_corto": "Conducta y trato",
    "area_responsable": "RRHH",
    "tipos_objetivo": [
      "barrio_multipuesto",
      "barrio_unipersonal",
      "local_comercial",
      "industria",
      "empresa_oficinas"
    ],
    "orden": 4,
    "criterio_completo": "Trato cordial y profesional con residentes, clientes y proveedores. Sin conflictos reportados en el turno."
  },
  {
    "id": 19,
    "seccion_clave": "rrhh",
    "titulo_corto": "Comunicación con supervisión",
    "area_responsable": "Supervisión",
    "tipos_objetivo": [
      "barrio_multipuesto",
      "barrio_unipersonal",
      "local_comercial",
      "industria",
      "empresa_oficinas"
    ],
    "orden": 5,
    "criterio_completo": "Reportó novedades del turno, respondió a las comunicaciones y completó el libro de guardia correctamente."
  },
  {
    "id": 20,
    "seccion_clave": "habilidades",
    "titulo_corto": "Registro de visitas y proveedores",
    "area_responsable": "Operaciones",
    "tipos_objetivo": [],
    "orden": 6,
    "criterio_completo": "El libro digital de visitas debe estar completo: nombre, DNI, empresa, piso de destino y horario de ingreso y egreso."
  },
  {
    "id": 21,
    "seccion_clave": "logistica",
    "titulo_corto": "Control de acceso a cocheras",
    "area_responsable": "Mantenimiento",
    "tipos_objetivo": [],
    "orden": 6,
    "criterio_completo": "Verificar que la barrera vehicular responde al control remoto y que se registra la patente de cada vehículo que ingresa."
  },
  {
    "id": 22,
    "seccion_clave": "logistica",
    "titulo_corto": "Balanza y control de carga",
    "area_responsable": "Logística",
    "tipos_objetivo": [],
    "orden": 7,
    "criterio_completo": "La balanza de camiones debe estar calibrada y operativa, con registro de pesaje de cada salida de mercadería."
  }
];

export const SEED_AJUSTES: Ajuste[] = [
  {
    "objetivo_id": 6,
    "item_id": 10,
    "incluido": true,
    "nota": "El objetivo tiene móvil de ronda asignado"
  },
  {
    "objetivo_id": 6,
    "item_id": 14,
    "incluido": true,
    "nota": "Accesos vehiculares en subsuelo"
  },
  {
    "objetivo_id": 6,
    "item_id": 21,
    "incluido": true,
    "nota": "Cochera de 400 lugares"
  },
  {
    "objetivo_id": 7,
    "item_id": 20,
    "incluido": true,
    "nota": "Exigido por el contrato"
  },
  {
    "objetivo_id": 7,
    "item_id": 21,
    "incluido": true,
    "nota": "Barrera vehicular en Juana Manso"
  },
  {
    "objetivo_id": 4,
    "item_id": 22,
    "incluido": true,
    "nota": "Salida de mercadería a granel"
  },
  {
    "objetivo_id": 5,
    "item_id": 13,
    "incluido": false,
    "nota": "Depende del sistema del edificio, no del puesto"
  },
  {
    "objetivo_id": 2,
    "item_id": 12,
    "incluido": false,
    "nota": "El monitoreo es externo, no hay grabador en el objetivo"
  }
];

export const SEED_OBSERVACIONES: Observacion[] = [
  {
    "area": "Logística",
    "texto": "Sin elementos de protección personal"
  },
  {
    "area": "Logística",
    "texto": "Móvil sin combustible"
  },
  {
    "area": "Logística",
    "texto": "Cámara sin señal"
  },
  {
    "area": "Logística",
    "texto": "DVR apagado"
  },
  {
    "area": "Logística",
    "texto": "Linterna sin carga"
  },
  {
    "area": "Logística",
    "texto": "Radio sin batería"
  },
  {
    "area": "Supervisión",
    "texto": "Ausencia en puesto"
  },
  {
    "area": "Supervisión",
    "texto": "Abandono de guardia"
  },
  {
    "area": "Supervisión",
    "texto": "Uso de celular en horario"
  },
  {
    "area": "Supervisión",
    "texto": "Uniforme incompleto"
  },
  {
    "area": "Supervisión",
    "texto": "Falta de presentación"
  },
  {
    "area": "Operaciones",
    "texto": "No conoce protocolo de emergencia"
  },
  {
    "area": "Operaciones",
    "texto": "No sabe operar la radio"
  },
  {
    "area": "Operaciones",
    "texto": "Desconoce procedimiento de intrusión"
  },
  {
    "area": "Operaciones",
    "texto": "No identifica zona de riesgo"
  },
  {
    "area": "RRHH",
    "texto": "Trato inadecuado"
  },
  {
    "area": "RRHH",
    "texto": "Actitud negligente"
  },
  {
    "area": "RRHH",
    "texto": "Falta de comunicación"
  },
  {
    "area": "RRHH",
    "texto": "Reincidencia en falta ya sancionada"
  },
  {
    "area": "RRHH",
    "texto": "Negativa a firmar el acta de supervisión"
  },
  {
    "area": "Mantenimiento",
    "texto": "Portón automático sin funcionar"
  },
  {
    "area": "Mantenimiento",
    "texto": "Garita en mal estado"
  },
  {
    "area": "Mantenimiento",
    "texto": "Iluminación perimetral apagada"
  },
  {
    "area": "Mantenimiento",
    "texto": "Cerradura forzada"
  }
];

export const SEED_TICKETS = [
  {
    "id": "INC-202607-0041",
    "obj": "Barrio Privado La Alameda",
    "sup": "María González",
    "val": "M",
    "area": "RRHH",
    "estado": "Activo",
    "desc": "Uniforme incompleto en turno nocturno",
    "item": "Uniforme completo",
    "vig": "Carlos A. Rodríguez",
    "fecha": "13/07 · 02:15",
    "isNew": false
  },
  {
    "id": "INC-202607-0039",
    "obj": "Industria Metalúrgica Del Sur",
    "sup": "Jorge Pérez",
    "val": "R",
    "area": "Mantenimiento",
    "estado": "Activo",
    "desc": "Cámara sin señal en acceso norte",
    "item": "Cámaras activas",
    "vig": "Jorge L. Benítez",
    "fecha": "12/07 · 23:45",
    "isNew": false
  },
  {
    "id": "INC-202607-0038",
    "obj": "Local Comercial Av. Corrientes",
    "sup": "Ana Suárez",
    "val": "R",
    "area": "Operaciones",
    "estado": "Activo",
    "desc": "Demora en protocolo de cierre",
    "item": "Protocolo de emergencia",
    "vig": "Néstor F. Quiroga",
    "fecha": "12/07 · 21:30",
    "isNew": false
  },
  {
    "id": "INC-202607-0035",
    "obj": "Barrio Privado Los Pinos",
    "sup": "Carlos Méndez",
    "val": "M",
    "area": "Logística",
    "estado": "Activo",
    "desc": "Vehículo de ronda con falla mecánica",
    "item": "Estado del móvil",
    "vig": "Miguel Á. Sosa",
    "fecha": "11/07 · 18:00",
    "isNew": false
  },
  {
    "id": "INC-202607-0031",
    "obj": "Industria Agroexport SA",
    "sup": "Roberto Silva",
    "val": "R",
    "area": "Operaciones",
    "estado": "Cerrado",
    "desc": "Punto de control sin confirmar en ronda",
    "item": "Manejo de radio",
    "vig": "Jorge L. Benítez",
    "fecha": "10/07 · 14:22",
    "isNew": false,
    "resolucion": "Se reforzó la capacitación del puesto."
  }
];

export const SEED_FEED = [
  {
    "hora": "17:42",
    "sup": "M. González",
    "obj": "B.P. La Alameda",
    "tipo": "Presencial",
    "ok": true,
    "isNew": false
  },
  {
    "hora": "17:15",
    "sup": "J. Pérez",
    "obj": "Ind. Metalúrgica",
    "tipo": "Remota",
    "ok": false,
    "isNew": false
  },
  {
    "hora": "16:58",
    "sup": "A. Suárez",
    "obj": "Local Corrientes",
    "tipo": "Presencial",
    "ok": true,
    "isNew": false
  },
  {
    "hora": "16:30",
    "sup": "C. Méndez",
    "obj": "B.P. Los Pinos",
    "tipo": "Presencial",
    "ok": true,
    "isNew": false
  },
  {
    "hora": "15:55",
    "sup": "R. Silva",
    "obj": "Agroexport SA",
    "tipo": "Remota",
    "ok": false,
    "isNew": false
  }
];

