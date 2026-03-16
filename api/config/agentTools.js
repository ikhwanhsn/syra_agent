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
  X402_API_PRICE_SQUID_ROUTE_USD,
  X402_API_PRICE_SQUID_STATUS_USD,
  X402_API_PRICE_COINGECKO_USD,
  X402_API_PRICE_EXA_SEARCH_USD,
  X402_API_PRICE_CRAWL_USD,
  X402_API_PRICE_COINMARKETCAP_USD,
  X402_API_PRICE_8004_USD,
  X402_API_PRICE_8004SCAN_USD,
  X402_API_PRICE_HEYLOL_USD,
  X402_API_PRICE_KRAKEN_USD,
  X402_API_PRICE_KUCOIN_USD,
  X402_API_PRICE_OKX_USD,
  X402_API_PRICE_GIZA_USD,
  X402_API_PRICE_MESSARI_USD,
  X402_API_PRICE_MESSARI_AI_USD,
  X402_API_PRICE_MESSARI_SIGNAL_USD,
  X402_API_PRICE_MESSARI_PREMIUM_USD,
  X402_API_PRICE_MESSARI_TIMESERIES_USD,
  X402_API_PRICE_MESSARI_VESTING_USD,
  X402_API_PRICE_MESSARI_INVESTOR_USD,
  X402_API_PRICE_PURCH_VAULT_USD,
  X402_API_PRICE_QUICKNODE_USD,
  X402_API_PRICE_BANKR_USD,
  X402_API_PRICE_NEYNAR_USD,
  X402_API_PRICE_SIWA_USD,
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
  X402_DISPLAY_PRICE_SQUID_ROUTE_USD,
  X402_DISPLAY_PRICE_SQUID_STATUS_USD,
  X402_DISPLAY_PRICE_COINGECKO_USD,
  X402_DISPLAY_PRICE_EXA_SEARCH_USD,
  X402_DISPLAY_PRICE_CRAWL_USD,
  X402_DISPLAY_PRICE_COINMARKETCAP_USD,
  X402_DISPLAY_PRICE_8004_USD,
  X402_DISPLAY_PRICE_8004SCAN_USD,
  X402_DISPLAY_PRICE_HEYLOL_USD,
  X402_DISPLAY_PRICE_KRAKEN_USD,
  X402_DISPLAY_PRICE_KUCOIN_USD,
  X402_DISPLAY_PRICE_OKX_USD,
  X402_DISPLAY_PRICE_GIZA_USD,
  X402_DISPLAY_PRICE_MESSARI_USD,
  X402_DISPLAY_PRICE_MESSARI_AI_USD,
  X402_DISPLAY_PRICE_MESSARI_SIGNAL_USD,
  X402_DISPLAY_PRICE_MESSARI_PREMIUM_USD,
  X402_DISPLAY_PRICE_MESSARI_TIMESERIES_USD,
  X402_DISPLAY_PRICE_MESSARI_VESTING_USD,
  X402_DISPLAY_PRICE_MESSARI_INVESTOR_USD,
  X402_DISPLAY_PRICE_PURCH_VAULT_USD,
  X402_DISPLAY_PRICE_QUICKNODE_USD,
  X402_DISPLAY_PRICE_BANKR_USD,
  X402_DISPLAY_PRICE_NEYNAR_USD,
  X402_DISPLAY_PRICE_SIWA_USD,
} from './x402Pricing.js';

