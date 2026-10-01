/* Sesión y datos compartidos de la app: servidor, token (en el llavero seguro del
   sistema, nunca en texto plano), catálogos, conectividad y cola offline.
   Igual que la web: sin servidor configurado la app funciona en modo demo con
   los SEED_*, y pasa a datos reales en cuanto se conecta a la API. */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import * as SecureStore from "expo-secure-store";
import NetInfo from "@react-native-community/netinfo";
import { apiFetch, ApiError } from "../api";
import * as outbox from "./outbox";
import {
  SEED_AJUSTES, SEED_CHECKLIST, SEED_OBJETIVOS, SEED_OBSERVACIONES, SEED_SECCIONES, SEED_TICKETS, SEED_VIGILADORES,
} from "../data/seed";
import type { Catalogos, Ticket, Usuario } from "../types";

const K_URL = "asi_api_url";
const K_TOKEN = "asi_token";
const K_USER = "asi_usuario";

export const DEMO_CRED: Record<string, { password: string; usuario: Usuario }> = {
  supervisor: { password: "supervisor123", usuario: { id: 0, nombre: "María González", rol: "supervisor" } },
  admin: { password: "admin123", usuario: { id: 0, nombre: "Roberto Valente", rol: "admin" } },
  dueno: { password: "dueno123", usuario: { id: 0, nombre: "Gerencia General", rol: "dueno" } },
};

const CATALOGOS_DEMO: Catalogos = {
  objetivos: SEED_OBJETIVOS,
  vigiladores: SEED_VIGILADORES,
  secciones: SEED_SECCIONES,
  checklist: SEED_CHECKLIST,
  ajustes: SEED_AJUSTES,
  observaciones: SEED_OBSERVACIONES,
};

const TICKETS_DEMO: Ticket[] = (SEED_TICKETS as any[]).map(t => ({
  id: t.id, objetivo: t.obj, supervisor: t.sup, valoracion: t.val, area: t.area,
  estado: t.estado === "Activo" ? "Activa" : "Cerrada", descripcion: t.desc, item: t.item,
  vigilador: t.vig, fecha: t.fecha, resolucion: t.resolucion ?? null,
}));

interface SessionCtx {
  listo: boolean;
  apiUrl: string | null;
  token: string | null;
  usuario: Usuario | null;
  catalogos: Catalogos;
  online: boolean;
  sinConexionForzada: boolean;
  pendientes: outbox.Pendiente[];
  sincronizando: boolean;
  ticketsDemo: Ticket[];
  visitasDemo: Record<number, number>;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setApiUrl: (url: string | null) => Promise<void>;
  setSinConexionForzada: (v: boolean) => void;
  sincronizarAhora: () => Promise<void>;
  refrescarPendientes: () => Promise<void>;
  registrarActaDemo: (objetivoId: number, tickets: Ticket[]) => void;
  cerrarTicketDemo: (id: string, resolucion: string) => void;
}

