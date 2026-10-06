# ASI · Guía del sistema y capacitación de usuarios

**Actualizado:** 5 de octubre de 2026

**Alcance:** aplicación web (`asi_prototype.html`), aplicación móvil nativa (`mobile/`), API (`server.js`) y datos (`schema.sql`).

**Destinatarios:** supervisores, Administración, Dirección y quien dicte la capacitación.

## 1. Qué resuelve el sistema

El Sistema de Supervisión de Argentina Seguridad Integral (ASI) registra las rondas de control en los objetivos donde presta servicio. El supervisor completa un acta guiada desde el teléfono. Administración sigue las incidencias que surgen de esa acta y Dirección consulta el cumplimiento y la actividad de la operación.

El flujo une **objetivo → vigiladores inspeccionados → checklist → evidencia → firmas → acta → incidencias → resolución**. Una visita se cuenta cuando el acta queda guardada en el servidor. El sistema conserva la modalidad de la ronda, la ubicación informada por el dispositivo, la justificación si fue remota, las respuestas, las fotos, las firmas y los tickets vinculados.

### Términos que se usan en la capacitación

| Término | Significado |
| --- | --- |
| Objetivo | Lugar o servicio que ASI supervisa; tiene dirección, tipo, ubicación, radio de geocerca y meta de visitas mensuales. |
| Ronda | Recorrido o control que inicia un supervisor para un objetivo, presencial o remoto. |
| Geocerca | Radio configurado alrededor de las coordenadas del objetivo. La API vuelve a calcular si la ubicación informada cae dentro del margen permitido. |
| Checklist | Preguntas que corresponden al tipo de objetivo, con ajustes particulares para ese lugar. |
| Acta | Registro final de la ronda, con código `ACTA-...` asignado por el servidor cuando se sincroniza. |
| Incidencia o ticket | Caso abierto a partir de una valoración Regular/Malo o de una negativa a firmar. Tiene código `INC-...`, área responsable y estado. |
| En cola | Acta guardada en el dispositivo y todavía no confirmada por el servidor. Su código local es provisorio. |

## 2. Acceso, roles y superficies

Se ingresa con usuario y contraseña asignados por ASI. Cada cuenta tiene **un rol**: Supervisor (`supervisor`), Administración (`admin`) o Dirección (`dueno`). Los vigiladores inspeccionados figuran como personal dentro del sistema, pero **no tienen un acceso propio implementado**. La sesión del servidor dura ocho horas; si vence, hay que volver a ingresar.

| Rol | Web | Aplicación móvil nativa | Permisos centrales |
| --- | --- | --- | --- |
| Supervisor | Asistente de ronda y acta | Asistente de ronda, estado de sincronización y cuenta | Crear rondas; consultar perfil de vigiladores. |
| Administración | Panel de incidencias | Lista y detalle de incidencias | Ver tickets y actas; cerrar tickets con una resolución escrita. |
| Dirección | Tablero ejecutivo y aprobaciones de clave | Tablero ejecutivo, actas y aprobaciones de clave | Ver indicadores, actividad, tickets y actas; aprobar o rechazar cambios de contraseña. |

La API tiene además operaciones de mantenimiento para objetivos, vigiladores, sanciones, historial, ajustes del checklist, catálogo de observaciones, usuarios y rutas. **Esas operaciones no tienen pantallas de gestión en la web ni en la app móvil actuales.** Requieren una herramienta de administración o integración técnica; no deben presentarse como botones disponibles para los usuarios durante la capacitación.

### Primer ingreso y contraseña

1. Abrir la web o la app Android nativa entregada por ASI y entrar con las credenciales propias.
2. Verificar que aparezca el panel correspondiente al rol. Si la cuenta fue creada por Administración, Dirección debe aprobarla antes del primer ingreso; una cuenta creada por Dirección queda habilitada al crearla.
3. En **Cambiar contraseña**, escribir la contraseña actual y la nueva (mínimo ocho caracteres). El cambio solicitado por Supervisor o Administración queda pendiente hasta que Dirección lo apruebe. El cambio de la propia contraseña de Dirección se aplica directamente.
4. Dirección revisa las solicitudes pendientes y puede aprobarlas o rechazarlas. La nueva contraseña no se muestra a quien aprueba.

