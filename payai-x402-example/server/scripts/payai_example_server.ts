import { createRequire } from "module";
import express from "express";
import { x402ResourceServer } from "@x402/express";
import { HTTPFacilitatorClient } from "@x402/core/server";
import type { Network } from "@x402/core/types";
import { ExactEvmScheme } from "@x402/evm/exact/server";
import { ExactSvmScheme } from "@x402/svm/exact/server";
import { bazaarResourceServerExtension } from "@x402/extensions/bazaar";

import {
  registerPayAiExampleX402Routes,
  type PayAiExampleConfig,
  type PayAiExampleAssets,
} from "./payai_example_routes";

// Load .env only in development; production uses platform env vars
if (process.env.NODE_ENV !== "production") {
  try {
    const require = createRequire(import.meta.url);
    require("dotenv").config();
  } catch {}
}

function env(name: string): string {
  return String(process.env[name] || "").trim();
}

function envAny(names: string[]): string {
  for (const n of names) {
    const v = env(n);
    if (v) return v;
  }
  return "";
}

function atomicUsdcFromUsd(usd: number): string {
  // USDC has 6 decimals
  return String(Math.round(usd * 1_000_000));
}

// CAIP-2 defaults
const SOLANA_MAINNET_GENESIS = "5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp";
const SOLANA_DEVNET_GENESIS = "EtWTRABZaYq6iMfeYKouRu166VU2xqa1";
const SOLANA_TESTNET_GENESIS = "4uhcVJyU9pJkvQyS88uRDiswHXSCkY3z";
const DEFAULT_SOLANA_NETWORK = `solana:${SOLANA_MAINNET_GENESIS}` as Network;
const DEFAULT_BASE_NETWORK = "eip155:8453" as Network;

function normalizeSolanaNetwork(raw: string): Network {
  const n = String(raw || "").trim();
  if (!n || n === "solana" || n === "solana:mainnet") return `solana:${SOLANA_MAINNET_GENESIS}` as Network;
  if (n === "solana-devnet" || n === "solana:devnet") return `solana:${SOLANA_DEVNET_GENESIS}` as Network;
  if (n === "solana-testnet" || n === "solana:testnet") return `solana:${SOLANA_TESTNET_GENESIS}` as Network;
  return n as Network;
}

function normalizeBaseNetwork(raw: string): Network {
  const n = String(raw || "").trim();
  if (!n || n === "base") return "eip155:8453" as Network;
  if (n === "base-sepolia") return "eip155:84532" as Network;
  if (n.startsWith("eip155:")) return n as Network;
  if (/^\d+$/.test(n)) return `eip155:${n}` as Network;
  return n as Network;
}

function getPublicOriginFromReq(req: express.Request): string {
  const configured = env("PUBLIC_ORIGIN");
  if (configured) return configured.replace(/\/$/, "");
  const proto = String((req.headers["x-forwarded-proto"] as string) || req.protocol || "https")
    .split(",")[0]
    .trim();
  const host = String(req.get("host") || "").trim();
  return `${proto}://${host}`.replace(/\/$/, "");
}

// ---- Config (PayAI facilitator + assets + payTo) ----
//
// Supports BOTH:
// - The "normal" Wurk x402 env var names (FACILITATOR_URL, NETWORK, ADDRESS, USDC_MINT, BASE_*)
// - Optional PayAI-prefixed aliases (PAYAI_*)
//
// This makes the example easy to run using the same env you already have.

// Facilitator URLs
const facilitatorUrl = envAny(["PAYAI_FACILITATOR_URL", "FACILITATOR_URL"]); // optional shared URL for both
const solFacilitatorUrl = envAny(["PAYAI_SOLANA_FACILITATOR_URL", "FACILITATOR_URL", "PAYAI_FACILITATOR_URL"]);
const baseFacilitatorUrl = envAny([
  "PAYAI_BASE_FACILITATOR_URL",
  "BASE_FACILITATOR_URL",
  "FACILITATOR_URL",
  "PAYAI_FACILITATOR_URL",
]);

// Networks
const solanaNetwork = normalizeSolanaNetwork(envAny(["SOLANA_NETWORK", "NETWORK"]) || DEFAULT_SOLANA_NETWORK);
const baseNetwork = normalizeBaseNetwork(envAny(["BASE_NETWORK"]) || DEFAULT_BASE_NETWORK);

// payTo addresses
const solanaPayTo = envAny(["SOLANA_PAYTO", "ADDRESS"]);
const basePayTo = envAny(["BASE_PAYTO", "BASE_ADDRESS"]);

// USDC assets
const solanaUsdcMint = envAny(["SOLANA_USDC_MINT", "USDC_MINT"]); // e.g. USDC mint on Solana
const baseUsdcAsset = envAny(["BASE_USDC"]); // e.g. USDC contract address on Base

const port = Number(env("PORT") || "3000");

