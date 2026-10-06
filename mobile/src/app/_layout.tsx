import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useFonts, Barlow_400Regular, Barlow_500Medium, Barlow_600SemiBold, Barlow_700Bold } from "@expo-google-fonts/barlow";
import { BarlowSemiCondensed_600SemiBold } from "@expo-google-fonts/barlow-semi-condensed";
import { SessionProvider, useSession } from "../state/session";
import { RondaProvider } from "../state/ronda";
import { color } from "../theme";

SplashScreen.preventAutoHideAsync();

function Navegacion() {
  const { listo } = useSession();
  const [fuentes] = useFonts({ Barlow_400Regular, Barlow_500Medium, Barlow_600SemiBold, Barlow_700Bold, BarlowSemiCondensed_600SemiBold });
  useEffect(() => { if (fuentes && listo) SplashScreen.hideAsync(); }, [fuentes, listo]);
  if (!fuentes || !listo) return null;
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: color.fondo }, animation: "slide_from_right" }}>
      <Stack.Screen name="supervisor/acta" options={{ gestureEnabled: false, animation: "fade" }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <SessionProvider>
          <RondaProvider>
            <StatusBar style="dark" />
            <Navegacion />
          </RondaProvider>
        </SessionProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
