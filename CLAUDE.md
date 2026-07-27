# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

ASI (Argentina Seguridad Integral) is a prototype for a private security company's field-supervision app, built to the requirements of **PRD 1 — Panel de Supervisión** (rev. 22/04/2026). Three parts:

- `asi_prototype.html` — a single-file React 18 app (no build step; React, ReactDOM and Babel are loaded from CDN via `<script>` tags, styled with the Tailwind CDN build plus an inline claymorphism design system). Open it directly in a browser to run it.
- `server.js` — an Express + PostgreSQL REST API (JWT auth + RBAC) that the prototype connects to at runtime.
- `schema.sql` — idempotent schema + seed data. Re-runnable at any time with `psql asi -f schema.sql`.

`PLANTILLAS_CHECKLIST.md` and `PREGUNTAS_CLIENTE_CHECKLIST.md` are client-meeting handouts (in Spanish) documenting the five checklist templates and the questions used to relevar each real objetivo's per-item differences — read them for the *business* rationale behind `checklist_items.tipos_objetivo` and `objetivo_checklist` before changing checklist logic.

There is no test suite. Dependencies are declared in `package.json` (`npm install` before running the server).

## Running things

- **Frontend**: serve it over HTTP so CORS works — `python3 -m http.server 5500`, then open `http://localhost:5500/asi_prototype.html`. Opening the file directly via `file://` also works in demo mode, but the browser will block API calls.
  - To test real browser geolocation (geocerca checks), plain HTTP isn't enough — Chrome only grants `navigator.geolocation` on secure contexts. Use `python3 serve_https.py` instead, which serves the same directory over HTTPS on port 5500 using the self-signed cert in `certs/` (gitignored; regenerate with your own if missing).
- **Backend**: `node server.js`. Loads env vars from a local `.env` via `dotenv` (gitignored). It refuses to start unless these env vars are set: `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `JWT_SECRET` (min 32 chars). Optional: `PORT` (default 3000), `CORS_ORIGIN` (comma-separated, default `http://localhost:5500`).
- **Database**: PostgreSQL 16 via Homebrew (`brew services start postgresql@16`), database `asi`. `psql` lives at `/opt/homebrew/opt/postgresql@16/bin` and is not on the default PATH.
- **Test users** (seeded): `supervisor`/`supervisor123`, `admin`/`admin123`, `dueno`/`dueno123`. Test vigilador legajos: 1024, 1087, 1153, 1201.
- The frontend and backend are decoupled: the prototype works fully in **demo mode** against in-memory seed constants (`SEED_*`), and switches to live data once a URL is connected via `ApiConfigBar`. Every panel must keep working in both modes — this fallback is deliberate.

## Verifying changes

Drive the app in a real browser (Chrome automation tools are available). Note that synthetic clicks from the automation tool do not always register on `clay-btn` elements; clicking programmatically via `element.click()` in the page context is reliable. After a supervisor round, confirm persistence with `psql asi -c "SELECT ... FROM rondas_actas"` — the acta, per-guard signatures, checklist answers, evidence photos and tickets should all appear in one transaction.

## Architecture

### Frontend (`asi_prototype.html`)

Everything lives in one `<script type="text/babel">` block, rendered into `#root` via `ReactDOM.createRoot`. File order: design tokens/CSS → seed data → `Icon` + clay primitives → `AppContext` → login/shell → supervisor steps → admin/owner panels → root.

