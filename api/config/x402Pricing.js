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

/**
 * Machine-frequency pricing tiers (BlockRun-aligned).
 * Tier 1: high-frequency lists/feeds · Tier 2: intelligence/signals · Tier 3: deep synthesis.
 */
export const X402_TIER_1_USD = 0.001;
export const X402_TIER_2_USD = 0.005;
export const X402_TIER_3_USD = 0.02;
export const X402_TIER_4_USD = 0.08;

/** Minimum floor for pay.sh dynamic provider calls (cost + 20% baseline). */
export const X402_PAYSH_FLOOR_USD = 0.012;

/** Margin over OpenRouter upstream token cost for POST /chat/completions (1.4 = cost + 40%). */
export const X402_CHAT_PRICE_MARGIN = 1.4;

/** Minimum charge per /chat/completions call (USD). */
export const X402_CHAT_PRICE_FLOOR_USD = 0.004;

/** Default max_tokens budget used when client omits max_tokens (pricing + upstream call). */
export const X402_CHAT_DEFAULT_MAX_TOKENS = 1024;

/** Margin over OpenRouter upstream cost for POST /images/generations (1.4 = cost + 40%). */
export const X402_IMAGE_PRICE_MARGIN = 1.4;

/** Minimum charge per /images/generations call (USD). */
export const X402_IMAGE_PRICE_FLOOR_USD = 0.02;

/** Default number of images when client omits n (pricing + upstream call). */
export const X402_IMAGE_DEFAULT_N = 1;

/** Margin over OpenRouter upstream cost for POST /videos/generations (1.4 = cost + 40%). */
export const X402_VIDEO_PRICE_MARGIN = 1.4;

/** Minimum charge per /videos/generations submit (USD). */
export const X402_VIDEO_PRICE_FLOOR_USD = 0.1;

/** Default video duration in seconds when client omits duration. */
export const X402_VIDEO_DEFAULT_DURATION_SEC = 4;

/** Conservative per-second fallback when video model rates are unavailable. */
export const X402_VIDEO_FALLBACK_USD_PER_SEC = 0.5;

/** Solana address: when this wallet is the payer in production, use local (cheap) price. */
export const X402_PLAYGROUND_DEV_WALLET = 'FiejqEgqQ8bxtUJpZMy5p1wVCcejKyy5PgZ4cwmLBvYD';

/** Base (EVM) address: same dev pricing in production when this wallet is the payer. */
export const X402_PLAYGROUND_DEV_WALLET_BASE = '0xF9dcBFF7EdDd76c58412fd46f4160c96312ce734';

/** All playground dev wallet addresses (Solana + Base). Payer matching any gets local-like price in production. */
const PLAYGROUND_DEV_WALLETS = [X402_PLAYGROUND_DEV_WALLET, X402_PLAYGROUND_DEV_WALLET_BASE];

/** Minimum charge when settling via Dexter facilitator (Solana floor ~427 atomic ≈ $0.000427). */
export const X402_DEXTER_MIN_PAYMENT_USD = 0.0005;

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

/**
 * Clamp price to Dexter facilitator minimum (dynamic floor on Solana/EVM).
 * @param {number} priceUsd
 * @returns {number}
 */
export function applyDexterPriceFloor(priceUsd) {
  const n = Number(priceUsd);
  if (!Number.isFinite(n) || n < 0) return X402_DEXTER_MIN_PAYMENT_USD;
  return Math.max(n, X402_DEXTER_MIN_PAYMENT_USD);
}

/** Internal Syra route price (base × env mult). */
const price = (base) => base * mult;

/** Passthrough x402 upstream price with cost + 20% margin. */
const passthrough = (upstreamUsd) => upstreamUsd * PASSTHROUGH_MARGIN * mult;

/** Catalog/display price for internal routes (production level). */
const displayInternal = (base) => base * PRODUCTION_MULT;

/** Catalog/display price for passthrough routes (production level). */
const displayPassthrough = (upstreamUsd) => upstreamUsd * PASSTHROUGH_MARGIN * PRODUCTION_MULT;

export const X402_API_PRICE_USD = price(X402_TIER_2_USD);

/** Check-status / health endpoints (minimal fee) — Tier 1 floor. */
export const X402_API_PRICE_CHECK_STATUS_USD = price(X402_TIER_1_USD);

/** News endpoints — Tier 2 */
export const X402_API_PRICE_NEWS_USD = price(X402_TIER_2_USD);

/** Research / deep research endpoints — Tier 2 */
export const X402_API_PRICE_RESEARCH_USD = price(X402_TIER_2_USD);

/** Nansen Basic tier — upstream $0.01/call × 1.2 */
export const X402_API_PRICE_NANSEN_USD = passthrough(0.01);

/** Nansen Premium / Smart Money tier — upstream $0.05/call × 1.2 */
export const X402_API_PRICE_NANSEN_PREMIUM_USD = passthrough(0.05);

/** Zerion API via x402 — upstream ~$0.01/call × 1.2 */
export const X402_API_PRICE_ZERION_USD = passthrough(0.01);

