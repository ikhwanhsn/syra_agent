/**
 * x402 API: pump.fun agent surfaces aligned with
 * https://github.com/pump-fun/pump-fun-skills
 *
 * - Trade: POST /agents/swap (any pump.fun token on curve or AMM)
 * - Launch: POST /agents/create-coin (standard creator fee vs cashback vs tokenized agent + buybackBps)
 * - Creator fees: POST /agents/collect-fees, POST /agents/sharing-config (claim / redistribute / change recipients)
 * - Tokenized agent payments: POST /agent-payments/build-accept (not `/build`), POST /agent-payments/verify (@pump-fun/agent-payments-sdk)
 *   Revenue to the agent payment address triggers on-chain buyback & burn per your mint config; remainder is claimable on pump.fun.
 */
import express from "express";
import { getV2Payment } from "../../../utils/getV2Payment.js";
import {
  X402_API_PRICE_PUMP_FUN_READ_USD,
  X402_API_PRICE_PUMP_FUN_TX_USD,
} from "../../../config/x402Pricing.js";
import {
  BUILD_ACCEPT_PREFLIGHT_PREFIX,
  buildAcceptPaymentTransactionBase64,
  verifyInvoicePaymentOnChain,
} from "../../../libs/pumpfunAgentPaymentsSdk.js";
import { getPumpfunSwapPriceUsd } from "./swapX402Price.js";
import { getPumpfunCreateCoinPriceUsd } from "./createCoinX402Price.js";
import { getPumpfunCoinMintFromReq, getPumpfunCoinReadPriceUsd } from "./coinReadX402Price.js";

const { requirePayment, settlePaymentAndSetResponse } = await getV2Payment();

const FUN_BLOCK_BASE = (process.env.PUMP_FUN_BLOCK_URL || "https://fun-block.pump.fun").replace(/\/$/, "");
const FRONTEND_API_BASE = (process.env.PUMP_FUN_FRONTEND_API_URL || "https://frontend-api-v3.pump.fun").replace(
  /\/$/,
  ""
);

/** Loose Solana base58 public key check (pump mints vary in length). */
function isLikelySolanaPubkey(s) {
  const t = String(s || "").trim();
  if (t.length < 32 || t.length > 44) return false;
  return /^[1-9A-HJ-NP-Za-km-z]+$/.test(t);
}

/**
 * @param {string} url
 * @param {RequestInit} init
 */
async function fetchJson(url, init) {
  const res = await fetch(url, init);
  const text = await res.text();
  /** @type {unknown} */
  let data = {};
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { error: "upstream_non_json", message: text.slice(0, 500) };
    }
  }
  return { ok: res.ok, status: res.status, data };
}

const swapPayment = {
  price: X402_API_PRICE_PUMP_FUN_TX_USD,
  description:
    "pump.fun trade — buy or sell any pump.fun token (bonding curve or graduated AMM). Proxies fun-block POST /agents/swap; returns base64 VersionedTransaction. x402: base fee + volume surcharge on SOL buys (amount lamports → SOL × PUMPFUN_SWAP_VOLUME_FEE_USD_PER_SOL, capped); sells pay base only. Env: PUMPFUN_SWAP_VOLUME_FEE_USD_PER_SOL, PUMPFUN_SWAP_VOLUME_FEE_CAP_USD",
  method: "POST",
  discoverable: true,
  resource: "/pumpfun/agents/swap",
  inputSchema: {
    bodyType: "json",
    bodyFields: {
      inputMint: { type: "string", required: true, description: "Input mint; NATIVE_MINT for buys" },
      outputMint: { type: "string", required: true, description: "Output mint; NATIVE_MINT for sells" },
      amount: {
        type: "string",
        required: true,
        description:
          "Smallest units: for SOL buys (inputMint = So11…), x402 adds a volume surcharge from lamports; token sells use base fee only",
      },
      user: { type: "string", required: true, description: "Trader wallet public key" },
      slippagePct: { type: "number", required: false, description: "Slippage percent (default from pump API)" },
      feePayer: { type: "string", required: false, description: "Fee payer pubkey" },
      frontRunningProtection: { type: "boolean", required: false, description: "Jito front-running protection" },
      tipAmount: { type: "number", required: false, description: "Jito tip in SOL when frontRunningProtection" },
      encoding: { type: "string", required: false, description: 'Use "base64" per pump skills' },
    },
  },
  outputSchema: {
    transaction: { type: "string", description: "Base64-encoded VersionedTransaction" },
    pumpMintInfo: { type: "object", description: "Quote / pool state from pump" },
  },
};

