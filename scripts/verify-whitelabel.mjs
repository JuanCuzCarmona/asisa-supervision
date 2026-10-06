import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const Babel = require("../assets/vendor/whitelabel/babel.min.js");
const React = {
  Fragment: Symbol("Fragment"),
  createElement: (type, props, ...children) => ({ type, props: { ...props, children } }),
  createContext: () => ({ _value: null }),
  useState: initial => [typeof initial === "function" ? initial() : initial, () => {}],
  useEffect: () => {},
  useRef: value => ({ current: value }),
  useMemo: callback => callback(),
  useCallback: callback => callback,
  useContext: context => context._value,
};
const root = path.resolve(import.meta.dirname, "..");
const html = fs.readFileSync(path.join(root, "whitelabel-dist/index.html"), "utf8");
const jsx = html.match(/<script type="text\/babel">([\s\S]*?)<\/script>/)?.[1];
assert.ok(jsx, "Falta el código de la app");

const compiled = Babel.transform(jsx, { presets: ["react"] }).code;

const location = { origin: "http://localhost", search: "" };
const context = vm.createContext({
  React, ReactDOM: { createRoot: () => ({ render: () => {} }) },
  Response, URL, URLSearchParams, console, setTimeout, clearTimeout, setInterval, clearInterval,
  location, navigator: { onLine: true }, localStorage: { getItem: () => null, setItem: () => {} },
  document: { getElementById: () => ({}) },
  window: { location, matchMedia: () => ({ matches: false }), addEventListener: () => {}, removeEventListener: () => {} },
});
context.window.window = context.window;
vm.runInContext(fs.readFileSync(path.join(root, "whitelabel-dist/demo.js"), "utf8"), context);
vm.runInContext(compiled + "\nglobalThis.components = { AppContext, LoginScreen, Step1, SupervisorPanel, AdminPanel, OwnerPanel };", context);

const { AppContext, LoginScreen, Step1, SupervisorPanel, AdminPanel, OwnerPanel } = context.components;
const base = {
  apiStatus: "connected", apiError: null, apiFetch: context.window.whitelabelDemoFetch,
  conectarApi: async () => true, setCurrentUser: () => {}, setApiToken: () => {},
  cerrarSesion: () => {}, offline: false, queue: [], syncing: false, online: true,
  objetivos: [], vigiladores: [], secciones: [], checklistDefs: [], ajustes: [], observaciones: [],
  visitasPorObj: {}, currentUser: null,
};
function render(Component, value, props = {}) {
  AppContext._value = value;
  const visit = node => {
    if (node == null || typeof node === "boolean") return "";
    if (Array.isArray(node)) return node.map(visit).join("");
    if (typeof node !== "object") return String(node);
    if (typeof node.type === "function") return visit(node.type(node.props));
    return `<${String(node.type)}>${visit(node.props.children)}</${String(node.type)}>`;
  };
  return visit(React.createElement(Component, props));
}

const login = render(LoginScreen, base);
for (const label of ["Supervisión", "Administración", "Dirección", "Datos ficticios"]) {
  assert.ok(login.includes(label), `Falta ${label} en el acceso demo`);
}
for (const [rol, Component] of [["supervisor", SupervisorPanel], ["admin", AdminPanel], ["dueno", OwnerPanel]]) {
  const markup = render(Component, { ...base, currentUser: { id: 1, nombre: "Usuario Demo", rol } });
  assert.ok(markup.length > 100, `No se renderizó ${rol}`);
  console.log(`${rol}: render OK`);
}

const catalogo = await (await context.window.whitelabelDemoFetch("/api/inicializar")).json();
const ronda = render(Step1, { ...base, objetivos: catalogo.objetivos }, {
  rd: { objetivo: catalogo.objetivos[0] }, setRD: () => {}, onNext: () => {},
});
assert.ok(ronda.includes("Ubicación simulada"));
assert.ok(ronda.includes("Dentro del geocerco"));
console.log("ronda demo: GPS simulado OK");

for (const endpoint of ["/api/inicializar", "/api/tickets", "/api/kpis", "/api/actividad", "/api/vigilador/1001", "/api/actas/DEMO-001"]) {
  const response = await context.window.whitelabelDemoFetch(endpoint);
  assert.equal(response.ok, true, endpoint);
  assert.equal((await response.json()).ok, true, endpoint);
  console.log(`${endpoint}: datos OK`);
}

assert.doesNotMatch(html, /api-production|argentinaseguridad|Argentina Seguridad Integral|\bASI\b|\?api=/i);
console.log("Versión comercial: verificación OK");
