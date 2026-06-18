/**
 * Single source of truth for Syra x402 discovery endpoint metadata.
 * Keys match segments in x402DiscoveryResourcePaths.js (no leading slash).
 *
 * description: agent-optimized copy for 402 bodies, OpenAPI, ShadowFeed, MPP.
 * summary: short title for OpenAPI summary fields.
 */
import { X402_DISCOVERY_RESOURCE_PATHS } from './x402DiscoveryResourcePaths.js';

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
    suggestedPriceStx: 0.05,
  },
  news: {
    slug: 'news',
    name: 'Crypto News',
    category: 'news',
    methods: ['GET', 'POST'],
    summary: 'Latest crypto news headlines and summaries',
    description:
      'Curated crypto news articles with titles, sources, and URLs. Use when an agent needs recent headlines for a token, sector, or the whole market before trading or posting. Input: optional ticker (BTC, ETH, SOL, or general). Returns news[] with title, url, date, source.',
    suggestedPriceStx: 0.01,
  },
  signal: {
    slug: 'signal',
    name: 'Trading Signal',
    category: 'signals',
    methods: ['GET', 'POST'],
    summary: 'AI trading signal from CEX OHLCV technical analysis',
    description:
      'Generates a directional trading signal with bias, confidence, entry context, and reasoning from OHLCV candles. Use when an agent needs a technical read on BTC, ETH, SOL, or other supported assets before sizing a trade. Inputs: token (e.g. solana, bitcoin), source (binance default; coingecko if CEX blocked), interval, limit. Returns signal object with recommendation and analysis — probabilistic, not execution.',
    suggestedPriceStx: 0.01,
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
    suggestedPriceStx: 0.01,
  },
  sentiment: {
    slug: 'sentiment',
    name: 'Market Sentiment',
    category: 'analytics',
    methods: ['GET', 'POST'],
    summary: '30-day crypto sentiment scores by ticker',
    description:
      'Daily sentiment breakdown (positive/negative/neutral/score) over ~30 days from news-derived analysis. Use when an agent gauges crowd mood on BTC, ETH, or a ticker before narrative trades. Input: optional ticker. Returns sentimentAnalysis[] with per-day scores.',
    suggestedPriceStx: 0.01,
  },
  event: {
    slug: 'event',
    name: 'Crypto Events',
    category: 'news',
    methods: ['GET', 'POST'],
    summary: 'Upcoming and recent crypto events calendar',
    description:
      'Lists conferences, launches, listings, and macro events affecting crypto. Use when an agent schedules research around catalysts or filters noise by ticker. Input: optional ticker. Returns event[] with titles, dates, and metadata.',
    suggestedPriceStx: 0.01,
  },
  'trending-headline': {
    slug: 'trending-headline',
    name: 'Trending Headlines',
    category: 'news',
    methods: ['GET', 'POST'],
    summary: 'What is trending in crypto news right now',
    description:
      'Hot headlines and viral crypto stories currently moving the market. Use when an agent needs the top narrative of the day rather than a full news archive. Input: optional ticker filter. Returns trendingHeadline[].',
    suggestedPriceStx: 0.01,
  },
  'sundown-digest': {
    slug: 'sundown-digest',
    name: 'Sundown Digest',
    category: 'news',
    methods: ['GET', 'POST'],
    summary: 'End-of-day crypto market recap',
    description:
      'Daily wrap-up of key market moves, headlines, and themes. Use when an agent summarizes the session for reports or next-day planning. No required inputs. Returns sundownDigest[] items.',
    suggestedPriceStx: 0.01,
  },
  health: {
    slug: 'health',
    name: 'API Health',
    category: 'health',
    methods: ['GET', 'POST'],
    summary: 'Paid liveness probe for Syra API',
    description:
      'Minimal paid health check confirming Syra API is up and x402 settlement works. Use when an agent or monitor verifies connectivity before batch calls. No inputs. Returns ok, status, service, message, timestamp.',
    suggestedPriceStx: 0.003,
  },
  'mpp/health': {
    slug: 'mpp-health',
    name: 'MPP Health Check',
    category: 'health',
    methods: ['GET', 'POST'],
    summary: 'Machine Payments Protocol test lane (x402 v2)',
    description:
      'MPP-compatible health endpoint with same x402 v2 flow as /health. Use when testing Tempo/Stripe-style machine payment clients against Syra. Returns ok, protocol mpp-test, paymentCompatibility x402-v2, plus /health sibling reference.',
    suggestedPriceStx: 0.003,
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
    suggestedPriceStx: 0.03,
  },
  'pumpfun/trending': {
    slug: 'pumpfun-trending',
    name: 'pump.fun Trending',
    category: 'defi',
    methods: ['GET', 'POST'],
    summary: 'Trending pump.fun coins list',
    description:
      'Returns trending pump.fun coins from frontend-api-v3 (falls back to top-runners when primary feed is empty). Use when an agent scans hot memecoin launches or social momentum on pump.fun. Inputs: limit (default 20, max 50), offset, includeNsfw. Returns normalized coins[], count, upstream metadata.',
    suggestedPriceStx: 0.05,
  },
  'pumpfun/movers': {
    slug: 'pumpfun-movers',
    name: 'pump.fun Movers',
    category: 'defi',
    methods: ['GET', 'POST'],
    summary: 'pump.fun market movers list',
    description:
      'Returns pump.fun market movers from frontend-api-v3 (falls back to currently-live when primary is empty). Use when an agent finds coins with unusual short-term price/volume action. Inputs: limit, offset, includeNsfw. Returns coins[], count, upstream metadata.',
    suggestedPriceStx: 0.05,
  },
  'pumpfun/analyzer': {
    slug: 'pumpfun-analyzer',
    name: 'pump.fun Memecoin Analyzer',
    category: 'analytics',
    methods: ['GET', 'POST'],
    summary: 'Full memecoin due-diligence for any Solana mint',
    description:
      'Deep memecoin analysis matching the Syra Pumpfun Alpha page. Use when an agent must score risk/reward on a pump.fun or graduated token before trading. Input: mint (base58). Returns syraAlpha score/verdict, market stats, dossier risk, holders, distribution, onChainSecurity, kolShills — probabilistic, not financial advice.',
    suggestedPriceStx: 0.1,
  },
  assets: {
    slug: 'assets-board',
    name: 'Assets Board',
    category: 'analytics',
    methods: ['GET', 'POST'],
    summary: 'Tokens.xyz curated assets board with filter and sort',
    description:
      'Paginated curated assets board (crypto + tokenized stocks) from Tokens.xyz — same data as the Syra Assets page. Use when an agent needs a ranked market universe, not a single asset. Inputs: list (all|majors|stocks|…), assetClass, q, sort, order, limit, offset. Returns items[] with price, marketCap, volume, assetClass.',
    suggestedPriceStx: 0.05,
  },
  'assets/detail': {
    slug: 'assets-detail',
    name: 'Asset Detail',
    category: 'analytics',
    methods: ['GET', 'POST'],
    summary: 'Tokens.xyz mint dossier for one asset',
    description:
      'Full asset dossier: profile, risk, markets, and 1H OHLCV for a canonical asset. Use when an agent researches BTC, SOL, a stock token, or any Tokens.xyz asset by ref/mint/assetId. Inputs: ref, mint, assetId, or q. Returns asset, includes (profile/risk/markets), ohlcv candles, mintRisk.',
    suggestedPriceStx: 0.05,
  },
  bitcoin: {
    slug: 'bitcoin-hub',
    name: 'Bitcoin Intelligence Hub',
    category: 'analytics',
    methods: ['GET', 'POST'],
    summary: 'Full Bitcoin dashboard + taker-flow bubblemap',
    description:
      'Complete Bitcoin intelligence bundle from the Syra BTC page. Use when an agent needs macro BTC context: price, derivatives, technicals, sentiment, news, signal, and taker buy/sell bubblemap in one call. Inputs: exchange (binance|coinbase), interval, limit for bubblemap. Returns dashboard (overview + sections) and bubblemap points[].',
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
    suggestedPriceStx: 0.01,
  },
  '8004/leaderboard': {
    slug: '8004-leaderboard',
    name: '8004 Leaderboard',
    category: 'agents',
    methods: ['GET', 'POST'],
    summary: 'Top 8004 agents ranked by trust tier',
    description:
      'Leaderboard of registered 8004 agents sorted by trust/reputation. Use when an agent picks high-trust counterparts or benchmarks agent quality. Inputs: optional minTier, limit, offset. Returns ranked agent rows with scores and metadata.',
    suggestedPriceStx: 0.01,
  },
  '8004/agents/search': {
    slug: '8004-agents-search',
    name: '8004 Agent Search',
    category: 'agents',
    methods: ['GET', 'POST'],
    summary: 'Search Solana 8004 agents by owner or collection',
    description:
      'Search the 8004 agent index by owner wallet, creator, or collection pointer. Use when an agent discovers agents to hire, verify, or compose with. Inputs: owner, creator, collectionPointer, limit, offset. Returns matching agent records.',
    suggestedPriceStx: 0.01,
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
 * @param {string} segment
 * @returns {string}
 */
export function getResourceDescription(segment) {
  const meta = getResourceMeta(segment);
  if (meta?.description) return meta.description;
  const key = normalizeSegment(segment);
  return `Syra x402 resource /${key}. Pay via HTTP 402 (Solana or Base USDC). Docs: https://docs.syraa.fun`;
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
