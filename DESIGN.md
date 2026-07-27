---
name: ASI · Argentina Seguridad Integral
description: Panel de supervisión de rondas de seguridad física — claymorphism azul, táctil y calmo.
colors:
  ink: "#0f172a"
  ink-soft: "#334155"
  ink-mute: "#5b6b82"
  ink-faint: "#64748b"
  guardia-azul-50: "#eff6ff"
  guardia-azul-100: "#dbeafe"
  guardia-azul-200: "#bfdbfe"
  guardia-azul-300: "#93c5fd"
  guardia-azul-400: "#60a5fa"
  guardia-azul-500: "#3b82f6"
  guardia-azul-600: "#2563eb"
  guardia-azul-700: "#1d4ed8"
  guardia-azul-800: "#1e40af"
  cielo-aqua-50: "#f0f9ff"
  cielo-aqua-100: "#e0f2fe"
  cielo-aqua-200: "#bae6fd"
  cielo-aqua-300: "#7dd3fc"
  cielo-aqua-400: "#38bdf8"
  cielo-aqua-500: "#0ea5e9"
  bien: "#10b981"
  bien-soft: "#d1fae5"
  bien-ink: "#065f46"
  regular: "#f59e0b"
  regular-soft: "#fef3c7"
  regular-ink: "#92400e"
  mal: "#f43f5e"
  mal-soft: "#ffe4e6"
  mal-ink: "#9f1239"
  plum: "#8b5cf6"
  plum-soft: "#ede9fe"
  plum-ink: "#5b21b6"
  tang: "#f97316"
  tang-soft: "#ffedd5"
  tang-ink: "#9a3412"
  surface: "#ffffff"
  surface-inset: "#eef5fd"
  page-bg: "#dbe9fa"
  page-bg-profundo: "#cddef5"
  azul-riel: "#bfd4ee"
  plum-claro: "#c4b5fd"
  regular-claro: "#fcd34d"
  mal-tint: "#fff1f2"
  bien-tint: "#ecfdf5"
  tang-tint: "#fff7ed"
typography:
  headline:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "25px"
    fontWeight: 900
    lineHeight: 1.15
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "21px"
    fontWeight: 900
    lineHeight: 1.15
    letterSpacing: "-0.01em"
  metric:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "34px"
    fontWeight: 900
    lineHeight: 1
    letterSpacing: "normal"
  body:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "15px"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "normal"
  meta:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "13px"
    fontWeight: 900
    lineHeight: 1.2
    letterSpacing: "normal"
  small:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "12px"
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: "normal"
  caption:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "11px"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "normal"
  label:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "10px"
    fontWeight: 900
    lineHeight: 1.2
    letterSpacing: "0.13em"
  micro:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "9px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "normal"
rounded:
  sm: "14px"
  clay-sm: "16px"
  md: "18px"
  lg: "22px"
  xl: "28px"
  sheet: "30px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "20px"
  xl: "24px"
components:
  button-primary:
    backgroundColor: "linear-gradient(to bottom right, {colors.guardia-azul-600}, {colors.guardia-azul-800})"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "14px 20px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink-mute}"
    rounded: "{rounded.md}"
    padding: "14px 20px"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: "{spacing.lg}"
  input:
    backgroundColor: "{colors.surface-inset}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "12px 14px"
  badge:
    rounded: "999px"
    padding: "4px 10px"
    typography: "{typography.label}"
---

# Design System: ASI · Argentina Seguridad Integral

## Overview

**Creative North Star: "La Consola del Puesto de Guardia"**

ASI se siente como el instrumento de una garita: calmo, ordenado, en el que confiás bajo presión sin que te grite encima. No es una landing que busca entusiasmar — es una herramienta que un supervisor abre en movimiento, con una mano, en luz variable, y en la que un admin confía para auditar después. La superficie claymorphism (blancos acolchados, sombras dobles suaves) transmite solidez sin frialdad: nada de vidrio esmerilado ni gradientes de startup, nada de rojo-alarma permanente. El color se raciona — el azul institucional domina, y los tonos semánticos (verde/ámbar/rojo del Likert B/R/M) aparecen solo cuando codifican un estado real, nunca como decoración.