/** @typedef {{ id: string; path: string; method: string; priceUsd: number; displayPriceUsd?: number; name: string; description: string; nansenPath?: string; purchVaultPath?: string }} AgentTool */

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
    id: 'website-crawl',
    path: '/crawl',
    method: 'POST',
    priceUsd: X402_API_PRICE_CRAWL_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_CRAWL_USD,
    name: 'Website crawl',
    description: 'Crawl a website from a starting URL; returns Markdown content for summarization or RAG (Cloudflare Browser Rendering)',
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
  // Quicknode RPC (balance, transaction status, raw RPC – Solana, Base)
  {
    id: 'quicknode-balance',
    path: '/quicknode/balance',
    method: 'GET',
    priceUsd: X402_API_PRICE_QUICKNODE_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_QUICKNODE_USD,
    name: 'Quicknode balance',
    description: 'Get native balance for a wallet on Solana or Base (chain and address required). Requires QUICKNODE_*_RPC_URL in API.',
  },
  {
    id: 'quicknode-transaction',
    path: '/quicknode/transaction',
    method: 'GET',
    priceUsd: X402_API_PRICE_QUICKNODE_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_QUICKNODE_USD,
    name: 'Quicknode transaction status',
    description: 'Get transaction status on Solana (signature) or Base (txHash). chain and signature or txHash required.',
  },
  {
    id: 'quicknode-rpc',
    path: '/quicknode/rpc',
    method: 'POST',
    priceUsd: X402_API_PRICE_QUICKNODE_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_QUICKNODE_USD,
    name: 'Quicknode raw RPC',
    description: 'Forward a raw JSON-RPC request to Quicknode (chain: solana or base; method, params in body).',
  },
  // Bankr – agent prompts, job status, balances (api.bankr.bot)
  {
    id: 'bankr-balances',
    path: '/bankr/balances',
    method: 'GET',
    priceUsd: X402_API_PRICE_BANKR_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_BANKR_USD,
    name: 'Bankr balances',
    description: 'Wallet balances across chains (optional query: chains=base,solana). Requires BANKR_API_KEY in API.',
  },
  {
    id: 'bankr-prompt',
    path: '/bankr/prompt',
    method: 'POST',
    priceUsd: X402_API_PRICE_BANKR_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_BANKR_USD,
    name: 'Bankr prompt',
    description: 'Submit a natural language prompt to Bankr agent (body: prompt, optional threadId). Returns jobId; poll GET /bankr/job/:jobId for result.',
  },
  {
    id: 'bankr-job',
    path: '/bankr/job',
    method: 'GET',
    priceUsd: X402_API_PRICE_BANKR_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_BANKR_USD,
    name: 'Bankr job status',
    description: 'Get Bankr job status and result (path: /bankr/job/:jobId).',
  },
  {
    id: 'bankr-job-cancel',
    path: '/bankr/job/:jobId/cancel',
    method: 'POST',
    priceUsd: X402_API_PRICE_BANKR_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_BANKR_USD,
    name: 'Bankr cancel job',
    description: 'Cancel a pending/processing Bankr job (path: /bankr/job/:jobId/cancel).',
  },
  // Neynar Farcaster API
  {
    id: 'neynar-user',
    path: '/neynar/user',
    method: 'GET',
    priceUsd: X402_API_PRICE_NEYNAR_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_NEYNAR_USD,
    name: 'Neynar user lookup',
    description: 'Farcaster user by username or by FIDs (query: username or fids). Requires NEYNAR_API_KEY.',
  },
  {
    id: 'neynar-feed',
    path: '/neynar/feed',
    method: 'GET',
    priceUsd: X402_API_PRICE_NEYNAR_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_NEYNAR_USD,
    name: 'Neynar feed',
    description: 'Farcaster feed (query: feed_type, filter_type, fid, channel_id, limit, cursor).',
  },
  {
    id: 'neynar-cast',
    path: '/neynar/cast',
    method: 'GET',
    priceUsd: X402_API_PRICE_NEYNAR_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_NEYNAR_USD,
    name: 'Neynar get cast',
    description: 'Single Farcaster cast by identifier (hash or URL). Query: identifier or hash.',
  },
  {
    id: 'neynar-search',
    path: '/neynar/search',
    method: 'GET',
    priceUsd: X402_API_PRICE_NEYNAR_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_NEYNAR_USD,
    name: 'Neynar search casts',
    description: 'Search Farcaster casts. Query: q (required), limit, channel_id, cursor.',
  },
  // SIWA Sign-In With Agent
  {
    id: 'siwa-nonce',
    path: '/siwa/nonce',
    method: 'POST',
    priceUsd: X402_API_PRICE_SIWA_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_SIWA_USD,
    name: 'SIWA nonce',
    description: 'Get a SIWA nonce for agent sign-in (body: address, agentId, agentRegistry?). Requires RECEIPT_SECRET, SIWA_RPC_URL.',
  },
  {
    id: 'siwa-verify',
    path: '/siwa/verify',
    method: 'POST',
    priceUsd: X402_API_PRICE_SIWA_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_SIWA_USD,
    name: 'SIWA verify',
    description: 'Verify SIWA signed message (body: message, signature). Returns agentId and optional receipt.',
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
    id: 'squid-route',
    path: '/squid/route',
    method: 'POST',
    priceUsd: X402_API_PRICE_SQUID_ROUTE_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_SQUID_ROUTE_USD,
    name: 'Squid cross-chain route',
    description: 'Get cross-chain route/quote from Squid Router (100+ chains); returns route and transactionRequest for first leg — user signs on source chain',
  },
  {
    id: 'squid-status',
    path: '/squid/status',
    method: 'GET',
    priceUsd: X402_API_PRICE_SQUID_STATUS_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_SQUID_STATUS_USD,
    name: 'Squid cross-chain status',
    description: 'Check status of a cross-chain transaction (transactionId, requestId, fromChainId, toChainId, quoteId)',
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
  // Partner: Binance Spot (market data + account/order with API key)
  {
    id: 'binance-ticker-24h',
    path: '/binance/spot/ticker/24hr',
    method: 'GET',
    priceUsd: X402_API_PRICE_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_USD,
    name: 'Binance 24h ticker',
    description: 'Binance spot 24h price change statistics. Optional symbol (e.g. BTCUSDT); omit for all symbols.',
  },
  {
    id: 'binance-orderbook',
    path: '/binance/spot/depth',
    method: 'GET',
    priceUsd: X402_API_PRICE_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_USD,
    name: 'Binance order book',
    description: 'Binance spot order book (depth). symbol (e.g. BTCUSDT) required; optional limit (5–5000, default 100).',
  },
  {
    id: 'binance-exchange-info',
    path: '/binance/spot/exchange-info',
    method: 'GET',
    priceUsd: X402_API_PRICE_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_USD,
    name: 'Binance exchange info',
    description: 'Binance spot exchange trading rules and symbol info. Optional symbol or symbols.',
  },
  {
    id: 'binance-spot-account',
    path: '/binance/spot/account',
    method: 'GET',
    priceUsd: X402_API_PRICE_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_USD,
    name: 'Binance spot account',
    description: 'Binance spot account balances. Requires BINANCE_API_KEY and BINANCE_API_SECRET in env (or apiKey/apiSecret in body).',
  },
  {
    id: 'binance-spot-order',
    path: '/binance/spot/order',
    method: 'POST',
    priceUsd: X402_API_PRICE_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_USD,
    name: 'Binance place spot order',
    description: 'Place a Binance spot order. symbol (e.g. BTCUSDT), side (BUY/SELL), type (MARKET/LIMIT etc.), quantity or quoteOrderQty. Requires API key in env or body.',
  },
  {
    id: 'binance-spot-order-cancel',
    path: '/binance/spot/order',
    method: 'DELETE',
    priceUsd: X402_API_PRICE_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_USD,
    name: 'Binance cancel spot order',
    description: 'Cancel a Binance spot order. symbol required; orderId or origClientOrderId required. Requires API key in env or body.',
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
  // Partner: KuCoin spot (ticker, stats, orderbook, trades, candles, symbols, currencies, server-time)
  {
    id: 'kucoin-ticker',
    path: '/kucoin/ticker',
    method: 'GET',
    priceUsd: X402_API_PRICE_KUCOIN_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_KUCOIN_USD,
    name: 'KuCoin ticker',
    description: 'KuCoin spot ticker. Optional symbol (e.g. BTC-USDT); omit for all tickers.',
  },
  {
    id: 'kucoin-stats',
    path: '/kucoin/stats',
    method: 'GET',
    priceUsd: X402_API_PRICE_KUCOIN_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_KUCOIN_USD,
    name: 'KuCoin 24h stats',
    description: 'KuCoin 24h stats for a symbol (default BTC-USDT).',
  },
  {
    id: 'kucoin-orderbook',
    path: '/kucoin/orderbook',
    method: 'GET',
    priceUsd: X402_API_PRICE_KUCOIN_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_KUCOIN_USD,
    name: 'KuCoin order book',
    description: 'KuCoin order book. Optional symbol (default BTC-USDT), level (level2_20, level2_100).',
  },
  {
    id: 'kucoin-trades',
    path: '/kucoin/trades',
    method: 'GET',
    priceUsd: X402_API_PRICE_KUCOIN_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_KUCOIN_USD,
    name: 'KuCoin trades',
    description: 'KuCoin recent trades. Optional symbol (default BTC-USDT).',
  },
  {
    id: 'kucoin-candles',
    path: '/kucoin/candles',
    method: 'GET',
    priceUsd: X402_API_PRICE_KUCOIN_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_KUCOIN_USD,
    name: 'KuCoin candles',
    description: 'KuCoin klines/candles. Optional symbol (default BTC-USDT), type (1min, 1hour, 1day, etc.), pageSize (default 100).',
  },
  {
    id: 'kucoin-symbols',
    path: '/kucoin/symbols',
    method: 'GET',
    priceUsd: X402_API_PRICE_KUCOIN_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_KUCOIN_USD,
    name: 'KuCoin symbols',
    description: 'KuCoin list of tradeable symbols.',
  },
  {
    id: 'kucoin-currencies',
    path: '/kucoin/currencies',
    method: 'GET',
    priceUsd: X402_API_PRICE_KUCOIN_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_KUCOIN_USD,
    name: 'KuCoin currencies',
    description: 'KuCoin list of currencies.',
  },
  {
    id: 'kucoin-server-time',
    path: '/kucoin/server-time',
    method: 'GET',
    priceUsd: X402_API_PRICE_KUCOIN_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_KUCOIN_USD,
    name: 'KuCoin server time',
    description: 'KuCoin server time.',
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
  // Partner: Giza — DeFi yield optimization (Base, Arbitrum)
  {
    id: 'giza-protocols',
    path: '/giza/protocols',
    method: 'GET',
    priceUsd: X402_API_PRICE_GIZA_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_GIZA_USD,
    name: 'Giza protocols',
    description: 'List DeFi protocols available for a token on Giza (e.g. USDC on Base). Params: token (contract address 0x...)',
  },
  {
    id: 'giza-agent',
    path: '/giza/agent',
    method: 'GET',
    priceUsd: X402_API_PRICE_GIZA_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_GIZA_USD,
    name: 'Giza agent (smart account)',
    description: 'Get or create Giza smart account (deposit address) for an owner EOA. Params: owner (0x... address)',
  },
  {
    id: 'giza-portfolio',
    path: '/giza/portfolio',
    method: 'GET',
    priceUsd: X402_API_PRICE_GIZA_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_GIZA_USD,
    name: 'Giza portfolio',
    description: 'Get current Giza portfolio status (protocols, balances). Params: owner (0x...)',
  },
  {
    id: 'giza-apr',
    path: '/giza/apr',
    method: 'GET',
    priceUsd: X402_API_PRICE_GIZA_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_GIZA_USD,
    name: 'Giza APR',
    description: 'Get current APR for a Giza agent. Params: owner (0x...)',
  },
  {
    id: 'giza-performance',
    path: '/giza/performance',
    method: 'GET',
    priceUsd: X402_API_PRICE_GIZA_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_GIZA_USD,
    name: 'Giza performance',
    description: 'Get performance history (value over time) for a Giza agent. Params: owner (0x...)',
  },
  {
    id: 'giza-activate',
    path: '/giza/activate',
    method: 'POST',
    priceUsd: X402_API_PRICE_GIZA_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_GIZA_USD,
    name: 'Giza activate',
    description: 'Activate Giza agent after deposit: owner, token, protocols (array), txHash, optional constraints',
  },
  {
    id: 'giza-withdraw',
    path: '/giza/withdraw',
    method: 'POST',
    priceUsd: X402_API_PRICE_GIZA_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_GIZA_USD,
    name: 'Giza withdraw',
    description: 'Withdraw from Giza (partial: amount in smallest units; full: omit amount). Params: owner, optional amount',
  },
  {
    id: 'giza-top-up',
    path: '/giza/top-up',
    method: 'POST',
    priceUsd: X402_API_PRICE_GIZA_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_GIZA_USD,
    name: 'Giza top-up',
    description: 'Record a top-up deposit for an active Giza agent. Params: owner, txHash',
  },
  {
    id: 'giza-update-protocols',
    path: '/giza/update-protocols',
    method: 'POST',
    priceUsd: X402_API_PRICE_GIZA_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_GIZA_USD,
    name: 'Giza update protocols',
    description: 'Update protocol set for a Giza agent. Params: owner, protocols (array)',
  },
  {
    id: 'giza-run',
    path: '/giza/run',
    method: 'POST',
    priceUsd: X402_API_PRICE_GIZA_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_GIZA_USD,
    name: 'Giza run (rebalance)',
    description: 'Trigger a manual optimization run for a Giza agent. Params: owner',
  },
  // Partner: Messari x402 (AI, metrics, signal, news, token unlocks, fundraising, networks, X-users)
  {
    id: 'messari-ai',
    path: '/messari/ai',
    method: 'POST',
    priceUsd: X402_API_PRICE_MESSARI_AI_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_MESSARI_AI_USD,
    name: 'Messari AI chat',
    description: 'AI-powered crypto research using Messari\'s 30TB+ knowledge graph (chat completions)',
  },
  {
    id: 'messari-asset-details',
    path: '/messari/assets/details',
    method: 'GET',
    priceUsd: X402_API_PRICE_MESSARI_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_MESSARI_USD,
    name: 'Messari asset details',
    description: 'Rich point-in-time asset data: profile, supply, metrics, sectors (slugs e.g. bitcoin,ethereum)',
  },
  {
    id: 'messari-assets',
    path: '/messari/assets',
    method: 'GET',
    priceUsd: X402_API_PRICE_MESSARI_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_MESSARI_USD,
    name: 'Messari list assets',
    description: 'List 34,000+ crypto assets with market and fundamental metrics',
  },
  {
    id: 'messari-ath',
    path: '/messari/ath',
    method: 'GET',
    priceUsd: X402_API_PRICE_MESSARI_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_MESSARI_USD,
    name: 'Messari all-time highs',
    description: 'All-time high snapshots with drawdown context for crypto assets',
  },
  {
    id: 'messari-roi',
    path: '/messari/roi',
    method: 'GET',
    priceUsd: X402_API_PRICE_MESSARI_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_MESSARI_USD,
    name: 'Messari ROI',
    description: 'Multi-window return on investment snapshots for crypto assets',
  },
  {
    id: 'messari-timeseries',
    path: '/messari/timeseries',
    method: 'GET',
    priceUsd: X402_API_PRICE_MESSARI_TIMESERIES_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_MESSARI_TIMESERIES_USD,
    name: 'Messari asset timeseries',
    description: 'Historical timeseries data for an asset (price, volume, on-chain metrics) by dataset and granularity',
  },
  {
    id: 'messari-signal',
    path: '/messari/signal',
    method: 'GET',
    priceUsd: X402_API_PRICE_MESSARI_PREMIUM_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_MESSARI_PREMIUM_USD,
    name: 'Messari signal',
    description: 'Ranked crypto asset feed by mindshare, sentiment, and momentum from social intelligence',
  },
  {
    id: 'messari-mindshare-gainers',
    path: '/messari/mindshare-gainers',
    method: 'GET',
    priceUsd: X402_API_PRICE_MESSARI_SIGNAL_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_MESSARI_SIGNAL_USD,
    name: 'Messari mindshare gainers',
    description: 'Tokens gaining the most social attention/mindshare (24h or 7d period)',
  },
  {
    id: 'messari-mindshare-losers',
    path: '/messari/mindshare-losers',
    method: 'GET',
    priceUsd: X402_API_PRICE_MESSARI_SIGNAL_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_MESSARI_SIGNAL_USD,
    name: 'Messari mindshare losers',
    description: 'Tokens losing the most social attention/mindshare (24h or 7d period)',
  },
  {
    id: 'messari-news',
    path: '/messari/news',
    method: 'GET',
    priceUsd: X402_API_PRICE_MESSARI_PREMIUM_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_MESSARI_PREMIUM_USD,
    name: 'Messari news',
    description: 'Curated institutional-grade crypto news feed (optional assetSlugs filter)',
  },
  {
    id: 'messari-token-unlocks',
    path: '/messari/token-unlocks',
    method: 'GET',
    priceUsd: X402_API_PRICE_MESSARI_TIMESERIES_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_MESSARI_TIMESERIES_USD,
    name: 'Messari token unlocks',
    description: 'Upcoming and past token unlock events for an asset (assetId required)',
  },
  {
    id: 'messari-vesting',
    path: '/messari/token-unlocks/vesting',
    method: 'GET',
    priceUsd: X402_API_PRICE_MESSARI_VESTING_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_MESSARI_VESTING_USD,
    name: 'Messari vesting schedule',
    description: 'Forward-looking token vesting schedule for an asset (assetId required)',
  },
  {
    id: 'messari-fundraising',
    path: '/messari/fundraising',
    method: 'GET',
    priceUsd: X402_API_PRICE_MESSARI_TIMESERIES_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_MESSARI_TIMESERIES_USD,
    name: 'Messari fundraising rounds',
    description: 'VC funding rounds by stage, date, amount, participants (seed, series-a, etc.)',
  },
  {
    id: 'messari-fundraising-investors',
    path: '/messari/fundraising/investors',
    method: 'GET',
    priceUsd: X402_API_PRICE_MESSARI_INVESTOR_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_MESSARI_INVESTOR_USD,
    name: 'Messari fundraising investors',
    description: 'Investors who participated in matching funding rounds',
  },
  {
    id: 'messari-stablecoins',
    path: '/messari/stablecoins',
    method: 'GET',
    priceUsd: X402_API_PRICE_MESSARI_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_MESSARI_USD,
    name: 'Messari stablecoins',
    description: 'Stablecoin supply, flows, and chain breakdowns',
  },
  {
    id: 'messari-networks',
    path: '/messari/networks',
    method: 'GET',
    priceUsd: X402_API_PRICE_MESSARI_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_MESSARI_USD,
    name: 'Messari networks',
    description: 'L1/L2 network on-chain activity — fees, active addresses, usage metrics',
  },
  {
    id: 'messari-x-users',
    path: '/messari/x-users',
    method: 'GET',
    priceUsd: X402_API_PRICE_MESSARI_PREMIUM_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_MESSARI_PREMIUM_USD,
    name: 'Messari X-users',
    description: 'Ranked crypto X/Twitter influencer feed with engagement and mindshare metrics',
  },
  // Partner: Purch Vault — marketplace for agent skills, knowledge, personas (x402 at api.purch.xyz)
  {
    id: 'purch-vault-search',
    path: '/x402/vault/search',
    method: 'GET',
    purchVaultPath: '/x402/vault/search',
    priceUsd: X402_API_PRICE_PURCH_VAULT_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_PURCH_VAULT_USD,
    name: 'Purch Vault search',
    description: 'Search Purch Vault for agent skills, knowledge bases, and personas (optional q, category, productType, minPrice, maxPrice, limit)',
  },
  {
    id: 'purch-vault-buy',
    path: '/x402/vault/buy',
    method: 'POST',
    purchVaultPath: '/x402/vault/buy',
    priceUsd: X402_API_PRICE_PURCH_VAULT_USD * 2,
    displayPriceUsd: X402_DISPLAY_PRICE_PURCH_VAULT_USD * 2,
    name: 'Purch Vault buy',
    description: 'Purchase a Purch Vault item by slug (from search); agent pays item price in USDC on Solana and receives the download',
  },
];

/** LLM/frontend may send underscore variant; backend uses hyphen. */
const JUPITER_SWAP_TOOL_ID_ALIASES = ['jupiter_swap_order', 'jupiter-swap-order'];
const SQUID_TOOL_ID_ALIASES = ['squid_route', 'squid-route', 'squid_status', 'squid-status'];

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
  let normalized = toolId;
  if (toolId && JUPITER_SWAP_TOOL_ID_ALIASES.includes(toolId)) normalized = 'jupiter-swap-order';
  else if (toolId === 'squid_route') normalized = 'squid-route';
  else if (toolId === 'squid_status') normalized = 'squid-status';
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
    // Partner: Messari (AI, metrics, signal, news, unlocks, fundraising)
    {
      toolId: 'messari-ai',
      test: () =>
        /messari\s*ai|messari\s*chat|messari\s*research|ask\s*messari|messari\s*copilot/i.test(text),
    },
    {
      toolId: 'messari-mindshare-gainers',
      test: () =>
        /messari\s*mindshare\s*gainer|mindshare\s*gainer|mindshare\s*trending|mindshare\s*gain/i.test(text),
    },
    {
      toolId: 'messari-mindshare-losers',
      test: () =>
        /messari\s*mindshare\s*loser|mindshare\s*loser|mindshare\s*loss|mindshare\s*drop/i.test(text),
    },
    {
      toolId: 'messari-signal',
      test: () =>
        /messari\s*signal|messari\s*sentiment|messari\s*social\s*signal|messari\s*mindshare(?!\s*(gainer|loser|gain|loss|drop|trending))/i.test(text),
    },
    {
      toolId: 'messari-token-unlocks',
      test: () =>
        /token\s*unlock|messari\s*unlock|vesting\s*event|upcoming\s*unlock/i.test(text),
    },
    {
      toolId: 'messari-vesting',
      test: () =>
        /vesting\s*schedule|messari\s*vesting|token\s*vesting/i.test(text),
    },
    {
      toolId: 'messari-fundraising',
      test: () =>
        /fundrais|funding\s*round|vc\s*round|seed\s*round|series\s*[a-d]|messari\s*fund/i.test(text),
    },
    {
      toolId: 'messari-fundraising-investors',
      test: () =>
        /fundrais.*investor|who\s*invested|vc\s*investor|messari\s*investor/i.test(text),
    },
    {
      toolId: 'messari-asset-details',
      test: () =>
        /messari\s*asset\s*detail|messari\s*detail|messari\s*profile|messari\s*fundamentals/i.test(text),
    },
    {
      toolId: 'messari-ath',
      test: () =>
        /messari\s*ath|all\s*time\s*high|messari\s*all.?time|ath\s*data|drawdown/i.test(text),
    },
    {
      toolId: 'messari-roi',
      test: () =>
        /messari\s*roi|return\s*on\s*investment|messari\s*return|roi\s*data/i.test(text),
    },
    {
      toolId: 'messari-news',
      test: () =>
        /messari\s*news|institutional\s*news\s*messari/i.test(text),
    },
    {
      toolId: 'messari-stablecoins',
      test: () =>
        /messari\s*stablecoin|stablecoin\s*supply|stablecoin\s*flow|stablecoin\s*data/i.test(text),
    },
    {
      toolId: 'messari-networks',
      test: () =>
        /messari\s*network|l1\s*l2\s*activity|network\s*activity\s*messari|chain\s*activity|messari\s*l1|messari\s*l2/i.test(text),
    },
    {
      toolId: 'messari-x-users',
      test: () =>
        /messari\s*x.?user|messari\s*influencer|crypto\s*influencer\s*rank|messari\s*twitter/i.test(text),
    },
    {
      toolId: 'messari-timeseries',
      test: () =>
        /messari\s*timeseries|messari\s*historical|messari\s*time\s*series/i.test(text),
    },
    {
      toolId: 'messari-assets',
      test: () =>
        /messari\s*assets?(?!\s*detail)|list\s*(?:all\s*)?assets?\s*messari/i.test(text),
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
    {
      toolId: 'binance-ticker-24h',
      test: () =>
        /binance\s*24h|binance\s*ticker|binance\s*price\s*change|24h\s*ticker\s*binance/i.test(text),
    },
    {
      toolId: 'binance-orderbook',
      test: () =>
        /binance\s*order\s*book|binance\s*depth|binance\s*orderbook|orderbook\s*binance/i.test(text),
    },
    {
      toolId: 'binance-exchange-info',
      test: () =>
        /binance\s*exchange\s*info|binance\s*symbols?|binance\s*trading\s*rules/i.test(text),
    },
    {
      toolId: 'binance-spot-account',
      test: () =>
        /binance\s*account|binance\s*balance|binance\s*wallet|binance\s*holdings/i.test(text),
    },
    {
      toolId: 'binance-spot-order',
      test: () =>
        /binance\s*place\s*order|binance\s*buy|binance\s*sell|binance\s*spot\s*order|trade\s*binance/i.test(text),
    },
    {
      toolId: 'binance-spot-order-cancel',
      test: () =>
        /binance\s*cancel\s*order|binance\s*cancel\s*trade|cancel\s*binance\s*order/i.test(text),
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
    // Partner: KuCoin spot
    {
      toolId: 'kucoin-ticker',
      test: () => /kucoin\s*ticker|ticker\s*kucoin|kucoin\s*price|kucoin\s*btc|kucoin\s*spot/i.test(text),
    },
    {
      toolId: 'kucoin-stats',
      test: () => /kucoin\s*stats|kucoin\s*24h|kucoin\s*24\s*hour/i.test(text),
    },
    {
      toolId: 'kucoin-orderbook',
      test: () => /kucoin\s*order\s*book|kucoin\s*orderbook|orderbook\s*kucoin/i.test(text),
    },
    {
      toolId: 'kucoin-trades',
      test: () => /kucoin\s*trades?|trades?\s*kucoin|kucoin\s*recent\s*trades?/i.test(text),
    },
    {
      toolId: 'kucoin-candles',
      test: () => /kucoin\s*candles?|kucoin\s*klines?|kucoin\s*ohlc|candles?\s*kucoin/i.test(text),
    },
    {
      toolId: 'kucoin-symbols',
      test: () => /kucoin\s*symbols?|symbols?\s*kucoin|kucoin\s*market\s*list/i.test(text),
    },
    {
      toolId: 'kucoin-currencies',
      test: () => /kucoin\s*currencies?|currencies?\s*kucoin/i.test(text),
    },
    {
      toolId: 'kucoin-server-time',
      test: () => /kucoin\s*server\s*time|kucoin\s*time/i.test(text),
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
      toolId: 'squid-route',
      test: () =>
        /squid\s*route|cross[- ]?chain\s*(route|swap|bridge|quote)|bridge\s*(usdc|eth|token)|route\s*(from|to)\s*\w+\s*chain|get\s*cross[- ]?chain\s*quote|bridge\s*from\s*\w+\s*to\s*\w+/i.test(
          text
        ),
    },
    {
      toolId: 'squid-status',
      test: () =>
        /squid\s*status|cross[- ]?chain\s*(tx\s*)?status|bridge\s*status|status\s*of\s*(my\s*)?(bridge|cross[- ]?chain)/i.test(
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
    // Partner: Giza (DeFi yield optimization)
    {
      toolId: 'giza-protocols',
      test: () =>
        /giza\s*protocols?|protocols?\s*(for|on)\s*giza|which\s*protocols?\s*(can i use|are available)|giza\s*usdc\s*protocols?|yield\s*protocols?\s*(base|arbitrum)/i.test(text),
    },
    {
      toolId: 'giza-agent',
      test: () =>
        /giza\s*(smart\s*)?account|giza\s*deposit\s*address|create\s*giza\s*agent|get\s*my\s*giza\s*(wallet|account)|giza\s*wallet\s*address/i.test(text),
    },
    {
      toolId: 'giza-portfolio',
      test: () =>
        /giza\s*portfolio|my\s*giza\s*(portfolio|balance|holdings)|giza\s*status|giza\s*holdings/i.test(text),
    },
    {
      toolId: 'giza-apr',
      test: () =>
        /giza\s*apr|my\s*giza\s*apr|giza\s*(current\s*)?yield|giza\s*rate\s*of\s*return/i.test(text),
    },
    {
      toolId: 'giza-performance',
      test: () =>
        /giza\s*performance|giza\s*history|giza\s*chart|giza\s*value\s*over\s*time|giza\s*returns\s*history/i.test(text),
    },
    {
      toolId: 'giza-activate',
      test: () =>
        /activate\s*giza|giza\s*activate|start\s*giza\s*agent|enable\s*giza\s*yield|giza\s*after\s*deposit/i.test(text),
    },
    {
      toolId: 'giza-withdraw',
      test: () =>
        /giza\s*withdraw|withdraw\s*(from\s*)?giza|pull\s*out\s*giza|giza\s*partial\s*withdraw|giza\s*full\s*withdraw|deactivate\s*giza/i.test(text),
    },
    {
      toolId: 'giza-top-up',
      test: () =>
        /giza\s*top\s*up|top\s*up\s*giza|giza\s*add\s*deposit|giza\s*additional\s*deposit/i.test(text),
    },
    {
      toolId: 'giza-update-protocols',
      test: () =>
        /giza\s*update\s*protocols?|change\s*giza\s*protocols?|giza\s*add\s*protocol|giza\s*protocol\s*set/i.test(text),
    },
    {
      toolId: 'giza-run',
      test: () =>
        /giza\s*run|giza\s*rebalance|trigger\s*giza\s*optimization|giza\s*manual\s*run|run\s*giza\s*now/i.test(text),
    },
    // Partner: CoinMarketCap x402
    {
      toolId: 'coinmarketcap',
      test: () =>
        /coinmarketcap|cmc\s*(quotes|listing|dex)|quotes\s*latest\s*cmc|listing\s*latest\s*cmc|dex\s*pairs?\s*quotes?|dex\s*search\s*cmc/i.test(text),
    },
    // Partner: Purch Vault (skills, knowledge, personas marketplace)
    {
      toolId: 'purch-vault-search',
      test: () =>
        /purch\s*vault|purch\s*vault\s*search|search\s*(?:the\s*)?vault|vault\s*search|agent\s*skills?\s*marketplace|buy\s*skills?\s*for\s*agent|find\s*(?:agent\s*)?(?:skills?|knowledge|personas?)/i.test(text),
    },
    {
      toolId: 'purch-vault-buy',
      test: () =>
        /purch\s*vault\s*buy|buy\s*(?:from\s*)?(?:purch\s*)?vault|purchase\s*(?:from\s*)?(?:purch\s*)?vault|buy\s*(?:this\s*)?(?:skill|knowledge|persona)\s*(?:from\s*)?vault/i.test(text),
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
      toolId: 'website-crawl',
      test: () =>
        /crawl\s*(this\s*)?(site|website|url)|(summarize|get\s*content|ingest)\s*(from\s*)?(this\s*)?(site|website|url|page)|website\s*crawl|site\s*crawl|scrape\s*(this\s*)?site|crawl\s*https?:\/\//i.test(text),
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
  const core = ['news', 'signal', 'sentiment', 'event', 'exa-search', 'website-crawl', 'trending-headline', 'sundown-digest', 'analytics-summary'];
  const partner = ['smart-money', 'token-god-mode', 'dexscreener', 'trending-jupiter', 'jupiter-swap-order', 'squid-route', 'squid-status', 'token-report', 'token-statistic', 'token-risk-alerts', 'bubblemaps-maps', 'binance-correlation', 'binance-ticker-24h', 'binance-orderbook', 'binance-exchange-info', 'binance-spot-account', 'binance-spot-order', 'binance-spot-order-cancel', 'kraken-ticker', 'kraken-orderbook', 'kraken-ohlc', 'kraken-trades', 'kraken-status', 'kraken-server-time', 'kucoin-ticker', 'kucoin-stats', 'kucoin-orderbook', 'kucoin-trades', 'kucoin-candles', 'kucoin-symbols', 'kucoin-currencies', 'kucoin-server-time', 'okx-ticker', 'okx-tickers', 'okx-books', 'okx-candles', 'okx-trades', 'okx-funding-rate', 'okx-open-interest', 'okx-mark-price', 'okx-time', 'okx-dex-price', 'okx-dex-prices', 'okx-dex-kline', 'okx-dex-trades', 'okx-dex-index', 'okx-dex-signal-chains', 'okx-dex-signal-list', 'okx-dex-memepump-chains', 'okx-dex-memepump-tokens', 'okx-dex-memepump-token-details', 'okx-dex-memepump-token-dev-info', 'okx-dex-memepump-similar-tokens', 'okx-dex-memepump-token-bundle-info', 'okx-dex-memepump-aped-wallet', 'coingecko-simple-price', 'coingecko-onchain-token-price', 'coingecko-search-pools', 'coingecko-trending-pools', 'coingecko-onchain-token', 'coinmarketcap', 'giza-protocols', 'giza-agent', 'giza-portfolio', 'giza-apr', 'giza-performance', 'giza-activate', 'giza-withdraw', 'giza-top-up', 'giza-update-protocols', 'giza-run'];
  const messari = ['messari-ai', 'messari-asset-details', 'messari-assets', 'messari-ath', 'messari-roi', 'messari-timeseries', 'messari-signal', 'messari-mindshare-gainers', 'messari-mindshare-losers', 'messari-news', 'messari-token-unlocks', 'messari-vesting', 'messari-fundraising', 'messari-fundraising-investors', 'messari-stablecoins', 'messari-networks', 'messari-x-users'];
  const eight004scan = ['8004scan-stats', '8004scan-chains', '8004scan-agents', '8004scan-agents-search', '8004scan-agent', '8004scan-account-agents', '8004scan-feedbacks'];
  const purchVault = ['purch-vault-search', 'purch-vault-buy'];
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
  lines.push('Partner (Nansen, DexScreener, Jupiter, Rugcheck, Bubblemaps, Binance, Workfun, Giza):', ...fmt(partner), '');
  lines.push('Messari (AI, metrics, signal/mindshare, news, token unlocks, fundraising, stablecoins, networks, X-users):', ...fmt(messari), '');
  lines.push('8004scan.io (ERC-8004 agent discovery):', ...fmt(eight004scan), '');
  lines.push('Purch Vault (marketplace for agent skills, knowledge, personas):', ...fmt(purchVault), '');
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
    if (t.id === 'website-crawl') {
      out.paramsHint = 'Params: url (required) — starting URL to crawl, e.g. https://example.com/docs; optional limit (default 20), depth (default 2)';
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
    // Giza (DeFi yield optimization): owner = EOA 0x...; token = contract address for protocols/activate
    if (t.id === 'giza-protocols') {
      out.paramsHint = 'Params: token (required) — token contract address e.g. USDC on Base: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
    }
    if (['giza-agent', 'giza-portfolio', 'giza-apr', 'giza-performance', 'giza-run'].includes(t.id)) {
      out.paramsHint = 'Params: owner (required) — EOA address (0x...) of the user';
    }
    if (t.id === 'giza-activate') {
      out.paramsHint = 'Params: owner, token (contract address), protocols (array e.g. aave,compound,moonwell), txHash (deposit tx), optional constraints';
    }
    if (t.id === 'giza-withdraw') {
      out.paramsHint = 'Params: owner (required); optional amount (smallest units for partial; omit for full withdrawal)';
    }
    if (t.id === 'giza-top-up') {
      out.paramsHint = 'Params: owner (required), txHash (required) — deposit transaction hash';
    }
    if (t.id === 'giza-update-protocols') {
      out.paramsHint = 'Params: owner (required), protocols (required) — array of protocol names e.g. aave,compound,moonwell,fluid';
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
    // KuCoin spot
    if (t.id === 'kucoin-ticker') {
      out.paramsHint = 'Params: symbol (optional; e.g. BTC-USDT; omit for all tickers)';
    }
    if (['kucoin-stats', 'kucoin-orderbook', 'kucoin-trades', 'kucoin-candles'].includes(t.id)) {
      out.paramsHint = 'Params: symbol (default BTC-USDT); kucoin-orderbook also accepts level (level2_20, level2_100); kucoin-candles accepts type (1min, 1hour, 1day, etc.), pageSize (default 100)';
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
      out.paramsHint = 'Params: chain (e.g. solana, ethereum; required), walletType (use "1,2,3" for all: Smart Money+KOL+Whale in ONE call; or "1" for Smart Money only, "2" for KOL only, "3" for Whale only)';
    }
    if (t.id === 'okx-dex-memepump-tokens') {
      out.paramsHint = 'Params: chain (default solana), stage (NEW or MIGRATING or MIGRATED; required)';
    }
    if (['okx-dex-memepump-token-details', 'okx-dex-memepump-token-dev-info', 'okx-dex-memepump-similar-tokens', 'okx-dex-memepump-token-bundle-info', 'okx-dex-memepump-aped-wallet'].includes(t.id)) {
      out.paramsHint = 'Params: address (token contract address, required), chain (default solana); aped-wallet also accepts optional wallet';
    }
    // Messari x402 tools
    if (t.id === 'messari-ai') {
      out.paramsHint = 'Params: question (required) — natural language question about crypto; OR messages (array of {role, content})';
    }
    if (t.id === 'messari-asset-details') {
      out.paramsHint = 'Params: slugs (comma-separated, e.g. bitcoin,ethereum) or assetIds';
    }
    if (t.id === 'messari-assets') {
      out.paramsHint = 'Params: assetSlugs (optional filter), metrics (optional), limit, page';
    }
    if (t.id === 'messari-ath') {
      out.paramsHint = 'Params: slugs (e.g. bitcoin,ethereum) or assetIds; optional sectors, categories, tags';
    }
    if (t.id === 'messari-roi') {
      out.paramsHint = 'Params: slugs (e.g. bitcoin,ethereum) or assetIds';
    }
    if (t.id === 'messari-timeseries') {
      out.paramsHint = 'Params: assetId (or slug, required), datasetSlug (required, e.g. price), granularity (5m,15m,1h,1d default 1d), start, end';
    }
    if (t.id === 'messari-signal') {
      out.paramsHint = 'Params: assetIds (optional), sort, sortDirection (asc/desc), limit, page';
    }
    if (t.id === 'messari-mindshare-gainers' || t.id === 'messari-mindshare-losers') {
      out.paramsHint = 'Params: period (24h default or 7d), limit, page';
    }
    if (t.id === 'messari-news') {
      out.paramsHint = 'Params: assetSlugs (optional, comma-separated), sourceIds, limit, page';
    }
    if (t.id === 'messari-token-unlocks') {
      out.paramsHint = 'Params: assetId (required — Messari asset ID); optional start, end, limit';
    }
    if (t.id === 'messari-vesting') {
      out.paramsHint = 'Params: assetId (required — Messari asset ID)';
    }
    if (t.id === 'messari-fundraising') {
      out.paramsHint = 'Params: assetSlugs, roundTypes (seed,series-a,etc.), investorSlugs, start, end, limit, page';
    }
    if (t.id === 'messari-fundraising-investors') {
      out.paramsHint = 'Params: assetSlugs, roundTypes, start, end, limit';
    }
    if (t.id === 'messari-stablecoins') {
      out.paramsHint = 'Params: metrics (optional), chains (optional), limit';
    }
    if (t.id === 'messari-networks') {
      out.paramsHint = 'Params: networkSlugs (optional), metrics (optional), limit';
    }
    if (t.id === 'messari-x-users') {
      out.paramsHint = 'Params: sort, sortDirection, accountType, limit, page';
    }
    // Purch Vault
    if (t.id === 'purch-vault-search') {
      out.paramsHint = 'Params: q (search query), category (marketing, development, automation, career, ios, productivity), productType (skill, knowledge, persona), minPrice, maxPrice, limit (default 30)';
    }
    if (t.id === 'purch-vault-buy') {
      out.paramsHint = 'Params: slug (required — item slug from search, e.g. faith); optional email';
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