/** Birdeye Data public API via x402 — upstream ~$0.003/call × 1.2 */
export const X402_API_PRICE_BIRDEYE_USD = passthrough(0.003);

/** TopLedger Solana DeFi intelligence via MPP — upstream $0.0004/call × 1.2 */
export const X402_API_PRICE_TOPLEDGER_USD = passthrough(0.0004);

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

/** Jupiter Swap V1 quote with referral platform fee — Tier 1 */
export const X402_API_PRICE_JUPITER_QUOTE_USD = price(X402_TIER_1_USD);

/** pump.fun fun-block tx builders */
export const X402_API_PRICE_PUMP_FUN_TX_USD = price(0.02);

/** pump.fun read-only (coins-v2, sol-price) via frontend-api proxy — Tier 2 */
export const X402_API_PRICE_PUMP_FUN_READ_USD = price(X402_TIER_2_USD);

/** pump.fun trending / movers market lists — Tier 1 */
export const X402_API_PRICE_PUMP_FUN_MARKET_LIST_USD = price(X402_TIER_1_USD);

/** pump.fun memecoin analyzer — X API + LLM enrichment — Tier 3 */
export const X402_API_PRICE_PUMP_FUN_ANALYZER_USD = price(X402_TIER_3_USD);

/** pump.fun scout (alpha/beta/predicted/utility segments) — Tier 2 */
export const X402_API_PRICE_PUMP_FUN_SCOUT_USD = price(X402_TIER_2_USD);

/** RISE scout (intel/markets/targets views) — Tier 2 */
export const X402_API_PRICE_RISE_SCOUT_USD = price(X402_TIER_2_USD);

/** CoinGecko scout (brief/gainers/predictions views) — Tier 1 */
export const X402_API_PRICE_COINGECKO_SCOUT_USD = price(X402_TIER_1_USD);

/** Tokens.xyz curated assets board — Tier 1 */
export const X402_API_PRICE_ASSETS_BOARD_USD = price(X402_TIER_1_USD);

/** Tokens.xyz asset detail / mint dossier — Tier 2 */
export const X402_API_PRICE_ASSETS_DETAIL_USD = price(X402_TIER_2_USD);

/** Bitcoin Intelligence Hub (full /btc page) — Tier 2 */
export const X402_API_PRICE_BITCOIN_USD = price(X402_TIER_2_USD);

/** Squid Router cross-chain route (quote + transactionRequest for first leg) */
export const X402_API_PRICE_SQUID_ROUTE_USD = price(0.02);
/** Squid Router cross-chain transaction status */
export const X402_API_PRICE_SQUID_STATUS_USD = price(0.01);

/** Web search (free DuckDuckGo/Bing scrape; internal compute only) */
export const X402_API_PRICE_WEB_SEARCH_USD = passthrough(0.01);

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

/** Syra Brain: single-question API (tool selection + treasury-paid tools + LLM) — Tier 4 */
export const X402_API_PRICE_BRAIN_USD = price(X402_TIER_4_USD);

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

/** Technical indicators from OHLCV candles (combinable per call) — Tier 2 */
export const X402_API_PRICE_INDICATOR_USD = price(X402_TIER_2_USD);

/** DexScreener token pairs / search — free upstream, Tier 1 */
export const X402_API_PRICE_DEXSCREENER_PAIRS_USD = price(X402_TIER_1_USD);

/** GeckoTerminal trending/new pools — free upstream, Tier 1 */
export const X402_API_PRICE_GECKOTERMINAL_POOLS_USD = price(X402_TIER_1_USD);

/** DefiLlama protocol/chain TVL — free upstream, Tier 1 */
export const X402_API_PRICE_DEFILLAMA_TVL_USD = price(X402_TIER_1_USD);

/** RugCheck Solana token risk report — free upstream, Tier 2 */
export const X402_API_PRICE_RUGCHECK_REPORT_USD = price(X402_TIER_2_USD);

/** Pyth Hermes oracle prices — free upstream, Tier 1 */
export const X402_API_PRICE_PYTH_PRICE_USD = price(X402_TIER_1_USD);

/** x402 Labs /insights/* — on-chain intelligence endpoints */
export const X402_API_PRICE_INSIGHTS_NETWORK_HEALTH_USD = price(0.01);
export const X402_API_PRICE_INSIGHTS_GAS_ORACLE_USD = price(0.01);
export const X402_API_PRICE_INSIGHTS_MARKET_PULSE_USD = price(0.02);
export const X402_API_PRICE_INSIGHTS_TOKEN_METRICS_USD = price(0.03);
export const X402_API_PRICE_INSIGHTS_DEFI_TVL_USD = price(0.05);
export const X402_API_PRICE_INSIGHTS_VOLATILITY_INDEX_USD = price(0.1);
/** PayAI-facilitated Labs premium snapshot — limited to 5–10 calls/day */
export const X402_API_PRICE_INSIGHTS_ECOSYSTEM_BRIEF_USD = price(0.05);

