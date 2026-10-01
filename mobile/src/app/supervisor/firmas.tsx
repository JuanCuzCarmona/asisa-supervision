/* Paso 5 — Firmas por vigilador (o negativa registrada) y cierre del acta. */
import { useRef, useState } from "react";
import { Image, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn } from "react-native-reanimated";
import { Avatar, BarraAccion, BarraPaso, Boton, Chip, Etiqueta, FilaDato, Grupo, T } from "../../components/ui";
import { PadFirma, type PadFirmaRef } from "../../components/PadFirma";
import { hora, iniciales } from "../../domain/formato";
import { formatoDistancia } from "../../domain/geo";
import { useRonda } from "../../state/ronda";
import { color, font, radius } from "../../theme";
import type { Vigilador } from "../../types";

function TarjetaFirma({ v }: { v: Vigilador }) {
  const { rd, setRd } = useRonda();
  const pad = useRef<PadFirmaRef>(null);
  const [trazo, setTrazo] = useState(false);
  const f = rd.firmas[v.id];
  const set = (firma: typeof f | undefined) => setRd(p => {
    const firmas = { ...p.firmas };
    if (firma) firmas[v.id] = firma; else delete firmas[v.id];
    return { ...p, firmas };
  });

  const confirmar = async () => {
    const dataUrl = await pad.current?.exportar();
    if (!dataUrl) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    set({ dataUrl, hora: new Date().toISOString() });
  };

  const estado = f?.dataUrl ? "Firmado" : f?.nego ? "No firmó" : "Pendiente";
  return (
    <View style={{ marginTop: 16, backgroundColor: color.superficie, borderWidth: 1, borderColor: color.linea, borderRadius: radius.card, padding: 16 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <Avatar texto={iniciales(v.nombre)} />
        <View style={{ flex: 1 }}>
          <T v="bodyLg">{v.nombre}</T>
          <T v="small" c={color.tintaMuda}>Legajo {v.legajo}</T>
        </View>
        <Chip texto={estado} tono={f?.dataUrl ? "bien" : f?.nego ? "mal" : "neutro"} />
      </View>

      {f?.dataUrl ? (
        <Animated.View entering={FadeIn}>
          <View style={{ marginTop: 14, height: 160, borderRadius: radius.control, borderWidth: 1, borderColor: color.linea, overflow: "hidden", backgroundColor: "#fff" }}>
            <Image source={{ uri: f.dataUrl }} style={{ width: "100%", height: "100%" }} resizeMode="contain" accessibilityLabel={`Firma de ${v.nombre}`} />
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
            <T v="small" c={color.tintaSuave}>Firmado a las {hora(f.hora || new Date())}</T>
            <Boton variante="texto" titulo="Borrar firma" onPress={() => { set(undefined); setTrazo(false); }} />
          </View>
        </Animated.View>
      ) : f?.nego ? (
        <Animated.View entering={FadeIn}>
          <View style={{ marginTop: 14, padding: 14, borderRadius: radius.control, backgroundColor: color.malTint }}>
            <T v="bodyLg" c={color.malInk}>Negativa a firmar registrada</T>
            <T v="meta" c={color.malInk} style={{ fontFamily: font.regular }}>Queda asentada en el acta y se genera un ticket a RRHH.</T>
          </View>
          <View style={{ alignItems: "flex-end" }}><Boton variante="texto" titulo="Deshacer" onPress={() => set(undefined)} /></View>
        </Animated.View>
      ) : (
        <View style={{ marginTop: 14, gap: 10 }}>
          <PadFirma ref={pad} onCambio={setTrazo} />
          <View style={{ flexDirection: "row", gap: 10 }}>
            <Boton variante="secundario" titulo="Se negó" alto={52} style={{ flex: 1 }} onPress={() => set({ nego: true, hora: new Date().toISOString() })} />
            {trazo
              ? <Boton variante="tintado" titulo="Borrar" alto={52} style={{ flex: 1 }} onPress={() => pad.current?.limpiar()} />
              : null}
            <Boton titulo="Confirmar firma" alto={52} style={{ flex: 1.4 }} deshabilitado={!trazo} onPress={confirmar} />
          </View>
        </View>
      )}
    </View>
  );
}

export default function Firmas() {
  const { rd, items, guardar } = useRonda();
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cuenta = { B: 0, R: 0, M: 0 };
  for (const r of Object.values(rd.respuestas)) cuenta[r.valoracion]++;
  const faltan = rd.vigiladores.filter(v => !rd.firmas[v.id]).length;

  const cerrar = async () => {
    setError(null); setGuardando(true);
    try {
      await guardar();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/supervisor/acta");
    } catch (e: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(e.message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: color.fondo }}>
      <BarraPaso atras="Evidencia" paso={5} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}>
        <T v="display" style={{ marginTop: 12 }}>Firmas y cierre</T>
        <T v="body" c={color.tintaSuave} style={{ marginTop: 4 }}>Cada vigilador inspeccionado firma el acta.</T>

        <Etiqueta style={{ marginTop: 22 }}>Resumen de la ronda</Etiqueta>
        <Grupo>
          <FilaDato k="Objetivo" v={rd.objetivo?.nombre || "—"} />
          <FilaDato k="Modalidad" v={rd.tipo === "remota" ? "Remota" : `Presencial${rd.distanciaM != null ? ` · a ${formatoDistancia(rd.distanciaM)}` : ""}`} />
          <View style={{ minHeight: 48, paddingHorizontal: 16, paddingVertical: 10, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: color.lineaSuave }}>
            <T v="body" c={color.tintaSuave}>Checklist</T>
            <View style={{ flexDirection: "row", gap: 6 }}>
              <Chip texto={`${cuenta.B} Bueno`} tono="bien" />
              {cuenta.R > 0 && <Chip texto={`${cuenta.R} Regular`} tono="regular" />}
              {cuenta.M > 0 && <Chip texto={`${cuenta.M} Malo`} tono="mal" />}
            </View>
          </View>
          <FilaDato k="Fotos" v={`${rd.fotos.length} de evidencia · ${items.length} ítems evaluados`} ultima />
        </Grupo>

        {rd.vigiladores.map(v => <TarjetaFirma key={v.id} v={v} />)}

        {error && (
          <View accessibilityLiveRegion="polite" style={{ marginTop: 16, padding: 14, borderRadius: radius.card, backgroundColor: color.malSoft }}>
            <T v="bodyLg" c={color.malInk}>El servidor rechazó el acta</T>
            <T v="meta" c={color.malInk} style={{ fontFamily: font.regular }}>{error}</T>
          </View>
        )}
      </ScrollView>
      <BarraAccion resumen={faltan ? (faltan === 1 ? "Falta 1 firma" : `Faltan ${faltan} firmas`) : "Todo listo para generar el acta"}>
        <Boton titulo="Guardar y generar acta" alto={58} deshabilitado={faltan > 0} cargando={guardando} onPress={cerrar} />
      </BarraAccion>
    </View>
  );
}
