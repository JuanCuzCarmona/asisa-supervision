# Relevamiento con el cliente — Checklist por objetivo

**Proyecto:** ASI · Panel de Supervisión
**Objetivo de la reunión:** obtener la información necesaria para que cada objetivo (barrio, industria, local, oficina) tenga su propio checklist de ronda.

---

## Cómo usar este documento

Está ordenado por bloques. **El Bloque 0 no se pregunta: se comunica** — es la definición de cómo se estructura el checklist, ya resuelta e implementada.

Los bloques 1 a 4 son los imprescindibles para empezar a cargar datos reales. Los bloques 5 a 10 se pueden completar en una segunda reunión.

Al final hay una **planilla en blanco** para llenar objetivo por objetivo. Lo ideal es pedirle al cliente que la complete en Excel: una fila por ítem de checklist.

---

## Contexto: cómo funciona hoy el sistema

Conviene explicarle esto al cliente antes de preguntar, para que las respuestas vengan en el formato correcto.

Hoy el checklist está armado con **19 ítems** repartidos en **4 secciones**: Elementos de seguridad, Comprobación de habilidades, Logística/Infraestructura y RRHH/Personal. Cada ítem tiene:

- un **título corto** (lo que el supervisor ve en la pantalla, ej. "Cámaras activas");
- un **criterio completo** (el detalle que aparece al mantener presionado, ej. "Todas las cámaras deben mostrar imagen en vivo, sin pérdida de señal ni lentes obstruidos");
- un **área responsable** (a dónde va el ticket si sale mal);
- y una lista de **tipos de objetivo** donde ese ítem aplica.

El supervisor evalúa cada ítem como **Bueno / Regular / Malo**. Si marca Regular o Malo tiene que elegir una observación de un catálogo, y eso genera un ticket automático al área correspondiente.

Hoy el filtrado es **por tipo de objetivo** (5 categorías). Lo que se está pidiendo es bajarlo a **nivel de cada objetivo puntual**.

---

# BLOQUE 0 — Cómo se arma el checklist *(ya resuelto — no hace falta preguntarlo)*

Esta decisión ya está tomada e implementada. **No es una pregunta para el cliente: es una definición técnica que se le comunica.** Se explica acá para que puedas defenderla si pregunta.

### 0.1 El modelo elegido: plantilla base + ajustes por objetivo

Cada objetivo **hereda una plantilla según su tipo de servicio** (barrio multipuesto, barrio unipersonal, local comercial, industria, oficinas) y sobre esa base se le aplican solo **sus diferencias**:

- **quitar** un ítem de la plantilla que en ese objetivo no aplica;
- **sumar** un ítem que su plantilla no trae;
- **sumar un ítem exclusivo**, que no existe en ninguna plantilla y solo se usa en ese objetivo.

Se descartó la alternativa de escribir una lista completa e independiente por objetivo. Suena más flexible, pero da exactamente la misma flexibilidad con mucho más trabajo: ítems como uniforme, credencial o puntualidad se repiten en todos los objetivos, y cambiar un criterio obligaría a corregirlo uno por uno, con el riesgo de que queden versiones distintas conviviendo.

**Ya está funcionando en el sistema.** Ejemplo real cargado hoy: *Shopping Norte* y *Local Comercial Av. Corrientes* son los dos "local comercial" y comparten la misma plantilla, pero la ronda muestra checklists distintos:

| | Shopping Norte | Local Av. Corrientes |
|---|---|---|
| Ítems que evalúa | 16 | 12 |
| Ajustes propios | suma Estado del móvil, Garitas y portones y Control de acceso a cocheras | quita Botón de pánico (lo gestiona el edificio) |

> **Qué preguntarle al cliente entonces:** no *cómo* estructurar esto, sino **cuáles son los ajustes de cada objetivo**. Es decir: partiendo de la plantilla de su tipo, ¿qué le sobra y qué le falta a cada lugar? Esa es la pregunta del Bloque 4 y es mucho más fácil de responder para él que una lista en blanco.

### 0.2 ¿Quién carga y mantiene los checklists?

- ¿Lo hace la administrativa desde un panel, o lo cargamos nosotros una única vez?
- Si lo hace la administrativa: ¿necesita poder crear ítems nuevos, o solo activar/desactivar los existentes?

**Respuesta:** `_______________________________________________`

### 0.3 ¿Cada cuánto cambia un checklist?

- ¿Cambia cuando se firma un contrato nuevo? ¿Cuando el cliente reclama algo?
- ¿Hay que guardar el historial? Es decir: si un acta se hizo en marzo con un checklist viejo, ¿al reimprimirla tiene que mostrar los ítems de marzo o los de hoy?

