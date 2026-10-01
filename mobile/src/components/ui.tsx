/* Componentes del sistema "Apple institucional" (ver ../../DESIGN.md).
   Todo lo tocable mide 44px o más; las acciones primarias del supervisor 56–58px,
   porque se usan con guantes, de noche o al sol y con una sola mano. */
import React from "react";
import {
  ActivityIndicator, Image, Modal, Pressable, StyleSheet, Text, TextInput, View,
  type PressableProps, type StyleProp, type TextInputProps, type TextProps, type TextStyle, type ViewStyle,
} from "react-native";
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Platform } from "react-native";

/** Margen inferior seguro. En Android 10 o anteriores con botones de navegación,
 *  el área segura inferior llega en 0 aunque la barra del sistema quede encima
 *  del contenido (lo vimos en el emulador API 29): se reserva un piso de 48 dp. */
export function useMargenInferior() {
  const ins = useSafeAreaInsets();
  return Platform.OS === "android" ? Math.max(ins.bottom, 48) : ins.bottom;
}
import * as Haptics from "expo-haptics";
import Svg, { Path, Circle, Rect } from "react-native-svg";
import { router } from "expo-router";
import { color, font, radius } from "../theme";

export const LOGO = require("../../assets/brand/asi-lockup-navy.png");
export const LOGO_BLANCO = require("../../assets/brand/asi-lockup-white.png");
export const EMBLEMA = require("../../assets/brand/asi-emblem-navy.png");

/* ── Tipografía ── */
type Variante = "display" | "headline" | "title" | "titleSm" | "button" | "bodyLg" | "body" | "meta" | "small" | "label" | "metric" | "clock";

const VAR: Record<Variante, TextStyle> = {
  metric: { fontFamily: font.semibold, fontSize: 40, lineHeight: 44, fontVariant: ["tabular-nums"] },
  clock: { fontFamily: font.semibold, fontSize: 36, lineHeight: 40, fontVariant: ["tabular-nums"] },
  display: { fontFamily: font.semibold, fontSize: 32, lineHeight: 36, letterSpacing: -0.3 },
  headline: { fontFamily: font.semibold, fontSize: 26, lineHeight: 30, letterSpacing: -0.2 },
  title: { fontFamily: font.semibold, fontSize: 22, lineHeight: 27 },
  titleSm: { fontFamily: font.semibold, fontSize: 19, lineHeight: 24 },
  button: { fontFamily: font.semibold, fontSize: 18, lineHeight: 22 },
  bodyLg: { fontFamily: font.semibold, fontSize: 17, lineHeight: 22 },
  body: { fontFamily: font.regular, fontSize: 16, lineHeight: 23 },
  meta: { fontFamily: font.medium, fontSize: 15, lineHeight: 21 },
  small: { fontFamily: font.regular, fontSize: 14, lineHeight: 19 },
  label: { fontFamily: font.label, fontSize: 13, lineHeight: 16, letterSpacing: 2.3, textTransform: "uppercase" },
};

export function T({ v = "body", c = color.marino, style, ...rest }: TextProps & { v?: Variante; c?: string }) {
  return <Text {...rest} style={[VAR[v], { color: c }, style]} maxFontSizeMultiplier={1.4} />;
}

