/**
 * Single source of truth for Syra x402 discovery endpoint metadata.
 * Keys match segments in x402DiscoveryResourcePaths.js (no leading slash).
 *
 * description: agent-optimized copy for 402 bodies, OpenAPI, ShadowFeed, MPP.
 * summary: short title for OpenAPI summary fields.
 */
import { X402_DISCOVERY_RESOURCE_PATHS } from './x402DiscoveryResourcePaths.js';
import { resolvePillarForCatalogSlug } from './pillars.js';

/** @typedef {{ slug: string; name: string; category: string; methods: ('GET'|'POST')[]; summary: string; description: string; suggestedPriceStx: number }} X402ResourceMeta */

/** @type {Record<string, X402ResourceMeta>} */
export const X402_RESOURCE_CATALOG = {
  brain: {
    slug: 'brain',
    name: 'Syra Brain',
    category: 'ai',
    methods: ['GET', 'POST'],
    summary: 'Single-question crypto AI with automatic tool selection',
    description:
      'Answers one natural-language crypto question by selecting and running Syra tools (news, signals, on-chain reads) server-side. Use when an agent needs a grounded synthesis instead of calling many APIs manually. Input: question (required). Returns success, markdown/plain response, and toolUsages[] showing which tools ran. Treasury-paid tool calls included; not trade execution.',
    suggestedPriceStx: 0.08,
  },
  news: {
    slug: 'news',
    name: 'Crypto News',
    category: 'news',
    methods: ['GET', 'POST'],
    summary: 'Latest crypto news headlines and summaries',
    description:
      'Curated crypto news articles with titles, sources, and URLs. Use when an agent needs recent headlines for a token, sector, or the whole market before trading or posting. Input: optional ticker (BTC, ETH, SOL, or general). Returns news[] with title, url, date, source.',
    suggestedPriceStx: 0.005,
  },
  signal: {
    slug: 'signal',
    name: 'Trading Signal',
    category: 'signals',
    methods: ['GET', 'POST'],
    summary: 'AI trading signal from CEX OHLCV technical analysis',
    description:
      'Generates a directional trading signal with bias, confidence, entry context, and reasoning from OHLCV candles. Use when an agent needs a technical read on BTC, ETH, SOL, or other supported assets before sizing a trade. Inputs: token (e.g. solana, bitcoin), source (binance default; coingecko if CEX blocked), interval, limit. Returns signal object with recommendation and analysis — probabilistic, not execution.',
    suggestedPriceStx: 0.005,
  },
  spcx: {
    slug: 'spcx',
    name: 'SPCX SpaceX IPO Intelligence',
    category: 'analytics',
    methods: ['GET'],
    summary: 'SpaceX IPO token (SPCXx) Nasdaq vs on-chain spread',
    description:
      'Tokenized equity intelligence for SpaceX IPO exposure (SPCXx). Use when an agent compares Nasdaq reference price vs on-chain SPCX venues for premium/discount and agent bias. Input: symbol (default SPCXx). Returns nasdaqPriceUsd, venues[], agentBias, agentTake, riskNotes[], opportunities[], disclaimer.',
    suggestedPriceStx: 0.02,
  },
  equity: {
    slug: 'equity',
    name: 'Tokenized Equity Intelligence',
    category: 'analytics',
    methods: ['GET'],
    summary: 'xStocks equity spread — Nasdaq vs on-chain (TSLAx, NVDAx, …)',
    description:
      'Parametric tokenized equity intelligence for xStocks symbols. Use when an agent needs Nasdaq vs on-chain premium/discount, venue prices, and narrative bias for stocks like TSLAx or NVDAx. Input: symbol (required, e.g. TSLAx). Returns same report shape as /spcx: venues, agentBias, agentTake, riskNotes, opportunities.',
    suggestedPriceStx: 0.02,
  },
  indicator: {
    slug: 'indicator',
    name: 'Technical Indicators',
    category: 'analytics',
    methods: ['GET', 'POST'],
    summary: 'Combine RSI, MACD, EMA, Bollinger, and 20+ indicators in one call',
    description:
      'Computes multiple technical indicators from OHLCV candles in one agent-readable response. Use when an agent needs RSI/MACD/EMA/Bollinger (or custom combos) without building indicator math. Inputs: symbol, source (binance/coinbase/coingecko), interval, limit, indicators (comma-separated), optional series=true. Returns indicators{} map, lastClose, candleCount, asOf.',
    suggestedPriceStx: 0.005,
  },
  sentiment: {
    slug: 'sentiment',
    name: 'Market Sentiment',
    category: 'analytics',
    methods: ['GET', 'POST'],
    summary: '30-day crypto sentiment scores by ticker',
    description:
      'Daily sentiment breakdown (positive/negative/neutral/score) over ~30 days from news-derived analysis. Use when an agent gauges crowd mood on BTC, ETH, or a ticker before narrative trades. Input: optional ticker. Returns sentimentAnalysis[] with per-day scores.',
    suggestedPriceStx: 0.005,
  },
  event: {
    slug: 'event',
    name: 'Crypto Events',
    category: 'news',
    methods: ['GET', 'POST'],
    summary: 'Upcoming and recent crypto events calendar',
    description:
      'Lists conferences, launches, listings, and macro events affecting crypto. Use when an agent schedules research around catalysts or filters noise by ticker. Input: optional ticker. Returns event[] with titles, dates, and metadata.',
    suggestedPriceStx: 0.005,
  },
  'trending-headline': {
    slug: 'trending-headline',
    name: 'Trending Headlines',
    category: 'news',
    methods: ['GET', 'POST'],
    summary: 'What is trending in crypto news right now',
    description:
      'Hot headlines and viral crypto stories currently moving the market. Use when an agent needs the top narrative of the day rather than a full news archive. Input: optional ticker filter. Returns trendingHeadline[].',
    suggestedPriceStx: 0.005,
  },
  'sundown-digest': {
    slug: 'sundown-digest',
    name: 'Sundown Digest',
    category: 'news',
    methods: ['GET', 'POST'],
    summary: 'End-of-day crypto market recap',
    description:
      'Daily wrap-up of key market moves, headlines, and themes. Use when an agent summarizes the session for reports or next-day planning. No required inputs. Returns sundownDigest[] items.',
    suggestedPriceStx: 0.005,
  },
  health: {
    slug: 'health',
    name: 'API Health',
    category: 'health',
    methods: ['GET', 'POST'],
    summary: 'Paid liveness probe for Syra API',
    description:
      'Minimal paid health check confirming Syra API is up and x402 settlement works. Use when an agent or monitor verifies connectivity before batch calls. No inputs. Returns ok, status, service, message, timestamp.',
    suggestedPriceStx: 0.001,
  },
  'mpp/health': {
    slug: 'mpp-health',
    name: 'MPP Health Check',
    category: 'health',
    methods: ['GET', 'POST'],
    summary: 'Machine Payments Protocol test lane (x402 v2)',
    description:
      'MPP-compatible health endpoint with same x402 v2 flow as /health. Use when testing Tempo/Stripe-style machine payment clients against Syra. Returns ok, protocol mpp-test, paymentCompatibility x402-v2, plus /health sibling reference.',
    suggestedPriceStx: 0.001,
  },
  arbitrage: {
    slug: 'arbitrage',
    name: 'Cross-CEX Arbitrage Bundle',
    category: 'analytics',
    methods: ['GET', 'POST'],
    summary: 'CMC top assets + live CEX snapshots + ranked spreads',
    description:
      'Bundles CoinMarketCap-style top tradable assets (stablecoins skipped) with live cross-venue USDT spot snapshots and ranked buy/sell routes by gross spread. Use when an agent scouts arbitrage ideas before fees/slippage. Input: limit (default 10, max 25). Returns cmcTop, snapshots[], ranked[], best, runnerUp — not financial advice.',
    suggestedPriceStx: 0.04,
  },
  'jupiter/quote': {
    slug: 'jupiter-quote',
    name: 'Jupiter Swap Quote',
    category: 'defi',
    methods: ['GET', 'POST'],
    summary: 'Jupiter Swap V1 ExactIn quote with Syra referral fee',
    description:
      'Fetches a Jupiter Swap V1 quoteResponse for ExactIn swaps with Syra referral platform fee when configured on-chain. Use when an agent prices a Solana swap before building a transaction. Inputs: inputMint, outputMint, amount (raw units), optional slippageBps. Returns quote object and referral metadata.',
    suggestedPriceStx: 0.001,
  },
  'pumpfun/trending': {
    slug: 'pumpfun-trending',
    name: 'pump.fun Trending',
    category: 'defi',
    methods: ['GET', 'POST'],
    summary: 'Trending pump.fun coins list',
    description:
      'Returns trending pump.fun coins from frontend-api-v3 (falls back to top-runners when primary feed is empty). Use when an agent scans hot memecoin launches or social momentum on pump.fun. Inputs: limit (default 20, max 50), offset, includeNsfw. Returns normalized coins[], count, upstream metadata.',
    suggestedPriceStx: 0.001,
  },
  'pumpfun/movers': {
    slug: 'pumpfun-movers',
    name: 'pump.fun Movers',
    category: 'defi',
    methods: ['GET', 'POST'],
    summary: 'pump.fun market movers list',
    description:
      'Returns pump.fun market movers from frontend-api-v3 (falls back to currently-live when primary is empty). Use when an agent finds coins with unusual short-term price/volume action. Inputs: limit, offset, includeNsfw. Returns coins[], count, upstream metadata.',
    suggestedPriceStx: 0.001,
  },
  'pumpfun/analyzer': {
    slug: 'pumpfun-analyzer',
    name: 'pump.fun Memecoin Analyzer',
    category: 'analytics',
    methods: ['GET', 'POST'],
    summary: 'Full memecoin due-diligence for any Solana mint',
    description:
      'Deep memecoin analysis for pump.fun or graduated tokens. Use when an agent must score risk/reward before trading. Input: mint (base58). Returns syraAlpha score/verdict, market stats, dossier risk, holders, distribution, onChainSecurity, kolShills — probabilistic, not financial advice.',
    suggestedPriceStx: 0.02,
  },
  'pumpfun/scout': {
    slug: 'pumpfun-scout',
    name: 'pump.fun Scout',
    category: 'analytics',
    methods: ['GET', 'POST'],
    summary: 'Live pump.fun alpha/beta/predicted/utility scout',
    description:
      'Live pump.fun intelligence with selector param segment=alpha|beta|predicted|utility. Optional period, limit, minPumpScore, llm. Returns scored tokens, analysis, and meta — deterministic by default.',
    suggestedPriceStx: 0.005,
  },
  rise: {
    slug: 'rise-scout',
    name: 'RISE Scout',
    category: 'analytics',
    methods: ['GET', 'POST'],
    summary: 'Live RISE market intel and agent targets',
    description:
      'Live RISE intelligence with view=intel|markets|targets. Optional mint, limit, tier=ready|watch. Returns UPONLY token snapshot, fund lens, ranked markets, and agent-ready mint targets.',
    suggestedPriceStx: 0.005,
  },
  coingecko: {
    slug: 'coingecko-scout',
    name: 'CoinGecko Scout',
    category: 'analytics',
    methods: ['GET', 'POST'],
    summary: 'Live CoinGecko top gainers brief',
    description:
      'Live CoinGecko scout with view=brief|gainers|predictions. Optional topN, minMarketCap, includeNews, llm. Returns top gainers, digests, predictions, and narrative meta — deterministic by default.',
    suggestedPriceStx: 0.001,
  },
  'dexscreener/pairs': {
    slug: 'dexscreener-pairs',
    name: 'DexScreener Pairs',
    category: 'analytics',
    methods: ['GET', 'POST'],
    summary: 'DEX pairs by chain/token or search query',
    description:
      'Onchain DEX pair data from DexScreener across 80+ chains. Use when an agent needs live price, liquidity, volume, and txn counts for a token before trading or scouting. Inputs: chainId + tokenAddress OR q (search). Returns normalized pairs[] with priceUsd, liquidityUsd, volume24h, txns24h, fdv, pairAddress, dexId.',
    suggestedPriceStx: 0.001,
  },
  'geckoterminal/pools': {
    slug: 'geckoterminal-pools',
    name: 'GeckoTerminal Pools',
    category: 'defi',
    methods: ['GET', 'POST'],
    summary: 'Trending or new DEX pools on a network',
    description:
      'Trending or newly listed DEX pools from GeckoTerminal across 100+ networks. Use when an agent scouts fresh liquidity or momentum pools on Solana, Base, Ethereum, etc. Inputs: network (default solana), kind=trending|new, limit (max 50). Returns pools[] with priceUsd, priceChange24h, volume24h, reserveUsd, poolAddress, dex.',
    suggestedPriceStx: 0.001,
  },
  'defillama/tvl': {
    slug: 'defillama-tvl',
    name: 'DefiLlama TVL',
    category: 'defi',
    methods: ['GET', 'POST'],
    summary: 'Protocol or chain TVL from DefiLlama',
    description:
      'Total value locked for a DeFi protocol or blockchain from DefiLlama. Use when an agent assesses protocol scale, chain dominance, or macro DeFi health. Inputs: protocol (slug e.g. aave) OR chain (e.g. Solana, Ethereum). Returns currentTvlUsd, tvlHistory summary, name, category, chains[] when protocol.',
    suggestedPriceStx: 0.001,
  },
  'rugcheck/report': {
    slug: 'rugcheck-report',
    name: 'RugCheck Token Report',
    category: 'signals',
    methods: ['GET', 'POST'],
    summary: 'Solana token risk report from RugCheck',
    description:
      'Solana token risk report from RugCheck: mint/freeze authority, holder concentration, LP status, and risk score. Use when an agent screens memecoins or new mints before trading. Input: mint (required, Solana base58). Returns riskScore, risks[], topHolders[], mintAuthority, freezeAuthority, lpLocked, marketCap, computedAt.',
    suggestedPriceStx: 0.005,
  },
  'pyth/price': {
    slug: 'pyth-price',
    name: 'Pyth Oracle Prices',
    category: 'analytics',
    methods: ['GET', 'POST'],
    summary: 'Real-time Pyth oracle prices via Hermes',
    description:
      'Latest Pyth oracle prices from Hermes for major crypto feeds. Use when an agent needs authoritative onchain-derived spot prices (BTC, ETH, SOL, etc.) with confidence intervals. Input: symbols (comma-separated, e.g. BTC/USD,SOL/USD). Returns prices[] with symbol, priceUsd, confidenceUsd, publishTime, feedId.',
    suggestedPriceStx: 0.001,
  },
  'insights/network-health': {
    slug: 'insights-network-health',
    name: 'Solana Network Health',
    category: 'analytics',
    methods: ['GET'],
    summary: 'Solana slot, epoch, TPS, and priority fee snapshot',
    description:
      'Real-time Solana mainnet health metrics: current slot, epoch progress, average TPS from recent performance samples, and median priority fee. Use when an agent needs chain liveness and congestion signals before submitting transactions.',
    suggestedPriceStx: 0.01,
  },
  'insights/gas-oracle': {
    slug: 'insights-gas-oracle',
    name: 'Solana Gas Oracle',
    category: 'analytics',
    methods: ['GET'],
    summary: 'Solana priority fee percentiles for transaction inclusion',
    description:
      'Priority fee oracle derived from recent Solana mainnet samples. Returns min, p25, p50, p75, p95, and max priority fees in lamports. Use when an agent needs data-driven fee estimation for reliable transaction landing.',
    suggestedPriceStx: 0.01,
  },
  'insights/market-pulse': {
    slug: 'insights-market-pulse',
    name: 'Cross-Asset Market Pulse',
    category: 'analytics',
    methods: ['GET'],
    summary: 'SOL, BTC, ETH spot prices via Pyth oracle',
    description:
      'Cross-asset market pulse with latest Pyth oracle prices for SOL/USD, BTC/USD, and ETH/USD including confidence intervals and publish times. Use when an agent needs a quick multi-asset price snapshot from authoritative feeds.',
    suggestedPriceStx: 0.02,
  },
  'insights/token-metrics': {
    slug: 'insights-token-metrics',
    name: 'Token Liquidity Metrics',
    category: 'analytics',
    methods: ['GET'],
    summary: 'SOL DEX pair metrics via DexScreener',
    description:
      'Token liquidity and trading metrics for SOL across major DEX pairs from DexScreener. Returns top pairs with price, 24h volume, price change, and liquidity. Use when an agent screens on-chain liquidity before execution.',
    suggestedPriceStx: 0.03,
  },
  'insights/defi-tvl': {
    slug: 'insights-defi-tvl',
    name: 'Solana DeFi TVL',
    category: 'defi',
    methods: ['GET'],
    summary: 'Solana chain TVL overview from DefiLlama',
    description:
      'Solana DeFi total value locked overview from DefiLlama. Use when an agent assesses macro DeFi health and capital allocation on the Solana ecosystem.',
    suggestedPriceStx: 0.05,
  },
  'insights/volatility-index': {
    slug: 'insights-volatility-index',
    name: 'Volatility Index',
    category: 'analytics',
    methods: ['GET'],
    summary: 'Computed volatility index from major Pyth price feeds',
    description:
      'Volatility index computed from Pyth price feed confidence intervals across SOL, BTC, and ETH. Returns index score and per-asset uncertainty metrics. Use when an agent gauges market uncertainty for risk-adjusted decisions.',
    suggestedPriceStx: 0.1,
  },
  'insights/ecosystem-brief': {
    slug: 'insights-ecosystem-brief',
    name: 'Solana Ecosystem Brief',
    category: 'analytics',
    methods: ['GET'],
    summary: 'Premium combined network, market, and DeFi snapshot via PayAI',
    description:
      'Premium PayAI-facilitated Labs endpoint combining Solana network health, cross-asset market pulse (SOL/BTC/ETH), and DeFi TVL in one response. Strictly limited to 5–10 calls per UTC day. Use when an agent needs a concise macro Solana briefing with PayAI settlement.',
    suggestedPriceStx: 0.05,
  },
  assets: {
    slug: 'assets-board',
    name: 'Assets Board',
    category: 'analytics',
    methods: ['GET', 'POST'],
    summary: 'Tokens.xyz curated assets board with filter and sort',
    description:
      'Paginated curated assets board (crypto + tokenized stocks) from Tokens.xyz — same data as the Syra Assets page. Use when an agent needs a ranked market universe, not a single asset. Inputs: list (all|majors|stocks|…), assetClass, q, sort, order, limit, offset. Returns items[] with price, marketCap, volume, assetClass.',
    suggestedPriceStx: 0.001,
  },
  'assets/detail': {
    slug: 'assets-detail',
    name: 'Asset Detail',
    category: 'analytics',
    methods: ['GET', 'POST'],
    summary: 'Tokens.xyz mint dossier for one asset',
    description:
      'Full asset dossier: profile, risk, markets, and 1H OHLCV for a canonical asset. Use when an agent researches BTC, SOL, a stock token, or any Tokens.xyz asset by ref/mint/assetId. Inputs: ref, mint, assetId, or q. Returns asset, includes (profile/risk/markets), ohlcv candles, mintRisk.',
    suggestedPriceStx: 0.005,
  },
  bitcoin: {
    slug: 'bitcoin-hub',
    name: 'Bitcoin Intelligence Hub',
    category: 'analytics',
    methods: ['GET', 'POST'],
    summary: 'Full Bitcoin dashboard + taker-flow bubblemap',
    description:
      'Complete Bitcoin intelligence bundle from the Syra BTC page. Use when an agent needs macro BTC context: price, derivatives, technicals, sentiment, news, signal, and taker buy/sell bubblemap in one call. Inputs: exchange (binance|coinbase), interval, limit for bubblemap. Returns dashboard (overview + sections) and bubblemap points[].',
    suggestedPriceStx: 0.005,
  },
  'chat/completions': {
    slug: 'chat-completions',
    name: 'Chat Completions (OpenRouter)',
    category: 'ai',
    methods: ['POST'],
    summary: 'OpenAI-compatible agent chat via top OpenRouter models',
    description:
      'OpenAI-compatible POST /chat/completions backed by 15 curated agentic OpenRouter text models. Use when an agent needs LLM reasoning, tool calling (tools/tool_choice), or structured output (response_format) with x402 pay-per-call. Inputs: messages (required), optional model, max_tokens, temperature, tools, response_format, seed. Price is dynamic per request from live token rates (prompt + max completion budget) with margin — GET /chat/completions/models for allowlist and rates. Returns standard OpenAI chat.completion JSON with usage.',
    suggestedPriceStx: 0.004,
  },
  'images/generations': {
    slug: 'images-generations',
    name: 'Image Generations (OpenRouter)',
    category: 'ai',
    methods: ['POST'],
    summary: 'Text-to-image via OpenRouter Unified Image API',
    description:
      'Paid POST /images/generations using OpenRouter Unified Image API (POST /api/v1/images). Use when an agent needs to generate marketing assets, thumbnails, or reference images from a text prompt with x402 pay-per-call. Inputs: prompt (required), optional model, n (1–10), resolution, aspect_ratio, quality, output_format, seed, input_references. Price is dynamic from live prompt + per-image rates with margin — GET /images/generations/models for allowlist and rates. Returns generated images array and usage with cost.',
    suggestedPriceStx: 0.02,
  },
  'videos/generations': {
    slug: 'videos-generations',
    name: 'Video Generations (OpenRouter)',
    category: 'ai',
    methods: ['POST'],
    summary: 'Async text-to-video submit via OpenRouter Video API',
    description:
      'Paid POST /videos/generations submits an async OpenRouter video job (POST /api/v1/videos). Use when an agent needs short-form video clips from a text prompt with x402 pay-per-call. Inputs: prompt (required), optional model, duration (1–60s), resolution, aspect_ratio, generate_audio, frame_images, input_references. Price is charged upfront at submit from model duration + resolution rates with margin — GET /videos/generations/models for allowlist. Returns generation_id, polling_url, and statusUrl; poll free GET /videos/generations/:id until completed for video_url. No auto-refund if upstream job fails after payment.',
    suggestedPriceStx: 0.1,
  },
  '8004/stats': {
    slug: '8004-stats',
    name: '8004 Global Stats',
    category: 'agents',
    methods: ['GET', 'POST'],
    summary: 'Solana 8004 agent registry aggregate statistics',
    description:
      'Global stats for the Solana 8004 trustless agent registry: total agents, feedback counts, trust tiers. Use when an agent surveys the Syra/8004 ecosystem size before marketplace or discovery tasks. No required inputs. Returns registry-wide counters and tier breakdown.',
    suggestedPriceStx: 0.012,
  },
  '8004/leaderboard': {
    slug: '8004-leaderboard',
    name: '8004 Leaderboard',
    category: 'agents',
    methods: ['GET', 'POST'],
    summary: 'Top 8004 agents ranked by trust tier',
    description:
      'Leaderboard of registered 8004 agents sorted by trust/reputation. Use when an agent picks high-trust counterparts or benchmarks agent quality. Inputs: optional minTier, limit, offset. Returns ranked agent rows with scores and metadata.',
    suggestedPriceStx: 0.012,
  },
  '8004/agents/search': {
    slug: '8004-agents-search',
    name: '8004 Agent Search',
    category: 'agents',
    methods: ['GET', 'POST'],
    summary: 'Search Solana 8004 agents by owner or collection',
    description:
      'Search the 8004 agent index by owner wallet, creator, or collection pointer. Use when an agent discovers agents to hire, verify, or compose with. Inputs: owner, creator, collectionPointer, limit, offset. Returns matching agent records.',
    suggestedPriceStx: 0.012,
  },
  'topledger/wallet/analyze': {
    slug: 'topledger-wallet-analyze',
    name: 'TopLedger Wallet Analyze',
    category: 'analytics',
    methods: ['GET'],
    summary: 'Full Solana DeFi portfolio analysis (20+ protocols)',
    description:
      'Analyze a Solana wallet net worth including lending, perps, LP, staking, yield, rewards, and governance via TopLedger MPP. Input: wallet (base58). Returns total_net_worth_usd and per-category breakdown.',
    suggestedPriceStx: 0.00048,
  },
  'topledger/wallet/lending': {
    slug: 'topledger-wallet-lending',
    name: 'TopLedger Lending Positions',
    category: 'analytics',
    methods: ['GET'],
    summary: 'Solana lending deposits and borrows across protocols',
    description:
      'Return lending deposits, borrows, and net value for a Solana wallet across Kamino, marginfi, Jupiter Lend, Loopscale, and more. Input: wallet (base58).',
    suggestedPriceStx: 0.00048,
  },
};