## 3. Supervisor: ronda completa

### Antes de empezar

- Tener una sesión iniciada y haber cargado al menos una vez los catálogos con conexión. El trabajo sin señal usa la última copia local de objetivos, vigiladores y checklist; un dispositivo sin datos previos no puede preparar una ronda útil.
- Activar el permiso de ubicación. Para fotos, conceder acceso a cámara o imágenes cuando la aplicación lo solicite.
- Confirmar que el objetivo correcto y los vigiladores del turno estén disponibles. Si algún dato de base está mal, avisar a Administración para su corrección por el circuito técnico vigente.

### Paso 1 · Inicio y ubicación

Buscar y elegir el objetivo. La pantalla muestra las visitas realizadas frente a la meta mensual. El dispositivo obtiene su ubicación; una ronda **presencial** se inicia dentro de la geocerca. Si está fuera o no se puede obtener GPS, se ofrece una ronda **remota**, que exige elegir un motivo y escribir una justificación suficiente. La API recalcula la geocerca al recibir el acta y rechaza una ronda presencial sin ubicación verificable o fuera del radio permitido. Guarda también la distancia y la precisión informada para auditoría.

**Ejercicio:** elegir un objetivo, leer su meta mensual y explicar por qué la modalidad mostrada es presencial o remota. Para una remota, escribir un motivo concreto que describa lo ocurrido.

### Paso 2 · Vigiladores

Se precargan los vigiladores activos asignados al objetivo cuando existen. El supervisor puede agregar otros por legajo, nombre o apellido y quitar a quienes no fueron inspeccionados. Se requiere al menos uno. El perfil permite consultar datos del legajo, credencial, vencimientos, historial, sanciones e incidencias; los detalles históricos completos dependen de la conexión con la API.

**Ejercicio:** verificar cada persona inspeccionada y revisar una alerta de credencial o estado antes de continuar.

### Paso 3 · Checklist

El checklist se arma con una plantilla por subtipo de objetivo y con altas o exclusiones particulares del lugar. Hay cinco plantillas: industria/planta, barrio multipuesto, barrio unipersonal, local comercial y empresa/oficinas. Las preguntas se agrupan en **Elementos de seguridad, Comprobación de habilidades, Logística/Infraestructura y RRHH/Personal**. La definición detallada de cada punto se puede consultar desde la pantalla.

Cada punto se valora **B = Bueno, R = Regular o M = Malo**. Para R o M se debe registrar una observación del catálogo o un texto propio antes de avanzar. Esas valoraciones generan tickets al guardar el acta; el área se toma de la observación elegida cuando corresponde, o del ítem. No se puede pasar a evidencia con puntos sin evaluar o con R/M sin observación.

**Ejercicio:** marcar un punto B y otro R, completar la observación del segundo y verificar el contador de incidencias previstas.

### Paso 4 · Evidencia

Se pueden agregar varias fotografías o continuar sin fotos. Al capturarlas, la aplicación incorpora una marca visible con fecha, hora, ubicación disponible y supervisor. Cada foto se puede asociar a un punto del checklist o dejar como evidencia general. Revisar la foto antes de cerrar la ronda. **La foto es opcional; si no hay GPS en el momento de tomarla, puede quedar indicado como no disponible.** No describir el sello como garantía criptográfica: es una marca incorporada por la aplicación.

**Ejercicio:** tomar una foto, verificar la marca y asociarla al punto observado.

### Paso 5 · Firmas y guardado

Cada vigilador seleccionado debe firmar en pantalla o tener registrada una **negativa a firmar**. Una negativa genera una incidencia a RRHH. Antes de guardar, revisar el resumen: objetivo, modalidad, vigiladores, puntos evaluados, incidencias y fotos. Con conexión, el servidor asigna el código definitivo del acta y de los tickets. Sin conexión, el dispositivo muestra que el acta quedó **en cola**; esto todavía no equivale a recepción por el servidor.

**Ejercicio:** cerrar un acta de prueba con firma o negativa, identificar el estado “enviada” o “en cola”, y explicar la diferencia.

### Qué hacer sin conexión