const createCoinPayment = {
  price: X402_API_PRICE_PUMP_FUN_TX_USD,
  description:
    "pump.fun launch + sniper buy — create coin with initial buy before others. Standard creator-fee coin: cashback false, tokenizedAgent false. Cashback coin: cashback true. Tokenized agent: tokenizedAgent true + buybackBps (e.g. 5000 = 50% of revenue to buyback & burn). Proxies fun-block POST /agents/create-coin. x402: base fee + volume surcharge from solLamports (initial SOL buy notional × PUMPFUN_CREATE_COIN_VOLUME_FEE_USD_PER_SOL, capped); 0 initial buy = base only. Env: PUMPFUN_CREATE_COIN_VOLUME_FEE_USD_PER_SOL, PUMPFUN_CREATE_COIN_VOLUME_FEE_CAP_USD",
  method: "POST",
  discoverable: true,
  resource: "/pumpfun/agents/create-coin",
  inputSchema: {
    bodyType: "json",
    bodyFields: {
      user: { type: "string", required: true, description: "Creator / payer pubkey" },
      name: { type: "string", required: true, description: "Coin name" },
      symbol: { type: "string", required: true, description: "Ticker" },
      uri: { type: "string", required: true, description: "Metadata JSON URL" },
      solLamports: {
        type: "string",
        required: true,
        description:
          "Initial buy SOL (lamports string); x402 adds a volume surcharge from this notional (same pattern as swap SOL buys)",
      },
      mayhemMode: { type: "boolean", required: false, description: "Mayhem mode" },
      cashback: {
        type: "boolean",
        required: false,
        description: "true = cashback coin (trading fees returned as cashback); false = standard creator-fee path",
      },
      tokenizedAgent: {
        type: "boolean",
        required: false,
        description: "true = tokenized agent coin (requires initial buy > 0); enables agent payment address + buyback share",
      },
      buybackBps: {
        type: "number",
        required: false,
        description: "Basis points of agent revenue for buyback & burn when tokenizedAgent (e.g. 5000 = 50%); remainder claimable on pump.fun",
      },
      frontRunningProtection: { type: "boolean", required: false, description: "Jito protection" },
      tipAmount: { type: "number", required: false, description: "Jito tip SOL" },
      encoding: { type: "string", required: false, description: 'Use "base64"' },
      feePayer: { type: "string", required: false, description: "Fee payer" },
      creator: { type: "string", required: false, description: "Creator pubkey" },
    },
  },
  outputSchema: {
    transaction: { type: "string", description: "Base64-encoded VersionedTransaction (partial-signed)" },
    mintPublicKey: { type: "string", description: "New mint address" },
  },
};

const coinReadPayment = {
  price: X402_API_PRICE_PUMP_FUN_READ_USD,
  description:
    "pump.fun coin metadata — GET coins-v2 by mint (path :mint). x402 is dynamic: base + surcharge from cached usd_market_cap (see PUMPFUN_COIN_READ_* env). Also available: GET /pumpfun/coin?mint=",
  method: "GET",
  discoverable: true,
  resource: "/pumpfun/coin/:mint",
  inputSchema: {
    pathParams: {
      mint: { type: "string", required: true, description: "Pump.fun token mint (base58)" },
    },
  },
  outputSchema: {
    mint: { type: "string" },
    name: { type: "string" },
    symbol: { type: "string" },
    complete: { type: "boolean" },
  },
};

