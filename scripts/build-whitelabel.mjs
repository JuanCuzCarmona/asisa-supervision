import fs from "node:fs";
import path from "node:path";

// Genera una webapp comercial independiente a partir de la fuente web actual.
// La API se configura de forma explícita para impedir el acceso accidental a ASI.
const root = path.resolve(import.meta.dirname, "..");
const output = path.join(root, "whitelabel-dist");
const name = (process.env.WL_NAME || "Sistema de Supervisión").trim();
const shortName = (process.env.WL_SHORT_NAME || "Supervisión").trim();
const primary = process.env.WL_COLOR || "#175B75";
const apiUrl = (process.env.WL_API_URL || "").trim().replace(/\/$/, "");

if (!name || !shortName || /[<>]/.test(name + shortName)) throw new Error("Nombre de marca inválido");
if (!/^#[0-9a-f]{6}$/i.test(primary)) throw new Error("WL_COLOR debe ser un color hexadecimal de 6 dígitos");
if (apiUrl && !/^https:\/\//.test(apiUrl) && !/^http:\/\/localhost(?::\d+)?$/.test(apiUrl)) {
  throw new Error("WL_API_URL debe ser HTTPS o localhost");
}
if (/api-production-9e460\.up\.railway\.app|argentinaseguridad|asi-supervision/i.test(apiUrl)) {
  throw new Error("La API comercial debe ser independiente de ASI");
}

const escapeXml = value => value.replace(/[&"']/g, c => ({ "&":"&amp;", '"':"&quot;", "'":"&apos;" }[c]));
const emblem = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><rect width="128" height="128" rx="27" fill="${primary}"/><path d="M64 20 100 34v28c0 23-14 40-36 48C42 102 28 85 28 62V34Z" fill="none" stroke="white" stroke-width="7"/><path d="m46 64 12 12 25-28" fill="none" stroke="white" stroke-linecap="round" stroke-linejoin="round" stroke-width="8"/></svg>`;
const lockup = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 370 72"><rect width="72" height="72" rx="16" fill="${primary}"/><path d="M36 13 57 21v17c0 14-8 23-21 29C23 61 15 52 15 38V21Z" fill="none" stroke="white" stroke-width="4"/><path d="m25 37 8 8 14-16" fill="none" stroke="white" stroke-linecap="round" stroke-linejoin="round" stroke-width="5"/><text x="91" y="44" fill="${primary}" font-size="25" font-weight="700" font-family="Arial,sans-serif">${escapeXml(name)}</text></svg>`;
const uri = svg => `data:image/svg+xml,${encodeURIComponent(svg)}`;

let html = fs.readFileSync(path.join(root, "asi_prototype.html"), "utf8");
function replaceOnce(pattern, replacement, label) {
  const next = html.replace(pattern, replacement);
  if (next === html) throw new Error(`No se encontró ${label}; revisar la fuente web`);
  html = next;
}

replaceOnce(/\/\* Logo oficial de ASI[\s\S]*?const EMBLEMA_ASI = "data:image\/png;base64,[^"]+";/,
  `/* Marca comercial configurable */\nconst LOGO_WL = ${JSON.stringify(uri(lockup))};\nconst EMBLEMA_WL = ${JSON.stringify(uri(emblem))};`, "logos embebidos");
replaceOnce(/<meta name="asi-api-url" content="[^"]*" \/>/,
  `<meta name="wl-api-url" content="${escapeXml(apiUrl)}" />`, "URL de API");
replaceOnce(/<meta name="apple-mobile-web-app-title" content="ASI" \/>/,
  `<meta name="apple-mobile-web-app-title" content="${escapeXml(shortName)}" />`, "título móvil");
replaceOnce(/<!-- Favicon: emblema de ASI[\s\S]*?<link rel="icon" type="image\/png" sizes="64x64" href="data:image\/png;base64,[^"]+" \/>/,
  '', "favicon embebido de la marca original");
replaceOnce(/<title>ASI · Argentina Seguridad Integral<\/title>/,
  `<title>${escapeXml(name)}</title>`, "título web");
const localScripts = [
  ["https://unpkg.com/react@18/umd/react.production.min.js", "vendor/react.production.min.js"],
  ["https://unpkg.com/react-dom@18/umd/react-dom.production.min.js", "vendor/react-dom.production.min.js"],
  ["https://unpkg.com/@babel/standalone/babel.min.js", "vendor/babel.min.js"],
  ["https://cdn.tailwindcss.com", "vendor/tailwindcss.js"],
];
for (const [remote, local] of localScripts) replaceOnce(remote, local, remote);
replaceOnce(/<link rel="apple-touch-icon" href="apple-touch-icon.png" \/>/,
  '<link rel="icon" href="icon.svg" type="image/svg+xml" />', "ícono web");
