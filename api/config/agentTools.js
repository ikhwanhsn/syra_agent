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
  X402_API_PRICE_ZERION_USD,
  X402_API_PRICE_ANALYTICS_SUMMARY_USD,
  X402_API_PRICE_JUPITER_SWAP_USD,
  X402_API_PRICE_PUMP_FUN_TX_USD,
  X402_API_PRICE_PUMP_FUN_READ_USD,
  X402_API_PRICE_SQUID_ROUTE_USD,
  X402_API_PRICE_SQUID_STATUS_USD,
  X402_API_PRICE_EXA_SEARCH_USD,
  X402_API_PRICE_CRAWL_USD,
  X402_API_PRICE_8004_USD,
  X402_API_PRICE_8004SCAN_USD,
  X402_API_PRICE_HEYLOL_USD,
  X402_API_PRICE_GIZA_USD,
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
  X402_DISPLAY_PRICE_ZERION_USD,
  X402_DISPLAY_PRICE_ANALYTICS_SUMMARY_USD,
  X402_DISPLAY_PRICE_JUPITER_SWAP_USD,
  X402_DISPLAY_PRICE_PUMP_FUN_TX_USD,
  X402_DISPLAY_PRICE_PUMP_FUN_READ_USD,
  X402_DISPLAY_PRICE_SQUID_ROUTE_USD,
  X402_DISPLAY_PRICE_SQUID_STATUS_USD,
  X402_DISPLAY_PRICE_EXA_SEARCH_USD,
  X402_DISPLAY_PRICE_CRAWL_USD,
  X402_DISPLAY_PRICE_8004_USD,
  X402_DISPLAY_PRICE_8004SCAN_USD,
  X402_DISPLAY_PRICE_HEYLOL_USD,
  X402_DISPLAY_PRICE_GIZA_USD,
  X402_DISPLAY_PRICE_PURCH_VAULT_USD,
  X402_DISPLAY_PRICE_QUICKNODE_USD,
  X402_DISPLAY_PRICE_BANKR_USD,
  X402_DISPLAY_PRICE_NEYNAR_USD,
  X402_DISPLAY_PRICE_SIWA_USD,
} from './x402Pricing.js';

/** @typedef {{ id: string; path: string; method: string; priceUsd: number; displayPriceUsd?: number; name: string; description: string; nansenPath?: string; zerionPath?: string; purchVaultPath?: string; agentDirect?: boolean; tempoPayout?: boolean; tempoPublic?: 'tokenlist' | 'networks' }} AgentTool */

