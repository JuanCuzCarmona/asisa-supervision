/** Pide un motivo concreto y una explicación legible sin depender de conexión. */
export const MOTIVOS_REMOTOS = ["Acceso impedido", "Emergencia", "Indicación operativa", "Otro motivo"] as const;

export function validarJustificacion(motivo: string, detalle: string): string | null {
  if (!motivo) return "Elegí el motivo de la supervisión remota.";
  const texto = detalle.trim().replace(/\s+/g, " ");
  const palabras = texto.match(/[a-záéíóúüñ]{2,}/gi) || [];
  if (texto.length < 20 || palabras.length < 4) return "Explicá qué pasó en al menos cuatro palabras.";
  if (new Set(palabras.map(p => p.toLocaleLowerCase("es-AR"))).size < 3 || /(.)\1{4,}/i.test(texto)) {
    return "Escribí una explicación concreta, sin texto repetido.";
  }
  return null;
}
