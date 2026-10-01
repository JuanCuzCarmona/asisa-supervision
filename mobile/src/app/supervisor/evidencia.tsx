/* Paso 4 — Evidencia fotográfica. Cada foto se sella con fecha, hora, GPS y
   supervisor en el momento de tomarla (la marca queda grabada en el archivo). */
import { useRef, useState } from "react";
import { Image, Pressable, ScrollView, View } from "react-native";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { Directory, File, Paths } from "expo-file-system";
import { captureRef } from "react-native-view-shot";
import Animated, { FadeIn, ZoomIn } from "react-native-reanimated";
import { BarraAccion, BarraPaso, Boton, Etiqueta, Icono, T } from "../../components/ui";
import { useRonda } from "../../state/ronda";
import { useSession } from "../../state/session";
import { color, font, radius } from "../../theme";

const MAX_FOTOS = 6;

interface Sellando { uri: string; aspecto: number; lat: number | null; lng: number | null; fecha: Date }

export default function Evidencia() {
  const { usuario } = useSession();
  const { rd, setRd } = useRonda();
  const [sellando, setSellando] = useState<Sellando | null>(null);
  const [error, setError] = useState<string | null>(null);
  const marco = useRef<View>(null);

  const tomar = async (camara: boolean) => {
    setError(null);
    const perm = camara ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { setError(camara ? "Necesitamos permiso para usar la cámara." : "Necesitamos permiso para acceder a la galería."); return; }
    const res = camara
      ? await ImagePicker.launchCameraAsync({ quality: 0.7, mediaTypes: ["images"] })
      : await ImagePicker.launchImageLibraryAsync({ quality: 0.7, mediaTypes: ["images"] });
    if (res.canceled || !res.assets?.[0]) return;
    const a = res.assets[0];
    // Posición al momento de la foto; si no hay, la de la ronda.
    let lat = rd.coords?.lat ?? null, lng = rd.coords?.lng ?? null;
    try {
      const p = await Location.getLastKnownPositionAsync({ maxAge: 60000 });
      if (p) { lat = p.coords.latitude; lng = p.coords.longitude; }
    } catch { /* sin GPS: queda la de la ronda */ }
    setSellando({ uri: a.uri, aspecto: a.width && a.height ? a.width / a.height : 4 / 3, lat, lng, fecha: new Date() });
  };

  const sellar = async () => {
    if (!sellando || !marco.current) return;
    try {
      await new Promise(r => setTimeout(r, 120)); // un frame para que pinte la marca de agua
      const tmp = await captureRef(marco, { format: "jpg", quality: 0.82, result: "tmpfile" });
      const dir = new Directory(Paths.document, "evidencias");
      if (!dir.exists) dir.create();
      const destino = new File(dir, `foto-${Date.now()}.jpg`);
      new File(tmp).copy(destino);
      setRd(p => ({ ...p, fotos: [...p.fotos, { uri: destino.uri, lat: sellando.lat, lng: sellando.lng, tomadaEn: sellando.fecha.toISOString() }] }));
    } catch {
      setError("No se pudo sellar la foto. Probá de nuevo.");
    } finally {
      setSellando(null);
    }
  };

  const quitar = (uri: string) => setRd(p => ({ ...p, fotos: p.fotos.filter(f => f.uri !== uri) }));

  const n = rd.fotos.length;
  const sello = sellando ? [
    `${sellando.fecha.toLocaleDateString("es-AR")} · ${sellando.fecha.toLocaleTimeString("es-AR", { hour12: false })}`,
    sellando.lat != null ? `${sellando.lat.toFixed(5)}, ${sellando.lng!.toFixed(5)}` : "Sin GPS",
    `${usuario?.nombre || "Supervisor"} · ASI`,
  ] : [];

  return (
    <View style={{ flex: 1, backgroundColor: color.fondo }}>
      <BarraPaso atras="Checklist" paso={4} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}>
        <T v="display" style={{ marginTop: 12 }}>Evidencia</T>
        <T v="body" c={color.tintaSuave} style={{ marginTop: 4 }}>Opcional. Cada foto se sella con fecha, hora, GPS y supervisor, y no se puede editar.</T>

        <View style={{ flexDirection: "row", gap: 12, marginTop: 20 }}>
          <Pressable onPress={() => tomar(true)} disabled={n >= MAX_FOTOS} accessibilityRole="button" accessibilityLabel="Tomar foto"
            style={({ pressed }) => [{ flex: 1, height: 132, borderRadius: radius.card, backgroundColor: n >= MAX_FOTOS ? color.bordeCampo : color.accion,
              alignItems: "center", justifyContent: "center", gap: 10 }, pressed && { transform: [{ scale: 0.97 }] }]}>
            <Icono n="camera" c="#fff" size={32} w={1.8} />
            <T v="bodyLg" c="#fff">Tomar foto</T>
          </Pressable>
          <Pressable onPress={() => tomar(false)} disabled={n >= MAX_FOTOS} accessibilityRole="button" accessibilityLabel="Elegir de la galería"
            style={({ pressed }) => [{ flex: 1, height: 132, borderRadius: radius.card, backgroundColor: color.superficie, borderWidth: 1, borderColor: color.bordeControl,
              alignItems: "center", justifyContent: "center", gap: 10 }, pressed && { transform: [{ scale: 0.97 }] }]}>
            <Icono n="image" c={color.marino} size={30} w={1.8} />
            <T v="bodyLg">Galería</T>
          </Pressable>
        </View>
        {error && <T v="meta" c={color.malInk} style={{ marginTop: 10 }}>{error}</T>}

        {sellando && (
          <Animated.View entering={FadeIn} style={{ marginTop: 20 }}>
            <Etiqueta>Sellando foto…</Etiqueta>
            {/* Este marco es exactamente lo que se guarda: imagen + marca de agua. */}
            <View ref={marco} collapsable={false} style={{ borderRadius: 0, overflow: "hidden", backgroundColor: "#000" }}>
              <Image source={{ uri: sellando.uri }} style={{ width: "100%", aspectRatio: sellando.aspecto }} onLoadEnd={sellar} />
              <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: 10, paddingVertical: 8, backgroundColor: "rgba(10,18,51,0.78)" }}>
                {sello.map((l, i) => <T key={i} v="small" c="#fff" style={{ fontSize: 12, lineHeight: 16, fontFamily: i === 0 ? font.semibold : font.medium, fontVariant: ["tabular-nums"] }}>{l}</T>)}
              </View>
            </View>
          </Animated.View>
        )}

        <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 24 }}>
          <Etiqueta>Fotos de la ronda</Etiqueta>
          <T v="small" c={color.tintaSuave} style={{ fontVariant: ["tabular-nums"] }}>{n} de {MAX_FOTOS}</T>
        </View>
        {n === 0 ? (
          <View style={{ padding: 28, borderRadius: radius.card, borderWidth: 1, borderStyle: "dashed", borderColor: color.lineaFuerte, alignItems: "center" }}>
            <T v="meta" c={color.tintaSuave}>Todavía no agregaste fotos.</T>
          </View>
        ) : (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
            {rd.fotos.map((f, i) => (
              <Animated.View key={f.uri} entering={ZoomIn.duration(250)} style={{ width: "47.5%", aspectRatio: 0.8, borderRadius: radius.card, overflow: "hidden", backgroundColor: color.fotoPlaceholder }}>
                <Image source={{ uri: f.uri }} style={{ width: "100%", height: "100%" }} resizeMode="cover" accessibilityLabel={`Foto ${i + 1}`} />
                <Pressable onPress={() => quitar(f.uri)} accessibilityLabel={`Quitar foto ${i + 1}`}
                  style={{ position: "absolute", top: 4, right: 4, width: 44, height: 44, alignItems: "center", justifyContent: "center" }}>
                  <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: "rgba(10,18,51,0.72)", alignItems: "center", justifyContent: "center" }}>
                    <Icono n="x" c="#fff" size={14} w={2.6} />
                  </View>
                </Pressable>
              </Animated.View>
            ))}
          </View>
        )}
      </ScrollView>
      <BarraAccion resumen={n === 0 ? "Sin fotos · podés continuar igual" : n === 1 ? "1 foto adjunta al acta" : `${n} fotos adjuntas al acta`}>
        <Boton titulo="Continuar a firmas" alto={58} deshabilitado={!!sellando} onPress={() => router.push("/supervisor/firmas")} />
      </BarraAccion>
    </View>
  );
}