/** @param {string} segment */
function normalizeSegment(segment) {
  return String(segment || '')
    .trim()
    .replace(/^\/+/, '')
    .replace(/\/+$/, '');
}

/**
 * @param {string} segment
 * @returns {X402ResourceMeta | null}
 */
export function getResourceMeta(segment) {
  const key = normalizeSegment(segment);
  return X402_RESOURCE_CATALOG[key] ?? null;
}

/**
 * Bazaar / marketplace category for a discovery resource slug.
 * @param {string} segment
 * @returns {string}
 */
export function getResourceCategory(segment) {
  const meta = getResourceMeta(segment);
  return meta?.category ?? "crypto";
}

/**
 * @param {string} segment
 * @returns {string}
 */
export function getResourceDescription(segment) {
  const meta = getResourceMeta(segment);
  if (meta?.description) return meta.description;
  return humanizeResourcePathDescription(segment);
}

/**
 * Agent-readable description for routes outside the discovery catalog.
 * @param {string} segment
 * @returns {string}
 */
export function humanizeResourcePathDescription(segment) {
  const key = normalizeSegment(segment);
  if (!key) {
    return 'Syra x402 API resource. Pay via HTTP 402 (Solana, Base, BSC, or Algorand). Docs: https://docs.syraa.fun';
  }
  const label = key
    .split('/')
    .filter(Boolean)
    .map((part) => part.replace(/-/g, ' ').replace(/\b[a-z]/g, (c) => c.toUpperCase()))
    .join(' — ');
  return `${label}. Syra x402 paid API at /${key}. Pay via HTTP 402 on Solana, Base, BSC, or Algorand. Docs: https://docs.syraa.fun`;
}

