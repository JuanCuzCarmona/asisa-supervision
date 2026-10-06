import { Asset } from "expo-asset";
import { Directory, File, Paths } from "expo-file-system";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Barlow_400Regular, Barlow_600SemiBold } from "@expo-google-fonts/barlow";
import { BarlowSemiCondensed_600SemiBold } from "@expo-google-fonts/barlow-semi-condensed";
import { LOGO } from "../components/ui";
import { fechaCorta, hora } from "./formato";
import type { ActaResultado } from "../state/ronda";
import type { ItemChecklist } from "../types";

const esc = (value: unknown) => String(value ?? "—").replace(/[&<>"']/g, c =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] || c);
const fechaHora = (value: string) => `${fechaCorta(value)} · ${hora(value)}`;
const valor = { B: "Bueno", R: "Regular", M: "Malo" } as const;

export async function compartirPdfActa(resultado: ActaResultado, items: ItemChecklist[], supervisor: string) {
  const { ronda: rd } = resultado;
  const logo = await Asset.fromModule(LOGO).downloadAsync();
  if (!logo.localUri) throw new Error("No se pudo cargar el logo de ASI.");
  const logoBase64 = await new File(logo.localUri).base64();
  const fuentes = await Promise.all([Barlow_400Regular, Barlow_600SemiBold, BarlowSemiCondensed_600SemiBold]
    .map(async modulo => {
      const asset = await Asset.fromModule(modulo).downloadAsync();
      if (!asset.localUri) throw new Error("No se pudo cargar una tipografía del acta.");
      return new File(asset.localUri).base64();
    }));

  const fotos = await Promise.all(rd.fotos.map(async (foto, i) => {
    const item = items.find(it => it.id === foto.itemId);
    let imagen = "<p class='muted'>El archivo de esta foto ya no está disponible en el dispositivo.</p>";
    try { imagen = `<img class='evidencia' src='data:image/jpeg;base64,${await new File(foto.uri).base64()}' />`; } catch { /* conservar referencia */ }
    return `<div class='bloque'><div class='subtitulo'>Foto ${i + 1} · ${esc(item?.titulo_corto || "Evidencia general")}</div>
      ${imagen}<div class='detalle'>${esc(fechaHora(foto.tomadaEn))} · ${foto.lat != null && foto.lng != null ? `${foto.lat.toFixed(5)}, ${foto.lng.toFixed(5)}` : "Sin GPS"}</div></div>`;
  }));

  const filasChecklist = items.map((it, i) => {
    const r = rd.respuestas[it.id];
    return `<tr><td class='num'>${i + 1}</td><td><strong>${esc(it.titulo_corto)}</strong><div class='detalle'>${esc(it.area_responsable)} · ${esc(it.criterio_completo)}</div></td>
      <td class='valor ${r?.valoracion || ""}'>${r ? valor[r.valoracion] : "Sin evaluar"}</td></tr>
      ${r?.observacion ? `<tr class='obs'><td></td><td colspan='2'>Observación: ${esc(r.observacion.texto)} · ${esc(r.observacion.area)}</td></tr>` : ""}`;
  }).join("");

  const firmas = rd.vigiladores.map(v => {
    const firma = rd.firmas[v.id];
    const contenido = firma?.nego ? "<span class='negativa'>Negativa a firmar registrada</span>"
      : firma?.dataUrl ? `<img class='firma' src='${firma.dataUrl}' />` : "Sin firma";
    return `<div class='firma-bloque'><strong>${esc(v.nombre)}</strong><span>Legajo ${esc(v.legajo)}${v.puesto ? ` · ${esc(v.puesto)}` : ""}</span>
      ${contenido}<div class='detalle'>${firma?.hora ? esc(fechaHora(firma.hora)) : ""}</div></div>`;
  }).join("");

  const incidencias = resultado.tickets.map(t => `<tr><td>${esc(t.codigo)}</td><td>${esc(t.texto)}</td><td>${esc(t.area)}</td><td>${esc(valor[t.valoracion])}</td></tr>`).join("");
  const html = `<!doctype html><html lang='es'><head><meta charset='utf-8' /><style>
    @font-face { font-family: Barlow; src: url(data:font/ttf;base64,${fuentes[0]}); font-weight: 400; }
    @font-face { font-family: Barlow; src: url(data:font/ttf;base64,${fuentes[1]}); font-weight: 600; }
    @font-face { font-family: BarlowCondensed; src: url(data:font/ttf;base64,${fuentes[2]}); font-weight: 600; }
    @page { size: A4; margin: 40px 38px 44px; }
    * { box-sizing: border-box; } body { margin: 0; color: #16256E; font-family: Barlow, Arial, Helvetica, sans-serif; font-size: 10.5px; line-height: 1.5; }
    header { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #1F327C; padding-bottom: 16px; margin-bottom: 22px; }
    header img { width: 190px; height: auto; } .docid { text-align: right; color: #4A5578; font-size: 10px; }
    h1 { margin: 0; font-size: 22px; letter-spacing: -.3px; color: #16256E; } h2 { margin: 24px 0 9px; font-size: 14px; color: #16256E; border-bottom: 1px solid #CCD3E3; padding-bottom: 6px; }
    .kicker { color: #4A5578; font-family: BarlowCondensed, Barlow, sans-serif; font-size: 10px; text-transform: uppercase; letter-spacing: 2px; font-weight: bold; }
    .intro { margin: 4px 0 18px; color: #4A5578; } .grid { display: flex; flex-wrap: wrap; border: 1px solid #E2E6EF; border-radius: 10px; overflow: hidden; }
    .dato { width: 50%; padding: 10px 12px; border-bottom: 1px solid #EEF1F6; min-height: 48px; } .dato:nth-child(odd) { border-right: 1px solid #EEF1F6; }
    .dato .label { display: block; color: #6B7494; font-size: 9px; text-transform: uppercase; letter-spacing: 1px; } .dato strong { font-size: 11px; }
    .nota { margin-top: 10px; padding: 11px 13px; border-left: 3px solid #B45309; background: #FEF3C7; color: #4A5578; }
    table { width: 100%; border-collapse: collapse; } th { background: #EEF1F8; color: #4A5578; text-transform: uppercase; font-size: 8px; letter-spacing: 1px; text-align: left; }
    th, td { padding: 8px 9px; border-bottom: 1px solid #E2E6EF; vertical-align: top; } tr { page-break-inside: avoid; } .num { width: 28px; color: #6B7494; }
    .valor { text-align: right; font-weight: bold; white-space: nowrap; } .valor.B { color: #065F46; } .valor.R { color: #92400E; } .valor.M { color: #9F1239; }
    .obs td { padding-top: 0; color: #4A5578; font-size: 9px; } .detalle, .muted { color: #6B7494; font-size: 9px; }
    .bloque, .firma-bloque { page-break-inside: avoid; border: 1px solid #E2E6EF; border-radius: 10px; padding: 12px; margin: 0 0 10px; }
    .subtitulo { font-weight: bold; margin-bottom: 8px; } .evidencia { max-width: 100%; max-height: 350px; object-fit: contain; display: block; margin: 0 auto 6px; }
    .firma-bloque { display: inline-block; width: 48%; vertical-align: top; margin-right: 1%; min-height: 105px; }
    .firma-bloque span { display: block; color: #6B7494; } .firma { display: block; width: 100%; max-height: 68px; object-fit: contain; }
    .negativa { color: #9F1239 !important; font-weight: bold; margin: 12px 0; }
    footer { margin-top: 25px; border-top: 1px solid #CCD3E3; padding-top: 8px; color: #6B7494; font-size: 8px; }
  </style></head><body>
    <header><img src='data:image/png;base64,${logoBase64}' /><div class='docid'><span class='kicker'>Acta de supervisión</span><br/>${esc(resultado.codigo)}</div></header>
    <h1>Acta de supervisión</h1><p class='intro'>Argentina Seguridad Integral · Registro de ronda</p>
    <div class='grid'>
      <div class='dato'><span class='label'>Objetivo</span><strong>${esc(rd.objetivo?.nombre)}</strong></div>
      <div class='dato'><span class='label'>Dirección y tipo</span><strong>${esc(rd.objetivo?.direccion)} · ${esc(rd.objetivo?.tipo)}</strong></div>
      <div class='dato'><span class='label'>Supervisor</span><strong>${esc(supervisor)}</strong></div>
      <div class='dato'><span class='label'>Modalidad</span><strong>${rd.tipo === "remota" ? "Supervisión remota" : "Ronda presencial"}</strong></div>
      <div class='dato'><span class='label'>Inicio</span><strong>${rd.horaInicio ? esc(fechaHora(rd.horaInicio)) : "—"}</strong></div>
      <div class='dato'><span class='label'>Cierre</span><strong>${esc(fechaHora(resultado.fecha))}</strong></div>
      <div class='dato'><span class='label'>Geocerca</span><strong>${rd.distanciaM != null ? `${esc(rd.distanciaM)} m del objetivo · radio ${esc(rd.objetivo?.radio_geocerca_m)} m` : "Sin distancia GPS"}</strong></div>
      <div class='dato'><span class='label'>Coordenadas y precisión</span><strong>${rd.coords ? `${rd.coords.lat.toFixed(5)}, ${rd.coords.lng.toFixed(5)} · ${rd.coords.accuracy != null ? `${Math.round(rd.coords.accuracy)} m` : "precisión desconocida"}` : "Sin GPS"}</strong></div>
    </div>
    ${rd.tipo === "remota" ? `<div class='nota'><strong>Justificación de supervisión remota</strong><br/>${esc(rd.justificacion)}</div>` : ""}
    <h2>Checklist evaluado</h2><table><thead><tr><th>N.º</th><th>Punto de control</th><th>Estado</th></tr></thead><tbody>${filasChecklist}</tbody></table>
    <h2>Evidencia fotográfica · ${rd.fotos.length}</h2>${fotos.length ? fotos.join("") : "<p class='muted'>No se adjuntaron fotografías.</p>"}
    <h2>Vigiladores y firmas</h2>${firmas}
    <h2>Incidencias generadas · ${resultado.tickets.length}</h2>${incidencias ? `<table><thead><tr><th>Código</th><th>Observación</th><th>Área</th><th>Estado</th></tr></thead><tbody>${incidencias}</tbody></table>` : "<p class='muted'>Sin incidencias.</p>"}
    <footer>ASI · ${esc(resultado.codigo)} · ${resultado.estado === "encolada" ? "Pendiente de sincronización" : "Enviada a central"}. Las fotos conservan su sello original de fecha, hora, GPS y supervisor.</footer>
  </body></html>`;

  const generado = await Print.printToFileAsync({ html, width: 595, height: 842 });
  const directorio = new Directory(Paths.document, "actas");
  if (!directorio.exists) directorio.create();
  const destino = new File(directorio, `${resultado.codigo.replace(/[^a-zA-Z0-9-]/g, "-")}.pdf`);
  if (destino.exists) destino.delete();
  new File(generado.uri).copy(destino);
  if (!(await Sharing.isAvailableAsync())) throw new Error("El PDF se guardó en la app, pero este dispositivo no permite compartirlo.");
  await Sharing.shareAsync(destino.uri, { mimeType: "application/pdf", dialogTitle: "Exportar acta ASI", UTI: "com.adobe.pdf" });
}
