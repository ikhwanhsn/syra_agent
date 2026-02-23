/**
 * Agent tools registry: x402 API v2 resources the Syra agent can call.
 * Each tool is paid automatically with the agent wallet; balance is checked first.
 */
import {
  X402_API_PRICE_USD,
  X402_API_PRICE_CHECK_STATUS_USD,
  X402_API_PRICE_NEWS_USD,
  X402_API_PRICE_RESEARCH_USD,
  X402_API_PRICE_NANSEN_USD,
  X402_API_PRICE_NANSEN_PREMIUM_USD,
  X402_API_PRICE_DEXSCREENER_USD,
  X402_API_PRICE_PUMP_USD,
  X402_API_PRICE_ANALYTICS_SUMMARY_USD,
  X402_API_PRICE_JUPITER_SWAP_USD,
  X402_API_PRICE_COINGECKO_USD,
  X402_API_PRICE_EXA_SEARCH_USD,
} from './x402Pricing.js';
import {
  X402_DISPLAY_PRICE_USD,
  X402_DISPLAY_PRICE_CHECK_STATUS_USD,
  X402_DISPLAY_PRICE_NEWS_USD,
  X402_DISPLAY_PRICE_RESEARCH_USD,
  X402_DISPLAY_PRICE_NANSEN_USD,
  X402_DISPLAY_PRICE_NANSEN_PREMIUM_USD,
  X402_DISPLAY_PRICE_DEXSCREENER_USD,
  X402_DISPLAY_PRICE_PUMP_USD,
  X402_DISPLAY_PRICE_ANALYTICS_SUMMARY_USD,
  X402_DISPLAY_PRICE_JUPITER_SWAP_USD,
  X402_DISPLAY_PRICE_COINGECKO_USD,
  X402_DISPLAY_PRICE_EXA_SEARCH_USD,
} from './x402Pricing.js';

/** @typedef {{ id: string; path: string; method: string; priceUsd: number; displayPriceUsd?: number; name: string; description: string }} AgentTool */

/**
 * List of agent tools (x402 v2 endpoints). Path is relative to API base (e.g. /v2/news).
 * priceUsd = charged amount (env-based); displayPriceUsd = real API cost shown in UI (production).
 * @type {AgentTool[]}
 */
