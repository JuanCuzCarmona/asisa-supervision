#!/usr/bin/env node
/* Alta (o reseteo de contraseña) de un usuario del sistema.
   La base de producción arranca sin usuarios: los de prueba viven en seed_demo.sql.

     node scripts/crear_usuario.js <usuario> <supervisor|admin|dueno> "<Nombre y apellido>"

   La contraseña se pide por teclado (no queda en el historial de la terminal).
   Si el usuario ya existe, actualiza nombre, rol y contraseña y lo reactiva. */
const readline = require("readline");
const bcrypt   = require("bcryptjs");
const { crearPool, describirDestino } = require("./conexion");

const ROLES = ["supervisor", "admin", "dueno"];

function preguntarOculto(texto) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    rl._writeToOutput = (s) => { if (s.includes(texto)) rl.output.write(s); };
    rl.question(texto, (r) => { rl.close(); process.stdout.write("\n"); resolve(r); });
  });
}

(async () => {
  const [username, rol, nombre] = process.argv.slice(2);
  if (!username || !ROLES.includes(rol) || !nombre) {
    console.error('Uso: node scripts/crear_usuario.js <usuario> <supervisor|admin|dueno> "<Nombre y apellido>"');
    process.exit(1);
  }
  console.log(`Base de destino: ${describirDestino()}`);

  const clave  = await preguntarOculto("Contraseña (mín. 8 caracteres): ");
  if (clave.length < 8) { console.error("❌ La contraseña debe tener al menos 8 caracteres."); process.exit(1); }
  const repite = await preguntarOculto("Repetila: ");
  if (clave !== repite) { console.error("❌ Las contraseñas no coinciden."); process.exit(1); }

  const pool = crearPool();
  try {
    const hash = await bcrypt.hash(clave, 10);
    const r = await pool.query(
      `INSERT INTO usuarios (username, password_hash, nombre, rol, activo)
       VALUES ($1, $2, $3, $4, TRUE)
       ON CONFLICT (username) DO UPDATE SET
         password_hash = EXCLUDED.password_hash, nombre = EXCLUDED.nombre,
         rol = EXCLUDED.rol, activo = TRUE
       RETURNING id, (xmax = 0) AS nuevo`,
      [username.trim().toLowerCase(), hash, nombre.trim(), rol]);
    const { id, nuevo } = r.rows[0];
    console.log(`✅ Usuario "${username}" ${nuevo ? "creado" : "actualizado"} (id ${id}, rol ${rol}).`);
  } catch (err) {
    console.error("❌ No se pudo guardar el usuario:", err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
})();