/**
 * List of agent tools (x402 endpoints). Path is relative to API base (e.g. /news). Nansen calls api.nansen.ai; Zerion calls api.zerion.io (x402).
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
    description:
      'Spot OHLC + technical signal; Syra Agent chat uses CoinGecko by default (set source for CEX or n8n|webhook)',
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
    description: 'Bundled analytics: Jupiter trending, Nansen smart money, Binance correlation',
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
  // Bankr – agent prompts, job status, balances (api.bankr.bot); no public /bankr routes
  {
    id: 'bankr-balances',
    agentDirect: true,
    path: '/bankr/balances',
    method: 'GET',
    priceUsd: X402_API_PRICE_BANKR_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_BANKR_USD,
    name: 'Bankr balances',
    description: 'Wallet balances across chains (optional query: chains=base,solana). Requires BANKR_API_KEY in API.',
  },
  {
    id: 'bankr-prompt',
    agentDirect: true,
    path: '/bankr/prompt',
    method: 'POST',
    priceUsd: X402_API_PRICE_BANKR_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_BANKR_USD,
    name: 'Bankr prompt',
    description: 'Submit a natural language prompt to Bankr agent (body: prompt, optional threadId). Returns jobId; poll bankr-job tool with jobId for result.',
  },
  {
    id: 'bankr-job',
    agentDirect: true,
    path: '/bankr/job',
    method: 'GET',
    priceUsd: X402_API_PRICE_BANKR_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_BANKR_USD,
    name: 'Bankr job status',
    description: 'Get Bankr job status and result (path: /bankr/job/:jobId).',
  },
  {
    id: 'bankr-job-cancel',
    agentDirect: true,
    path: '/bankr/job/:jobId/cancel',
    method: 'POST',
    priceUsd: X402_API_PRICE_BANKR_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_BANKR_USD,
    name: 'Bankr cancel job',
    description: 'Cancel a pending/processing Bankr job (path: /bankr/job/:jobId/cancel).',
  },
  // Neynar Farcaster API (no public /neynar routes)
  {
    id: 'neynar-user',
    agentDirect: true,
    path: '/neynar/user',
    method: 'GET',
    priceUsd: X402_API_PRICE_NEYNAR_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_NEYNAR_USD,
    name: 'Neynar user lookup',
    description: 'Farcaster user by username or by FIDs (query: username or fids). Requires NEYNAR_API_KEY.',
  },
  {
    id: 'neynar-feed',
    agentDirect: true,
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
    agentDirect: true,
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
    agentDirect: true,
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
  // Partner: Zerion (x402 — USDC on Solana; see https://developers.zerion.io/build-with-ai/x402)
  {
    id: 'zerion-wallet-portfolio',
    path: '/zerion/wallet/portfolio',
    zerionPath: '/v1/wallets/{address}/portfolio',
    method: 'GET',
    priceUsd: X402_API_PRICE_ZERION_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_ZERION_USD,
    name: 'Zerion: wallet portfolio',
    description: 'Multi-chain portfolio overview for an EVM or Solana address (Zerion)',
  },
  {
    id: 'zerion-wallet-positions',
    path: '/zerion/wallet/positions',
    zerionPath: '/v1/wallets/{address}/positions/',
    method: 'GET',
    priceUsd: X402_API_PRICE_ZERION_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_ZERION_USD,
    name: 'Zerion: wallet positions',
    description: 'Fungible positions (wallet + DeFi) for an address; optional filter[positions], filter[chain_ids], currency, sync',
  },
  {
    id: 'zerion-wallet-pnl',
    path: '/zerion/wallet/pnl',
    zerionPath: '/v1/wallets/{address}/pnl',
    method: 'GET',
    priceUsd: X402_API_PRICE_ZERION_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_ZERION_USD,
    name: 'Zerion: wallet PnL',
    description: 'FIFO PnL (realized/unrealized, net invested) for an address; optional filter[chain_ids], since, till, currency',
  },
  {
    id: 'zerion-wallet-transactions',
    path: '/zerion/wallet/transactions',
    zerionPath: '/v1/wallets/{address}/transactions/',
    method: 'GET',
    priceUsd: X402_API_PRICE_ZERION_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_ZERION_USD,
    name: 'Zerion: wallet transactions',
    description: 'Human-readable tx history; optional currency, page[size], filter[operation_types], filter[chain_ids], filter[min_mined_at]',
  },
  {
    id: 'zerion-gas-prices',
    path: '/zerion/gas-prices',
    zerionPath: '/v1/gas-prices/',
    method: 'GET',
    priceUsd: X402_API_PRICE_ZERION_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_ZERION_USD,
    name: 'Zerion: gas prices',
    description: 'Current gas prices across chains; optional filter[chain_ids], filter[gas_types]',
  },
  {
    id: 'zerion-chains',
    path: '/zerion/chains',
    zerionPath: '/v1/chains/',
    method: 'GET',
    priceUsd: X402_API_PRICE_ZERION_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_ZERION_USD,
    name: 'Zerion: supported chains',
    description: 'Chains supported by Zerion (ids, explorers, RPC hints); optional x_env=testnet header via param x_env',
  },
  {
    id: 'zerion-fungibles',
    path: '/zerion/fungibles',
    zerionPath: '/v1/fungibles/',
    method: 'GET',
    priceUsd: X402_API_PRICE_ZERION_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_ZERION_USD,
    name: 'Zerion: fungibles list',
    description: 'Search/list fungible assets (Zerion query params e.g. filter[search_query], page[size])',
  },
  // Partner: Jupiter, Bubblemaps, Binance
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
    id: 'pumpfun-agents-swap',
    path: '/pumpfun/agents/swap',
    method: 'POST',
    priceUsd: X402_API_PRICE_PUMP_FUN_TX_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_PUMP_FUN_TX_USD,
    name: 'pump.fun agents swap',
    description:
      'Build pump.fun buy/sell tx (bonding curve or AMM) via fun-block; body matches pump-fun-skills swap skill (inputMint, outputMint, amount, user); returns base64 transaction',
  },
  {
    id: 'pumpfun-agents-create-coin',
    path: '/pumpfun/agents/create-coin',
    method: 'POST',
    priceUsd: X402_API_PRICE_PUMP_FUN_TX_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_PUMP_FUN_TX_USD,
    name: 'pump.fun create coin',
    description:
      'Build pump.fun create + initial buy tx via fun-block; body matches pump-fun-skills create-coin skill (user, name, symbol, uri, solLamports). x402: base + initial-buy volume surcharge from solLamports (see PUMPFUN_CREATE_COIN_VOLUME_FEE_* env)',
  },
  {
    id: 'pumpfun-coin',
    path: '/pumpfun/coin/:mint',
    method: 'GET',
    priceUsd: X402_API_PRICE_PUMP_FUN_READ_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_PUMP_FUN_READ_USD,
    name: 'pump.fun coin metadata',
    description:
      'Proxy GET coins-v2/{mint}; x402 scales with usd_market_cap (cached). Same data: GET /pumpfun/coin?mint=',
  },
  {
    id: 'pumpfun-coin-query',
    path: '/pumpfun/coin',
    method: 'GET',
    priceUsd: X402_API_PRICE_PUMP_FUN_READ_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_PUMP_FUN_READ_USD,
    name: 'pump.fun coin metadata (query mint)',
    description: 'GET /pumpfun/coin?mint=<base58> — same coins-v2 proxy and dynamic x402 as path variant',
  },
  {
    id: 'pumpfun-sol-price',
    path: '/pumpfun/sol-price',
    method: 'GET',
    priceUsd: X402_API_PRICE_PUMP_FUN_READ_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_PUMP_FUN_READ_USD,
    name: 'pump.fun SOL price',
    description: 'SOL/USD from pump frontend-api-v3 (server-side proxy)',
  },
  {
    id: 'pumpfun-collect-fees',
    path: '/pumpfun/agents/collect-fees',
    method: 'POST',
    priceUsd: X402_API_PRICE_PUMP_FUN_TX_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_PUMP_FUN_TX_USD,
    name: 'pump.fun collect / distribute creator fees',
    description:
      'Claim creator fees, distribute shared fees, or claim trading cashback — fun-block POST /agents/collect-fees (mint, user)',
  },
  {
    id: 'pumpfun-sharing-config',
    path: '/pumpfun/agents/sharing-config',
    method: 'POST',
    priceUsd: X402_API_PRICE_PUMP_FUN_TX_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_PUMP_FUN_TX_USD,
    name: 'pump.fun fee sharing config',
    description:
      'Create or update who receives creator fees (up to 10 shareholders, bps sum 10000) — fun-block POST /agents/sharing-config',
  },
  {
    id: 'pumpfun-agent-payments-build',
    path: '/pumpfun/agent-payments/build-accept',
    method: 'POST',
    priceUsd: X402_API_PRICE_PUMP_FUN_TX_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_PUMP_FUN_TX_USD,
    name: 'Tokenized agent: build payment tx',
    description:
      'Build base64 legacy Transaction for invoice payment (USDC/wSOL) via @pump-fun/agent-payments-sdk; requires SOLANA_RPC_URL',
  },
  {
    id: 'pumpfun-agent-payments-verify',
    path: '/pumpfun/agent-payments/verify',
    method: 'POST',
    priceUsd: X402_API_PRICE_PUMP_FUN_READ_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_PUMP_FUN_READ_USD,
    name: 'Tokenized agent: verify invoice paid',
    description: 'Verify invoice paid on-chain (agentMint, user, currencyMint, amount, memo, startTime, endTime as numbers)',
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
    agentDirect: true,
    path: '/binance/correlation',
    method: 'GET',
    priceUsd: X402_API_PRICE_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_USD,
    name: 'Binance correlation',
    description: 'Binance correlation data',
  },
  // Partner: Binance Spot (no public /binance routes; env or params api keys)
  {
    id: 'binance-ticker-24h',
    agentDirect: true,
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
    agentDirect: true,
    path: '/binance/spot/exchange-info',
    method: 'GET',
    priceUsd: X402_API_PRICE_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_USD,
    name: 'Binance exchange info',
    description: 'Binance spot exchange trading rules and symbol info. Optional symbol or symbols.',
  },
  {
    id: 'binance-spot-account',
    agentDirect: true,
    path: '/binance/spot/account',
    method: 'GET',
    priceUsd: X402_API_PRICE_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_USD,
    name: 'Binance spot account',
    description: 'Binance spot account balances. Requires BINANCE_API_KEY and BINANCE_API_SECRET in env (or apiKey/apiSecret in body).',
  },
  {
    id: 'binance-spot-order',
    agentDirect: true,
    path: '/binance/spot/order',
    method: 'POST',
    priceUsd: X402_API_PRICE_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_USD,
    name: 'Binance place spot order',
    description: 'Place a Binance spot order. symbol (e.g. BTCUSDT), side (BUY/SELL), type (MARKET/LIMIT etc.), quantity or quoteOrderQty. Requires API key in env or body.',
  },
  {
    id: 'binance-spot-order-cancel',
    agentDirect: true,
    path: '/binance/spot/order',
    method: 'DELETE',
    priceUsd: X402_API_PRICE_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_USD,
    name: 'Binance cancel spot order',
    description: 'Cancel a Binance spot order. symbol required; orderId or origClientOrderId required. Requires API key in env or body.',
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
  // Partner: Giza — DeFi yield optimization (no public /giza routes)
  {
    id: 'giza-protocols',
    agentDirect: true,
    path: '/giza/protocols',
    method: 'GET',
    priceUsd: X402_API_PRICE_GIZA_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_GIZA_USD,
    name: 'Giza protocols',
    description: 'List DeFi protocols available for a token on Giza (e.g. USDC on Base). Params: token (contract address 0x...)',
  },
  {
    id: 'giza-agent',
    agentDirect: true,
    path: '/giza/agent',
    method: 'GET',
    priceUsd: X402_API_PRICE_GIZA_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_GIZA_USD,
    name: 'Giza agent (smart account)',
    description: 'Get or create Giza smart account (deposit address) for an owner EOA. Params: owner (0x... address)',
  },
  {
    id: 'giza-portfolio',
    agentDirect: true,
    path: '/giza/portfolio',
    method: 'GET',
    priceUsd: X402_API_PRICE_GIZA_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_GIZA_USD,
    name: 'Giza portfolio',
    description: 'Get current Giza portfolio status (protocols, balances). Params: owner (0x...)',
  },
  {
    id: 'giza-apr',
    agentDirect: true,
    path: '/giza/apr',
    method: 'GET',
    priceUsd: X402_API_PRICE_GIZA_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_GIZA_USD,
    name: 'Giza APR',
    description: 'Get current APR for a Giza agent. Params: owner (0x...)',
  },
  {
    id: 'giza-performance',
    agentDirect: true,
    path: '/giza/performance',
    method: 'GET',
    priceUsd: X402_API_PRICE_GIZA_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_GIZA_USD,
    name: 'Giza performance',
    description: 'Get performance history (value over time) for a Giza agent. Params: owner (0x...)',
  },
  {
    id: 'giza-activate',
    agentDirect: true,
    path: '/giza/activate',
    method: 'POST',
    priceUsd: X402_API_PRICE_GIZA_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_GIZA_USD,
    name: 'Giza activate',
    description: 'Activate Giza agent after deposit: owner, token, protocols (array), txHash, optional constraints',
  },
  {
    id: 'giza-withdraw',
    agentDirect: true,
    path: '/giza/withdraw',
    method: 'POST',
    priceUsd: X402_API_PRICE_GIZA_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_GIZA_USD,
    name: 'Giza withdraw',
    description: 'Withdraw from Giza (partial: amount in smallest units; full: omit amount). Params: owner, optional amount',
  },
  {
    id: 'giza-top-up',
    agentDirect: true,
    path: '/giza/top-up',
    method: 'POST',
    priceUsd: X402_API_PRICE_GIZA_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_GIZA_USD,
    name: 'Giza top-up',
    description: 'Record a top-up deposit for an active Giza agent. Params: owner, txHash',
  },
  {
    id: 'giza-update-protocols',
    agentDirect: true,
    path: '/giza/update-protocols',
    method: 'POST',
    priceUsd: X402_API_PRICE_GIZA_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_GIZA_USD,
    name: 'Giza update protocols',
    description: 'Update protocol set for a Giza agent. Params: owner, protocols (array)',
  },
  {
    id: 'giza-run',
    agentDirect: true,
    path: '/giza/run',
    method: 'POST',
    priceUsd: X402_API_PRICE_GIZA_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_GIZA_USD,
    name: 'Giza run (rebalance)',
    description: 'Trigger a manual optimization run for a Giza agent. Params: owner',
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
  // Tempo public data (agent): official token list + network URLs; free, no USDC balance required
  {
    id: 'tempo-token-list',
    path: '/__tempo_public__/tokenlist',
    method: 'GET',
    tempoPublic: 'tokenlist',
    priceUsd: 0,
    displayPriceUsd: 0,
    name: 'Tempo public token list',
    description:
      'Fetch the official Tempo token list JSON (Uniswap Token Lists format) from tokenlist.tempo.xyz. Params: chainId — 4217 (mainnet Presto) or 42431 (testnet Moderato); default 4217. Use for token names, addresses, and decimals on Tempo.',
  },
  {
    id: 'tempo-network-info',
    path: '/__tempo_public__/networks',
    method: 'GET',
    tempoPublic: 'networks',
    priceUsd: 0,
    displayPriceUsd: 0,
    name: 'Tempo public network info',
    description:
      'Return public Tempo RPC URLs, chain IDs, block explorers, token list endpoints, and documentation links (no on-chain call). No params.',
  },
  // Tempo payout rail (agent): treasury sends TIP-20 on Tempo to user’s verified EVM address only; gated by TEMPO_AGENT_PAYOUT_ENABLED
  {
    id: 'tempo-send-payout',
    path: '/payouts/tempo',
    method: 'POST',
    tempoPayout: true,
    priceUsd: 0,
    displayPriceUsd: 0,
    name: 'Tempo stablecoin payout',
    description:
      'Send stablecoin on Tempo to the user’s own address only (connected 0x wallet or Base agent wallet). Params: amountUsd (required), memo (optional). Treasury pays on Tempo; not deducted from agent Solana USDC. Only when the server enables agent Tempo payouts.',
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
  else if (toolId && typeof toolId === 'string' && toolId.startsWith('pumpfun') && toolId.includes('_')) {
    normalized = toolId.replace(/_/g, '-');
  }
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
    // Partner: Bubblemaps, Binance
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
    // Partner: Nansen, Jupiter
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
    // Partner: Zerion (x402)
    {
      toolId: 'zerion-wallet-portfolio',
      test: () =>
        /zerion\s+portfolio|zerion\s+wallet\s+portfolio|multi[-\s]?chain\s+portfolio|portfolio\s+(?:from|via)\s+zerion/i.test(
          text
        ),
    },
    {
      toolId: 'zerion-wallet-positions',
      test: () =>
        /zerion\s+positions?|positions?\s+(?:from|via)\s+zerion|zerion\s+holdings|zerion\s+defi\s+positions?/i.test(text),
    },
    {
      toolId: 'zerion-wallet-pnl',
      test: () =>
        /zerion\s+pnl|zerion\s+profit|pnl\s+(?:from|via)\s+zerion|zerion\s+gains?/i.test(text),
    },
    {
      toolId: 'zerion-wallet-transactions',
      test: () =>
        /zerion\s+transactions?|zerion\s+tx|transaction\s+history\s+zerion|zerion\s+(?:wallet\s+)?activity|on[-\s]?chain\s+history\s+zerion/i.test(
          text
        ),
    },
    {
      toolId: 'zerion-gas-prices',
      test: () =>
        /zerion\s+gas|gas\s+prices?\s+(?:from\s+)?zerion|zerion\s+fee\s+estimate/i.test(text),
    },
    {
      toolId: 'zerion-chains',
      test: () =>
        /zerion\s+chains?|chains?\s+(?:from|via)\s+zerion|zerion\s+supported\s+chains?/i.test(text),
    },
    {
      toolId: 'zerion-fungibles',
      test: () =>
        /zerion\s+fungibles?|zerion\s+token\s+search|search\s+tokens?\s+(?:on\s+)?zerion|zerion\s+asset\s+list/i.test(
          text
        ),
    },
    {
      toolId: 'trending-jupiter',
      test: () =>
        /trending\s*(on\s*)?jupiter|jupiter\s*trending|trending\s*tokens?\s*(on\s*jupiter)?/i.test(
          text
        ),
    },
    {
      toolId: 'pumpfun-sol-price',
      test: () => /pump\.fun\s*sol|sol\s*price\s*pump|pumpfun\s*sol\s*price/i.test(text),
    },
    {
      toolId: 'pumpfun-coin-query',
      test: () =>
        /pump\.fun\s*(coin|token)\s*(info|metadata|data)|pumpfun\s*(coin|metadata)|metadata\s*for\s*pump/i.test(
          text
        ),
    },
    {
      toolId: 'pumpfun-agents-swap',
      test: () =>
        /pump\.fun\s+swap|swap\s+on\s+pump|pump\s+swap|buy\s+on\s+pump\.fun|sell\s+on\s+pump\.fun|trade\s+pump\.fun/i.test(
          text
        ),
    },
    {
      toolId: 'pumpfun-agents-create-coin',
      test: () =>
        /launch\s+(?:a\s+)?(?:coin|token)\s+on\s+pump|create\s+coin\s+on\s+pump|pump\.fun\s+launch|new\s+pump\s*(?:\.fun\s*)?(?:coin|token)/i.test(
          text
        ),
    },
    {
      toolId: 'pumpfun-collect-fees',
      test: () =>
        /claim\s+creator\s+fees?\s*pump|collect\s+fees?\s+pump|pump\.fun\s+(collect|claim)\s+fees|creator\s+fees?\s+pump/i.test(
          text
        ),
    },
    {
      toolId: 'pumpfun-sharing-config',
      test: () =>
        /pump\.fun\s+shar(ing|e)\s+fees|fee\s+shar(ing|e)\s+pump|redistribute\s+creator\s+fees?\s+pump/i.test(
          text
        ),
    },
    {
      toolId: 'pumpfun-agent-payments-build',
      test: () =>
        /tokenized\s+agent\s+payment|build\s+(accept|payment)\s*(tx)?\s*pump|invoice\s+payment\s+pump|pump\s+agent\s+payment/i.test(
          text
        ),
    },
    {
      toolId: 'pumpfun-agent-payments-verify',
      test: () =>
        /verify\s+invoice\s+pump|pump\s+verify\s+invoice|invoice\s+paid\s+pump/i.test(text),
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
  const partner = [
    'smart-money',
    'token-god-mode',
    'trending-jupiter',
    'jupiter-swap-order',
    'squid-route',
    'squid-status',
    'bubblemaps-maps',
    'binance-correlation',
    'binance-ticker-24h',
    'binance-orderbook',
    'binance-exchange-info',
    'binance-spot-account',
    'binance-spot-order',
    'binance-spot-order-cancel',
    'giza-protocols',
    'giza-agent',
    'giza-portfolio',
    'giza-apr',
    'giza-performance',
    'giza-activate',
    'giza-withdraw',
    'giza-top-up',
    'giza-update-protocols',
    'giza-run',
  ];
  const eight004scan = ['8004scan-stats', '8004scan-chains', '8004scan-agents', '8004scan-agents-search', '8004scan-agent', '8004scan-account-agents', '8004scan-feedbacks'];
  const purchVault = ['purch-vault-search', 'purch-vault-buy'];
  const pumpfun = [
    'pumpfun-sol-price',
    'pumpfun-coin',
    'pumpfun-coin-query',
    'pumpfun-agents-swap',
    'pumpfun-agents-create-coin',
    'pumpfun-collect-fees',
    'pumpfun-sharing-config',
    'pumpfun-agent-payments-build',
    'pumpfun-agent-payments-verify',
  ];
  const nansenX402 = AGENT_TOOLS.filter((t) => t.nansenPath).map((t) => t.id);
  const zerionX402 = AGENT_TOOLS.filter((t) => t.zerionPath).map((t) => t.id);

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
  lines.push('Partner (Nansen, Zerion, Jupiter, Squid, Bubblemaps, Binance, Giza):', ...fmt(partner), '');
  lines.push(
    'Partner pump.fun (Syra /pumpfun/* x402 proxy; fun-block + coins-v2; use mint + user as required):',
    ...fmt(pumpfun),
    ''
  );
  lines.push('8004scan.io (ERC-8004 agent discovery):', ...fmt(eight004scan), '');
  lines.push('Purch Vault (marketplace for agent skills, knowledge, personas):', ...fmt(purchVault), '');
  if (nansenX402.length) {
    lines.push('Nansen (per-endpoint; pass chain, address, or token_address as needed):', ...fmt(nansenX402), '');
  }
  if (zerionX402.length) {
    lines.push(
      'Zerion (x402; wallet tools need param address = EVM 0x… or Solana; optional filter*, currency, page[size], x_env=testnet):',
      ...fmt(zerionX402),
      ''
    );
  }

  return lines;
}

/**
 * Tool list for LLM tool selection: id, name, description, and optional params hint.
 * Used so the LLM can dynamically pick the right tool from the user question.
 * @returns {Array<{ id: string; name: string; description: string; paramsHint?: string }>}
 */
