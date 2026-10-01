// Genera src/data/seed.ts a partir de los SEED_* de ../asi_prototype.html,
// así el modo demo de la app nativa muestra exactamente lo mismo que la web.
const fs = require("fs");
const path = require("path");

const html = fs.readFileSync(path.join(__dirname, "..", "..", "asi_prototype.html"), "utf8");
const desde = html.indexOf("const SEED_OBJETIVOS");
const hasta = html.indexOf("const SEED_RONDAS");
const feed = html.indexOf("const SEED_FEED");
const bloque = html.slice(desde, hasta) + "\n" + html.slice(feed, html.indexOf("];", feed) + 2);

const nombres = ["SEED_OBJETIVOS", "SEED_VIGILADORES", "SEED_HISTORIAL", "SEED_SANCIONES", "SEED_SECCIONES",
  "SEED_CHECKLIST", "SEED_AJUSTES", "SEED_OBSERVACIONES", "SEED_TICKETS", "SEED_FEED"];
const datos = new Function(bloque + "\nreturn {" + nombres.join(",") + "};")();

let ts = "/* Datos de ejemplo del modo demo — GENERADO por scripts/gen-seed.js desde los SEED_*\n" +
  "   de asi_prototype.html. No editar a mano: correr `npm run seed`. */\n" +
  "import type { Objetivo, Vigilador, Seccion, ItemChecklist, Ajuste, Observacion } from \"../types\";\n\n";
const tipos = { SEED_OBJETIVOS: "Objetivo[]", SEED_VIGILADORES: "Vigilador[]", SEED_SECCIONES: "Seccion[]",
  SEED_CHECKLIST: "ItemChecklist[]", SEED_AJUSTES: "Ajuste[]", SEED_OBSERVACIONES: "Observacion[]" };
for (const n of nombres) {
  ts += `export const ${n}${tipos[n] ? ": " + tipos[n] : ""} = ${JSON.stringify(datos[n], null, 2)};\n\n`;
}
fs.writeFileSync(path.join(__dirname, "..", "src", "data", "seed.ts"), ts);
console.log("seed.ts generado");