const coinReadPaymentQuery = {
  price: X402_API_PRICE_PUMP_FUN_READ_USD,
  description:
    "pump.fun coin metadata — same as /pumpfun/coin/:mint but mint as query (?mint=). x402 price scales with usd_market_cap (cached coins-v2 fetch).",
  method: "GET",
  discoverable: true,
  resource: "/pumpfun/coin",
  inputSchema: {
    queryParams: {
      mint: { type: "string", required: true, description: "Pump.fun token mint (base58)" },
    },
  },
  outputSchema: coinReadPayment.outputSchema,
};

const solPricePayment = {
  price: X402_API_PRICE_PUMP_FUN_READ_USD,
  description: "pump.fun SOL/USD spot from frontend-api-v3",
  method: "GET",
  discoverable: true,
  resource: "/pumpfun/sol-price",
  inputSchema: { queryParams: {} },
  outputSchema: { solPrice: { type: "number" } },
};

const collectFeesPayment = {
  price: X402_API_PRICE_PUMP_FUN_TX_USD,
  description:
    "pump.fun claim creator fees / cashback / shared distribution — fun-block POST /agents/collect-fees (auto: direct creator collect, sharing distribute, or user cashback claim per coin state)",
  method: "POST",
  discoverable: true,
  resource: "/pumpfun/agents/collect-fees",
  inputSchema: {
    bodyType: "json",
    bodyFields: {
      mint: { type: "string", required: true, description: "Coin mint" },
      user: { type: "string", required: true, description: "Fee payer / claimant wallet" },
      frontRunningProtection: { type: "boolean", required: false, description: "Jito protection" },
      tipAmount: { type: "number", required: false, description: "Jito tip SOL" },
      encoding: { type: "string", required: false, description: 'Use "base64"' },
    },
  },
  outputSchema: {
    transaction: { type: "string" },
    creator: { type: "string" },
    isGraduated: { type: "boolean" },
    usesSharingConfig: { type: "boolean" },
  },
};

const sharingConfigPayment = {
  price: X402_API_PRICE_PUMP_FUN_TX_USD,
  description:
    "pump.fun change fee recipients — fun-block POST /agents/sharing-config (create or update fee sharing; up to 10 shareholders, bps sum 10000)",
  method: "POST",
  discoverable: true,
  resource: "/pumpfun/agents/sharing-config",
  inputSchema: {
    bodyType: "json",
    bodyFields: {
      mint: { type: "string", required: true, description: "Coin mint" },
      user: { type: "string", required: true, description: "Creator (create) or admin (update) pubkey" },
      shareholders: {
        type: "array",
        required: true,
        description: '[{ "address": "<PUBKEY>", "bps": 5000 }, ...] total bps = 10000',
      },
      mode: { type: "string", required: false, description: '"create" | "update" — optional; fun-block auto-detects' },
      frontRunningProtection: { type: "boolean", required: false },
      tipAmount: { type: "number", required: false },
      encoding: { type: "string", required: false, description: 'Use "base64"' },
    },
  },
  outputSchema: {
    transaction: { type: "string" },
    mode: { type: "string" },
    sharingConfigAddress: { type: "string" },
    shareholderCount: { type: "number" },
  },
};

