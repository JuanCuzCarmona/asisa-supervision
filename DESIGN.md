---
name: ASI · Argentina Seguridad Integral
description: Panel de supervisión de rondas de seguridad física — "Apple institucional": claro, sobrio, azul marino de marca, pensado para el pulgar en campo.
colors:
  marino: "#16256E"
  marino-accion: "#1F327C"
  marino-logo: "#2D4175"
  azul-enlace: "#2152A1"
  tinta-suave: "#4A5578"
  tinta-muda: "#6B7494"
  tinta-placeholder: "#8A93B0"
  linea-fuerte: "#B9C2DA"
  borde-control: "#CCD3E3"
  borde-campo: "#D5DAE6"
  linea: "#E2E6EF"
  linea-suave: "#EEF1F6"
  riel: "#E6EAF2"
  avatar: "#E6EAF5"
  seleccion: "#EEF1F8"
  hover: "#F7F8FC"
  fondo: "#F4F6FA"
  superficie: "#FFFFFF"
  bien: "#047857"
  bien-punto: "#10B981"
  bien-ink: "#065F46"
  bien-soft: "#D1FAE5"
  bien-tint: "#ECFDF5"
  regular: "#B45309"
  regular-ink: "#92400E"
  regular-soft: "#FEF3C7"
  mal: "#BE123C"
  mal-punto: "#F43F5E"
  mal-ink: "#9F1239"
  mal-soft: "#FFE4E6"
  mal-tint: "#FFF1F2"
  foto-placeholder: "#2A3350"
  noche-fondo: "#0A1233"
  noche-superficie: "#121C45"
  noche-linea: "#26336A"
  noche-borde: "#33407A"
  noche-tinta: "#F2F5FF"
  noche-tinta-suave: "#AEB8DA"
  noche-placeholder: "#7F8BB5"
  noche-accion: "#C1CBF3"
  noche-enlace: "#A9BBFF"
typography:
  metric:
    fontFamily: "Barlow, system-ui, sans-serif"
    fontSize: "40px"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "normal"
  clock:
    fontFamily: "Barlow, system-ui, sans-serif"
    fontSize: "36px"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "normal"
  display:
    fontFamily: "Barlow, system-ui, sans-serif"
    fontSize: "32px"
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "-0.01em"
  headline:
    fontFamily: "Barlow, system-ui, sans-serif"
    fontSize: "28px"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Barlow, system-ui, sans-serif"
    fontSize: "22px"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "normal"
  title-sm:
    fontFamily: "Barlow, system-ui, sans-serif"
    fontSize: "19px"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "normal"
  button:
    fontFamily: "Barlow, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "normal"
  body-lg:
    fontFamily: "Barlow, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 500
    lineHeight: 1.35
    letterSpacing: "normal"
  body:
    fontFamily: "Barlow, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.45
    letterSpacing: "normal"
  meta:
    fontFamily: "Barlow, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "normal"
  small:
    fontFamily: "Barlow, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "normal"
  label:
    fontFamily: "Barlow Semi Condensed, Barlow, sans-serif"
    fontSize: "13px"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.18em"
  watermark:
    fontFamily: "Barlow, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: 1.35
    letterSpacing: "normal"
rounded:
  chip: "13px"
  control: "12px"
  card: "14px"
  sheet: "22px"
  pill: "999px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "20px"
  xl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.marino-accion}"
    textColor: "#ffffff"
    rounded: "{rounded.card}"
    height: "56px"
  button-secondary:
    backgroundColor: "{colors.superficie}"
    textColor: "{colors.marino}"
    border: "1px solid {colors.borde-control}"
    rounded: "{rounded.card}"
    height: "56px"
  button-tinted:
    backgroundColor: "{colors.seleccion}"
    textColor: "{colors.marino}"
    rounded: "{rounded.card}"
    height: "52px"
  grouped-list:
    backgroundColor: "{colors.superficie}"
    border: "1px solid {colors.linea}"
    rounded: "{rounded.card}"
    rowMinHeight: "58px"
  input:
    backgroundColor: "{colors.superficie}"
    textColor: "{colors.marino}"
    border: "1px solid {colors.linea}"
    rounded: "{rounded.control}"
    height: "56px"
  badge:
    rounded: "{rounded.chip}"
    height: "26px"
    padding: "0 10px"
---

# Design System: ASI · Argentina Seguridad Integral

## Overview

**Creative North Star: "Apple institucional"**

