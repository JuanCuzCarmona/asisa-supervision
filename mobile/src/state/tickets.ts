import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../api";
import { fechaCorta, hora } from "../domain/formato";
import { useSession } from "./session";
import type { Ticket } from "../types";

/** Tickets desde GET /api/tickets. Sin señal se conserva la última lista cargada. */
export function useTickets() {
  const s = useSession();
  const [api, setApi] = useState<Ticket[] | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    if (!s.token) return;
    setCargando(true); setError(null);
    try {
      const todos: any[] = [];
      let pagina = 1;
      let paginas = 1;
      do {
        const d = await apiFetch<any>(s.apiUrl, `/api/tickets?limite=200&pagina=${pagina}`, { token: s.token });
        todos.push(...d.tickets);
        paginas = d.paginacion?.paginas || 1;
        pagina++;
      } while (pagina <= paginas);
      setApi(todos.map((t: any): Ticket => ({
        id: t.codigo_ticket, dbId: t.id, objetivo: t.objetivo, supervisor: t.supervisor,
        valoracion: t.valoracion || "R", area: t.area_responsable,
        estado: t.estado === "ABIERTO" ? "Activa" : "Cerrada", descripcion: t.descripcion,
        item: t.item_titulo, vigilador: t.vigilador, resolucion: t.resolucion,
        fecha: `${fechaCorta(t.fecha_creacion)} · ${hora(t.fecha_creacion)}`,
        fechaIso: t.fecha_creacion, codigoActa: t.codigo_acta, tipoRonda: t.tipo_ronda,
        enGeocerca: t.en_geocerca,
      })));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }, [s.apiUrl, s.token]);

  useEffect(() => { cargar(); }, [cargar]);

  const resolver = useCallback(async (t: Ticket, resolucion: string) => {
    await apiFetch(s.apiUrl, `/api/tickets/${t.dbId}/resolver`, { method: "PATCH", token: s.token, body: { resolucion } });
    setApi(l => l?.map(x => (x.id === t.id ? { ...x, estado: "Cerrada", resolucion } : x)) ?? l);
  }, [s]);

  const tickets: Ticket[] = api ?? [];
  return { tickets, cargando, error, recargar: cargar, resolver };
}