Explícitamente rechazado: la estética de SaaS corporativo genérico (gradientes morado-azul, ilustraciones de stock, el look "Notion/Linear" que usa todo el mundo). ASI no compite por parecer una startup — compite por parecer un instrumento de trabajo confiable.

**Key Characteristics:**
- Superficies claymorphism blancas sobre fondo celeste — nunca fondo blanco puro ni gris neutro.
- Un solo acento dominante (azul institucional); los demás colores son semánticos, no decorativos.
- Tipografía Inter en negro (900) para toda jerarquía — no hay pesos livianos en la interfaz.
- Botones que se "hunden" físicamente al tocarlos — la sombra se invierte, no solo cambia de color.

## Colors

Paleta de un solo acento dominante sobre neutros fríos, con colores semánticos estrictamente reservados para estado.

### Primary
- **Azul Guardia** (`#2563eb` / `#3b82f6`): el acento institucional — CTAs primarios, ícono de marca, enlaces, foco. Se usa como gradiente `#2563eb → #1e40af` en botones primarios, nunca plano (ajustado desde `#3b82f6 → #1d4ed8` para que el extremo claro del gradiente cumpla contraste AA con texto blanco — ver Accessibility & Inclusion).

### Secondary
- **Cielo Aqua** (`#0ea5e9`): variante fría del azul — botones secundarios/informativos, íconos de wifi/conectividad, nunca compite con el azul primario en la misma pantalla.

### Tertiary
- **Violeta Institucional** (`#8b5cf6`) y **Naranja Alerta Suave** (`#f97316`): reservados para categorización de badges/áreas (ej. tipos de ticket) — nunca para acciones primarias.
- **Violeta Claro** (`#c4b5fd`) y **Ámbar Claro** (`#fcd34d`): no son colores nuevos, son el paso claro del gradiente diagonal (`135deg`) de Violeta Institucional y de Ámbar Regular respectivamente — el par que arma los avatares/tiles de ícono con tono `plum`/`warn` (`Avatar`, `PanelHeader`). Siempre van junto a su color base en el mismo gradiente, nunca solos.

### Neutral
- **Tinta** (`#0f172a`): texto principal, siempre negrita.
- **Tinta Suave** (`#334155`) / **Tinta Muda** (`#5b6b82`) / **Tinta Tenue** (`#64748b`): jerarquía descendente de texto secundario, subtítulos, placeholders. Tinta Tenue se oscureció desde `#94a3b8` (2.56:1 sobre blanco, fallaba WCAG AA 1.4.3) a `#64748b` (4.76:1) — se usa también en texto legible pequeño (overline de `Label`, hints), no solo en placeholders decorativos, así que necesitaba pasar el umbral de 4.5:1.
- **Superficie** (`#ffffff`): fondo de toda tarjeta `.clay`.
- **Superficie Hundida** (`#eef5fd`): fondo de inputs y áreas `.clay-inset`.
- **Fondo de Página** (`#dbe9fa`): nunca blanco puro — el celeste de fondo es lo que hace que las superficies blancas floten.
- **Celeste Profundo** (`#cddef5`): parada más profunda del gradiente radial de fondo de pantalla completa (`PhoneFrame`) — el fondo no es un color plano, es `#f0f7ff → #dbe9fa → #cddef5` desde el centro hacia el borde. Solo aparece como stop de ese gradiente, nunca como color sólido de superficie.
- **Azul Riel** (`#bfd4ee`): color del thumb del scrollbar (`::-webkit-scrollbar-thumb`) — chrome utilitario, no decoración de marca; deliberadamente discreto para no competir con el Azul Guardia.
- **Rosa Alerta** (`#fff1f2`) / **Verde Menta** (`#ecfdf5`) / **Durazno Suave** (`#fff7ed`): paradas claras de los gradientes de tinte (`tint`, `135deg`) que dan fondo ambiental a una tarjeta `Clay` según el estado que resume — rosa cuando hay críticas/bloqueo, menta cuando está todo en orden, durazno cuando hay tickets por generar. Siempre emparejadas con su `-soft` semántico correspondiente (`#ffe4e6`, `#d1fae5`, `#ffedd5`) como segunda parada del gradiente — nunca un color de fondo de tarjeta sólido.

