/**
 * x402 API pricing in USD – single place to maintain all x402 endpoint prices.
 * Import the constant that matches your endpoint tier.
 *
 * Environment-based pricing:
 * - Local (NODE_ENV !== 'production'): cheap prices for testing (base × 0.01)
 * - Production: charge base directly (1×) — agentic-era pricing aligned with x402ResourceCatalog
 *
 * Passthrough routes (external x402 upstream): upstream cost × PASSTHROUGH_MARGIN (1.2 = cost + 20%).
 *
 * Playground dev wallet: in production, when the connected wallet is this address
 * (e.g. from X-Payer-Address header), use local-like pricing for API playground testing.
 *
 * Display/catalog prices: production level (same as charged in prod).
 */
const isProduction = process.env.NODE_ENV === 'production';
const PRODUCTION_MULT = 1;
const LOCAL_MULT = 0.01;
const mult = isProduction ? PRODUCTION_MULT : LOCAL_MULT;

/** Margin over documented upstream cost for passthrough x402 providers. */
export const PASSTHROUGH_MARGIN = 1.2;

/** Minimum floor for pay.sh dynamic provider calls (cost + 20% baseline). */
export const X402_PAYSH_FLOOR_USD = 0.012;

/** Solana address: when this wallet is the payer in production, use local (cheap) price. */
export const X402_PLAYGROUND_DEV_WALLET = 'FiejqEgqQ8bxtUJpZMy5p1wVCcejKyy5PgZ4cwmLBvYD';

/** Base (EVM) address: same dev pricing in production when this wallet is the payer. */
export const X402_PLAYGROUND_DEV_WALLET_BASE = '0xF9dcBFF7EdDd76c58412fd46f4160c96312ce734';

/** All playground dev wallet addresses (Solana + Base). Payer matching any gets local-like price in production. */
const PLAYGROUND_DEV_WALLETS = [X402_PLAYGROUND_DEV_WALLET, X402_PLAYGROUND_DEV_WALLET_BASE];

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
  // Production price = base × 1; we want base × 0.01 (local). So effective = priceUsd × 0.01
  return priceUsd * (LOCAL_MULT / PRODUCTION_MULT);
}

/** Internal Syra route price (base × env mult). */
const price = (base) => base * mult;

/** Passthrough x402 upstream price with cost + 20% margin. */
const passthrough = (upstreamUsd) => upstreamUsd * PASSTHROUGH_MARGIN * mult;

/** Catalog/display price for internal routes (production level). */
const displayInternal = (base) => base * PRODUCTION_MULT;

/** Catalog/display price for passthrough routes (production level). */
const displayPassthrough = (upstreamUsd) => upstreamUsd * PASSTHROUGH_MARGIN * PRODUCTION_MULT;

export const X402_API_PRICE_USD = price(0.01);

/** Check-status / health endpoints (minimal fee) — ~$0.0001/call in production. */
export const X402_API_PRICE_CHECK_STATUS_USD = price(0.0001);

/** News endpoints */
export const X402_API_PRICE_NEWS_USD = price(0.01);

/** Research / deep research endpoints */
export const X402_API_PRICE_RESEARCH_USD = price(0.01);

/** Nansen Basic tier — upstream $0.01/call × 1.2 */
export const X402_API_PRICE_NANSEN_USD = passthrough(0.01);

/** Nansen Premium / Smart Money tier — upstream $0.05/call × 1.2 */
export const X402_API_PRICE_NANSEN_PREMIUM_USD = passthrough(0.05);

/** Zerion API via x402 — upstream ~$0.01/call × 1.2 */
export const X402_API_PRICE_ZERION_USD = passthrough(0.01);

/** Birdeye Data public API via x402 — upstream ~$0.003/call × 1.2 */
export const X402_API_PRICE_BIRDEYE_USD = passthrough(0.003);

/** StableCrypto market data via x402 — upstream $0.01/call × 1.2 */
export const X402_API_PRICE_STABLECRYPTO_USD = passthrough(0.01);

/** StableSocial social media data via x402 — upstream $0.06/trigger × 1.2 */
export const X402_API_PRICE_STABLESOCIAL_USD = passthrough(0.06);

