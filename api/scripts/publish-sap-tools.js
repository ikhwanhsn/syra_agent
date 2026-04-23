#!/usr/bin/env node
/**
 * Publish HTTP tool descriptors + JSON schemas on-chain for Syra (Synapse Agent Protocol).
 * Aligns with SAP expectations: ToolDescriptor PDAs so clients can verify I/O without trusting only .well-known.
 *
 * Docs: https://explorer.oobeprotocol.ai/docs/examples/register-agent (registerWithTools / tools.publish)
 * Run after the agent is registered: `npm run publish-sap-tools`
 *
 * Env: same signer as register-sap-agent (SOLANA_PRIVATE_KEY / PAYER_KEYPAIR / AGENT_PRIVATE_KEY),
 *      SAP_RPC_URL, SAP_RPC_WS_URL (optional), SAP_CLUSTER (mainnet-beta for production).
 *
 * Note: We intentionally do not use SOLANA_RPC_URL here — many HTTP RPCs (e.g. Ankr) have no working
 * WebSocket for signatureSubscribe, so Anchor confirmation times out. Set SAP_RPC_URL explicitly
 * (e.g. https://api.mainnet-beta.solana.com) or rely on the default below.
 */
import "dotenv/config";
import { createRequire } from "node:module";
import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";

const require = createRequire(import.meta.url);
const { SapConnection, KeypairWallet } = require("@oobe-protocol-labs/synapse-sap-sdk");
const { HTTP_METHOD_VALUES, TOOL_CATEGORY_VALUES } = require("@oobe-protocol-labs/synapse-sap-sdk/constants");

const PROTOCOL_ID = "mcp-v1";
const CAT_DATA = TOOL_CATEGORY_VALUES.Data;
const CAT_ANALYTICS = TOOL_CATEGORY_VALUES.Analytics;

function getSigner() {
  const raw = process.env.SOLANA_PRIVATE_KEY || process.env.PAYER_KEYPAIR;
  if (raw) {
    try {
      const arr = JSON.parse(raw);
      return Keypair.fromSecretKey(Uint8Array.from(arr));
    } catch {
      /* fall through */
    }
  }
  const b58 = process.env.AGENT_PRIVATE_KEY || process.env.ZAUTH_SOLANA_PRIVATE_KEY;
  if (b58) {
    return Keypair.fromSecretKey(bs58.decode(b58));
  }
  throw new Error("Set SOLANA_PRIVATE_KEY, PAYER_KEYPAIR, or AGENT_PRIVATE_KEY in .env");
}

/** @type {Array<{ name: string; description: string; inputSchema: object; outputSchema: object; httpMethod: number; category: number; paramsCount: number; requiredParams: number }>} */
const TOOLS = [
  {
    name: "GET /brain",
    description: "Syra Brain single-question API; AI selects tools and returns one answer.",
    inputSchema: {
      type: "object",
      properties: {
        question: { type: "string", description: "Natural language question" },
      },
      required: ["question"],
    },
    outputSchema: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        response: { type: "string" },
        toolUsages: { type: "array" },
      },
    },
    httpMethod: HTTP_METHOD_VALUES.Get,
    category: CAT_ANALYTICS,
    paramsCount: 1,
    requiredParams: 1,
  },
  {
    name: "GET /news",
    description: "Latest crypto news; optional ticker (e.g. BTC, ETH, general).",
    inputSchema: {
      type: "object",
      properties: { ticker: { type: "string", description: "Ticker or general" } },
    },
    outputSchema: { type: "object", description: "News payload from Syra API" },
    httpMethod: HTTP_METHOD_VALUES.Get,
    category: CAT_DATA,
    paramsCount: 1,
    requiredParams: 0,
  },
  {
    name: "GET /health",
    description: "API health / connectivity check (minimal fee tier).",
    inputSchema: { type: "object", properties: {} },
    outputSchema: {
      type: "object",
      properties: {
        status: { type: "string" },
        message: { type: "string" },
      },
    },
    httpMethod: HTTP_METHOD_VALUES.Get,
    category: CAT_DATA,
    paramsCount: 0,
    requiredParams: 0,
  },
  {
    name: "GET /signal",
    description: "Trading signals from configured venue (default Binance spot OHLC + technical engine).",
    inputSchema: {
      type: "object",
      properties: {
        token: { type: "string" },
        source: { type: "string" },
        instId: { type: "string" },
        bar: { type: "string" },
        limit: { type: "number" },
      },
    },
    outputSchema: { type: "object", description: "Signal payload" },
    httpMethod: HTTP_METHOD_VALUES.Get,
    category: CAT_ANALYTICS,
    paramsCount: 5,
    requiredParams: 0,
  },
  {
    name: "GET /sentiment",
    description: "Market sentiment analysis (30-day window).",
    inputSchema: {
      type: "object",
      properties: { ticker: { type: "string" } },
    },
    outputSchema: { type: "object" },
    httpMethod: HTTP_METHOD_VALUES.Get,
    category: CAT_DATA,
    paramsCount: 1,
    requiredParams: 0,
  },
  {
    name: "GET /exa-search",
    description: "Exa AI web search over the open web.",
    inputSchema: {
      type: "object",
      properties: { query: { type: "string" } },
      required: ["query"],
    },
    outputSchema: { type: "object" },
    httpMethod: HTTP_METHOD_VALUES.Get,
    category: CAT_DATA,
    paramsCount: 1,
    requiredParams: 1,
  },
  {
    name: "POST /brain",
    description: "Syra Brain single-question API (JSON body with question).",
    inputSchema: {
      type: "object",
      properties: { question: { type: "string" } },
      required: ["question"],
    },
    outputSchema: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        response: { type: "string" },
        toolUsages: { type: "array" },
      },
    },
    httpMethod: HTTP_METHOD_VALUES.Post,
    category: CAT_ANALYTICS,
    paramsCount: 1,
    requiredParams: 1,
  },
];

