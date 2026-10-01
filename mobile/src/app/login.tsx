import { useRef, useState } from "react";
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View, useWindowDimensions } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { Boton, EMBLEMA, Grupo, Hoja, Icono, Logo, Separador, T, Fila } from "../components/ui";
import { DEMO_CRED, useSession } from "../state/session";
import { color, font } from "../theme";

const ROL_DEMO: Record<string, string> = { supervisor: "Supervisor", admin: "Administración", dueno: "Dirección" };

export default function Login() {
  const ins = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  // Pantallas bajas (celulares chicos de gama baja): menos aire arriba para que
  // el formulario y el botón Ingresar entren sin desplazar.
  const compacto = height - ins.top - ins.bottom < 700;
  const { login, apiUrl } = useSession();
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [ver, setVer] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [demo, setDemo] = useState(false);
  const passRef = useRef<TextInput>(null);

  const entrar = async () => {
    setError(null);
    setCargando(true);
    try {
      await login(user, pass);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/");
    } catch (e: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(e.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: color.fondo }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      {/* Marca de agua del emblema, solo en el login */}
      <Image source={EMBLEMA} style={{ position: "absolute", right: -86, bottom: -48, width: 300, height: 387, opacity: 0.045 }} />
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingTop: ins.top + (compacto ? 24 : 52), paddingBottom: ins.bottom + 16 }}
        keyboardShouldPersistTaps="handled">
        <Animated.View entering={FadeInDown.duration(500)} style={{ alignItems: "center" }}>
          <Logo ancho={compacto ? 170 : 204} />
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: compacto ? 14 : 22 }}>
            <View style={{ width: 20, height: 1, backgroundColor: color.lineaFuerte }} />
            <T v="label" c={color.tintaSuave}>Panel de supervisión</T>
            <View style={{ width: 20, height: 1, backgroundColor: color.lineaFuerte }} />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(120).duration(500)} style={{ marginTop: compacto ? 24 : 48 }}>
          <T v="display" style={{ fontSize: 30 }}>Iniciar sesión</T>
          <T v="body" c={color.tintaSuave} style={{ marginTop: 6, marginBottom: compacto ? 14 : 22 }}>Ingresá con tu usuario corporativo.</T>

          <Grupo>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12, minHeight: 58, paddingLeft: 16, paddingRight: 8 }}>
              <Icono n="user" c={color.tintaMuda} size={20} w={1.8} />
              <T v="meta" style={{ width: 92, fontSize: 16 }}>Usuario</T>
              <TextInput value={user} onChangeText={setUser} placeholder="nombre.apellido" placeholderTextColor={color.placeholder}
                autoCapitalize="none" autoCorrect={false} autoComplete="username" returnKeyType="next"
                onSubmitEditing={() => passRef.current?.focus()}
                style={{ flex: 1, height: 56, fontFamily: font.regular, fontSize: 17, color: color.marino }} />
            </View>
            <Separador inset={48} />
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12, minHeight: 58, paddingLeft: 16, paddingRight: 4 }}>
              <Icono n="lock" c={color.tintaMuda} size={20} w={1.8} />
              <T v="meta" style={{ width: 92, fontSize: 16 }}>Contraseña</T>
              <TextInput ref={passRef} value={pass} onChangeText={setPass} placeholder="Requerida" placeholderTextColor={color.placeholder}
                secureTextEntry={!ver} autoComplete="current-password" returnKeyType="go" onSubmitEditing={entrar}
                style={{ flex: 1, height: 56, fontFamily: font.regular, fontSize: 17, color: color.marino }} />
              <Pressable onPress={() => setVer(v => !v)} accessibilityLabel={ver ? "Ocultar contraseña" : "Mostrar contraseña"}
                style={{ width: 48, height: 48, alignItems: "center", justifyContent: "center" }}>
                <Icono n={ver ? "eye-off" : "eye"} c={color.tintaSuave} size={21} w={1.8} />
              </Pressable>
            </View>
          </Grupo>

          {error && (
            <View accessibilityLiveRegion="polite" style={{ marginTop: 12, backgroundColor: color.malSoft, borderRadius: 12, padding: 14, flexDirection: "row", gap: 8 }}>
              <Icono n="alert" c={color.malInk} size={18} />
              <T v="meta" c={color.malInk} style={{ flex: 1, fontFamily: font.semibold }}>{error}</T>
            </View>
          )}

          <View style={{ alignItems: "flex-end" }}>
            <Boton variante="texto" titulo="¿Olvidaste tu contraseña?" onPress={() => setError("Pedí el blanqueo de tu contraseña a Administración.")} />
          </View>
          <Boton titulo={cargando ? "Verificando…" : "Ingresar"} onPress={entrar} cargando={cargando} style={{ marginTop: 6 }} />

          <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginVertical: 16 }}>
            <View style={{ flex: 1, height: 1, backgroundColor: color.linea }} />
            <T v="small" c={color.tintaMuda}>o</T>
            <View style={{ flex: 1, height: 1, backgroundColor: color.linea }} />
          </View>
          <Boton variante="secundario" icono="fingerprint" titulo="Ingresar con huella" deshabilitado />
          <T v="small" c={color.tintaMuda} style={{ textAlign: "center", marginTop: 8 }}>Disponible después del primer ingreso con contraseña.</T>
        </Animated.View>

        <View style={{ marginTop: "auto", paddingTop: 28, alignItems: "center" }}>
          <View style={{ flexDirection: "row", gap: 18 }}>
            {!apiUrl && <Boton variante="texto" titulo="Accesos de prueba" onPress={() => setDemo(true)} />}
            <Boton variante="texto" titulo="Servidor" onPress={() => router.push("/servidor")} />
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Icono n="shield" c={color.tintaMuda} size={14} />
            <T v="small" c={color.tintaMuda} style={{ fontSize: 13 }}>{apiUrl ? "Conexión cifrada · ASI v3.0" : "Modo demostración · ASI v3.0"}</T>
          </View>
        </View>
      </ScrollView>

      <Hoja visible={demo} onCerrar={() => setDemo(false)} titulo="Accesos de prueba" subtitulo="Solo disponibles en modo demostración.">
        <Grupo>
          {Object.entries(DEMO_CRED).map(([k, c], i) => (
            <View key={k}>
              {i > 0 && <Separador inset={0} />}
              <Fila onPress={() => { setUser(k); setPass(c.password); setError(null); setDemo(false); }}>
                <View style={{ flex: 1 }}>
                  <T v="bodyLg">{ROL_DEMO[k]}</T>
                  <T v="small" c={color.tintaMuda}>{c.usuario.nombre} · {k}</T>
                </View>
                <Icono n="chevron-r" c={color.placeholder} size={18} />
              </Fila>
            </View>
          ))}
        </Grupo>
        <Boton variante="tintado" titulo="Cerrar" alto={52} onPress={() => setDemo(false)} style={{ marginTop: 14 }} />
      </Hoja>
    </KeyboardAvoidingView>
  );
}
