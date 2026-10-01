import type { Ajuste, ItemChecklist, Objetivo } from "../types";

export const SUBTIPO_LABEL: Record<string, string> = {
  barrio_multipuesto: "Barrio · Multipuesto",
  barrio_unipersonal: "Barrio · Unipersonal",
  local_comercial: "Local comercial",
  industria: "Industria / Planta",
  empresa_oficinas: "Empresa / Oficinas",
};

/** Mismo algoritmo que la web: un ajuste explícito del objetivo gana; si no hay,
 *  decide la plantilla del subtipo (checklist_items.tipos_objetivo). */
export function resolverChecklist(objetivo: Objetivo | null, defs: ItemChecklist[], ajustes: Ajuste[]) {
  if (!objetivo) return [];
  const sub = objetivo.subtipo || "barrio_unipersonal";
  const propios = new Map(
    ajustes.filter(a => String(a.objetivo_id) === String(objetivo.id)).map(a => [String(a.item_id), a]),
  );
  return defs.filter(d => {
    const ajuste = propios.get(String(d.id));
    if (ajuste) return ajuste.incluido;
    return (d.tipos_objetivo || []).includes(sub);
  });
}