const buildAcceptPaymentOpts = {
  price: X402_API_PRICE_PUMP_FUN_TX_USD,
  description:
    "Tokenized agent — build USDC/wSOL payment tx (invoice) for users to sign; uses @pump-fun/agent-payments-sdk + SOLANA_RPC_URL. Buyback/burn of paid revenue is automatic on-chain per mint buybackBps.",
  method: "POST",
  discoverable: true,
  resource: "/pumpfun/agent-payments/build-accept",
  inputSchema: {
    bodyType: "json",
    bodyFields: {
      agentMint: { type: "string", required: true, description: "Tokenized agent coin mint" },
      user: { type: "string", required: true, description: "Payer wallet" },
      currencyMint: { type: "string", required: true, description: "USDC or wSOL mint" },
      amount: { type: "string", required: true, description: "Price in smallest units" },
      memo: { type: "string", required: true, description: "Unique invoice id (number as string)" },
      startTime: { type: "string", required: true, description: "Unix start" },
      endTime: { type: "string", required: true, description: "Unix end" },
      computeUnitLimit: { type: "number", required: false },
      computeUnitPrice: { type: "number", required: false },
      tokenProgram: {
        type: "string",
        required: false,
        description: "SPL Token program id (default Tokenkeg…); use TokenzQd… for Token-2022 mints",
      },
    },
  },
  outputSchema: { transaction: { type: "string" } },
};

const verifyInvoiceOpts = {
  price: X402_API_PRICE_PUMP_FUN_READ_USD,
  description:
    "Tokenized agent — verify an invoice was paid on-chain (Pump HTTP API + optional RPC fallback via SDK)",
  method: "POST",
  discoverable: true,
  resource: "/pumpfun/agent-payments/verify",
  inputSchema: {
    bodyType: "json",
    bodyFields: {
      agentMint: { type: "string", required: true },
      user: { type: "string", required: true },
      currencyMint: { type: "string", required: true },
      amount: { type: "number", required: true },
      memo: { type: "number", required: true },
      startTime: { type: "number", required: true },
      endTime: { type: "number", required: true },
    },
  },
  outputSchema: { verified: { type: "boolean" } },
};

function validateSwapBody(body) {
  const b = body && typeof body === "object" ? body : {};
  const { inputMint, outputMint, amount, user } = b;
  if (!inputMint || !outputMint || amount == null || amount === "" || !user) {
    return { ok: false, error: "Missing required fields: inputMint, outputMint, amount, user" };
  }
  return { ok: true, body: b };
}

function validateCreateBody(body) {
  const b = body && typeof body === "object" ? body : {};
  const { user, name, symbol, uri, solLamports } = b;
  if (!user || !name || !symbol || !uri || solLamports == null || solLamports === "") {
    return { ok: false, error: "Missing required fields: user, name, symbol, uri, solLamports" };
  }
  return { ok: true, body: b };
}

function validateCollectFeesBody(body) {
  const b = body && typeof body === "object" ? body : {};
  const { mint, user } = b;
  if (!mint || !user) return { ok: false, error: "Missing required fields: mint, user" };
  if (!isLikelySolanaPubkey(mint) || !isLikelySolanaPubkey(user)) {
    return { ok: false, error: "mint and user must be valid base58 public keys" };
  }
  return { ok: true, body: b };
}

function validateSharingConfigBody(body) {
  const b = body && typeof body === "object" ? body : {};
  const { mint, user, shareholders } = b;
  if (!mint || !user) return { ok: false, error: "Missing required fields: mint, user" };
  if (!isLikelySolanaPubkey(mint) || !isLikelySolanaPubkey(user)) {
    return { ok: false, error: "mint and user must be valid base58 public keys" };
  }
  if (!Array.isArray(shareholders) || shareholders.length === 0) {
    return { ok: false, error: "shareholders must be a non-empty array of { address, bps }" };
  }
  if (shareholders.length > 10) return { ok: false, error: "At most 10 shareholders" };
  const seen = new Set();
  let total = 0;
  for (const row of shareholders) {
    if (!row || typeof row !== "object") return { ok: false, error: "Invalid shareholder entry" };
    const addr = String(row.address || "").trim();
    const bps = Number(row.bps);
    if (!isLikelySolanaPubkey(addr)) return { ok: false, error: `Invalid shareholder address: ${addr}` };
    if (!Number.isFinite(bps) || bps < 0) return { ok: false, error: "Each shareholder needs integer bps >= 0" };
    const key = addr;
    if (seen.has(key)) return { ok: false, error: "Duplicate shareholder address" };
    seen.add(key);
    total += bps;
  }
  if (total !== 10000) return { ok: false, error: "Shareholder bps must sum exactly to 10000 (100%)" };
  return { ok: true, body: b };
}

