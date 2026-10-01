/* Recuadro de firma nativo: se dibuja con el dedo (Svg + gestos nativos, sin
   WebView) y se exporta como PNG en data URL, que es lo que espera POST /api/rondas. */
import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Svg, { Path } from "react-native-svg";
import { captureRef } from "react-native-view-shot";
import { color, radius } from "../theme";
import { Icono, T } from "./ui";

export interface PadFirmaRef { exportar: () => Promise<string | null>; limpiar: () => void }

export const PadFirma = forwardRef<PadFirmaRef, { onCambio: (tieneTrazo: boolean) => void }>(({ onCambio }, ref) => {
  const [trazos, setTrazos] = useState<string[]>([]);
  const [actual, setActual] = useState("");
  const vista = useRef<View>(null);

  // El trazo en curso vive en una ref (se actualiza a cada movimiento) y en estado para pintarlo.
  const enCurso = useRef("");
  const empezar = (x: number, y: number) => { enCurso.current = `M${x.toFixed(1)} ${y.toFixed(1)}`; setActual(enCurso.current); };
  const mover = (x: number, y: number) => { enCurso.current += ` L${x.toFixed(1)} ${y.toFixed(1)}`; setActual(enCurso.current); };
  const terminar = () => {
    const d = enCurso.current;
    enCurso.current = "";
    setActual("");
    if (d) { setTrazos(t => [...t, d]); onCambio(true); }
  };

  // runOnJS(true): los callbacks corren en JS — el trazo se guarda en estado de React.
  const pan = Gesture.Pan().minDistance(0).runOnJS(true)
    .onBegin(e => empezar(e.x, e.y))
    .onUpdate(e => mover(e.x, e.y))
    .onFinalize(() => terminar());

  useImperativeHandle(ref, () => ({
    exportar: async () => {
      if (!trazos.length || !vista.current) return null;
      return captureRef(vista, { format: "png", quality: 1, result: "data-uri" });
    },
    limpiar: () => { setTrazos([]); setActual(""); onCambio(false); },
  }));

  const vacio = !trazos.length && !actual;
  return (
    <GestureDetector gesture={pan}>
      <View ref={vista} collapsable={false} accessibilityLabel="Recuadro de firma"
        style={{ height: 160, borderRadius: radius.control, backgroundColor: "#fff", borderWidth: 1.5, borderStyle: vacio ? "dashed" : "solid",
          borderColor: vacio ? color.lineaFuerte : color.linea, overflow: "hidden" }}>
        <Svg style={{ position: "absolute", left: 0, top: 0, right: 0, bottom: 0 }}>
          {[...trazos, actual].filter(Boolean).map((d, i) => (
            <Path key={i} d={d} stroke={color.marino} strokeWidth={2.8} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          ))}
        </Svg>
        <View pointerEvents="none" style={{ position: "absolute", left: 20, right: 20, bottom: 34, height: 1.5, backgroundColor: color.bordeCampo }} />
        {vacio && (
          <View pointerEvents="none" style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 8 }}>
            <Icono n="pen" c={color.tintaSuave} size={26} w={1.7} />
            <T v="meta" c={color.tintaSuave}>Firmá con el dedo dentro del recuadro</T>
          </View>
        )}
      </View>
    </GestureDetector>
  );
});