export function getToolsForLlmSelection() {
  const tempoAgentPayoutEnabled = String(process.env.TEMPO_AGENT_PAYOUT_ENABLED || "").trim() === "true";
  return AGENT_TOOLS.filter((t) => t.id !== "tempo-send-payout" || tempoAgentPayoutEnabled).map((t) => {
    const out = { id: t.id, name: t.name, description: t.description };
    if (t.id === 'news') {
      out.paramsHint = 'Optional params: ticker (BTC, ETH, SOL, or general)';
    }
    if (t.id === 'signal') {
      out.paramsHint =
        'Optional: token (default bitcoin); omit source = Binance OHLC + engine; or source = coinbase|okx|bybit|kraken|bitget|kucoin|upbit|cryptocom; n8n|webhook for legacy n8n; instId, bar, limit';
    }
    if (t.id === 'exa-search') {
      out.paramsHint = 'Params: query (required) — search query from the user, e.g. "bitcoin insight", "latest Nvidia news"';
    }
    if (t.id === 'website-crawl') {
      out.paramsHint = 'Params: url (required) — starting URL to crawl, e.g. https://example.com/docs; optional limit (default 20), depth (default 2)';
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
    // Purch Vault
    if (t.id === 'purch-vault-search') {
      out.paramsHint = 'Params: q (search query), category (marketing, development, automation, career, ios, productivity), productType (skill, knowledge, persona), minPrice, maxPrice, limit (default 30)';
    }
    if (t.id === 'purch-vault-buy') {
      out.paramsHint = 'Params: slug (required — item slug from search, e.g. faith); optional email';
    }
    if (t.id === 'tempo-token-list') {
      out.paramsHint =
        'Params: chainId — 4217 (mainnet) or 42431 (Moderato testnet); omit for mainnet. Returns tokens[].address, symbol, decimals from https://tokenlist.tempo.xyz/list/{chainId}';
    }
    if (t.id === 'tempo-network-info') {
      out.paramsHint = 'No params. Returns RPC, explorer, token list URLs, and docs links.';
    }
    if (t.id === 'tempo-send-payout') {
      out.paramsHint =
        'Params: amountUsd (required, positive number; cap from server), memo (optional — reconciliation ref). Payout always goes to the user’s linked EVM address or Base agent wallet; never pass a recipient address.';
    }
    if (t.id === 'pumpfun-sol-price') {
      out.paramsHint = 'No params.';
    }
    if (t.id === 'pumpfun-coin' || t.id === 'pumpfun-coin-query') {
      out.paramsHint =
        'Params: mint (required) — pump.fun token mint base58. For pumpfun-coin-query use tool id pumpfun-coin-query with param mint=…';
    }
    if (t.id === 'pumpfun-agents-swap') {
      out.paramsHint =
        'Params: inputMint, outputMint, amount (base units string), user (optional — defaults to agent wallet). Bonding curve or graduated AMM per pump.fun.';
    }
    if (t.id === 'pumpfun-agents-create-coin') {
      out.paramsHint =
        'Params: user (optional), name, symbol, uri (metadata URL), solLamports (string) — launch + initial buy on pump.fun.';
    }
    if (t.id === 'pumpfun-collect-fees') {
      out.paramsHint =
        'Params: mint (coin), user (optional), encoding base64 optional, frontRunningProtection optional — claim/distribute creator fees.';
    }
    if (t.id === 'pumpfun-sharing-config') {
      out.paramsHint =
        'Params: mint, user (optional), shareholders JSON string, encoding — fee split recipients (bps sum 10000).';
    }
    if (t.id === 'pumpfun-agent-payments-build') {
      out.paramsHint =
        'Params: agentMint (tokenized-agent mint only), user (optional), currencyMint, amount, memo, startTime, endTime (strings for API) — build-accept invoice tx.';
    }
    if (t.id === 'pumpfun-agent-payments-verify') {
      out.paramsHint =
        'Params: agentMint, user (optional), currencyMint, amount, memo, startTime, endTime as numbers — verify invoice paid.';
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
    if (t.zerionPath) {
      const zerionHints = {
        'zerion-wallet-portfolio':
          'Params: address (required, EVM or Solana). Optional: filter[positions] only_simple|only_complex|no_filter, currency, sync true|false, x_env=testnet',
        'zerion-wallet-positions':
          'Params: address (required). Optional: filter[positions], filter[chain_ids], filter[position_types], currency, sort, sync, x_env',
        'zerion-wallet-pnl':
          'Params: address (required). Optional: currency, filter[chain_ids], since, till (ms timestamps)',
        'zerion-wallet-transactions':
          'Params: address (required). Optional: currency, page[size], filter[operation_types], filter[chain_ids], filter[min_mined_at]',
        'zerion-gas-prices': 'Optional: filter[chain_ids], filter[gas_types]',
        'zerion-chains': 'Optional: x_env=testnet for testnets',
        'zerion-fungibles':
          'Optional: filter[search_query], page[size], currency — use Zerion v1 query param names as flat keys',
      };
      if (zerionHints[t.id]) out.paramsHint = zerionHints[t.id];
    }
    return out;
  });
}