/**
 * Infer canonical x402 resource path from route options or the incoming request.
 * @param {import('express').Request} req
 * @param {{ resource?: string }} [options]
 * @returns {string}
 */
export function inferResourcePathFromRequest(req, options = {}) {
  const explicit = String(options.resource ?? '').trim();
  if (explicit) {
    const normalized = explicit.replace(/\/+$/, '') || explicit;
    return normalized.startsWith('/') ? normalized : `/${normalized}`;
  }
  const raw = String(req?.originalUrl ?? req?.url ?? req?.path ?? '').split('?')[0];
  const path = (raw.replace(/\/+$/, '') || raw).trim();
  if (!path) return '/';
  return path.startsWith('/') ? path : `/${path}`;
}

/**
 * True when description is missing or is just the resource URL (B402 bazaar placeholder).
 * @param {unknown} description
 * @param {unknown} url
 */
export function isPlaceholderResourceDescription(description, url) {
  const d = String(description ?? '').trim();
  if (!d) return true;
  const u = String(url ?? '').trim();
  if (!u) return /^https?:\/\//i.test(d);
  if (d.toLowerCase() === u.toLowerCase()) return true;
  if (/^https?:\/\//i.test(d)) {
    const descKey = normalizeResourceUrlKey(d);
    const urlKey = normalizeResourceUrlKey(u);
    if (descKey && descKey === urlKey) return true;
  }
  return false;
}

