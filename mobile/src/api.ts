/* Cliente de la API Express existente (server.js). Sin cambios en el backend:
   la app nativa habla exactamente el mismo contrato que la web. */

export class ApiError extends Error {
  constructor(message: string, public status?: number) { super(message); }
}

/** Timeout corto: en campo una red "colgada" es peor que una caída limpia —
 *  preferimos fallar rápido y encolar el acta. */
export async function apiFetch<T = any>(
  base: string, path: string, opts: { method?: string; token?: string | null; body?: unknown; timeoutMs?: number } = {},
): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), opts.timeoutMs ?? 15000);
  try {
    const res = await fetch(base.replace(/\/+$/, "") + path, {
      method: opts.method || "GET",
      headers: {
        "Content-Type": "application/json",
        ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}),
      },
      body: opts.body != null ? JSON.stringify(opts.body) : undefined,
      signal: ctrl.signal,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.ok === false) {
      throw new ApiError(data.mensaje || data.error || `Error ${res.status}`, res.status);
    }
    return data as T;
  } catch (e: any) {
    if (e instanceof ApiError) throw e;
    throw new ApiError(e?.name === "AbortError" ? "El servidor no respondió a tiempo." : "No se pudo contactar al servidor.");
  } finally {
    clearTimeout(timer);
  }
}