La web guarda la cola en IndexedDB; la app nativa la guarda en SQLite y conserva las fotos como archivos del dispositivo. Ambas usan los catálogos de la última sesión. La sincronización se intenta al recuperar la conexión y periódicamente cada 60 segundos mientras la aplicación está operativa. En la app nativa, **Conexión** muestra las actas pendientes, los intentos y el último error, y permite reintentar manualmente. Un rechazo del servidor requiere revisar la causa; no se debe asumir que todo pendiente se enviará solo. **No borrar los datos de la aplicación ni desinstalarla mientras haya actas en cola.**

## 4. Administración: seguimiento de incidencias

El panel de Administración muestra incidencias **críticas, activas y cerradas**. Se puede buscar por código, objetivo, supervisor, vigilador o texto; filtrar por estado, área, prioridad, antigüedad, período y, según la interfaz, por objetivo y supervisor. Las incidencias con valoración M aparecen como críticas. También se puede priorizar las abiertas hace más de 48 horas.

Al abrir una incidencia se ven el origen, la valoración, el área responsable, la descripción, el supervisor, la fecha y el enlace al acta y sus evidencias. Para cerrarla se debe escribir una **resolución concreta**; el sistema conserva ese texto y cambia su estado a resuelta. El cierre requiere conexión. Administración puede ver el acta vinculada, pero Dirección no tiene permiso para cerrar tickets.

**Ejercicio de capacitación:** localizar una incidencia crítica, abrir el acta, revisar la observación y la foto si existe, escribir qué acción se realizó y cerrarla. Luego comprobar que pasó a Cerradas.

### Mantenimiento disponible en la API, sin pantalla operativa

La API permite dar de alta, editar, desactivar y reactivar objetivos y vigiladores; mantener sanciones e historial; ajustar por objetivo qué puntos de checklist se incluyen; mantener observaciones; crear y administrar usuarios; y planificar visitas por supervisor y fecha. También puede generar rutas mensuales repartiendo la meta de visitas en días hábiles. Al guardar una ronda, el servidor marca como realizada la visita correspondiente a ese supervisor, objetivo y fecha de inicio, si existe en la ruta. El supervisor tiene un endpoint para consultar su ruta, **pero la pantalla actual de inicio no la muestra**. Esta sección sirve para explicar la capacidad técnica y planificar una futura interfaz de gestión, no para enseñar pasos inexistentes en la app.

Las cuentas creadas por Administración requieren aprobación de Dirección; Administración no puede administrar cuentas de Dirección. El blanqueo de clave de otra persona también queda pendiente de aprobación. Las acciones de mantenimiento quedan registradas en la tabla de auditoría.

## 5. Dirección: control de la operación

El tablero presenta visitas realizadas frente a metas del mes, rondas presenciales y remotas, cumplimiento por tipo y por objetivo, evolución histórica, incidencias críticas, abiertas y cerradas, casos abiertos de más de 48 horas, tiempo promedio de resolución, tickets por área, supervisiones remotas recientes y actividad reciente. Desde la actividad, las remotas y los tickets vinculados se pueden abrir actas para revisar checklist, vigiladores, firmas y evidencias.

Dirección también aprueba o rechaza las solicitudes de cambio de contraseña de otros usuarios. En la API puede consultar objetivos, vigiladores, usuarios y rutas, y aprobar cuentas creadas por Administración; esas funciones de catálogo y aprobación de cuentas **todavía no tienen una pantalla en los paneles actuales**.

**Ejercicio de capacitación:** revisar un objetivo con visitas por debajo de la meta, abrir una supervisión remota y leer su justificación; después ubicar una incidencia abierta de más de 48 horas y explicar a qué área corresponde.

## 6. Cómo se mueve la información

1. La web y la app móvil se autentican contra la misma API. La API aplica permisos por rol y consulta PostgreSQL.
2. El servidor entrega objetivos, vigiladores, secciones, preguntas, ajustes y observaciones. Las preguntas que ve el supervisor dependen del subtipo del objetivo y sus excepciones configuradas.
3. Al finalizar, el supervisor envía el acta. La API valida la ronda, recalcula la geocerca y guarda acta, vigiladores/firmas, respuestas, fotos y tickets en una transacción.
4. Administración lee los tickets y registra la resolución. Dirección consulta indicadores y actas a partir de lo que efectivamente llegó al servidor.
5. Si una ronda está en cola local, todavía puede faltar en los indicadores y en el panel de incidencias. Hay que confirmar su sincronización.