**Respuesta:** `_______________________________________________`

---

# BLOQUE 1 — Inventario de objetivos

### 1.1 Lista completa

- ¿Cuántos objetivos activos hay hoy? (hoy el sistema tiene 7 de ejemplo)
- **Pedir el listado completo en Excel.**
- ¿Con qué frecuencia se dan de alta o de baja objetivos?

### 1.2 Por cada objetivo, necesitamos:

| Dato | Para qué se usa |
|---|---|
| Nombre formal (como figura en el contrato) | Encabezado del acta |
| Dirección completa | Acta y navegación |
| Coordenadas GPS (lat/long) | Validación del geocerco |
| Tipo de servicio | Barrio / Industria / Local / Oficina / otro |
| ¿Unipersonal o multipuesto? | Define si el checklist se evalúa una vez o por puesto |
| Cantidad de puestos de vigilancia | Sectorización |
| Turnos que cubre (mañana/tarde/noche, 12x12, 24hs) | Define si hay ítems por turno |
| ¿Tiene movilidad asignada? | Activa o no la sección de móvil |
| ¿Tiene garita? | Activa ítems de infraestructura |
| ¿Tiene cámaras? ¿Cuántas? ¿DVR o NVR? | Activa ítems de tecnología |
| ¿Tiene botón de pánico? | Activa ese ítem |
| ¿Tiene portón automático / barrera? | Activa ese ítem |
| ¿Requiere recorrido perimetral? | Define si hay control de recorrido |
| ¿El vigilador va armado? | Ítems de portación |

### 1.3 Preguntas sueltas

- ¿Hay objetivos que son "especiales" y no entran en ninguna categoría?
- ¿Algún objetivo tiene requisitos del cliente final que haya que verificar sí o sí en cada ronda?

---

# BLOQUE 2 — Geocerca y modo remoto

### 2.1 Radio del geocerco

- ¿Qué radio en metros corresponde a cada objetivo? (hoy: 120 m para un local chico, 500 m para una planta)
- ¿Alguno tiene una superficie tan grande que el radio circular no sirve?

### 2.2 Reglas de la supervisión remota

- ¿Se permite ronda remota en **todos** los objetivos, o hay algunos donde el contrato exige presencia física siempre?
- ¿Hay un límite? Ej: "no más de 2 remotas por mes por objetivo".
- ¿Quién autoriza una remota, o alcanza con que el supervisor la justifique por escrito?
- Si el GPS falla o el celular no tiene señal, ¿qué debería hacer el supervisor?

---

# BLOQUE 3 — Frecuencia de visitas

### 3.1 Meta mensual

- ¿Cuántas visitas por mes corresponden a cada objetivo?
- ¿Cómo se calcula ese número? (el PRD menciona volumen de horas, proximidad, exigencia del contrato y dificultad del objetivo — ¿hay una fórmula o se define a criterio?)

### 3.2 Reglas del contador

- El contador se reinicia el **1 de cada mes** — ¿se confirma?
- ¿Una ronda **remota** cuenta para la meta mensual, o solo cuentan las presenciales?
- ¿Dos rondas al mismo objetivo el mismo día cuentan como dos?
- ¿Hay objetivos con un mínimo garantizado por contrato? ¿Cuáles y cuánto?

---

# BLOQUE 4 — El checklist en sí *(el núcleo)*

### 4.1 Estructura

- Las 4 secciones actuales (Seguridad / Habilidades / Logística / RRHH) — ¿sirven así o hay que agregar, sacar o renombrar alguna?
- ¿El orden en que aparecen tiene lógica operativa? (¿el supervisor recorre en ese orden?)

### 4.2 Los ajustes de cada objetivo *(la pregunta central de la reunión)*

Como cada objetivo parte de la plantilla de su tipo (ver Bloque 0), lo que hay que relevar es **la diferencia**, no la lista completa:

- Mostrale la plantilla de su tipo de servicio impresa.
- Por cada objetivo, preguntá: **¿qué de esto no aplica acá?** y **¿qué falta que sea propio de este lugar?**

Es mucho más fácil de responder que una hoja en blanco, y evita que se olvide de ítems obvios.

### 4.3 Los ítems — lo que hay que pedir sí o sí

**Por cada ítem del checklist necesitamos cinco cosas:**

1. **Título corto** — lo que se ve en el celular. Máximo ~35 caracteres.
2. **Criterio completo** — el detalle de qué hay que verificar. Es lo que evita que cada supervisor evalúe distinto.
3. **Área responsable** — a dónde va el ticket si sale Regular o Malo.
4. **A qué objetivos aplica** — todos, un tipo, o solo objetivos puntuales.
5. **¿Es obligatorio?** — ¿se puede cerrar una ronda sin evaluarlo?