ASI se ve como una app seria de una empresa seria: la claridad y la calma de iOS, con la sobriedad de una institución de seguridad y el azul marino de su propio logo. Es una herramienta que un supervisor abre en movimiento, con una mano, con guantes, de día a pleno sol o de noche. Un administrador y la dirección confían en ella para auditar. Nada de lo que hay en pantalla está para adornar: cada superficie, color y línea cumple una función.

Este sistema reemplazó en septiembre de 2026 al estilo anterior, que era claymorphism celeste con sombras dobles y botones que se hundían. El dueño lo sentía "poco serio" y "de poco valor". Se tomó como referencia a Apple (HIG: listas agrupadas, separadores finos, jerarquía por tamaño) y a empresas de defensa como Anduril y Palantir (sobriedad, etiquetas en mayúscula con espaciado). El canvas de referencia con todas las pantallas es el artefacto "ASI — Login institucional".

Explícitamente rechazado: claymorphism y sombras acolchadas, gradientes, estética "gamer/táctica" (negro con verde flúor), look de SaaS genérico, emojis como íconos.

**Key Characteristics:**
- Fondo gris azulado muy claro (`fondo`) con superficies blancas planas separadas por **líneas de 1px**, no por sombras.
- Un solo color de marca: el azul marino del logo, en tres tonos (texto, acción, enlace). Los tonos semánticos solo aparecen para estados reales.
- Tipografía Barlow, de la misma familia visual que la letra del logotipo, en pesos 400–600. La jerarquía se arma con tamaño, no con grosor extremo.
- Todo lo tocable mide 44px o más, y las acciones primarias del supervisor miden 56–58px y quedan fijas abajo, al alcance del pulgar.

## Marca

- **Logo oficial**: el caballero con estandarte, una barra vertical y "ARGENTINA / SEGURIDAD / INTEGRAL", tomado de argentinaseguridad.com.ar. Hay tres versiones:
  - `asi-lockup-navy.png`, el logotipo completo en `marino`, para fondos claros.
  - `asi-lockup-white.png`, el logotipo en blanco, para el login nocturno.
  - `asi-emblem-navy.png`, solo el caballero, para barras superiores y marcas de agua.
- En el login, el logotipo va centrado arriba, con un ancho de unos 204px, y debajo la etiqueta "PANEL DE SUPERVISIÓN".
- En las pantallas internas del celular se usa el emblema a 30px de ancho. En escritorio va el logotipo a 95px de ancho, seguido de un separador vertical y el nombre de la sección.
- Como marca de agua se usa el emblema a 4–5% de opacidad, recortado en una esquina. Solo va en el login.
- **Ícono de la app** (APK nativa y Capacitor): el emblema en blanco sobre un degradé vertical celeste inspirado en la bandera argentina, de `#74ACDF` (celeste bandera) arriba a `#2F7BBF` abajo, con una sombra suave bajo el caballero. El celeste puro de la bandera con el logo blanco da solo 2,5:1 de contraste, por eso el degradé baja a un celeste más profundo: donde está el caballero el contraste ronda 3,5–4,5:1. Es un ícono adaptativo: el fondo (`android-icon-background.png`) y el emblema (`android-icon-foreground.png`, al ~44% del lienzo para quedar dentro de la zona segura) van por separado. **La forma la impone el launcher** de cada celular (círculo en Pixel, cuadrado redondeado en Motorola/Samsung); no se puede fijar desde la app. Estos dos celestes son exclusivos del ícono: no se usan dentro de la interfaz, que sigue con el marino único. No se usa el logotipo completo, porque a tamaño de ícono el texto no se lee.
- Nunca se usa un ícono de escudo genérico en lugar del logo.

## Colors

### Marca (azul marino)
- **Marino** (`#16256E`): el color de todo el texto principal, de los títulos y de los íconos activos. Es el azul del sitio web oficial.
- **Marino Acción** (`#1F327C`): el fondo del botón primario, las barras de progreso y de datos, el estado seleccionado de radios y casillas, y el chip de filtro activo.
- **Marino Logo** (`#2D4175`): el tono exacto del emblema. Solo aparece dentro del logo.
- **Azul Enlace** (`#2152A1`): enlaces de texto ("¿Olvidaste tu contraseña?", "Cambiar", "Borrar firma") y el anillo de foco.

