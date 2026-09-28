# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

<!-- Nota: el mismo bundle se empaqueta para Android vía Capacitor (`www/` + `android/`).
     El lenguaje visual es propio y único para web y Android — no Material 3.
     INFERIDO: el usuario no respondió esta pregunta; corregir si se decide lo contrario. -->

## Users

- **Supervisor de campo** — usuario primario. Recorre objetivos (barrios, plantas, locales,
  oficinas) haciendo rondas de control. **Opera el teléfono con una sola mano, parado o
  caminando**, con la otra mano ocupada. Es quien completa el flujo de 5 pasos y firma el acta.
- **Administrador** — resuelve los tickets de incidencia que generan las rondas y consulta KPIs.
- **Dueño** — lectura: KPIs, actividad y tickets, sin poder de resolución.

Los tres roles se mapean 1:1 contra `usuarios.rol` en la base y contra los tres paneles del front.

**Perfil declarado:** usuarios grandes, vista cansada. La tipografía base y la jerarquía deben
estar por encima del default de una app de consumo.

## Product Purpose

Reemplazar la planilla en papel de la ronda de supervisión por un acta digital verificable.
Cada ronda produce un acta con: objetivo validado por geocerca, vigiladores presentes,
checklist respondido, evidencia fotográfica con marca de agua y firma de cada vigilador
(o su negativa registrada). Éxito = el acta se cierra en el objetivo, sin retrabajo en oficina,
y las incidencias llegan solas al área responsable como ticket.

## Positioning

El checklist no está hardcodeado: vive en la base y se resuelve en dos capas — la plantilla por
`subtipo` de objetivo (5 plantillas) y los ajustes `objetivo_checklist` por objetivo puntual.
Dos locales comerciales distintos pueden tener distinta cantidad de ítems sin duplicar plantilla.
Eso es lo que un producto vecino no puede copiar sin rehacer su modelo de datos.

## Operating Context

- Ronda en el objetivo, a pie, de día o de noche, con el teléfono en una mano.
- **Sin conexión es la norma, no la excepción:** cola FIFO offline con reintento automático
  cada 60 s (PRD §10). La app debe verse y comportarse igual sin señal.
- La geolocalización real exige contexto seguro (HTTPS) — `serve_https.py` existe por eso.
- La foto se estampa con fecha/hora/GPS/supervisor en el momento de captura y ya no se edita.
- Admin y dueño consultan desde escritorio, pero el front es un teléfono enmarcado (`PhoneFrame`).

## Capabilities and Constraints

- Un solo archivo: `asi_prototype.html`. React 18 + Babel + Tailwind por CDN, **sin build step**.
  Todo el CSS del sistema vive en el `<style>` inline y en `tailwind.config`.
- **Modo demo obligatorio:** todo panel funciona contra las constantes `SEED_*` sin backend y
  cambia a datos vivos cuando `apiStatus === "connected"`. Esta degradación es deliberada.
- **Nunca emojis como íconos.** Toda iconografía pasa por el componente `Icon` (`ICON_PATHS`).
- Idioma de producto, código y API: **español (Argentina)**.
- El flujo del supervisor es un wizard de 5 pasos sobre un único objeto de estado `rd`.
- `www/` se regenera desde el prototipo; nunca se edita a mano.

## Brand Commitments

- **Nombre: ASISA** — Argentina Seguridad Integral Sociedad Anónima. La sigla correcta es
  **ASISA**, no "ASI". Corregir toda copy de interfaz que diga "ASI".
- **Logo provisto por el cliente**, monocromo, un solo color: `#2D4175` (navy).
  Es un lockup horizontal: jinete con estandarte + barra divisoria + wordmark en tres líneas
  (ARGENTINA / SEGURIDAD / INTEGRAL), sans geométrico de caja alta.
  - `assets/asi-logo.svg` — lockup completo
  - `assets/asi-isotipo.svg` — solo el jinete (extraído del original, sin pérdida)
  - `assets/asi-wordmark.svg` — barra + wordmark
  - Los tres usan `fill="currentColor"`: se tiñen desde CSS al inlinearlos.
- Paleta: escala derivada del navy del logo, más un acento dorado sobrio para la acción
  primaria. Decisión confirmada con el usuario.

## Evidence on Hand

- `PLANTILLAS_CHECKLIST.md` y `PREGUNTAS_CLIENTE_CHECKLIST.md` — material real de reunión con
  el cliente, en español. Fundamento de negocio de las 5 plantillas.
- `schema.sql` — esquema + seed reales (objetivos, vigiladores, catálogo de observaciones).
- Usuarios semilla: `supervisor`/`supervisor123`, `admin`/`admin123`, `dueno`/`dueno123`.
  Legajos de prueba: 1024, 1087, 1153, 1201.
- **No hay** testimonios, métricas de adopción, casos de éxito ni logos de clientes.
  No inventarlos.

## Product Principles

1. **El acta se cierra en el objetivo.** Todo lo que obligue a volver a la oficina es un defecto.
2. **Sin señal no es un estado degradado.** La app offline se ve y se comporta como la online.
3. **La configuración vive en la base, no en el código.** Checklists y catálogos se editan en
   `schema.sql`, nunca se hardcodean.
4. **Una mano, en movimiento.** Si una acción no se alcanza con el pulgar, está mal ubicada.
5. **La evidencia es inmutable.** Foto estampada al capturar; firma o negativa explícita.

## Accessibility & Inclusion

Piso **WCAG 2.2 AA**, con estas exigencias adicionales por el perfil declarado
(usuarios grandes, vista cansada) y por el uso a una mano en movimiento:

- Texto de cuerpo **nunca por debajo de 16 px**; datos del acta y del checklist, 17–18 px.
- Contraste de texto ≥ 4.5:1 real, medido sobre la superficie donde se apoya.
- Targets táctiles ≥ 48 px, con las acciones primarias en el tercio inferior de la pantalla.
- Foco visible y navegable por teclado en todo control.
- Nada depende solo del color: la escala Likert B/R/M lleva forma o texto además del tono.
- `prefers-reduced-motion` respetado (ya implementado; preservar).
