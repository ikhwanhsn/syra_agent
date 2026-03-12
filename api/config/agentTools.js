/**
 * Agent tools registry: x402 API v2 resources the Syra agent can call.
 * Each tool is paid automatically with the agent wallet; balance is checked first.
 */
import {
  X402_API_PRICE_USD,
  X402_API_PRICE_CHECK_STATUS_USD,
  X402_API_PRICE_NEWS_USD,
  X402_API_PRICE_NANSEN_USD,
  X402_API_PRICE_NANSEN_PREMIUM_USD,
  X402_API_PRICE_DEXSCREENER_USD,
  X402_API_PRICE_ANALYTICS_SUMMARY_USD,
  X402_API_PRICE_JUPITER_SWAP_USD,
  X402_API_PRICE_COINGECKO_USD,
  X402_API_PRICE_EXA_SEARCH_USD,
  X402_API_PRICE_COINMARKETCAP_USD,
  X402_API_PRICE_8004_USD,
  X402_API_PRICE_8004SCAN_USD,
  X402_API_PRICE_HEYLOL_USD,
  X402_API_PRICE_KRAKEN_USD,
  X402_API_PRICE_OKX_USD,
} from './x402Pricing.js';
import {
  X402_DISPLAY_PRICE_USD,
  X402_DISPLAY_PRICE_CHECK_STATUS_USD,
  X402_DISPLAY_PRICE_NEWS_USD,
  X402_DISPLAY_PRICE_NANSEN_USD,
  X402_DISPLAY_PRICE_NANSEN_PREMIUM_USD,
  X402_DISPLAY_PRICE_DEXSCREENER_USD,
  X402_DISPLAY_PRICE_ANALYTICS_SUMMARY_USD,
  X402_DISPLAY_PRICE_JUPITER_SWAP_USD,
  X402_DISPLAY_PRICE_COINGECKO_USD,
  X402_DISPLAY_PRICE_EXA_SEARCH_USD,
  X402_DISPLAY_PRICE_COINMARKETCAP_USD,
  X402_DISPLAY_PRICE_8004_USD,
  X402_DISPLAY_PRICE_8004SCAN_USD,
  X402_DISPLAY_PRICE_HEYLOL_USD,
  X402_DISPLAY_PRICE_KRAKEN_USD,
  X402_DISPLAY_PRICE_OKX_USD,
} from './x402Pricing.js';

/** @typedef {{ id: string; path: string; method: string; priceUsd: number; displayPriceUsd?: number; name: string; description: string }} AgentTool */

/**
 * List of agent tools (x402 endpoints). Path is relative to API base (e.g. /news). Nansen tools call api.nansen.ai directly.
 * priceUsd = charged amount (env-based); displayPriceUsd = real API cost shown in UI (production).
 * @type {AgentTool[]}
 */
