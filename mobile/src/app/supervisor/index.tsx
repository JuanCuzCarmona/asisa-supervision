/* Paso 1 — Inicio de ronda: objetivo + geocerca (PRD §2). */
import { memo, useEffect, useMemo, useState } from "react";
import { Image, Pressable, ScrollView, TextInput, View } from "react-native";
import { router } from "expo-router";
import * as Location from "expo-location";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeIn } from "react-native-reanimated";
import { Avatar, BarraAccion, BarraProgreso, Boton, EMBLEMA, Etiqueta, Fila, Grupo, Icono, Punto, Separador, T } from "../../components/ui";
import { SUBTIPO_LABEL } from "../../domain/checklist";
import { fechaLarga, iniciales } from "../../domain/formato";
import { distanciaMetros, formatoDistancia } from "../../domain/geo";
import { useRonda } from "../../state/ronda";
import { useSession } from "../../state/session";
import { color, font, radius } from "../../theme";
import type { Coords, Objetivo } from "../../types";

type EstadoGps = "buscando" | "dentro" | "fuera" | "error";

/* El reloj vive en su propio componente: así el tic de cada segundo solo
   re-dibuja estos dos textos y no la pantalla entera con la lista de objetivos
   (en un celular de 1 GB eso trababa el hilo de JS y los deslizamientos se
   tomaban como toques). */
function Reloj() {
  const [ahora, setAhora] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setAhora(new Date()), 1000); return () => clearInterval(t); }, []);
  return (
    <View style={{ flexShrink: 1 }}>
      <T v="clock">{ahora.toLocaleTimeString("es-AR", { hour12: false })}</T>
      <T v="meta" c={color.tintaSuave} style={{ marginTop: 6 }}>{fechaLarga(ahora)}</T>
    </View>
  );
}

/* Fila memorizada: solo se re-dibuja si cambia su objetivo, sus visitas o si pasa a estar elegida. */
const FilaObjetivo = memo(function FilaObjetivo({ o, hechas, activo, primera, onElegir }: {
  o: Objetivo; hechas: number; activo: boolean; primera: boolean; onElegir: (o: Objetivo) => void;
}) {
  const meta = o.visitas_meta_mes || 0;
  return (
    <View>
      {!primera && <Separador inset={0} />}
      <Fila seleccionada={activo} onPress={() => onElegir(o)} style={{ minHeight: 76 }}
        accessibilityRole="radio" accessibilityLabel={`${o.nombre}, ${hechas} de ${meta} visitas`}>
        <View style={{ width: 26, height: 26, borderRadius: 13, borderWidth: activo ? 0 : 2, borderColor: color.lineaFuerte,
          backgroundColor: activo ? color.accion : color.superficie, alignItems: "center", justifyContent: "center" }}>
          {activo && <Icono n="check" c="#fff" size={15} w={3.2} />}
        </View>
        <View style={{ flex: 1, gap: 3 }}>
          <T v="bodyLg">{o.nombre}</T>
          <T v="small" c={color.tintaMuda} numberOfLines={1}>{SUBTIPO_LABEL[o.subtipo] || o.tipo}{o.direccion ? ` · ${o.direccion}` : ""}</T>
        </View>
        <View style={{ width: 52, alignItems: "flex-end", gap: 6 }}>
          <T v="meta" style={{ fontFamily: font.semibold, fontVariant: ["tabular-nums"] }}>{hechas}/{meta}</T>
          <View style={{ width: 52 }}><BarraProgreso valor={meta ? (hechas / meta) * 100 : 0} alto={4} /></View>
        </View>
      </Fila>
    </View>
  );
});

