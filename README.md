# ASISA — Supervisión

Aplicación de supervisión de seguridad con cliente web React y API Express/PostgreSQL.

## Requisitos

- Node.js y npm.
- PostgreSQL para utilizar la API.
- Acceso a Internet para cargar las librerías y fuentes del cliente web.

## API local

1. Ejecutar `npm install`.
2. Copiar `.env.example` a `.env` y configurar la conexión a PostgreSQL.
3. Configurar un `JWT_SECRET` aleatorio de al menos 32 caracteres.
4. Crear la base de datos y cargar `schema.sql` con PostgreSQL.
5. Ejecutar `npm start`. El puerto predeterminado es `3000`.

## Cliente web

Abrir `asi_prototype.html` en el navegador para explorar el modo demo. Para conectar con la API, configurar su URL desde la interfaz (por ejemplo, `http://localhost:3000`). Si se sirve el cliente mediante un servidor web local, agregar su origen a `CORS_ORIGIN` en `.env`.

## Archivos principales

- `asi_prototype.html`: cliente React/Tailwind.
- `server.js`: API, autenticación y acceso a PostgreSQL.
- `schema.sql`: esquema y datos iniciales.
- `assets/`: identidad visual.
- `DESIGN.md` y `PRODUCT.md`: documentación del proyecto.

No publicar `.env`, credenciales, certificados ni datos de producción.
