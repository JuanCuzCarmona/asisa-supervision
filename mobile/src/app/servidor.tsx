import { useState } from "react";
import { ScrollView, Switch, View } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { apiFetch } from "../api";
import { Boton, Campo, Etiqueta, Grupo, T, useMargenInferior } from "../components/ui";
import { useSession } from "../state/session";
import { color } from "../theme";

/** Equivalente al ApiConfigBar de la web: sin URL la app funciona en modo demo. */
export default function Servidor() {
  const ins = useSafeAreaInsets();
  const abajo = useMargenInferior();
  const s = useSession();
  const [url, setUrl] = useState(s.apiUrl || "http://10.0.2.2:3000");
  const [probando, setProbando] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; texto: string } | null>(null);

  const conectar = async () => {
    setProbando(true); setMsg(null);
    try {
      await apiFetch(url, "/", { timeoutMs: 8000 });
      await s.setApiUrl(url);
      setMsg({ ok: true, texto: "Servidor conectado. Ingresá con tu usuario." });
      setTimeout(() => router.back(), 700);
    } catch (e: any) {
      setMsg({ ok: false, texto: e.message });
    } finally {
      setProbando(false);
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: color.fondo }} contentContainerStyle={{ padding: 20, paddingTop: ins.top + 16, paddingBottom: abajo + 24, gap: 20 }}
      keyboardShouldPersistTaps="handled">
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <T v="display" style={{ fontSize: 28 }}>Servidor</T>
        <Boton variante="texto" titulo="Listo" onPress={() => router.back()} />
      </View>
      <T v="body" c={color.tintaSuave}>
        Sin servidor la app funciona con datos de ejemplo. En el emulador, la computadora es 10.0.2.2; en un celular, usá la dirección de la red o la de Tailscale.
      </T>
      <View>
        <Etiqueta>URL de la API</Etiqueta>
        <Campo icono="settings" value={url} onChangeText={setUrl} autoCapitalize="none" autoCorrect={false} keyboardType="url" placeholder="http://10.0.2.2:3000" />
      </View>
      {msg && <T v="meta" c={msg.ok ? color.bienInk : color.malInk}>{msg.texto}</T>}
      <Boton titulo="Conectar" onPress={conectar} cargando={probando} />
      {s.apiUrl && <Boton variante="secundario" titulo="Volver a modo demo" onPress={async () => { await s.setApiUrl(null); router.back(); }} />}

      <View>
        <Etiqueta>Pruebas de campo</Etiqueta>
        <Grupo>
          <View style={{ minHeight: 64, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", gap: 12 }}>
            <View style={{ flex: 1 }}>
              <T v="bodyLg">Simular sin señal</T>
              <T v="small" c={color.tintaMuda}>Las actas quedan en la cola del celular.</T>
            </View>
            <Switch value={s.sinConexionForzada} onValueChange={s.setSinConexionForzada}
              trackColor={{ true: color.accion, false: color.bordeCampo }} thumbColor="#fff" />
          </View>
        </Grupo>
      </View>
    </ScrollView>
  );
}
