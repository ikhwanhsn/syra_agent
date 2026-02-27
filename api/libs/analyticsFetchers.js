/**
 * Data fetchers for V2 analytics summary. Each returns the same shape as the
 * corresponding paid endpoint (no params or default params only).
 */
import { dexscreenerRequests } from "../request/dexscreener.request.js";
import { rugcheckRequests } from "../request/rugcheck.request.js";
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

/** Dexscreener: token profiles, takeovers, ads, boosts (no params). */
export async function fetchDexscreener() {
  const responses = await Promise.all(
    dexscreenerRequests.map(({ url }) => fetch(url))
  );
  for (const r of responses) {
    if (!r.ok) {
      const text = await r.text().catch(() => "");
      throw new Error(`Dexscreener ${r.status}: ${text}`);
    }
  }
  const allData = await Promise.all(responses.map((r) => r.json()));
  return {
    "dexscreener/token-profiles": allData[0],
    "dexscreener/community-takeovers": allData[1],
    "dexscreener/ads": allData[2],
    "dexscreener/token-boosts": allData[3],
    "dexscreener/token-boosts-top": allData[4],
  };
}

/** Rugcheck token stats: new, recent, trending, verified (no params). */
export async function fetchTokenStatistic() {
  const responses = await Promise.all(
    rugcheckRequests.map(({ url }) => fetch(url))
  );
  for (const r of responses) {
    if (!r.ok) {
      const text = await r.text().catch(() => "");
      throw new Error(`Rugcheck ${r.status}: ${text}`);
    }
  }
  const allData = await Promise.all(responses.map((r) => r.json()));
  return {
    "rugcheck/new_tokens": allData[0],
    "rugcheck/recent": allData[1],
    "rugcheck/trending": allData[2],
    "rugcheck/verified": allData[3],
  };
}

/** Jupiter trending tokens (no params). Requires PAYER_KEYPAIR. */
export async function fetchTrendingJupiter() {
  const { payer, getSentinelPayerFetch } = await import("./sentinelPayer.js");
  const PAYER_KEYPAIR = process.env.PAYER_KEYPAIR;
  if (!PAYER_KEYPAIR) throw new Error("PAYER_KEYPAIR must be set");
  await payer.addLocalWallet(PAYER_KEYPAIR);

  const response = await getSentinelPayerFetch()(JUPITER_TRENDING_URL, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
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
  const { payer, getSentinelPayerFetch } = await import("./sentinelPayer.js");
  const PAYER_KEYPAIR = process.env.PAYER_KEYPAIR;
  if (!PAYER_KEYPAIR) throw new Error("PAYER_KEYPAIR must be set");
  await payer.addLocalWallet(PAYER_KEYPAIR);

  const responses = await Promise.all(
    smartMoneyRequests.map(({ url, payload }) =>
      getSentinelPayerFetch()(url, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
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