/* ── Íconos (trazos estilo lucide; nunca emojis) ── */
const ICONOS: Record<string, string[]> = {
  "chevron-l": ["M15 5l-7 7 7 7"],
  "chevron-r": ["M9 6l6 6-6 6"],
  "arrow-r": ["M5 12h14", "M13 6l6 6-6 6"],
  check: ["M5 12.5l4.5 4.5L19 7.5"],
  x: ["M6 6l12 12", "M18 6L6 18"],
  alert: ["M12 3l9.5 17h-19z", "M12 10v4", "M12 17h.01"],
  info: ["M12 11v5", "M12 8h.01"],
  user: ["M4 21c0-4 4-6 8-6s8 2 8 6"],
  lock: ["M8 11V7a4 4 0 0 1 8 0v4"],
  eye: ["M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"],
  "eye-off": ["M3 3l18 18", "M10.6 5.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4.1M6.6 6.6A17 17 0 0 0 2 12s3.5 7 10 7a9.7 9.7 0 0 0 5.4-1.6", "M9.9 9.9a3 3 0 0 0 4.2 4.2"],
  shield: ["M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z", "M9 12l2 2 4-4"],
  pin: ["M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"],
  search: ["M20 20l-3.5-3.5"],
  camera: ["M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"],
  image: ["M21 16l-5-5-9 9"],
  pen: ["M3 21h18", "M14.5 4.5l5 5L9 20H4v-5z"],
  logout: ["M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4", "M16 17l5-5-5-5", "M21 12H9"],
  settings: ["M4 6h10", "M18 6h2", "M4 12h4", "M12 12h8", "M4 18h12", "M20 18h0"],
  "wifi-off": ["M3 3l18 18", "M8.5 16.5a5 5 0 0 1 7 0", "M5 12.9a10 10 0 0 1 5.2-2.8", "M19 12.9a10 10 0 0 0-2.4-1.6", "M12 20h.01"],
  refresh: ["M21 12a9 9 0 1 1-2.6-6.4", "M21 4v5h-5"],
  phone: ["M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"],
  plus: ["M12 5v14", "M5 12h14"],
  fingerprint: ["M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4", "M14 13.12c0 2.38 0 6.38-1 8.88", "M2 12a10 10 0 0 1 18-6", "M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2", "M9 6.8a6 6 0 0 1 9 5.2v2"],
};

export function Icono({ n, size = 22, c = color.marino, w = 2 }: { n: string; size?: number; c?: string; w?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round">
      {n === "user" && <Circle cx={12} cy={8} r={4} />}
      {n === "lock" && <Rect x={4} y={11} width={16} height={10} rx={2} />}
      {n === "eye" && <Circle cx={12} cy={12} r={3} />}
      {n === "info" && <Circle cx={12} cy={12} r={9} />}
      {n === "search" && <Circle cx={11} cy={11} r={7} />}
      {n === "camera" && <Circle cx={12} cy={13.5} r={3.5} />}
      {n === "pin" && <Circle cx={12} cy={9.5} r={2.5} />}
      {n === "image" && <><Rect x={3} y={4} width={18} height={16} rx={2} /><Circle cx={9} cy={10} r={2} /></>}
      {(ICONOS[n] || []).map((d, i) => <Path key={i} d={d} />)}
    </Svg>
  );
}

/* ── Botones ── */
type BotonVariante = "primario" | "secundario" | "contorno" | "tintado" | "texto" | "peligro";

