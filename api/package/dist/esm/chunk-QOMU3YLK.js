// src/shared/version.ts
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
function getVersion() {
  if (true) {
    return "0.14.4";
  }
  const __dirname2 = dirname(fileURLToPath(import.meta.url));
  const pkg = JSON.parse(
    readFileSync(join(__dirname2, "../../package.json"), "utf-8")
  );
  return pkg.version;
}
var MCP_VERSION = getVersion();
var DIST_TAG = MCP_VERSION.includes("-beta") ? "beta" : "latest";
function getInstallPackageSpecifier(version) {
  return version.includes("-") ? version : "latest";
}
var INSTALL_PACKAGE_SPECIFIER = getInstallPackageSpecifier(MCP_VERSION);

export {
  MCP_VERSION,
  INSTALL_PACKAGE_SPECIFIER
};
//# sourceMappingURL=chunk-QOMU3YLK.js.map