export const AGENT_TOOLS = [
  // Core
  {
    id: 'check-status',
    path: '/v2/check-status',
    method: 'GET',
    priceUsd: X402_API_PRICE_CHECK_STATUS_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_CHECK_STATUS_USD,
    name: 'Check API status',
    description: 'Health check for API server status and connectivity',
  },
  {
    id: 'news',
    path: '/v2/news',
    method: 'GET',
    priceUsd: X402_API_PRICE_NEWS_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_NEWS_USD,
    name: 'Crypto news',
    description: 'Get latest crypto news and market updates (optional ticker: BTC, ETH, or "general")',
  },
  {
    id: 'signal',
    path: '/v2/signal',
    method: 'GET',
    priceUsd: X402_API_PRICE_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_USD,
    name: 'Trading signal',
    description: 'Trading signal creation / signal data',
  },
  {
    id: 'sentiment',
    path: '/v2/sentiment',
    method: 'GET',
    priceUsd: X402_API_PRICE_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_USD,
    name: 'Sentiment analysis',
    description: 'Get market sentiment analysis',
  },
  {
    id: 'event',
    path: '/v2/event',
    method: 'GET',
    priceUsd: X402_API_PRICE_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_USD,
    name: 'Event',
    description: 'Event data and updates',
  },
  {
    id: 'browse',
    path: '/v2/browse',
    method: 'GET',
    priceUsd: X402_API_PRICE_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_USD,
    name: 'Browse',
    description: 'Browse / discovery data',
  },
  {
    id: 'x-search',
    path: '/v2/x-search',
    method: 'GET',
    priceUsd: X402_API_PRICE_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_USD,
    name: 'X search',
    description: 'Search X/Twitter for crypto and market content',
  },
  {
    id: 'research',
    path: '/v2/research',
    method: 'GET',
    priceUsd: X402_API_PRICE_RESEARCH_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_RESEARCH_USD,
    name: 'Research',
    description: 'Deep research / analysis',
  },
  {
    id: 'exa-search',
    path: '/v2/exa-search',
    method: 'GET',
    priceUsd: X402_API_PRICE_EXA_SEARCH_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_EXA_SEARCH_USD,
    name: 'EXA search',
    description: 'EXA AI web search – dynamic query only',
  },
  {
    id: 'gems',
    path: '/v2/gems',
    method: 'GET',
    priceUsd: X402_API_PRICE_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_USD,
    name: 'Gems',
    description: 'Gems / curated insights',
  },
  {
    id: 'x-kol',
    path: '/v2/x-kol',
    method: 'GET',
    priceUsd: X402_API_PRICE_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_USD,
    name: 'X KOL',
    description: 'X/Twitter KOL (key opinion leader) data',
  },
  {
    id: 'crypto-kol',
    path: '/v2/crypto-kol',
    method: 'GET',
    priceUsd: X402_API_PRICE_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_USD,
    name: 'Crypto KOL',
    description: 'Crypto KOL data and insights',
  },
  {
    id: 'trending-headline',
    path: '/v2/trending-headline',
    method: 'GET',
    priceUsd: X402_API_PRICE_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_USD,
    name: 'Trending headline',
    description: 'Trending headlines',
  },
  {
    id: 'sundown-digest',
    path: '/v2/sundown-digest',
    method: 'GET',
    priceUsd: X402_API_PRICE_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_USD,
    name: 'Sundown digest',
    description: 'Sundown digest / daily summary',
  },
  {
    id: 'analytics-summary',
    path: '/v2/analytics/summary',
    method: 'GET',
    priceUsd: X402_API_PRICE_ANALYTICS_SUMMARY_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_ANALYTICS_SUMMARY_USD,
    name: 'Analytics summary',
    description: 'Full analytics: dexscreener, token stats, Jupiter trending, smart money, Binance correlation, and 9 memecoin screens',
  },
  // Partner: Nansen
  {
    id: 'smart-money',
    path: '/v2/smart-money',
    method: 'GET',
    priceUsd: X402_API_PRICE_NANSEN_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_NANSEN_USD,
    name: 'Smart money (Nansen)',
    description: 'Smart money data from Nansen',
  },
  {
    id: 'token-god-mode',
    path: '/v2/token-god-mode',
    method: 'GET',
    priceUsd: X402_API_PRICE_NANSEN_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_NANSEN_USD,
    name: 'Token god mode (Nansen)',
    description: 'Token god mode insights from Nansen',
  },
  // Nansen x402 endpoints — agent calls real Nansen API (api.nansen.ai), not our route
  {
    id: 'nansen-address-current-balance',
    path: '/v2/nansen/profiler/address/current-balance',
    nansenPath: '/api/v1/profiler/address/current-balance',
    method: 'POST',
    priceUsd: X402_API_PRICE_NANSEN_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_NANSEN_USD,
    name: 'Nansen: address current balance',
    description: 'Current token holdings for a wallet or entity (chain + address required)',
  },
  {
    id: 'nansen-address-historical-balances',
    path: '/v2/nansen/profiler/address/historical-balances',
    nansenPath: '/api/v1/profiler/address/historical-balances',
    method: 'POST',
    priceUsd: X402_API_PRICE_NANSEN_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_NANSEN_USD,
    name: 'Nansen: address historical balances',
    description: 'Historical balances for a wallet (chain + address required)',
  },
  {
    id: 'nansen-smart-money-netflow',
    path: '/v2/nansen/smart-money/netflow',
    nansenPath: '/api/v1/smart-money/netflow',
    method: 'POST',
    priceUsd: X402_API_PRICE_NANSEN_PREMIUM_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_NANSEN_PREMIUM_USD,
    name: 'Nansen: smart money netflow',
    description: 'Smart money net flow / accumulation (chains e.g. ["solana"]; optional filters, pagination)',
  },
  {
    id: 'nansen-smart-money-holdings',
    path: '/v2/nansen/smart-money/holdings',
    nansenPath: '/api/v1/smart-money/holdings',
    method: 'POST',
    priceUsd: X402_API_PRICE_NANSEN_PREMIUM_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_NANSEN_PREMIUM_USD,
    name: 'Nansen: smart money holdings',
    description: 'Current smart money positions (chains e.g. ["solana"]; optional filters, pagination)',
  },
  {
    id: 'nansen-smart-money-dex-trades',
    path: '/v2/nansen/smart-money/dex-trades',
    nansenPath: '/api/v1/smart-money/dex-trades',
    method: 'POST',
    priceUsd: X402_API_PRICE_NANSEN_PREMIUM_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_NANSEN_PREMIUM_USD,
    name: 'Nansen: smart money DEX trades',
    description: 'Recent DEX trades by smart money (chains; optional filters, pagination)',
  },
  {
    id: 'nansen-tgm-holders',
    path: '/v2/nansen/tgm/holders',
    nansenPath: '/api/v1/tgm/holders',
    method: 'POST',
    priceUsd: X402_API_PRICE_NANSEN_PREMIUM_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_NANSEN_PREMIUM_USD,
    name: 'Nansen: TGM holders',
    description: 'Token holders from Token God Mode (chain + token_address required)',
  },
  {
    id: 'nansen-tgm-flow-intelligence',
    path: '/v2/nansen/tgm/flow-intelligence',
    nansenPath: '/api/v1/tgm/flow-intelligence',
    method: 'POST',
    priceUsd: X402_API_PRICE_NANSEN_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_NANSEN_USD,
    name: 'Nansen: TGM flow intelligence',
    description: 'Flow intelligence for a token (chain + token_address required)',
  },
  {
    id: 'nansen-tgm-flows',
    path: '/v2/nansen/tgm/flows',
    nansenPath: '/api/v1/tgm/flows',
    method: 'POST',
    priceUsd: X402_API_PRICE_NANSEN_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_NANSEN_USD,
    name: 'Nansen: TGM flows',
    description: 'Flow history for a token (chain, date range, token_address; optional filters)',
  },
  {
    id: 'nansen-tgm-dex-trades',
    path: '/v2/nansen/tgm/dex-trades',
    nansenPath: '/api/v1/tgm/dex-trades',
    method: 'POST',
    priceUsd: X402_API_PRICE_NANSEN_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_NANSEN_USD,
    name: 'Nansen: TGM DEX trades',
    description: 'DEX trades for a token (chain + token_address; optional date, filters)',
  },
  {
    id: 'nansen-token-screener',
    path: '/v2/nansen/token-screener',
    nansenPath: '/api/v1/token-screener',
    method: 'POST',
    priceUsd: X402_API_PRICE_NANSEN_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_NANSEN_USD,
    name: 'Nansen: token screener',
    description: 'Token screener data (chain; optional filters, pagination)',
  },
  {
    id: 'nansen-profiler-counterparties',
    path: '/v2/nansen/profiler/address/counterparties',
    nansenPath: '/api/v1/profiler/address/counterparties',
    method: 'POST',
    priceUsd: X402_API_PRICE_NANSEN_PREMIUM_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_NANSEN_PREMIUM_USD,
    name: 'Nansen: address counterparties',
    description: 'Counterparties for a wallet (chain + address required)',
  },
  {
    id: 'nansen-tgm-pnl-leaderboard',
    path: '/v2/nansen/tgm/pnl-leaderboard',
    nansenPath: '/api/v1/tgm/pnl-leaderboard',
    method: 'POST',
    priceUsd: X402_API_PRICE_NANSEN_PREMIUM_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_NANSEN_PREMIUM_USD,
    name: 'Nansen: TGM PnL leaderboard',
    description: 'PnL leaderboard for a token (chain, date range; optional filters)',
  },
  // Partner: DexScreener, Jupiter, Rugcheck, Bubblemaps, Binance, Workfun
  {
    id: 'dexscreener',
    path: '/v2/dexscreener',
    method: 'GET',
    priceUsd: X402_API_PRICE_DEXSCREENER_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_DEXSCREENER_USD,
    name: 'DexScreener',
    description: 'DexScreener data',
  },
  {
    id: 'trending-jupiter',
    path: '/v2/trending-jupiter',
    method: 'GET',
    priceUsd: X402_API_PRICE_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_USD,
    name: 'Trending on Jupiter',
    description: 'Trending tokens on Jupiter',
  },
  {
    id: 'jupiter-swap-order',
    path: '/v2/jupiter/swap/order',
    method: 'POST',
    priceUsd: X402_API_PRICE_JUPITER_SWAP_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_JUPITER_SWAP_USD,
    name: 'Jupiter swap order (buy/sell token)',
    description: 'Get a Jupiter Ultra swap order for buying or selling a token on Solana; returns transaction to sign and submit',
  },
  {
    id: 'token-report',
    path: '/v2/token-report',
    method: 'GET',
    priceUsd: X402_API_PRICE_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_USD,
    name: 'Token report (Rugcheck)',
    description: 'Token report from Rugcheck',
  },
  {
    id: 'token-statistic',
    path: '/v2/token-statistic',
    method: 'GET',
    priceUsd: X402_API_PRICE_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_USD,
    name: 'Token statistic (Rugcheck)',
    description: 'Token statistics from Rugcheck',
  },
  {
    id: 'token-risk-alerts',
    path: '/v2/token-risk/alerts',
    method: 'GET',
    priceUsd: X402_API_PRICE_USD * 2,
    displayPriceUsd: X402_DISPLAY_PRICE_USD * 2,
    name: 'Token risk alerts (Rugcheck)',
    description: 'Tokens from Rugcheck stats with risk score at or above threshold (e.g. rugScoreMin=80)',
  },
  {
    id: 'bubblemaps-maps',
    path: '/v2/bubblemaps/maps',
    method: 'GET',
    priceUsd: X402_API_PRICE_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_USD,
    name: 'Bubblemaps maps',
    description: 'Bubblemaps map data',
  },
  {
    id: 'binance-correlation',
    path: '/v2/binance/correlation',
    method: 'GET',
    priceUsd: X402_API_PRICE_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_USD,
    name: 'Binance correlation',
    description: 'Binance correlation data',
  },
  {
    id: 'pump',
    path: '/v2/pump',
    method: 'GET',
    priceUsd: X402_API_PRICE_PUMP_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_PUMP_USD,
    name: 'Pump (Workfun)',
    description: 'Pump data from Workfun',
  },
  // Partner: CoinGecko x402 (simple price + onchain)
  {
    id: 'coingecko-simple-price',
    path: '/v2/coingecko/simple-price',
    method: 'GET',
    priceUsd: X402_API_PRICE_COINGECKO_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_COINGECKO_USD,
    name: 'CoinGecko simple price',
    description: 'USD price and market data for coins by symbol (e.g. btc,eth,sol) or CoinGecko id (e.g. bitcoin,ethereum)',
  },
  {
    id: 'coingecko-onchain-token-price',
    path: '/v2/coingecko/onchain/token-price',
    method: 'GET',
    priceUsd: X402_API_PRICE_COINGECKO_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_COINGECKO_USD,
    name: 'CoinGecko onchain token price',
    description: 'Token price(s) by contract address on a network; supports multiple addresses comma-separated (network + address required)',
  },
  {
    id: 'coingecko-search-pools',
    path: '/v2/coingecko/onchain/search-pools',
    method: 'GET',
    priceUsd: X402_API_PRICE_COINGECKO_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_COINGECKO_USD,
    name: 'CoinGecko search pools',
    description: 'Search pools and tokens by name, symbol, or contract address on a network (e.g. solana, base)',
  },
  {
    id: 'coingecko-trending-pools',
    path: '/v2/coingecko/onchain/trending-pools',
    method: 'GET',
    priceUsd: X402_API_PRICE_COINGECKO_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_COINGECKO_USD,
    name: 'CoinGecko trending pools',
    description: 'Trending pools and tokens by network (e.g. base, solana) with optional duration (e.g. 5m)',
  },
  {
    id: 'coingecko-onchain-token',
    path: '/v2/coingecko/onchain/token',
    method: 'GET',
    priceUsd: X402_API_PRICE_COINGECKO_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_COINGECKO_USD,
    name: 'CoinGecko onchain token',
    description: 'Token data by contract address on a network: price, liquidity, top pools (network + address required)',
  },
  // Memecoin
  {
    id: 'memecoin-fastest-holder-growth',
    path: '/v2/memecoin/fastest-holder-growth',
    method: 'GET',
    priceUsd: X402_API_PRICE_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_USD,
    name: 'Memecoin fastest holder growth',
    description: 'Memecoins with fastest holder growth',
  },
  {
    id: 'memecoin-most-mentioned-by-smart-money-x',
    path: '/v2/memecoin/most-mentioned-by-smart-money-x',
    method: 'GET',
    priceUsd: X402_API_PRICE_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_USD,
    name: 'Memecoin most mentioned by smart money (X)',
    description: 'Memecoins most mentioned by smart money on X',
  },
  {
    id: 'memecoin-accumulating-before-cex-rumors',
    path: '/v2/memecoin/accumulating-before-CEX-rumors',
    method: 'GET',
    priceUsd: X402_API_PRICE_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_USD,
    name: 'Memecoin accumulating before CEX rumors',
    description: 'Memecoins accumulating before CEX listing rumors',
  },
  {
    id: 'memecoin-strong-narrative-low-market-cap',
    path: '/v2/memecoin/strong-narrative-low-market-cap',
    method: 'GET',
    priceUsd: X402_API_PRICE_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_USD,
    name: 'Memecoin strong narrative low market cap',
    description: 'Memecoins with strong narrative and low market cap',
  },
  {
    id: 'memecoin-by-experienced-devs',
    path: '/v2/memecoin/by-experienced-devs',
    method: 'GET',
    priceUsd: X402_API_PRICE_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_USD,
    name: 'Memecoin by experienced devs',
    description: 'Memecoins by experienced developers',
  },
  {
    id: 'memecoin-unusual-whale-behavior',
    path: '/v2/memecoin/unusual-whale-behavior',
    method: 'GET',
    priceUsd: X402_API_PRICE_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_USD,
    name: 'Memecoin unusual whale behavior',
    description: 'Memecoins with unusual whale behavior',
  },
  {
    id: 'memecoin-trending-on-x-not-dex',
    path: '/v2/memecoin/trending-on-x-not-dex',
    method: 'GET',
    priceUsd: X402_API_PRICE_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_USD,
    name: 'Memecoin trending on X not DEX',
    description: 'Memecoins trending on X but not yet on DEX',
  },
  {
    id: 'memecoin-organic-traction',
    path: '/v2/memecoin/organic-traction',
    method: 'GET',
    priceUsd: X402_API_PRICE_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_USD,
    name: 'Memecoin organic traction',
    description: 'Memecoins with organic traction (AI)',
  },
  {
    id: 'memecoin-surviving-market-dumps',
    path: '/v2/memecoin/surviving-market-dumps',
    method: 'GET',
    priceUsd: X402_API_PRICE_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_USD,
    name: 'Memecoin surviving market dumps',
    description: 'Memecoins surviving market dumps',
  },
];