### Neutros
- **Tinta Suave** (`#4A5578`): subtítulos, etiquetas de fila y etiquetas en mayúscula. Da unos 7:1 sobre `fondo`.
- **Tinta Muda** (`#6B7494`): texto secundario de fila (dirección, legajo, área) y los íconos de los campos. Da unos 4.7:1 sobre blanco.
- **Placeholder** (`#8A93B0`): solo para el texto de ejemplo de los campos, nunca para contenido.
- **Líneas**:
  - `linea` (`#E2E6EF`): bordes de tarjeta y separadores de lista.
  - `linea-suave` (`#EEF1F6`): separadores dentro de una tarjeta.
  - `borde-campo` (`#D5DAE6`) y `borde-control` (`#CCD3E3`): bordes de botones secundarios y de áreas de texto.
  - `linea-fuerte` (`#B9C2DA`): borde de radios y casillas sin marcar.
- **Superficies**:
  - `fondo` (`#F4F6FA`): el fondo de la pantalla.
  - `superficie` (`#FFFFFF`): tarjetas y listas.
  - `seleccion` (`#EEF1F8`): fila seleccionada y botón tintado.
  - `hover` (`#F7F8FC`): hover en escritorio.
  - `riel` (`#E6EAF2`): fondo de barras de progreso y control segmentado.
  - `avatar` (`#E6EAF5`): círculo de iniciales.

### Semánticos (Bueno / Regular / Malo)
Cada tono se usa en tres intensidades:
- **Sólido**: botón Likert seleccionado y barras del acta.
- **Ink**: texto sobre el tono suave.
- **Soft**: fondo de los chips.

| | Sólido | Ink | Soft | Tinte |
|---|---|---|---|---|
| Bueno | `#047857` | `#065F46` | `#D1FAE5` | `#ECFDF5` |
| Regular | `#B45309` | `#92400E` | `#FEF3C7` | — |
| Malo | `#BE123C` | `#9F1239` | `#FFE4E6` | `#FFF1F2` |

Los puntos de estado usan tonos más vivos: `bien-punto` `#10B981` (en línea, dentro del geocerco) y `mal-punto` `#F43F5E` (fuera del geocerco).

### Noche
Es la variante oscura del login y la base del futuro modo nocturno de la app:
- Fondo `#0A1233`, superficies `#121C45` y líneas `#26336A` / `#33407A`.
- Texto `#F2F5FF` y texto secundario `#AEB8DA`.
- El botón primario se invierte: fondo `#C1CBF3` con texto `#0A1233`. Enlaces en `#A9BBFF`.

### Named Rules
**La Regla del Semáforo Honesto.** Verde, ámbar y rojo existen únicamente para codificar Bueno, Regular o Malo, el estado de un ticket, el geocerco o la conexión. Siempre van con texto o ícono, nunca como único portador del significado.

**La Regla del Marino Único.** Solo hay un color de marca. No se agregan violetas, celestes ni naranjas para "categorizar": las áreas (RRHH, Logística, etc.) se muestran como texto o como chip neutro (`seleccion` + `marino`).

## Typography

**Familia:** Barlow para toda la interfaz y Barlow Semi Condensed para las etiquetas en mayúscula. Ambas se cargan desde Google Fonts con los pesos 400, 500, 600 y 700. Las cifras llevan `font-variant-numeric: tabular-nums`.

**Character:** Barlow tiene el mismo aire de tipografía DIN que la letra del logotipo, así que la interfaz y la marca se sienten una sola cosa. Los pesos son moderados (600 para títulos y botones, 500 para las filas, 400 para el cuerpo), como en iOS. La presencia se logra con tamaño y espacio, no con negritas extremas.

### Hierarchy
- **Metric** (600, 40px, tabular): cifras de KPI en el dashboard.
- **Clock** (600, 36px, tabular): la hora en el inicio de ronda.
- **Display** (600, 32px, -0.01em): el título grande de cada pantalla ("Inicio de ronda", "Checklist", "Incidencias"). En el login es de 30px.
- **Headline** (600, 26–28px): el nombre de la entidad en una pantalla de detalle (vigilador, objetivo de la incidencia).
- **Title** (600, 22px): el título de una hoja o de un panel de detalle.
- **Title sm** (600, 19px): el título de las tarjetas del dashboard.
- **Button** (600, 18px): el texto del botón primario fijo abajo. Los botones de 52–56px usan 17px.
- **Body lg** (500–600, 17px): el título de fila de lista y el texto de los campos. Los campos llevan 17px para que Android no haga zoom.
- **Body** (400, 16px): párrafos, descripciones y valores de fila de detalle.
- **Meta** (500, 15px): enlaces, texto del resumen del botón fijo y columnas de tabla.
- **Small** (400, 14px): subtítulo de fila, fechas y textos de apoyo.
- **Label** (Semi Condensed 600, 13px, 0.18em, MAYÚSCULA): encabezados de grupo ("BARRIOS", "ASIGNADOS A ESTE OBJETIVO", "PASO 1 DE 5").
- **Watermark** (500–600, 12px): solo para la marca de agua de las fotos de evidencia.