/** Display prices: production API cost for tools list/catalog. */
export const X402_DISPLAY_PRICE_USD = displayInternal(X402_TIER_2_USD);
export const X402_DISPLAY_PRICE_CHECK_STATUS_USD = displayInternal(X402_TIER_1_USD);
export const X402_DISPLAY_PRICE_NEWS_USD = displayInternal(X402_TIER_2_USD);
export const X402_DISPLAY_PRICE_RESEARCH_USD = displayInternal(X402_TIER_2_USD);
export const X402_DISPLAY_PRICE_NANSEN_USD = displayPassthrough(0.01);
export const X402_DISPLAY_PRICE_NANSEN_PREMIUM_USD = displayPassthrough(0.05);
export const X402_DISPLAY_PRICE_ZERION_USD = displayPassthrough(0.01);
export const X402_DISPLAY_PRICE_BIRDEYE_USD = displayPassthrough(0.003);
export const X402_DISPLAY_PRICE_TOPLEDGER_USD = displayPassthrough(0.0004);
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
export const X402_DISPLAY_PRICE_JUPITER_QUOTE_USD = displayInternal(X402_TIER_1_USD);
export const X402_DISPLAY_PRICE_PUMP_FUN_TX_USD = displayInternal(X402_TIER_3_USD);
export const X402_DISPLAY_PRICE_PUMP_FUN_READ_USD = displayInternal(X402_TIER_2_USD);
export const X402_DISPLAY_PRICE_PUMP_FUN_MARKET_LIST_USD = displayInternal(X402_TIER_1_USD);
export const X402_DISPLAY_PRICE_PUMP_FUN_ANALYZER_USD = displayInternal(X402_TIER_3_USD);
export const X402_DISPLAY_PRICE_PUMP_FUN_SCOUT_USD = displayInternal(X402_TIER_2_USD);
export const X402_DISPLAY_PRICE_RISE_SCOUT_USD = displayInternal(X402_TIER_2_USD);
export const X402_DISPLAY_PRICE_COINGECKO_SCOUT_USD = displayInternal(X402_TIER_1_USD);
export const X402_DISPLAY_PRICE_ASSETS_BOARD_USD = displayInternal(X402_TIER_1_USD);
export const X402_DISPLAY_PRICE_ASSETS_DETAIL_USD = displayInternal(X402_TIER_2_USD);
export const X402_DISPLAY_PRICE_BITCOIN_USD = displayInternal(X402_TIER_2_USD);
export const X402_DISPLAY_PRICE_SQUID_ROUTE_USD = displayInternal(0.02);
export const X402_DISPLAY_PRICE_SQUID_STATUS_USD = displayInternal(0.01);
export const X402_DISPLAY_PRICE_WEB_SEARCH_USD = displayPassthrough(0.01);
export const X402_DISPLAY_PRICE_CRAWL_USD = displayInternal(0.06);
export const X402_DISPLAY_PRICE_BROWSER_USE_USD = displayInternal(0.1);
export const X402_DISPLAY_PRICE_ARBITRAGE_EXPERIMENT_USD = displayInternal(0.04);
export const X402_DISPLAY_PRICE_8004_USD = displayPassthrough(0.01);
export const X402_DISPLAY_PRICE_8004_REGISTER_AGENT_USD = displayPassthrough(0.05);
export const X402_DISPLAY_PRICE_8004SCAN_USD = displayPassthrough(0.01);
export const X402_DISPLAY_PRICE_HEYLOL_USD = displayPassthrough(0.01);
export const X402_DISPLAY_PRICE_BRAIN_USD = displayInternal(X402_TIER_4_USD);
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
export const X402_DISPLAY_PRICE_INDICATOR_USD = displayInternal(X402_TIER_2_USD);
export const X402_DISPLAY_PRICE_DEXSCREENER_PAIRS_USD = displayInternal(X402_TIER_1_USD);
export const X402_DISPLAY_PRICE_GECKOTERMINAL_POOLS_USD = displayInternal(X402_TIER_1_USD);
export const X402_DISPLAY_PRICE_DEFILLAMA_TVL_USD = displayInternal(X402_TIER_1_USD);
export const X402_DISPLAY_PRICE_RUGCHECK_REPORT_USD = displayInternal(X402_TIER_2_USD);
export const X402_DISPLAY_PRICE_PYTH_PRICE_USD = displayInternal(X402_TIER_1_USD);
export const X402_DISPLAY_PRICE_INSIGHTS_NETWORK_HEALTH_USD = displayInternal(0.01);
export const X402_DISPLAY_PRICE_INSIGHTS_GAS_ORACLE_USD = displayInternal(0.01);
export const X402_DISPLAY_PRICE_INSIGHTS_MARKET_PULSE_USD = displayInternal(0.02);
export const X402_DISPLAY_PRICE_INSIGHTS_TOKEN_METRICS_USD = displayInternal(0.03);
export const X402_DISPLAY_PRICE_INSIGHTS_DEFI_TVL_USD = displayInternal(0.05);
export const X402_DISPLAY_PRICE_INSIGHTS_VOLATILITY_INDEX_USD = displayInternal(0.1);
export const X402_DISPLAY_PRICE_INSIGHTS_ECOSYSTEM_BRIEF_USD = displayInternal(0.05);