> **Ojo con esto:** el criterio completo es lo que más suelen resistirse a escribir, y es lo que más valor tiene. Sin criterio escrito, "uniforme completo" significa una cosa para un supervisor y otra para otro, y los datos no sirven para comparar objetivos.

### 4.4 Preguntas sobre la mecánica

- ¿Cuántos ítems es razonable por ronda? Si hoy la ronda en papel tarda X minutos, el objetivo es no pasarse de ahí.
- **En objetivos multipuesto:** ¿hay ítems que se evalúan **una vez por objetivo** (cámaras, portón) y otros **una vez por cada vigilador** (uniforme, credencial)? Esto es importante porque cambia cómo se guarda la respuesta.
- ¿Hay ítems que solo aplican en ciertos turnos? Ej: "iluminación perimetral" solo tiene sentido de noche.
- ¿Hay ítems que solo aplican ciertos días? Ej: control de proveedores solo días hábiles.
- ¿Hay ítems estacionales o por campaña?

### 4.5 Ítems que hoy existen — validar uno por uno

Conviene repasar la lista actual con el cliente y marcar qué queda, qué se va y qué falta:

**Elementos de seguridad:** Uniforme completo · Credencial visible y vigente · Elementos reglamentarios · Elementos de protección personal

**Comprobación de habilidades:** Protocolo de emergencia · Manejo de radio · Procedimiento ante intrusión · Identificación de zonas de riesgo · Protocolo de control de acceso

**Logística / Infraestructura:** Estado del móvil · Cámaras activas · DVR/NVR operativo · Botón de pánico · Garitas y portones

**RRHH / Personal:** Puntualidad · Presentación personal · Estado de alerta · Conducta y trato · Comunicación con supervisión

---

# BLOQUE 5 — Escala de evaluación y observaciones

### 5.1 La escala

- ¿Bueno / Regular / Malo alcanza, o hace falta un **"No aplica"**? (ej: el objetivo tiene móvil pero ese día no estaba en el puesto)
- **¿Cuál es la diferencia concreta entre Regular y Malo?** Pedir 2 o 3 ejemplos reales de cada uno. Sin esto, la calificación va a ser inconsistente entre supervisores.

### 5.2 Catálogo de observaciones

Hoy hay 24 observaciones predefinidas repartidas en 5 áreas. Hay que validarlas y completarlas.

- ¿Falta alguna observación frecuente?
- ¿Alguna está mal asignada de área?
- ¿Se permite que el supervisor escriba texto libre, o hay que forzar que elija del listado? (hoy puede hacer las dos cosas)

### 5.3 Evidencia fotográfica

- ¿La foto es **obligatoria** cuando se marca Malo? ¿Y cuando se marca Regular?
- ¿Hay ítems donde la foto es obligatoria siempre? (ej: estado del móvil)
- ¿Cuántas fotos por ronda como máximo?

---

# BLOQUE 6 — Áreas responsables y tickets

### 6.1 Las áreas

- Confirmar las 5 áreas actuales: **Logística, Supervisión, Operaciones, RRHH, Mantenimiento**. ¿Falta alguna? ¿Sobra alguna?
- ¿Quién es el responsable de cada área? Nombre, mail y teléfono.

### 6.2 Circuito del ticket

- ¿Cómo se entera el área de que le llegó un ticket? ¿Mail, WhatsApp, o entrando al panel?
- ¿Hay un **plazo de resolución** esperado por área o por gravedad? (ej: Malo se resuelve en 48hs, Regular en 7 días)
- ¿Quién puede cerrar un ticket? ¿Solo el área responsable, la administrativa, o cualquiera?
- ¿Se puede rechazar o reasignar un ticket a otra área?
- ¿Hay que avisarle al supervisor que reportó cuando su ticket se resuelve?

### 6.3 Reincidencia

- Si el mismo ítem sale Malo tres veces seguidas en el mismo objetivo, ¿tiene que pasar algo automáticamente? (alerta a gerencia, escalamiento, sanción)
- ¿La reincidencia se mide por objetivo, por vigilador, o por las dos cosas?

---

# BLOQUE 7 — Vigiladores

### 7.1 Origen de los datos

- ¿De dónde salen hoy los datos de los vigiladores? ¿Hay un sistema, un Excel, o papel?
- ¿Se puede exportar? ¿En qué formato?
- ¿Con qué frecuencia se actualiza (altas, bajas, cambios de objetivo)?

