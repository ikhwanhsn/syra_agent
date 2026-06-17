/**
 * Data fetchers for /analytics/summary. Each mirrors the corresponding paid endpoint
 * (trending Jupiter, Nansen smart money, Binance correlation).
 */
import { smartMoneyRequests } from "../request/nansen/smart-money.request.js";
import {
  computeCorrelationFromOHLC,
  BINANCE_CORRELATION_TICKER,
} from "../routes/partner/binance/correlation.js";
import { fetchBinanceOhlcBatch } from "./binanceOhlcBatch.js";

const JUPITER_API_BASE = process.env.JUPITER_API_KEY
  ? "https://api.jup.ag"
  : "https://lite-api.jup.ag";
const JUPITER_TRENDING_URL = `${JUPITER_API_BASE}/tokens/v2/toporganicscore/24h`;
const DEFAULT_CORRELATION_SYMBOL = "BTCUSDT";
const DEFAULT_CORRELATION_LIMIT = 10;

/** Outbound HTTP timeout so one slow partner cannot block /analytics/summary for ~90s. */
function outboundSignal(ms) {
  const n = Number(ms);
  if (!Number.isFinite(n) || n <= 0) return undefined;
  if (typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function") {
    return AbortSignal.timeout(n);
  }
  const c = new AbortController();
  setTimeout(() => c.abort(new Error(`Request timed out after ${n}ms`)), n);
  return c.signal;
}

const JUPITER_FETCH_MS = Number.parseInt(process.env.ANALYTICS_JUPITER_FETCH_MS || "16000", 10);
const NANSEN_FETCH_MS = Number.parseInt(process.env.ANALYTICS_NANSEN_FETCH_MS || "22000", 10);

/** Jupiter trending tokens (no params). Uses direct Jupiter API (JUPITER_API_KEY optional). */
export async function fetchTrendingJupiter() {
  const headers = { "Content-Type": "application/json" };
  if (process.env.JUPITER_API_KEY) {
    headers["x-api-key"] = process.env.JUPITER_API_KEY;
  }

  const response = await fetch(JUPITER_TRENDING_URL, {
    method: "GET",
    headers,
    signal: outboundSignal(JUPITER_FETCH_MS),
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Jupiter ${response.status}: ${text}`);
  }
  const data = await response.json();
  const items = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
  const contractAddresses = items
    .map((item) => item?.id || item?.mint || item?.address)
    .filter(Boolean);
  return {
    contractAddresses,
    content: null,
    tokenSummary: null,
    newsSummary: null,
  };
}

/** Nansen smart money (no params). Requires PAYER_KEYPAIR. */
export async function fetchSmartMoney() {
  const { getNansenPaymentFetch } = await import("./sentinelPayer.js");
  const nansenFetch = await getNansenPaymentFetch();
  const signal = outboundSignal(NANSEN_FETCH_MS);

  const responses = await Promise.all(
    smartMoneyRequests.map(({ url, payload }) =>
      nansenFetch(url, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal,
      })
    )
  );
  for (const r of responses) {
    if (!r.ok) {
      const text = await r.text().catch(() => "");
      throw new Error(`Smart money ${r.status}: ${text}`);
    }
  }
  const allData = await Promise.all(responses.map((r) => r.json()));
  return {
    "smart-money/netflow": allData[0],
    "smart-money/holdings": allData[1],
    "smart-money/historical-holdings": allData[2],
    "smart-money/dex-trades": allData[3],
    "smart-money/dcas": allData[4],
  };
}

/** Binance correlation with default symbol (BTCUSDT) and limit (10). */
export async function fetchBinanceCorrelation() {
  const ohlcPayload = await fetchBinanceOhlcBatch(BINANCE_CORRELATION_TICKER, "1m");
  const matrix = computeCorrelationFromOHLC(ohlcPayload);
  if (!matrix || !matrix[DEFAULT_CORRELATION_SYMBOL]) {
    return {
      symbol: DEFAULT_CORRELATION_SYMBOL,
      top: [],
      interval: ohlcPayload.interval,
      count: ohlcPayload.count,
    };
  }
  const ranked = Object.entries(matrix[DEFAULT_CORRELATION_SYMBOL])
    .filter(([s]) => s !== DEFAULT_CORRELATION_SYMBOL)
    .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
    .slice(0, DEFAULT_CORRELATION_LIMIT);

  return {
    symbol: DEFAULT_CORRELATION_SYMBOL,
    top: ranked.map(([s, v]) => ({ symbol: s, correlation: v })),
    interval: ohlcPayload.interval,
    count: ohlcPayload.count,
  };
}
