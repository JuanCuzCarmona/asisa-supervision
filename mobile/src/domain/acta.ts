import type { ItemChecklist, Observacion, Ronda, Valoracion } from "../types";

export interface IncidenciaPayload {
  item_id?: number;
  item_titulo: string;
  valoracion: Valoracion;
  area_responsable: string;
  categoria: string;
  descripcion: string;
  vigilador_id?: number;
}

/** Cada ítem R/M genera un ticket al área de la observación elegida (o del ítem);
 *  cada negativa a firmar genera uno a RRHH. Misma regla que construirActa() en la web. */
export function incidenciasDeRonda(rd: Ronda, defs: ItemChecklist[], catalogo: Observacion[]): IncidenciaPayload[] {
  const vigPrincipal = rd.vigiladores[0]?.id;
  const out: IncidenciaPayload[] = [];
  for (const [id, r] of Object.entries(rd.respuestas)) {
    if (r.valoracion === "B") continue;
    const def = defs.find(d => String(d.id) === id);
    const obs = r.observacion;
    const area = (obs && catalogo.find(o => o.texto === obs.texto)?.area) || obs?.area || def?.area_responsable || "Operaciones";
    out.push({
      item_id: def?.id,
      item_titulo: def?.titulo_corto || "Ítem",
      valoracion: r.valoracion,
      area_responsable: area,
      categoria: area,
      descripcion: obs?.texto || def?.titulo_corto || "Observación registrada",
      vigilador_id: vigPrincipal,
    });
  }
  for (const v of rd.vigiladores) {
    if (rd.firmas[v.id]?.nego) {
      out.push({
        item_titulo: "Firma del acta",
        valoracion: "M",
        area_responsable: "RRHH",
        categoria: "RRHH",
        descripcion: `Negativa a firmar el acta — ${v.nombre} (legajo ${v.legajo})`,
        vigilador_id: v.id,
      });
    }
  }
  return out;
}

/** Cuerpo de POST /api/rondas. Las fotos van aparte (se leen a base64 recién al enviar,
 *  así la cola no guarda megas de texto en SQLite). */
export function payloadRonda(rd: Ronda, defs: ItemChecklist[], catalogo: Observacion[], offline: boolean) {
  return {
    objetivo_id: rd.objetivo?.id,
    tipo: rd.tipo,
    // El servidor recalcula el geocerco con estas coordenadas; no mandamos nuestro veredicto.
    lat: rd.coords?.lat ?? null,
    lng: rd.coords?.lng ?? null,
    precision_gps_m: rd.coords?.accuracy != null ? Math.min(Math.round(rd.coords.accuracy), 1000) : null,
    justificacion_fuera: rd.tipo === "remota" ? rd.justificacion : null,
    sincronizado_offline: offline,
    hora_inicio: rd.horaInicio,
    hora_fin: new Date().toISOString(),
    vigiladores: rd.vigiladores.map(v => ({
      id: v.id,
      firma_base64: rd.firmas[v.id]?.dataUrl || null,
      nego_firmar: Boolean(rd.firmas[v.id]?.nego),
    })),
    checklist: Object.entries(rd.respuestas).map(([id, r]) => {
      const def = defs.find(d => String(d.id) === id);
      return {
        item_id: def?.id,
        pregunta: def?.titulo_corto,
        valoracion: r.valoracion,
        observacion_pred: r.observacion?.texto || null,
        observacion_libre: null,
      };
    }),
    incidencias: incidenciasDeRonda(rd, defs, catalogo),
  };
}
