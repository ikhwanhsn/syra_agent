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

const JUPITER_TRENDING_URL =
  "https://jupiter.api.corbits.dev/tokens/v2/content/cooking";
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

/** Jupiter trending tokens (no params). Requires PAYER_KEYPAIR. */
export async function fetchTrendingJupiter() {
  const { payer, getSentinelPayerFetch } = await import("./sentinelPayer.js");
  const PAYER_KEYPAIR = process.env.PAYER_KEYPAIR;
  if (!PAYER_KEYPAIR) throw new Error("PAYER_KEYPAIR must be set");
  await payer.addLocalWallet(PAYER_KEYPAIR);

  const response = await getSentinelPayerFetch()(JUPITER_TRENDING_URL, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    signal: outboundSignal(JUPITER_FETCH_MS),
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Jupiter ${response.status}: ${text}`);
  }
  const data = await response.json();
  return {
    contractAddresses: data?.data?.map((item) => item.mint),
    content: data?.data?.map((item) =>
      item.contents.map((i) => i.content)
    ),
    tokenSummary: data?.data?.map((item) => item.tokenSummary),
    newsSummary: data?.data?.map((item) => item.newsSummary),
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
