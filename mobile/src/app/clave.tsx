/* Cambio de la propia contraseña (todos los roles). Supervisor y Administración
   envían un pedido que Dirección aprueba; hasta entonces sigue valiendo la actual.
   Dirección cambia la suya al instante. Misma regla que POST /api/cuenta/clave. */
import { useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { apiFetch } from "../api";
import { Boton, Campo, Etiqueta, Icono, T, useMargenInferior } from "../components/ui";
import { useSession } from "../state/session";
import { color } from "../theme";

const fechaHora = (iso: string) => new Date(iso).toLocaleString("es-AR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

export default function CambiarClave() {
  const ins = useSafeAreaInsets();
  const abajo = useMargenInferior();
  const s = useSession();
  const esDueno = s.usuario?.rol === "dueno";
  const [actual, setActual] = useState("");
  const [nueva, setNueva] = useState("");
  const [repite, setRepite] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [hecho, setHecho] = useState<"pendiente" | "aprobada" | null>(null);
  const [previo, setPrevio] = useState<string | null>(null);

  useEffect(() => {
    if (!s.apiUrl || !s.token) return;
    apiFetch<any>(s.apiUrl, "/api/cuenta/clave", { token: s.token })
      .then(d => { if (d.solicitud?.estado === "pendiente") setPrevio(d.solicitud.creada_en); })
      .catch(() => {});
  }, [s.apiUrl, s.token]);

  const enviar = async () => {
    setError(null);
    if (!actual) return setError("Ingresá tu contraseña actual.");
    if (nueva.length < 8) return setError("La contraseña nueva debe tener al menos 8 caracteres.");
    if (nueva !== repite) return setError("Las dos contraseñas nuevas no coinciden.");
    if (nueva === actual) return setError("La contraseña nueva tiene que ser distinta de la actual.");
    setEnviando(true);
    try { setHecho(await s.pedirCambioClave(actual, nueva)); }
    catch (e: any) { setError(e.message); }
    finally { setEnviando(false); }
  };

  if (hecho) {
    const ok = hecho === "aprobada";
    return (
      <View style={{ flex: 1, backgroundColor: color.fondo, padding: 24, paddingTop: ins.top + 60, alignItems: "center", gap: 14 }}>
        <View style={{ width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center", backgroundColor: ok ? color.bienSoft : color.regularSoft }}>
          <Icono n={ok ? "check" : "refresh"} size={30} c={ok ? color.bienInk : color.regularInk} />
        </View>
        <T v="headline" style={{ textAlign: "center" }}>{ok ? "Contraseña actualizada" : "Pedido enviado a Dirección"}</T>
        <T v="body" c={color.tintaSuave} style={{ textAlign: "center" }}>
          {ok ? "La próxima vez ingresá con la contraseña nueva." : "Hasta que Dirección lo apruebe, seguí ingresando con tu contraseña actual."}
        </T>
        <View style={{ flex: 1 }} />
        <Boton titulo="Listo" onPress={() => router.back()} style={{ alignSelf: "stretch", marginBottom: abajo + 8 }} />
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: color.fondo }} keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ padding: 20, paddingTop: ins.top + 8, paddingBottom: abajo + 24, gap: 18 }}>
      <View style={{ marginLeft: -12, alignSelf: "flex-start" }}><Boton variante="texto" titulo="‹ Volver" onPress={() => router.back()} /></View>
      <View>
        <T v="display" style={{ fontSize: 28 }}>Cambiar contraseña</T>
        <T v="body" c={color.tintaSuave} style={{ marginTop: 6 }}>
          {esDueno ? "El cambio rige al instante." : "Dirección tiene que aprobar el cambio."}
        </T>
      </View>
      {previo && (
        <View style={{ backgroundColor: color.regularSoft, borderRadius: 14, padding: 14 }}>
          <T v="meta" c={color.regularInk}>Ya tenés un pedido esperando aprobación desde el {fechaHora(previo)}. Si enviás otro, reemplaza al anterior.</T>
        </View>
      )}
      <View>
        <Etiqueta>Contraseña actual</Etiqueta>
        <Campo icono="lock" value={actual} onChangeText={setActual} secureTextEntry autoCapitalize="none" autoComplete="current-password" />
      </View>
      <View>
        <Etiqueta>Contraseña nueva</Etiqueta>
        <Campo icono="key" value={nueva} onChangeText={setNueva} secureTextEntry autoCapitalize="none" autoComplete="new-password" placeholder="Mínimo 8 caracteres" />
      </View>
      <View>
        <Etiqueta>Repetir contraseña nueva</Etiqueta>
        <Campo icono="key" value={repite} onChangeText={setRepite} secureTextEntry autoCapitalize="none" autoComplete="new-password"
          returnKeyType="send" onSubmitEditing={enviar} />
      </View>
      {error && <T v="meta" c={color.malInk} accessibilityRole="alert">{error}</T>}
      <Boton titulo={esDueno ? "Cambiar contraseña" : "Enviar pedido"} onPress={enviar} cargando={enviando} />
    </ScrollView>
  );
}
