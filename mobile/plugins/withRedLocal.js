/* Config plugin: permite HTTP sin cifrar SOLO hacia los hosts de desarrollo
   (emulador y la propia máquina) y hacia la red Tailscale (*.ts.net), cuyo túnel
   WireGuard ya cifra el tráfico. Todo lo demás exige HTTPS, igual que la regla
   de android/app/src/main/res/xml/network_security_config.xml en la APK Capacitor.
   Se genera en cada `expo prebuild` — no editar mobile/android/ a mano. */
const { withAndroidManifest, withDangerousMod } = require("expo/config-plugins");
const fs = require("fs");
const path = require("path");

const XML = `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
  <domain-config cleartextTrafficPermitted="true">
    <domain includeSubdomains="false">10.0.2.2</domain>
    <domain includeSubdomains="false">localhost</domain>
    <domain includeSubdomains="false">127.0.0.1</domain>
    <domain includeSubdomains="true">ts.net</domain>
  </domain-config>
</network-security-config>
`;

module.exports = function withRedLocal(config) {
  config = withDangerousMod(config, ["android", async cfg => {
    const dir = path.join(cfg.modRequest.platformProjectRoot, "app", "src", "main", "res", "xml");
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "network_security_config.xml"), XML);
    return cfg;
  }]);
  return withAndroidManifest(config, cfg => {
    const app = cfg.modResults.manifest.application[0];
    app.$["android:networkSecurityConfig"] = "@xml/network_security_config";
    return cfg;
  });
};
