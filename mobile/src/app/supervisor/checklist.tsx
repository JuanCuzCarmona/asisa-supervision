/* Paso 3 — Checklist B/R/M con observación obligatoria en Regular y Malo. */
import { useMemo, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { BarraAccion, BarraPaso, BarraProgreso, Boton, Etiqueta, Fila, Grupo, Hoja, Icono, Separador, T } from "../../components/ui";
import { SUBTIPO_LABEL } from "../../domain/checklist";
import { useRonda } from "../../state/ronda";
import { useSession } from "../../state/session";
import { color, font, radius, valoracionTono } from "../../theme";
import type { ItemChecklist, Observacion, Valoracion } from "../../types";

export default function Checklist() {
  const { catalogos } = useSession();
  const { rd, setRd, items } = useRonda();
  const [info, setInfo] = useState<Record<number, boolean>>({});
  const [hoja, setHoja] = useState<{ item: ItemChecklist; v: Valoracion } | null>(null);
  const [finOpciones, setFinOpciones] = useState(false);

  const secciones = useMemo(() =>
    [...catalogos.secciones].sort((a, b) => a.orden - b.orden)
      .map(s => ({ ...s, items: items.filter(i => i.seccion_clave === s.clave).sort((a, b) => a.orden - b.orden) }))
      .filter(s => s.items.length),
  [catalogos.secciones, items]);

  const total = items.length;
  const hechos = items.filter(i => rd.respuestas[i.id]).length;
  const sinObs = items.filter(i => { const r = rd.respuestas[i.id]; return r && r.valoracion !== "B" && !r.observacion; }).length;
  const completo = hechos === total && sinObs === 0;

  const elegir = (item: ItemChecklist, v: Valoracion) => {
    Haptics.selectionAsync();
    setRd(p => ({ ...p, respuestas: { ...p.respuestas, [item.id]: { valoracion: v, observacion: v === "B" ? null : p.respuestas[item.id]?.observacion ?? null } } }));
    if (v !== "B") { setFinOpciones(false); setHoja({ item, v }); }
  };

  const observar = (o: Observacion) => {
    if (!hoja) return;
    const id = hoja.item.id;
    setRd(p => ({ ...p, respuestas: { ...p.respuestas, [id]: { valoracion: hoja.v, observacion: o } } }));
    setHoja(null);
  };

  const sugeridas = hoja ? catalogos.observaciones.filter(o => o.area === hoja.item.area_responsable) : [];
  const obsLista = hoja ? (sugeridas.length ? [...sugeridas, ...catalogos.observaciones.filter(o => o.area !== hoja.item.area_responsable)] : catalogos.observaciones) : [];

  return (
    <View style={{ flex: 1, backgroundColor: color.fondo }}>
      <BarraPaso atras="Vigiladores" paso={3} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}>
        <T v="display" style={{ marginTop: 12 }}>Checklist</T>
        <T v="body" c={color.tintaSuave} style={{ marginTop: 4 }}>{SUBTIPO_LABEL[rd.objetivo?.subtipo || ""] || rd.objetivo?.tipo} · {total} ítems</T>

        {secciones.map(sec => {
          const hs = sec.items.filter(i => rd.respuestas[i.id]).length;
          return (
            <View key={sec.clave} style={{ marginTop: 24 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
                <Etiqueta>{sec.nombre}</Etiqueta>
                <T v="small" c={color.tintaSuave} style={{ fontVariant: ["tabular-nums"], marginBottom: 8, paddingHorizontal: 4 }}>{hs} de {sec.items.length}</T>
              </View>
              <Grupo>
                {sec.items.map((it, i) => {
                  const r = rd.respuestas[it.id];
                  return (
                    <View key={it.id}>
                      {i > 0 && <Separador inset={0} />}
                      <View style={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 16 }}>
                        <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 8 }}>
                          <View style={{ flex: 1 }}>
                            <T v="bodyLg">{it.titulo_corto}</T>
                            <T v="small" c={color.tintaMuda} style={{ marginTop: 2 }}>{it.area_responsable}</T>
                          </View>
                          <Pressable onPress={() => setInfo(x => ({ ...x, [it.id]: !x[it.id] }))} accessibilityLabel="Ver criterio de evaluación"
                            accessibilityState={{ expanded: !!info[it.id] }} style={{ width: 44, height: 44, marginTop: -8, marginRight: -10, alignItems: "center", justifyContent: "center" }}>
                            <Icono n="info" c={info[it.id] ? color.marino : color.tintaSuave} size={22} w={1.8} />
                          </Pressable>
                        </View>
                        {info[it.id] && (
                          <Animated.View entering={FadeInDown.duration(200)} style={{ marginTop: 8, padding: 12, borderRadius: 10, backgroundColor: color.fondo }}>
                            <T v="meta" style={{ fontFamily: font.regular }}>{it.criterio_completo}</T>
                          </Animated.View>
                        )}
                        <View accessibilityRole="radiogroup" style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
                          {(["B", "R", "M"] as Valoracion[]).map(k => {
                            const on = r?.valoracion === k;
                            const t = valoracionTono[k];
                            return (
                              <Pressable key={k} onPress={() => elegir(it, k)} accessibilityRole="radio" accessibilityState={{ checked: on }}
                                accessibilityLabel={`${it.titulo_corto}: ${t.label}`}
                                style={({ pressed }) => [{
                                  flex: 1, height: 52, borderRadius: radius.control, borderWidth: 1,
                                  borderColor: on ? t.solido : color.bordeCampo, backgroundColor: on ? t.solido : color.superficie,
                                  alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 6,
                                }, pressed && { transform: [{ scale: 0.97 }] }]}>
                                {on && <Icono n={k === "B" ? "check" : "alert"} c="#fff" size={16} w={2.6} />}
                                <T v="bodyLg" c={on ? "#fff" : color.marino} style={{ fontSize: 16 }}>{t.label}</T>
                              </Pressable>
                            );
                          })}
                        </View>
                        {r && r.valoracion !== "B" && (
                          <Animated.View entering={FadeIn.duration(200)}>
                            <Pressable onPress={() => { setFinOpciones(false); setHoja({ item: it, v: r.valoracion }); }}
                              style={({ pressed }) => [{ marginTop: 10, minHeight: 52, paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.control, borderWidth: 1,
                                borderColor: r.observacion ? color.linea : valoracionTono[r.valoracion].solido, flexDirection: "row", alignItems: "center", gap: 10 },
                                pressed && { backgroundColor: color.seleccion }]}>
                              <View style={{ flex: 1 }}>
                                {r.observacion ? (
                                  <>
                                    <T v="meta" style={{ fontFamily: font.semibold }}>{r.observacion.texto}</T>
                                    <T v="small" c={color.tintaMuda} style={{ fontSize: 13 }}>Ticket a {r.observacion.area}</T>
                                  </>
                                ) : <T v="meta" c={valoracionTono[r.valoracion].ink} style={{ fontFamily: font.semibold }}>Elegí la observación</T>}
                              </View>
                              <T v="meta" c={color.enlace}>{r.observacion ? "Cambiar" : "Elegir"}</T>
                            </Pressable>
                          </Animated.View>
                        )}
                      </View>
                    </View>
                  );
                })}
              </Grupo>
            </View>
          );
        })}
      </ScrollView>

      <BarraAccion>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <T v="meta" style={{ fontFamily: font.semibold, fontVariant: ["tabular-nums"] }}>{hechos} de {total} evaluados</T>
          <View style={{ flex: 1 }}><BarraProgreso valor={total ? (hechos / total) * 100 : 0} /></View>
        </View>
        <Boton alto={58} deshabilitado={!completo} onPress={() => router.push("/supervisor/evidencia")}
          titulo={completo ? "Continuar a evidencia" : sinObs ? `Falta${sinObs > 1 ? "n" : ""} ${sinObs} observaci${sinObs > 1 ? "ones" : "ón"}` : `Faltan ${total - hechos} ítems`} />
      </BarraAccion>

      <Hoja visible={!!hoja} onCerrar={() => setHoja(null)} titulo={hoja?.item.titulo_corto || ""}
        sobretitulo={hoja ? valoracionTono[hoja.v].label : ""} sobretituloColor={hoja ? valoracionTono[hoja.v].solido : undefined}
        subtitulo="Elegí la observación. Se genera un ticket al área que corresponda.">
        <ScrollView style={{ maxHeight: 360 }} nestedScrollEnabled showsVerticalScrollIndicator persistentScrollbar
          scrollEventThrottle={100}
          onScroll={e => { const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
            setFinOpciones(contentOffset.y + layoutMeasurement.height >= contentSize.height - 20); }}>
          <Grupo>
            {obsLista.map((o, i) => (
              <View key={`${o.area}-${o.texto}`}>
                {i > 0 && <Separador inset={0} />}
                <Fila onPress={() => observar(o)} style={{ minHeight: 58 }}>
                  <View style={{ flex: 1 }}>
                    <T v="bodyLg" style={{ fontFamily: font.medium }}>{o.texto}</T>
                    <T v="small" c={color.tintaMuda} style={{ fontSize: 13 }}>{o.area}{i < sugeridas.length ? " · sugerida" : ""}</T>
                  </View>
                  <Icono n="chevron-r" c={color.placeholder} size={16} />
                </Fila>
              </View>
            ))}
          </Grupo>
        </ScrollView>
        {obsLista.length > 5 && !finOpciones && (
          <View style={{ paddingTop: 10, alignItems: "center", borderTopWidth: 1, borderTopColor: color.linea }}>
            <T v="meta" c={color.enlace} style={{ fontFamily: font.semibold }}>↓ Deslizá para ver más opciones</T>
          </View>
        )}
      </Hoja>
    </View>
  );
}