/** LLM/frontend may send underscore variant; backend uses hyphen. */
const JUPITER_SWAP_TOOL_ID_ALIASES = ['jupiter_swap_order', 'jupiter-swap-order'];

/** Token symbols -> mint + decimals for Jupiter swap param normalization (SOL, USDC). */
const JUPITER_SWAP_TOKEN_MAP = {
  USDC: { mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', decimals: 6 },
  SOL: { mint: 'So11111111111111111111111111111111111111112', decimals: 9 },
};

/**
 * Convert LLM-style params (from_token, to_token, amount as human number) to Jupiter API params.
 * @param {Record<string, string>} params
 * @returns {{ inputMint: string; outputMint: string; amount: string } | null}
 */
export function normalizeJupiterSwapParams(params) {
  if (!params || typeof params !== 'object') return null;
  const fromSymbol = String(params.from_token || params.fromToken || '').toUpperCase();
  const toSymbol = String(params.to_token || params.toToken || '').toUpperCase();
  const amountHuman = params.amount != null ? Number(String(params.amount).replace(/,/g, '')) : NaN;
  if (!fromSymbol || !toSymbol || !Number.isFinite(amountHuman) || amountHuman <= 0) return null;
  const fromToken = JUPITER_SWAP_TOKEN_MAP[fromSymbol];
  const toToken = JUPITER_SWAP_TOKEN_MAP[toSymbol];
  if (!fromToken || !toToken) return null;
  const amountBase = Math.round(amountHuman * 10 ** fromToken.decimals);
  if (!Number.isFinite(amountBase) || amountBase <= 0) return null;
  return {
    inputMint: fromToken.mint,
    outputMint: toToken.mint,
    amount: String(amountBase),
  };
}

/**
 * Get tool by id. Accepts "jupiter_swap_order" as alias for "jupiter-swap-order".
 * @param {string} toolId
 * @returns {AgentTool | undefined}
 */
export function getAgentTool(toolId) {
  const normalized =
    toolId && JUPITER_SWAP_TOOL_ID_ALIASES.includes(toolId) ? 'jupiter-swap-order' : toolId;
  return AGENT_TOOLS.find((t) => t.id === normalized);
}

/**
 * Match user question to a tool (and optional params). Used to choose which x402 tool to call.
 * Order matters: more specific phrases are checked first.
 * @param {string} userMessage - Last user message (question)
 * @returns {{ toolId: string; params?: Record<string, string> } | null}
 */
export function matchToolFromUserMessage(userMessage) {
  if (!userMessage || typeof userMessage !== 'string') return null;
  const text = userMessage.trim().toLowerCase();
  if (!text) return null;

  // Extract ticker for news: "news about BTC", "BTC news", "latest ETH news", etc.
  const tickerMatch = text.match(
    /\b(?:news|latest|get)\s*(?:about|for|on)?\s*([a-z0-9]{2,10})\b|\b([a-z0-9]{2,10})\s*news\b/i
  );
  const ticker = tickerMatch
    ? (tickerMatch[1] || tickerMatch[2] || '').toUpperCase()
    : 'general';

  // Extract token for signal: "bitcoin signal", "give me BTC signal", "signal for ethereum", etc.
  const signalTokenMatch = text.match(
    /\b(bitcoin|btc|ethereum|eth|solana|sol)\s+signal|\bsignal\s+(?:for|on)?\s*(bitcoin|btc|ethereum|eth|solana|sol)\b|give\s+(?:me\s+)?(?:a\s+)?(bitcoin|btc|ethereum|eth|solana|sol)\s+signal/i
  );
  const signalTokenRaw = signalTokenMatch
    ? (signalTokenMatch[1] || signalTokenMatch[2] || signalTokenMatch[3] || '').toLowerCase()
    : '';
  const TOKEN_MAP = { btc: 'bitcoin', eth: 'ethereum', sol: 'solana' };
  const signalToken = signalTokenRaw
    ? (TOKEN_MAP[signalTokenRaw] || signalTokenRaw)
    : '';

  // Ordered intent patterns: more specific first. Return first match.
  const intents = [
    // Memecoin (specific screens)
    {
      toolId: 'memecoin-fastest-holder-growth',
      test: () =>
        /fastest\s*holder\s*growth|memecoin\s*holder\s*growth|holder\s*growth\s*memecoin/i.test(
          text
        ),
    },
    {
      toolId: 'memecoin-most-mentioned-by-smart-money-x',
      test: () =>
        /most\s*mentioned\s*by\s*smart\s*money|smart\s*money\s*mentioned|mentioned\s*smart\s*money\s*x/i.test(
          text
        ),
    },
    {
      toolId: 'memecoin-accumulating-before-cex-rumors',
      test: () =>
        /accumulating\s*before\s*cex|cex\s*rumors\s*memecoin|before\s*cex\s*rumors/i.test(text),
    },
    {
      toolId: 'memecoin-strong-narrative-low-market-cap',
      test: () =>
        /strong\s*narrative\s*low\s*market\s*cap|low\s*market\s*cap\s*narrative|narrative\s*low\s*cap/i.test(
          text
        ),
    },
    {
      toolId: 'memecoin-by-experienced-devs',
      test: () =>
        /memecoin\s*experienced\s*dev|by\s*experienced\s*devs|experienced\s*developers\s*memecoin/i.test(
          text
        ),
    },
    {
      toolId: 'memecoin-unusual-whale-behavior',
      test: () =>
        /unusual\s*whale\s*behavior|whale\s*behavior\s*memecoin|memecoin\s*whale\s*behavior/i.test(
          text
        ),
    },
    {
      toolId: 'memecoin-trending-on-x-not-dex',
      test: () =>
        /trending\s*on\s*x\s*not\s*dex|trending\s*x\s*not\s*dex|memecoin\s*trending\s*x/i.test(
          text
        ),
    },
    {
      toolId: 'memecoin-organic-traction',
      test: () =>
        /organic\s*traction|memecoin\s*organic|organic\s*memecoin/i.test(text),
    },
    {
      toolId: 'memecoin-surviving-market-dumps',
      test: () =>
        /surviving\s*market\s*dumps|memecoin\s*surviving\s*dump|market\s*dump\s*survivors/i.test(
          text
        ),
    },
    // Partner: Rugcheck, Bubblemaps, Binance
    {
      toolId: 'token-report',
      test: () =>
        /token\s*report|rugcheck\s*report|token\s*report\s*rugcheck/i.test(text),
    },
    {
      toolId: 'token-statistic',
      test: () =>
        /token\s*statistic|rugcheck\s*statistic|token\s*stats\s*rugcheck/i.test(text),
    },
    {
      toolId: 'bubblemaps-maps',
      test: () =>
        /bubblemaps|bubble\s*maps|bubblemap/i.test(text),
    },
    {
      toolId: 'binance-correlation',
      test: () =>
        /binance\s*correlation|correlation\s*binance|binance\s*correl/i.test(text),
    },
    // Partner: Nansen, Jupiter, DexScreener, Pump
    {
      toolId: 'token-god-mode',
      test: () =>
        /token\s*god\s*mode|token\s*god|god\s*mode\s*token|nansen\s*token\s*god/i.test(text),
    },
    {
      toolId: 'smart-money',
      test: () =>
        /smart\s*money|smart\s*money\s*data|nansen\s*smart\s*money|whale\s*movement|whale\s*activity/i.test(
          text
        ),
    },
    // Nansen x402 endpoints (per-endpoint)
    {
      toolId: 'nansen-address-current-balance',
      test: () =>
        /(?:nansen\s+)?address\s+current\s+balance|(?:nansen\s+)?current\s+balance\s+(?:for\s+)?(?:wallet|address)|wallet\s+balance\s+nansen/i.test(text),
    },
    {
      toolId: 'nansen-address-historical-balances',
      test: () =>
        /(?:nansen\s+)?(?:address\s+)?historical\s+balances?|historical\s+balance\s+(?:for\s+)?(?:wallet|address)/i.test(text),
    },
    {
      toolId: 'nansen-smart-money-netflow',
      test: () =>
        /(?:nansen\s+)?smart\s+money\s+net\s*flow|net\s*flow\s+(?:smart\s+money)?|smart\s+money\s+accumulation/i.test(text),
    },
    {
      toolId: 'nansen-smart-money-holdings',
      test: () =>
        /(?:nansen\s+)?smart\s+money\s+holdings?|smart\s+money\s+positions?/i.test(text),
    },
    {
      toolId: 'nansen-smart-money-dex-trades',
      test: () =>
        /(?:nansen\s+)?smart\s+money\s+dex\s*trades?|smart\s+money\s+trades?/i.test(text),
    },
    {
      toolId: 'nansen-tgm-holders',
      test: () =>
        /(?:nansen\s+)?tgm\s+holders?|(?:nansen\s+)?token\s+holders?|holders?\s+(?:for\s+)?token\s+(?:god\s*mode)?/i.test(text),
    },
    {
      toolId: 'nansen-tgm-flow-intelligence',
      test: () =>
        /(?:nansen\s+)?(?:tgm\s+)?flow\s+intelligence|flow\s+intelligence\s+(?:for\s+)?token/i.test(text),
    },
    {
      toolId: 'nansen-tgm-flows',
      test: () =>
        /(?:nansen\s+)?tgm\s+flows?|(?:nansen\s+)?token\s+flows?|flow\s+history\s+(?:for\s+)?token/i.test(text),
    },
    {
      toolId: 'nansen-tgm-dex-trades',
      test: () =>
        /(?:nansen\s+)?tgm\s+dex\s*trades?|(?:nansen\s+)?token\s+dex\s*trades?/i.test(text),
    },
    {
      toolId: 'nansen-token-screener',
      test: () =>
        /(?:nansen\s+)?token\s+screener|token\s+screener\s+nansen/i.test(text),
    },
    {
      toolId: 'nansen-profiler-counterparties',
      test: () =>
        /(?:nansen\s+)?(?:address\s+)?counterparties?|counterparties?\s+(?:for\s+)?(?:wallet|address)/i.test(text),
    },
    {
      toolId: 'nansen-tgm-pnl-leaderboard',
      test: () =>
        /(?:nansen\s+)?(?:tgm\s+)?pnl\s+leaderboard|pnl\s+leaderboard\s+(?:for\s+)?token/i.test(text),
    },
    {
      toolId: 'trending-jupiter',
      test: () =>
        /trending\s*(on\s*)?jupiter|jupiter\s*trending|trending\s*tokens?\s*(on\s*jupiter)?/i.test(
          text
        ),
    },
    {
      toolId: 'jupiter-swap-order',
      test: () =>
        /jupiter\s*swap|swap\s*(order|token|solana)?|buy\s*token\s*(on\s*solana)?|sell\s*token\s*(on\s*solana)?|swap\s*(via\s*)?jupiter/i.test(
          text
        ),
    },
    {
      toolId: 'dexscreener',
      test: () =>
        /dexscreener|dex\s*screener|dex\s*data|dex\s*screen/i.test(text),
    },
    {
      toolId: 'pump',
      test: () =>
        /pump\.fun|pump\s*fun|pump\s*data|workfun\s*pump/i.test(text),
    },
    // Partner: CoinGecko x402 onchain
    {
      toolId: 'coingecko-search-pools',
      test: () =>
        /coingecko\s*search\s*pools|search\s*pools\s*coingecko|search\s*tokens?\s*(and\s*)?pools?|pools?\s*search\s*(solana|base)/i.test(text),
    },
    {
      toolId: 'coingecko-trending-pools',
      test: () =>
        /coingecko\s*trending|trending\s*pools?\s*(on\s*)?(base|solana)|trending\s*(on\s*)?(base|solana)\s*pools?|coingecko\s*trending\s*pools?/i.test(text),
    },
    {
      toolId: 'coingecko-onchain-token',
      test: () =>
        /coingecko\s*token\s*(data|by\s*address)?|token\s*data\s*coingecko|onchain\s*token\s*(data)?|token\s*by\s*address\s*coingecko/i.test(text),
    },
    {
      toolId: 'coingecko-simple-price',
      test: () =>
        /(?:what\'?s?|get|current|latest)?\s*(?:the\s*)?price\s*(?:of|for)?\s*(?:btc|eth|sol|bitcoin|ethereum|solana|crypto)|coingecko\s*simple\s*price|price\s*(?:of\s*)?(?:btc|eth|sol|bitcoin|ethereum)/i.test(text),
    },
    {
      toolId: 'coingecko-onchain-token-price',
      test: () =>
        /token\s*price\s*by\s*(?:contract\s*)?address|onchain\s*token\s*price|price\s*of\s*token\s*(?:at|by)\s*address|coingecko\s*token\s*price/i.test(text),
    },
    // Core: signal, event, browse, x-search, gems, KOL, digest, headline
    {
      toolId: 'signal',
      test: () =>
        /trading\s*signal|create\s*signal|signal\s*data|get\s*signal|give\s*(me\s*)?(a\s*)?(solana|btc|eth|bitcoin|ethereum|crypto)?\s*signal|(solana|btc|eth|bitcoin|ethereum|crypto|token)\s*signal|signal\s*(for|on)?\s*(solana|btc|eth|bitcoin|ethereum|crypto)?/i.test(
          text
        ),
      params: () => (signalToken ? { token: signalToken } : {}),
    },
    {
      toolId: 'event',
      test: () =>
        /event\s*data|events\s*(please|now)?|crypto\s*events|get\s*events/i.test(text),
    },
    {
      toolId: 'browse',
      test: () =>
        /browse|discovery|browse\s*data/i.test(text),
    },
    {
      toolId: 'x-search',
      test: () =>
        /x\s*search|search\s*x|twitter\s*search|search\s*twitter|x\s*twitter\s*search/i.test(
          text
        ),
    },
    {
      toolId: 'gems',
      test: () =>
        /gems|curated\s*insights|gems\s*data/i.test(text),
    },
    {
      toolId: 'x-kol',
      test: () =>
        /x\s*kol|kol\s*x|twitter\s*kol|key\s*opinion\s*leader\s*x/i.test(text),
    },
    {
      toolId: 'crypto-kol',
      test: () =>
        /crypto\s*kol|kol\s*crypto|key\s*opinion\s*leader\s*crypto/i.test(text),
    },
    {
      toolId: 'trending-headline',
      test: () =>
        /trending\s*headline|headlines?\s*trending|trending\s*headlines?/i.test(text),
    },
    {
      toolId: 'sundown-digest',
      test: () =>
        /sundown\s*digest|daily\s*digest|sundown\s*daily|digest\s*sundown/i.test(text),
    },
    {
      toolId: 'analytics-summary',
      test: () =>
        /analytics\s*summary|full\s*analytics|all\s*analytics|dashboard\s*data|summary\s*analytics/i.test(text),
    },
    {
      toolId: 'research',
      test: () =>
        /deep\s*research|research\s*(report|analysis)?|run\s*research|do\s*research/i.test(text),
    },
    {
      toolId: 'sentiment',
      test: () =>
        /sentiment\s*(analysis)?|market\s*sentiment|sentiment\s*data|feelings?\s*about\s*(market|crypto)/i.test(
          text
        ),
    },
    {
      toolId: 'news',
      test: () =>
        /(latest|recent|crypto|get|fetch|show)\s*news|news\s*(about|for|on)?|what\'?s\s*the\s*news|news\s*(please|now)/i.test(
          text
        ),
      params: () => (ticker && ticker !== 'GENERAL' ? { ticker } : {}),
    },
    {
      toolId: 'check-status',
      test: () =>
        /check\s*status|api\s*status|health\s*check|is\s*(the\s*)?(api|server)\s*up|status\s*check/i.test(
          text
        ),
    },
  ];

  for (const { toolId, test, params } of intents) {
    if (test()) {
      const tool = getAgentTool(toolId);
      if (tool) {
        return {
          toolId,
          params: typeof params === 'function' ? params() : undefined,
        };
      }
    }
  }
  return null;
}

/**
 * Human-readable list of capabilities for agent system prompt. Grouped to match v2 API structure.
 * Excludes check-status (internal). Used so the agent knows exactly which v2 API tools are available.
 */
export function getCapabilitiesList() {
  const exclude = new Set(['check-status']);
  const core = ['news', 'signal', 'sentiment', 'event', 'browse', 'x-search', 'exa-search', 'research', 'gems', 'x-kol', 'crypto-kol', 'trending-headline', 'sundown-digest', 'analytics-summary'];
  const partner = ['smart-money', 'token-god-mode', 'dexscreener', 'trending-jupiter', 'jupiter-swap-order', 'token-report', 'token-statistic', 'token-risk-alerts', 'bubblemaps-maps', 'binance-correlation', 'pump', 'coingecko-simple-price', 'coingecko-onchain-token-price', 'coingecko-search-pools', 'coingecko-trending-pools', 'coingecko-onchain-token'];
  const memecoin = AGENT_TOOLS.filter((t) => t.id.startsWith('memecoin-')).map((t) => t.id);

  const lines = ['Available v2 API tools (use these when the user asks for data):', ''];

  const fmt = (tools) =>
    tools
      .filter((id) => !exclude.has(id))
      .map((id) => {
        const t = getAgentTool(id);
        return t ? `• ${t.name}: ${t.description}` : null;
      })
      .filter(Boolean);

  lines.push('Core:', ...fmt(core), '');
  lines.push('Partner (Nansen, DexScreener, Jupiter, Rugcheck, Bubblemaps, Binance, Workfun):', ...fmt(partner), '');
  lines.push('Memecoin screens:', ...fmt(memecoin));

  return lines;
}

/**
 * Tool list for LLM tool selection: id, name, description, and optional params hint.
 * Used so Jatevo can dynamically pick the right tool from the user question.
 * @returns {Array<{ id: string; name: string; description: string; paramsHint?: string }>}
 */
export function getToolsForLlmSelection() {
  return AGENT_TOOLS.map((t) => {
    const out = { id: t.id, name: t.name, description: t.description };
    if (t.id === 'news') {
      out.paramsHint = 'Optional params: ticker (BTC, ETH, SOL, or general)';
    }
    if (t.id === 'signal') {
      out.paramsHint = 'Optional params: token (bitcoin, ethereum, solana) — use the token the user asked for';
    }
    if (t.id === 'exa-search') {
      out.paramsHint = 'Params: query (required) — search query from the user, e.g. "bitcoin insight", "latest Nvidia news"';
    }
    if (t.id === 'coingecko-simple-price') {
      out.paramsHint = 'Params: symbols (e.g. btc,eth,sol) or ids (e.g. bitcoin,ethereum); optional include_market_cap, include_24hr_vol, include_24hr_change';
    }
    if (t.id === 'coingecko-onchain-token-price') {
      out.paramsHint = 'Params: network (e.g. base, solana, eth), address (contract address, required; comma-separated for multiple)';
    }
    if (t.id === 'coingecko-search-pools') {
      out.paramsHint = 'Params: query (required), network (e.g. solana, base)';
    }
    if (t.id === 'coingecko-trending-pools') {
      out.paramsHint = 'Params: network (e.g. base, solana), optional duration (e.g. 5m)';
    }
    if (t.id === 'coingecko-onchain-token') {
      out.paramsHint = 'Params: network (e.g. base, solana, eth), address (token contract address, required)';
    }
    return out;
  });
}