### Named Rules
**La Regla del Mínimo de Campo.** No hay texto de lectura por debajo de 14px en el celular del supervisor. La excepción son las etiquetas en mayúscula de 13px, que tienen tracking ancho. Todo lo que el supervisor tiene que leer caminando mide 16px o más.

## Layout

- **Celular (supervisor, login y variantes móviles):** una sola columna con márgenes laterales de 20px (24px en el login). La estructura es siempre la misma:
  - Arriba, una barra de 56px con "‹ Atrás" a la izquierda y "Paso N de 5" a la derecha. En la pantalla de inicio, en cambio, va el emblema, el nombre del supervisor y el estado de conexión.
  - Una barra de avance de 5 segmentos.
  - El título grande.
  - El contenido, que es lo único que se desplaza.
  - Al final, una **barra de acción fija**: fondo blanco, línea superior, una línea de resumen y un botón primario de 58px.
- **Escritorio (Admin y Dirección):**
  - Barra superior blanca de 68px: logotipo, separador, nombre de sección y, a la derecha, conexión y usuario.
  - Contenido con padding de 28×32px, título grande y franja de indicadores.
  - Admin trabaja en modo maestro-detalle: tabla a la izquierda y panel de 400px a la derecha.
  - Dirección usa una grilla de 2fr/1fr y otra de 1fr/1fr.
- Hoy (web): Login y Supervisor quedan fijos en el marco de teléfono a cualquier ancho. Solo Admin y Dueño usan el layout ancho (`wide`, `device-wrap--wide`). No hay que "arreglar" esto.

## Elevation & Depth

Es un sistema **plano**. Las tarjetas no tienen sombra: se separan por el contraste entre `superficie` y `fondo`, más una línea de 1px. La sombra existe en dos casos:
- El segmento activo del control segmentado: `0 1px 3px rgba(22,37,110,.14)`.
- El overlay de las hojas inferiores: `rgba(12,20,52,.38)`, sin blur.

### Named Rules
**La Regla de la Línea, no la Sombra.** Si hay que separar algo, se usa una línea de 1px o un cambio de superficie. No se agregan sombras decorativas ni `backdrop-filter`, porque son caros en WebView Android y rompen la sobriedad.

## Shapes

Los bordes son redondeados y moderados, como en iOS:
- **Chip**: 13px (una píldora de 26px de alto).
- **Control**: 12px (campos, botones secundarios chicos, casillas y control segmentado).
- **Card**: 14px (tarjetas, listas agrupadas y botones de 52–58px).
- **Sheet**: 22px, solo en las dos esquinas superiores de las hojas inferiores.
- Los radios y los círculos de avatar son redondos.
- En la preview, el marco del teléfono lleva un radio de 44px.

## Components

### Botones
- **Primario**: fondo `marino-accion` y texto blanco en 600, con 56–58px de alto y radio de 14px. Hay uno solo por pantalla, en la barra de acción fija o al final del formulario.
- **Deshabilitado**: fondo `borde-campo` (`#D5DAE6`) con texto `tinta-suave`. El texto del botón explica qué falta ("Faltan 11 ítems", "Falta 1 firma", "Elegí un objetivo").
- **Secundario**: fondo blanco, borde de 1px `borde-control` y texto `marino`. Para acciones alternativas como "Ingresar con huella", "Galería" o "PDF".
- **Contorno marino**: borde de 1px `marino-accion` con texto `marino-accion`. Para una acción alternativa del mismo peso, como "Justificar supervisión remota" o "Agregar".
- **Tintado**: fondo `seleccion` con texto `marino`. Para "Cerrar" en las hojas y "Usar contraseña".
- **Texto**: color `azul-enlace`, 15px, 500, con un alto mínimo de 44px.
- **Presionado**: `transform: scale(.97)` o fondo `seleccion`. No se simula un botón que se hunde.

### Listas agrupadas (el componente central)
- Una tarjeta blanca con radio de 14px y borde `linea`, con las filas separadas por líneas de 1px.
- Las filas tocables miden entre 58px (campos) y 76–84px (objetivos, vigiladores), y llevan título en 17px/600 y subtítulo en 14px `tinta-muda`.
- **Selección**: el fondo de la fila pasa a `seleccion`, el radio o la casilla se rellenan de `marino-accion` con un check blanco, y el botón lleva `aria-pressed`.
- Sobre cada grupo va su etiqueta en mayúscula.