if (!apiUrl) {
  replaceOnce(/<\/head>/, '<script src="demo.js"></script>\n</head>', "carga de demostración");
}

html = html.replaceAll("LOGO_ASI", "LOGO_WL").replaceAll("EMBLEMA_ASI", "EMBLEMA_WL");
html = html.replaceAll("Argentina Seguridad Integral", name);
html = html.replaceAll("ASI · Sistema de Supervisión v3.0", name);
html = html.replaceAll("ASI · Sistema de Supervisión", name);
html = html.replaceAll("Conexión cifrada · ASI v3.0", "Acceso seguro · " + name);
html = html.replaceAll('alt="ASI"', `alt="${escapeXml(name)}"`);
html = html.replaceAll('"asi_offline_queue"', '"wl_offline_queue"');
html = html.replaceAll('"asi_catalogos"', '"wl_catalogos"');
html = html.replaceAll('meta[name="asi-api-url"]', 'meta[name="wl-api-url"]');
html = html.replaceAll('meta[name=asi-api-url]', 'meta[name=wl-api-url]');
html = html.replace(/const local = new URLSearchParams\(window.location.search\).get\("api"\);/, 'const local = null;');
html = html.replace('<!-- Servidor de la API (Railway). En desarrollo: ?api=http://localhost:3000 -->', '<!-- API comercial independiente, configurada al compilar. -->');
html = html.replace(/\/\* Servidor de la API: el de producción viene en <meta name="asi-api-url">\.\n   Para desarrollo local se puede apuntar a otro con \?api=http:\/\/localhost:3000\. \*\//,
  '/* Servidor comercial independiente, configurado al compilar. */');

// El tema se adapta sin reescribir los estilos funcionales del producto.
html = html.replaceAll("#16256E", primary).replaceAll("#1F327C", primary)
  .replaceAll("#2152A1", primary).replaceAll("#0A1233", primary);

