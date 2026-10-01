/* Tipos del dominio — mismo shape que devuelve GET /api/inicializar (server.js). */

export type Rol = "supervisor" | "admin" | "dueno";
export type Valoracion = "B" | "R" | "M";

export interface Usuario { id: number; nombre: string; rol: Rol }

export interface Objetivo {
  id: number;
  nombre: string;
  tipo: string;
  subtipo: string;
  modalidad?: string;
  direccion?: string | null;
  lat: number | null;
  lng: number | null;
  radio_geocerca_m: number;
  visitas_meta_mes?: number;
  visitas_mes?: number;
}

export interface Vigilador {
  id: number;
  legajo: number;
  nombre: string;
  dni?: string;
  puesto?: string;
  estado: string;
  credencial_numero?: string | null;
  credencial_venc?: string | null;
  es_chofer?: boolean;
  licencia_cat?: string | null;
  licencia_venc?: string | null;
  armado?: boolean;
  telefono?: string | null;
  domicilio?: string | null;
  fecha_nacimiento?: string | null;
  nacionalidad?: string | null;
  foto_url?: string | null;
  convenio?: string | null;
  tiene_radio?: boolean;
  objetivo_asignado?: string | null;
}

export interface Seccion { id: number; clave: string; nombre: string; color?: string; orden: number }

export interface ItemChecklist {
  id: number;
  seccion_clave: string;
  titulo_corto: string;
  criterio_completo: string;
  area_responsable: string;
  tipos_objetivo: string[];
  orden: number;
}

export interface Ajuste { objetivo_id: number; item_id: number; incluido: boolean; nota?: string }
export interface Observacion { id?: number; area: string; texto: string }

export interface Catalogos {
  objetivos: Objetivo[];
  vigiladores: Vigilador[];
  secciones: Seccion[];
  checklist: ItemChecklist[];
  ajustes: Ajuste[];
  observaciones: Observacion[];
}

export interface Coords { lat: number; lng: number; accuracy: number | null }

export interface Respuesta { valoracion: Valoracion; observacion?: Observacion | null }

export interface Foto { uri: string; lat: number | null; lng: number | null; tomadaEn: string }

/** Firma de un vigilador: imagen PNG (data URL) o negativa registrada. */
export interface Firma { dataUrl?: string | null; nego?: boolean; hora?: string }

export interface Ronda {
  objetivo: Objetivo | null;
  tipo: "presencial" | "remota";
  justificacion: string;
  coords: Coords | null;
  distanciaM: number | null;
  horaInicio: string | null;
  vigiladores: Vigilador[];
  respuestas: Record<number, Respuesta>;
  fotos: Foto[];
  firmas: Record<number, Firma>;
}

export interface Ticket {
  id: string;
  dbId?: number;
  objetivo: string;
  supervisor: string;
  valoracion: Valoracion;
  area: string;
  estado: "Activa" | "Cerrada";
  descripcion: string;
  item?: string | null;
  vigilador?: string | null;
  fecha: string;
  resolucion?: string | null;
}
