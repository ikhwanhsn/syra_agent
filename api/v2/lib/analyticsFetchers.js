/**
 * Data fetchers for V2 analytics summary. Each returns the same shape as the
 * corresponding paid endpoint (no params or default params only).
 */
import { dexscreenerRequests } from "../../request/dexscreener.request.js";
import { rugcheckRequests } from "../../request/rugcheck.request.js";
import { smartMoneyRequests } from "../../request/nansen/smart-money.request.js";
import {
  computeCorrelationFromOHLC,
  BINANCE_CORRELATION_TICKER,
} from "../routes/partner/binance/correlation.js";
import { xLiveSearchService } from "../../libs/atxp/xLiveSearchService.js";
import { atxpClient, ATXPAccount } from "@atxp/client";
import {
  fastestHolderGrowthMemecoins,
  memecoinsMostMentionedBySmartMoneyX,
  memecoinsAccumulatingBeforeCEXRumors,
  memecoinsStrongNarrativeLowMarketCap,
  memecoinsByExperiencedDevs,
  memecoinsUnusualWhaleBehavior,
  memecoinsTrendingOnXNotDEX,
  aiMemecoinsOrganicTraction,
  memecoinsSurvivingMarketDumps,
} from "../../prompts/memecoin.js";

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
  const { payer } = await import("@faremeter/rides");
  const PAYER_KEYPAIR = process.env.PAYER_KEYPAIR;
  if (!PAYER_KEYPAIR) throw new Error("PAYER_KEYPAIR must be set");
  await payer.addLocalWallet(PAYER_KEYPAIR);

  const response = await payer.fetch(JUPITER_TRENDING_URL, {
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
  const { payer } = await import("@faremeter/rides");
  const PAYER_KEYPAIR = process.env.PAYER_KEYPAIR;
  if (!PAYER_KEYPAIR) throw new Error("PAYER_KEYPAIR must be set");
  await payer.addLocalWallet(PAYER_KEYPAIR);

  const responses = await Promise.all(
    smartMoneyRequests.map(({ url, payload }) =>
      payer.fetch(url, {
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
  const BASE_URL = process.env.BASE_URL;
  if (!BASE_URL) throw new Error("BASE_URL must be set for correlation");
  const ohlcRes = await fetch(
    `${BASE_URL}/binance/ohlc/batch?symbols=${BINANCE_CORRELATION_TICKER}&interval=1m`
  );
  if (!ohlcRes.ok) {
    const text = await ohlcRes.text().catch(() => "");
    throw new Error(`Binance OHLC ${ohlcRes.status}: ${text}`);
  }
  const ohlcJson = await ohlcRes.json();
  const matrix = computeCorrelationFromOHLC(ohlcJson);
  if (!matrix[DEFAULT_CORRELATION_SYMBOL]) {
    return {
      symbol: DEFAULT_CORRELATION_SYMBOL,
      top: [],
      interval: ohlcJson.interval,
      count: ohlcJson.count,
    };
  }
  const ranked = Object.entries(matrix[DEFAULT_CORRELATION_SYMBOL])
    .filter(([s]) => s !== DEFAULT_CORRELATION_SYMBOL)
    .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
    .slice(0, DEFAULT_CORRELATION_LIMIT);

  return {
    symbol: DEFAULT_CORRELATION_SYMBOL,
    top: ranked.map(([s, v]) => ({ symbol: s, correlation: v })),
    interval: ohlcJson.interval,
    count: ohlcJson.count,
  };
}

/** Run one memecoin ATXP search. Returns { query, result, citations, toolCalls } or throws. */
async function runMemecoinSearch(prompt) {
  const atxpConnectionString = process.env.ATXP_CONNECTION;
  if (!atxpConnectionString) throw new Error("ATXP_CONNECTION must be set");

  const client = await atxpClient({
    mcpServer: xLiveSearchService.mcpServer,
    account: new ATXPAccount(atxpConnectionString),
  });
  const result = await client.callTool({
    name: xLiveSearchService.toolName,
    arguments: xLiveSearchService.getArguments({ query: prompt }),
  });
  const { status, query, message, citations, toolCalls, errorMessage } =
    xLiveSearchService.getResult(result);
  if (status !== "success") throw new Error(errorMessage || "ATXP search failed");
  return { query, result: message, citations, toolCalls };
}

const MEMECOIN_SCREENS = [
  { key: "fastestHolderGrowth", prompt: fastestHolderGrowthMemecoins },
  { key: "mostMentionedBySmartMoneyX", prompt: memecoinsMostMentionedBySmartMoneyX },
  { key: "accumulatingBeforeCEXRumors", prompt: memecoinsAccumulatingBeforeCEXRumors },
  { key: "strongNarrativeLowMarketCap", prompt: memecoinsStrongNarrativeLowMarketCap },
  { key: "byExperiencedDevs", prompt: memecoinsByExperiencedDevs },
  { key: "unusualWhaleBehavior", prompt: memecoinsUnusualWhaleBehavior },
  { key: "trendingOnXNotDEX", prompt: memecoinsTrendingOnXNotDEX },
  { key: "organicTraction", prompt: aiMemecoinsOrganicTraction },
  { key: "survivingMarketDumps", prompt: memecoinsSurvivingMarketDumps },
];

/** All memecoin screens (no params). Requires ATXP_CONNECTION. */
export async function fetchMemecoinScreens() {
  const results = await Promise.allSettled(
    MEMECOIN_SCREENS.map(async ({ key, prompt }) => {
      const data = await runMemecoinSearch(prompt);
      return [key, data];
    })
  );
  const out = {};
  for (let i = 0; i < results.length; i++) {
    const key = MEMECOIN_SCREENS[i].key;
    const r = results[i];
    if (r.status === "fulfilled") {
      out[r.value[0]] = r.value[1];
    } else {
      out[key] = { error: r.reason?.message ?? String(r.reason) };
    }
  }
  return out;
}