/** Anchor confirmation needs a WS endpoint; HTTP-only RPC returns signatureSubscribe errors and times out. */
function inferWsUrl(rpcUrl) {
  const explicit = process.env.SAP_RPC_WS_URL?.trim();
  if (explicit) return explicit;
  try {
    const u = new URL(rpcUrl);
    if (u.protocol === "https:") return `wss://${u.host}${u.pathname}${u.search}`;
    if (u.protocol === "http:") return `ws://${u.host}${u.pathname}${u.search}`;
  } catch {
    /* ignore */
  }
  return "wss://api.mainnet-beta.solana.com/";
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/** Public RPC returns 429 under burst; retry with backoff. */
async function publishByNameWithRetry(client, args) {
  const max = 6;
  let lastErr;
  for (let i = 0; i < max; i++) {
    try {
      return await client.tools.publishByName(...args);
    } catch (e) {
      lastErr = e;
      const msg = e?.message || String(e);
      if (/429|Too many requests/i.test(msg) && i < max - 1) {
        const wait = 3000 * 2 ** i;
        console.warn("RPC 429 — waiting", wait, "ms then retry", i + 1, "/", max);
        await sleep(wait);
        continue;
      }
      throw e;
    }
  }
  throw lastErr;
}

async function main() {
  const keypair = getSigner();
  const rpcUrl =
    process.env.SAP_RPC_URL?.trim() || "https://api.mainnet-beta.solana.com";
  const cluster = (process.env.SAP_CLUSTER || "mainnet-beta").replace(/^mainnet$/, "mainnet-beta");

  const sap = new SapConnection({
    rpcUrl,
    wsUrl: inferWsUrl(rpcUrl),
    cluster,
    commitment: "confirmed",
  });
  const client = sap.createClient(new KeypairWallet(keypair));

  const gapMs = Number(process.env.SAP_PUBLISH_GAP_MS || 3000);

  for (const t of TOOLS) {
    const inputStr = JSON.stringify(t.inputSchema);
    const outputStr = JSON.stringify(t.outputSchema);
    try {
      await publishByNameWithRetry(client, [
        t.name,
        PROTOCOL_ID,
        t.description,
        inputStr,
        outputStr,
        t.httpMethod,
        t.category,
        t.paramsCount,
        t.requiredParams,
        false,
      ]);
    } catch (e) {
      const msg = e?.message || String(e);
      if (!/already|custom program error|0x0/i.test(msg)) {
        console.error("FAIL", t.name, msg);
        throw e;
      }
    }
    await sleep(gapMs);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
