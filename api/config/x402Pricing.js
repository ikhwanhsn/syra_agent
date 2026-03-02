/**
 * x402 API pricing in USD – single place to maintain all x402 endpoint prices.
 * Import the constant that matches your endpoint tier.
 *
 * Environment-based pricing:
 * - Local (NODE_ENV !== 'production'): cheap prices for testing
 * - Production: 10x base price (kill 1 zero from previous 100x)
 *
 * Playground dev wallet: in production, when the connected wallet is this address
 * (e.g. from X-Payer-Address header), use local-like pricing for API playground testing.
 *
 * Display/catalog prices: always production (base * 10) so the UI shows real API cost.
 */
const isProduction = process.env.NODE_ENV === 'production';
const mult = isProduction ? 10 : 0.01; // production: 10x (kill 1 zero from previous 100x); local: 1/100 (cheap)
const PRODUCTION_MULT = 10;

/** Solana address: when this wallet is the payer in production, use local (cheap) price. */
export const X402_PLAYGROUND_DEV_WALLET = 'FiejqEgqQ8bxtUJpZMy5p1wVCcejKyy5PgZ4cwmLBvYD';

/** Base (EVM) address: same dev pricing in production when this wallet is the payer. */
export const X402_PLAYGROUND_DEV_WALLET_BASE = '0xF9dcBFF7EdDd76c58412fd46f4160c96312ce734';

/** All playground dev wallet addresses (Solana + Base). Payer matching any gets local-like price in production. */
const PLAYGROUND_DEV_WALLETS = [X402_PLAYGROUND_DEV_WALLET, X402_PLAYGROUND_DEV_WALLET_BASE];

const LOCAL_MULT = 0.01;

/**
 * Effective price for a given payer. In production, when payerAddress matches
 * a playground dev wallet (Solana or Base), returns price as if local (cheap). Otherwise returns priceUsd unchanged.
 * @param {number} priceUsd - Price in USD (typically the route's production price).
 * @param {string|null|undefined} payerAddress - Payer wallet (e.g. from X-Payer-Address header).
 * @returns {number} Effective price in USD.
 */
export function getEffectivePriceUsd(priceUsd, payerAddress) {
  if (priceUsd == null || Number.isNaN(priceUsd)) return priceUsd;
  if (!isProduction) return priceUsd; // local already uses cheap price
  const payer = typeof payerAddress === 'string' ? payerAddress.trim() : '';
  if (!payer) return priceUsd;
  const payerLower = payer.toLowerCase();
  const isDevWallet = PLAYGROUND_DEV_WALLETS.some(
    (dev) => payer === dev || payerLower === dev.toLowerCase()
  );
  if (!isDevWallet) return priceUsd;
  // Production price = base * 10; we want base * 0.01 (local). So effective = priceUsd * (0.01/10) = priceUsd * 0.001
  return priceUsd * (LOCAL_MULT / PRODUCTION_MULT);
}

const price = (base) => base * mult;

export const X402_API_PRICE_USD = price(0.01);

/** Check-status / health endpoints (minimal fee) */
export const X402_API_PRICE_CHECK_STATUS_USD = price(0.0001);

/** News endpoints */
export const X402_API_PRICE_NEWS_USD = price(0.01);

/** Research / deep research endpoints */
export const X402_API_PRICE_RESEARCH_USD = price(0.01);

/** Nansen Basic tier — $0.01/call (profiler current/historical balance, transactions, tgm transfers, flows, etc.) */
export const X402_API_PRICE_NANSEN_USD = price(0.01);

/** Nansen Premium / Smart Money tier — $0.05/call (counterparties, holders, leaderboards, smart-money netflow/holdings/dex-trades) */
export const X402_API_PRICE_NANSEN_PREMIUM_USD = price(0.05);

/** DexScreener endpoints */
export const X402_API_PRICE_DEXSCREENER_USD = price(0.01);

/** Jupiter swap order (buy/sell token via Corbits Jupiter Ultra) */
export const X402_API_PRICE_JUPITER_SWAP_USD = price(0.02);

/** CoinGecko x402 (onchain search pools, trending pools, token by address) */
export const X402_API_PRICE_COINGECKO_USD = price(0.01);

/** EXA search (dynamic web search via Exa AI) */
export const X402_API_PRICE_EXA_SEARCH_USD = price(0.01);

/**
 * Analytics summary: sum of all tools included in GET/POST /analytics/summary.
 * (dexscreener + token-statistic + trending-jupiter + smart-money + binance correlation)
 */
export const X402_API_PRICE_ANALYTICS_SUMMARY_USD =
  X402_API_PRICE_DEXSCREENER_USD +
  X402_API_PRICE_USD + // token-statistic
  X402_API_PRICE_USD + // trending-jupiter
  X402_API_PRICE_NANSEN_USD + // smart-money
  X402_API_PRICE_USD; // binance correlation

/** Display prices: real API cost (production level = base * 10). Use for tools list/catalog so UI matches actual cost. */
export const X402_DISPLAY_PRICE_USD = 0.01 * PRODUCTION_MULT;
export const X402_DISPLAY_PRICE_CHECK_STATUS_USD = 0.0001 * PRODUCTION_MULT;
export const X402_DISPLAY_PRICE_NEWS_USD = 0.01 * PRODUCTION_MULT;
export const X402_DISPLAY_PRICE_RESEARCH_USD = 0.01 * PRODUCTION_MULT;
export const X402_DISPLAY_PRICE_NANSEN_USD = 0.01 * PRODUCTION_MULT;
export const X402_DISPLAY_PRICE_NANSEN_PREMIUM_USD = 0.05 * PRODUCTION_MULT;
export const X402_DISPLAY_PRICE_DEXSCREENER_USD = 0.01 * PRODUCTION_MULT;
export const X402_DISPLAY_PRICE_JUPITER_SWAP_USD = 0.02 * PRODUCTION_MULT;
export const X402_DISPLAY_PRICE_COINGECKO_USD = 0.01 * PRODUCTION_MULT;
export const X402_DISPLAY_PRICE_EXA_SEARCH_USD = 0.01 * PRODUCTION_MULT;
export const X402_DISPLAY_PRICE_ANALYTICS_SUMMARY_USD =
  X402_DISPLAY_PRICE_DEXSCREENER_USD +
  X402_DISPLAY_PRICE_USD +
  X402_DISPLAY_PRICE_USD +
  X402_DISPLAY_PRICE_NANSEN_USD +
  X402_DISPLAY_PRICE_USD;