**Dato sensible:** los legajos incluyen información personal y disciplinaria. Usar cuentas individuales, no compartir contraseñas ni mostrar perfiles reales en capturas de capacitación. Las planillas históricas de ASI tienen un proceso de importación documentado en `IMPORTACION_DATOS.md`; su importación no debe darse por terminada solo porque exista el módulo.

## 7. Límites y estado para preparar la capacitación

- La guía describe lo que está implementado en el código al **05/10/2026**. No confirma por sí sola que haya usuarios, objetivos y vigiladores reales cargados ni que cada flujo haya sido probado en la instancia de producción. `DESPLIEGUE.md` registra la API y la base creadas, con usuarios reales y carga de datos aún pendientes al momento de redactarse.
- La web y la app nativa comparten API, pero **no son idénticas**. Usar capturas de la interfaz que efectivamente recibirá cada participante. El APK antiguo basado en Capacitor es otra envoltura de la web; `mobile/` es la app nativa React Native.
- La administración de catálogos, usuarios y rutas existe a nivel de API, sin pantalla actual para el personal. Confirmar el procedimiento operativo que ASI usará para esos cambios antes de impartir ese módulo como práctica.
- Las fotos son opcionales. Una ronda remota necesita justificación. Una ronda presencial necesita ubicación verificable y dentro de la geocerca según la validación del servidor.
- El PDF del acta puede generarse desde el resultado de la ronda en la web mediante impresión del navegador y desde la app nativa mediante compartir el PDF. La vista de acta histórica de Administración/Dirección permite consultarla; no presenta necesariamente el mismo botón de exportación.

## 8. Propuesta de capacitación (75–90 minutos)

| Bloque | Tiempo | Qué mostrar y practicar |
| --- | ---: | --- |
| Contexto y roles | 10 min | Objetivo, ronda, acta, ticket, permisos y diferencia entre enviado/en cola. |
| Supervisor | 35–40 min | Una ronda completa: objetivo y geocerca, vigiladores, B/R/M, observación, foto, firma y resultado. |
| Administración | 15 min | Búsqueda, filtros, auditoría del acta y resolución de una incidencia. |
| Dirección | 10–15 min | Cobertura mensual, casos críticos/antiguos, remotas y aprobación de claves. |
| Cierre | 5–10 min | Simular pérdida de señal, revisar pendientes y responder dudas. |

**Preparación:** usar datos de prueba sin información personal real; crear previamente cuentas de los tres roles, un objetivo con coordenadas y meta, al menos un vigilador asignado y un checklist; probar GPS, cámara y conexión de los dispositivos; preparar una incidencia R/M y una solicitud de cambio de clave. Si la instancia todavía no tiene esos datos, hacer la práctica en un entorno de prueba separado. No cargar `seed_demo.sql` en producción.

**Criterio de aprendizaje:** cada participante debe poder completar la acción principal de su rol y explicar cuándo un acta está únicamente en el teléfono y cuándo ya figura en el servidor.

## 9. Referencias del repo

- `asi_prototype.html`: pantallas web y flujo de ronda.
- `mobile/src/app/`: pantallas de la aplicación móvil nativa.
- `server.js`: reglas, permisos y endpoints de la API.
- `schema.sql`: entidades, plantillas y configuración.
- `PLANTILLAS_CHECKLIST.md`: contenido de las cinco plantillas.
- `PREGUNTAS_CLIENTE_CHECKLIST.md`: criterios pendientes de relevamiento con ASI.
- `DESPLIEGUE.md` e `IMPORTACION_DATOS.md`: estado de despliegue y migración de datos.

## 10. Prompt para Gamma

Subir `CAPACITACION_SISTEMA_GAMMA.docx` como fuente y pegar el texto de `PROMPT_GAMMA.txt` en Gamma. El prompt exige que Gamma diferencie funciones visibles, capacidades de API y asuntos pendientes.
