/* Perfil del vigilador (PRD §9): datos del legajo, historial y sanciones. */
import { useEffect, useState } from "react";
import { Linking, ScrollView, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Avatar, Boton, Chip, Etiqueta, FilaDato, Grupo, Icono, T, useMargenInferior } from "../../../components/ui";
import { apiFetch } from "../../../api";
import { diasHasta, fechaCorta, iniciales } from "../../../domain/formato";
import { useSession } from "../../../state/session";
import { color, font, radius } from "../../../theme";

export default function Perfil() {
  const ins = useSafeAreaInsets();
  const abajo = useMargenInferior();
  const { legajo } = useLocalSearchParams<{ legajo: string }>();
  const { catalogos, apiUrl, token } = useSession();
  const v = catalogos.vigiladores.find(x => String(x.legajo) === String(legajo));
  // Historial y sanciones vienen de GET /api/vigilador/:legajo; sin señal se ve el legajo sin ellos.
  const [historial, setHistorial] = useState<any[]>([]);
  const [sanciones, setSanciones] = useState<any[]>([]);
  const [sinDatos, setSinDatos] = useState(false);
  useEffect(() => {
    if (!token || !legajo) return;
    apiFetch<any>(apiUrl, `/api/vigilador/${encodeURIComponent(String(legajo))}`, { token })
      .then(d => { setHistorial(d.historial || []); setSanciones(d.sanciones || []); setSinDatos(false); })
      .catch(() => setSinDatos(true));
  }, [apiUrl, token, legajo]);

  if (!v) return <View style={{ flex: 1, padding: 24, paddingTop: ins.top + 24 }}><T v="title">Legajo no encontrado</T></View>;

  const dias = diasHasta(v.credencial_venc);
  const vencida = dias != null && dias < 0;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: color.fondo }} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: ins.top + 8, paddingBottom: abajo + 28 }}>
      <View style={{ marginLeft: -12, alignSelf: "flex-start" }}>
        <Boton variante="texto" titulo="‹ Vigiladores" onPress={() => router.back()} />
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 16, marginTop: 8 }}>
        <Avatar texto={iniciales(v.nombre)} size={72} />
        <View style={{ flex: 1 }}>
          <T v="headline">{v.nombre}</T>
          <T v="meta" c={color.tintaSuave} style={{ marginTop: 4 }}>{v.puesto} · Legajo {v.legajo}</T>
        </View>
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
        <Chip texto={v.estado === "activo" ? "Activo" : v.estado.charAt(0).toUpperCase() + v.estado.slice(1)} tono={v.estado === "activo" ? "bien" : "mal"} />
        {v.es_chofer && <Chip texto={`Chofer ${v.licencia_cat || ""}`.trim()} />}
        {v.tiene_radio && <Chip texto="Con radio" />}
        <Chip texto={v.armado ? "Armado" : "No armado"} />
      </View>

      {vencida && (
        <View style={{ marginTop: 18, padding: 14, borderRadius: radius.card, backgroundColor: color.regularSoft, flexDirection: "row", gap: 12 }}>
          <Icono n="alert" c={color.regularInk} size={22} />
          <View style={{ flex: 1 }}>
            <T v="bodyLg" c={color.regularInk}>Credencial vencida</T>
            <T v="meta" c={color.regularInk} style={{ fontFamily: font.regular }}>{v.credencial_numero} venció el {fechaCorta(v.credencial_venc!)}. Verificala en el puesto.</T>
          </View>
        </View>
      )}

      <Etiqueta style={{ marginTop: 24 }}>Datos del legajo</Etiqueta>
      <Grupo>
        {v.dni ? <FilaDato k="DNI" v={v.dni} /> : null}
        <FilaDato k="Objetivo asignado" v={v.objetivo_asignado || "Sin asignar"} />
        {v.es_chofer && v.licencia_venc ? <FilaDato k={`Licencia ${v.licencia_cat || ""}`} v={`Vence ${fechaCorta(v.licencia_venc)}`} /> : null}
        <FilaDato k="Convenio" v={v.convenio || "—"} ultima />
      </Grupo>
      {v.telefono ? (
        <Boton variante="secundario" icono="phone" titulo={`Llamar · ${v.telefono}`} alto={52} style={{ marginTop: 10 }}
          onPress={() => Linking.openURL(`tel:${v.telefono!.replace(/\D/g, "")}`)} />
      ) : null}

      <Etiqueta style={{ marginTop: 24 }}>Historial</Etiqueta>
      {sinDatos && <T v="meta" c={color.regularInk} style={{ paddingHorizontal: 4, marginBottom: 8 }}>Sin conexión: no se pudo traer el historial.</T>}
      {historial.length === 0 ? <T v="meta" c={color.tintaSuave} style={{ paddingHorizontal: 4 }}>Sin registros.</T> : (
        <Grupo>
          {historial.map((h, i) => (
            <View key={i} style={{ flexDirection: "row", gap: 12, padding: 14, borderTopWidth: i ? 1 : 0, borderTopColor: color.lineaSuave }}>
              <T v="small" c={color.tintaSuave} style={{ width: 80, fontVariant: ["tabular-nums"] }}>{fechaCorta(h.fecha)}</T>
              <View style={{ flex: 1 }}>
                <T v="body" style={{ fontFamily: font.medium }}>{h.descripcion}</T>
                <T v="small" c={h.tipo === "Sanción" ? color.malInk : color.tintaMuda} style={{ fontFamily: h.tipo === "Sanción" ? font.semibold : font.regular, fontSize: 13 }}>{h.tipo}</T>
              </View>
            </View>
          ))}
        </Grupo>
      )}

      <Etiqueta style={{ marginTop: 24 }}>Sanciones</Etiqueta>
      {sanciones.length === 0 ? <T v="meta" c={color.tintaSuave} style={{ paddingHorizontal: 4 }}>Sin sanciones.</T> : (
        <Grupo>
          {sanciones.map((sa, i) => (
            <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderTopWidth: i ? 1 : 0, borderTopColor: color.lineaSuave }}>
              <View style={{ flex: 1 }}>
                <T v="body" style={{ fontFamily: font.medium }}>{sa.descripcion}</T>
                <T v="small" c={color.tintaMuda}>{fechaCorta(sa.fecha)}</T>
              </View>
              <Chip texto={sa.estado.charAt(0).toUpperCase() + sa.estado.slice(1)} tono={sa.estado === "activa" ? "mal" : "neutro"} />
            </View>
          ))}
        </Grupo>
      )}
    </ScrollView>
  );
}
