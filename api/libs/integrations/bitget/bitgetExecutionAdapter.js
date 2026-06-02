/**
 * Bitget execution adapter — paper (default) or live spot orders when credentials exist.
 */
import crypto from "node:crypto";
import { fetchBitgetSpotTicker, hasBitgetTradingCredentials } from "./bitgetAgentHubClient.js";
import {
  TRADING_EXPERIMENT_STARTING_USD,
  TRADING_EXPERIMENT_MIN_TRADE_NOTIONAL_USD,
  roundUsd,
} from "../../../config/tradingExperimentSim.js";

const BITGET_BASE = (process.env.BITGET_API_BASE_URL || "https://api.bitget.com").replace(/\/$/, "");

/**
 * @returns {"paper" | "live"}
 */
export function resolveDefaultExecutionMode() {
  const env = (process.env.BITGET_VIBE_DEFAULT_MODE || "paper").trim().toLowerCase();
  if (env === "live" && hasBitgetTradingCredentials()) return "live";
  return "paper";
}

/**
 * @param {string} mode
 * @returns {"paper" | "live"}
 */
export function normalizeExecutionMode(mode) {
  const m = String(mode || "paper").trim().toLowerCase();
  if (m === "live" && hasBitgetTradingCredentials()) return "live";
  return "paper";
}

/**
 * @param {string} method
 * @param {string} path
 * @param {Record<string, string>} query
 * @param {string} body
 */
function signBitgetRequest(method, path, query, body) {
  const key = process.env.BITGET_API_KEY?.trim();
  const secret = process.env.BITGET_SECRET_KEY?.trim();
  const passphrase = process.env.BITGET_PASSPHRASE?.trim();
  if (!key || !secret || !passphrase) {
    throw new Error("Bitget API credentials not configured");
  }
  const ts = String(Date.now());
  const q = new URLSearchParams(query).toString();
  const requestPath = q ? `${path}?${q}` : path;
  const prehash = ts + method.toUpperCase() + requestPath + body;
  const sign = crypto.createHmac("sha256", secret).update(prehash).digest("base64");
  return {
    "ACCESS-KEY": key,
    "ACCESS-SIGN": sign,
    "ACCESS-TIMESTAMP": ts,
    "ACCESS-PASSPHRASE": passphrase,
    "Content-Type": "application/json",
    locale: "en-US",
  };
}

/**
 * Place a live Bitget spot market buy (requires trade permission on API key).
 * @param {{ symbol: string; sizeUsdt: number }} order
 */
async function placeLiveSpotMarketBuy(order) {
  const symbol = String(order.symbol || "").trim().toUpperCase();
  const sizeUsdt = roundUsd(Number(order.sizeUsdt));
  if (!symbol || !(sizeUsdt >= TRADING_EXPERIMENT_MIN_TRADE_NOTIONAL_USD)) {
    throw new Error("Invalid live order parameters");
  }

  const ticker = await fetchBitgetSpotTicker(symbol);
  const sizeBase = roundUsd(sizeUsdt / ticker.last);
  const path = "/api/v2/spot/trade/place-order";
  const bodyObj = {
    symbol,
    side: "buy",
    orderType: "market",
    force: "gtc",
    size: String(sizeBase),
  };
  const body = JSON.stringify(bodyObj);
  const headers = signBitgetRequest("POST", path, {}, body);
  const res = await fetch(`${BITGET_BASE}${path}`, { method: "POST", headers, body });
  const j = await res.json().catch(() => ({}));
  if (!res.ok || String(j.code) !== "00000") {
    throw new Error(`Bitget place-order: ${j?.msg || res.statusText || j.code}`);
  }
  return {
    mode: "live",
    orderId: j.data?.orderId ?? j.data?.clientOid ?? null,
    fillPrice: ticker.last,
    sizeUsdt,
    sizeBase,
    symbol,
    raw: j.data,
  };
}

/**
 * @param {{
 *   mode: "paper" | "live";
 *   symbol: string;
 *   side: "buy";
 *   notionalUsd: number;
 *   entryPrice?: number;
 * }} params
 */
export async function executeBitgetSpotBuy(params) {
  const mode = normalizeExecutionMode(params.mode);
  const symbol = String(params.symbol || "").trim().toUpperCase();
  const notionalUsd = roundUsd(Number(params.notionalUsd));
  if (!symbol || !(notionalUsd >= TRADING_EXPERIMENT_MIN_TRADE_NOTIONAL_USD)) {
    throw new Error("Notional below minimum trade size");
  }

  if (mode === "live") {
    return placeLiveSpotMarketBuy({ symbol, sizeUsdt: notionalUsd });
  }

  const ticker = await fetchBitgetSpotTicker(symbol);
  const fillPrice =
    Number.isFinite(params.entryPrice) && params.entryPrice > 0
      ? params.entryPrice
      : ticker.last;

  return {
    mode: "paper",
    orderId: `paper_${Date.now()}`,
    fillPrice,
    sizeUsdt: notionalUsd,
    sizeBase: roundUsd(notionalUsd / fillPrice),
    symbol,
    raw: { simulated: true, startingBankUsd: TRADING_EXPERIMENT_STARTING_USD },
  };
}

/**
 * Policy gate for live execution (deterministic; no wallet broker on CEX).
 * @param {{ notionalUsd: number; mode: string }} ctx
 */
export function evaluateBitgetLiveExecutionPolicy(ctx) {
  const notional = Number(ctx.notionalUsd);
  const maxAuto = Number(process.env.BITGET_VIBE_MAX_LIVE_NOTIONAL_USD || 100);
  if (normalizeExecutionMode(ctx.mode) !== "live") {
    return { outcome: "allow", reasons: ["paper_mode"], riskScore: 0 };
  }
  if (!hasBitgetTradingCredentials()) {
    return { outcome: "deny", reasons: ["missing_bitget_credentials"], riskScore: 100 };
  }
  if (!Number.isFinite(notional) || notional > maxAuto) {
    return {
      outcome: "deny",
      reasons: [`notional_exceeds_cap_${maxAuto}`],
      riskScore: 80,
    };
  }
  return { outcome: "allow", reasons: ["within_live_cap"], riskScore: 10 };
}