function requireOrThrow(name: string, value: string): string {
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

async function main(): Promise<void> {
  // Minimal validation so you don't accidentally start an unusable example server
  requireOrThrow("FACILITATOR_URL (or PAYAI_FACILITATOR_URL / PAYAI_SOLANA_FACILITATOR_URL)", solFacilitatorUrl);
  requireOrThrow("BASE_FACILITATOR_URL (or PAYAI_BASE_FACILITATOR_URL) [can also fallback to FACILITATOR_URL]", baseFacilitatorUrl);

  requireOrThrow("ADDRESS (or SOLANA_PAYTO)", solanaPayTo);
  requireOrThrow("BASE_ADDRESS (or BASE_PAYTO)", basePayTo);

  requireOrThrow("USDC_MINT (or SOLANA_USDC_MINT)", solanaUsdcMint);
  requireOrThrow("BASE_USDC", baseUsdcAsset);

  const app = express();
  app.use(express.json());

  // CORS (so x402scan.com can call your server from the browser)
  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.setHeader(
      "Access-Control-Allow-Headers",
      [
        "Content-Type",
        "Payment-Signature",
        "PAYMENT-SIGNATURE",
        "Payment-Required",
        "PAYMENT-REQUIRED",
        "Payment-Response",
        "PAYMENT-RESPONSE",
        "X-Payment",
        "x-payment",
      ].join(", "),
    );
    if (req.method === "OPTIONS") return res.status(204).end();
    next();
  });

  // Helpful request logs (no secrets)
  app.use((req, _res, next) => {
    // eslint-disable-next-line no-console
    console.log(`[payai-example] ${req.method} ${req.path}`);
    next();
  });

  // Create resource server with both facilitator clients (Solana + Base)
  const clients: HTTPFacilitatorClient[] = [];
  clients.push(new HTTPFacilitatorClient({ url: solFacilitatorUrl || facilitatorUrl }));
  const baseUrl = baseFacilitatorUrl || solFacilitatorUrl || facilitatorUrl;
  if (baseUrl && baseUrl !== solFacilitatorUrl) clients.push(new HTTPFacilitatorClient({ url: baseUrl }));

  const resourceServer = new x402ResourceServer(clients);
  // Optional, but enables richer discovery metadata for facilitators.
  resourceServer.registerExtension(bazaarResourceServerExtension);

  // Register schemes + money parsers so "price: '$0.01'" resolves to USDC assets
  const evmScheme = new ExactEvmScheme().registerMoneyParser(async (amount, net) => {
    if (!String(net).startsWith("eip155:")) return null;
    return { asset: baseUsdcAsset, amount: atomicUsdcFromUsd(amount) };
  });
  const svmScheme = new ExactSvmScheme().registerMoneyParser(async (amount, net) => {
    if (!String(net).startsWith("solana:")) return null;
    return { asset: solanaUsdcMint, amount: atomicUsdcFromUsd(amount) };
  });

  resourceServer.register("eip155:*" as Network, evmScheme);
  resourceServer.register("solana:*" as Network, svmScheme);

  // x402 endpoints (manual verify + settle, with JSON schema responses like Wurk)
  const cfg: PayAiExampleConfig = {
    solanaNetwork,
    solanaPayTo,
    baseNetwork,
    basePayTo,
  };
  const assets: PayAiExampleAssets = {
    solanaUsdcMint,
    baseUsdc: baseUsdcAsset,
  };
  registerPayAiExampleX402Routes(app, resourceServer as any, cfg, assets);

  // x402scan discovery document (recommended well-known path)
  app.get(["/.well-known/x402", "/.well-known/x402/"], (req, res) => {
    const origin = getPublicOriginFromReq(req);
    const resources = [`${origin}/solana/example`, `${origin}/base/example`];

    const proofsRaw = env("X402_OWNERSHIP_PROOFS");
    const ownershipProofs = proofsRaw
      ? proofsRaw
          .split(/[\n,]+/g)
          .map((s) => s.trim())
          .filter(Boolean)
      : undefined;

    res.type("application/json").json({
      version: 1,
      resources,
      ...(ownershipProofs && ownershipProofs.length ? { ownershipProofs } : {}),
    });
  });

  // Simple landing page
  app.get("/", (_req, res) => {
    res.type("text/plain").send(
      [
        "PayAI x402 v2 Example Server",
        "",
        "Paid endpoints:",
        "  - GET/POST /solana/example  ($0.01 USDC on Solana)",
        "  - GET/POST /base/example    ($0.01 USDC on Base)",
        "",
        "Discovery:",
        "  - GET /.well-known/x402",
      ].join("\n"),
    );
  });

  app.listen(port, () => {
    // Keep logs non-sensitive (do not print env values)
    // eslint-disable-next-line no-console
    console.log(`[payai-example] listening on :${port}`);
  });
}

main().catch((e: any) => {
  // eslint-disable-next-line no-console
  console.error("[payai-example] failed:", e?.message || String(e));
  process.exit(1);
});

