/* Config plugin: ajustes de Gradle para compilar en una Mac de 8 GB sin que el
   sistema pagine. Con 2 GB de heap / 512 MB de Metaspace Gradle se quedaba sin
   memoria y con ~8 clang en paralelo la máquina swapeaba (compilación de >40 min).
   Se aplica en cada `expo prebuild` — no editar mobile/android/ a mano. */
const { withGradleProperties } = require("expo/config-plugins");

const PROPS = {
  "org.gradle.jvmargs": "-Xmx3g -XX:MaxMetaspaceSize=1g -XX:+HeapDumpOnOutOfMemoryError -Dfile.encoding=UTF-8",
  "org.gradle.parallel": "true",
  "org.gradle.caching": "true",
  "org.gradle.workers.max": "4",
};

module.exports = function withGradleSpeed(config) {
  return withGradleProperties(config, cfg => {
    for (const [key, value] of Object.entries(PROPS)) {
      cfg.modResults = cfg.modResults.filter(p => !(p.type === "property" && p.key === key));
      cfg.modResults.push({ type: "property", key, value });
    }
    return cfg;
  });
};