/** StableEnrich tiers — upstream USD per call × 1.2 */
export const X402_API_PRICE_STABLEENRICH_0002_USD = passthrough(0.002);
export const X402_API_PRICE_STABLEENRICH_01_USD = passthrough(0.01);
export const X402_API_PRICE_STABLEENRICH_0126_USD = passthrough(0.0126);
export const X402_API_PRICE_STABLEENRICH_02_USD = passthrough(0.02);
export const X402_API_PRICE_STABLEENRICH_0252_USD = passthrough(0.0252);
export const X402_API_PRICE_STABLEENRICH_03_USD = passthrough(0.03);
export const X402_API_PRICE_STABLEENRICH_04_USD = passthrough(0.04);
export const X402_API_PRICE_STABLEENRICH_0495_USD = passthrough(0.0495);
export const X402_API_PRICE_STABLEENRICH_05_USD = passthrough(0.05);
export const X402_API_PRICE_STABLEENRICH_10_USD = passthrough(0.1);

/** Jupiter swap order (buy/sell token via Corbits Jupiter Ultra) */
export const X402_API_PRICE_JUPITER_SWAP_USD = price(0.02);

/** Jupiter Swap V1 quote with referral platform fee */
export const X402_API_PRICE_JUPITER_QUOTE_USD = price(0.003);

/** pump.fun fun-block tx builders */
export const X402_API_PRICE_PUMP_FUN_TX_USD = price(0.02);

/** pump.fun read-only (coins-v2, sol-price) via frontend-api proxy */
export const X402_API_PRICE_PUMP_FUN_READ_USD = price(0.01);

/** pump.fun trending / movers market lists */
export const X402_API_PRICE_PUMP_FUN_MARKET_LIST_USD = price(0.005);

/** pump.fun memecoin analyzer — X API + LLM enrichment */
export const X402_API_PRICE_PUMP_FUN_ANALYZER_USD = price(0.02);

/** pump.fun scout (alpha/beta/predicted/utility segments) */
export const X402_API_PRICE_PUMP_FUN_SCOUT_USD = price(0.01);

/** RISE scout (intel/markets/targets views) */
export const X402_API_PRICE_RISE_SCOUT_USD = price(0.01);

/** CoinGecko scout (brief/gainers/predictions views) */
export const X402_API_PRICE_COINGECKO_SCOUT_USD = price(0.01);

/** Tokens.xyz curated assets board */
export const X402_API_PRICE_ASSETS_BOARD_USD = price(0.005);

/** Tokens.xyz asset detail / mint dossier */
export const X402_API_PRICE_ASSETS_DETAIL_USD = price(0.005);

/** Bitcoin Intelligence Hub (full /btc page) */
export const X402_API_PRICE_BITCOIN_USD = price(0.01);

/** Squid Router cross-chain route (quote + transactionRequest for first leg) */
export const X402_API_PRICE_SQUID_ROUTE_USD = price(0.02);
/** Squid Router cross-chain transaction status */
export const X402_API_PRICE_SQUID_STATUS_USD = price(0.01);

/** EXA search (direct Exa SDK; upstream ~$0.01 × 1.2) */
export const X402_API_PRICE_EXA_SEARCH_USD = passthrough(0.01);

/** Cloudflare Browser Rendering /crawl – full-site crawl */
export const X402_API_PRICE_CRAWL_USD = price(0.06);

/** Browser Use Cloud – AI browser task */
export const X402_API_PRICE_BROWSER_USE_USD = price(0.1);

/** Arbitrage experiment bundle — CMC top + parallel multi-venue WS snapshots + ranked routes */
export const X402_API_PRICE_ARBITRAGE_EXPERIMENT_USD = price(0.04);

/** 8004 Trustless Agent Registry reads — upstream ~$0.01 × 1.2 */
export const X402_API_PRICE_8004_USD = passthrough(0.01);

/** 8004 register-agent (write) — upstream ~$0.05 × 1.2 */
export const X402_API_PRICE_8004_REGISTER_AGENT_USD = passthrough(0.05);

