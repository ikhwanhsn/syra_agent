/**
 * Generate RSA keypair for Binance B402 API signing (PKCS#8).
 * Register the public PEM with B402 onboarding; keep private key server-side only.
 *
 * Usage: node api/scripts/generateB402Keypair.js
 *
 * SECURITY: never prints the private key to stdout. Writes to gitignored api/.keys/.
 */
import { generateKeyPairSync } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
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
  privateKey
    .replace(/-----BEGIN PRIVATE KEY-----/g, "")
    .replace(/-----END PRIVATE KEY-----/g, "")
    .replace(/\s/g, ""),
).toString("base64");

mkdirSync(outDir, { recursive: true });

const privatePemPath = path.join(outDir, "b402_private.pem");
const privateB64Path = path.join(outDir, "b402_private.b64");
const publicPemPath = path.join(outDir, "b402_public.pem");

writeFileSync(privatePemPath, privateKey, { mode: 0o600 });
writeFileSync(privateB64Path, privateB64 + "\n", { mode: 0o600 });
writeFileSync(publicPemPath, publicKey);

console.log("\n=== B402 RSA keypair generated ===\n");
console.log("Public key (register with Binance B402):\n");
console.log(publicKey);
console.log("Private key written to gitignored files (NOT printed):");
console.log(`  ${privatePemPath}`);
console.log(`  ${privateB64Path}`);
console.log("Set B402_PRIVATE_KEY_PEM or B402_PRIVATE_KEY_B64 from those files in api/.env.");
console.log(`Public PEM: ${publicPemPath}\n`);
