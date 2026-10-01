/* Modo sin conexión: actas guardadas en el celular esperando envío. */
import { ScrollView, View } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeIn } from "react-native-reanimated";
import { Boton, Chip, Etiqueta, Grupo, Icono, T } from "../../components/ui";
import { hora } from "../../domain/formato";
import { useSession } from "../../state/session";
import { color, font, radius } from "../../theme";

export default function Pendientes() {
  const ins = useSafeAreaInsets();
  const s = useSession();
  const n = s.pendientes.length;
  const panel = !s.online
    ? { titulo: "Sin conexión", detalle: n ? `${n} acta${n > 1 ? "s" : ""} esperan envío. Se mandan solas al volver la señal; reintentamos cada 60 segundos.` : "Podés seguir haciendo rondas: las actas quedan guardadas en el celular.", fondo: color.accion, tinta: "#fff", icono: "wifi-off" }
    : s.sincronizando
      ? { titulo: "Enviando actas…", detalle: "Conexión recuperada. No cierres la app.", fondo: color.avatar, tinta: color.marino, icono: "refresh" }
      : n
        ? { titulo: "Actas en cola", detalle: "Hay conexión pero el servidor no las aceptó todavía. Reintentá o revisá el error.", fondo: color.regularSoft, tinta: color.regularInk, icono: "alert" }
        : { titulo: "Todo sincronizado", detalle: "No hay actas pendientes en este celular.", fondo: color.bienSoft, tinta: color.bienInk, icono: "check" };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: color.fondo }} contentContainerStyle={{ padding: 20, paddingTop: ins.top + 8, paddingBottom: ins.bottom + 24 }}>
      <View style={{ marginLeft: -12, alignSelf: "flex-start" }}><Boton variante="texto" titulo="‹ Inicio" onPress={() => router.back()} /></View>
      <T v="display" style={{ marginTop: 6, marginBottom: 16 }}>Conexión</T>
      <Animated.View entering={FadeIn} style={{ padding: 16, borderRadius: radius.card, backgroundColor: panel.fondo, gap: 12 }}>
        <View style={{ flexDirection: "row", gap: 12 }}>
          <Icono n={panel.icono} c={panel.tinta} size={26} />
          <View style={{ flex: 1 }}>
            <T v="titleSm" c={panel.tinta}>{panel.titulo}</T>
            <T v="body" c={panel.tinta} style={{ marginTop: 2 }}>{panel.detalle}</T>
          </View>
        </View>
        {s.online && n > 0 && !s.sincronizando && <Boton variante="secundario" titulo="Reintentar ahora" alto={50} onPress={s.sincronizarAhora} />}
      </Animated.View>

      <Etiqueta style={{ marginTop: 24 }}>Actas en este dispositivo</Etiqueta>
      {n === 0 ? <T v="meta" c={color.tintaSuave} style={{ paddingHorizontal: 4 }}>Ninguna.</T> : (
        <Grupo>
          {s.pendientes.map((p, i) => (
            <View key={p.id} style={{ minHeight: 68, paddingHorizontal: 16, paddingVertical: 12, flexDirection: "row", alignItems: "center", gap: 12, borderTopWidth: i ? 1 : 0, borderTopColor: color.lineaSuave }}>
              <View style={{ flex: 1 }}>
                <T v="bodyLg">{p.objetivo}</T>
                <T v="small" c={color.tintaMuda}>{hora(p.creada)} · {p.fotos.length} foto{p.fotos.length === 1 ? "" : "s"}{p.intentos ? ` · ${p.intentos} intento${p.intentos > 1 ? "s" : ""}` : ""}</T>
                {p.ultimoError ? <T v="small" c={color.malInk} style={{ fontFamily: font.medium, marginTop: 2 }}>{p.ultimoError}</T> : null}
              </View>
              <Chip texto="En cola" tono="regular" />
            </View>
          ))}
        </Grupo>
      )}
      <T v="meta" c={color.tintaSuave} style={{ marginTop: 12, paddingHorizontal: 4, fontFamily: font.regular }}>
        Las actas quedan guardadas aunque cierres la app.
      </T>
    </ScrollView>
  );
}
