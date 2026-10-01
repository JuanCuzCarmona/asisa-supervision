import { View } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Avatar, Boton, FilaDato, Grupo, T } from "../../components/ui";
import { iniciales } from "../../domain/formato";
import { useSession } from "../../state/session";
import { color } from "../../theme";

export default function Cuenta() {
  const ins = useSafeAreaInsets();
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
        <FilaDato k="Servidor" v={s.apiUrl || "Modo demo"} />
        <FilaDato k="Actas en cola" v={String(s.pendientes.length)} ultima />
      </Grupo>
      <Boton variante="secundario" titulo="Conexión y actas en cola" onPress={() => router.push("/supervisor/pendientes")} />
      <View style={{ flex: 1 }} />
      <Boton variante="tintado" titulo="Cerrar sesión" onPress={async () => { await s.logout(); router.replace("/login"); }}
        style={{ marginBottom: ins.bottom + 8 }} />
    </View>
  );
}