export function Boton({
  titulo, onPress, variante = "primario", deshabilitado, cargando, icono, alto = 56, style, haptico = true, accessibilityLabel,
}: {
  titulo: string; onPress?: () => void; variante?: BotonVariante; deshabilitado?: boolean; cargando?: boolean;
  icono?: string; alto?: number; style?: StyleProp<ViewStyle>; haptico?: boolean; accessibilityLabel?: string;
}) {
  const off = deshabilitado || cargando;
  const fondo = off && variante !== "texto" ? color.bordeCampo
    : { primario: color.accion, secundario: color.superficie, contorno: color.superficie, tintado: color.seleccion, texto: "transparent", peligro: color.mal }[variante];
  const tinta = off ? color.tintaSuave
    : { primario: "#fff", secundario: color.marino, contorno: color.accion, tintado: color.marino, texto: color.enlace, peligro: "#fff" }[variante];
  const borde = off ? "transparent" : variante === "secundario" ? color.bordeControl : variante === "contorno" ? color.accion : "transparent";
  return (
    <Pressable
      accessibilityRole="button" accessibilityLabel={accessibilityLabel || titulo} accessibilityState={{ disabled: !!off, busy: !!cargando }}
      disabled={off}
      onPress={() => { if (haptico && variante !== "texto") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress?.(); }}
      style={({ pressed }) => [
        variante === "texto"
          ? { minHeight: 44, justifyContent: "center", paddingHorizontal: 4 }
          : { height: alto, borderRadius: radius.card, backgroundColor: fondo, borderWidth: 1, borderColor: borde, paddingHorizontal: 20 },
        { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
        pressed && { transform: [{ scale: 0.97 }], opacity: variante === "texto" ? 0.6 : 1 },
        style,
      ]}>
      {cargando ? <ActivityIndicator color={tinta} /> : icono ? <Icono n={icono} c={tinta} size={20} /> : null}
      <T v={variante === "texto" ? "meta" : alto >= 56 ? "button" : "bodyLg"} c={tinta}>{titulo}</T>
    </Pressable>
  );
}

/* ── Contenedores ── */
export function Grupo({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[s.grupo, style]}>{children}</View>;
}

export function Separador({ inset = 16 }: { inset?: number }) {
  return <View style={{ height: 1, backgroundColor: color.linea, marginLeft: inset }} />;
}

export function Fila({ children, onPress, seleccionada, style, ...rest }: PressableProps & { children: React.ReactNode; seleccionada?: boolean; style?: StyleProp<ViewStyle> }) {
  return (
    <Pressable
      {...rest}
      onPress={e => { Haptics.selectionAsync(); onPress?.(e); }}
      accessibilityState={{ selected: !!seleccionada }}
      style={({ pressed }) => [s.fila, seleccionada && { backgroundColor: color.seleccion }, pressed && { backgroundColor: color.avatar }, style]}>
      {children}
    </Pressable>
  );
}

export function FilaDato({ k, v, vColor, ultima }: { k: string; v: string; vColor?: string; ultima?: boolean }) {
  return (
    <View style={[s.filaDato, !ultima && { borderBottomWidth: 1, borderBottomColor: color.lineaSuave }]}>
      <T v="body" c={color.tintaSuave}>{k}</T>
      <T v="body" c={vColor || color.marino} style={{ fontFamily: font.semibold, flexShrink: 1, textAlign: "right" }}>{v}</T>
    </View>
  );
}

export function Etiqueta({ children, style }: { children: React.ReactNode; style?: StyleProp<TextStyle> }) {
  return <T v="label" c={color.tintaSuave} style={[{ paddingHorizontal: 4, marginBottom: 8 }, style]}>{children}</T>;
}

type Tono = "bien" | "regular" | "mal" | "neutro";
export function Chip({ texto, tono = "neutro" }: { texto: string; tono?: Tono }) {
  const t = {
    bien: [color.bienSoft, color.bienInk], regular: [color.regularSoft, color.regularInk],
    mal: [color.malSoft, color.malInk], neutro: [color.seleccion, color.marino],
  }[tono];
  return (
    <View style={{ minHeight: 26, paddingHorizontal: 10, borderRadius: radius.chip, backgroundColor: t[0], justifyContent: "center", alignSelf: "flex-start" }}>
      <T v="small" c={t[1]} style={{ fontFamily: font.semibold }}>{texto}</T>
    </View>
  );
}

export function Punto({ c }: { c: string }) {
  return <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: c }} />;
}

export function Avatar({ texto, size = 44 }: { texto: string; size?: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color.avatar, alignItems: "center", justifyContent: "center" }}>
      <T v="bodyLg" style={{ fontSize: size * 0.36 }}>{texto}</T>
    </View>
  );
}

export function Campo({ icono, style, ...rest }: TextInputProps & { icono?: string }) {
  return (
    <View style={[s.campo, style]}>
      {icono && <Icono n={icono} c={color.tintaMuda} size={20} w={1.9} />}
      <TextInput placeholderTextColor={color.placeholder} style={s.campoInput} {...rest} />
    </View>
  );
}

export function BarraProgreso({ valor, alto = 6, c = color.accion }: { valor: number; alto?: number; c?: string }) {
  return (
    <View style={{ height: alto, borderRadius: alto / 2, backgroundColor: color.riel, overflow: "hidden" }}>
      <View style={{ width: `${Math.max(0, Math.min(100, valor))}%`, height: alto, borderRadius: alto / 2, backgroundColor: c }} />
    </View>
  );
}

