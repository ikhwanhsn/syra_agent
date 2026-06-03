/**
 * Restore Binance-registered B402 keypair and test /supported.
 * Run: node --env-file=.env scripts/restoreB402RegisteredKey.js
 */
import crypto from "node:crypto";
import { readFileSync, existsSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { buildTeslaHeaders } from "../libs/b402FacilitatorClient.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const REGISTERED_PUBLIC_PEM = `-----BEGIN PUBLIC KEY-----
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC/LHcjkvQ8Zfr6ikWsHAkn+crN
wWohXAP01k+Reuv9oywhWcZGYiy9gXBK107RvCamXDKn3DahgLiFSpO6aXYsQxw0
Y3eAtcktoadnWdgMlqVSDi4blh44UFI/pwHP+w3Bfs/fAdwxyVl9emSCbhdq7G2E
OixgHNXu2YPvsLZgOQIDAQAB
-----END PUBLIC KEY-----`;

const keysDir = path.resolve(__dirname, "../.keys");
const publicPath = path.join(keysDir, "b402_public.pem");

const candidates = [
  process.env.B402_PRIVATE_KEY_FILE,
  path.join(process.env.USERPROFILE || "", ".syra", "qa-api-rsa", "private.pem"),
  path.join(keysDir, "b402_private.pem"),
].filter(Boolean);

const registeredPub = crypto.createPublicKey(REGISTERED_PUBLIC_PEM);

let matchedPrivate = null;
for (const p of candidates) {
  if (!existsSync(p)) continue;
  const pem = readFileSync(p, "utf8").trim();
  if (!pem.includes("BEGIN")) continue;
  try {
    const priv = crypto.createPrivateKey(pem);
    const derived = crypto.createPublicKey(priv);
    const ok = derived
      .export({ type: "spki", format: "der" })
      .equals(registeredPub.export({ type: "spki", format: "der" }));
    const bits = priv.asymmetricKeyDetails?.modulusLength;
    console.log(`[check] ${p} → ${bits}-bit, matches registered: ${ok}`);
    if (ok && bits === 1024) {
      matchedPrivate = pem;
      break;
    }
  } catch (e) {
    console.log(`[check] ${p} → error: ${e.message}`);
  }
}

writeFileSync(publicPath, `${REGISTERED_PUBLIC_PEM}\n`);

if (!matchedPrivate) {
  console.error(
    "\nNo 1024-bit private key found that matches your Binance-registered public key.\n" +
      "Place the matching private PEM at api/.keys/b402_private.pem or ~/.syra/qa-api-rsa/private.pem\n" +
      "Or register the NEW public key in api/.keys/b402_public.pem with Binance.\n"
  );
  process.exit(1);
}

const privatePath = path.join(keysDir, "b402_private.pem");
writeFileSync(privatePath, matchedPrivate, { mode: 0o600 });
console.log(`\nWrote ${publicPath}`);
console.log(`Wrote ${privatePath}`);

const body = "{}";
const base = (process.env.B402_BASE_URL || "https://api.commonservice.io").replace(/\/$/, "");
const url = `${base}/papi/v2/b402/supported`;
const headers = buildTeslaHeaders(body);
const res = await fetch(url, { method: "POST", headers, body });
const text = await res.text();
console.log(`\nPOST ${url}`);
console.log(`Status: ${res.status}`);
console.log(text.slice(0, 400));

if (res.ok) {
  console.log("\nOK: B402 /supported succeeded — restart API and retry payment.");
  process.exit(0);
}
process.exit(1);
