/**
 * OKX public market candles + CryptoAnalysisEngine for /signal?source=okx
 */
import { CryptoAnalysisEngine } from "../scripts/cryptoAnalysisEngine.js";
import { lastClosedAnchorFromSortedOpens } from "./experimentCandleAnchor.js";

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
  tron: "TRX-USDT",
  trx: "TRX-USDT",
  shib: "SHIB-USDT",
  "shiba-inu": "SHIB-USDT",
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

/** OKX v5 /market/candles `bar` values (minutes lowercase `m`, hours uppercase `H`). */
const OKX_MINUTE_BARS = new Set(["1m", "3m", "5m", "15m", "30m"]);
const OKX_HOUR_VALUES = [1, 2, 4, 6, 12];

/**
 * Map Binance-style / generic `bar` to OKX `bar`. OKX rejects e.g. `1h` (must be `1H`).
 * @param {string | number | undefined | null} bar
 * @returns {string}
 */
export function toOkxBar(bar) {
  if (bar == null || bar === "") return "1H";
  const raw = String(bar).trim();
  if (!raw) return "1H";

  const lower = raw.toLowerCase();

  /** Minute candles: OKX uses `1m`, `3m`, … (lowercase m only). */
  const minMatch = lower.match(/^(\d+)m$/);
  if (minMatch) {
    const n = minMatch[1];
    const key = `${n}m`;
    if (OKX_MINUTE_BARS.has(key)) return key;
    const asNum = parseInt(n, 10);
    if (asNum === 60) return "1H";
    if (asNum === 120) return "2H";
    if (asNum === 240) return "4H";
    if (asNum === 360) return "6H";
    if (asNum === 720) return "12H";
    if (asNum === 1440) return "1D";
    return "15m";
  }

  if (lower === "1s") return "1s";

  /** Hours: OKX requires `1H`, `2H`, … not `1h`. */
  const hourMatch = raw.match(/^(\d+)\s*([hH])$/);
  if (hourMatch) {
    const num = parseInt(hourMatch[1], 10);
    if (num >= 24) return "1D";
    if (OKX_HOUR_VALUES.includes(num)) return `${num}H`;
    let best = OKX_HOUR_VALUES[0];
    let bestDiff = Math.abs(num - best);
    for (const h of OKX_HOUR_VALUES) {
      const d = Math.abs(num - h);
      if (d < bestDiff) {
        best = h;
        bestDiff = d;
      }
    }
    return `${best}H`;
  }

  if (lower === "1d" || lower === "3d" || lower === "1day") return "1D";
  if (lower === "1w" || lower === "1week") return "1W";
  if (lower === "1mo" || lower === "1month" || lower === "1mon" || raw === "1M") return "1M";
  if (lower === "3mo" || lower === "3month") return "3M";
  if (lower === "6mo") return "6M";
  if (lower === "1y" || lower === "1yr") return "1Y";

  const OKX_LITERAL = new Set([
    "1s",
    "1m",
    "3m",
    "5m",
    "15m",
    "30m",
    "1H",
    "2H",
    "4H",
    "6H",
    "12H",
    "1D",
    "1W",
    "1M",
    "3M",
    "6M",
    "1Y",
  ]);
  const fixedH = raw.trim().replace(/^(\d+)h$/i, (_, n) => `${n}H`);
  if (OKX_LITERAL.has(raw.trim())) return raw.trim();
  if (OKX_LITERAL.has(fixedH)) return fixedH;

  return "1H";
}

/**
 * OKX `bar` string (e.g. 1m, 4H, 1D) → candle length in ms.
 * @param {string} okxBar
 * @returns {number}
 */
export function okxBarDurationMs(okxBar) {
  const s = String(okxBar).trim();
  const mi = s.match(/^(\d+)m$/i);
  if (mi) return parseInt(mi[1], 10) * 60_000;
  const hi = s.match(/^(\d+)H$/i);
  if (hi) return parseInt(hi[1], 10) * 3_600_000;
  if (s === "1D") return 86_400_000;
  if (s === "1W") return 604_800_000;
  if (s === "1M" || s === "3M" || s === "6M" || s === "1Y") return 86_400_000;
  return 3_600_000;
}

/**
 * @param {string} instId
 * @param {{ bar?: string; limit?: number; signal?: AbortSignal; before?: string|number; after?: string|number }} [opts]
 * @returns {Promise<{ code: string; msg: string; data: string[][] }>}
 */
export async function fetchOkxCandlesJson(instId, opts = {}) {
  const bar = toOkxBar(opts.bar);
  const limit = Math.min(300, Math.max(20, Number(opts.limit) || 200));
  const url = new URL(OKX_CANDLES_URL);
  url.searchParams.set("instId", instId);
  url.searchParams.set("bar", bar);
  url.searchParams.set("limit", String(limit));
  if (opts.before != null && String(opts.before).trim() !== "") {
    url.searchParams.set("before", String(opts.before));
  }
  if (opts.after != null && String(opts.after).trim() !== "") {
    url.searchParams.set("after", String(opts.after));
  }

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
 * @returns {Promise<{ instId: string; report: Record<string, unknown>; anchorCloseMs: number | null }>}
 */
export async function buildOkxSignalReport(params) {
  const resolvedInst = resolveOkxInstId(params.token, params.instId);
  const okxBar = toOkxBar(params.bar);
  const body = await fetchOkxCandlesJson(resolvedInst, {
    bar: params.bar,
    limit: params.limit,
    signal: params.signal,
  });
  const opens = body.data
    .map((r) => Number(r[0]))
    .filter((x) => Number.isFinite(x))
    .sort((a, b) => a - b);
  const anchorCloseMs = lastClosedAnchorFromSortedOpens(opens, okxBarDurationMs(okxBar));
  const engine = new CryptoAnalysisEngine(body, resolvedInst, "OKX_SPOT");
  const report = engine.analyze();
  return { instId: resolvedInst, report, anchorCloseMs };
}
