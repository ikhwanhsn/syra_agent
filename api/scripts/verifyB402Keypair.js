/**
 * Verify B402_PRIVATE_KEY_PEM (or B402_PRIVATE_KEY_B64) matches api/.keys/b402_public.pem.
 *
 * Usage (from repo root):
 *   node -r dotenv/config api/scripts/verifyB402Keypair.js dotenv_config_path=api/.env
 * Or set B402_PRIVATE_KEY_PEM in api/.env first, then:
 *   cd api && node --env-file=.env scripts/verifyB402Keypair.js
 */
import crypto from "node:crypto";
import { validateB402SigningKey } from "../libs/b402FacilitatorClient.js";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

function loadPrivatePem() {
  const fromFile =
    process.env.B402_PRIVATE_KEY_FILE ||
    path.resolve(__dirname, "../.keys/b402_private.pem");
  if (existsSync(fromFile)) {
    const pem = readFileSync(fromFile, "utf8").trim();
    if (pem.includes("BEGIN")) return pem;
  }
  const pem = String(process.env.B402_PRIVATE_KEY_PEM || "").trim();
  if (pem) {
    if (pem.includes("BEGIN")) return pem.includes("\\n") ? pem.replace(/\\n/g, "\n") : pem;
    try {
      const der = Buffer.from(pem.replace(/\s/g, ""), "base64");
      return crypto.createPrivateKey({ key: der, format: "der", type: "pkcs8" }).export({
        type: "pkcs8",
        format: "pem",
      });
    } catch {
      /* continue */
    }
  }
  const b64 = String(process.env.B402_PRIVATE_KEY_B64 || "").trim();
  if (!b64) return null;
  const der = Buffer.from(b64.replace(/\s/g, ""), "base64");
  return crypto.createPrivateKey({ key: der, format: "der", type: "pkcs8" }).export({
    type: "pkcs8",
    format: "pem",
  });
}

const pubPath = path.resolve(__dirname, "../.keys/b402_public.pem");
const privatePem = loadPrivatePem();
if (!privatePem) {
  console.error("Set B402_PRIVATE_KEY_PEM or B402_PRIVATE_KEY_B64 in api/.env first.");
  process.exit(1);
}

const publicPem = readFileSync(pubPath, "utf8");
const priv = crypto.createPrivateKey(privatePem);
const pub = crypto.createPublicKey(publicPem);
const derivedPub = crypto.createPublicKey(priv);

const a = derivedPub.export({ type: "spki", format: "der" });
const b = pub.export({ type: "spki", format: "der" });

if (a.equals(b)) {
  console.log("OK: private key matches api/.keys/b402_public.pem (registered with Binance).");
  const keyCheck = validateB402SigningKey();
  if (!keyCheck.ok) {
    console.error(keyCheck.error);
    process.exit(1);
  }
  console.log(`OK: RSA key is ${keyCheck.modulusBits}-bit (B402 requires 1024-bit).`);
  process.exit(0);
}

console.error("MISMATCH: private key does NOT match b402_public.pem.");
console.error("Use the private key that was generated with this public key — do not run generateB402Keypair.js unless you re-register with Binance.");
process.exit(1);
