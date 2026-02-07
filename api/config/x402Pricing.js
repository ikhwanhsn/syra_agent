/**
 * x402 API pricing in USD – single place to maintain all x402 endpoint prices.
 * Import the constant that matches your endpoint tier.
 */
export const X402_API_PRICE_USD = 0.01; // 0.15

/** Check-status / health endpoints (minimal fee) */
export const X402_API_PRICE_CHECK_STATUS_USD = 0.0001;

/** News endpoints */
export const X402_API_PRICE_NEWS_USD = 0.01; // 0.1

/** Research / deep research endpoints */
export const X402_API_PRICE_RESEARCH_USD = 0.01; // 0.75

/** Nansen (smart-money, token-god-mode) endpoints */
export const X402_API_PRICE_NANSEN_USD = 0.01; // 0.5

/** DexScreener endpoints */
export const X402_API_PRICE_DEXSCREENER_USD = 0.01; // 0.05

/** Workfun pump endpoint */
export const X402_API_PRICE_PUMP_USD = 0.01; // 0.75

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