### Named Rules
**La Regla del Semáforo Honesto.** Verde (`#10b981`), ámbar (`#f59e0b`) y rojo (`#f43f5e`) existen únicamente para codificar el resultado Bien/Regular/Mal de un ítem de checklist o el estado de un ticket. Nunca se usan como color decorativo de marca ni en elementos sin estado real que representar.

**La Regla de Racionamiento del Acento.** El azul primario aparece en como mucho una acción por pantalla (el botón/CTA principal) más elementos de marca fijos (logo, foco). Si dos elementos compiten por el mismo azul, uno de los dos está mal jerarquizado.

## Typography

**Body/UI Font:** Inter (con system-ui, -apple-system, sans-serif como fallback)
**Mono/Numérico:** Inter con `font-variant-numeric: tabular-nums` (clase `.tnum`) para relojes, KPIs y cualquier cifra que deba alinearse verticalmente.

**Character:** Una sola familia tipográfica cargada en pesos 400–900, usada casi exclusivamente en su extremo más pesado (700–900). No hay pares de fuentes — la jerarquía se construye con tamaño, no con familia.

### Hierarchy
- **Headline** (900, 25px, leading 1.15): título de marca/pantalla principal ("Argentina Seguridad" en el login).
- **Title** (900, 21px, leading 1.15): encabezado de sección (`SH` — título + subtítulo de cada bloque de contenido).
- **Metric** (900, 34px, leading 1, tabular): cifras grandes destacadas — reloj, KPIs, porcentajes de avance. Rol propio fuera de la jerarquía Material estándar porque el producto se apoya mucho en números que hay que leer de un vistazo.
- **Body** (600, 15px, leading 1.4): texto de input, contenido de tarjeta, cuerpo general.
- **Meta** (900, 13px, leading 1.2): título de fila de lista (vigilador, objetivo, ticket) y sub-encabezado dentro de una tarjeta ya densa — la segunda cifra en peso más usada del sistema después de Body.
- **Small** (700, 12px, leading 1.4): texto descriptivo de segundo nivel dentro de una tarjeta (descripciones de checklist, historial, observaciones) — un escalón por debajo de Body cuando el contenido es de apoyo, no la acción principal.
- **Caption** (700, 11px, leading 1.3): el paso de texto secundario más reutilizado del sistema (chips de estado, hints de formulario, texto de estado de sincronización). Puntualmente aparece en mayúscula con tracking ancho para sub-encabezados de rol (`PanelHeader`); el tratamiento normal (oración, sin tracking) es el uso por defecto.
- **Label** (900, 10px, tracking 0.13em, uppercase): overline/etiqueta de campo — siempre mayúscula.
- **Micro** (700, 9px, leading 1.2): la etiqueta más pequeña de la pantalla — badges compactos en filas densas (chips de sección, IDs monoespaciados de ticket, timestamps de actividad). Uso puntual y siempre en contenido ya identificado por contexto inmediato.

### Named Rules
**La Regla del Negro Sostenido.** Casi nada de peso 400/500 en la interfaz: incluso el texto secundario es 600+. La jerarquía se lee por tamaño y color de tinta, no por adelgazar el trazo — eso mantiene la app legible con sol directo o guantes puestos.

**La Regla de los Nueve Escalones.** El ramp tipográfico completo es 9px → 10px → 11px → 12px → 13px → 15px → 21px → 25px → 34px — nueve pasos, todos en Inter, todos 700+. Un tamaño literal fuera de este ramp (`text-[Npx]` con un valor no listado) es drift, no una excepción legítima: o se ajusta al escalón más cercano, o se documenta acá como paso nuevo.