### 7.2 Datos del legajo

Hoy el sistema guarda: legajo, nombre, DNI, puesto, credencial y vencimiento, si es chofer, categoría y vencimiento de licencia, si está armado, si tiene radio, estado, teléfono, domicilio, fecha de nacimiento, nacionalidad, convenio y objetivo asignado.

- ¿Falta algún dato que el supervisor necesite ver en campo?
- ¿Se va a cargar **foto** del vigilador? (el PRD la pide para verificar identidad presencial)
- ¿Qué estados puede tener? (hoy: activo / baja temporal / suspendido)

### 7.3 Sanciones

- ¿Qué tipos de sanción existen? (apercibimiento, suspensión, otras)
- Estados posibles: ¿activa / cumplida / apelada alcanza?
- ¿El supervisor puede **ver** las sanciones previas, o solo la administración?

---

# BLOQUE 8 — Recorridos y sectorización *(objetivos multipuesto)*

- Por cada objetivo multipuesto: ¿cuáles son los sectores o puestos? (nombre de cada uno)
- ¿El supervisor tiene que recorrer un circuito definido, o va libremente?
- ¿Hay que **registrar el recorrido por GPS**? El PRD lo menciona para barrios multipuesto — hay que confirmar si es un requisito real o deseable.
- ¿Hay puntos de control físicos (llaves, códigos QR, NFC)?

---

# BLOQUE 9 — Usuarios y accesos

- ¿Cuántos supervisores van a usar la app? Nombre y legajo de cada uno.
- ¿Cada supervisor tiene objetivos asignados, o cualquiera puede supervisar cualquier objetivo?
- ¿Quiénes acceden al panel administrativo? ¿Y al dashboard de gerencia?

---

# BLOQUE 10 — Operación actual y valor legal

Estas preguntas ayudan a validar que el diseño sea realista.

- ¿Cuánto tarda hoy una ronda con planilla de papel? (el PRD dice que la app tiene que ser más rápida)
- ¿Qué se hace hoy con el acta en papel? ¿Se archiva, se escanea, se manda a alguien?
- ¿El acta tiene que tener **valor legal**? ¿La firma digital en pantalla alcanza, o hace falta algo más?
- ¿El acta se le envía al **cliente final** (el barrio, la industria)? Si sí, ¿en qué formato y con qué frecuencia?
- ¿El cliente final va a tener acceso al sistema en algún momento?

---

# Planilla para completar — un objetivo por hoja

**Pedirle al cliente que la complete en Excel.** Una fila por ítem de checklist.

### Cabecera del objetivo

| Campo | Valor |
|---|---|
| Nombre del objetivo | |
| Dirección | |
| Coordenadas GPS | |
| Tipo de servicio | |
| Unipersonal / Multipuesto | |
| Cantidad de puestos | |
| Turnos | |
| Radio de geocerca (m) | |
| Visitas por mes | |
| ¿Tiene movilidad? | |
| ¿Tiene garita? | |
| ¿Cámaras? ¿cuántas? | |
| ¿DVR/NVR? | |
| ¿Botón de pánico? | |
| ¿Portón automático? | |
| ¿Recorrido perimetral? | |

### Ítems del checklist

| # | Sección | Título corto | Criterio completo (qué verificar) | Área responsable | ¿Obligatorio? | ¿Por puesto o por objetivo? | ¿Solo en algún turno? |
|---|---|---|---|---|---|---|---|
| 1 | | | | | | | |
| 2 | | | | | | | |
| 3 | | | | | | | |
| 4 | | | | | | | |
| 5 | | | | | | | |

---

## Qué llevar a la reunión

- El prototipo funcionando en el celular — mostrar una ronda completa de punta a punta. Es mucho más rápido que explicarlo.
- La lista de los 19 ítems actuales impresa, para tacharla y corregirla en vivo.
- Las 24 observaciones predefinidas, para validar.
- **`PLANTILLAS_CHECKLIST.md` impreso** — tiene las 5 plantillas completas, la matriz de qué ítem va en cada una, los ajustes ya cargados por objetivo y una hoja en blanco para relevar objetivo por objetivo. Es la base sobre la que se trabaja el Bloque 4.

## Prioridad si la reunión se corta

Si hay poco tiempo, lo que **no puede faltar** es:

1. El listado completo de objetivos con su tipo y características (Bloque 1).
2. Los ajustes de cada objetivo contra la plantilla de su tipo (Bloque 4.2).
3. El criterio escrito de cada ítem, aunque sea de un solo objetivo piloto (Bloque 4.3).

Con eso alcanza para avanzar. El resto se puede ir completando después.