function validateBuildAcceptBody(body) {
  const b = body && typeof body === "object" ? body : {};
  const { agentMint, user, currencyMint, amount, memo, startTime, endTime } = b;
  if (!agentMint || !user || !currencyMint || amount == null || memo == null || startTime == null || endTime == null) {
    return {
      ok: false,
      error: "Missing required fields: agentMint, user, currencyMint, amount, memo, startTime, endTime",
    };
  }
  if (!isLikelySolanaPubkey(agentMint) || !isLikelySolanaPubkey(user) || !isLikelySolanaPubkey(currencyMint)) {
    return { ok: false, error: "agentMint, user, and currencyMint must be valid base58 public keys" };
  }
  return { ok: true, body: b };
}

function validateVerifyInvoiceBody(body) {
  const b = body && typeof body === "object" ? body : {};
  const { agentMint, user, currencyMint, amount, memo, startTime, endTime } = b;
  if (!agentMint || !user || !currencyMint) {
    return { ok: false, error: "Missing agentMint, user, or currencyMint" };
  }
  if (
    !Number.isFinite(Number(amount)) ||
    !Number.isFinite(Number(memo)) ||
    !Number.isFinite(Number(startTime)) ||
    !Number.isFinite(Number(endTime))
  ) {
    return { ok: false, error: "amount, memo, startTime, endTime must be numbers" };
  }
  if (!isLikelySolanaPubkey(agentMint) || !isLikelySolanaPubkey(user) || !isLikelySolanaPubkey(currencyMint)) {
    return { ok: false, error: "Invalid base58 public key in agentMint, user, or currencyMint" };
  }
  return {
    ok: true,
    body: {
      agentMint: String(agentMint).trim(),
      user: String(user).trim(),
      currencyMint: String(currencyMint).trim(),
      amount: Number(amount),
      memo: Number(memo),
      startTime: Number(startTime),
      endTime: Number(endTime),
    },
  };
}

/** Reject invalid requests before x402 `requirePayment` so clients are not charged for bad params. */
function pumpfunRequireValidCoinMint(req, res, next) {
  const mint = getPumpfunCoinMintFromReq(req);
  if (!mint || !isLikelySolanaPubkey(mint)) {
    return res.status(400).json({
      success: false,
      error: "Invalid or missing mint (use /pumpfun/coin/:mint or /pumpfun/coin?mint=)",
    });
  }
  next();
}

function pumpfunRequireValidSwapBody(req, res, next) {
  const v = validateSwapBody(req.body);
  if (!v.ok) return res.status(400).json({ success: false, error: v.error });
  next();
}

function pumpfunRequireValidCreateCoinBody(req, res, next) {
  const v = validateCreateBody(req.body);
  if (!v.ok) return res.status(400).json({ success: false, error: v.error });
  next();
}

function pumpfunRequireValidCollectFeesBody(req, res, next) {
  const v = validateCollectFeesBody(req.body);
  if (!v.ok) return res.status(400).json({ success: false, error: v.error });
  next();
}

function pumpfunRequireValidSharingConfigBody(req, res, next) {
  const v = validateSharingConfigBody(req.body);
  if (!v.ok) return res.status(400).json({ success: false, error: v.error });
  next();
}

function pumpfunRequireValidBuildAcceptBody(req, res, next) {
  const v = validateBuildAcceptBody(req.body);
  if (!v.ok) return res.status(400).json({ success: false, error: v.error });
  next();
}

function pumpfunRequireValidVerifyInvoiceBody(req, res, next) {
  const v = validateVerifyInvoiceBody(req.body);
  if (!v.ok) return res.status(400).json({ success: false, error: v.error });
  next();
}