/* ── Barra superior de los pasos de la ronda ── */
export function BarraPaso({ atras, paso, total = 5 }: { atras: string; paso: number; total?: number }) {
  const ins = useSafeAreaInsets();
  return (
    <View style={{ paddingTop: ins.top + 4, backgroundColor: color.fondo }}>
      <View style={{ height: 52, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingLeft: 6, paddingRight: 20 }}>
        <Pressable accessibilityRole="button" accessibilityLabel={`Volver a ${atras}`} onPress={() => router.back()}
          style={({ pressed }) => [{ height: 44, flexDirection: "row", alignItems: "center", gap: 2, paddingHorizontal: 8 }, pressed && { opacity: 0.5 }]}>
          <Icono n="chevron-l" c={color.accion} size={24} w={2.2} />
          <T v="meta" c={color.accion} style={{ fontSize: 17 }}>{atras}</T>
        </Pressable>
        <T v="meta" c={color.tintaSuave} style={{ fontVariant: ["tabular-nums"] }}>Paso {paso} de {total}</T>
      </View>
      <View style={{ flexDirection: "row", gap: 4, paddingHorizontal: 20, paddingBottom: 6 }}>
        {Array.from({ length: total }, (_, i) => (
          <View key={i} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: i < paso ? color.accion : color.bordeCampo }} />
        ))}
      </View>
    </View>
  );
}

/* ── Barra de acción fija abajo, al alcance del pulgar ── */
export function BarraAccion({ resumen, children }: { resumen?: string; children: React.ReactNode }) {
  const abajo = useMargenInferior();
  return (
    <View style={{ backgroundColor: color.superficie, borderTopWidth: 1, borderTopColor: color.linea, paddingHorizontal: 20, paddingTop: 12, paddingBottom: abajo + 10, gap: 10 }}>
      {resumen ? <T v="meta" style={{ fontFamily: font.semibold }} numberOfLines={1}>{resumen}</T> : null}
      {children}
    </View>
  );
}

/* ── Hoja inferior ── */
export function Hoja({ visible, onCerrar, titulo, subtitulo, sobretitulo, sobretituloColor, children }: {
  visible: boolean; onCerrar: () => void; titulo: string; subtitulo?: string; sobretitulo?: string; sobretituloColor?: string; children: React.ReactNode;
}) {
  const abajo = useMargenInferior();
  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onCerrar} statusBarTranslucent>
      {visible && (
        <View style={{ flex: 1, justifyContent: "flex-end" }}>
          <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(150)} style={[StyleSheet.absoluteFill, { backgroundColor: color.overlay }]}>
            <Pressable style={{ flex: 1 }} onPress={onCerrar} accessibilityLabel="Cerrar" />
          </Animated.View>
          <Animated.View entering={SlideInDown.duration(320)} exiting={SlideOutDown.duration(220)}
            style={{ backgroundColor: color.superficie, borderTopLeftRadius: radius.sheet, borderTopRightRadius: radius.sheet, paddingHorizontal: 20, paddingTop: 8, paddingBottom: abajo + 20, maxHeight: "86%" }}>
            <View style={{ width: 36, height: 5, borderRadius: 3, backgroundColor: color.bordeCampo, alignSelf: "center", marginBottom: 14 }} />
            {sobretitulo ? <T v="label" c={sobretituloColor || color.tintaSuave}>{sobretitulo}</T> : null}
            <T v="title" style={{ marginTop: 4 }}>{titulo}</T>
            {subtitulo ? <T v="meta" c={color.tintaSuave} style={{ marginTop: 4, marginBottom: 14 }}>{subtitulo}</T> : <View style={{ height: 12 }} />}
            {children}
          </Animated.View>
        </View>
      )}
    </Modal>
  );
}

export function Logo({ ancho = 204, blanco }: { ancho?: number; blanco?: boolean }) {
  // 723×319 es la proporción del logotipo oficial.
  return <Image source={blanco ? LOGO_BLANCO : LOGO} style={{ width: ancho, height: (ancho * 319) / 723 }} accessibilityLabel="Argentina Seguridad Integral" />;
}

const s = StyleSheet.create({
  grupo: { backgroundColor: color.superficie, borderWidth: 1, borderColor: color.linea, borderRadius: radius.card, overflow: "hidden" },
  fila: { minHeight: 64, paddingHorizontal: 16, paddingVertical: 12, flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: color.superficie },
  filaDato: { minHeight: 48, paddingHorizontal: 16, paddingVertical: 10, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  campo: { height: 56, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, backgroundColor: color.superficie, borderWidth: 1, borderColor: color.linea, borderRadius: radius.control },
  campoInput: { flex: 1, height: 52, fontFamily: font.regular, fontSize: 17, color: color.marino },
});
