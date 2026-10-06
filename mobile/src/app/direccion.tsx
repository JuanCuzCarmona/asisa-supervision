/* Dirección — resumen ejecutivo del mes. */
import { useEffect, useMemo, useState } from "react";
import { Image, Pressable, RefreshControl, ScrollView, View } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { apiFetch } from "../api";
import { Avatar, BarraProgreso, Boton, EMBLEMA, Grupo, Icono, Punto, T, useMargenInferior } from "../components/ui";
import { hora, iniciales } from "../domain/formato";
import { useSession, type PedidoClave } from "../state/session";
import { useTickets } from "../state/tickets";
import { color, font, radius } from "../theme";

interface Kpis {
  visitas: number; meta: number; criticas: number; activas: number; cerradas: number;
  remotas: number; presenciales: number; diasProm: number;
  porArea: { area: string; cantidad: number }[];
  porObjetivo: { id: number; nombre: string; tipo: string; hechas: number; meta: number }[];
  feed: { hora: string; sup: string; obj: string; tipo: string; ok: boolean; codigo?: string }[];
  historico: { mes: string; rondas: number; remotas: number; criticas: number }[];
  excepciones: { codigo: string; obj: string; sup: string; fecha: string; justificacion: string; distancia: number | null }[];
}

const KPIS_VACIOS: Kpis = {
  visitas: 0, meta: 1, criticas: 0, activas: 0, cerradas: 0, remotas: 0, presenciales: 0, diasProm: 0,
  porArea: [], porObjetivo: [], feed: [], historico: [], excepciones: [],
};