export const AGENT_TOOLS = [
  // Core
  {
    id: 'check-status',
    path: '/check-status',
    method: 'GET',
    priceUsd: X402_API_PRICE_CHECK_STATUS_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_CHECK_STATUS_USD,
    name: 'Check API status',
    description: 'Health check for API server status and connectivity',
  },
  {
    id: 'news',
    path: '/news',
    method: 'GET',
    priceUsd: X402_API_PRICE_NEWS_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_NEWS_USD,
    name: 'Crypto news',
    description: 'Get latest crypto news and market updates (optional ticker: BTC, ETH, or "general")',
  },
  {
    id: 'signal',
    path: '/signal',
    method: 'GET',
    priceUsd: X402_API_PRICE_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_USD,
    name: 'Trading signal',
    description: 'Trading signal creation / signal data',
  },
  {
    id: 'sentiment',
    path: '/sentiment',
    method: 'GET',
    priceUsd: X402_API_PRICE_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_USD,
    name: 'Sentiment analysis',
    description: 'Get market sentiment analysis',
  },
  {
    id: 'event',
    path: '/event',
    method: 'GET',
    priceUsd: X402_API_PRICE_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_USD,
    name: 'Event',
    description: 'Event data and updates',
  },
  {
    id: 'exa-search',
    path: '/exa-search',
    method: 'GET',
    priceUsd: X402_API_PRICE_EXA_SEARCH_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_EXA_SEARCH_USD,
    name: 'EXA search',
    description: 'EXA AI web search – dynamic query only',
  },
  {
    id: 'trending-headline',
    path: '/trending-headline',
    method: 'GET',
    priceUsd: X402_API_PRICE_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_USD,
    name: 'Trending headline',
    description: 'Trending headlines',
  },
  {
    id: 'sundown-digest',
    path: '/sundown-digest',
    method: 'GET',
    priceUsd: X402_API_PRICE_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_USD,
    name: 'Sundown digest',
    description: 'Sundown digest / daily summary',
  },
  {
    id: 'analytics-summary',
    path: '/analytics/summary',
    method: 'GET',
    priceUsd: X402_API_PRICE_ANALYTICS_SUMMARY_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_ANALYTICS_SUMMARY_USD,
    name: 'Analytics summary',
    description: 'Full analytics: dexscreener, token stats, Jupiter trending, smart money, Binance correlation',
  },
  // 8004 Trustless Agent Registry (Solana)
  {
    id: '8004-stats',
    path: '/8004/stats',
    method: 'GET',
    priceUsd: X402_API_PRICE_8004_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_8004_USD,
    name: '8004 global stats',
    description: '8004 registry global stats: total agents, feedbacks, trust tiers',
  },
  {
    id: '8004-leaderboard',
    path: '/8004/leaderboard',
    method: 'GET',
    priceUsd: X402_API_PRICE_8004_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_8004_USD,
    name: '8004 leaderboard',
    description: '8004 agent leaderboard by trust tier (optional minTier, limit)',
  },
  {
    id: '8004-agents-search',
    path: '/8004/agents/search',
    method: 'GET',
    priceUsd: X402_API_PRICE_8004_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_8004_USD,
    name: '8004 search agents',
    description: '8004 search agents by owner, creator, collection (optional limit, offset)',
  },
  // 8004scan.io Public API (ERC-8004 agent discovery; 8004scan.io)
  {
    id: '8004scan-stats',
    path: '/8004scan/stats',
    method: 'GET',
    priceUsd: X402_API_PRICE_8004SCAN_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_8004SCAN_USD,
    name: '8004scan platform stats',
    description: '8004scan.io platform statistics: total agents, users, feedbacks, validations',
  },
  {
    id: '8004scan-chains',
    path: '/8004scan/chains',
    method: 'GET',
    priceUsd: X402_API_PRICE_8004SCAN_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_8004SCAN_USD,
    name: '8004scan supported chains',
    description: '8004scan.io list of supported blockchain networks',
  },
  {
    id: '8004scan-agents',
    path: '/8004scan/agents',
    method: 'GET',
    priceUsd: X402_API_PRICE_8004SCAN_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_8004SCAN_USD,
    name: '8004scan list agents',
    description: '8004scan.io paginated list of ERC-8004 agents (optional page, limit, chainId, ownerAddress, search, protocol, sortBy, sortOrder)',
  },
  {
    id: '8004scan-agents-search',
    path: '/8004scan/agents/search',
    method: 'GET',
    priceUsd: X402_API_PRICE_8004SCAN_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_8004SCAN_USD,
    name: '8004scan semantic search agents',
    description: '8004scan.io semantic search for agents by query (q required; optional limit, chainId, semanticWeight)',
  },
  {
    id: '8004scan-agent',
    path: '/8004scan/agent',
    method: 'GET',
    priceUsd: X402_API_PRICE_8004SCAN_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_8004SCAN_USD,
    name: '8004scan get agent by ID',
    description: '8004scan.io get a single agent by chainId and tokenId (chainId and tokenId required)',
  },
  {
    id: '8004scan-account-agents',
    path: '/8004scan/account-agents',
    method: 'GET',
    priceUsd: X402_API_PRICE_8004SCAN_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_8004SCAN_USD,
    name: '8004scan agents by owner',
    description: '8004scan.io list agents owned by an address (address required; optional page, limit, sortBy, sortOrder)',
  },
  {
    id: '8004scan-feedbacks',
    path: '/8004scan/feedbacks',
    method: 'GET',
    priceUsd: X402_API_PRICE_8004SCAN_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_8004SCAN_USD,
    name: '8004scan list feedbacks',
    description: '8004scan.io paginated agent feedbacks (optional page, limit, chainId, tokenId, minScore, maxScore)',
  },
  // Partner: Nansen
  {
    id: 'smart-money',
    path: '/smart-money',
    method: 'GET',
    priceUsd: X402_API_PRICE_NANSEN_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_NANSEN_USD,
    name: 'Smart money (Nansen)',
    description: 'Smart money data from Nansen',
  },
  {
    id: 'token-god-mode',
    path: '/token-god-mode',
    method: 'GET',
    priceUsd: X402_API_PRICE_NANSEN_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_NANSEN_USD,
    name: 'Token god mode (Nansen)',
    description: 'Token god mode insights from Nansen',
  },
  // Nansen x402 endpoints — agent calls real Nansen API (api.nansen.ai), not our route
  {
    id: 'nansen-address-current-balance',
    path: '/nansen/profiler/address/current-balance',
    nansenPath: '/api/v1/profiler/address/current-balance',
    method: 'POST',
    priceUsd: X402_API_PRICE_NANSEN_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_NANSEN_USD,
    name: 'Nansen: address current balance',
    description: 'Current token holdings for a wallet or entity (chain + address required)',
  },
  {
    id: 'nansen-address-historical-balances',
    path: '/nansen/profiler/address/historical-balances',
    nansenPath: '/api/v1/profiler/address/historical-balances',
    method: 'POST',
    priceUsd: X402_API_PRICE_NANSEN_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_NANSEN_USD,
    name: 'Nansen: address historical balances',
    description: 'Historical balances for a wallet (chain + address required)',
  },
  {
    id: 'nansen-smart-money-netflow',
    path: '/nansen/smart-money/netflow',
    nansenPath: '/api/v1/smart-money/netflow',
    method: 'POST',
    priceUsd: X402_API_PRICE_NANSEN_PREMIUM_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_NANSEN_PREMIUM_USD,
    name: 'Nansen: smart money netflow',
    description: 'Smart money net flow / accumulation (chains e.g. ["solana"]; optional filters, pagination)',
  },
  {
    id: 'nansen-smart-money-holdings',
    path: '/nansen/smart-money/holdings',
    nansenPath: '/api/v1/smart-money/holdings',
    method: 'POST',
    priceUsd: X402_API_PRICE_NANSEN_PREMIUM_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_NANSEN_PREMIUM_USD,
    name: 'Nansen: smart money holdings',
    description: 'Current smart money positions (chains e.g. ["solana"]; optional filters, pagination)',
  },
  {
    id: 'nansen-smart-money-dex-trades',
    path: '/nansen/smart-money/dex-trades',
    nansenPath: '/api/v1/smart-money/dex-trades',
    method: 'POST',
    priceUsd: X402_API_PRICE_NANSEN_PREMIUM_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_NANSEN_PREMIUM_USD,
    name: 'Nansen: smart money DEX trades',
    description: 'Recent DEX trades by smart money (chains; optional filters, pagination)',
  },
  {
    id: 'nansen-tgm-holders',
    path: '/nansen/tgm/holders',
    nansenPath: '/api/v1/tgm/holders',
    method: 'POST',
    priceUsd: X402_API_PRICE_NANSEN_PREMIUM_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_NANSEN_PREMIUM_USD,
    name: 'Nansen: TGM holders',
    description: 'Token holders from Token God Mode (chain + token_address required)',
  },
  {
    id: 'nansen-tgm-flow-intelligence',
    path: '/nansen/tgm/flow-intelligence',
    nansenPath: '/api/v1/tgm/flow-intelligence',
    method: 'POST',
    priceUsd: X402_API_PRICE_NANSEN_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_NANSEN_USD,
    name: 'Nansen: TGM flow intelligence',
    description: 'Flow intelligence for a token (chain + token_address required)',
  },
  {
    id: 'nansen-tgm-flows',
    path: '/nansen/tgm/flows',
    nansenPath: '/api/v1/tgm/flows',
    method: 'POST',
    priceUsd: X402_API_PRICE_NANSEN_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_NANSEN_USD,
    name: 'Nansen: TGM flows',
    description: 'Flow history for a token (chain, date range, token_address; optional filters)',
  },
  {
    id: 'nansen-tgm-dex-trades',
    path: '/nansen/tgm/dex-trades',
    nansenPath: '/api/v1/tgm/dex-trades',
    method: 'POST',
    priceUsd: X402_API_PRICE_NANSEN_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_NANSEN_USD,
    name: 'Nansen: TGM DEX trades',
    description: 'DEX trades for a token (chain + token_address; optional date, filters)',
  },
  {
    id: 'nansen-token-screener',
    path: '/nansen/token-screener',
    nansenPath: '/api/v1/token-screener',
    method: 'POST',
    priceUsd: X402_API_PRICE_NANSEN_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_NANSEN_USD,
    name: 'Nansen: token screener',
    description: 'Token screener data (chain; optional filters, pagination)',
  },
  {
    id: 'nansen-profiler-counterparties',
    path: '/nansen/profiler/address/counterparties',
    nansenPath: '/api/v1/profiler/address/counterparties',
    method: 'POST',
    priceUsd: X402_API_PRICE_NANSEN_PREMIUM_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_NANSEN_PREMIUM_USD,
    name: 'Nansen: address counterparties',
    description: 'Counterparties for a wallet (chain + address required)',
  },
  {
    id: 'nansen-tgm-pnl-leaderboard',
    path: '/nansen/tgm/pnl-leaderboard',
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
    path: '/dexscreener',
    method: 'GET',
    priceUsd: X402_API_PRICE_DEXSCREENER_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_DEXSCREENER_USD,
    name: 'DexScreener',
    description: 'DexScreener data',
  },
  {
    id: 'trending-jupiter',
    path: '/trending-jupiter',
    method: 'GET',
    priceUsd: X402_API_PRICE_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_USD,
    name: 'Trending on Jupiter',
    description: 'Trending tokens on Jupiter',
  },
  {
    id: 'jupiter-swap-order',
    path: '/jupiter/swap/order',
    method: 'POST',
    priceUsd: X402_API_PRICE_JUPITER_SWAP_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_JUPITER_SWAP_USD,
    name: 'Jupiter swap order (buy/sell token)',
    description: 'Get a Jupiter Ultra swap order for buying or selling a token on Solana; returns transaction to sign and submit',
  },
  {
    id: 'token-report',
    path: '/token-report',
    method: 'GET',
    priceUsd: X402_API_PRICE_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_USD,
    name: 'Token report (Rugcheck)',
    description: 'Token report from Rugcheck',
  },
  {
    id: 'token-statistic',
    path: '/token-statistic',
    method: 'GET',
    priceUsd: X402_API_PRICE_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_USD,
    name: 'Token statistic (Rugcheck)',
    description: 'Token statistics from Rugcheck',
  },
  {
    id: 'token-risk-alerts',
    path: '/token-risk/alerts',
    method: 'GET',
    priceUsd: X402_API_PRICE_USD * 2,
    displayPriceUsd: X402_DISPLAY_PRICE_USD * 2,
    name: 'Token risk alerts (Rugcheck)',
    description: 'Tokens from Rugcheck stats with risk score at or above threshold (e.g. rugScoreMin=80)',
  },
  {
    id: 'bubblemaps-maps',
    path: '/bubblemaps/maps',
    method: 'GET',
    priceUsd: X402_API_PRICE_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_USD,
    name: 'Bubblemaps maps',
    description: 'Bubblemaps map data',
  },
  {
    id: 'binance-correlation',
    path: '/binance/correlation',
    method: 'GET',
    priceUsd: X402_API_PRICE_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_USD,
    name: 'Binance correlation',
    description: 'Binance correlation data',
  },
  // Partner: Kraken market (ticker, orderbook, ohlc, trades, status, server-time via kraken-cli)
  {
    id: 'kraken-ticker',
    path: '/kraken/ticker',
    method: 'GET',
    priceUsd: X402_API_PRICE_KRAKEN_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_KRAKEN_USD,
    name: 'Kraken ticker',
    description: 'Kraken ticker (market data). Optional pair (default BTCUSD), comma-separated for multiple.',
  },
  {
    id: 'kraken-orderbook',
    path: '/kraken/orderbook',
    method: 'GET',
    priceUsd: X402_API_PRICE_KRAKEN_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_KRAKEN_USD,
    name: 'Kraken orderbook',
    description: 'Kraken order book. Optional pair (default BTCUSD), count (default 25).',
  },
  {
    id: 'kraken-ohlc',
    path: '/kraken/ohlc',
    method: 'GET',
    priceUsd: X402_API_PRICE_KRAKEN_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_KRAKEN_USD,
    name: 'Kraken OHLC',
    description: 'Kraken OHLC candles. Optional pair (default BTCUSD), interval (default 60).',
  },
  {
    id: 'kraken-trades',
    path: '/kraken/trades',
    method: 'GET',
    priceUsd: X402_API_PRICE_KRAKEN_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_KRAKEN_USD,
    name: 'Kraken trades',
    description: 'Kraken recent trades. Optional pair (default BTCUSD), count (default 100).',
  },
  {
    id: 'kraken-status',
    path: '/kraken/status',
    method: 'GET',
    priceUsd: X402_API_PRICE_KRAKEN_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_KRAKEN_USD,
    name: 'Kraken status',
    description: 'Kraken system status',
  },
  {
    id: 'kraken-server-time',
    path: '/kraken/server-time',
    method: 'GET',
    priceUsd: X402_API_PRICE_KRAKEN_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_KRAKEN_USD,
    name: 'Kraken server time',
    description: 'Kraken server time',
  },
  // Partner: OKX market (ticker, tickers, books, candles, trades, funding-rate, open-interest, etc.)
  {
    id: 'okx-ticker',
    path: '/okx/ticker',
    method: 'GET',
    priceUsd: X402_API_PRICE_OKX_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_OKX_USD,
    name: 'OKX ticker',
    description: 'OKX single ticker (instId default BTC-USDT). Supports spot and swap.',
  },
  {
    id: 'okx-tickers',
    path: '/okx/tickers',
    method: 'GET',
    priceUsd: X402_API_PRICE_OKX_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_OKX_USD,
    name: 'OKX tickers',
    description: 'OKX all tickers by type (instType: SPOT, SWAP, FUTURES, OPTION).',
  },
  {
    id: 'okx-books',
    path: '/okx/books',
    method: 'GET',
    priceUsd: X402_API_PRICE_OKX_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_OKX_USD,
    name: 'OKX order book',
    description: 'OKX order book (instId default BTC-USDT, sz depth default 20).',
  },
  {
    id: 'okx-candles',
    path: '/okx/candles',
    method: 'GET',
    priceUsd: X402_API_PRICE_OKX_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_OKX_USD,
    name: 'OKX candles',
    description: 'OKX OHLC candles (instId, bar: 1m,1H,1D, etc., limit default 100).',
  },
  {
    id: 'okx-trades',
    path: '/okx/trades',
    method: 'GET',
    priceUsd: X402_API_PRICE_OKX_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_OKX_USD,
    name: 'OKX trades',
    description: 'OKX recent trades (instId default BTC-USDT, limit default 100).',
  },
  {
    id: 'okx-funding-rate',
    path: '/okx/funding-rate',
    method: 'GET',
    priceUsd: X402_API_PRICE_OKX_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_OKX_USD,
    name: 'OKX funding rate',
    description: 'OKX perpetual funding rate (instId default BTC-USDT-SWAP).',
  },
  {
    id: 'okx-open-interest',
    path: '/okx/open-interest',
    method: 'GET',
    priceUsd: X402_API_PRICE_OKX_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_OKX_USD,
    name: 'OKX open interest',
    description: 'OKX open interest for derivatives (instId default BTC-USDT-SWAP).',
  },
  {
    id: 'okx-mark-price',
    path: '/okx/mark-price',
    method: 'GET',
    priceUsd: X402_API_PRICE_OKX_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_OKX_USD,
    name: 'OKX mark price',
    description: 'OKX mark price for derivatives (instId default BTC-USDT-SWAP).',
  },
  {
    id: 'okx-time',
    path: '/okx/time',
    method: 'GET',
    priceUsd: X402_API_PRICE_OKX_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_OKX_USD,
    name: 'OKX server time',
    description: 'OKX server time.',
  },
  // OKX DEX / On-chain Market (token by contract address + chain; different from CEX ticker/candles)
  {
    id: 'okx-dex-price',
    path: '/okx/dex/price',
    method: 'GET',
    priceUsd: X402_API_PRICE_OKX_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_OKX_USD,
    name: 'OKX DEX price',
    description: 'On-chain single token price by contract address and chain (e.g. solana, ethereum, base)',
  },
  {
    id: 'okx-dex-prices',
    path: '/okx/dex/prices',
    method: 'GET',
    priceUsd: X402_API_PRICE_OKX_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_OKX_USD,
    name: 'OKX DEX batch prices',
    description: 'On-chain batch token prices (tokens: comma-separated chainIndex:address or addresses; optional chain)',
  },
  {
    id: 'okx-dex-kline',
    path: '/okx/dex/kline',
    method: 'GET',
    priceUsd: X402_API_PRICE_OKX_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_OKX_USD,
    name: 'OKX DEX kline',
    description: 'On-chain candlestick/K-line by token address and chain (bar: 1m,1H,1D; limit up to 299)',
  },
  {
    id: 'okx-dex-trades',
    path: '/okx/dex/trades',
    method: 'GET',
    priceUsd: X402_API_PRICE_OKX_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_OKX_USD,
    name: 'OKX DEX trades',
    description: 'On-chain recent trades for a token by address and chain (limit up to 500)',
  },
  {
    id: 'okx-dex-index',
    path: '/okx/dex/index',
    method: 'GET',
    priceUsd: X402_API_PRICE_OKX_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_OKX_USD,
    name: 'OKX DEX index price',
    description: 'On-chain index price (aggregated multi-source) by token address and chain; empty address for native token',
  },
  {
    id: 'okx-dex-signal-chains',
    path: '/okx/dex/signal-chains',
    method: 'GET',
    priceUsd: X402_API_PRICE_OKX_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_OKX_USD,
    name: 'OKX DEX signal chains',
    description: 'Chains that support OKX market signals (smart money / whale / KOL)',
  },
  {
    id: 'okx-dex-signal-list',
    path: '/okx/dex/signal-list',
    method: 'GET',
    priceUsd: X402_API_PRICE_OKX_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_OKX_USD,
    name: 'OKX DEX signal list',
    description: 'Latest buy-direction signals by chain (wallet-type: 1=Smart Money, 2=KOL, 3=Whale; min-amount-usd, token-address)',
  },
  {
    id: 'okx-dex-memepump-chains',
    path: '/okx/dex/memepump-chains',
    method: 'GET',
    priceUsd: X402_API_PRICE_OKX_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_OKX_USD,
    name: 'OKX DEX memepump chains',
    description: 'Supported chains and protocols for meme pump (e.g. pumpfun, bonkers)',
  },
  {
    id: 'okx-dex-memepump-tokens',
    path: '/okx/dex/memepump-tokens',
    method: 'GET',
    priceUsd: X402_API_PRICE_OKX_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_OKX_USD,
    name: 'OKX DEX memepump tokens',
    description: 'List meme pump tokens by chain and stage: NEW, MIGRATING, MIGRATED (optional protocol-id-list, filters)',
  },
  {
    id: 'okx-dex-memepump-token-details',
    path: '/okx/dex/memepump-token-details',
    method: 'GET',
    priceUsd: X402_API_PRICE_OKX_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_OKX_USD,
    name: 'OKX DEX memepump token details',
    description: 'Detailed meme pump token info and audit tags (address, chain)',
  },
  {
    id: 'okx-dex-memepump-token-dev-info',
    path: '/okx/dex/memepump-token-dev-info',
    method: 'GET',
    priceUsd: X402_API_PRICE_OKX_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_OKX_USD,
    name: 'OKX DEX memepump token dev info',
    description: 'Developer reputation and holding info for a meme token (rug pulls, migrations)',
  },
  {
    id: 'okx-dex-memepump-similar-tokens',
    path: '/okx/dex/memepump-similar-tokens',
    method: 'GET',
    priceUsd: X402_API_PRICE_OKX_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_OKX_USD,
    name: 'OKX DEX memepump similar tokens',
    description: 'Similar tokens by same creator (address, chain)',
  },
  {
    id: 'okx-dex-memepump-token-bundle-info',
    path: '/okx/dex/memepump-token-bundle-info',
    method: 'GET',
    priceUsd: X402_API_PRICE_OKX_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_OKX_USD,
    name: 'OKX DEX memepump token bundle info',
    description: 'Bundle/sniper analysis for a meme token (address, chain)',
  },
  {
    id: 'okx-dex-memepump-aped-wallet',
    path: '/okx/dex/memepump-aped-wallet',
    method: 'GET',
    priceUsd: X402_API_PRICE_OKX_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_OKX_USD,
    name: 'OKX DEX memepump aped wallet',
    description: 'Aped (same-car) wallet list for a token (address, chain; optional wallet to highlight)',
  },
  // Partner: CoinGecko x402 (simple price + onchain)
  {
    id: 'coingecko-simple-price',
    path: '/coingecko/simple-price',
    method: 'GET',
    priceUsd: X402_API_PRICE_COINGECKO_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_COINGECKO_USD,
    name: 'CoinGecko simple price',
    description: 'USD price and market data for coins by symbol (e.g. btc,eth,sol) or CoinGecko id (e.g. bitcoin,ethereum)',
  },
  {
    id: 'coingecko-onchain-token-price',
    path: '/coingecko/onchain/token-price',
    method: 'GET',
    priceUsd: X402_API_PRICE_COINGECKO_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_COINGECKO_USD,
    name: 'CoinGecko onchain token price',
    description: 'Token price(s) by contract address on a network; supports multiple addresses comma-separated (network + address required)',
  },
  {
    id: 'coingecko-search-pools',
    path: '/coingecko/onchain/search-pools',
    method: 'GET',
    priceUsd: X402_API_PRICE_COINGECKO_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_COINGECKO_USD,
    name: 'CoinGecko search pools',
    description: 'Search pools and tokens by name, symbol, or contract address on a network (e.g. solana, base)',
  },
  {
    id: 'coingecko-trending-pools',
    path: '/coingecko/onchain/trending-pools',
    method: 'GET',
    priceUsd: X402_API_PRICE_COINGECKO_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_COINGECKO_USD,
    name: 'CoinGecko trending pools',
    description: 'Trending pools and tokens by network (e.g. base, solana) with optional duration (e.g. 5m)',
  },
  {
    id: 'coingecko-onchain-token',
    path: '/coingecko/onchain/token',
    method: 'GET',
    priceUsd: X402_API_PRICE_COINGECKO_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_COINGECKO_USD,
    name: 'CoinGecko onchain token',
    description: 'Token data by contract address on a network: price, liquidity, top pools (network + address required)',
  },
  // Partner: CoinMarketCap x402 (quotes, listing, DEX pairs quotes, DEX search, MCP)
  {
    id: 'coinmarketcap',
    path: '/coinmarketcap',
    method: 'GET',
    priceUsd: X402_API_PRICE_COINMARKETCAP_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_COINMARKETCAP_USD,
    name: 'CoinMarketCap x402',
    description: 'Cryptocurrency quotes latest, listing latest, DEX pairs quotes, DEX search, or MCP (endpoint param: quotes-latest, listing-latest, dex-pairs-quotes-latest, dex-search, mcp)',
  },
  // hey.lol agent API proxy (social platform for AI agents: profile, posts, feed, DMs, services)
  {
    id: 'heylol-profile-me',
    path: '/heylol/profile/me',
    method: 'GET',
    priceUsd: X402_API_PRICE_HEYLOL_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_HEYLOL_USD,
    name: 'Hey.lol my profile',
    description: 'Get the current user’s hey.lol agent profile (username, bio, followers, verified, DM/hey price)',
  },
  {
    id: 'heylol-feed',
    path: '/heylol/feed',
    method: 'GET',
    priceUsd: X402_API_PRICE_HEYLOL_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_HEYLOL_USD,
    name: 'Hey.lol feed',
    description: 'Get the public hey.lol feed (optional limit, offset). Use to see recent posts from the platform.',
  },
  {
    id: 'heylol-feed-following',
    path: '/heylol/feed/following',
    method: 'GET',
    priceUsd: X402_API_PRICE_HEYLOL_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_HEYLOL_USD,
    name: 'Hey.lol feed following',
    description: 'Get the hey.lol feed from users the agent follows (optional limit, offset).',
  },
  {
    id: 'heylol-posts',
    path: '/heylol/posts',
    method: 'GET',
    priceUsd: X402_API_PRICE_HEYLOL_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_HEYLOL_USD,
    name: 'Hey.lol my posts',
    description: 'Get the current agent’s hey.lol posts (optional limit, offset).',
  },
  {
    id: 'heylol-search',
    path: '/heylol/search',
    method: 'GET',
    priceUsd: X402_API_PRICE_HEYLOL_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_HEYLOL_USD,
    name: 'Hey.lol search',
    description: 'Search hey.lol users or posts (q required; type: users or posts; optional limit).',
  },
  {
    id: 'heylol-suggestions',
    path: '/heylol/suggestions',
    method: 'GET',
    priceUsd: X402_API_PRICE_HEYLOL_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_HEYLOL_USD,
    name: 'Hey.lol follow suggestions',
    description: 'Get hey.lol follow suggestions (optional limit).',
  },
  {
    id: 'heylol-notifications',
    path: '/heylol/notifications',
    method: 'GET',
    priceUsd: X402_API_PRICE_HEYLOL_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_HEYLOL_USD,
    name: 'Hey.lol notifications',
    description: 'Get hey.lol notifications (likes, replies, mentions, follows, tips; optional limit, cursor, unread_only).',
  },
  {
    id: 'heylol-create-post',
    path: '/heylol/posts',
    method: 'POST',
    priceUsd: X402_API_PRICE_HEYLOL_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_HEYLOL_USD,
    name: 'Hey.lol create post',
    description: 'Create a hey.lol post. Body: content (required), optional media_urls, gif_url, video_url, is_paywalled, paywall_price, teaser, quoted_post_id, parent_id.',
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
    {
      toolId: 'kraken-ticker',
      test: () => /kraken\s*ticker|ticker\s*kraken|kraken\s*price|kraken\s*btc/i.test(text),
    },
    {
      toolId: 'kraken-orderbook',
      test: () => /kraken\s*orderbook|orderbook\s*kraken|kraken\s*order\s*book/i.test(text),
    },
    {
      toolId: 'kraken-ohlc',
      test: () => /kraken\s*ohlc|kraken\s*candles|ohlc\s*kraken/i.test(text),
    },
    {
      toolId: 'kraken-trades',
      test: () => /kraken\s*trades|trades\s*kraken|kraken\s*recent\s*trades/i.test(text),
    },
    {
      toolId: 'kraken-status',
      test: () => /kraken\s*status|status\s*kraken|kraken\s*system/i.test(text),
    },
    {
      toolId: 'kraken-server-time',
      test: () => /kraken\s*server\s*time|kraken\s*time/i.test(text),
    },
    // Partner: OKX market
    {
      toolId: 'okx-ticker',
      test: () => /okx\s*ticker|ticker\s*okx|okx\s*price|okx\s*btc|okx\s*eth/i.test(text),
    },
    {
      toolId: 'okx-tickers',
      test: () => /okx\s*tickers?|okx\s*all\s*tickers?|okx\s*spot|okx\s*swap\s*tickers?/i.test(text),
    },
    {
      toolId: 'okx-books',
      test: () => /okx\s*order\s*book|okx\s*books?|okx\s*orderbook|order\s*book\s*okx/i.test(text),
    },
    {
      toolId: 'okx-candles',
      test: () => /okx\s*candles?|okx\s*ohlc|okx\s*kline| candles\s*okx/i.test(text),
    },
    {
      toolId: 'okx-trades',
      test: () => /okx\s*trades?|okx\s*recent\s*trades?|trades?\s*okx/i.test(text),
    },
    {
      toolId: 'okx-funding-rate',
      test: () => /okx\s*funding\s*rate|funding\s*rate\s*okx|okx\s*perp\s*funding/i.test(text),
    },
    {
      toolId: 'okx-open-interest',
      test: () => /okx\s*open\s*interest|open\s*interest\s*okx|okx\s*oi/i.test(text),
    },
    {
      toolId: 'okx-mark-price',
      test: () => /okx\s*mark\s*price|mark\s*price\s*okx/i.test(text),
    },
    {
      toolId: 'okx-time',
      test: () => /okx\s*server\s*time|okx\s*time/i.test(text),
    },
    // OKX DEX (on-chain by token address + chain)
    {
      toolId: 'okx-dex-price',
      test: () => /okx\s*dex\s*price|dex\s*price\s*okx|on-?chain\s*price\s*(by\s*address|token)|token\s*price\s*by\s*contract\s*address\s*okx/i.test(text),
    },
    {
      toolId: 'okx-dex-prices',
      test: () => /okx\s*dex\s*(batch\s*)?prices?|dex\s*batch\s*prices?/i.test(text),
    },
    {
      toolId: 'okx-dex-kline',
      test: () => /okx\s*dex\s*kline|okx\s*dex\s*candles?|dex\s*kline\s*by\s*address|on-?chain\s*candles?\s*okx/i.test(text),
    },
    {
      toolId: 'okx-dex-trades',
      test: () => /okx\s*dex\s*trades?|dex\s*trades?\s*by\s*address|on-?chain\s*trades?\s*okx/i.test(text),
    },
    {
      toolId: 'okx-dex-index',
      test: () => /okx\s*dex\s*index|dex\s*index\s*price\s*okx|on-?chain\s*index\s*price/i.test(text),
    },
    {
      toolId: 'okx-dex-signal-chains',
      test: () => /okx\s*dex\s*signal\s*chains?|dex\s*signal\s*chains?/i.test(text),
    },
    {
      toolId: 'okx-dex-signal-list',
      test: () => /okx\s*dex\s*signal\s*list|dex\s*signal\s*list|okx\s*smart\s*money\s*signals?|okx\s*whale\s*buy\s*signals?/i.test(text),
    },
    {
      toolId: 'okx-dex-memepump-chains',
      test: () => /okx\s*memepump\s*chains?|memepump\s*chains?|okx\s*dex\s*memepump\s*chains?/i.test(text),
    },
    {
      toolId: 'okx-dex-memepump-tokens',
      test: () => /okx\s*memepump\s*tokens?|memepump\s*tokens?|okx\s*dex\s*memepump\s*tokens?|new\s*meme\s*tokens?\s*okx|扫链|trenches/i.test(text),
    },
    {
      toolId: 'okx-dex-memepump-token-details',
      test: () => /okx\s*memepump\s*token\s*details?|memepump\s*token\s*details?/i.test(text),
    },
    {
      toolId: 'okx-dex-memepump-token-dev-info',
      test: () => /okx\s*memepump\s*dev\s*info|memepump\s*token\s*dev\s*info|okx\s*developer\s*reputation\s*meme/i.test(text),
    },
    {
      toolId: 'okx-dex-memepump-similar-tokens',
      test: () => /okx\s*memepump\s*similar\s*tokens?|memepump\s*similar\s*tokens?|same\s*creator\s*tokens?\s*okx/i.test(text),
    },
    {
      toolId: 'okx-dex-memepump-token-bundle-info',
      test: () => /okx\s*memepump\s*bundle\s*info|memepump\s*token\s*bundle\s*info|bundler\s*sniper\s*okx/i.test(text),
    },
    {
      toolId: 'okx-dex-memepump-aped-wallet',
      test: () => /okx\s*memepump\s*aped\s*wallet|memepump\s*aped\s*wallet|same-?car\s*wallet\s*okx|同车/i.test(text),
    },
    // Partner: Nansen, Jupiter, DexScreener
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
    // 8004scan.io Public API (ERC-8004 discovery)
    {
      toolId: '8004scan-stats',
      test: () =>
        /8004scan\s*stats|8004scan\.io\s*stats|platform\s*stats\s*8004scan|erc-8004\s*stats/i.test(text),
    },
    {
      toolId: '8004scan-chains',
      test: () =>
        /8004scan\s*chains|8004scan\.io\s*chains|supported\s*chains\s*8004scan|8004\s*supported\s*chains/i.test(text),
    },
    {
      toolId: '8004scan-agents',
      test: () =>
        /8004scan\s*agents?|8004scan\.io\s*list\s*agents?|list\s*(?:erc-8004\s*)?agents?\s*(?:on\s*8004scan)?|8004scan\s*list/i.test(text),
    },
    {
      toolId: '8004scan-agents-search',
      test: () =>
        /8004scan\s*search|search\s*(?:agents?|erc-8004)\s*(?:on\s*)?8004scan|8004scan\.io\s*search|semantic\s*search\s*agents?/i.test(text),
    },
    {
      toolId: '8004scan-agent',
      test: () =>
        /8004scan\s*agent\s*(?:by\s*)?id|get\s*agent\s*(?:on\s*)?8004scan|8004scan\s*get\s*agent|agent\s*by\s*chainId\s*tokenId/i.test(text),
    },
    {
      toolId: '8004scan-account-agents',
      test: () =>
        /8004scan\s*agents?\s*by\s*owner|8004scan\s*account\s*agents?|agents?\s*owned\s*by\s*(?:address|wallet)|8004scan\.io\s*owner/i.test(text),
    },
    {
      toolId: '8004scan-feedbacks',
      test: () =>
        /8004scan\s*feedbacks?|8004scan\.io\s*feedbacks?|agent\s*feedbacks?\s*8004scan|8004\s*feedback/i.test(text),
    },
    // Partner: CoinMarketCap x402
    {
      toolId: 'coinmarketcap',
      test: () =>
        /coinmarketcap|cmc\s*(quotes|listing|dex)|quotes\s*latest\s*cmc|listing\s*latest\s*cmc|dex\s*pairs?\s*quotes?|dex\s*search\s*cmc/i.test(text),
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
    // Core: signal, event, digest, headline
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
  const core = ['news', 'signal', 'sentiment', 'event', 'exa-search', 'trending-headline', 'sundown-digest', 'analytics-summary'];
  const partner = ['smart-money', 'token-god-mode', 'dexscreener', 'trending-jupiter', 'jupiter-swap-order', 'token-report', 'token-statistic', 'token-risk-alerts', 'bubblemaps-maps', 'binance-correlation', 'kraken-ticker', 'kraken-orderbook', 'kraken-ohlc', 'kraken-trades', 'kraken-status', 'kraken-server-time', 'okx-ticker', 'okx-tickers', 'okx-books', 'okx-candles', 'okx-trades', 'okx-funding-rate', 'okx-open-interest', 'okx-mark-price', 'okx-time', 'okx-dex-price', 'okx-dex-prices', 'okx-dex-kline', 'okx-dex-trades', 'okx-dex-index', 'okx-dex-signal-chains', 'okx-dex-signal-list', 'okx-dex-memepump-chains', 'okx-dex-memepump-tokens', 'okx-dex-memepump-token-details', 'okx-dex-memepump-token-dev-info', 'okx-dex-memepump-similar-tokens', 'okx-dex-memepump-token-bundle-info', 'okx-dex-memepump-aped-wallet', 'coingecko-simple-price', 'coingecko-onchain-token-price', 'coingecko-search-pools', 'coingecko-trending-pools', 'coingecko-onchain-token', 'coinmarketcap'];
  const eight004scan = ['8004scan-stats', '8004scan-chains', '8004scan-agents', '8004scan-agents-search', '8004scan-agent', '8004scan-account-agents', '8004scan-feedbacks'];
  const nansenX402 = AGENT_TOOLS.filter((t) => t.nansenPath).map((t) => t.id);

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
  lines.push('8004scan.io (ERC-8004 agent discovery):', ...fmt(eight004scan), '');
  if (nansenX402.length) {
    lines.push('Nansen (per-endpoint; pass chain, address, or token_address as needed):', ...fmt(nansenX402), '');
  }

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
    if (t.id === 'coinmarketcap') {
      out.paramsHint = 'Params: endpoint (quotes-latest, listing-latest, dex-pairs-quotes-latest, dex-search, mcp); optional id, slug, symbol, start, limit, convert, q, chain_id, pair_address';
    }
    if (t.id === '8004scan-agents-search') {
      out.paramsHint = 'Params: q (required) – search query for semantic agent search; optional limit, chainId, semanticWeight';
    }
    if (t.id === '8004scan-agent') {
      out.paramsHint = 'Params: chainId (required), tokenId (required) – blockchain chain ID and agent token ID';
    }
    if (t.id === '8004scan-account-agents') {
      out.paramsHint = 'Params: address (required) – owner wallet address (EVM 0x...); optional page, limit, sortBy, sortOrder';
    }
    if (t.id === 'token-god-mode') {
      out.paramsHint = 'Params: tokenAddress (Solana token contract address, required)';
    }
    if (t.id === 'smart-money') {
      out.paramsHint = 'Optional params: chains (e.g. ["solana"]), or leave empty for default';
    }
    // OKX market tools
    if (t.id === 'okx-ticker') {
      out.paramsHint = 'Params: instId (e.g. BTC-USDT, ETH-USDT-SWAP; default BTC-USDT)';
    }
    if (t.id === 'okx-tickers') {
      out.paramsHint = 'Params: instType (SPOT, SWAP, FUTURES, OPTION, MARGIN; default SPOT)';
    }
    if (t.id === 'okx-books') {
      out.paramsHint = 'Params: instId (default BTC-USDT), sz (depth, default 20, max 400)';
    }
    if (t.id === 'okx-candles') {
      out.paramsHint = 'Params: instId (default BTC-USDT), bar (1m,1H,1D, etc.), limit (default 100)';
    }
    if (t.id === 'okx-trades') {
      out.paramsHint = 'Params: instId (default BTC-USDT), limit (default 100, max 500)';
    }
    if (t.id === 'okx-funding-rate' || t.id === 'okx-open-interest' || t.id === 'okx-mark-price') {
      out.paramsHint = 'Params: instId (default BTC-USDT-SWAP for perpetual swap)';
    }
    // OKX DEX (on-chain by address + chain)
    if (t.id === 'okx-dex-price') {
      out.paramsHint = 'Params: address (token contract address, required), chain (e.g. ethereum, solana, base; default ethereum)';
    }
    if (t.id === 'okx-dex-prices') {
      out.paramsHint = 'Params: tokens (comma-separated chainIndex:address or addresses), chain (default when no prefix)';
    }
    if (t.id === 'okx-dex-kline') {
      out.paramsHint = 'Params: address (required), chain (default ethereum), bar (1m,1H,1D), limit (default 100, max 299)';
    }
    if (t.id === 'okx-dex-trades') {
      out.paramsHint = 'Params: address (required), chain (default ethereum), limit (default 100, max 500)';
    }
    if (t.id === 'okx-dex-index') {
      out.paramsHint = 'Params: address (token address; empty for native token), chain (default ethereum)';
    }
    if (t.id === 'okx-dex-signal-list') {
      out.paramsHint = 'Params: chain (e.g. solana, ethereum; required), wallet-type (1=Smart Money,2=KOL,3=Whale), min-amount-usd, token-address';
    }
    if (t.id === 'okx-dex-memepump-tokens') {
      out.paramsHint = 'Params: chain (default solana), stage (NEW, MIGRATING, or MIGRATED; required), protocol-id-list, min-market-cap, keywords-include';
    }
    if (['okx-dex-memepump-token-details', 'okx-dex-memepump-token-dev-info', 'okx-dex-memepump-similar-tokens', 'okx-dex-memepump-token-bundle-info', 'okx-dex-memepump-aped-wallet'].includes(t.id)) {
      out.paramsHint = 'Params: address (token contract address, required), chain (default solana); aped-wallet also accepts optional wallet';
    }
    // Nansen x402 tools: pass params as required by Nansen API (chain, address, token_address, etc.)
    if (t.nansenPath) {
      const nansenHints = {
        'nansen-address-current-balance': 'Params: chain (e.g. solana), address (wallet address, required)',
        'nansen-address-historical-balances': 'Params: chain (e.g. solana), address (wallet address, required)',
        'nansen-smart-money-netflow': 'Params: chains (e.g. ["solana"]); optional filters, pagination',
        'nansen-smart-money-holdings': 'Params: chains (e.g. ["solana"]); optional filters, pagination',
        'nansen-smart-money-dex-trades': 'Params: chains (e.g. ["solana"]); optional filters, pagination',
        'nansen-tgm-holders': 'Params: chain (e.g. solana), token_address (required)',
        'nansen-tgm-flow-intelligence': 'Params: chain (e.g. solana), token_address (required)',
        'nansen-tgm-flows': 'Params: chain, token_address; optional date_from, date_to, filters',
        'nansen-tgm-dex-trades': 'Params: chain (e.g. solana), token_address; optional date, filters',
        'nansen-token-screener': 'Params: chain (e.g. solana); optional filters, pagination',
        'nansen-profiler-counterparties': 'Params: chain (e.g. solana), address (wallet address, required)',
        'nansen-tgm-pnl-leaderboard': 'Params: chain (e.g. solana); optional date_from, date_to, filters',
      };
      if (nansenHints[t.id]) out.paramsHint = nansenHints[t.id];
    }
    return out;
  });
}