const Ctx = createContext<SessionCtx | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [listo, setListo] = useState(false);
  const [apiUrl, setApiUrlState] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [catalogos, setCatalogos] = useState<Catalogos>(CATALOGOS_DEMO);
  const [redOk, setRedOk] = useState(true);
  const [sinConexionForzada, setSinConexionForzada] = useState(false);
  const [pendientes, setPendientes] = useState<outbox.Pendiente[]>([]);
  const [sincronizando, setSincronizando] = useState(false);
  const [ticketsDemo, setTicketsDemo] = useState<Ticket[]>(TICKETS_DEMO);
  const [visitasDemo, setVisitasDemo] = useState<Record<number, number>>({});

  const online = redOk && !sinConexionForzada;

  // Restaurar sesión guardada
  useEffect(() => {
    (async () => {
      try {
        const [u, t, us] = await Promise.all([
          SecureStore.getItemAsync(K_URL), SecureStore.getItemAsync(K_TOKEN), SecureStore.getItemAsync(K_USER),
        ]);
        if (u) setApiUrlState(u);
        if (t) setToken(t);
        if (us) setUsuario(JSON.parse(us));
      } catch {
        // Llavero no disponible: arrancamos sin sesión, no bloqueamos la app.
      }
      setPendientes(await outbox.listar().catch(() => []));
      setListo(true);
    })();
  }, []);

  useEffect(() => NetInfo.addEventListener(s => setRedOk(s.isConnected !== false && s.isInternetReachable !== false)), []);

  // Catálogos reales: se cargan al tener token (el endpoint requiere auth), igual que la web.
  useEffect(() => {
    if (!apiUrl || !token) { setCatalogos(CATALOGOS_DEMO); return; }
    apiFetch<any>(apiUrl, "/api/inicializar", { token })
      .then(d => setCatalogos({
        objetivos: d.objetivos, vigiladores: d.vigiladores, secciones: d.secciones,
        checklist: d.checklist, ajustes: d.ajustes, observaciones: d.observaciones,
      }))
      .catch(() => { /* sin red: seguimos con lo último que haya */ });
  }, [apiUrl, token]);

  const refrescarPendientes = useCallback(async () => {
    setPendientes(await outbox.listar().catch(() => []));
  }, []);

  const syncRef = useRef(false);
  const sincronizarAhora = useCallback(async () => {
    if (syncRef.current || !online) return;
    const lista = await outbox.listar().catch(() => []);
    if (!lista.length) return;
    syncRef.current = true;
    setSincronizando(true);
    try {
      if (apiUrl) await outbox.sincronizar(apiUrl, token);
      else {
        // Modo demo: no hay servidor al que enviar, así que las actas se dan por recibidas.
        await new Promise(r => setTimeout(r, 1200));
        for (const p of lista) await outbox.descartar(p.id);
      }
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
    let sesion: { token: string | null; usuario: Usuario };
    if (apiUrl) {
      const d = await apiFetch<any>(apiUrl, "/api/login", { method: "POST", body: { username: u, password } });
      sesion = { token: d.token, usuario: d.usuario };
    } else {
      await new Promise(r => setTimeout(r, 450));
      const m = DEMO_CRED[u];
      if (!m || m.password !== password) throw new ApiError("Usuario o contraseña incorrectos.");
      sesion = { token: null, usuario: m.usuario };
    }
    setToken(sesion.token);
    setUsuario(sesion.usuario);
    // El llavero del sistema puede tardar ~1 s (keystore): se guarda en segundo plano
    // para que el supervisor entre apenas se validan las credenciales.
    SecureStore.setItemAsync(K_USER, JSON.stringify(sesion.usuario)).catch(() => {});
    if (sesion.token) SecureStore.setItemAsync(K_TOKEN, sesion.token).catch(() => {});
  }, [apiUrl]);

  const logout = useCallback(async () => {
    setToken(null);
    setUsuario(null);
    await Promise.all([SecureStore.deleteItemAsync(K_TOKEN), SecureStore.deleteItemAsync(K_USER)]).catch(() => {});
  }, []);

  const setApiUrl = useCallback(async (url: string | null) => {
    const limpio = url?.trim().replace(/\/+$/, "") || null;
    setApiUrlState(limpio);
    await logout();
    if (limpio) await SecureStore.setItemAsync(K_URL, limpio).catch(() => {});
    else await SecureStore.deleteItemAsync(K_URL).catch(() => {});
  }, [logout]);

  const registrarActaDemo = useCallback((objetivoId: number, tickets: Ticket[]) => {
    setVisitasDemo(v => ({ ...v, [objetivoId]: (v[objetivoId] || 0) + 1 }));
    setTicketsDemo(ts => [...tickets, ...ts]);
  }, []);

  const cerrarTicketDemo = useCallback((id: string, resolucion: string) => {
    setTicketsDemo(ts => ts.map(t => (t.id === id ? { ...t, estado: "Cerrada", resolucion } : t)));
  }, []);

  const value = useMemo<SessionCtx>(() => ({
    listo, apiUrl, token, usuario, catalogos, online, sinConexionForzada, pendientes, sincronizando,
    ticketsDemo, visitasDemo, login, logout, setApiUrl, setSinConexionForzada, sincronizarAhora,
    refrescarPendientes, registrarActaDemo, cerrarTicketDemo,
  }), [listo, apiUrl, token, usuario, catalogos, online, sinConexionForzada, pendientes, sincronizando,
    ticketsDemo, visitasDemo, login, logout, setApiUrl, sincronizarAhora, refrescarPendientes,
    registrarActaDemo, cerrarTicketDemo]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSession() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useSession fuera de SessionProvider");
  return c;
}
