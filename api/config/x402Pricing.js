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

/** Check-status / health endpoints (minimal fee) — target ~$0.0001/call in production (base 1e-5 × mult 10). */
export const X402_API_PRICE_CHECK_STATUS_USD = price(0.00001);

/** News endpoints */
export const X402_API_PRICE_NEWS_USD = price(0.01);

/** Research / deep research endpoints */
export const X402_API_PRICE_RESEARCH_USD = price(0.01);

/** Nansen Basic tier — $0.01/call (profiler current/historical balance, transactions, tgm transfers, flows, etc.) */
export const X402_API_PRICE_NANSEN_USD = price(0.01);

/** Nansen Premium / Smart Money tier — $0.05/call (counterparties, holders, leaderboards, smart-money netflow/holdings/dex-trades) */
export const X402_API_PRICE_NANSEN_PREMIUM_USD = price(0.05);

/** Zerion API via x402 (portfolio, positions, PnL, txs, gas, chains, fungibles) — per call */
export const X402_API_PRICE_ZERION_USD = price(0.01);

/** Birdeye Data public API via x402 (~$0.003 upstream per call; Syra catalog uses margin) */
export const X402_API_PRICE_BIRDEYE_USD = price(0.003);

/** StableCrypto market data (CoinGecko, DefiLlama, Alchemy, Etherscan) via x402 — $0.01/call upstream */
export const X402_API_PRICE_STABLECRYPTO_USD = price(0.01);

/** StableSocial social media data (TikTok, Instagram, Facebook, Reddit) via x402 — $0.06/trigger upstream */
export const X402_API_PRICE_STABLESOCIAL_USD = price(0.06);

/** StableEnrich tiers (people/org search, scrape, maps, etc.) — upstream USD per call */
export const X402_API_PRICE_STABLEENRICH_0002_USD = price(0.002);
export const X402_API_PRICE_STABLEENRICH_01_USD = price(0.01);
export const X402_API_PRICE_STABLEENRICH_0126_USD = price(0.0126);
export const X402_API_PRICE_STABLEENRICH_02_USD = price(0.02);
export const X402_API_PRICE_STABLEENRICH_0252_USD = price(0.0252);
export const X402_API_PRICE_STABLEENRICH_03_USD = price(0.03);
export const X402_API_PRICE_STABLEENRICH_04_USD = price(0.04);
export const X402_API_PRICE_STABLEENRICH_0495_USD = price(0.0495);
export const X402_API_PRICE_STABLEENRICH_05_USD = price(0.05);
export const X402_API_PRICE_STABLEENRICH_10_USD = price(0.1);

/** Jupiter swap order (buy/sell token via Corbits Jupiter Ultra) */
export const X402_API_PRICE_JUPITER_SWAP_USD = price(0.02);

/** Jupiter Swap V1 quote with referral platform fee — $0.03/call in production */
export const X402_API_PRICE_JUPITER_QUOTE_USD = price(0.003);

/** pump.fun fun-block tx builders — swap: PUMPFUN_SWAP_* (swapX402Price.js); create-coin: PUMPFUN_CREATE_COIN_* (createCoinX402Price.js) */
export const X402_API_PRICE_PUMP_FUN_TX_USD = price(0.02);

/** pump.fun read-only (coins-v2, sol-price) via frontend-api proxy; coin route may add mcap-based surcharge (coinReadX402Price.js) */
export const X402_API_PRICE_PUMP_FUN_READ_USD = price(0.01);

/** pump.fun trending / movers market lists — $0.05/call in production */
export const X402_API_PRICE_PUMP_FUN_MARKET_LIST_USD = price(0.005);

/** pump.fun memecoin analyzer — $0.10/call in production */
export const X402_API_PRICE_PUMP_FUN_ANALYZER_USD = price(0.01);

/** pump.fun scout (alpha/beta/predicted/utility segments) — live x402 */
export const X402_API_PRICE_PUMP_FUN_SCOUT_USD = price(0.01);

/** RISE scout (intel/markets/targets views) — live x402 */
export const X402_API_PRICE_RISE_SCOUT_USD = price(0.01);

/** CoinGecko scout (brief/gainers/predictions views) — live x402 */
export const X402_API_PRICE_COINGECKO_SCOUT_USD = price(0.01);

/** Tokens.xyz curated assets board (Assets page) — $0.05/call in production */
export const X402_API_PRICE_ASSETS_BOARD_USD = price(0.005);

/** Tokens.xyz asset detail / mint dossier (Asset detail page) — $0.05/call in production */
export const X402_API_PRICE_ASSETS_DETAIL_USD = price(0.005);

/** Bitcoin Intelligence Hub (full /btc page) — $0.10/call in production */
export const X402_API_PRICE_BITCOIN_USD = price(0.01);

/** Squid Router cross-chain route (quote + transactionRequest for first leg) */
export const X402_API_PRICE_SQUID_ROUTE_USD = price(0.02);
/** Squid Router cross-chain transaction status */
export const X402_API_PRICE_SQUID_STATUS_USD = price(0.01);

