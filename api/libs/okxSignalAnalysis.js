/**
 * OKX public market candles + CryptoAnalysisEngine for /signal?source=okx
 */
import { CryptoAnalysisEngine } from "../scripts/cryptoAnalysisEngine.js";

const OKX_CANDLES_URL = "https://www.okx.com/api/v5/market/candles";

const TOKEN_TO_INST = {
  bitcoin: "BTC-USDT",
  btc: "BTC-USDT",
  ethereum: "ETH-USDT",
  eth: "ETH-USDT",
  solana: "SOL-USDT",
  sol: "SOL-USDT",
  xrp: "XRP-USDT",
  ripple: "XRP-USDT",
  dogecoin: "DOGE-USDT",
  doge: "DOGE-USDT",
  cardano: "ADA-USDT",
  ada: "ADA-USDT",
  bnb: "BNB-USDT",
  binancecoin: "BNB-USDT",
  polygon: "MATIC-USDT",
  matic: "MATIC-USDT",
  avalanche: "AVAX-USDT",
  avax: "AVAX-USDT",
  chainlink: "LINK-USDT",
  link: "LINK-USDT",
  polkadot: "DOT-USDT",
  dot: "DOT-USDT",
  litecoin: "LTC-USDT",
  ltc: "LTC-USDT",
};

/**
 * @param {string} [token]
 * @param {string} [explicitInstId] - e.g. BTC-USDT from client
 * @returns {string}
 */
export function resolveOkxInstId(token, explicitInstId) {
  const ex = explicitInstId != null ? String(explicitInstId).trim().toUpperCase() : "";
  if (ex && /^[A-Z0-9]+-[A-Z0-9+-]+$/.test(ex)) return ex;

  const key = String(token || "bitcoin").trim().toLowerCase();
  if (TOKEN_TO_INST[key]) return TOKEN_TO_INST[key];
  if (/^[a-z0-9]{1,15}$/.test(key)) return `${key.toUpperCase()}-USDT`;
  return "BTC-USDT";
}

/**
 * @param {string} instId
 * @param {{ bar?: string; limit?: number; signal?: AbortSignal }} [opts]
 * @returns {Promise<{ code: string; msg: string; data: string[][] }>}
 */
export async function fetchOkxCandlesJson(instId, opts = {}) {
  const bar = opts.bar || "1H";
  const limit = Math.min(300, Math.max(20, Number(opts.limit) || 200));
  const url = new URL(OKX_CANDLES_URL);
  url.searchParams.set("instId", instId);
  url.searchParams.set("bar", bar);
  url.searchParams.set("limit", String(limit));

  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
    ...(opts.signal && { signal: opts.signal }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = body?.msg || body?.error || `HTTP ${res.status}`;
    throw new Error(`OKX candles: ${msg}`);
  }
  if (String(body.code) !== "0" || !Array.isArray(body.data)) {
    throw new Error(`OKX candles: ${body.msg || body.code || "invalid response"}`);
  }
  return body;
}

/**
 * @param {{ token?: string; instId?: string; bar?: string; limit?: number; signal?: AbortSignal }} params
 * @returns {Promise<{ instId: string; report: Record<string, unknown> }>}
 */
export async function buildOkxSignalReport(params) {
  const resolvedInst = resolveOkxInstId(params.token, params.instId);
  const body = await fetchOkxCandlesJson(resolvedInst, {
    bar: params.bar,
    limit: params.limit,
    signal: params.signal,
  });
  const engine = new CryptoAnalysisEngine(body, resolvedInst, "OKX_SPOT");
  const report = engine.analyze();
  return { instId: resolvedInst, report };
}
