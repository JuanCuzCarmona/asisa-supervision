import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../api";
import { fechaCorta, hora } from "../domain/formato";
import { useSession } from "./session";
import type { Ticket } from "../types";

/** Tickets desde GET /api/tickets, o los de demo si no hay servidor. */
export function useTickets() {
  const s = useSession();
  const [api, setApi] = useState<Ticket[] | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    if (!s.apiUrl || !s.token) { setApi(null); return; }
    setCargando(true); setError(null);
    try {
      const d = await apiFetch<any>(s.apiUrl, "/api/tickets?limite=100", { token: s.token });
      setApi(d.tickets.map((t: any): Ticket => ({
        id: t.codigo_ticket, dbId: t.id, objetivo: t.objetivo, supervisor: t.supervisor,
        valoracion: t.valoracion || "R", area: t.area_responsable,
        estado: t.estado === "ABIERTO" ? "Activa" : "Cerrada", descripcion: t.descripcion,
        item: t.item_titulo, vigilador: t.vigilador, resolucion: t.resolucion,
        fecha: `${fechaCorta(t.fecha_creacion)} · ${hora(t.fecha_creacion)}`,
      })));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }, [s.apiUrl, s.token]);

  useEffect(() => { cargar(); }, [cargar]);

  const resolver = useCallback(async (t: Ticket, resolucion: string) => {
    if (s.apiUrl && t.dbId) {
      await apiFetch(s.apiUrl, `/api/tickets/${t.dbId}/resolver`, { method: "PATCH", token: s.token, body: { resolucion } });
      setApi(l => l?.map(x => (x.id === t.id ? { ...x, estado: "Cerrada", resolucion } : x)) ?? l);
    } else {
      s.cerrarTicketDemo(t.id, resolucion);
    }
  }, [s]);

  return { tickets: api ?? s.ticketsDemo, cargando, error, recargar: cargar, resolver };
}