/** EXA search (dynamic web search via Exa AI) */
export const X402_API_PRICE_EXA_SEARCH_USD = price(0.01);

/** Cloudflare Browser Rendering /crawl – full-site crawl (heavier; async poll) */
export const X402_API_PRICE_CRAWL_USD = price(0.05);

/** Browser Use Cloud – AI browser task (run natural language task, get output) */
export const X402_API_PRICE_BROWSER_USE_USD = price(0.08);

/** Arbitrage experiment bundle — CMC top + parallel multi-venue WS snapshots + ranked routes */
export const X402_API_PRICE_ARBITRAGE_EXPERIMENT_USD = price(0.04);

/** 8004 Trustless Agent Registry (liveness, integrity, discovery, introspection) */
export const X402_API_PRICE_8004_USD = price(0.01);

/** 8004 register-agent (write: create agent + attach to collection) */
export const X402_API_PRICE_8004_REGISTER_AGENT_USD = price(0.05);

/** 8004scan.io Public API (list agents, get agent, search, stats, feedbacks, chains) */
export const X402_API_PRICE_8004SCAN_USD = price(0.01);

/** hey.lol agent API proxy (profile, posts, feed, DMs, services, token) — per request */
export const X402_API_PRICE_HEYLOL_USD = price(0.01);

/** Syra Brain: single-question API (tool selection + tool calls + LLM); treasury pays sub-tools */
export const X402_API_PRICE_BRAIN_USD = price(0.05);

/** X (Twitter) API proxy — user lookup, search recent, user tweets, feed */
export const X402_API_PRICE_X_USD = price(0.01);

/** X Project Analyzer — profile + tweets + deterministic score (+ optional AI summary) */
export const X402_API_PRICE_X_ANALYZER_USD = price(0.02);

/** Giza Agent SDK — DeFi yield optimization (protocols, agent, portfolio, apr, activate, withdraw, etc.) */
export const X402_API_PRICE_GIZA_USD = price(0.01);

/** Purch Vault — marketplace for agent skills/knowledge/personas; $0.01 per API call (search, buy, download) */
export const X402_API_PRICE_PURCH_VAULT_USD = price(0.01);

/** Quicknode RPC — balance, transaction status, raw JSON-RPC (Solana, Base) */
export const X402_API_PRICE_QUICKNODE_USD = price(0.01);

/** Bankr — agent prompts, job status, wallet balances (api.bankr.bot) */
export const X402_API_PRICE_BANKR_USD = price(0.02);

/** Neynar — Farcaster API (user, feed, cast, search) */
export const X402_API_PRICE_NEYNAR_USD = price(0.01);

/** SIWA — Sign-In With Agent nonce + verify (ERC-8004 / ERC-8128) */
export const X402_API_PRICE_SIWA_USD = price(0.01);

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