if (!apiUrl) {
  replaceOnce(/const API_URL = \(\(\) => \{[\s\S]*?\}\)\(\);/,
    'const API_URL = "";\nconst DEMO_MODE = true;', "configuración de API");
  replaceOnce(/const apiFetch = useCallback\(\(path, opts = \{\}\) => \{/, 
    'const apiFetch = useCallback((path, opts = {}) => {\n    if (DEMO_MODE) return window.whitelabelDemoFetch(path, opts);', "cliente de API");
  replaceOnce(/const conectarApi = useCallback\(async \(\) => \{/, 
    'const conectarApi = useCallback(async () => {\n    if (DEMO_MODE) { setApiStatus("connected"); return true; }', "conexión a API");
  replaceOnce(/(function LoginScreen\(\) \{[\s\S]*?const \[err,\s+setErr\]\s+= useState\(null\);)/,
    '$1\n  const demoEntrar = rol => { setApiToken("demo"); setCurrentUser({ id: rol === "supervisor" ? 1 : rol === "admin" ? 2 : 3, rol, nombre: rol === "supervisor" ? "Marina López" : rol === "admin" ? "Administración Demo" : "Dirección Demo" }); };', "acceso de demostración");
  replaceOnce(/<div className="mt-11">\n          <h1 className="text-\[30px\]/,
    '<div className="mt-11">\n          <div className="bg-white border border-line rounded-[14px] p-4 mb-5"><p className="text-sm font-semibold text-ink mb-3">Explorá la demostración</p><div className="flex flex-wrap gap-2">{[["supervisor","Supervisión"],["admin","Administración"],["dueno","Dirección"]].map(([rol, texto]) => <button key={rol} type="button" onClick={() => demoEntrar(rol)} className="rounded-lg bg-brand-50 px-3 py-2 text-sm font-semibold text-ink focus-ring">{texto}</button>)}</div><p className="text-xs text-ink-mute mt-3">Datos ficticios · Los cambios se reinician al recargar</p></div>\n          <h1 className="text-[30px]', "selector de roles");
  replaceOnce(/<p className="mt-2 mb-5 text-\[16px\] text-ink-mute">Ingresá con tu usuario corporativo\.<\/p>/,
    '<p className="mt-2 mb-5 text-[16px] text-ink-mute">Seleccioná un rol para probar la app.</p>', "texto de acceso");
  replaceOnce(/\{\/\* Acceso agrupado \*\/\}[\s\S]*?<\/Btn>/,
    '', "formulario de credenciales en demo");
  replaceOnce(/<h1 className="text-\[30px\] leading-\[1\.1\] font-semibold tracking-\[-0\.01em\] text-ink">Iniciar sesión<\/h1>/,
    '<h1 className="text-[30px] leading-[1.1] font-semibold tracking-[-0.01em] text-ink">Elegí una vista</h1>', "título de acceso demo");
  replaceOnce(/const \{ coords, error: gpsErr, reintentar \} = useDeviceGeolocation\(\);/,
    'const [demoRemota, setDemoRemota] = useState(false);\n  const coords = useMemo(() => rd.objetivo ? { lat: rd.objetivo.lat + (demoRemota ? 0.2 : 0), lng: rd.objetivo.lng, accuracy: 10 } : null, [rd.objetivo?.id, demoRemota]);\n  const gpsErr = null;\n  const reintentar = () => {};', "GPS de demostración");
  replaceOnce(/<SH title="Inicio de ronda" sub="Elegí el objetivo y validá tu presencia en el lugar" \/>/,
    '<SH title="Inicio de ronda" sub="Elegí un objetivo para recorrer la demostración" />\n      <div className="bg-brand-50 rounded-xl px-4 py-3 text-sm text-ink"><p className="font-semibold">Ubicación simulada</p><p>Esta demo no solicita tu GPS.</p><button type="button" onClick={() => setDemoRemota(v => !v)} className="mt-2 underline focus-ring">{demoRemota ? "Simular dentro del objetivo" : "Simular fuera del objetivo"}</button></div>', "aviso de GPS simulado");
  html = html.replace('>En línea</span>', '>Modo demo</span>');
  html = html.replaceAll(`Acceso seguro · ${name}`, 'Demostración · datos ficticios');
}
html = html.replaceAll('Rondas mensuales · azul institucional', 'Rondas mensuales');

// Una compilación comercial no debe llevar referencias, imágenes o servidor de ASI.
if (/Argentina Seguridad Integral|api-production-9e460|argentinaseguridad|asi-api-url|\?api=|data:image\/png;base64|\bASI\b/.test(html)) {
  throw new Error("Quedan referencias de marca o producción en el HTML generado");
}

fs.mkdirSync(output, { recursive: true });
fs.mkdirSync(path.join(output, "vendor"), { recursive: true });
for (const [, local] of localScripts) {
  const filename = path.basename(local);
  fs.copyFileSync(path.join(root, "assets", "vendor", "whitelabel", filename), path.join(output, "vendor", filename));
}
fs.writeFileSync(path.join(output, "index.html"), html);
fs.writeFileSync(path.join(output, "icon.svg"), emblem);
if (!apiUrl) fs.copyFileSync(path.join(root, "scripts", "whitelabel-demo.js"), path.join(output, "demo.js"));
else if (fs.existsSync(path.join(output, "demo.js"))) fs.unlinkSync(path.join(output, "demo.js"));
if (!apiUrl) {
  // Archivo único para abrir con file:// cuando localhost no está disponible.
  let portable = html;
  for (const [, local] of localScripts) {
    const filename = path.basename(local);
    const source = fs.readFileSync(path.join(root, "assets", "vendor", "whitelabel", filename), "utf8");
    if (/<\/script/i.test(source)) throw new Error(`No se puede insertar ${filename} en HTML`);
    const tag = new RegExp(`<script src="${local.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"(?: crossorigin)?><\\/script>`);
    const next = portable.replace(tag, () => `<script>\n${source}\n</script>`);
    if (next === portable) throw new Error(`Falta ${local} en HTML portable`);
    portable = next;
  }
  const demoSource = fs.readFileSync(path.join(root, "scripts", "whitelabel-demo.js"), "utf8");
  portable = portable.replace('<script src="demo.js"></script>', () => `<script>\n${demoSource}\n</script>`);
  portable = portable.replace(/  <link rel="manifest" href="manifest.webmanifest" \/>\n/, "");
  portable = portable.replace('href="icon.svg"', `href="${uri(emblem)}"`);
  portable = portable.replace(/  <link href="https:\/\/fonts\.googleapis\.com\/css2\?[^\n]+\n/, "");
  fs.writeFileSync(path.join(output, "demo-portable.html"), portable);
}
fs.writeFileSync(path.join(output, "manifest.webmanifest"), JSON.stringify({
  name, short_name: shortName, start_url: "/", display: "standalone",
  background_color: "#F4F6FA", theme_color: primary, lang: "es-AR",
  icons: [{ src: "icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any maskable" }],
}, null, 2));
fs.writeFileSync(path.join(output, "_headers"), "/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  X-Frame-Options: SAMEORIGIN\n/index.html\n  Cache-Control: no-cache\n");
console.log(`whitelabel-dist listo: ${name}${apiUrl ? ` · API ${apiUrl}` : " · modo demostración"}`);
