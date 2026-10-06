#!/usr/bin/env node
/* Importación CRUDA de planillas de ASI (Excel/CSV) a PostgreSQL.

     node scripts/importar_crudo.js datos_asi/            (toda la carpeta)
     node scripts/importar_crudo.js datos_asi/Personal.xlsx otra.csv

   Cada hoja de cada archivo se copia tal cual a una tabla del esquema `crudo`
   (todas las columnas como TEXT, con el número de fila original en `_fila`).
   No interpreta nada: sirve para traer lo que haya en la oficina y después
   armar, con SQL revisado, el pasaje a las tablas reales (vigiladores,
   objetivos, historial…). Re-ejecutarlo reemplaza las tablas crudas de esos
   archivos. El registro de lo importado queda en `crudo._importaciones`.

   Los datos son personales (DNI, domicilios): la carpeta datos_asi/ está en
   .gitignore y no tiene que subirse al repo. */
const fs   = require("fs");
const path = require("path");
const XLSX = require("xlsx");
const { crearPool, describirDestino } = require("./conexion");

const EXTENSIONES = new Set([".xlsx", ".xlsm", ".xls", ".ods", ".csv"]);
const MAX_IDENT   = 63;   // límite de identificadores en PostgreSQL

// "Fecha de Vto. Credencial" → "fecha_de_vto_credencial"
function normalizar(texto, porDefecto) {
  const s = String(texto ?? "")
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  return (s || porDefecto).slice(0, MAX_IDENT);
}

const dos = (n) => String(n).padStart(2, "0");
function aTexto(v) {
  if (v == null) return null;
  if (v instanceof Date) {
    if (Number.isNaN(v.getTime())) return null;
    const fecha = `${v.getFullYear()}-${dos(v.getMonth() + 1)}-${dos(v.getDate())}`;
    const conHora = v.getHours() || v.getMinutes() || v.getSeconds();
    return conHora ? `${fecha} ${dos(v.getHours())}:${dos(v.getMinutes())}` : fecha;
  }
  return String(v);
}

const q = (ident) => `"${ident.replace(/"/g, '""')}"`;

function listarArchivos(rutas) {
  const salida = [];
  for (const r of rutas) {
    const st = fs.statSync(r);
    if (st.isDirectory()) {
      salida.push(...listarArchivos(fs.readdirSync(r).filter(n => !n.startsWith(".") && !n.startsWith("~$")).map(n => path.join(r, n))));
    } else if (EXTENSIONES.has(path.extname(r).toLowerCase())) {
      salida.push(r);
    }
  }
  return salida;
}

/* Las planillas suelen tener título, logo o filas vacías arriba: el encabezado
   es la primera fila (de las 15 primeras) con la mayor cantidad de celdas llenas. */
function detectarEncabezado(filas) {
  let mejor = 0, maxLlenas = -1;
  filas.slice(0, 15).forEach((f, i) => {
    const llenas = f.filter(v => v != null && String(v).trim() !== "").length;
    if (llenas > maxLlenas) { maxLlenas = llenas; mejor = i; }
  });
  return mejor;
}

function columnasDesde(encabezado, ancho) {
  const usadas = new Set(["_fila"]);
  const cols = [];
  for (let i = 0; i < ancho; i++) {
    let base = normalizar(encabezado[i], `col_${i + 1}`), nombre = base, n = 2;
    while (usadas.has(nombre)) nombre = `${base.slice(0, MAX_IDENT - 4)}_${n++}`;
    usadas.add(nombre); cols.push(nombre);
  }
  return cols;
}

