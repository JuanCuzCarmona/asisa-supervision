/* Conexión a PostgreSQL para los scripts de administración (crear usuarios,
   importar planillas). Lee el mismo .env que server.js: DATABASE_URL o DB_*,
   y DB_SSL ("off" | "require" | "verify"). */
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const { Pool } = require("pg");

const ZONA_HORARIA = "America/Argentina/Buenos_Aires";
process.env.TZ = ZONA_HORARIA;

function crearPool() {
  const ssl = (process.env.DB_SSL || "off").toLowerCase();
  const pool = new Pool({
    ...(process.env.DATABASE_URL
      ? { connectionString: process.env.DATABASE_URL }
      : {
          host:     process.env.DB_HOST,
          port:     parseInt(process.env.DB_PORT || "5432"),
          database: process.env.DB_NAME,
          user:     process.env.DB_USER,
          password: process.env.DB_PASSWORD,
        }),
    ssl: ssl === "off" ? false : { rejectUnauthorized: ssl === "verify" },
    options: `-c timezone=${ZONA_HORARIA}`,
    max: 2,
  });
  return pool;
}

// Descripción legible del destino, para que nadie importe en producción sin darse cuenta.
function describirDestino() {
  if (process.env.DATABASE_URL) {
    try { const u = new URL(process.env.DATABASE_URL); return `${u.hostname}/${u.pathname.slice(1)}`; }
    catch { return "DATABASE_URL"; }
  }
  return `${process.env.DB_HOST}/${process.env.DB_NAME}`;
}

module.exports = { crearPool, describirDestino };
