/* Administración — incidencias (PRD panel admin). */
import { useMemo, useState } from "react";
import { FlatList, Image, Pressable, RefreshControl, ScrollView, View } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Avatar, Chip, EMBLEMA, Icono, T } from "../../components/ui";
import { iniciales } from "../../domain/formato";
import { useSession } from "../../state/session";
import { useTickets } from "../../state/tickets";
import { color, font, radius, valoracionTono } from "../../theme";

type Filtro = "activo" | "cerrado" | "todas";

export default function Admin() {
  const ins = useSafeAreaInsets();
  const s = useSession();
  const { tickets, cargando, recargar } = useTickets();
  const [filtro, setFiltro] = useState<Filtro>("activo");
  const [area, setArea] = useState("todas");

  const porEstado = (t: (typeof tickets)[number]) => filtro === "todas" || (filtro === "activo" ? t.estado === "Activa" : t.estado === "Cerrada");
  const areas = useMemo(() => {
    const c: Record<string, number> = {};
    for (const t of tickets) if (porEstado(t)) c[t.area] = (c[t.area] || 0) + 1;
    return Object.entries(c);
  }, [tickets, filtro]);
  const lista = tickets.filter(t => porEstado(t) && (area === "todas" || t.area === area));
  const criticas = tickets.filter(t => t.estado === "Activa" && t.valoracion === "M").length;
  const activas = tickets.filter(t => t.estado === "Activa").length;
  const cerradas = tickets.length - activas;

  return (
    <View style={{ flex: 1, backgroundColor: color.fondo }}>
      <View style={{ paddingTop: ins.top + 10, paddingHorizontal: 20, paddingBottom: 8, flexDirection: "row", alignItems: "center", gap: 12 }}>
        <Image source={EMBLEMA} style={{ width: 30, height: 39 }} />
        <View style={{ flex: 1 }}>
          <T v="bodyLg">{s.usuario?.nombre}</T>
          <T v="small" c={color.tintaSuave}>Administración</T>
        </View>
        <Pressable onPress={async () => { await s.logout(); router.replace("/login"); }} accessibilityLabel="Cerrar sesión">
          <Avatar texto={iniciales(s.usuario?.nombre)} />
        </Pressable>
      </View>

      <FlatList
        data={lista}
        keyExtractor={t => t.id}
        refreshControl={<RefreshControl refreshing={cargando} onRefresh={recargar} tintColor={color.accion} />}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: ins.bottom + 24 }}
        ListHeaderComponent={
          <View>
            <T v="display" style={{ marginTop: 8 }}>Incidencias</T>
            <View style={{ flexDirection: "row", marginTop: 16, backgroundColor: color.superficie, borderWidth: 1, borderColor: color.linea, borderRadius: radius.card }}>
              {[["Críticas", criticas, color.malInk], ["Activas", activas, color.marino], ["Cerradas", cerradas, color.marino]].map(([l, n, c], i) => (
                <View key={l as string} style={{ flex: 1, paddingVertical: 12, paddingHorizontal: 14, borderLeftWidth: i ? 1 : 0, borderLeftColor: color.linea }}>
                  <T v="metric" c={c as string} style={{ fontSize: 30, lineHeight: 34 }}>{n as number}</T>
                  <T v="small" c={i === 0 ? color.malInk : color.tintaSuave}>{l as string}</T>
                </View>
              ))}
            </View>
            <View style={{ flexDirection: "row", padding: 3, borderRadius: 11, backgroundColor: color.riel, marginTop: 16 }}>
              {([["activo", "Activas"], ["cerrado", "Cerradas"], ["todas", "Todas"]] as [Filtro, string][]).map(([k, l]) => (
                <Pressable key={k} onPress={() => { setFiltro(k); setArea("todas"); }} accessibilityRole="tab" accessibilityState={{ selected: filtro === k }}
                  style={{ flex: 1, minHeight: 40, borderRadius: 8, alignItems: "center", justifyContent: "center",
                    backgroundColor: filtro === k ? color.superficie : "transparent",
                    shadowColor: "#16256E", shadowOpacity: filtro === k ? 0.14 : 0, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: filtro === k ? 1 : 0 }}>
                  <T v="meta" style={{ fontFamily: filtro === k ? font.semibold : font.medium }}>{l}</T>
                </Pressable>
              ))}
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12, marginHorizontal: -20 }} contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}>
              {[["todas", tickets.filter(porEstado).length] as [string, number], ...areas].map(([a, n]) => {
                const on = area === a;
                return (
                  <Pressable key={a} onPress={() => setArea(a)} style={{ height: 40, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1,
                    borderColor: on ? color.accion : color.bordeCampo, backgroundColor: on ? color.accion : color.superficie, flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <T v="meta" c={on ? "#fff" : color.marino}>{a === "todas" ? "Todas" : a}</T>
                    <T v="meta" c={on ? "#fff" : color.tintaMuda} style={{ fontVariant: ["tabular-nums"] }}>{n}</T>
                  </Pressable>
                );
              })}
            </ScrollView>
            <View style={{ height: 14 }} />
          </View>
        }
        ListEmptyComponent={<T v="meta" c={color.tintaSuave} style={{ textAlign: "center", marginTop: 32 }}>No hay incidencias para este filtro.</T>}
        renderItem={({ item: t, index }) => (
          <Pressable onPress={() => router.push(`/admin/${encodeURIComponent(t.id)}`)}
            style={({ pressed }) => [{ backgroundColor: pressed ? color.seleccion : color.superficie, borderWidth: 1, borderColor: color.linea,
              borderRadius: radius.card, padding: 16, marginTop: index ? 10 : 0, gap: 6 }]}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <T v="small" c={color.tintaSuave} style={{ fontVariant: ["tabular-nums"] }}>{t.id}</T>
              <Chip texto={t.estado === "Cerrada" ? "Cerrada" : valoracionTono[t.valoracion].label} tono={t.estado === "Cerrada" ? "neutro" : t.valoracion === "M" ? "mal" : "regular"} />
            </View>
            <T v="bodyLg">{t.objetivo}</T>
            <T v="body" c={color.tintaSuave} numberOfLines={2}>{t.descripcion}</T>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 2 }}>
              <T v="small" c={color.marino} style={{ fontFamily: font.semibold }}>{t.area}</T>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <T v="small" c={color.tintaMuda}>{t.fecha}</T>
                <Icono n="chevron-r" c={color.placeholder} size={16} />
              </View>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}
