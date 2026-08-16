/**
 * On-chain fill quotes for xStocks paper trading.
 * NASDAQ is reference-only. Entry and exit must share this same source.
 */
import { fetchNasdaqPrice, fetchOnchainTokenPrice, computeSpread } from "./equityPriceFetchers.js";
import { recordStocksPriceSample } from "./stocksPriceMomentum.js";
import { isTradableStocksQuote } from "./stocksSimMath.js";

const JUPITER_API_BASE = process.env.JUPITER_API_KEY ? "https://api.jup.ag" : "https://lite-api.jup.ag";
const JUPITER_PRICE_API = `${JUPITER_API_BASE}/price/v2`;

const CACHE_TTL_MS = 30_000;
/** @type {Map<string, { expires: number; quote: object }>} */
const quoteCache = new Map();

/**
 * @param {string[]} mints
 * @returns {Promise<Record<string, number>>}
 */
export async function fetchJupiterPricesForMints(mints) {
  const unique = [...new Set(mints.filter(Boolean))];
  if (!unique.length) return {};

  /** @type {Record<string, number>} */
  const out = {};
  const chunkSize = 50;
  const apiKey = process.env.JUPITER_API_KEY?.trim();

  for (let i = 0; i < unique.length; i += chunkSize) {
    const chunk = unique.slice(i, i + chunkSize);
    const url = `${JUPITER_PRICE_API}?ids=${chunk.map(encodeURIComponent).join(",")}`;
    try {
      const headers = { Accept: "application/json" };
      if (apiKey) headers["x-api-key"] = apiKey;
      const res = await fetch(url, { headers, signal: AbortSignal.timeout(12_000) });
      if (!res.ok) continue;
      const json = await res.json();
      const data = json?.data ?? json;
      for (const mint of chunk) {
        const row = data?.[mint];
        const px = row?.price ?? row?.usdPrice ?? row?.priceUsd;
        if (typeof px === "number" && Number.isFinite(px) && px > 0) {
          out[mint] = px;
        }
      }
    } catch (e) {
      console.warn("[stocksPriceFeed] Jupiter fetch failed:", e?.message || e);
    }
  }

  return out;
}

function spreadPctFrom(onchainPx, nasdaqPx) {
  if (!(onchainPx > 0) || !(nasdaqPx > 0)) return null;
  const { spreadPct } = computeSpread(nasdaqPx, onchainPx);
  return Math.abs(spreadPct);
}

/**
 * Fill quote for one mint. Never returns a NASDAQ-only price as a fill.
 * @param {string} mint
 * @param {string | null} [nasdaqTicker]
 * @param {string | null} [symbol]
 * @returns {Promise<{
 *   priceUsd: number;
 *   source: string;
 *   nasdaqPriceUsd?: number;
 *   liquidityUsd?: number | null;
 *   priceChange24h?: number | null;
 *   spreadPct?: number | null;
 * } | null>}
 */
export async function fetchStockPrice(mint, nasdaqTicker = null, symbol = null) {
  if (!mint) return null;
  const cacheKey = `${mint}:${nasdaqTicker || ""}`;
  const cached = quoteCache.get(cacheKey);
  if (cached && Date.now() < cached.expires) return cached.quote;

  const jupPrices = await fetchJupiterPricesForMints([mint]);
  let nasdaqPriceUsd;
  if (nasdaqTicker) {
    const nasdaq = await fetchNasdaqPrice(nasdaqTicker);
    if (nasdaq?.priceUsd > 0) nasdaqPriceUsd = nasdaq.priceUsd;
  }

  let dex = null;
  try {
    dex = await fetchOnchainTokenPrice(mint, { referencePriceUsd: nasdaqPriceUsd });
  } catch {
    dex = null;
  }

  const jupPx = jupPrices[mint] ?? null;
  const dexPx = dex?.priceUsd > 0 ? dex.priceUsd : null;
  const liquidityUsd = dex?.liquidityUsd ?? null;
  const priceChange24h = dex?.priceChange24h ?? null;

  let priceUsd = null;
  let source = null;
  if (jupPx > 0) {
    priceUsd = jupPx;
    source = "jupiter";
  } else if (dexPx > 0) {
    priceUsd = dexPx;
    source = "dexscreener";
  }

  if (!(priceUsd > 0) || !source) return null;

  const spreadPct = spreadPctFrom(priceUsd, nasdaqPriceUsd);
  const quote = {
    priceUsd,
    source,
    nasdaqPriceUsd,
    liquidityUsd,
    priceChange24h,
    spreadPct,
  };

  const tradable = isTradableStocksQuote(quote);
  if (!tradable.ok) return null;

  quoteCache.set(cacheKey, { expires: Date.now() + CACHE_TTL_MS, quote });

  if (symbol) {
    void recordStocksPriceSample({
      symbol,
      mint,
      nasdaqTicker,
      priceUsd,
      source,
      liquidityUsd,
      spreadPct,
      priceChange24h,
    }).catch(() => {});
  }

  return quote;
}

/**
 * @param {Array<{ mint: string; nasdaqTicker?: string | null; symbol?: string | null }>} entries
 * @returns {Promise<Record<string, {
 *   priceUsd: number;
 *   source: string;
 *   nasdaqPriceUsd?: number;
 *   liquidityUsd?: number | null;
 *   priceChange24h?: number | null;
 *   spreadPct?: number | null;
 * }>>}
 */
export async function fetchStockPricesBatch(entries) {
  /** @type {Record<string, object>} */
  const out = {};

  await Promise.all(
    entries.map(async (entry) => {
      const result = await fetchStockPrice(
        entry.mint,
        entry.nasdaqTicker ?? null,
        entry.symbol ?? null,
      );
      if (!result) return;
      const key = entry.symbol || entry.mint;
      out[key] = result;
      if (entry.mint && entry.mint !== key) out[entry.mint] = result;
    }),
  );

  return out;
}
