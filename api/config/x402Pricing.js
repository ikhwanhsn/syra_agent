/**
 * x402 API pricing in USD – single place to maintain all x402 endpoint prices.
 * Import the constant that matches your endpoint tier.
 *
 * Environment-based pricing:
 * - Local (NODE_ENV !== 'production'): cheap prices for testing
 * - Production: 100x base price ("kill 1 zero" = 10x previous production price)
 */
const isProduction = process.env.NODE_ENV === 'production';
const mult = isProduction ? 100 : 0.01; // production: 100x (kill 1 zero); local: 1/100 (cheap)

const price = (base) => base * mult;

export const X402_API_PRICE_USD = price(0.01);

/** Check-status / health endpoints (minimal fee) */
export const X402_API_PRICE_CHECK_STATUS_USD = price(0.0001);

/** News endpoints */
export const X402_API_PRICE_NEWS_USD = price(0.01);

/** Research / deep research endpoints */
export const X402_API_PRICE_RESEARCH_USD = price(0.01);

/** Nansen (smart-money, token-god-mode) endpoints */
export const X402_API_PRICE_NANSEN_USD = price(0.01);

/** DexScreener endpoints */
export const X402_API_PRICE_DEXSCREENER_USD = price(0.01);

/** Workfun pump endpoint */
export const X402_API_PRICE_PUMP_USD = price(0.01);

/** Jupiter swap order (buy/sell token via Corbits Jupiter Ultra) */
export const X402_API_PRICE_JUPITER_SWAP_USD = price(0.02);

/** CoinGecko x402 (onchain search pools, trending pools, token by address) */
export const X402_API_PRICE_COINGECKO_USD = price(0.01);

/**
 * Analytics summary: sum of all tools included in GET/POST /v2/analytics/summary.
 * (dexscreener + token-statistic + trending-jupiter + smart-money + binance correlation + 9 memecoin screens)
 */
export const X402_API_PRICE_ANALYTICS_SUMMARY_USD =
  X402_API_PRICE_DEXSCREENER_USD +
  X402_API_PRICE_USD + // token-statistic
  X402_API_PRICE_USD + // trending-jupiter
  X402_API_PRICE_NANSEN_USD + // smart-money
  X402_API_PRICE_USD + // binance correlation
  9 * X402_API_PRICE_USD; // 9 memecoin screens
