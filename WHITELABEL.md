# Versión comercial de la webapp

La fuente de la aplicación sigue siendo `asi_prototype.html`. El comando siguiente crea
una copia independiente en `whitelabel-dist/`, sin logos, textos ni URL de ASI:

```bash
npm run build:whitelabel
npm run preview:whitelabel
```

Abrir `http://localhost:8765/` para recorrer la demo.
Los archivos de React, Babel y Tailwind se sirven desde la misma carpeta de la demo;
la fuente de Google Fonts es opcional y tiene reemplazo local del sistema.
Si el navegador no puede acceder a `localhost`, abrir `whitelabel-dist/demo-portable.html`
directamente con Chrome. Es un único archivo con los scripts y datos ficticios incluidos;
no necesita un servidor ni conexión a Internet.

La identidad se puede definir al compilar:

```bash
WL_NAME="Tu marca" WL_SHORT_NAME="Tu marca" WL_COLOR="#175B75" \
WL_API_URL="https://api.tu-dominio.com" npm run build:whitelabel
```

`WL_API_URL` debe ser una API distinta de la de ASI. Sin esa variable, la web funciona
como demostración local con datos inventados y accesos a Supervisión, Administración
y Dirección. La ubicación se simula para probar rondas presenciales o remotas sin
pedir permiso de GPS. Los cambios de la demo se reinician al recargar. El parámetro `?api=`
no cambia el servidor en esta versión.

## Para conectar una instalación funcional

1. Crear otra instancia del servidor y otra base PostgreSQL. Usar `schema.sql` y,
   únicamente en esa base de demostración, `seed_demo.sql` con datos ficticios.
2. Configurar en esa instancia `DATABASE_URL`, un `JWT_SECRET` propio,
   `SYSTEM_NAME="Tu marca"` y `CORS_ORIGIN` con el origen de la web comercial.
3. Compilar con la URL HTTPS de esa API en `WL_API_URL` y publicar **solo** el contenido
   de `whitelabel-dist/` en un sitio separado.
4. Crear usuarios de demostración en la base separada y revisar que ningún catálogo,
   acta, perfil o evidencia pertenezca a clientes reales.

Los estilos de pantalla, el flujo de ronda, los paneles y la exportación de actas se
conservan. El generador cambia logo, nombre, ícono, color principal y almacenamiento
local. Un cliente nuevo requiere su propia base y sus propias credenciales.
