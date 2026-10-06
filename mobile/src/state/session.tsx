/* Sesión y datos compartidos de la app: token (en el llavero seguro del sistema,
   nunca en texto plano), catálogos, conectividad y cola offline. Todo sale del
   servidor de ASI; sin señal se trabaja con los catálogos de la última sesión y
   las actas esperan en la cola. */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import * as SecureStore from "expo-secure-store";
import NetInfo from "@react-native-community/netinfo";
import { apiFetch, ApiError } from "../api";
import * as outbox from "./outbox";
import type { Catalogos, Usuario } from "../types";

/** Servidor de ASI (Railway). Para probar contra otro, EXPO_PUBLIC_API_URL al compilar. */
export const API_URL: string =
  (process.env.EXPO_PUBLIC_API_URL || "https://api-production-9e460.up.railway.app").trim().replace(/\/+$/, "");

const K_TOKEN = "asi_token";
const K_USER = "asi_usuario";
const K_CATALOGOS = "catalogos";

const CATALOGOS_VACIOS: Catalogos = { objetivos: [], vigiladores: [], secciones: [], checklist: [], ajustes: [], observaciones: [] };

interface SessionCtx {
  listo: boolean;
  apiUrl: string;
  token: string | null;
  usuario: Usuario | null;
  catalogos: Catalogos;
  online: boolean;
  pendientes: outbox.Pendiente[];
  sincronizando: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  sincronizarAhora: () => Promise<void>;
  refrescarPendientes: () => Promise<void>;
  /** Pide la clave nueva: "pendiente" hasta que Dirección apruebe; "aprobada" si es el dueño. */
  pedirCambioClave: (actual: string, nueva: string) => Promise<"pendiente" | "aprobada">;
}

export interface PedidoClave { id: number; nombre: string; username: string; rol: string; creada_en: string }

const Ctx = createContext<SessionCtx | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const apiUrl = API_URL;
  const [listo, setListo] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [catalogos, setCatalogos] = useState<Catalogos>(CATALOGOS_VACIOS);
  const [online, setOnline] = useState(true);
  const [pendientes, setPendientes] = useState<outbox.Pendiente[]>([]);
  const [sincronizando, setSincronizando] = useState(false);

  // Restaurar sesión guardada y los catálogos de la última vez
  useEffect(() => {
    (async () => {
      try {
        const [t, us] = await Promise.all([SecureStore.getItemAsync(K_TOKEN), SecureStore.getItemAsync(K_USER)]);
        if (t) setToken(t);
        if (us) setUsuario(JSON.parse(us));
      } catch {
        // Llavero no disponible: arrancamos sin sesión, no bloqueamos la app.
      }
      const cache = await outbox.leerCache<Catalogos>(K_CATALOGOS).catch(() => null);
      if (cache) setCatalogos(cache);
      setPendientes(await outbox.listar().catch(() => []));
      setListo(true);
    })();
  }, []);

  useEffect(() => NetInfo.addEventListener(s => setOnline(s.isConnected !== false && s.isInternetReachable !== false)), []);

  // Catálogos: se cargan al tener token (el endpoint requiere auth) y al volver la señal.
  useEffect(() => {
    if (!token || !online) return;
    apiFetch<any>(apiUrl, "/api/inicializar", { token })
      .then(d => {
        const c: Catalogos = {
          objetivos: d.objetivos, vigiladores: d.vigiladores, secciones: d.secciones,
          checklist: d.checklist, ajustes: d.ajustes, observaciones: d.observaciones,
        };
        setCatalogos(c);
        outbox.guardarCache(K_CATALOGOS, c).catch(() => {});
      })
      .catch(() => { /* sin red: seguimos con lo último que haya */ });
  }, [apiUrl, token, online]);

  const refrescarPendientes = useCallback(async () => {
    setPendientes(await outbox.listar().catch(() => []));
  }, []);

  const syncRef = useRef(false);
  const sincronizarAhora = useCallback(async () => {
    // Hace falta sesión: las actas esperan en la cola (SQLite) hasta el próximo ingreso.
    if (syncRef.current || !online || !token) return;
    const lista = await outbox.listar().catch(() => []);
    if (!lista.length) return;
    syncRef.current = true;
    setSincronizando(true);
    try {
      await outbox.sincronizar(apiUrl, token);
    } finally {
      syncRef.current = false;
      setSincronizando(false);
      await refrescarPendientes();
    }
  }, [online, apiUrl, token, refrescarPendientes]);

  // Reintento automático: al volver la red y cada 60 segundos (PRD §10).
  useEffect(() => {
    if (online) sincronizarAhora();
    const t = setInterval(() => { if (online) sincronizarAhora(); }, 60000);
    return () => clearInterval(t);
  }, [online, sincronizarAhora]);

  const login = useCallback(async (username: string, password: string) => {
    const u = username.trim().toLowerCase();
    if (!u || !password) throw new ApiError("Ingresá usuario y contraseña.");
    const d = await apiFetch<any>(apiUrl, "/api/login", { method: "POST", body: { username: u, password } });
    setToken(d.token);
    setUsuario(d.usuario);
    // El llavero del sistema puede tardar ~1 s (keystore): se guarda en segundo plano
    // para que el supervisor entre apenas se validan las credenciales.
    SecureStore.setItemAsync(K_USER, JSON.stringify(d.usuario)).catch(() => {});
    SecureStore.setItemAsync(K_TOKEN, d.token).catch(() => {});
  }, [apiUrl]);

  const logout = useCallback(async () => {
    setToken(null);
    setUsuario(null);
    await Promise.all([SecureStore.deleteItemAsync(K_TOKEN), SecureStore.deleteItemAsync(K_USER)]).catch(() => {});
  }, []);

  const pedirCambioClave = useCallback(async (actual: string, nueva: string) => {
    const d = await apiFetch<any>(apiUrl, "/api/cuenta/clave", { method: "POST", token, body: { clave_actual: actual, clave_nueva: nueva } });
    return d.estado as "pendiente" | "aprobada";
  }, [apiUrl, token]);

  const value = useMemo<SessionCtx>(() => ({
    listo, apiUrl, token, usuario, catalogos, online, pendientes, sincronizando,
    login, logout, sincronizarAhora, refrescarPendientes, pedirCambioClave,
  }), [listo, apiUrl, token, usuario, catalogos, online, pendientes, sincronizando,
    login, logout, sincronizarAhora, refrescarPendientes, pedirCambioClave]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSession() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useSession fuera de SessionProvider");
  return c;
}