export default function Direccion() {
  const ins = useSafeAreaInsets();
  const abajo = useMargenInferior();
  const s = useSession();
  const { tickets } = useTickets();
  const [api, setApi] = useState<Kpis | null>(null);
  const [cargando, setCargando] = useState(false);
  const [objetivoAbierto, setObjetivoAbierto] = useState<string | null>(null);

  const cargar = async () => {
    if (!s.token) return;
    setCargando(true);
    try {
      const [k, a, h, e] = await Promise.all([
        apiFetch<any>(s.apiUrl, "/api/kpis", { token: s.token }),
        apiFetch<any>(s.apiUrl, "/api/actividad?limite=12", { token: s.token }),
        apiFetch<any>(s.apiUrl, "/api/kpis/historico?meses=6", { token: s.token }).catch(() => ({ historico: [] })),
        apiFetch<any>(s.apiUrl, "/api/actividad?tipo=remota&limite=8", { token: s.token }).catch(() => ({ actividad: [] })),
      ]);
      const po = k.kpis.cumplimiento_objetivos.map((o: any) => ({ id: o.id, nombre: o.nombre, tipo: o.tipo, hechas: o.rondas_realizadas, meta: o.visitas_meta_mes || 0 }));
      setApi({
        visitas: po.reduce((x: number, o: any) => x + o.hechas, 0), meta: po.reduce((x: number, o: any) => x + o.meta, 0) || 1,
        criticas: k.kpis.tickets.criticos, activas: k.kpis.tickets.abiertos, cerradas: k.kpis.tickets.cerrados, porObjetivo: po,
        remotas: k.kpis.rondas.remotas, presenciales: k.kpis.rondas.presenciales,
        diasProm: k.kpis.tickets.dias_promedio_resolucion,
        porArea: k.kpis.tickets.por_area.map((x: any) => ({ area: x.area_responsable, cantidad: Number(x.cantidad) })),
        feed: a.actividad.map((r: any) => ({ hora: hora(r.fecha_hora), sup: r.supervisor, obj: r.objetivo,
          tipo: r.tipo === "remota" ? "Remota" : "Presencial", ok: r.tickets === 0, codigo: r.codigo_acta })),
        historico: h.historico,
        excepciones: e.actividad.map((r: any) => ({ codigo: r.codigo_acta, obj: r.objetivo, sup: r.supervisor,
          fecha: r.fecha_hora, justificacion: r.justificacion_fuera || "Sin detalle", distancia: r.distancia_geocerca_m })),
      });
    } catch { /* se queda con lo último */ } finally { setCargando(false); }
  };
  useEffect(() => { cargar(); }, [s.apiUrl, s.token]);

  // Hasta que llegan los datos del servidor, el tablero muestra ceros (no datos inventados).
  const k = api || KPIS_VACIOS;
  const pct = Math.round((k.visitas / k.meta) * 100);
  const mes = new Date().toLocaleDateString("es-AR", { month: "long", year: "numeric" });
  const antiguas = tickets.filter(t => t.estado === "Activa" && t.fechaIso && Date.now() - new Date(t.fechaIso).getTime() >= 48 * 3600000).length;
  const maxRondas = Math.max(1, ...k.historico.map(m => m.rondas));

  return (
    <View style={{ flex: 1, backgroundColor: color.fondo }}>
      <View style={{ paddingTop: ins.top + 10, paddingHorizontal: 20, paddingBottom: 8, flexDirection: "row", alignItems: "center", gap: 12 }}>
        <Image source={EMBLEMA} style={{ width: 30, height: 39 }} />
        <View style={{ flex: 1 }}>
          <T v="bodyLg">{s.usuario?.nombre}</T>
          <T v="small" c={color.tintaSuave}>Dirección</T>
        </View>
        <Pressable onPress={() => router.push("/clave")} accessibilityRole="button" accessibilityLabel="Cambiar contraseña"
          style={{ width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: color.seleccion }}>
          <Icono n="key" size={20} />
        </Pressable>
        <Pressable onPress={async () => { await s.logout(); router.replace("/login"); }} accessibilityLabel="Cerrar sesión">
          <Avatar texto={iniciales(s.usuario?.nombre)} />
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: abajo + 24, gap: 16 }}
        refreshControl={<RefreshControl refreshing={cargando} onRefresh={cargar} tintColor={color.accion} />}>
        <View>
          <T v="display" style={{ marginTop: 8 }}>{mes.charAt(0).toUpperCase() + mes.slice(1)}</T>
          <T v="body" c={color.tintaSuave}>Ciclo mensual de cumplimiento.</T>
        </View>

        <PedidosClave />

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

        <Grupo style={{ padding: 18, gap: 10 }}>
          <T v="titleSm">Control de la operación</T>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ flex: 1, padding: 12, borderRadius: radius.control, backgroundColor: color.seleccion }}>
              <T v="metric" style={{ fontSize: 28 }}>{k.presenciales}</T><T v="small" c={color.tintaSuave}>Presenciales</T>
            </View>
            <View style={{ flex: 1, padding: 12, borderRadius: radius.control, backgroundColor: color.regularSoft }}>
              <T v="metric" c={color.regularInk} style={{ fontSize: 28 }}>{k.remotas}</T><T v="small" c={color.regularInk}>Remotas</T>
            </View>
            <View style={{ flex: 1, padding: 12, borderRadius: radius.control, backgroundColor: color.malSoft }}>
              <T v="metric" c={color.malInk} style={{ fontSize: 28 }}>{antiguas}</T><T v="small" c={color.malInk}>Tickets +48 h</T>
            </View>
          </View>
          {k.diasProm > 0 && <T v="meta" c={color.tintaSuave}>Resolución promedio: {k.diasProm} días</T>}
          {k.porArea.map(a => <View key={a.area} style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <T v="meta">{a.area}</T><T v="meta" c={color.tintaSuave}>{a.cantidad} activa{a.cantidad === 1 ? "" : "s"}</T>
          </View>)}
        </Grupo>

        <Grupo style={{ padding: 18 }}>
          <T v="titleSm">Tendencia de rondas · 6 meses</T>
          {k.historico.length ? k.historico.map(m => <View key={m.mes} style={{ marginTop: 12, gap: 5 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <T v="meta">{m.mes}</T><T v="small" c={color.tintaSuave}>{m.rondas} rondas · {m.remotas} remotas · {m.criticas} críticas</T>
            </View>
            <BarraProgreso valor={m.rondas / maxRondas * 100} alto={8} />
          </View>) : <T v="small" c={color.tintaSuave} style={{ marginTop: 8 }}>El historial aparece al conectar el servidor.</T>}
        </Grupo>

        <Grupo style={{ padding: 18 }}>
          <T v="titleSm">Cumplimiento por objetivo</T>
          <T v="small" c={color.tintaSuave} style={{ marginBottom: 6 }}>Visitas realizadas sobre la meta mensual</T>
          {k.porObjetivo.map(o => {
            const p = o.meta ? Math.round((o.hechas / o.meta) * 100) : 0;
            const bajo = p < 50;
            return (
              <Pressable key={o.nombre} onPress={() => setObjetivoAbierto(x => x === o.nombre ? null : o.nombre)}
                style={{ paddingVertical: 9, gap: 6 }} accessibilityRole="button" accessibilityState={{ expanded: objetivoAbierto === o.nombre }}
                accessibilityLabel={`${o.nombre}: ${o.hechas} de ${o.meta} visitas, ${p}%. Ver incidencias`}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 8 }}>
                  <T v="meta" numberOfLines={1} style={{ flex: 1 }}>{o.nombre}</T>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <T v="meta" c={color.tintaSuave} style={{ fontVariant: ["tabular-nums"] }}>{o.hechas}/{o.meta}</T>
                    {bajo && <Icono n="alert" c={color.regularInk} size={14} w={2.2} />}
                    <T v="meta" c={bajo ? color.regularInk : color.marino} style={{ fontFamily: font.semibold, width: 44, textAlign: "right", fontVariant: ["tabular-nums"] }}>{p}%</T>
                  </View>
                </View>
                <BarraProgreso valor={p} alto={8} />
                {objetivoAbierto === o.nombre && <View style={{ padding: 12, borderRadius: radius.control, backgroundColor: color.fondo, gap: 6 }}>
                  <T v="small" c={color.tintaSuave}>{o.tipo} · {o.hechas} visitas realizadas · faltan {Math.max(0, o.meta - o.hechas)}</T>
                  {tickets.filter(t => t.objetivo === o.nombre && t.estado === "Activa").slice(0, 5).map(t => (
                    <Pressable key={t.id} onPress={() => t.codigoActa && router.push(`/acta/${encodeURIComponent(t.codigoActa)}`)}>
                      <T v="small" c={t.valoracion === "M" ? color.malInk : color.regularInk}>{t.id} · {t.descripcion}</T>
                    </Pressable>
                  ))}
                  {!tickets.some(t => t.objetivo === o.nombre && t.estado === "Activa") && <T v="small" c={color.bienInk}>Sin incidencias activas.</T>}
                </View>}
              </Pressable>
            );
          })}
        </Grupo>

        <Grupo style={{ padding: 18, gap: 10 }}>
          <T v="titleSm">Supervisiones remotas recientes</T>
          {k.excepciones.length ? k.excepciones.map(e => <Pressable key={e.codigo} onPress={() => router.push(`/acta/${encodeURIComponent(e.codigo)}`)}
            style={{ paddingVertical: 10, borderTopWidth: 1, borderTopColor: color.linea }}>
            <T v="meta" style={{ fontFamily: font.semibold }}>{e.obj}</T>
            <T v="small" c={color.tintaSuave}>{e.sup} · {e.distancia != null ? `${e.distancia} m` : "Sin GPS"} · {new Date(e.fecha).toLocaleDateString("es-AR")}</T>
            <T v="small" c={color.regularInk} numberOfLines={2}>{e.justificacion}</T>
          </Pressable>) : <T v="small" c={color.tintaSuave}>Sin supervisiones remotas recientes registradas.</T>}
        </Grupo>

        <Grupo style={{ paddingHorizontal: 18, paddingTop: 16, paddingBottom: 6 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
            <T v="titleSm">Actividad reciente</T>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}><Punto c={color.bienPunto} /><T v="small" c={color.bienInk}>En vivo</T></View>
          </View>
          {k.feed.map((a, i) => (
            <Pressable key={i} onPress={() => a.codigo && router.push(`/acta/${encodeURIComponent(a.codigo)}`)}
              style={{ flexDirection: "row", alignItems: "center", gap: 12, minHeight: 60, borderTopWidth: i ? 1 : 0, borderTopColor: color.lineaSuave }}>
              <T v="small" c={color.tintaSuave} style={{ width: 44, fontVariant: ["tabular-nums"] }}>{a.hora}</T>
              <View style={{ flex: 1 }}>
                <T v="meta" style={{ fontFamily: font.semibold }} numberOfLines={1}>{a.obj}</T>
                <T v="small" c={color.tintaMuda}>{a.sup} · {a.tipo}</T>
              </View>
              <View style={{ minHeight: 26, paddingHorizontal: 10, borderRadius: 13, justifyContent: "center", backgroundColor: a.ok ? color.bienTint : color.regularSoft }}>
                <T v="small" c={a.ok ? color.bienInk : color.regularInk} style={{ fontFamily: font.semibold, fontSize: 13 }}>{a.ok ? "Sin novedad" : "Con incidencia"}</T>
              </View>
            </Pressable>
          ))}
        </Grupo>
      </ScrollView>
    </View>
  );
}