/** 8004scan.io Public API */
export const X402_API_PRICE_8004SCAN_USD = passthrough(0.01);

/** hey.lol agent API proxy */
export const X402_API_PRICE_HEYLOL_USD = passthrough(0.01);

/** Syra Brain: single-question API (tool selection + treasury-paid tools + LLM) */
export const X402_API_PRICE_BRAIN_USD = price(0.08);

/** X (Twitter) API proxy — upstream ~$0.01 × 1.2 */
export const X402_API_PRICE_X_USD = passthrough(0.01);

/** X Project Analyzer — upstream ~$0.02 × 1.2 */
export const X402_API_PRICE_X_ANALYZER_USD = passthrough(0.02);

/** Giza Agent SDK */
export const X402_API_PRICE_GIZA_USD = passthrough(0.01);

/** Purch Vault — upstream ~$0.01 × 1.2 */
export const X402_API_PRICE_PURCH_VAULT_USD = passthrough(0.01);

/** Quicknode RPC */
export const X402_API_PRICE_QUICKNODE_USD = passthrough(0.01);

/** Bankr — upstream ~$0.02 × 1.2 */
export const X402_API_PRICE_BANKR_USD = passthrough(0.02);

/** Neynar — Farcaster API */
export const X402_API_PRICE_NEYNAR_USD = passthrough(0.01);

/** SIWA — Sign-In With Agent nonce + verify */
export const X402_API_PRICE_SIWA_USD = passthrough(0.01);

/**
 * Analytics summary: sum of tools included in GET/POST /analytics/summary.
 * (trending-jupiter + smart-money + binance correlation)
 */
export const X402_API_PRICE_ANALYTICS_SUMMARY_USD =
  X402_API_PRICE_USD + // trending-jupiter
  X402_API_PRICE_NANSEN_USD + // smart-money
  X402_API_PRICE_USD; // binance correlation

/** Tokenized equity intelligence — SPCX SpaceX IPO launch */
export const X402_API_PRICE_SPCX_USD = price(0.02);

/** Generalized tokenized equity intelligence (xStocks catalog) */
export const X402_API_PRICE_EQUITY_USD = price(0.02);

/** Technical indicators from OHLCV candles (combinable per call) */
export const X402_API_PRICE_INDICATOR_USD = price(0.01);

