# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

Nota: existe un empaquetado nativo Android vía Capacitor (`android/`, ver CLAUDE.md), pero es un WebView que carga el mismo `asi_prototype.html` — no un lenguaje de diseño nativo distinto. El lenguaje visual sigue siendo `web`.

## Users

- **Supervisor** (uso primario, en campo): recorre objetivos físicos (plantas industriales, barrios, locales comerciales, oficinas) haciendo rondas de control. Usa el teléfono con una mano mientras camina, en exteriores/industria con luz variable (sol directo o poca luz), a veces con guantes. Necesita completar el wizard de ronda (objetivo + geocerca → vigiladores → checklist → fotos → firmas) rápido y sin fricción, incluso sin conexión.
- **Admin**: revisa y resuelve tickets/incidencias generados por las rondas. Uso mixto — a veces desde el celular para una revisión rápida, a veces desde una pantalla más grande (escritorio/notebook) para el análisis serio. El prototipo actual solo tiene layout de teléfono; esto es una limitación conocida, no el uso real esperado.
- **Dueño**: ve KPIs y actividad agregada de la operación. Mismo patrón de uso mixto que Admin (celular para un vistazo rápido, pantalla grande para analizar).

## Product Purpose

Digitaliza la supervisión de seguridad física de ASI (Argentina Seguridad Integral): reemplaza el acta en papel por un flujo guiado que un supervisor completa durante la ronda, y que un admin/dueño puede auditar después. El éxito es que el acta resultante sea completa, verificable y defendible — no solo "llenada".

## Positioning

El diferenciador confirmado es la **evidencia a prueba de manipulación**: geocerca real del dispositivo al iniciar la ronda, fotos con watermark de fecha/hora/GPS/supervisor grabado en el momento de la captura (no editable después), y firmas digitales por vigilador (o registro explícito de negativa a firmar). Un competidor con una checklist digital genérica no puede igualar esto sin rehacer la cadena de custodia de la evidencia. Esto es lo que hace que el acta sea defendible ante un reclamo del cliente, no solo un formulario más rápido que el papel.

## Operating Context

- Rondas de campo en sitios reales del cliente ("objetivos"): industria/planta, barrio multipuesto/unipersonal, local comercial, empresa/oficinas — cada tipo con su propio template de checklist (ver `PLANTILLAS_CHECKLIST.md`).
- Condiciones físicas confirmadas: exteriores/industria con luz muy variable (sol directo a muy poca luz), uso a veces con guantes o a una mano mientras el supervisor camina la ronda. El diseño no puede asumir buena luz constante ni las dos manos libres.
- Conectividad no garantizada en el sitio — de ahí la cola offline FIFO con reintento automático cada 60s (PRD §10).
- Admin/Dueño operan en un contexto más de oficina/escritorio, pero también revisan desde el celular puntualmente — no es un uso exclusivamente de escritorio.

## Capabilities and Constraints

- Backend Express + PostgreSQL con JWT (8h), bcrypt, rate limiting y RBAC por rol (`supervisor`, `admin`, `dueno`).
- El checklist es 100% configurable desde la base de datos (`checklist_items.tipos_objetivo` + overrides por objetivo en `objetivo_checklist`), no hardcodeado — un cambio de checklist es un cambio de datos, no de código.
- Todo panel debe seguir funcionando en modo demo (datos `SEED_*` locales) sin backend conectado — degradación elegante es un requisito explícito, no opcional.
- Sin suite de tests automatizados todavía.
- Prototipo — sin base de usuarios real en producción todavía (usuarios semilla de prueba: `supervisor`/`admin`/`dueno`).

## Brand Commitments

- Nombre: **Argentina Seguridad Integral (ASI)**. Isotipo de escudo con check, paleta azul/celeste/blanco.
- Sistema visual existente: claymorphism (superficies `.clay`/`.clay-sm`/`.clay-inset`/`.clay-btn` con sombras dobles), documentado en CLAUDE.md — es la identidad incumbente a preservar en cualquier refinamiento, no un punto de partida neutro.

## Evidence on Hand

- `PLANTILLAS_CHECKLIST.md` y `PREGUNTAS_CLIENTE_CHECKLIST.md` — documentos reales de relevamiento con clientes, en español, que documentan los 5 templates de checklist y las preguntas usadas para las diferencias por objetivo. No son contenido inventado.
- PRD 1 — Panel de Supervisión (rev. 22/04/2026) — especificación de producto que rige el flujo del supervisor y la cola offline.
- No hay testimonios, casos de estudio, ni prensa — no fabricar ninguno.

## Product Principles

1. **La evidencia manda sobre la velocidad.** Cualquier atajo de UX que debilite la cadena de custodia (geocerca, watermark, firma) no es aceptable aunque sea más rápido.
2. **Config sobre código.** La lógica de negocio (qué checklist aplica a qué objetivo) vive en la base de datos, no en el HTML/JS.
3. **Degradación elegante siempre.** Cada pantalla funciona con datos de ejemplo sin backend; conectar la API es un upgrade, no un requisito.
4. **Diseñar para el pulgar sucio, no para el mouse limpio.** El uso primario es a una mano, en movimiento, con luz impredecible — no una oficina con buena conectividad y las dos manos libres.

## Accessibility & Inclusion

Sin requisito de accesibilidad formal establecido todavía (no se confirmó estándar como WCAG). Restricción de campo confirmada a respetar: legibilidad y objetivos táctiles usables con luz variable (sol directo a muy poca luz) y potencialmente con guantes o una sola mano libre.
