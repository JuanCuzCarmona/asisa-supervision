# Puesta en producción — Railway

**Estado (05/10/2026):** proyecto `asi-supervision` creado en la cuenta de Railway del
equipo, con PostgreSQL y el servicio `api` en https://api-production-9e460.up.railway.app.
Esquema cargado (checklist y observaciones), sin usuarios todavía.

Plataforma elegida: **[Railway](https://railway.com)**. La API (`server.js`) y PostgreSQL
quedan en la misma cuenta, con una sola factura que Carlos paga con tarjeta de crédito.

| Plan | Precio | Para qué |
|---|---|---|
| Hobby | USD 5/mes (incluye USD 5 de consumo) | Arrancar: alcanza para la API y la base con pocos supervisores |
| Pro | USD 20/mes (incluye USD 20 de consumo) | Cuando crezca el uso, o para tener varios integrantes del equipo en la cuenta |

El disco de la base se cobra aparte por uso (~USD 0,15 por GB al mes). Las fotos de
evidencia se guardan dentro de la base, así que es lo que más va a crecer: revisar el
consumo el primer mes.

**La cuenta va a nombre de ASI** (mail de Carlos o de la empresa, su tarjeta); el equipo
entra como integrante invitado. Así, si el equipo cambia, ASI no pierde su sistema.

## Pasos

1. **Crear el proyecto** en Railway → *New Project* → *Deploy from GitHub repo* → este repo
   (rama `main`). Railway detecta Node y corre `npm start`.
2. **Agregar la base**: *+ New* → *Database* → *PostgreSQL*.
3. **Variables del servicio de la API** (*Variables*):
   ```
   DATABASE_URL = ${{Postgres.DATABASE_URL}}   (referencia a la base de Railway)
   DB_SSL       = off                          (red interna de Railway; "require" si se usa la URL pública)
   JWT_SECRET   = <openssl rand -hex 32>
   TRUST_PROXY  = 1
   CORS_ORIGIN  = https://asi-supervision.pages.dev
   ```
   No hace falta `PORT`: Railway lo define solo.
4. **Dominio HTTPS**: *Settings* → *Networking* → *Generate Domain* (da `xxx.up.railway.app`
   con HTTPS), o un dominio propio de ASI (ej. `api.argentinaseguridad.com.ar`) con un CNAME.
5. **Cargar o actualizar el esquema** desde dentro del contenedor de la API (la base no se expone a
   Internet; el contenedor la ve por la red interna de Railway):
   ```
   railway ssh --service api -- node scripts/aplicar_sql.js schema.sql
   ```
   > ⚠️ **IMPORTANTE AL ACTUALIZAR EL SERVIDOR:**
   > Hay que aplicar `schema.sql` en la base de Railway **antes** de desplegar los cambios de `server.js` (o de pushear a `main` si Railway tiene auto-deploy). `server.js` v4.0 consulta columnas nuevas (`activo`, `aprobado_por_dueno`, `creado_por_id`) y las tablas `rutas_visitas` y `auditoria`. Si el servidor nuevo corre contra el esquema viejo, fallará en el login y en la inicialización.
   
   `seed_demo.sql` (usuarios y datos de prueba) es solo para la base local de desarrollo; nunca se ejecuta en producción.
6. **Crear los usuarios reales** (la base arranca sin ninguno):
   ```
   railway ssh --service api -- node scripts/crear_usuario.js carlos dueno "Carlos …"
   railway ssh --service api -- node scripts/crear_usuario.js lucia admin "Lucía …"
   railway ssh --service api -- node scripts/crear_usuario.js jperez supervisor "Juan Pérez"
   ```
   La contraseña se pide por teclado. Después cada uno la cambia desde la app (con la
   aprobación de Carlos).
7. **Web**:
   ```
   bash scripts/build-web.sh
   wrangler pages deploy web-dist --project-name asi-supervision --branch main
   ```
   `asi_prototype.html` ya trae la URL de producción, así que `ASI_API_URL` solo hace falta
   si el servidor cambia de dirección.
8. **APK**: la app nativa ya apunta al servidor de producción (`API_URL` en
   `mobile/src/state/session.tsx`); `npm run apk:entrega`. Para probar contra otro servidor,
   `EXPO_PUBLIC_API_URL=…` en `mobile/.env.local` (gitignored).
9. **Probar**: `curl -s https://<dominio-de-la-api>/` responde `"ok": true`; hacer una ronda
   completa desde un celular y revisar en la base que el acta tenga la hora argentina correcta.

## Hora

`server.js` fija `America/Argentina/Buenos_Aires` para el proceso y para cada conexión, y
`schema.sql` la deja como zona por defecto de la base. Los servidores de Railway corren en
UTC; sin esto las actas de la noche quedaban fechadas al día siguiente.

## Pendiente después de salir

- **Volver el límite de login a 10**: durante las pruebas quedó `LOGIN_MAX_INTENTOS=500` en el
  servicio `api`. Al terminar: `railway variables --service api --set LOGIN_MAX_INTENTOS=10`.

- Copia de seguridad diaria (`pg_dump`) fuera de Railway, y probar que se puede restaurar.
- Mover las fotos de evidencia a almacenamiento de archivos (R2/S3) cuando la base crezca.
- Aviso automático si la API se cae.
