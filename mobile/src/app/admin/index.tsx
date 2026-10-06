/* Administración — incidencias (PRD panel admin). */
import { useMemo, useState } from "react";
import { FlatList, Image, Pressable, RefreshControl, ScrollView, TextInput, View } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Avatar, Chip, EMBLEMA, Icono, T, useMargenInferior } from "../../components/ui";
import { iniciales } from "../../domain/formato";
import { useSession } from "../../state/session";
import { useTickets } from "../../state/tickets";
import { color, font, radius, valoracionTono } from "../../theme";

type Filtro = "activo" | "cerrado" | "todas";
type Periodo = "todos" | "hoy" | "semana" | "mes";

export default function Admin() {
  const ins = useSafeAreaInsets();
  const abajo = useMargenInferior();
  const s = useSession();
  const { tickets, cargando, error, recargar } = useTickets();
  const [filtro, setFiltro] = useState<Filtro>("activo");
  const [area, setArea] = useState("todas");
  const [busca, setBusca] = useState("");
  const [periodo, setPeriodo] = useState<Periodo>("todos");
  const [objetivo, setObjetivo] = useState("todos");
  const [supervisor, setSupervisor] = useState("todos");
  const [prioridad, setPrioridad] = useState<"todas" | "criticas" | "antiguas">("todas");
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  const porEstado = (t: (typeof tickets)[number]) => filtro === "todas" || (filtro === "activo" ? t.estado === "Activa" : t.estado === "Cerrada");
  const areas = useMemo(() => {
    const c: Record<string, number> = {};
    for (const t of tickets) if (porEstado(t)) c[t.area] = (c[t.area] || 0) + 1;
    return Object.entries(c);
  }, [tickets, filtro]);
  const objetivos = [...new Set(tickets.map(t => t.objetivo))].sort();
  const supervisores = [...new Set(tickets.map(t => t.supervisor))].sort();
  const ahora = Date.now();
  const inicioHoy = new Date().setHours(0, 0, 0, 0);
  const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();
  const antigua = (t: (typeof tickets)[number]) => t.estado === "Activa" && !!t.fechaIso && ahora - new Date(t.fechaIso).getTime() >= 48 * 3600000;
  const lista = tickets.filter(t => {
    if (!porEstado(t) || (area !== "todas" && t.area !== area) || (objetivo !== "todos" && t.objetivo !== objetivo)
      || (supervisor !== "todos" && t.supervisor !== supervisor)) return false;
    if (prioridad === "criticas" && !(t.estado === "Activa" && t.valoracion === "M")) return false;
    if (prioridad === "antiguas" && !antigua(t)) return false;
    const fecha = t.fechaIso ? new Date(t.fechaIso).getTime() : NaN;
    if (periodo !== "todos" && Number.isFinite(fecha) && fecha < (periodo === "hoy" ? inicioHoy : periodo === "semana" ? ahora - 7 * 86400000 : inicioMes)) return false;
    const q = busca.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    return !q || [t.id, t.objetivo, t.supervisor, t.descripcion, t.vigilador || "", t.item || ""]
      .some(v => v.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().includes(q));
  });
  const criticas = tickets.filter(t => t.estado === "Activa" && t.valoracion === "M").length;
  const antiguas = tickets.filter(antigua).length;
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
        <Pressable onPress={() => router.push("/clave")} accessibilityRole="button" accessibilityLabel="Cambiar contraseña"
          style={{ width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: color.seleccion }}>
          <Icono n="key" size={20} />
        </Pressable>
        <Pressable onPress={async () => { await s.logout(); router.replace("/login"); }} accessibilityLabel="Cerrar sesión">
          <Avatar texto={iniciales(s.usuario?.nombre)} />
        </Pressable>
      </View>

      <FlatList
        data={lista}
        keyExtractor={t => t.id}
        refreshControl={<RefreshControl refreshing={cargando} onRefresh={recargar} tintColor={color.accion} />}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: abajo + 24 }}
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
            <View style={{ height: 50, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14,
              backgroundColor: color.superficie, borderWidth: 1, borderColor: color.linea, borderRadius: radius.control, marginTop: 12 }}>
              <Icono n="search" c={color.tintaMuda} size={20} />
              <TextInput value={busca} onChangeText={setBusca} placeholder="Buscar ticket, objetivo o persona"
                placeholderTextColor={color.placeholder} accessibilityLabel="Buscar incidencias"
                style={{ flex: 1, height: 48, fontFamily: font.regular, fontSize: 16, color: color.marino }} />
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10, marginHorizontal: -20 }} contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}>
              {([["todas", "Todas"], ["criticas", `Críticas ${criticas}`], ["antiguas", `Más de 48 h ${antiguas}`]] as const).map(([k, l]) => (
                <Pressable key={k} onPress={() => setPrioridad(k)} accessibilityRole="radio" accessibilityState={{ checked: prioridad === k }}
                  style={{ minHeight: 40, paddingHorizontal: 12, borderRadius: 20, justifyContent: "center", backgroundColor: prioridad === k ? color.accion : color.superficie,
                    borderWidth: 1, borderColor: prioridad === k ? color.accion : color.linea }}>
                  <T v="meta" c={prioridad === k ? "#fff" : color.marino}>{l}</T>
                </Pressable>
              ))}
            </ScrollView>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8, marginHorizontal: -20 }} contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}>
              {([["todos", "Cualquier fecha"], ["hoy", "Hoy"], ["semana", "7 días"], ["mes", "Este mes"]] as const).map(([k, l]) => (
                <Pressable key={k} onPress={() => setPeriodo(k)} style={{ minHeight: 40, paddingHorizontal: 12, borderRadius: 20, justifyContent: "center",
                  backgroundColor: periodo === k ? color.seleccion : color.superficie, borderWidth: 1, borderColor: periodo === k ? color.accion : color.linea }}>
                  <T v="small" c={periodo === k ? color.accion : color.tintaSuave}>{l}</T>
                </Pressable>
              ))}
            </ScrollView>
            <Pressable onPress={() => setMostrarFiltros(v => !v)} accessibilityRole="button" accessibilityState={{ expanded: mostrarFiltros }}
              style={{ minHeight: 44, alignSelf: "flex-start", justifyContent: "center", marginTop: 4 }}>
              <T v="meta" c={color.enlace} style={{ fontFamily: font.semibold }}>{mostrarFiltros ? "Ocultar filtros" : "Filtrar por objetivo y supervisor"}</T>
            </Pressable>
            {mostrarFiltros && <>
            <T v="small" c={color.tintaSuave} style={{ marginTop: 10 }}>Objetivo</T>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 5, marginHorizontal: -20 }} contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}>
              {["todos", ...objetivos].map(o => (
                <Pressable key={o} onPress={() => setObjetivo(o)} style={{ minHeight: 38, paddingHorizontal: 12, borderRadius: 19, justifyContent: "center",
                  backgroundColor: objetivo === o ? color.seleccion : color.superficie, borderWidth: 1, borderColor: objetivo === o ? color.accion : color.linea }}>
                  <T v="small" c={objetivo === o ? color.accion : color.tintaSuave}>{o === "todos" ? "Todos" : o}</T>
                </Pressable>
              ))}
            </ScrollView>
            <T v="small" c={color.tintaSuave} style={{ marginTop: 10 }}>Supervisor</T>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 5, marginHorizontal: -20 }} contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}>
              {["todos", ...supervisores].map(nombre => (
                <Pressable key={nombre} onPress={() => setSupervisor(nombre)} style={{ minHeight: 38, paddingHorizontal: 12, borderRadius: 19, justifyContent: "center",
                  backgroundColor: supervisor === nombre ? color.seleccion : color.superficie, borderWidth: 1, borderColor: supervisor === nombre ? color.accion : color.linea }}>
                  <T v="small" c={supervisor === nombre ? color.accion : color.tintaSuave}>{nombre === "todos" ? "Todos" : nombre}</T>
                </Pressable>
              ))}
            </ScrollView>
            </>}
            {error && <T v="small" c={color.malInk} style={{ marginTop: 8 }}>{error}</T>}
            <T v="small" c={color.tintaMuda} style={{ marginTop: 10 }}>{lista.length} incidencia{lista.length === 1 ? "" : "s"} en el resultado</T>
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
              <Chip texto={t.estado === "Cerrada" ? "Cerrada" : antigua(t) ? "Más de 48 h" : valoracionTono[t.valoracion].label} tono={t.estado === "Cerrada" ? "neutro" : t.valoracion === "M" || antigua(t) ? "mal" : "regular"} />
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
