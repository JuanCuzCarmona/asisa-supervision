/* Dirección — resumen ejecutivo del mes. */
import { useEffect, useMemo, useState } from "react";
import { Image, Pressable, RefreshControl, ScrollView, View } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { apiFetch } from "../api";
import { Avatar, BarraProgreso, EMBLEMA, Grupo, Icono, Punto, T } from "../components/ui";
import { SEED_FEED } from "../data/seed";
import { hora, iniciales } from "../domain/formato";
import { useSession } from "../state/session";
import { color, font, radius } from "../theme";

interface Kpis {
  visitas: number; meta: number; criticas: number; activas: number; cerradas: number;
  porObjetivo: { nombre: string; tipo: string; hechas: number; meta: number }[];
  feed: { hora: string; sup: string; obj: string; tipo: string; ok: boolean }[];
}

export default function Direccion() {
  const ins = useSafeAreaInsets();
  const s = useSession();
  const [api, setApi] = useState<Kpis | null>(null);
  const [cargando, setCargando] = useState(false);

  const cargar = async () => {
    if (!s.apiUrl || !s.token) return;
    setCargando(true);
    try {
      const [k, a] = await Promise.all([
        apiFetch<any>(s.apiUrl, "/api/kpis", { token: s.token }),
        apiFetch<any>(s.apiUrl, "/api/actividad?limite=8", { token: s.token }),
      ]);
      const po = k.kpis.cumplimiento_objetivos.map((o: any) => ({ nombre: o.nombre, tipo: o.tipo, hechas: o.rondas_realizadas, meta: o.visitas_meta_mes || 0 }));
      setApi({
        visitas: po.reduce((x: number, o: any) => x + o.hechas, 0), meta: po.reduce((x: number, o: any) => x + o.meta, 0) || 1,
        criticas: k.kpis.tickets.criticos, activas: k.kpis.tickets.abiertos, cerradas: k.kpis.tickets.cerrados, porObjetivo: po,
        feed: a.actividad.map((r: any) => ({ hora: hora(r.fecha_hora), sup: r.supervisor, obj: r.objetivo, tipo: r.tipo === "remota" ? "Remota" : "Presencial", ok: r.tickets === 0 })),
      });
    } catch { /* se queda con lo último */ } finally { setCargando(false); }
  };
  useEffect(() => { cargar(); }, [s.apiUrl, s.token]);

  const demo = useMemo<Kpis>(() => {
    const po = s.catalogos.objetivos.map(o => ({ nombre: o.nombre, tipo: o.tipo, hechas: (o.visitas_mes || 0) + (s.visitasDemo[o.id] || 0), meta: o.visitas_meta_mes || 0 }));
    const t = s.ticketsDemo;
    return {
      visitas: po.reduce((x, o) => x + o.hechas, 0), meta: po.reduce((x, o) => x + o.meta, 0) || 1,
      criticas: t.filter(x => x.estado === "Activa" && x.valoracion === "M").length,
      activas: t.filter(x => x.estado === "Activa").length, cerradas: t.filter(x => x.estado === "Cerrada").length,
      porObjetivo: po, feed: (SEED_FEED as any[]).map(f => ({ hora: f.hora, sup: f.sup, obj: f.obj, tipo: f.tipo, ok: f.ok })),
    };
  }, [s.catalogos.objetivos, s.ticketsDemo, s.visitasDemo]);

  const k = api || demo;
  const pct = Math.round((k.visitas / k.meta) * 100);
  const mes = new Date().toLocaleDateString("es-AR", { month: "long", year: "numeric" });

  return (
    <View style={{ flex: 1, backgroundColor: color.fondo }}>
      <View style={{ paddingTop: ins.top + 10, paddingHorizontal: 20, paddingBottom: 8, flexDirection: "row", alignItems: "center", gap: 12 }}>
        <Image source={EMBLEMA} style={{ width: 30, height: 39 }} />
        <View style={{ flex: 1 }}>
          <T v="bodyLg">{s.usuario?.nombre}</T>
          <T v="small" c={color.tintaSuave}>Dirección</T>
        </View>
        <Pressable onPress={async () => { await s.logout(); router.replace("/login"); }} accessibilityLabel="Cerrar sesión">
          <Avatar texto={iniciales(s.usuario?.nombre)} />
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: ins.bottom + 24, gap: 16 }}
        refreshControl={<RefreshControl refreshing={cargando} onRefresh={cargar} tintColor={color.accion} />}>
        <View>
          <T v="display" style={{ marginTop: 8 }}>{mes.charAt(0).toUpperCase() + mes.slice(1)}</T>
          <T v="body" c={color.tintaSuave}>Ciclo mensual de cumplimiento.</T>
        </View>

        <Grupo style={{ padding: 18, gap: 8 }}>
          <T v="label" c={color.tintaSuave}>Cobertura de visitas</T>
          <View style={{ flexDirection: "row", alignItems: "baseline", gap: 10 }}>
            <T v="metric">{pct}%</T>
            <T v="meta" c={color.tintaSuave} style={{ fontVariant: ["tabular-nums"] }}>{k.visitas} de {k.meta} visitas</T>
          </View>
          <BarraProgreso valor={pct} alto={8} />
        </Grupo>

        <View style={{ flexDirection: "row", backgroundColor: color.superficie, borderWidth: 1, borderColor: color.linea, borderRadius: radius.card }}>
          {[["Críticas", k.criticas, color.malInk], ["Activos", k.activas, color.marino], ["Resueltos", k.cerradas, color.marino]].map(([l, n, c], i) => (
            <View key={l as string} style={{ flex: 1, padding: 14, borderLeftWidth: i ? 1 : 0, borderLeftColor: color.linea }}>
              <T v="metric" c={c as string} style={{ fontSize: 32, lineHeight: 36 }}>{n as number}</T>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                {i === 0 && (n as number) > 0 && <Icono n="alert" c={color.malInk} size={13} w={2.2} />}
                <T v="small" c={i === 0 ? color.malInk : color.tintaSuave}>{l as string}</T>
              </View>
            </View>
          ))}
        </View>

        <Grupo style={{ padding: 18 }}>
          <T v="titleSm">Cumplimiento por objetivo</T>
          <T v="small" c={color.tintaSuave} style={{ marginBottom: 6 }}>Visitas realizadas sobre la meta mensual</T>
          {k.porObjetivo.map(o => {
            const p = o.meta ? Math.round((o.hechas / o.meta) * 100) : 0;
            const bajo = p < 50;
            return (
              <View key={o.nombre} style={{ paddingVertical: 9, gap: 6 }} accessibilityLabel={`${o.nombre}: ${o.hechas} de ${o.meta} visitas, ${p}%`}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 8 }}>
                  <T v="meta" numberOfLines={1} style={{ flex: 1 }}>{o.nombre}</T>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <T v="meta" c={color.tintaSuave} style={{ fontVariant: ["tabular-nums"] }}>{o.hechas}/{o.meta}</T>
                    {bajo && <Icono n="alert" c={color.regularInk} size={14} w={2.2} />}
                    <T v="meta" c={bajo ? color.regularInk : color.marino} style={{ fontFamily: font.semibold, width: 44, textAlign: "right", fontVariant: ["tabular-nums"] }}>{p}%</T>
                  </View>
                </View>
                <BarraProgreso valor={p} alto={8} />
              </View>
            );
          })}
        </Grupo>

        <Grupo style={{ paddingHorizontal: 18, paddingTop: 16, paddingBottom: 6 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
            <T v="titleSm">Actividad reciente</T>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}><Punto c={color.bienPunto} /><T v="small" c={color.bienInk}>En vivo</T></View>
          </View>
          {k.feed.map((a, i) => (
            <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 12, minHeight: 60, borderTopWidth: i ? 1 : 0, borderTopColor: color.lineaSuave }}>
              <T v="small" c={color.tintaSuave} style={{ width: 44, fontVariant: ["tabular-nums"] }}>{a.hora}</T>
              <View style={{ flex: 1 }}>
                <T v="meta" style={{ fontFamily: font.semibold }} numberOfLines={1}>{a.obj}</T>
                <T v="small" c={color.tintaMuda}>{a.sup} · {a.tipo}</T>
              </View>
              <View style={{ minHeight: 26, paddingHorizontal: 10, borderRadius: 13, justifyContent: "center", backgroundColor: a.ok ? color.bienTint : color.regularSoft }}>
                <T v="small" c={a.ok ? color.bienInk : color.regularInk} style={{ fontFamily: font.semibold, fontSize: 13 }}>{a.ok ? "Sin novedad" : "Con incidencia"}</T>
              </View>
            </View>
          ))}
        </Grupo>
      </ScrollView>
    </View>
  );
}
