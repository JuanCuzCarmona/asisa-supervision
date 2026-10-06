import { View } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Avatar, Boton, FilaDato, Grupo, T, useMargenInferior } from "../../components/ui";
import { iniciales } from "../../domain/formato";
import { useSession } from "../../state/session";
import { color } from "../../theme";

export default function Cuenta() {
  const ins = useSafeAreaInsets();
  const abajo = useMargenInferior();
  const s = useSession();
  return (
    <View style={{ flex: 1, backgroundColor: color.fondo, padding: 20, paddingTop: ins.top + 8, gap: 16 }}>
      <View style={{ marginLeft: -12, alignSelf: "flex-start" }}><Boton variante="texto" titulo="‹ Inicio" onPress={() => router.back()} /></View>
      <View style={{ alignItems: "center", gap: 10 }}>
        <Avatar texto={iniciales(s.usuario?.nombre)} size={76} />
        <T v="headline">{s.usuario?.nombre}</T>
        <T v="meta" c={color.tintaSuave}>Supervisión de campo</T>
      </View>
      <Grupo>
        <FilaDato k="Servidor" v={s.online ? "Conectado" : "Sin señal"} />
        <FilaDato k="Actas en cola" v={String(s.pendientes.length)} ultima />
      </Grupo>
      <Boton variante="secundario" titulo="Conexión y actas en cola" onPress={() => router.push("/supervisor/pendientes")} />
      <Boton variante="secundario" icono="key" titulo="Cambiar contraseña" onPress={() => router.push("/clave")} />
      <View style={{ flex: 1 }} />
      <Boton variante="tintado" titulo="Cerrar sesión" onPress={async () => { await s.logout(); router.replace("/login"); }}
        style={{ marginBottom: abajo + 8 }} />
    </View>
  );
}
