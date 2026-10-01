/* Acta generada: confirmación + documento con el sello institucional. */
import { ScrollView, View } from "react-native";
import { Redirect, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown, ZoomIn } from "react-native-reanimated";
import { BarraAccion, Boton, Chip, FilaDato, Grupo, Icono, Logo, T } from "../../components/ui";
import { fechaCorta, hora } from "../../domain/formato";
import { useRonda } from "../../state/ronda";
import { color, font, radius, valoracionTono } from "../../theme";

export default function Acta() {
  const ins = useSafeAreaInsets();
  const { resultado, reiniciar } = useRonda();
  if (!resultado) return <Redirect href="/supervisor" />;
  const { ronda: rd } = resultado;

  const cuenta = { B: 0, R: 0, M: 0 };
  for (const r of Object.values(rd.respuestas)) cuenta[r.valoracion]++;
  const total = cuenta.B + cuenta.R + cuenta.M || 1;

  const ENC = {
    enviada: { titulo: "Acta generada", sub: "Guardada y enviada a la central.", fondo: color.bien, icono: "check" },
    demo: { titulo: "Acta generada", sub: "Guardada en modo demostración.", fondo: color.bien, icono: "check" },
    encolada: { titulo: "Acta guardada en el celular", sub: "Sin señal: se envía sola cuando vuelva la conexión.", fondo: color.accion, icono: "wifi-off" },
  }[resultado.estado];

  const nueva = () => { reiniciar(); router.replace("/supervisor"); };

  return (
    <View style={{ flex: 1, backgroundColor: color.fondo }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: ins.top + 28, paddingBottom: 24 }}>
        <View style={{ alignItems: "center" }}>
          <Animated.View entering={ZoomIn.springify().damping(14)} style={{ width: 68, height: 68, borderRadius: 34, backgroundColor: ENC.fondo, alignItems: "center", justifyContent: "center" }}>
            <Icono n={ENC.icono} c="#fff" size={34} w={2.6} />
          </Animated.View>
          <T v="display" style={{ fontSize: 28, marginTop: 16, textAlign: "center" }}>{ENC.titulo}</T>
          <T v="body" c={color.tintaSuave} style={{ textAlign: "center", marginTop: 4 }}>{ENC.sub}</T>
        </View>

        <Animated.View entering={FadeInDown.delay(150).duration(400)} style={{ marginTop: 24 }}>
          <Grupo>
            <View style={{ padding: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: color.linea }}>
              <Logo ancho={92} />
              <View style={{ alignItems: "flex-end", flexShrink: 1 }}>
                <T v="label" c={color.tintaSuave} style={{ fontSize: 12 }}>Acta de supervisión</T>
                <T v="small" style={{ fontFamily: font.semibold, fontVariant: ["tabular-nums"] }}>{resultado.codigo}</T>
              </View>
            </View>
            <FilaDato k="Objetivo" v={rd.objetivo?.nombre || "—"} />
            <FilaDato k="Modalidad" v={rd.tipo === "remota" ? "Remota · fuera del geocerco" : "Presencial · dentro del geocerco"} />
            <FilaDato k="Fecha" v={`${fechaCorta(resultado.fecha)} · ${rd.horaInicio ? hora(rd.horaInicio) + " a " : ""}${hora(resultado.fecha)}`} ultima />

            <View style={{ padding: 16, borderTopWidth: 1, borderTopColor: color.linea }}>
              <T v="label" c={color.tintaSuave} style={{ fontSize: 12 }}>Resultado del checklist</T>
              <View accessibilityLabel={`${cuenta.B} Bueno, ${cuenta.R} Regular, ${cuenta.M} Malo`} style={{ flexDirection: "row", gap: 2, height: 10, marginTop: 10 }}>
                {(["B", "R", "M"] as const).filter(k => cuenta[k]).map((k, i, arr) => (
                  <View key={k} style={{ flex: cuenta[k] / total, backgroundColor: valoracionTono[k].solido,
                    borderTopLeftRadius: i === 0 ? 4 : 0, borderBottomLeftRadius: i === 0 ? 4 : 0,
                    borderTopRightRadius: i === arr.length - 1 ? 4 : 0, borderBottomRightRadius: i === arr.length - 1 ? 4 : 0 }} />
                ))}
              </View>
              <View style={{ flexDirection: "row", gap: 16, marginTop: 10 }}>
                {(["B", "R", "M"] as const).map(k => (
                  <View key={k} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: valoracionTono[k].solido }} />
                    <T v="small" style={{ fontVariant: ["tabular-nums"] }}>{valoracionTono[k].label} {cuenta[k]}</T>
                  </View>
                ))}
              </View>
            </View>

            <View style={{ paddingHorizontal: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: color.linea }}>
              <T v="label" c={color.tintaSuave} style={{ fontSize: 12 }}>Vigiladores</T>
              {rd.vigiladores.map((v, i) => (
                <View key={v.id} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10, borderTopWidth: i ? 1 : 0, borderTopColor: color.lineaSuave }}>
                  <View><T v="meta" style={{ fontFamily: font.semibold }}>{v.nombre}</T><T v="small" c={color.tintaMuda} style={{ fontSize: 13 }}>Legajo {v.legajo}</T></View>
                  <T v="small" c={rd.firmas[v.id]?.nego ? color.malInk : color.bienInk} style={{ fontFamily: font.semibold }}>{rd.firmas[v.id]?.nego ? "Negativa registrada" : "Firmó"}</T>
                </View>
              ))}
            </View>

            {resultado.tickets.length > 0 && (
              <View style={{ paddingHorizontal: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: color.linea }}>
                <T v="label" c={color.tintaSuave} style={{ fontSize: 12 }}>Incidencias generadas</T>
                {resultado.tickets.map((t, i) => (
                  <View key={t.codigo + i} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12, paddingVertical: 10, borderTopWidth: i ? 1 : 0, borderTopColor: color.lineaSuave }}>
                    <View style={{ flex: 1 }}>
                      <T v="meta" style={{ fontFamily: font.semibold }}>{t.texto}</T>
                      <T v="small" c={color.tintaMuda} style={{ fontSize: 13, fontVariant: ["tabular-nums"] }}>{t.codigo} · {t.area}</T>
                    </View>
                    <Chip texto={valoracionTono[t.valoracion].label} tono={t.valoracion === "M" ? "mal" : "regular"} />
                  </View>
                ))}
              </View>
            )}

            <View style={{ padding: 12, borderTopWidth: 1, borderTopColor: color.linea, backgroundColor: "#F7F8FC", flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Icono n="lock" c={color.tintaSuave} size={15} />
              <T v="small" c={color.tintaSuave} style={{ fontSize: 13 }}>Sello digital · {rd.fotos.length} foto{rd.fotos.length === 1 ? "" : "s"} adjunta{rd.fotos.length === 1 ? "" : "s"} · no modificable</T>
            </View>
          </Grupo>
        </Animated.View>
      </ScrollView>
      <BarraAccion>
        <Boton titulo="Nueva ronda" alto={58} onPress={nueva} />
      </BarraAccion>
    </View>
  );
}