/** Display prices: production API cost for tools list/catalog. */
export const X402_DISPLAY_PRICE_USD = displayInternal(0.01);
export const X402_DISPLAY_PRICE_CHECK_STATUS_USD = displayInternal(0.0001);
export const X402_DISPLAY_PRICE_NEWS_USD = displayInternal(0.01);
export const X402_DISPLAY_PRICE_RESEARCH_USD = displayInternal(0.01);
export const X402_DISPLAY_PRICE_NANSEN_USD = displayPassthrough(0.01);
export const X402_DISPLAY_PRICE_NANSEN_PREMIUM_USD = displayPassthrough(0.05);
export const X402_DISPLAY_PRICE_ZERION_USD = displayPassthrough(0.01);
export const X402_DISPLAY_PRICE_BIRDEYE_USD = displayPassthrough(0.003);
export const X402_DISPLAY_PRICE_STABLECRYPTO_USD = displayPassthrough(0.01);
export const X402_DISPLAY_PRICE_STABLESOCIAL_USD = displayPassthrough(0.06);
export const X402_DISPLAY_PRICE_STABLEENRICH_0002_USD = displayPassthrough(0.002);
export const X402_DISPLAY_PRICE_STABLEENRICH_01_USD = displayPassthrough(0.01);
export const X402_DISPLAY_PRICE_STABLEENRICH_0126_USD = displayPassthrough(0.0126);
export const X402_DISPLAY_PRICE_STABLEENRICH_02_USD = displayPassthrough(0.02);
export const X402_DISPLAY_PRICE_STABLEENRICH_0252_USD = displayPassthrough(0.0252);
export const X402_DISPLAY_PRICE_STABLEENRICH_03_USD = displayPassthrough(0.03);
export const X402_DISPLAY_PRICE_STABLEENRICH_04_USD = displayPassthrough(0.04);
export const X402_DISPLAY_PRICE_STABLEENRICH_0495_USD = displayPassthrough(0.0495);
export const X402_DISPLAY_PRICE_STABLEENRICH_05_USD = displayPassthrough(0.05);
export const X402_DISPLAY_PRICE_STABLEENRICH_10_USD = displayPassthrough(0.1);
export const X402_DISPLAY_PRICE_JUPITER_SWAP_USD = displayInternal(0.02);
export const X402_DISPLAY_PRICE_JUPITER_QUOTE_USD = displayInternal(0.003);
export const X402_DISPLAY_PRICE_PUMP_FUN_TX_USD = displayInternal(0.02);
export const X402_DISPLAY_PRICE_PUMP_FUN_READ_USD = displayInternal(0.01);
export const X402_DISPLAY_PRICE_PUMP_FUN_MARKET_LIST_USD = displayInternal(0.005);
export const X402_DISPLAY_PRICE_PUMP_FUN_ANALYZER_USD = displayInternal(0.02);
export const X402_DISPLAY_PRICE_PUMP_FUN_SCOUT_USD = displayInternal(0.01);
export const X402_DISPLAY_PRICE_RISE_SCOUT_USD = displayInternal(0.01);
export const X402_DISPLAY_PRICE_COINGECKO_SCOUT_USD = displayInternal(0.01);
export const X402_DISPLAY_PRICE_ASSETS_BOARD_USD = displayInternal(0.005);
export const X402_DISPLAY_PRICE_ASSETS_DETAIL_USD = displayInternal(0.005);
export const X402_DISPLAY_PRICE_BITCOIN_USD = displayInternal(0.01);
export const X402_DISPLAY_PRICE_SQUID_ROUTE_USD = displayInternal(0.02);
export const X402_DISPLAY_PRICE_SQUID_STATUS_USD = displayInternal(0.01);
export const X402_DISPLAY_PRICE_EXA_SEARCH_USD = displayPassthrough(0.01);
export const X402_DISPLAY_PRICE_CRAWL_USD = displayInternal(0.06);
export const X402_DISPLAY_PRICE_BROWSER_USE_USD = displayInternal(0.1);
export const X402_DISPLAY_PRICE_ARBITRAGE_EXPERIMENT_USD = displayInternal(0.04);
export const X402_DISPLAY_PRICE_8004_USD = displayPassthrough(0.01);
export const X402_DISPLAY_PRICE_8004_REGISTER_AGENT_USD = displayPassthrough(0.05);
export const X402_DISPLAY_PRICE_8004SCAN_USD = displayPassthrough(0.01);
export const X402_DISPLAY_PRICE_HEYLOL_USD = displayPassthrough(0.01);
export const X402_DISPLAY_PRICE_BRAIN_USD = displayInternal(0.08);
export const X402_DISPLAY_PRICE_X_USD = displayPassthrough(0.01);
export const X402_DISPLAY_PRICE_X_ANALYZER_USD = displayPassthrough(0.02);
export const X402_DISPLAY_PRICE_GIZA_USD = displayPassthrough(0.01);
export const X402_DISPLAY_PRICE_PURCH_VAULT_USD = displayPassthrough(0.01);
export const X402_DISPLAY_PRICE_QUICKNODE_USD = displayPassthrough(0.01);
export const X402_DISPLAY_PRICE_BANKR_USD = displayPassthrough(0.02);
export const X402_DISPLAY_PRICE_NEYNAR_USD = displayPassthrough(0.01);
export const X402_DISPLAY_PRICE_SIWA_USD = displayPassthrough(0.01);
export const X402_DISPLAY_PRICE_ANALYTICS_SUMMARY_USD =
  X402_DISPLAY_PRICE_USD +
  X402_DISPLAY_PRICE_NANSEN_USD +
  X402_DISPLAY_PRICE_USD;
export const X402_DISPLAY_PRICE_SPCX_USD = displayInternal(0.02);
export const X402_DISPLAY_PRICE_EQUITY_USD = displayInternal(0.02);
export const X402_DISPLAY_PRICE_INDICATOR_USD = displayInternal(0.01);