async function importarHoja(client, archivo, hoja, ws) {
  // raw:true + cellDates → las fechas llegan como Date y se guardan en ISO (2026-08-15):
  // el texto "8/15/26" que muestra Excel depende del idioma de la PC y es ambiguo.
  // blankrows:true → el índice coincide con la fila de Excel; las vacías se filtran abajo.
  const filas = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: null, blankrows: true })
    .map(f => f.map(aTexto));
  if (!filas.length) return null;

  const iEnc  = detectarEncabezado(filas);
  const ancho = Math.max(...filas.map(f => f.length));
  const cols  = columnasDesde(filas[iEnc] || [], ancho);
  const datos = filas.slice(iEnc + 1)
    .map((f, i) => ({ fila: iEnc + 2 + i, valores: cols.map((_, c) => f[c] == null ? null : String(f[c]).trim() || null) }))
    .filter(d => d.valores.some(v => v != null));

  const archivoBase = normalizar(path.basename(archivo, path.extname(archivo)), "archivo");
  const tabla = normalizar(`${archivoBase}__${normalizar(hoja, "hoja")}`, "tabla");

  await client.query(`DROP TABLE IF EXISTS crudo.${q(tabla)}`);
  await client.query(`CREATE TABLE crudo.${q(tabla)} (_fila INTEGER, ${cols.map(c => `${q(c)} TEXT`).join(", ")})`);

  const LOTE = 500;
  for (let i = 0; i < datos.length; i += LOTE) {
    const lote = datos.slice(i, i + LOTE);
    const params = [], tuplas = [];
    for (const d of lote) {
      const base = params.length;
      params.push(d.fila, ...d.valores);
      tuplas.push(`(${Array.from({ length: cols.length + 1 }, (_, k) => `$${base + k + 1}`).join(",")})`);
    }
    await client.query(`INSERT INTO crudo.${q(tabla)} (_fila, ${cols.map(q).join(", ")}) VALUES ${tuplas.join(",")}`, params);
  }

  await client.query(
    `INSERT INTO crudo._importaciones (tabla, archivo, hoja, fila_encabezado, filas, columnas)
     VALUES ($1,$2,$3,$4,$5,$6)
     ON CONFLICT (tabla) DO UPDATE SET archivo = EXCLUDED.archivo, hoja = EXCLUDED.hoja,
       fila_encabezado = EXCLUDED.fila_encabezado, filas = EXCLUDED.filas,
       columnas = EXCLUDED.columnas, importado_en = NOW()`,
    [tabla, path.basename(archivo), hoja, iEnc + 1, datos.length, cols]);

  return { tabla, filas: datos.length, columnas: cols.length };
}

(async () => {
  const rutas = process.argv.slice(2);
  if (!rutas.length) {
    console.error("Uso: node scripts/importar_crudo.js <carpeta o archivos .xlsx/.xls/.csv/.ods>");
    process.exit(1);
  }
  const archivos = listarArchivos(rutas);
  if (!archivos.length) { console.error("No se encontraron planillas en esas rutas."); process.exit(1); }
  console.log(`Base de destino: ${describirDestino()} · ${archivos.length} archivo(s)\n`);

  const pool = crearPool();
  const client = await pool.connect();
  let total = 0;
  try {
    await client.query("CREATE SCHEMA IF NOT EXISTS crudo");
    await client.query(`CREATE TABLE IF NOT EXISTS crudo._importaciones (
      tabla TEXT PRIMARY KEY, archivo TEXT, hoja TEXT, fila_encabezado INTEGER,
      filas INTEGER, columnas TEXT[], importado_en TIMESTAMP NOT NULL DEFAULT NOW())`);

    for (const archivo of archivos) {
      let libro;
      try { libro = XLSX.readFile(archivo, { cellDates: true }); }
      catch (e) { console.warn(`⚠️  ${archivo}: no se pudo leer (${e.message})`); continue; }
      for (const hoja of libro.SheetNames) {
        await client.query("BEGIN");
        try {
          const r = await importarHoja(client, archivo, hoja, libro.Sheets[hoja]);
          await client.query("COMMIT");
          if (r) { total++; console.log(`✅ ${path.basename(archivo)} › ${hoja}  →  crudo.${r.tabla}  (${r.filas} filas, ${r.columnas} columnas)`); }
          else   console.log(`·  ${path.basename(archivo)} › ${hoja}: hoja vacía, se omite`);
        } catch (e) {
          await client.query("ROLLBACK");
          console.warn(`⚠️  ${path.basename(archivo)} › ${hoja}: ${e.message}`);
        }
      }
    }
    console.log(`\n${total} hoja(s) importadas. Ver el resumen con:\n  psql <base> -c "SELECT tabla, archivo, hoja, filas FROM crudo._importaciones ORDER BY archivo, hoja"`);
  } finally {
    client.release();
    await pool.end();
  }
})();
