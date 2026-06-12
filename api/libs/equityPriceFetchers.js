/**
 * Price fetchers for tokenized equities — Nasdaq reference + on-chain (DexScreener).
 */

const DEXSCREENER_TOKEN_URL = "https://api.dexscreener.com/latest/dex/tokens";
const YAHOO_CHART_URL = "https://query1.finance.yahoo.com/v8/finance/chart";

/** @typedef {{ priceUsd: number; source: string; fetchedAt: string; meta?: Record<string, unknown> }} PriceQuote */

/**
 * Fetch Nasdaq/traditional equity price via Yahoo Finance chart API.
 * @param {string} ticker - e.g. SPCX, TSLA
 * @param {number} [fallbackPriceUsd]
 * @returns {Promise<PriceQuote | null>}
 */
export async function fetchNasdaqPrice(ticker, fallbackPriceUsd) {
  const sym = String(ticker || "").trim().toUpperCase();
  if (!sym) return null;

  try {
    const url = `${YAHOO_CHART_URL}/${encodeURIComponent(sym)}?interval=1m&range=1d`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Syra-Equity-Intel/1.0" },
      signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok) throw new Error(`Yahoo chart HTTP ${res.status}`);
    const json = await res.json();
    const result = json?.chart?.result?.[0];
    const meta = result?.meta;
    const price =
      meta?.regularMarketPrice ??
      meta?.previousClose ??
      meta?.chartPreviousClose ??
      null;

    if (typeof price === "number" && Number.isFinite(price) && price > 0) {
      return {
        priceUsd: price,
        source: "yahoo_finance",
        fetchedAt: new Date().toISOString(),
        meta: {
          symbol: meta?.symbol,
          currency: meta?.currency,
          exchange: meta?.exchangeName,
          marketState: meta?.marketState,
        },
      };
    }
  } catch (e) {
    console.warn("[equityPriceFetchers] Nasdaq fetch failed:", e?.message || e);
  }

  if (
    typeof fallbackPriceUsd === "number" &&
    Number.isFinite(fallbackPriceUsd) &&
    fallbackPriceUsd > 0
  ) {
    return {
      priceUsd: fallbackPriceUsd,
      source: "reference_fallback",
      fetchedAt: new Date().toISOString(),
      meta: { note: "Live Nasdaq quote unavailable; using IPO reference price" },
    };
  }

  return null;
}

/** Min/max ratio vs Nasdaq reference for accepting a DEX quote as real equity liquidity. */
const EQUITY_PRICE_SANITY_MIN_RATIO = 0.25;
const EQUITY_PRICE_SANITY_MAX_RATIO = 4;

/**
 * @param {number} priceUsd
 * @param {number | undefined} referencePriceUsd
 * @returns {boolean}
 */
export function isPlausibleEquityDexPrice(priceUsd, referencePriceUsd) {
  if (!Number.isFinite(priceUsd) || priceUsd <= 0) return false;
  if (!referencePriceUsd || !Number.isFinite(referencePriceUsd) || referencePriceUsd <= 0) {
    return true;
  }
  const ratio = priceUsd / referencePriceUsd;
  return ratio >= EQUITY_PRICE_SANITY_MIN_RATIO && ratio <= EQUITY_PRICE_SANITY_MAX_RATIO;
}

/**
 * Fetch on-chain token price from DexScreener (best-liquidity pair).
 * For tokenized equities, rejects quotes that deviate wildly from Nasdaq reference
 * (filters scam tickers impersonating SPCXx at $0.01).
 * @param {string} mint
 * @param {{ referencePriceUsd?: number }} [opts]
 * @returns {Promise<PriceQuote & { liquidityUsd?: number; volume24h?: number; priceChange24h?: number; verified?: boolean } | null>}
 */
export async function fetchOnchainTokenPrice(mint, opts = {}) {
  const address = String(mint || "").trim();
  if (!address || address.length < 32) return null;
  const referencePriceUsd = opts.referencePriceUsd;

  try {
    const url = `${DEXSCREENER_TOKEN_URL}/${address}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(12_000) });
    if (!res.ok) throw new Error(`DexScreener HTTP ${res.status}`);
    const json = await res.json();
    const pairs = Array.isArray(json?.pairs) ? json.pairs : [];
    const solanaPairs = pairs.filter((p) => p?.chainId === "solana");
    if (!solanaPairs.length) return null;

    const ranked = [...solanaPairs].sort(
      (a, b) => (Number(b?.liquidity?.usd) || 0) - (Number(a?.liquidity?.usd) || 0),
    );

    for (const pair of ranked) {
      const priceUsd = Number(pair?.priceUsd);
      if (!Number.isFinite(priceUsd) || priceUsd <= 0) continue;

      const plausible = isPlausibleEquityDexPrice(priceUsd, referencePriceUsd);
      if (!plausible) continue;

      return {
        priceUsd,
        source: "dexscreener",
        fetchedAt: new Date().toISOString(),
        verified: true,
        liquidityUsd: Number(pair?.liquidity?.usd) || undefined,
        volume24h: Number(pair?.volume?.h24) || undefined,
        priceChange24h: Number(pair?.priceChange?.h24) || undefined,
        meta: {
          dexId: pair?.dexId,
          pairAddress: pair?.pairAddress,
          baseSymbol: pair?.baseToken?.symbol,
          quoteSymbol: pair?.quoteToken?.symbol,
        },
      };
    }

    // Pairs exist but none pass equity sanity — likely impersonator/scam pool
    const top = ranked[0];
    const rejectPrice = Number(top?.priceUsd);
    if (Number.isFinite(rejectPrice) && referencePriceUsd) {
      return {
        priceUsd: null,
        source: "dexscreener_rejected",
        fetchedAt: new Date().toISOString(),
        verified: false,
        liquidityUsd: Number(top?.liquidity?.usd) || undefined,
        meta: {
          rejectedPriceUsd: rejectPrice,
          reason: "on_chain_price_inconsistent_with_nasdaq",
          note: "DEX pools found but prices do not match expected equity value — likely impersonator token",
          dexId: top?.dexId,
          pairAddress: top?.pairAddress,
        },
      };
    }

    return null;
  } catch (e) {
    console.warn("[equityPriceFetchers] On-chain fetch failed:", e?.message || e);
    return null;
  }
}

/**
 * Compute premium/discount spread between Nasdaq and on-chain price.
 * Positive = on-chain trading at premium vs Nasdaq.
 * @param {number} nasdaqPrice
 * @param {number} onchainPrice
 * @returns {{ spreadPct: number; spreadUsd: number; label: 'premium' | 'discount' | 'parity' }}
 */
export function computeSpread(nasdaqPrice, onchainPrice) {
  if (
    !Number.isFinite(nasdaqPrice) ||
    !Number.isFinite(onchainPrice) ||
    nasdaqPrice <= 0
  ) {
    return { spreadPct: 0, spreadUsd: 0, label: "parity" };
  }
  const spreadUsd = onchainPrice - nasdaqPrice;
  const spreadPct = (spreadUsd / nasdaqPrice) * 100;
  const label =
    Math.abs(spreadPct) < 0.5 ? "parity" : spreadPct > 0 ? "premium" : "discount";
  return { spreadPct, spreadUsd, label };
}
