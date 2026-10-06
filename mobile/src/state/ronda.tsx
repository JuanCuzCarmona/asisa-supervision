/* Estado del asistente de ronda (5 pasos) y guardado del acta. */
import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { apiFetch } from "../api";
import { incidenciasDeRonda, payloadRonda } from "../domain/acta";
import { resolverChecklist } from "../domain/checklist";
import * as outbox from "./outbox";
import { useSession } from "./session";
import type { Ronda, Valoracion } from "../types";

export interface TicketActa { codigo: string; texto: string; area: string; valoracion: Valoracion }

export interface ActaResultado {
  codigo: string;
  estado: "enviada" | "encolada";
  fecha: string;
  tickets: TicketActa[];
  ronda: Ronda;
}

const RONDA_VACIA: Ronda = {
  objetivo: null, tipo: "presencial", justificacion: "", coords: null, distanciaM: null,
  horaInicio: null, vigiladores: [], respuestas: {}, fotos: [], firmas: {},
};

interface RondaCtx {
  rd: Ronda;
  setRd: React.Dispatch<React.SetStateAction<Ronda>>;
  items: ReturnType<typeof resolverChecklist>;
  resultado: ActaResultado | null;
  guardar: () => Promise<ActaResultado>;
  reiniciar: () => void;
}

const Ctx = createContext<RondaCtx | null>(null);

export function RondaProvider({ children }: { children: React.ReactNode }) {
  const s = useSession();
  const [rd, setRd] = useState<Ronda>(RONDA_VACIA);
  const [resultado, setResultado] = useState<ActaResultado | null>(null);

  const items = useMemo(
    () => resolverChecklist(rd.objetivo, s.catalogos.checklist, s.catalogos.ajustes),
    [rd.objetivo, s.catalogos.checklist, s.catalogos.ajustes],
  );

  const guardar = useCallback(async () => {
    const { checklist, observaciones } = s.catalogos;
    const incs = incidenciasDeRonda(rd, checklist, observaciones);
    const ahora = new Date();
    const mes = `${ahora.getFullYear()}${String(ahora.getMonth() + 1).padStart(2, "0")}`;
    const locales: TicketActa[] = incs.map((i, n) => ({
      codigo: `INC-${mes}-L${String(n + 1).padStart(3, "0")}`,
      texto: i.descripcion, area: i.area_responsable, valoracion: i.valoracion,
    }));
    const codigoLocal = `ACTA-${mes}${String(ahora.getDate()).padStart(2, "0")}-L${String(Date.now()).slice(-5)}`;
    const fotos = rd.fotos.map(f => ({ uri: f.uri, lat: f.lat, lng: f.lng, itemId: f.itemId, tomadaEn: f.tomadaEn }));
    const objetivo = rd.objetivo?.nombre || "Objetivo";

    let res: ActaResultado;
    if (!s.online) {
      await outbox.encolar(objetivo, payloadRonda(rd, checklist, observaciones, true), fotos);
      await s.refrescarPendientes();
      res = { codigo: codigoLocal, estado: "encolada", fecha: ahora.toISOString(), tickets: locales, ronda: rd };
    } else {
      const body = { ...payloadRonda(rd, checklist, observaciones, false), evidencias: await outbox.evidenciasBase64(fotos) };
      try {
        const d = await apiFetch<any>(s.apiUrl, "/api/rondas", { method: "POST", token: s.token, body, timeoutMs: 60000 });
        const tickets = (d.tickets || []).map((t: any, n: number) => ({ ...locales[n], codigo: t.codigo_ticket }));
        res = { codigo: d.codigo_acta, estado: "enviada", fecha: ahora.toISOString(), tickets, ronda: rd };
      } catch (e: any) {
        // Rechazo del servidor (4xx/5xx): se muestra, no se encola — reintentar no lo arregla.
        if (e?.status != null) throw e;
        // Se cayó la red en el medio: el acta queda a salvo en la cola.
        await outbox.encolar(objetivo, payloadRonda(rd, checklist, observaciones, true), fotos);
        await s.refrescarPendientes();
        res = { codigo: codigoLocal, estado: "encolada", fecha: ahora.toISOString(), tickets: locales, ronda: rd };
      }
    }
    setResultado(res);
    return res;
  }, [rd, s]);

  const reiniciar = useCallback(() => { setRd(RONDA_VACIA); setResultado(null); }, []);

  const value = useMemo(() => ({ rd, setRd, items, resultado, guardar, reiniciar }), [rd, items, resultado, guardar, reiniciar]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useRonda() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useRonda fuera de RondaProvider");
  return c;
}