/** Display prices: real API cost (production level = base * 10). Use for tools list/catalog so UI matches actual cost. */
export const X402_DISPLAY_PRICE_USD = 0.01 * PRODUCTION_MULT;
export const X402_DISPLAY_PRICE_CHECK_STATUS_USD = 0.00001 * PRODUCTION_MULT;
export const X402_DISPLAY_PRICE_NEWS_USD = 0.01 * PRODUCTION_MULT;
export const X402_DISPLAY_PRICE_RESEARCH_USD = 0.01 * PRODUCTION_MULT;
export const X402_DISPLAY_PRICE_NANSEN_USD = 0.01 * PRODUCTION_MULT;
export const X402_DISPLAY_PRICE_NANSEN_PREMIUM_USD = 0.05 * PRODUCTION_MULT;
export const X402_DISPLAY_PRICE_ZERION_USD = 0.01 * PRODUCTION_MULT;
export const X402_DISPLAY_PRICE_BIRDEYE_USD = 0.003 * PRODUCTION_MULT;
export const X402_DISPLAY_PRICE_STABLECRYPTO_USD = 0.01 * PRODUCTION_MULT;
export const X402_DISPLAY_PRICE_STABLESOCIAL_USD = 0.06 * PRODUCTION_MULT;
export const X402_DISPLAY_PRICE_STABLEENRICH_0002_USD = 0.002 * PRODUCTION_MULT;
export const X402_DISPLAY_PRICE_STABLEENRICH_01_USD = 0.01 * PRODUCTION_MULT;
export const X402_DISPLAY_PRICE_STABLEENRICH_0126_USD = 0.0126 * PRODUCTION_MULT;
export const X402_DISPLAY_PRICE_STABLEENRICH_02_USD = 0.02 * PRODUCTION_MULT;
export const X402_DISPLAY_PRICE_STABLEENRICH_0252_USD = 0.0252 * PRODUCTION_MULT;
export const X402_DISPLAY_PRICE_STABLEENRICH_03_USD = 0.03 * PRODUCTION_MULT;
export const X402_DISPLAY_PRICE_STABLEENRICH_04_USD = 0.04 * PRODUCTION_MULT;
export const X402_DISPLAY_PRICE_STABLEENRICH_0495_USD = 0.0495 * PRODUCTION_MULT;
export const X402_DISPLAY_PRICE_STABLEENRICH_05_USD = 0.05 * PRODUCTION_MULT;
export const X402_DISPLAY_PRICE_STABLEENRICH_10_USD = 0.1 * PRODUCTION_MULT;
export const X402_DISPLAY_PRICE_JUPITER_SWAP_USD = 0.02 * PRODUCTION_MULT;
export const X402_DISPLAY_PRICE_JUPITER_QUOTE_USD = 0.003 * PRODUCTION_MULT;
export const X402_DISPLAY_PRICE_PUMP_FUN_TX_USD = 0.02 * PRODUCTION_MULT;
export const X402_DISPLAY_PRICE_PUMP_FUN_READ_USD = 0.01 * PRODUCTION_MULT;
export const X402_DISPLAY_PRICE_PUMP_FUN_MARKET_LIST_USD = 0.005 * PRODUCTION_MULT;
export const X402_DISPLAY_PRICE_PUMP_FUN_ANALYZER_USD = 0.01 * PRODUCTION_MULT;
export const X402_DISPLAY_PRICE_PUMP_FUN_SCOUT_USD = 0.01 * PRODUCTION_MULT;
export const X402_DISPLAY_PRICE_RISE_SCOUT_USD = 0.01 * PRODUCTION_MULT;
export const X402_DISPLAY_PRICE_COINGECKO_SCOUT_USD = 0.01 * PRODUCTION_MULT;
export const X402_DISPLAY_PRICE_ASSETS_BOARD_USD = 0.005 * PRODUCTION_MULT;
export const X402_DISPLAY_PRICE_ASSETS_DETAIL_USD = 0.005 * PRODUCTION_MULT;
export const X402_DISPLAY_PRICE_BITCOIN_USD = 0.01 * PRODUCTION_MULT;
export const X402_DISPLAY_PRICE_SQUID_ROUTE_USD = 0.02 * PRODUCTION_MULT;
export const X402_DISPLAY_PRICE_SQUID_STATUS_USD = 0.01 * PRODUCTION_MULT;
export const X402_DISPLAY_PRICE_EXA_SEARCH_USD = 0.01 * PRODUCTION_MULT;
export const X402_DISPLAY_PRICE_CRAWL_USD = 0.05 * PRODUCTION_MULT;
export const X402_DISPLAY_PRICE_BROWSER_USE_USD = 0.08 * PRODUCTION_MULT;
export const X402_DISPLAY_PRICE_ARBITRAGE_EXPERIMENT_USD = 0.04 * PRODUCTION_MULT;
export const X402_DISPLAY_PRICE_8004_USD = 0.01 * PRODUCTION_MULT;
export const X402_DISPLAY_PRICE_8004_REGISTER_AGENT_USD = 0.05 * PRODUCTION_MULT;
export const X402_DISPLAY_PRICE_8004SCAN_USD = 0.01 * PRODUCTION_MULT;
export const X402_DISPLAY_PRICE_HEYLOL_USD = 0.01 * PRODUCTION_MULT;
export const X402_DISPLAY_PRICE_BRAIN_USD = 0.05 * PRODUCTION_MULT;
export const X402_DISPLAY_PRICE_X_USD = 0.01 * PRODUCTION_MULT;
export const X402_DISPLAY_PRICE_X_ANALYZER_USD = 0.02 * PRODUCTION_MULT;
export const X402_DISPLAY_PRICE_GIZA_USD = 0.01 * PRODUCTION_MULT;
export const X402_DISPLAY_PRICE_PURCH_VAULT_USD = 0.01 * PRODUCTION_MULT;
export const X402_DISPLAY_PRICE_QUICKNODE_USD = 0.01 * PRODUCTION_MULT;
export const X402_DISPLAY_PRICE_BANKR_USD = 0.02 * PRODUCTION_MULT;
export const X402_DISPLAY_PRICE_NEYNAR_USD = 0.01 * PRODUCTION_MULT;
export const X402_DISPLAY_PRICE_SIWA_USD = 0.01 * PRODUCTION_MULT;
export const X402_DISPLAY_PRICE_ANALYTICS_SUMMARY_USD =
  X402_DISPLAY_PRICE_USD +
  X402_DISPLAY_PRICE_NANSEN_USD +
  X402_DISPLAY_PRICE_USD;
export const X402_DISPLAY_PRICE_SPCX_USD = 0.02 * PRODUCTION_MULT;
export const X402_DISPLAY_PRICE_EQUITY_USD = 0.02 * PRODUCTION_MULT;
export const X402_DISPLAY_PRICE_INDICATOR_USD = 0.01 * PRODUCTION_MULT;
