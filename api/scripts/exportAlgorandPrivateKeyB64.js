/**
 * Derive Algorand x402 private key (base64 64-byte) from a 25-word mnemonic.
 * Wallets (Pera, Defly, etc.) usually do NOT export private keys — only the secret phrase.
 *
 * SECURITY: Run locally only. Never commit mnemonic or output to git.
 *
 * Usage (one-time, from api/):
 *   set ALGORAND_MNEMONIC=word1 word2 ... word25
 *   set ALGORAND_EXPECTED_ADDRESS=YOUR58CHARADDRESS   (optional sanity check)
 *   node scripts/exportAlgorandPrivateKeyB64.js
 *
 * Writes: api/.keys/algorand_private.b64.txt (gitignored)
 * Set in .env:
 *   ALGORAND_AGENT_PRIVATE_KEY=<contents of that file>
 * For merchant receive-only (no signing on server):
 *   ALGORAND_PAYTO=<your address>   (address alone is enough)
 */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import algosdk from "algosdk";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** algosdk v3 returns `addr` as an Address object — always stringify before compare. */
function normalizeAlgoAddress(addr) {
  return String(addr ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s/g, "");
}

const mnemonic = String(process.env.ALGORAND_MNEMONIC || "").trim().replace(/\s+/g, " ");
const expected = normalizeAlgoAddress(process.env.ALGORAND_EXPECTED_ADDRESS);

if (!mnemonic) {
  console.error(
    "Set ALGORAND_MNEMONIC to your 25-word secret phrase (space-separated), then re-run.\n" +
      "Example (PowerShell):\n" +
      '  $env:ALGORAND_MNEMONIC="word1 word2 ... word25"\n' +
      '  $env:ALGORAND_EXPECTED_ADDRESS="ABCDEF..."\n' +
      "  node scripts/exportAlgorandPrivateKeyB64.js"
  );
  process.exit(1);
}

let account;
try {
  account = algosdk.mnemonicToSecretKey(mnemonic);
} catch (e) {
  console.error("Invalid mnemonic:", e?.message || e);
  console.error("Use the exact 25-word phrase from your wallet backup (order matters).");
  process.exit(1);
}

const address = normalizeAlgoAddress(account.addr);
const sk = account.sk;
if (!sk || sk.length !== 64) {
  console.error("Unexpected secret key length:", sk?.length);
  process.exit(1);
}

if (expected && address !== expected) {
  console.error(
    "Address mismatch — wrong mnemonic or wrong expected address.\n" +
      `  derived:  ${address}\n` +
      `  expected: ${expected}\n` +
      "If you use a wallet passphrase (extra password), this script does not support it yet."
  );
  process.exit(1);
}

const b64 = Buffer.from(sk).toString("base64");
const outDir = path.resolve(__dirname, "../.keys");
mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, "algorand_private.b64.txt");
writeFileSync(outPath, b64, { mode: 0o600 });

console.log("OK: derived Algorand address:", address);
console.log("OK: wrote base64 key to api/.keys/algorand_private.b64.txt");
console.log("");
console.log("Add to api/.env (do NOT commit):");
console.log("  ALGORAND_PAYTO=" + address);
console.log("  ALGORAND_AGENT_PRIVATE_KEY=<paste contents of algorand_private.b64.txt>");
console.log("");
console.log("Merchant-only (receive USDC, no agent payments): ALGORAND_PAYTO is enough.");
console.log("Agent/tester paying on Algorand: also set ALGORAND_AGENT_PRIVATE_KEY.");
