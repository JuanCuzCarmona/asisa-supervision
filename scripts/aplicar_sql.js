#!/usr/bin/env node
/* Aplica un archivo .sql con la conexión del .env / variables del servicio.
   Pensado para correr dentro del contenedor de Railway, donde la base solo es
   accesible por la red interna (no hace falta exponerla a Internet):
     railway ssh --service api -- node scripts/aplicar_sql.js schema.sql */
const fs = require("fs");
const { crearPool, describirDestino } = require("./conexion");

(async () => {
  const archivo = process.argv[2];
  if (!archivo || !fs.existsSync(archivo)) {
    console.error("Uso: node scripts/aplicar_sql.js <archivo.sql>");
    process.exit(1);
  }
  const pool = crearPool();
  const client = await pool.connect();
  client.on("notice", () => {}); // los "already exists, skipping" no aportan
  try {
    console.log(`Aplicando ${archivo} en ${describirDestino()}…`);
    await client.query(fs.readFileSync(archivo, "utf8"));
    console.log("✅ Listo.");
  } catch (err) {
    console.error(`❌ ${err.message}${err.position ? ` (posición ${err.position})` : ""}`);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
})();
