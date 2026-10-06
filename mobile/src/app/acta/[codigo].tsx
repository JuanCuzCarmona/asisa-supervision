/* Consulta de acta completa para Administración y Dirección. */
import { useEffect, useState } from "react";
import { ActivityIndicator, Image, ScrollView, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { apiFetch } from "../../api";
import { Boton, Chip, FilaDato, Grupo, Logo, T } from "../../components/ui";
import { fechaCorta, hora } from "../../domain/formato";
import { useRonda } from "../../state/ronda";
import { useSession } from "../../state/session";
import { color, font, radius, valoracionTono } from "../../theme";

interface ActaApi {
  acta: { codigo_acta: string; objetivo: string; direccion: string | null; objetivo_tipo: string;
    supervisor: string; tipo: string; en_geocerca: boolean; fecha_hora: string; hora_inicio: string | null; hora_fin: string | null;
    distancia_geocerca_m: number | null; precision_gps_m: number | null; lat: number | null; lng: number | null;
    justificacion_fuera: string | null; sincronizado_offline: boolean };
  checklist: { item_id: number | null; pregunta_texto: string; valoracion: "B" | "R" | "M";
    observacion_pred: string | null; observacion_libre: string | null; criterio_completo: string | null; area_responsable: string | null }[];
  vigiladores: { nombre: string; legajo: number; puesto: string | null; firma_base64: string | null; nego_firmar: boolean }[];
  evidencias: { id: number; imagen_base64: string; item_titulo: string | null; lat: number | null; lng: number | null; tomada_en: string }[];
  tickets: { codigo_ticket: string; area_responsable: string; descripcion: string; valoracion: "R" | "M"; estado: string; resolucion: string | null }[];
}

const fechaHora = (value: string | null) => value ? `${fechaCorta(value)} · ${hora(value)}` : "—";

export default function VerActa() {
  const ins = useSafeAreaInsets();
  const { codigo } = useLocalSearchParams<{ codigo: string }>();
  const { apiUrl, token } = useSession();
  const { resultado, items } = useRonda();
  const [datos, setDatos] = useState<ActaApi | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const clave = String(codigo || "");

  useEffect(() => {
    if (!token) { setCargando(false); return; }
    let vivo = true;
    apiFetch<ActaApi>(apiUrl, `/api/actas/${encodeURIComponent(clave)}`, { token })
      .then(d => { if (vivo) setDatos(d); })
      .catch(e => { if (vivo) setError(e.message); })
      .finally(() => { if (vivo) setCargando(false); });
    return () => { vivo = false; };
  }, [apiUrl, token, clave]);

  const acta = datos?.acta;
  return (
    <View style={{ flex: 1, backgroundColor: color.fondo }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: ins.top + 8, paddingBottom: 36 }}>
        <Boton variante="texto" titulo="‹ Volver" onPress={() => router.back()} style={{ alignSelf: "flex-start" }} />
        <T v="display" style={{ marginTop: 8 }}>Acta de supervisión</T>
        <T v="body" c={color.tintaSuave} style={{ marginTop: 4 }}>{clave}</T>
        {cargando && <ActivityIndicator color={color.accion} style={{ marginTop: 28 }} />}
        {error && <T v="meta" c={color.malInk} style={{ marginTop: 20 }}>{error}</T>}
        {!cargando && !datos && !error && (
          <T v="meta" c={color.tintaSuave} style={{ marginTop: 20 }}>El detalle de esta acta se ve con conexión al servidor.</T>
        )}

        {acta && <>
          <Grupo style={{ marginTop: 20 }}>
            <View style={{ padding: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <Logo ancho={100} /><T v="label" c={color.tintaSuave}>Acta ASI</T>
            </View>
            <FilaDato k="Objetivo" v={acta.objetivo} />
            <FilaDato k="Dirección" v={acta.direccion || "—"} />
            <FilaDato k="Supervisor" v={acta.supervisor} />
            <FilaDato k="Modalidad" v={acta.tipo === "remota" ? "Remota" : "Presencial"} />
            <FilaDato k="Geocerca" v={acta.en_geocerca ? "Dentro" : "Fuera"} vColor={acta.en_geocerca ? color.bienInk : color.regularInk} />
            <FilaDato k="Distancia y precisión" v={`${acta.distancia_geocerca_m ?? "—"} m · ±${acta.precision_gps_m ?? "—"} m`} />
            <FilaDato k="GPS" v={acta.lat != null && acta.lng != null ? `${acta.lat.toFixed(5)}, ${acta.lng.toFixed(5)}` : "—"} />
            <FilaDato k="Inicio" v={fechaHora(acta.hora_inicio)} />
            <FilaDato k="Cierre" v={fechaHora(acta.hora_fin || acta.fecha_hora)} ultima />
          </Grupo>
          {acta.justificacion_fuera && <View style={{ padding: 16, borderRadius: radius.card, marginTop: 12, backgroundColor: color.regularSoft }}>
            <T v="bodyLg" c={color.regularInk}>Justificación remota</T><T v="body" c={color.regularInk}>{acta.justificacion_fuera}</T>
          </View>}

          <T v="titleSm" style={{ marginTop: 24, marginBottom: 8 }}>Checklist · {datos.checklist.length} puntos</T>
          <Grupo>{datos.checklist.map((r, i) => (
            <View key={`${r.item_id}-${i}`} style={{ padding: 14, borderTopWidth: i ? 1 : 0, borderTopColor: color.linea }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <T v="meta" style={{ flex: 1, fontFamily: font.semibold }}>{r.pregunta_texto}</T>
                <Chip texto={valoracionTono[r.valoracion].label} tono={r.valoracion === "B" ? "bien" : r.valoracion === "R" ? "regular" : "mal"} />
              </View>
              {r.criterio_completo && <T v="small" c={color.tintaMuda} style={{ marginTop: 4 }}>{r.criterio_completo}</T>}
              {(r.observacion_pred || r.observacion_libre) && <T v="small" c={color.tintaSuave} style={{ marginTop: 5 }}>
                {[r.observacion_pred, r.observacion_libre].filter(Boolean).join(" · ")}
              </T>}
            </View>
          ))}</Grupo>

          <T v="titleSm" style={{ marginTop: 24, marginBottom: 8 }}>Evidencias · {datos.evidencias.length}</T>
          {datos.evidencias.length ? datos.evidencias.map(f => (
            <Grupo key={f.id} style={{ marginBottom: 12 }}>
              <Image source={{ uri: f.imagen_base64 }} style={{ width: "100%", height: 230 }} resizeMode="contain" />
              <View style={{ padding: 12 }}>
                <T v="meta" style={{ fontFamily: font.semibold }}>{f.item_titulo || "Evidencia general"}</T>
                <T v="small" c={color.tintaMuda}>{fechaHora(f.tomada_en)} · {f.lat != null && f.lng != null ? `${f.lat.toFixed(5)}, ${f.lng.toFixed(5)}` : "Sin GPS"}</T>
              </View>
            </Grupo>
          )) : <T v="meta" c={color.tintaSuave}>Sin fotos adjuntas.</T>}

          <T v="titleSm" style={{ marginTop: 24, marginBottom: 8 }}>Vigiladores y firmas</T>
          {datos.vigiladores.map(v => <Grupo key={v.legajo} style={{ padding: 14, marginBottom: 10 }}>
            <T v="bodyLg">{v.nombre}</T><T v="small" c={color.tintaMuda}>Legajo {v.legajo}{v.puesto ? ` · ${v.puesto}` : ""}</T>
            {v.nego_firmar ? <T v="meta" c={color.malInk} style={{ marginTop: 6 }}>Negativa a firmar registrada</T>
              : v.firma_base64 ? <Image source={{ uri: v.firma_base64 }} style={{ width: "100%", height: 90, marginTop: 8 }} resizeMode="contain" /> : null}
          </Grupo>)}

          <T v="titleSm" style={{ marginTop: 24, marginBottom: 8 }}>Incidencias · {datos.tickets.length}</T>
          {datos.tickets.map(t => <Grupo key={t.codigo_ticket} style={{ padding: 14, marginBottom: 10 }}>
            <T v="small" c={color.tintaMuda}>{t.codigo_ticket} · {t.area_responsable}</T>
            <T v="meta" style={{ fontFamily: font.semibold }}>{t.descripcion}</T>
            <T v="small" c={t.estado === "RESUELTO" ? color.bienInk : color.regularInk}>{t.estado === "RESUELTO" ? "Resuelta" : "Activa"}</T>
            {t.resolucion && <T v="small" c={color.tintaSuave}>{t.resolucion}</T>}
          </Grupo>)}
        </>}

      </ScrollView>
    </View>
  );
}
