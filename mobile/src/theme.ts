/* Tokens del sistema "Apple institucional" — fuente: ../DESIGN.md.
   Mismos valores que la web; si cambian allá, cambian acá. */

export const color = {
  marino: "#16256E",
  accion: "#1F327C",
  logo: "#2D4175",
  enlace: "#2152A1",
  tintaSuave: "#4A5578",
  tintaMuda: "#6B7494",
  placeholder: "#8A93B0",
  lineaFuerte: "#B9C2DA",
  bordeControl: "#CCD3E3",
  bordeCampo: "#D5DAE6",
  linea: "#E2E6EF",
  lineaSuave: "#EEF1F6",
  riel: "#E6EAF2",
  avatar: "#E6EAF5",
  seleccion: "#EEF1F8",
  fondo: "#F4F6FA",
  superficie: "#FFFFFF",
  overlay: "rgba(12,20,52,0.38)",

  bien: "#047857", bienPunto: "#10B981", bienInk: "#065F46", bienSoft: "#D1FAE5", bienTint: "#ECFDF5",
  regular: "#B45309", regularInk: "#92400E", regularSoft: "#FEF3C7",
  mal: "#BE123C", malPunto: "#F43F5E", malInk: "#9F1239", malSoft: "#FFE4E6", malTint: "#FFF1F2",
  fotoPlaceholder: "#2A3350",
} as const;

export const font = {
  regular: "Barlow_400Regular",
  medium: "Barlow_500Medium",
  semibold: "Barlow_600SemiBold",
  bold: "Barlow_700Bold",
  label: "BarlowSemiCondensed_600SemiBold",
} as const;

export const radius = { chip: 13, control: 12, card: 14, sheet: 22 } as const;
export const space = { xs: 8, sm: 12, md: 16, lg: 20, xl: 24 } as const;

/** Tonos semánticos del Likert B/R/M (Regla del Semáforo Honesto). */
export const valoracionTono = {
  B: { label: "Bueno", solido: color.bien, ink: color.bienInk, soft: color.bienSoft },
  R: { label: "Regular", solido: color.regular, ink: color.regularInk, soft: color.regularSoft },
  M: { label: "Malo", solido: color.mal, ink: color.malInk, soft: color.malSoft },
} as const;