- **Design system: claymorphism** (blue/sky/white). Defined once in the `<style>` block and the inline `tailwind.config`. Surfaces use the `.clay`, `.clay-sm`, `.clay-inset` and `.clay-btn` classes (double shadows: a colored outer shadow plus a white inner highlight); buttons "sink" on `:active`. Semantic tones are `good`/`warn`/`bad` for the Likert scale B/R/M. **Never use emojis as icons** — all iconography goes through the `Icon` component, which renders lucide-style SVG paths from the `ICON_PATHS` map. Add new icons there rather than inlining `<svg>`.
- **`AppContext` / `AppProvider`** — the single source of truth: local mirror state (`rondasGuardadas`, `ticketsActivos`, `liveFeed`, `visitasPorObj`, KPIs via `useMemo`), the offline FIFO queue (`queue`/`offline`/`syncing`, with automatic 60s retry per PRD §10), the API layer (`apiFetch`, `conectarApi`, `cargarCatalogos`), and the catalogs (`objetivos`, `vigiladores`, `secciones`, `checklistDefs`, `observaciones`) which start as `SEED_*` and are replaced by `GET /api/inicializar` once authenticated. **Catalogs load on `apiToken` change, not on connect** — the endpoint requires auth.
- **Role-based routing** — `AppInner` renders `LoginScreen`, `SupervisorPanel`, `AdminPanel` or `OwnerPanel` based on `currentUser.rol`. No router; a plain conditional inside `PhoneFrame`.
- **Supervisor flow** — a 5-step wizard (`Step1`–`Step5`) plus the generated acta (`ActaGenerada`): objetivo + geocerca → multiple vigiladores → checklist → photo evidence → per-guard signatures. The wizard's working state is a single `rd` object (objetivo, tipo, respuestas keyed by item id, fotos, firmas keyed by vigilador id). `guardarRonda` builds the acta via `construirActa` (which derives each ticket's responsible area from the *selected observation's* area, falling back to the checklist item's) and either commits locally + POSTs to `/api/rondas`, or enqueues when offline.
- **Checklist is data-driven, two layers deep** — `checklistDefs` items carry `tipos_objetivo`, giving every objetivo a checklist template based on its `subtipo` (5 templates — industria/planta, barrio multipuesto/unipersonal, local comercial, empresa/oficinas; documented client-facing in `PLANTILLAS_CHECKLIST.md`). On top of that, `objetivo_checklist` rows let a specific objetivo add or remove individual items from its template's default set. `resolverChecklist(objetivo, defs, ajustes)` merges the two: an explicit `ajustes` row wins (`incluido` true/false), otherwise the template's `tipos_objetivo` membership decides. This is what lets two "local comercial" objetivos end up with different item counts without duplicating the template. Long-press or the info button reveals `criterio_completo`.
- **Evidence photos** — `estamparFoto` draws the image to a canvas and burns in a date/time/GPS/supervisor watermark before the data URL is stored. The watermark is applied at capture time and is not editable afterwards.
- **Graceful degradation** is deliberate: every panel works against the `SEED_*` constants with no backend, and transparently switches to live data once `apiStatus === "connected"`. Preserve this when modifying panels.

### Backend (`server.js`)

Single-file Express API secured with JWT auth + RBAC, talking to PostgreSQL via `pg.Pool`.

- **Auth**: `POST /api/login` verifies bcrypt password hashes against `usuarios` and issues a JWT (8h expiry per PRD §10) containing `{ id, nombre, rol }`. Login always runs `bcrypt.compare` even for unknown usernames (timing-attack / user-enumeration mitigation).
- **`requireAuth`** validates the `Authorization: Bearer <token>` header and attaches `req.user`. **`requireRole(...roles)`** gates endpoints by `req.user.rol` (`supervisor`, `admin`, `dueno`). Roles map 1:1 to the frontend's three panels.
- **Endpoints**: `GET /api/inicializar` (auth-only — objetivos with current-month visit counts, vigiladores, checklist sections/items, observation catalog), `POST /api/rondas` (supervisor-only), `GET /api/vigilador/:legajo` (supervisor — full profile + historial + sanciones + incidencias), `GET /api/tickets` (admin/dueno, paginated + filterable by estado/objetivo/area), `PATCH /api/tickets/:id/resolver` (admin), `GET /api/kpis` and `GET /api/actividad` (admin/dueno).
- **`POST /api/rondas` is one transaction**: `rondas_actas` → per-guard `ronda_vigiladores` (each with its own signature or `nego_firmar`) → `checklist_respuestas` → `evidencias_fotos` → `tickets_incidencias`, inside a single `BEGIN`/`COMMIT`/`ROLLBACK`. It accepts `vigiladores: [{id, firma_base64, nego_firmar}]` and still tolerates the legacy `vigilador_ids` array. It rejects an acta with no signature and no recorded refusal.
- **Codes are generated after insert** (`ACTA-YYYYMMDD-<id>`, `INC-YYYYMM-<id>`) using the DB-assigned row id, specifically to avoid race conditions from pre-generating sequential codes.
- **Security middleware order**: `helmet()` → CORS allowlist (`CORS_ORIGIN` env) → general rate limit (200 req/15min/IP) → stricter `loginLimiter` (10 req/15min) on `/api/login`. The JSON body limit is 25mb because evidence photos travel as base64.
- **Configuration lives in the database, not in code**: `checklist_secciones`, `checklist_items` (with `tipos_objetivo[]`), `objetivo_checklist` (per-objetivo item add/remove) and `observaciones_catalogo` drive what the supervisor sees. To change a checklist, edit `schema.sql` and re-run it — do not hardcode items in the API. Keep the `SEED_*` constants in the HTML roughly in sync so demo mode matches.

## Language

Code comments, log messages, and API response fields are in Spanish (Argentina) — match this convention when editing `server.js` or `asi_prototype.html`.