### Likert Bueno / Regular / Malo
- Tres botones de 52px en una grilla de 3 columnas, con la palabra completa.
- Sin seleccionar: fondo blanco, borde `borde-campo` y texto `marino`.
- Seleccionado: fondo sólido del tono semántico con texto blanco. Así se lee al sol y se acierta con guantes.
- Al elegir Regular o Malo se abre una hoja con las observaciones del catálogo filtradas por el área del ítem. La observación elegida queda como una fila debajo del ítem, con el texto "Ticket a {área}" y la opción "Cambiar".

### Campos
- Tarjeta blanca con borde `linea`, 56px de alto, radio de 12px, ícono de 20px en `tinta-muda` y texto de 17px.
- En el login, usuario y contraseña van en una sola lista agrupada, con la etiqueta a la izquierda (92px) como en los ajustes de iOS.
- Foco: un anillo de 3px en `azul-enlace`.

### Chips y badges
- 26px de alto, radio de 13px y texto de 13–14px en 600.
- Los chips de estado usan el tono soft con su ink.
- Los chips neutros (área, "Chofer B2") usan `seleccion` con `marino`.

### Control segmentado (escritorio)
Fondo `riel`, padding de 3px, radio de 11px. El segmento activo es blanco, con la sombra mínima y peso 600.

### Hojas inferiores (sheets)
Overlay `rgba(12,20,52,.38)`, hoja blanca con radio de 22px arriba, asa de 36×5px en `borde-campo`, título de 21–22px, subtítulo de 15px y una lista agrupada de opciones con filas de 58–64px.

### Datos (dashboard y acta)
- Las barras son de un solo tono `marino-accion` sobre `riel`, de 8px de alto y con extremos redondeados de 4px. El valor va escrito al costado.
- Lo que queda por debajo de la meta (<50%) se marca en `regular-ink` con ícono.
- La barra apilada de Bueno/Regular/Malo del acta separa sus segmentos con 2px y siempre lleva leyenda con cantidades.

### Íconos
Se dibujan con trazos al estilo lucide (1.7–2.2) y nunca se usan emojis. En la web se agregan al mapa `ICON_PATHS` del componente `Icon`.

## Motion

- **Entradas**: fade de 0.2s para overlays; hojas que suben en 0.32s con `cubic-bezier(.2,.8,.2,1)`; confirmaciones con un "pop" de escala de 0.3–0.5s.
- **Estados**: transiciones de color y fondo de 0.15–0.18s.
- **Sin rebotes decorativos** ni animaciones en bucle. Las únicas excepciones son el pulso de "En vivo" y el spinner de carga.
- Se respeta `prefers-reduced-motion`.

## Condiciones de campo (reglas no negociables)

Ver PRODUCT.md. El supervisor trabaja en shoppings, obras, barrios y plantas; de día al sol o de noche; con frío, guantes y tierra; con una mano. Cada pantalla del supervisor se valida contra estas reglas:
1. Objetivos táctiles de 44px como mínimo. Las filas de selección miden 76px o más y las acciones primarias 56–58px.
2. La acción principal queda siempre abajo, fija, al alcance del pulgar.
3. El texto de lectura mide 16px o más y el contraste es alto. Los estados se muestran con palabra más color.
4. Nada depende de gestos finos (swipe o long-press como única vía): siempre hay un botón visible.
5. El modo sin conexión es explícito: se ve cuántas actas hay en cola, que se reintenta cada 60 segundos y que están guardadas en el dispositivo.

## Do's and Don'ts

### Do:
- **Do** usar listas agrupadas y líneas de 1px para estructurar. Es la firma del sistema.
- **Do** mantener un solo botón primario por pantalla y escribir en el deshabilitado qué falta.
- **Do** usar el logo real de ASI en el login, en las barras y en el acta.
- **Do** mostrar números con `tabular-nums` y fechas en formato argentino (dd/mm/aaaa · hh:mm).

### Don't:
- **Don't** volver a claymorphism, sombras dobles, gradientes o botones que se hunden.
- **Don't** agregar colores de marca nuevos ni usar el verde, ámbar o rojo como decoración.
- **Don't** usar Inter, Roboto ni fuentes del sistema como fuente principal: la marca es Barlow.
- **Don't** usar `backdrop-filter: blur()`.
- **Don't** dibujar el bezel de teléfono falso en el build nativo (ver `PhoneFrame`).