export default function InicioRonda() {
  const ins = useSafeAreaInsets();
  const s = useSession();
  const { rd, setRd, reiniciar } = useRonda();
  const [coords, setCoords] = useState<Coords | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [sel, setSel] = useState<Objetivo | null>(rd.objetivo);
  const [just, setJust] = useState("");

  // GPS real del dispositivo, alta precisión, siguiendo la posición mientras está la pantalla.
  useEffect(() => {
    let sub: Location.LocationSubscription | null = null;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") { setGpsError("Permiso de ubicación denegado"); return; }
      sub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 5000, distanceInterval: 5 },
        p => { setCoords({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy ?? null }); setGpsError(null); },
      );
    })().catch(() => setGpsError("Señal GPS no disponible"));
    return () => sub?.remove();
  }, []);

  const distancia = coords && sel?.lat != null && sel?.lng != null ? distanciaMetros(coords.lat, coords.lng, sel.lat, sel.lng) : null;
  const gps: EstadoGps = gpsError ? "error" : !coords || !sel ? "buscando" : distancia! <= sel.radio_geocerca_m ? "dentro" : "fuera";

  const grupos = useMemo(() => {
    const q = busca.trim().toLowerCase();
    const g: Record<string, Objetivo[]> = {};
    for (const o of s.catalogos.objetivos) {
      if (q && !o.nombre.toLowerCase().includes(q) && !(o.direccion || "").toLowerCase().includes(q)) continue;
      (g[o.tipo] ||= []).push(o);
    }
    return Object.entries(g);
  }, [s.catalogos.objetivos, busca]);

  const arrancar = (tipo: "presencial" | "remota") => {
    if (!sel) return;
    const cambiaObjetivo = rd.objetivo?.id !== sel.id;
    if (cambiaObjetivo) reiniciar();
    // Vigiladores asignados a este objetivo y activos: se precargan (commit 75a5508).
    const asignados = s.catalogos.vigiladores.filter(v => v.objetivo_asignado === sel.nombre && v.estado === "activo");
    setRd(p => ({
      ...(cambiaObjetivo ? { ...p, respuestas: {}, fotos: [], firmas: {} } : p),
      objetivo: sel, tipo, justificacion: tipo === "remota" ? just.trim() : "",
      coords, distanciaM: distancia != null ? Math.round(distancia) : null,
      horaInicio: new Date().toISOString(),
      vigiladores: cambiaObjetivo || !p.vigiladores.length ? asignados : p.vigiladores,
    }));
    router.push("/supervisor/vigiladores");
  };

  const GPS = {
    buscando: { txt: sel ? "Buscando señal GPS…" : "Elegí un objetivo para validar tu ubicación", punto: color.regular, ink: color.regularInk, soft: color.regularSoft, icono: "pin" },
    dentro: { txt: `Dentro del geocerco · a ${distancia != null ? formatoDistancia(distancia) : ""}`, punto: color.bienPunto, ink: color.bienInk, soft: color.bienSoft, icono: "shield" },
    fuera: { txt: `Fuera del geocerco · a ${distancia != null ? formatoDistancia(distancia) : ""}`, punto: color.malPunto, ink: color.malInk, soft: color.malSoft, icono: "pin" },
    error: { txt: gpsError || "Error de GPS", punto: color.malPunto, ink: color.malInk, soft: color.malSoft, icono: "pin" },
  }[gps];

  const pendientes = s.pendientes.length;

  return (
    <View style={{ flex: 1, backgroundColor: color.fondo }}>
      {/* Cabecera: emblema + supervisor + estado de conexión */}
      <View style={{ paddingTop: ins.top + 10, paddingHorizontal: 20, paddingBottom: 8, flexDirection: "row", alignItems: "center", gap: 12 }}>
        <Image source={EMBLEMA} style={{ width: 30, height: 39 }} />
        <View style={{ flex: 1 }}>
          <T v="bodyLg" numberOfLines={1}>{s.usuario?.nombre}</T>
          <T v="small" c={color.tintaSuave} numberOfLines={1}>Supervisión de campo</T>
        </View>
        <Pressable onPress={() => router.push("/supervisor/pendientes")} accessibilityLabel="Estado de conexión y actas en cola"
          style={{ height: 34, paddingHorizontal: 12, borderRadius: 17, borderWidth: 1, borderColor: color.linea,
            backgroundColor: s.online ? color.superficie : color.regularSoft, flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Punto c={s.online ? color.bienPunto : color.regular} />
          <T v="small" c={s.online ? color.bienInk : color.regularInk} style={{ fontFamily: font.semibold }}>
            {s.online ? (pendientes ? `${pendientes} en cola` : "En línea") : "Sin señal"}
          </T>
        </Pressable>
        <Pressable onPress={() => router.push("/supervisor/cuenta")} accessibilityLabel="Cuenta">
          <Avatar texto={iniciales(s.usuario?.nombre)} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 6 }}>
          <T v="label" c={color.tintaSuave}>Paso 1 de 5</T>
          <View style={{ flex: 1, flexDirection: "row", gap: 4 }}>
            {[0, 1, 2, 3, 4].map(i => <View key={i} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: i === 0 ? color.accion : color.bordeCampo }} />)}
          </View>
        </View>
        <T v="display" style={{ marginTop: 10, marginBottom: 16 }}>Inicio de ronda</T>

        {!s.online && (
          <Animated.View entering={FadeIn} style={{ backgroundColor: color.accion, borderRadius: radius.card, padding: 16, marginBottom: 14, flexDirection: "row", gap: 12 }}>
            <Icono n="wifi-off" c="#fff" size={24} />
            <View style={{ flex: 1 }}>
              <T v="bodyLg" c="#fff">Sin conexión</T>
              <T v="meta" c="#fff" style={{ opacity: 0.92 }}>Podés hacer la ronda igual. El acta queda guardada en el celular y se envía sola al volver la señal.</T>
            </View>
          </Animated.View>
        )}

        <Grupo>
          <View style={{ padding: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Reloj />
            <View style={{ width: 56, height: 56, borderRadius: 14, backgroundColor: GPS.soft, alignItems: "center", justifyContent: "center" }}>
              <Icono n={GPS.icono} c={GPS.ink} size={28} w={1.8} />
            </View>
          </View>
          <Separador inset={0} />
          <View style={{ minHeight: 52, paddingHorizontal: 16, paddingVertical: 12, flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Punto c={GPS.punto} />
            <T v="meta" c={GPS.ink} style={{ flex: 1, fontFamily: font.semibold, fontSize: 16 }}>{GPS.txt}</T>
          </View>
        </Grupo>

        <View style={{ marginTop: 16, height: 52, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, backgroundColor: color.superficie, borderWidth: 1, borderColor: color.linea, borderRadius: radius.control }}>
          <Icono n="search" c={color.tintaMuda} size={20} w={1.9} />
          <TextInput value={busca} onChangeText={setBusca} placeholder="Buscar objetivo o dirección" placeholderTextColor={color.placeholder}
            style={{ flex: 1, height: 48, fontFamily: font.regular, fontSize: 17, color: color.marino }} />
        </View>

        {grupos.map(([tipo, lista]) => (
          <View key={tipo} style={{ marginTop: 22 }}>
            <Etiqueta>{tipo}</Etiqueta>
            <Grupo>
              {lista.map((o, i) => (
                <FilaObjetivo key={o.id} o={o} primera={i === 0} activo={sel?.id === o.id}
                  hechas={(o.visitas_mes ?? 0) + (s.visitasDemo[o.id] || 0)} onElegir={setSel} />
              ))}
            </Grupo>
          </View>
        ))}

        {sel && (gps === "fuera" || gps === "error") && (
          <Animated.View entering={FadeIn} style={{ marginTop: 22 }}>
            <Etiqueta>Supervisión remota</Etiqueta>
            <T v="meta" c={color.tintaSuave} style={{ marginBottom: 8, paddingHorizontal: 4 }}>
              No estás dentro del geocerco. Explicá el motivo (mínimo 10 caracteres); queda registrado en el acta.
            </T>
            <TextInput value={just} onChangeText={setJust} multiline placeholder="Ej.: control telefónico por corte de ruta"
              placeholderTextColor={color.placeholder}
              style={{ minHeight: 100, padding: 14, textAlignVertical: "top", backgroundColor: color.superficie, borderWidth: 1, borderColor: color.linea,
                borderRadius: radius.control, fontFamily: font.regular, fontSize: 17, color: color.marino }} />
          </Animated.View>
        )}
      </ScrollView>

      <BarraAccion resumen={sel ? `${sel.nombre} · ${gps === "dentro" ? "Presencial" : gps === "buscando" ? "Validando ubicación" : "Remota"}` : "Elegí un objetivo"}>
        {!sel
          ? <Boton titulo="Elegí un objetivo" alto={58} deshabilitado />
          : gps === "fuera" || gps === "error"
          ? <Boton variante="contorno" titulo={just.trim().length >= 10 ? "Iniciar supervisión remota" : "Escribí la justificación"}
              deshabilitado={!sel || just.trim().length < 10} alto={58} onPress={() => arrancar("remota")} />
          : <Boton titulo={gps === "dentro" ? "Iniciar ronda presencial" : sel ? "Validando ubicación…" : "Elegí un objetivo"}
              deshabilitado={gps !== "dentro"} alto={58} onPress={() => arrancar("presencial")} />}
      </BarraAccion>
    </View>
  );
}