export async function createPumpFunRouter() {
  const router = express.Router();

  if (process.env.NODE_ENV !== "production") {
    router.post("/dev/agents/swap", async (req, res) => {
      const v = validateSwapBody(req.body);
      if (!v.ok) return res.status(400).json({ error: v.error });
      const url = `${FUN_BLOCK_BASE}/agents/swap`;
      const { ok, status, data } = await fetchJson(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(v.body),
      });
      return res.status(ok ? 200 : status >= 400 ? status : 502).json(data);
    });
    router.post("/dev/agents/create-coin", async (req, res) => {
      const v = validateCreateBody(req.body);
      if (!v.ok) return res.status(400).json({ error: v.error });
      const url = `${FUN_BLOCK_BASE}/agents/create-coin`;
      const { ok, status, data } = await fetchJson(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(v.body),
      });
      return res.status(ok ? 200 : status >= 400 ? status : 502).json(data);
    });
    async function devCoinMetadata(req, res) {
      const mint = getPumpfunCoinMintFromReq(req);
      if (!mint || !isLikelySolanaPubkey(mint)) return res.status(400).json({ error: "Invalid or missing mint" });
      const url = `${FRONTEND_API_BASE}/coins-v2/${encodeURIComponent(mint)}`;
      const { ok, status, data } = await fetchJson(url, { method: "GET", headers: { Accept: "application/json" } });
      return res.status(ok ? 200 : status >= 400 ? status : 502).json(data);
    }
    router.get("/dev/coin", devCoinMetadata);
    router.get("/dev/coin/:mint", devCoinMetadata);
    router.get("/dev/sol-price", async (req, res) => {
      const url = `${FRONTEND_API_BASE}/sol-price`;
      const { ok, status, data } = await fetchJson(url, { method: "GET", headers: { Accept: "application/json" } });
      return res.status(ok ? 200 : status >= 400 ? status : 502).json(data);
    });
    router.post("/dev/agents/collect-fees", async (req, res) => {
      const v = validateCollectFeesBody(req.body);
      if (!v.ok) return res.status(400).json({ error: v.error });
      const url = `${FUN_BLOCK_BASE}/agents/collect-fees`;
      const { ok, status, data } = await fetchJson(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(v.body),
      });
      return res.status(ok ? 200 : status >= 400 ? status : 502).json(data);
    });
    router.post("/dev/agents/sharing-config", async (req, res) => {
      const v = validateSharingConfigBody(req.body);
      if (!v.ok) return res.status(400).json({ error: v.error });
      const url = `${FUN_BLOCK_BASE}/agents/sharing-config`;
      const { ok, status, data } = await fetchJson(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(v.body),
      });
      return res.status(ok ? 200 : status >= 400 ? status : 502).json(data);
    });
    router.post("/dev/agent-payments/build-accept", async (req, res) => {
      const v = validateBuildAcceptBody(req.body);
      if (!v.ok) return res.status(400).json({ error: v.error });
      try {
        const out = await buildAcceptPaymentTransactionBase64(v.body);
        return res.status(200).json(out);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Unknown error";
        if (msg.startsWith(BUILD_ACCEPT_PREFLIGHT_PREFIX)) {
          return res.status(400).json({ error: msg.slice(BUILD_ACCEPT_PREFLIGHT_PREFIX.length) });
        }
        const code = /unavailable/i.test(msg) ? 503 : 500;
        return res.status(code).json({ error: msg });
      }
    });
    router.post("/dev/agent-payments/verify", async (req, res) => {
      const v = validateVerifyInvoiceBody(req.body);
      if (!v.ok) return res.status(400).json({ error: v.error });
      try {
        const out = await verifyInvoicePaymentOnChain(v.body);
        return res.status(200).json(out);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Unknown error";
        const code = /unavailable/i.test(msg) ? 503 : 500;
        return res.status(code).json({ error: msg });
      }
    });
  }

  router.post(
    "/agents/swap",
    pumpfunRequireValidSwapBody,
    requirePayment({
      ...swapPayment,
      getPriceUsd: getPumpfunSwapPriceUsd,
    }),
    async (req, res) => {
      const v = validateSwapBody(req.body);
      if (!v.ok) {
        return res.status(400).json({ success: false, error: v.error });
      }
      try {
        const url = `${FUN_BLOCK_BASE}/agents/swap`;
        const { ok, status, data } = await fetchJson(url, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(v.body),
        });
        if (!ok) {
          return res.status(status >= 400 ? status : 502).json(
            data && typeof data === "object" ? data : { success: false, error: "pump.fun swap upstream error" }
          );
        }
        await settlePaymentAndSetResponse(res, req);
        return res.status(200).json(data);
      } catch (e) {
        return res.status(500).json({
          success: false,
          error: "Internal server error",
          message: e instanceof Error ? e.message : "Unknown error",
        });
      }
    }
  );

  router.post(
    "/agents/create-coin",
    pumpfunRequireValidCreateCoinBody,
    requirePayment({
      ...createCoinPayment,
      getPriceUsd: getPumpfunCreateCoinPriceUsd,
    }),
    async (req, res) => {
    const v = validateCreateBody(req.body);
    if (!v.ok) {
      return res.status(400).json({ success: false, error: v.error });
    }
    try {
      const url = `${FUN_BLOCK_BASE}/agents/create-coin`;
      const { ok, status, data } = await fetchJson(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(v.body),
      });
      if (!ok) {
        return res.status(status >= 400 ? status : 502).json(
          data && typeof data === "object" ? data : { success: false, error: "pump.fun create-coin upstream error" }
        );
      }
      await settlePaymentAndSetResponse(res, req);
      return res.status(200).json(data);
    } catch (e) {
      return res.status(500).json({
        success: false,
        error: "Internal server error",
        message: e instanceof Error ? e.message : "Unknown error",
      });
    }
  });

  router.post(
    "/agents/collect-fees",
    pumpfunRequireValidCollectFeesBody,
    requirePayment(collectFeesPayment),
    async (req, res) => {
    const v = validateCollectFeesBody(req.body);
    if (!v.ok) return res.status(400).json({ success: false, error: v.error });
    try {
      const url = `${FUN_BLOCK_BASE}/agents/collect-fees`;
      const { ok, status, data } = await fetchJson(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(v.body),
      });
      if (!ok) {
        return res.status(status >= 400 ? status : 502).json(
          data && typeof data === "object" ? data : { success: false, error: "pump.fun collect-fees upstream error" }
        );
      }
      await settlePaymentAndSetResponse(res, req);
      return res.status(200).json(data);
    } catch (e) {
      return res.status(500).json({
        success: false,
        error: "Internal server error",
        message: e instanceof Error ? e.message : "Unknown error",
      });
    }
  });

  router.post(
    "/agents/sharing-config",
    pumpfunRequireValidSharingConfigBody,
    requirePayment(sharingConfigPayment),
    async (req, res) => {
    const v = validateSharingConfigBody(req.body);
    if (!v.ok) return res.status(400).json({ success: false, error: v.error });
    try {
      const url = `${FUN_BLOCK_BASE}/agents/sharing-config`;
      const { ok, status, data } = await fetchJson(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(v.body),
      });
      if (!ok) {
        return res.status(status >= 400 ? status : 502).json(
          data && typeof data === "object" ? data : { success: false, error: "pump.fun sharing-config upstream error" }
        );
      }
      await settlePaymentAndSetResponse(res, req);
      return res.status(200).json(data);
    } catch (e) {
      return res.status(500).json({
        success: false,
        error: "Internal server error",
        message: e instanceof Error ? e.message : "Unknown error",
      });
    }
  });

  router.post("/agent-payments/build", (req, res) => {
    res.status(404).json({
      success: false,
      error:
        "No route POST /pumpfun/agent-payments/build. Use POST /pumpfun/agent-payments/build-accept with the same JSON body.",
    });
  });

  router.post(
    "/agent-payments/build-accept",
    pumpfunRequireValidBuildAcceptBody,
    requirePayment(buildAcceptPaymentOpts),
    async (req, res) => {
    const v = validateBuildAcceptBody(req.body);
    if (!v.ok) return res.status(400).json({ success: false, error: v.error });
    try {
      const out = await buildAcceptPaymentTransactionBase64(v.body);
      await settlePaymentAndSetResponse(res, req);
      return res.status(200).json(out);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      if (msg.startsWith(BUILD_ACCEPT_PREFLIGHT_PREFIX)) {
        return res.status(400).json({ success: false, error: msg.slice(BUILD_ACCEPT_PREFLIGHT_PREFIX.length) });
      }
      if (/unavailable/i.test(msg)) {
        return res.status(503).json({ success: false, error: msg });
      }
      return res.status(500).json({ success: false, error: "Internal server error", message: msg });
    }
  });

  router.post(
    "/agent-payments/verify",
    pumpfunRequireValidVerifyInvoiceBody,
    requirePayment(verifyInvoiceOpts),
    async (req, res) => {
    const v = validateVerifyInvoiceBody(req.body);
    if (!v.ok) return res.status(400).json({ success: false, error: v.error });
    try {
      const out = await verifyInvoicePaymentOnChain(v.body);
      await settlePaymentAndSetResponse(res, req);
      return res.status(200).json(out);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      if (/unavailable/i.test(msg)) {
        return res.status(503).json({ success: false, error: msg });
      }
      return res.status(500).json({ success: false, error: "Internal server error", message: msg });
    }
  });

  async function pumpfunCoinMetadataHandler(req, res) {
    const mint = getPumpfunCoinMintFromReq(req);
    if (!mint || !isLikelySolanaPubkey(mint)) {
      return res.status(400).json({ success: false, error: "Invalid or missing mint (use /pumpfun/coin/:mint or /pumpfun/coin?mint=)" });
    }
    try {
      const url = `${FRONTEND_API_BASE}/coins-v2/${encodeURIComponent(mint)}`;
      const { ok, status, data } = await fetchJson(url, { method: "GET", headers: { Accept: "application/json" } });
      if (!ok) {
        return res.status(status >= 400 ? status : 502).json(
          data && typeof data === "object" ? data : { success: false, error: "pump.fun coins-v2 upstream error" }
        );
      }
      await settlePaymentAndSetResponse(res, req);
      return res.status(200).json(data);
    } catch (e) {
      return res.status(500).json({
        success: false,
        error: "Internal server error",
        message: e instanceof Error ? e.message : "Unknown error",
      });
    }
  }

  router.get(
    "/coin",
    pumpfunRequireValidCoinMint,
    requirePayment({
      ...coinReadPaymentQuery,
      getPriceUsd: getPumpfunCoinReadPriceUsd,
    }),
    pumpfunCoinMetadataHandler
  );
  router.get(
    "/coin/:mint",
    pumpfunRequireValidCoinMint,
    requirePayment({
      ...coinReadPayment,
      getPriceUsd: getPumpfunCoinReadPriceUsd,
    }),
    pumpfunCoinMetadataHandler
  );

  router.get("/sol-price", requirePayment(solPricePayment), async (req, res) => {
    try {
      const url = `${FRONTEND_API_BASE}/sol-price`;
      const { ok, status, data } = await fetchJson(url, { method: "GET", headers: { Accept: "application/json" } });
      if (!ok) {
        return res.status(status >= 400 ? status : 502).json(
          data && typeof data === "object" ? data : { success: false, error: "pump.fun sol-price upstream error" }
        );
      }
      await settlePaymentAndSetResponse(res, req);
      return res.status(200).json(data);
    } catch (e) {
      return res.status(500).json({
        success: false,
        error: "Internal server error",
        message: e instanceof Error ? e.message : "Unknown error",
      });
    }
  });

  return router;
}
