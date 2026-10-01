export const iniciales = (nombre = "") =>
  nombre.trim().split(/\s+/).slice(0, 2).map(w => w[0] || "").join("").toUpperCase();

export const hora = (d: Date | string) =>
  new Date(d).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", hour12: false });

export const fechaCorta = (d: Date | string) =>
  new Date(d).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });

export const fechaLarga = (d: Date) => {
  const t = d.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" });
  return t.charAt(0).toUpperCase() + t.slice(1);
};

/** Días hasta una fecha (negativo si ya pasó). */
export const diasHasta = (f?: string | null) =>
  f ? Math.ceil((new Date(f).getTime() - Date.now()) / 86400000) : null;
