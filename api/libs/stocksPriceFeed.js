/**
 * Jupiter + reference price feed for xStocks paper trading.
 */
import { fetchNasdaqPrice, fetchOnchainTokenPrice } from "./equityPriceFetchers.js";

const JUPITER_API_BASE = process.env.JUPITER_API_KEY ? "https://api.jup.ag" : "https://lite-api.jup.ag";
const JUPITER_PRICE_API = `${JUPITER_API_BASE}/price/v2`;

const CACHE_TTL_MS = 30_000;
/** @type {Map<string, { expires: number; priceUsd: number }>} */
const priceCache = new Map();

/**
 * @param {string[]} mints
 * @returns {Promise<Record<string, number>>}
 */
export async function fetchJupiterPricesForMints(mints) {
  const unique = [...new Set(mints.filter(Boolean))];
  if (!unique.length) return {};

  /** @type {Record<string, number>} */
  const out = {};
  const toFetch = [];

  for (const mint of unique) {
    const cached = priceCache.get(mint);
    if (cached && Date.now() < cached.expires) {
      out[mint] = cached.priceUsd;
    } else {
      toFetch.push(mint);
    }
  }

  if (toFetch.length === 0) return out;

  const chunkSize = 50;
  const apiKey = process.env.JUPITER_API_KEY?.trim();

  for (let i = 0; i < toFetch.length; i += chunkSize) {
    const chunk = toFetch.slice(i, i + chunkSize);
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
          priceCache.set(mint, { expires: Date.now() + CACHE_TTL_MS, priceUsd: px });
        }
      }
    } catch (e) {
      console.warn("[stocksPriceFeed] Jupiter fetch failed:", e?.message || e);
    }
  }

  return out;
}

/**
 * @param {string} mint
 * @param {string | null} [nasdaqTicker]
 * @returns {Promise<{ priceUsd: number; source: string; nasdaqPriceUsd?: number } | null>}
 */
export async function fetchStockPrice(mint, nasdaqTicker = null) {
  if (!mint) return null;

  const jupPrices = await fetchJupiterPricesForMints([mint]);
  let priceUsd = jupPrices[mint] ?? null;
  let source = "jupiter";

  if (!(priceUsd > 0)) {
    try {
      const dex = await fetchOnchainTokenPrice(mint);
      if (dex?.priceUsd > 0) {
        priceUsd = dex.priceUsd;
        source = "dexscreener";
      }
    } catch {
      /* fallback */
    }
  }

  let nasdaqPriceUsd;
  if (nasdaqTicker) {
    const nasdaq = await fetchNasdaqPrice(nasdaqTicker);
    if (nasdaq?.priceUsd > 0) nasdaqPriceUsd = nasdaq.priceUsd;
  }

  if (!(priceUsd > 0) && nasdaqPriceUsd > 0) {
    priceUsd = nasdaqPriceUsd;
    source = "nasdaq_reference";
  }

  if (!(priceUsd > 0)) return null;

  return { priceUsd, source, nasdaqPriceUsd };
}

/**
 * @param {Array<{ mint: string; nasdaqTicker?: string | null }>} entries
 * @returns {Promise<Record<string, { priceUsd: number; source: string; nasdaqPriceUsd?: number }>>}
 */
export async function fetchStockPricesBatch(entries) {
  const mints = entries.map((e) => e.mint).filter(Boolean);
  const jupPrices = await fetchJupiterPricesForMints(mints);

  /** @type {Record<string, { priceUsd: number; source: string; nasdaqPriceUsd?: number }>} */
  const out = {};

  await Promise.all(
    entries.map(async (entry) => {
      const result = await fetchStockPrice(entry.mint, entry.nasdaqTicker ?? null);
      if (result) {
        if (!result.priceUsd && jupPrices[entry.mint]) {
          result.priceUsd = jupPrices[entry.mint];
          result.source = "jupiter";
        }
        out[entry.symbol ?? entry.mint] = result;
      } else if (jupPrices[entry.mint]) {
        out[entry.symbol ?? entry.mint] = {
          priceUsd: jupPrices[entry.mint],
          source: "jupiter",
        };
      }
    }),
  );

  return out;
}
