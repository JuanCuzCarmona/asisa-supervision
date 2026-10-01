/* Config plugin: firma única de ASI + versionCode automático en el build.gradle generado.
   La clave se lee de ~/.gradle/gradle.properties (ASI_STORE_FILE, ASI_STORE_PASSWORD,
   ASI_KEY_ALIAS, ASI_KEY_PASSWORD) — nunca del repo. Con la misma clave en todas las
   computadoras, cada APK nueva actualiza a la instalada sin el error de "versión anterior".
   Si la máquina no tiene la clave, se usa la de debug de React Native, como antes.
   Se aplica en cada `expo prebuild` — no editar mobile/android/ a mano. */
const { withAppBuildGradle } = require("expo/config-plugins");

const MARCA = "// [ASI] firma única";

const CABECERA = `${MARCA}
def firmaAsi = project.hasProperty('ASI_STORE_FILE') && file(project.property('ASI_STORE_FILE')).exists()
// versionCode automático: minutos desde el 01/01/2026 — siempre crece, así Android trata
// cada compilación como actualización de la anterior.
def versionAutomatica = (int) ((System.currentTimeMillis() - java.time.LocalDate.of(2026, 1, 1).atStartOfDay(java.time.ZoneOffset.UTC).toInstant().toEpochMilli()) / 60000)
`;

const CONFIG_ASI = `
        if (firmaAsi) {
            asi {
                storeFile file(project.property('ASI_STORE_FILE'))
                storePassword project.property('ASI_STORE_PASSWORD')
                keyAlias project.property('ASI_KEY_ALIAS')
                keyPassword project.property('ASI_KEY_PASSWORD')
            }
        }`;

function reemplazar(src, buscar, poner, nombre) {
  if (!buscar.test(src)) throw new Error(`withFirmaAsi: no encontré ${nombre} en app/build.gradle (¿cambió la plantilla de Expo?)`);
  return src.replace(buscar, poner);
}

module.exports = function withFirmaAsi(config) {
  return withAppBuildGradle(config, cfg => {
    let g = cfg.modResults.contents;
    if (g.includes(MARCA)) return cfg;
    g = reemplazar(g, /^android \{/m, `${CABECERA}\nandroid {`, "el bloque android");
    g = reemplazar(g, /versionCode \d+/, "versionCode versionAutomatica", "versionCode");
    g = reemplazar(g, /signingConfigs \{\n(\s+)debug \{/, m => m.replace("signingConfigs {", `signingConfigs {${CONFIG_ASI}`), "signingConfigs");
    // debug y release firman con la clave de ASI cuando está disponible
    g = g.replace(/(\n\s+)signingConfig signingConfigs\.debug/g, "$1signingConfig firmaAsi ? signingConfigs.asi : signingConfigs.debug");
    cfg.modResults.contents = g;
    return cfg;
  });
};