/** @param {string} raw */
function normalizeResourceUrlKey(raw) {
  try {
    const parsed = new URL(String(raw));
    const path = parsed.pathname.replace(/\/+$/, '') || '/';
    return `${parsed.host}${path}`.toLowerCase();
  } catch {
    return String(raw).toLowerCase().trim();
  }
}

/**
 * Resolve catalog description from a full resource URL pathname.
 * @param {string} url
 * @returns {string | null}
 */
export function getResourceDescriptionFromUrl(url) {
  try {
    const path = normalizeSegment(new URL(String(url)).pathname);
    if (!path) return null;
    return getResourceDescription(path);
  } catch {
    return null;
  }
}

/**
 * Pick the best agent-facing description for x402 ResourceInfo / B402 bazaar.
 * @param {{ description?: string; resourcePath?: string; url?: string }} opts
 * @returns {string}
 */
export function resolveResourceDescription({ description, resourcePath, url } = {}) {
  const urlStr = String(url ?? '').trim();
  const explicit = String(description ?? '').trim();
  if (explicit && !isPlaceholderResourceDescription(explicit, urlStr)) {
    return explicit;
  }
  let segment = normalizeSegment(resourcePath);
  if (!segment && urlStr) {
    try {
      segment = normalizeSegment(new URL(urlStr).pathname);
    } catch {
      /* ignore invalid URL */
    }
  }
  if (segment) {
    const fromCatalog = getResourceDescription(segment);
    if (fromCatalog && !isPlaceholderResourceDescription(fromCatalog, urlStr)) {
      return fromCatalog;
    }
  }
  if (urlStr) {
    const fromUrl = getResourceDescriptionFromUrl(urlStr);
    if (fromUrl) return fromUrl;
  }
  if (segment) return humanizeResourcePathDescription(segment);
  if (explicit) return explicit;
  return 'Syra x402 paid API endpoint. Pay via HTTP 402. Docs: https://docs.syraa.fun';
}

