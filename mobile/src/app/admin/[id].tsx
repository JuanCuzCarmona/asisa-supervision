/* Detalle de incidencia y cierre con resolución técnica. */
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, TextInput, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Animated, { ZoomIn } from "react-native-reanimated";
import { BarraAccion, Boton, Chip, FilaDato, Grupo, Icono, T } from "../../components/ui";
import { useTickets } from "../../state/tickets";
import { color, font, radius, valoracionTono } from "../../theme";

export default function DetalleIncidencia() {
  const ins = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { tickets, resolver, cargando } = useTickets();
  const t = tickets.find(x => x.id === decodeURIComponent(String(id)));
  const [texto, setTexto] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!t) return <View style={{ flex: 1, padding: 24, paddingTop: ins.top + 24 }}><T v="title">{cargando ? "Cargando incidencia…" : "Incidencia no encontrada"}</T></View>;
  const ok = texto.trim().length >= 5;

  const cerrar = async () => {
    setGuardando(true); setError(null);
    try {
      await resolver(t, texto.trim());
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: color.fondo }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: ins.top + 8, paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginLeft: -12 }}>
          <Boton variante="texto" titulo="‹ Incidencias" onPress={() => router.back()} />
          <T v="small" c={color.tintaSuave} style={{ fontVariant: ["tabular-nums"] }}>{t.id}</T>
        </View>
        <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
          <Chip texto={valoracionTono[t.valoracion].label} tono={t.valoracion === "M" ? "mal" : "regular"} />
          <Chip texto={t.area} />
          <Chip texto={t.estado} tono={t.estado === "Cerrada" ? "bien" : "regular"} />
        </View>
        <T v="headline" style={{ marginTop: 12 }}>{t.objetivo}</T>
        <T v="body" style={{ marginTop: 6, fontSize: 17 }}>{t.descripcion}</T>

        <Grupo style={{ marginTop: 18 }}>
          {t.item ? <FilaDato k="Ítem" v={t.item} /> : null}
          {t.vigilador ? <FilaDato k="Vigilador" v={t.vigilador} /> : null}
          <FilaDato k="Supervisor" v={t.supervisor} />
          {t.codigoActa ? <FilaDato k="Acta" v={t.codigoActa} /> : null}
          <FilaDato k="Registrado" v={t.fecha} ultima />
        </Grupo>
        {t.codigoActa && <Boton variante="contorno" titulo="Ver acta y evidencias"
          onPress={() => router.push(`/acta/${encodeURIComponent(t.codigoActa!)}`)} style={{ marginTop: 14 }} />}

        {t.estado === "Activa" ? (
          <View style={{ marginTop: 22 }}>
            <T v="bodyLg" style={{ marginBottom: 8 }}>Resolución técnica</T>
            <TextInput value={texto} onChangeText={setTexto} multiline placeholder="Describí la acción concreta que resolvió la incidencia."
              placeholderTextColor={color.placeholder}
              style={{ minHeight: 120, padding: 14, textAlignVertical: "top", backgroundColor: color.superficie, borderWidth: 1, borderColor: color.bordeCampo,
                borderRadius: radius.control, fontFamily: font.regular, fontSize: 17, color: color.marino }} />
            <T v="small" c={color.tintaSuave} style={{ marginTop: 6 }}>Mínimo 5 caracteres.</T>
            {error && <T v="meta" c={color.malInk} style={{ marginTop: 8 }}>{error}</T>}
          </View>
        ) : (
          <Animated.View entering={ZoomIn.duration(250)} style={{ marginTop: 22, padding: 16, borderRadius: radius.card, backgroundColor: color.bienTint, gap: 6 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Icono n="check" c={color.bienInk} size={18} w={2.6} />
              <T v="bodyLg" c={color.bienInk}>Incidencia resuelta</T>
            </View>
            {t.resolucion ? <T v="body" c={color.bienInk}>{t.resolucion}</T> : null}
          </Animated.View>
        )}
      </ScrollView>
      <BarraAccion>
        {t.estado === "Activa"
          ? <Boton titulo="Cerrar incidencia" alto={58} deshabilitado={!ok} cargando={guardando} onPress={cerrar} />
          : <Boton variante="secundario" titulo="Volver a incidencias" alto={58} onPress={() => router.back()} />}
      </BarraAccion>
    </KeyboardAvoidingView>
  );
}
