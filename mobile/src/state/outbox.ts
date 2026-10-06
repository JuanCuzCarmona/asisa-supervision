/* Cola de actas pendientes (outbox) persistida en SQLite.
   Un acta hecha sin señal queda guardada en el celular aunque se cierre la app,
   y se reenvía sola (al volver la red y cada 60 s, PRD §10). Las fotos quedan
   como archivos; solo se guardan sus rutas. */
import * as SQLite from "expo-sqlite";
import { File } from "expo-file-system";
import { apiFetch } from "../api";

export interface Pendiente {
  id: number;
  objetivo: string;
  creada: string;
  payload: any;
  fotos: { uri: string; lat: number | null; lng: number | null; itemId?: number | null; tomadaEn?: string }[];
  intentos: number;
  ultimoError: string | null;
}

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

function db() {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync("asi.db").then(async d => {
      await d.execAsync(`
        PRAGMA journal_mode = WAL;
        CREATE TABLE IF NOT EXISTS outbox (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          objetivo TEXT NOT NULL,
          creada TEXT NOT NULL,
          payload TEXT NOT NULL,
          fotos TEXT NOT NULL,
          intentos INTEGER NOT NULL DEFAULT 0,
          ultimo_error TEXT
        );
      `);
      return d;
    });
  }
  return dbPromise;
}

export async function encolar(objetivo: string, payload: unknown, fotos: Pendiente["fotos"]) {
  const d = await db();
  await d.runAsync(
    "INSERT INTO outbox (objetivo, creada, payload, fotos) VALUES (?, ?, ?, ?)",
    objetivo, new Date().toISOString(), JSON.stringify(payload), JSON.stringify(fotos),
  );
}

export async function listar(): Promise<Pendiente[]> {
  const d = await db();
  const rows = await d.getAllAsync<any>("SELECT * FROM outbox ORDER BY id");
  return rows.map(r => ({
    id: r.id, objetivo: r.objetivo, creada: r.creada,
    payload: JSON.parse(r.payload), fotos: JSON.parse(r.fotos),
    intentos: r.intentos, ultimoError: r.ultimo_error,
  }));
}

export async function descartar(id: number) {
  const d = await db();
  await d.runAsync("DELETE FROM outbox WHERE id = ?", id);
}

/** Arma las evidencias en base64 recién al enviar. */
export async function evidenciasBase64(fotos: Pendiente["fotos"]) {
  const out = [];
  for (const f of fotos) {
    try {
      const b64 = await new File(f.uri).base64();
      out.push({ imagen_base64: `data:image/jpeg;base64,${b64}`, lat: f.lat, lng: f.lng, item_id: f.itemId ?? null, tomada_en: f.tomadaEn ?? null });
    } catch {
      // Una foto ilegible no puede bloquear el acta entera.
    }
  }
  return out;
}

/** Envía la cola en orden FIFO. Un acta que falla queda para el próximo intento. */
export async function sincronizar(base: string, token: string | null) {
  const d = await db();
  const pend = await listar();
  let enviadas = 0;
  for (const p of pend) {
    try {
      const evidencias = await evidenciasBase64(p.fotos);
      await apiFetch(base, "/api/rondas", { method: "POST", token, body: { ...p.payload, evidencias }, timeoutMs: 60000 });
      await d.runAsync("DELETE FROM outbox WHERE id = ?", p.id);
      enviadas++;
    } catch (e: any) {
      await d.runAsync("UPDATE outbox SET intentos = intentos + 1, ultimo_error = ? WHERE id = ?", String(e?.message || e), p.id);
      // Si es un rechazo del servidor (4xx) el acta no va a pasar reintentando igual:
      // se deja en la cola con el error visible para que el supervisor lo vea.
      if (e?.status == null) break; // sin red: no tiene sentido seguir intentando las demás ahora
    }
  }
  return { enviadas, pendientes: (await listar()).length };
}

/* ── Copia local de datos de la última sesión (catálogos) ──
   Misma base SQLite: si el supervisor abre la app sin señal, puede hacer la
   ronda con los objetivos/vigiladores/checklist que ya tenía. */
export async function guardarCache(clave: string, valor: unknown) {
  const d = await db();
  await d.execAsync("CREATE TABLE IF NOT EXISTS cache (clave TEXT PRIMARY KEY, valor TEXT NOT NULL)");
  await d.runAsync("INSERT OR REPLACE INTO cache (clave, valor) VALUES (?, ?)", clave, JSON.stringify(valor));
}

export async function leerCache<T>(clave: string): Promise<T | null> {
  const d = await db();
  await d.execAsync("CREATE TABLE IF NOT EXISTS cache (clave TEXT PRIMARY KEY, valor TEXT NOT NULL)");
  const fila = await d.getFirstAsync<{ valor: string }>("SELECT valor FROM cache WHERE clave = ?", clave);
  return fila ? (JSON.parse(fila.valor) as T) : null;
}