## Layout

Contenedor de ancho fijo tipo teléfono (max-width 392px en la preview de escritorio; en el build nativo Android ocupa el ancho real del dispositivo edge-to-edge, ver Do's and Don'ts). Ritmo vertical denso: bloques de contenido separados por `gap-3`/`gap-4` (12–16px), tarjetas con padding interno de 16–20px. Los flujos multi-paso (wizard de ronda del supervisor) usan una sola columna, sin grillas — cada pantalla resuelve una tarea a la vez.

## Elevation & Depth

Sistema **acolchado (claymorphism)**, no plano y no basado en capas tonales Material. La profundidad es ambiental — casi todas las superficies llevan sombra doble en reposo (una sombra azulada hacia abajo-derecha + un highlight blanco hacia arriba-izquierda), no solo en hover. La interacción invierte la sombra hacia adentro (`inset`) en vez de solo oscurecer el color — el botón físicamente se hunde al tocarlo.

### Shadow Vocabulary
- **Clay** (`8px 8px 18px rgba(37,99,235,.10), -6px -6px 14px rgba(255,255,255,.95), inset -1px -1px 2px rgba(191,219,254,.30), inset 1px 1px 2px rgba(255,255,255,.90)`): tarjeta/contenedor estándar — la sombra más presente del sistema.
- **Clay Sm** (`5px 5px 12px rgba(37,99,235,.09), -4px -4px 10px rgba(255,255,255,.92)`): superficies secundarias/compactas, menos elevación que Clay.
- **Clay Inset** (`inset 5px 5px 11px rgba(37,99,235,.11), inset -5px -5px 11px rgba(255,255,255,.95)`): campos hundidos (inputs, áreas de "lectura", no de "acción").
- **Clay Btn reposo** (`6px 6px 14px rgba(37,99,235,.13), -4px -4px 11px rgba(255,255,255,.92)`): botón sin presionar.
- **Clay Btn presionado** (`inset 4px 4px 10px rgba(15,23,42,.16), inset -3px -3px 8px rgba(255,255,255,.35)`): mismo botón al tocarlo — la sombra se invierte, más `transform: translateY(2px) scale(.982)`.

### Named Rules
**La Regla del Hundimiento Físico.** Ningún elemento interactivo cambia de estado solo con color u opacidad — el par sombra-exterior/sombra-interior más una traslación de 1–2px es lo que comunica "esto es tocable y esto ya lo toqué".

## Shapes

Radios grandes y consistentes, nunca esquinas vivas. Escala: `sm` 14px (botones chicos), `clay-sm` 16px (superficie `.clay-sm`, tarjeta secundaria/compacta), `md` 18px (botones estándar, inputs), `lg` 22px (tarjetas), `xl` 28px (contenedores destacados), `sheet` 30px (esquina superior de bottom sheets/modales — solo las dos esquinas de arriba, `30px 30px 0 0`, porque el sheet nace pegado al borde inferior de la pantalla). Nada de bordes duros — cuando hace falta separar visualmente, se usa un `ring` semitransparente (ej. `ring-2 ring-bad/40` en error de input), no un borde sólido.

## Components

### Buttons
- **Shape:** `rounded-[18px]` en tamaño estándar (14–22px según tamaño, ver escala Shapes).
- **Primary:** gradiente `#2563eb → #1e40af`, texto blanco, negrita, tracking ajustado. Sombra Clay Btn en reposo. (Oscurecido desde `#3b82f6 → #1d4ed8`: el extremo claro daba 3.68:1 con texto blanco, insuficiente en tamaño `sm` — 12px, no califica como texto grande. Los dos extremos nuevos dan ≥5.17:1.)
- **Variantes semánticas:** `success`/`danger`/`warn` reemplazan el gradiente por su color semántico correspondiente — `emerald-700 → emerald-800`, `rose-600 → rose-800`, `amber-700 → amber-800` respectivamente (no el tono `DEFAULT` plano, que igual que el primary original no alcanzaba 4.5:1 con texto blanco) — mismo tratamiento de sombra y tacto.
- **White/Soft/Ghost:** para acciones secundarias — `white` es superficie blanca con texto tinta, `soft` es tinte azul clarito (`brand-50`) con texto azul oscuro, `ghost` no lleva sombra (única excepción a la Regla del Hundimiento Físico, reservado para acciones terciarias de bajo peso visual).
- **Presionado:** sombra invertida + `translateY(2px) scale(.982)` (ver Elevation).
- **Disabled:** gris (`slate-200`/`slate-400`), sombra Clay Btn atenuada, `cursor: not-allowed`.
- **Focus:** anillo sólido `3px solid #2563eb` con `outline-offset: 3px` — nunca se pierde el foco por accesibilidad de teclado/lector.

