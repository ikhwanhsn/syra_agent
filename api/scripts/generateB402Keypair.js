/**
 * Generate RSA keypair for Binance B402 API signing (PKCS#8).
 * Register the public PEM with B402 onboarding; keep private key server-side only.
 *
 * Usage: node api/scripts/generateB402Keypair.js
 */
import { generateKeyPairSync } from "node:crypto";
import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "..", ".keys");

// B402 Tesla signing expects 1024-bit RSA (128-byte signatures).
const { publicKey, privateKey } = generateKeyPairSync("rsa", {
  modulusLength: 1024,
  publicKeyEncoding: { type: "spki", format: "pem" },
  privateKeyEncoding: { type: "pkcs8", format: "pem" },
});

const privateB64 = Buffer.from(
  privateKey.replace(/-----BEGIN PRIVATE KEY-----/g, "").replace(/-----END PRIVATE KEY-----/g, "").replace(/\s/g, "")
).toString("base64");

try {
  writeFileSync(path.join(outDir, "b402_private.pem"), privateKey, { mode: 0o600 });
  writeFileSync(path.join(outDir, "b402_public.pem"), publicKey);
} catch {
  console.warn("[b402] Could not write to api/.keys/ — paste keys from stdout into .env");
}

console.log("\n=== B402 RSA keypair generated ===\n");
console.log("Public key (register with Binance B402):\n");
console.log(publicKey);
console.log("\nPrivate key PEM — set B402_PRIVATE_KEY_PEM in api/.env (never commit):\n");
console.log(privateKey);
console.log("\nOr one-line base64 PKCS#8 for B402_PRIVATE_KEY_B64:\n");
console.log(privateB64);
console.log("\nFiles (if writable): api/.keys/b402_private.pem, api/.keys/b402_public.pem\n");
