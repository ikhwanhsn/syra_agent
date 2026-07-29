/**
 * One-shot: load api/.env PAYER_KEYPAIR, print pubkey + balances (no secret),
 * then make a production /news call with X-Syra-Source: mcp-server.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { Keypair, Connection, PublicKey } = require("@solana/web3.js");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, "../.env");
const sdkIndexPath = path.resolve(__dirname, "../../syra-sdk/dist/index.js");

function loadEnvValue(file, key) {
  const text = fs.readFileSync(file, "utf8");
  const line = text.split(/\r?\n/).find((l) => l.startsWith(`${key}=`));
  if (!line) return null;
  let raw = line.slice(key.length + 1).trim();
  if (
    (raw.startsWith('"') && raw.endsWith('"')) ||
    (raw.startsWith("'") && raw.endsWith("'"))
  ) {
    raw = raw.slice(1, -1);
  }
  return raw;
}

function parseSecret(raw) {
  if (raw.startsWith("[")) return Uint8Array.from(JSON.parse(raw));
  throw new Error("Expected JSON byte-array keypair in PAYER_KEYPAIR");
}

const raw = loadEnvValue(envPath, "PAYER_KEYPAIR");
if (!raw) {
  console.error("NO_PAYER in api/.env");
  process.exit(1);
}

const kp = Keypair.fromSecretKey(parseSecret(raw));
console.log(`pubkey=${kp.publicKey.toBase58()}`);

const conn = new Connection("https://api.mainnet-beta.solana.com", "confirmed");
const sol = await conn.getBalance(kp.publicKey);
console.log(`solLamports=${sol}`);

const USDC = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");
const atas = await conn.getParsedTokenAccountsByOwner(kp.publicKey, { mint: USDC });
let usdc = 0;
for (const a of atas.value) {
  usdc += Number(a.account.data.parsed.info.tokenAmount.uiAmount || 0);
}
console.log(`usdc=${usdc}`);

if (usdc < 0.005) {
  console.error("INSUFFICIENT_USDC — fund this pubkey with >= $1 Solana USDC, then re-run.");
  process.exit(2);
}

process.env.SYRA_PAYER_KEYPAIR = raw;
process.env.SYRA_API_BASE_URL = "https://api.syraa.fun";
delete process.env.SYRA_USE_DEV_ROUTES;

const { resetPaidFetchCache, createSyraPaidClient } = await import(pathToFileURL(sdkIndexPath).href);
resetPaidFetchCache();

const client = await createSyraPaidClient({
  baseUrl: "https://api.syraa.fun",
  headers: { "X-Syra-Source": "mcp-server" },
});

console.log("calling GET /news?ticker=BTC …");
const news = await client.get("/news", { ticker: "BTC" });
const preview = typeof news === "string" ? news.slice(0, 200) : JSON.stringify(news).slice(0, 200);
console.log(`ok preview=${preview}`);