/**
 * @param {string} segment
 * @returns {string}
 */
export function getResourceSummary(segment) {
  const meta = getResourceMeta(segment);
  return meta?.summary ?? meta?.name ?? normalizeSegment(segment);
}

/**
 * @param {string} segment
 * @returns {string}
 */
export function getResourceName(segment) {
  const meta = getResourceMeta(segment);
  return meta?.name ?? normalizeSegment(segment);
}

/**
 * Build ShadowFeed feed row from catalog.
 * @param {string} segment
 */
export function buildShadowfeedFeedFromCatalog(segment) {
  const path = `/${normalizeSegment(segment)}`;
  const meta = getResourceMeta(segment);
  if (!meta) {
    return {
      slug: normalizeSegment(segment).replace(/\//g, '-'),
      name: segment,
      category: 'data',
      path,
      method: 'GET',
      suggested_price_stx: 0.005,
    };
  }
  return {
    slug: meta.slug,
    name: meta.name,
    category: meta.category,
    path,
    method: meta.methods[0] ?? 'GET',
    suggested_price_stx: meta.suggestedPriceStx,
    description: meta.description,
  };
}

/** Assert catalog covers discovery list (for tests). */
export function listCatalogCoverageGaps() {
  return X402_DISCOVERY_RESOURCE_PATHS.filter((seg) => !X402_RESOURCE_CATALOG[seg]);
}

/**
 * Five-pillar classification for a discovery resource slug.
 * @param {string} slug
 * @returns {import('./pillars.js').PillarId}
 */
export function getResourcePillar(slug) {
  return resolvePillarForCatalogSlug(slug);
}