### Badges (chips de estado)
- **Style:** `rounded-full`, fondo `-soft` del tono semántico + texto `-ink` del mismo tono (ej. `bien-soft` + `bien-ink`), 11px negrita.
- **Uso:** codificar estado (resultado de checklist, estado de ticket, área responsable) — nunca decorativo.

### Cards / Containers (`Clay`)
- **Corner Style:** 22px (`rounded-clay` / clase `.clay`).
- **Background:** blanco (`#ffffff`) por defecto; `#eef5fd` en variante `inset`.
- **Shadow Strategy:** ver Elevation — Clay en reposo, Clay Inset para contenido "hundido" (no accionable).
- **Border:** ninguno — la separación es 100% por sombra, nunca por línea.
- **Internal Padding:** 16–20px.

### Inputs / Fields
- **Style:** superficie `clay-inset` (hundida), radio 18px, ícono opcional a la izquierda, texto 15px semibold.
- **Focus:** el contenedor `.clay-inset` gana el mismo anillo de foco que los botones (`outline: 3px solid #2563eb; outline-offset: 2px`) vía `:focus-within` — el `<input>`/`<textarea>` interno sigue en `outline: none`, pero el contenedor ya no confía solo en la sombra hundida para señalar foco (WCAG 2.4.7).
- **Error:** `ring-2 ring-bad/40` alrededor del contenedor + texto de error 11px en `mal-ink` con ícono de alerta debajo.
- **Label:** overline 10px mayúscula tracking ancho, siempre arriba del campo, nunca flotante.

### Navigation
No hay barra de navegación persistente — el producto es un wizard lineal por rol (Supervisor: 5 pasos; Admin/Dueño: paneles con `SH` como encabezado de sección, sin tabs globales). El "volver" es siempre una acción explícita en el header del paso, no un patrón de tabs/drawer.

## Do's and Don'ts

### Do:
- **Do** usar la sombra doble Clay en cualquier superficie de reposo nueva — es la firma visual del sistema, no un detalle opcional.
- **Do** reservar bien/regular/mal (verde/ámbar/rojo) exclusivamente para estado real — nunca para jerarquía visual o decoración.
- **Do** mantener el texto en 600+ de peso siempre — la legibilidad en exteriores con luz variable depende de esto (ver PRODUCT.md, Operating Context).
- **Do** hacer que cada elemento tocable "se hunda" (sombra invertida + traslación) al presionarse.

### Don't:
- **Don't** introducir gradientes morado-azul de SaaS genérico ni la estética "Notion/Linear" — es la anti-referencia explícita del producto.
- **Don't** usar rojo/ámbar/verde fuera de su rol semántico (nunca como accent decorativo de marca).
- **Don't** dibujar el bezel de teléfono falso (marco + barra de estado simulada) en el build nativo Android — ahí el dispositivo real ya tiene su propia barra de estado; esa chrome es solo para la preview de escritorio (`PhoneFrame`, ver `asi_prototype.html`).
- **Don't** usar `backdrop-filter: blur()` de forma libre — es costoso de renderizar en WebViews Android de gama media/emuladores y ya se retiró una vez del overlay de modales por esta razón; si hace falta separar un overlay del fondo, subir la opacidad del negro en vez de agregar blur.
