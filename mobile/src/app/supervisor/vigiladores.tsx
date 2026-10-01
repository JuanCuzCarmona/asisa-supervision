/* Paso 2 — Vigiladores inspeccionados (varios por ronda, cada uno firma). */
import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown, LinearTransition } from "react-native-reanimated";
import { Avatar, BarraAccion, BarraPaso, Boton, Campo, Etiqueta, Grupo, Icono, Separador, T } from "../../components/ui";
import { diasHasta, iniciales } from "../../domain/formato";
import { useRonda } from "../../state/ronda";
import { useSession } from "../../state/session";
import { color, font, radius } from "../../theme";

export default function Vigiladores() {
  const { catalogos } = useSession();
  const { rd, setRd } = useRonda();
  const [legajo, setLegajo] = useState("");
  const [error, setError] = useState<string | null>(null);

  const agregar = () => {
    setError(null);
    const v = catalogos.vigiladores.find(x => String(x.legajo) === legajo.trim());
    if (!v) { setError("No hay ningún vigilador con ese legajo."); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); return; }
    if (rd.vigiladores.some(x => x.id === v.id)) { setError("Ese vigilador ya está en la ronda."); return; }
    setRd(p => ({ ...p, vigiladores: [...p.vigiladores, v] }));
    setLegajo("");
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const quitar = (id: number) => setRd(p => {
    const firmas = { ...p.firmas }; delete firmas[id];
    return { ...p, vigiladores: p.vigiladores.filter(v => v.id !== id), firmas };
  });

  const n = rd.vigiladores.length;

  return (
    <View style={{ flex: 1, backgroundColor: color.fondo }}>
      <BarraPaso atras="Inicio" paso={2} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
        <T v="display" style={{ marginTop: 12 }}>Vigiladores</T>
        <T v="body" c={color.tintaSuave} style={{ marginTop: 4 }}>{rd.objetivo?.nombre} · {rd.tipo === "remota" ? "Remota" : "Presencial"}</T>

        <Etiqueta style={{ marginTop: 24 }}>En esta ronda</Etiqueta>
        {n === 0 ? (
          <View style={{ padding: 24, borderWidth: 1, borderStyle: "dashed", borderColor: color.lineaFuerte, borderRadius: radius.card, alignItems: "center" }}>
            <T v="meta" c={color.tintaSuave} style={{ textAlign: "center" }}>No hay vigiladores asignados a este objetivo. Agregalos por legajo.</T>
          </View>
        ) : (
          <Grupo>
            {rd.vigiladores.map((v, i) => {
              const dias = diasHasta(v.credencial_venc);
              const vencida = dias != null && dias < 0;
              return (
                <Animated.View key={v.id} entering={FadeInDown.duration(250)} layout={LinearTransition}>
                  {i > 0 && <Separador inset={0} />}
                  <View style={{ minHeight: 84, paddingHorizontal: 16, paddingVertical: 12, flexDirection: "row", alignItems: "center", gap: 14 }}>
                    <Pressable onPress={() => router.push(`/supervisor/perfil/${v.legajo}`)} accessibilityLabel={`Ver perfil de ${v.nombre}`}
                      style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 14 }}>
                      <Avatar texto={iniciales(v.nombre)} />
                      <View style={{ flex: 1, gap: 3 }}>
                        <T v="bodyLg">{v.nombre}</T>
                        <T v="small" c={color.tintaMuda}>Legajo {v.legajo}{v.puesto ? ` · ${v.puesto}` : ""}</T>
                        {vencida && (
                          <View style={{ marginTop: 2, alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 5, minHeight: 24, paddingHorizontal: 8, borderRadius: 12, backgroundColor: color.regularSoft }}>
                            <Icono n="alert" c={color.regularInk} size={13} w={2.4} />
                            <T v="small" c={color.regularInk} style={{ fontFamily: font.semibold, fontSize: 13 }}>Credencial vencida hace {Math.abs(dias!)} días</T>
                          </View>
                        )}
                      </View>
                    </Pressable>
                    <Pressable onPress={() => quitar(v.id)} accessibilityLabel={`Quitar a ${v.nombre}`}
                      style={({ pressed }) => [{ width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" }, pressed && { backgroundColor: color.seleccion }]}>
                      <Icono n="x" c={color.tintaSuave} size={20} />
                    </Pressable>
                  </View>
                </Animated.View>
              );
            })}
          </Grupo>
        )}
        <T v="small" c={color.tintaSuave} style={{ marginTop: 10, paddingHorizontal: 4 }}>Tocá un vigilador para ver su legajo. Cada uno firma el acta.</T>

        <Etiqueta style={{ marginTop: 24 }}>Agregar por legajo</Etiqueta>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <Campo icono="user" value={legajo} onChangeText={t => setLegajo(t.replace(/\D/g, ""))} keyboardType="number-pad"
            placeholder="Número de legajo" returnKeyType="done" onSubmitEditing={agregar} style={{ flex: 1 }} />
          <Boton variante="contorno" titulo="Agregar" onPress={agregar} deshabilitado={!legajo} style={{ width: 110 }} />
        </View>
        {error && <T v="meta" c={color.malInk} style={{ marginTop: 8, paddingHorizontal: 4 }}>{error}</T>}
      </ScrollView>
      <BarraAccion resumen={n === 0 ? "Agregá al menos un vigilador" : n === 1 ? "1 vigilador para inspeccionar" : `${n} vigiladores para inspeccionar`}>
        <Boton titulo="Continuar al checklist" alto={58} deshabilitado={n === 0} onPress={() => router.push("/supervisor/checklist")} />
      </BarraAccion>
    </View>
  );
}