/* Pedidos de cambio de contraseña esperando la aprobación de Dirección.
   Se oculta cuando no hay ninguno. La clave nueva viaja ya hasheada: acá no se ve. */
function PedidosClave() {
  const s = useSession();
  const [lista, setLista] = useState<PedidoClave[]>([]);
  const [ocupado, setOcupado] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cargar = () => {
    if (!s.token) return;
    apiFetch<any>(s.apiUrl, "/api/solicitudes-clave", { token: s.token }).then(d => setLista(d.solicitudes)).catch(() => {});
  };
  useEffect(cargar, [s.apiUrl, s.token]);

  const pedidos = lista;
  if (!pedidos.length) return null;

  const resolver = async (id: number, aprobar: boolean) => {
    setError(null);
    setOcupado(id);
    try { await apiFetch(s.apiUrl, `/api/solicitudes-clave/${id}`, { method: "PATCH", token: s.token, body: { aprobar } }); }
    catch (e: any) { setError(e.message); }
    finally { setOcupado(null); cargar(); }
  };
  const ROL: Record<string, string> = { supervisor: "Supervisor", admin: "Administración", dueno: "Dirección" };

  return (
    <Grupo style={{ padding: 18, gap: 4 }}>
      <T v="label" c={color.tintaSuave}>Cambios de contraseña por aprobar</T>
      <T v="small" c={color.tintaSuave}>La contraseña nueva recién rige cuando la aprobás.</T>
      {pedidos.map((p, i) => (
        <View key={p.id} style={{ paddingTop: 14, marginTop: i ? 10 : 6, borderTopWidth: i ? 1 : 0, borderTopColor: color.linea, gap: 10 }}>
          <View>
            <T v="bodyLg">{p.nombre}</T>
            <T v="small" c={color.tintaSuave}>{ROL[p.rol] || p.rol} · {p.username} · {new Date(p.creada_en).toLocaleString("es-AR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</T>
          </View>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <Boton variante="secundario" titulo="Rechazar" alto={48} deshabilitado={ocupado === p.id} onPress={() => resolver(p.id, false)} style={{ flex: 1 }} />
            <Boton titulo="Aprobar" icono="check" alto={48} cargando={ocupado === p.id} onPress={() => resolver(p.id, true)} style={{ flex: 1 }} />
          </View>
        </View>
      ))}
      {error && <T v="meta" c={color.malInk}>{error}</T>}
    </Grupo>
  );
}
