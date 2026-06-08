/**
 * Export B402 private key as a single-line B402_PRIVATE_KEY_B64 value for production secrets.
 * Does not print the key — writes api/.keys/b402_private.b64.txt (gitignored).
 *
 * Usage: cd api && node --env-file=.env scripts/exportB402PrivateKeyB64.js
 */
import crypto from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import {
  DEFAULT_B402_PRIVATE_KEY_FILE,
  loadPrivateKeyPemFromEnv,
  resolveB402PrivateKeyFilePath,
} from "../libs/b402KeyMaterial.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

function loadPem() {
  const fromEnv = loadPrivateKeyPemFromEnv();
  if (fromEnv) return fromEnv;
  const keyPath = resolveB402PrivateKeyFilePath();
  if (existsSync(keyPath)) {
    const pem = readFileSync(keyPath, "utf8").trim();
    if (pem.includes("BEGIN")) return pem;
  }
  if (existsSync(DEFAULT_B402_PRIVATE_KEY_FILE)) {
    const pem = readFileSync(DEFAULT_B402_PRIVATE_KEY_FILE, "utf8").trim();
    if (pem.includes("BEGIN")) return pem;
  }
  return null;
}

const pem = loadPem();
if (!pem) {
  console.error("No B402 private key found. Set B402_PRIVATE_KEY_PEM/B64 or place api/.keys/b402_private.pem");
  process.exit(1);
}

const bits = crypto.createPrivateKey(pem).asymmetricKeyDetails?.modulusLength ?? null;
if (bits !== 1024) {
  console.error(`B402 requires a 1024-bit RSA key; found ${bits ?? "unknown"}-bit`);
  process.exit(1);
}

const b64 = crypto.createPrivateKey(pem).export({ format: "der", type: "pkcs8" }).toString("base64");
const outPath = path.resolve(__dirname, "../.keys/b402_private.b64.txt");
writeFileSync(outPath, b64, "utf8");

console.log("OK: wrote base64 PKCS#8 to api/.keys/b402_private.b64.txt");
console.log("Add to production API secrets:");
console.log("  B402_PRIVATE_KEY_B64=<contents of that file>");
console.log("Then restart the API and verify GET https://api.syraa.fun/x402/capabilities shows binance: true");
