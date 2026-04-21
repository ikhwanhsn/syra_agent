/**
 * Birdeye Data x402 tools — one Syra agent tool per Birdeye route (pay-per-request upstream).
 * @see https://docs.birdeye.so/reference/x402
 */
import { X402_API_PRICE_BIRDEYE_USD, X402_DISPLAY_PRICE_BIRDEYE_USD } from './x402Pricing.js';

/**
 * Gate kinds for param validation (mint aliases to address where gate is address).
 * @typedef {'none' | 'address' | 'base_quote' | 'body'} BirdeyeGate
 */

/**
 * @param {string} slug - short id suffix (becomes birdeye-{slug})
 * @param {string} birdeyePath
 * @param {string} method
 * @param {string} name
 * @param {string} description
 * @param {BirdeyeGate} [gate]
 */
function row(slug, birdeyePath, method, name, description, gate = 'none') {
  return { slug, birdeyePath, method, name, description, gate };
}

/** @type {ReturnType<typeof row>[]} */
const SPECS = [
  row('defi-price', '/x402/defi/price', 'GET', 'Birdeye: token price', 'Current token price; params address or mint, optional chain.', 'address'),
  row(
    'defi-history-price',
    '/x402/defi/history_price',
    'GET',
    'Birdeye: historical price',
    'Historical price series; address/mint + Birdeye time/type params.',
    'address'
  ),
  row(
    'defi-historical-price-unix',
    '/x402/defi/historical_price_unix',
    'GET',
    'Birdeye: price at unix time',
    'Token price at a unix timestamp; address + unix_time etc.',
    'address'
  ),
  row('defi-txs-token', '/x402/defi/txs/token', 'GET', 'Birdeye: token transactions', 'Trades/transactions for a token; address + offset/limit.', 'address'),
  row('defi-txs-pair', '/x402/defi/txs/pair', 'GET', 'Birdeye: pair transactions', 'Transactions for a liquidity pair; address = pair.', 'address'),
  row(
    'defi-txs-token-seek-by-time',
    '/x402/defi/txs/token/seek_by_time',
    'GET',
    'Birdeye: token txs seek by time',
    'Seek token transactions by time cursor; address + time params.',
    'address'
  ),
  row(
    'defi-txs-pair-seek-by-time',
    '/x402/defi/txs/pair/seek_by_time',
    'GET',
    'Birdeye: pair txs seek by time',
    'Seek pair transactions by time; address = pair.',
    'address'
  ),
  row('defi-ohlcv', '/x402/defi/ohlcv', 'GET', 'Birdeye: OHLCV', 'Candlesticks for a token; address + type, time_from, time_to.', 'address'),
  row('defi-ohlcv-pair', '/x402/defi/ohlcv/pair', 'GET', 'Birdeye: OHLCV pair', 'OHLCV for a pair; address = pair.', 'address'),
  row(
    'defi-ohlcv-base-quote',
    '/x402/defi/ohlcv/base_quote',
    'GET',
    'Birdeye: OHLCV base/quote',
    'OHLCV by base and quote mints; params base_address, quote_address (or camelCase).',
    'base_quote'
  ),
  row('defi-tokenlist', '/x402/defi/tokenlist', 'GET', 'Birdeye: token list', 'Listed tokens; optional list, chain, sort, etc.', 'none'),
  row('defi-token-trending', '/x402/defi/token_trending', 'GET', 'Birdeye: trending tokens', 'Trending tokens snapshot; optional chain, limit.', 'none'),
  row(
    'defi-token-creation-info',
    '/x402/defi/token_creation_info',
    'GET',
    'Birdeye: token creation info',
    'Launch/creation metadata for a token mint.',
    'address'
  ),
  row('defi-token-security', '/x402/defi/token_security', 'GET', 'Birdeye: token security', 'Safety / risk signals for a token.', 'address'),
  row('defi-token-overview', '/x402/defi/token_overview', 'GET', 'Birdeye: token overview', 'Market overview for one token (price, liquidity, volume).', 'address'),
  row(
    'defi-price-volume-single',
    '/x402/defi/price_volume/single',
    'GET',
    'Birdeye: price & volume single',
    'Single-token price and volume snapshot.',
    'address'
  ),
  row('defi-v2-new-listing', '/x402/defi/v2/tokens/new_listing', 'GET', 'Birdeye: new listings', 'Newly listed tokens; optional chain, limit.', 'none'),
  row(
    'defi-v2-top-traders',
    '/x402/defi/v2/tokens/top_traders',
    'GET',
    'Birdeye: top traders',
    'Top traders for a token; address/mint.',
    'address'
  ),
  row('defi-v2-markets', '/x402/defi/v2/markets', 'GET', 'Birdeye: markets for token', 'All markets for a token; address.', 'address'),
  row(
    'defi-v3-token-metadata-single',
    '/x402/defi/v3/token/meta-data/single',
    'GET',
    'Birdeye: token metadata',
    'Token metadata (single); address.',
    'address'
  ),
  row(
    'defi-v3-pair-overview-single',
    '/x402/defi/v3/pair/overview/single',
    'GET',
    'Birdeye: pair overview',
    'Single pair overview; address = pair address.',
    'address'
  ),
  row(
    'defi-v3-token-market-data',
    '/x402/defi/v3/token/market-data',
    'GET',
    'Birdeye: token market data',
    'Aggregated market data for a token.',
    'address'
  ),
  row(
    'defi-v3-token-trade-data-single',
    '/x402/defi/v3/token/trade-data/single',
    'GET',
    'Birdeye: token trade data',
    'Trade stats for a token.',
    'address'
  ),
  row('defi-v3-token-holder', '/x402/defi/v3/token/holder', 'GET', 'Birdeye: token holders', 'Holder list / snapshot; address.', 'address'),
  row('defi-v3-search', '/x402/defi/v3/search', 'GET', 'Birdeye: search', 'Search tokens and markets; pass Birdeye search query params.', 'none'),
  row(
    'defi-v3-token-mint-burn-txs',
    '/x402/defi/v3/token/mint-burn-txs',
    'GET',
    'Birdeye: mint/burn txs',
    'Mint and burn transactions for a token.',
    'address'
  ),
  row(
    'defi-v3-holder-stats-single',
    '/x402/defi/v3/holder-stats/single',
    'GET',
    'Birdeye: holder stats',
    'Holder statistics for a token.',
    'address'
  ),
  row('defi-v3-token-list', '/x402/defi/v3/token/list', 'GET', 'Birdeye: token list v3', 'Token list (v3 filters).', 'none'),
  row(
    'defi-v3-all-time-trades-single',
    '/x402/defi/v3/all-time/trades/single',
    'GET',
    'Birdeye: all-time trades',
    'All-time trade summary for a token.',
    'address'
  ),
  row('defi-v3-txs-recent', '/x402/defi/v3/txs/recent', 'GET', 'Birdeye: recent trades v3', 'Recent trades (v3).', 'none'),
  row('defi-v3-txs', '/x402/defi/v3/txs', 'GET', 'Birdeye: trades v3', 'Trades listing (v3); optional filters.', 'none'),
  row('defi-v3-token-txs', '/x402/defi/v3/token/txs', 'GET', 'Birdeye: token trades v3', 'Trades for one token.', 'address'),
  row('defi-v3-txs-latest-block', '/x402/defi/v3/txs/latest-block', 'GET', 'Birdeye: latest block', 'Latest indexed block for v3 txs.', 'none'),
  row(
    'defi-v3-token-exit-liquidity',
    '/x402/defi/v3/token/exit-liquidity',
    'GET',
    'Birdeye: exit liquidity',
    'Exit liquidity estimate for a token.',
    'address'
  ),
  row('defi-v3-token-meme-list', '/x402/defi/v3/token/meme/list', 'GET', 'Birdeye: meme token list', 'Meme token list; optional chain, sort.', 'none'),
  row(
    'defi-v3-token-meme-detail-single',
    '/x402/defi/v3/token/meme/detail/single',
    'GET',
    'Birdeye: meme token detail',
    'Single meme token detail.',
    'address'
  ),
  row(
    'defi-v3-token-txs-by-volume',
    '/x402/defi/v3/token/txs-by-volume',
    'GET',
    'Birdeye: token txs by volume',
    'Trades filtered by volume bucket.',
    'address'
  ),
  row('defi-v3-ohlcv', '/x402/defi/v3/ohlcv', 'GET', 'Birdeye: OHLCV v3', 'OHLCV v3 for a token.', 'address'),
  row('defi-v3-ohlcv-pair', '/x402/defi/v3/ohlcv/pair', 'GET', 'Birdeye: OHLCV pair v3', 'OHLCV for a pair (v3).', 'address'),
  row('defi-v3-price-stats-single', '/x402/defi/v3/price/stats/single', 'GET', 'Birdeye: price stats', 'Price statistics for a token.', 'address'),
  row('trader-gainers-losers', '/x402/trader/gainers-losers', 'GET', 'Birdeye: gainers & losers', 'Top gainers and losers; optional chain, sort, limit.', 'none'),
  row(
    'trader-txs-seek-by-time',
    '/x402/trader/txs/seek_by_time',
    'GET',
    'Birdeye: trader txs seek',
    'Trader transactions by time; pass wallet/trader params per Birdeye docs.',
    'address'
  ),
  row(
    'token-v1-holder-batch',
    '/x402/token/v1/holder/batch',
    'POST',
    'Birdeye: holder batch (POST)',
    'Batch holder check for wallets. Params: body (JSON string per Birdeye API).',
    'body'
  ),
  row(
    'token-v1-transfer',
    '/x402/token/v1/transfer',
    'POST',
    'Birdeye: token transfers (POST)',
    'Token transfer list. Params: body (JSON string).',
    'body'
  ),
  row(
    'token-v1-transfer-total',
    '/x402/token/v1/transfer/total',
    'POST',
    'Birdeye: transfer totals (POST)',
    'Token transfer totals. Params: body (JSON string).',
    'body'
  ),
  row('holder-v1-distribution', '/x402/holder/v1/distribution', 'GET', 'Birdeye: holder distribution', 'Holder distribution for a token.', 'address'),
  row(
    'smart-money-v1-token-list',
    '/x402/smart-money/v1/token/list',
    'GET',
    'Birdeye: smart money token list',
    'Smart money token list (Solana).',
    'none'
  ),
];

/** Birdeye entries merged into AGENT_TOOLS (see agentTools.js typedef for full shape). */
export const BIRDEYE_AGENT_TOOLS = SPECS.map((s) => ({
  id: `birdeye-${s.slug}`,
  path: `/birdeye/${s.slug}`,
  birdeyePath: s.birdeyePath,
  method: s.method,
  priceUsd: X402_API_PRICE_BIRDEYE_USD,
  displayPriceUsd: X402_DISPLAY_PRICE_BIRDEYE_USD,
  name: s.name,
  description: s.description,
}));

/** @type {Record<string, BirdeyeGate>} */
export const BIRDEYE_TOOL_GATES = Object.fromEntries(SPECS.map((s) => [`birdeye-${s.slug}`, s.gate]));

/**
 * @param {string} toolId
 * @param {Record<string, unknown>} p
 * @returns {string[] | null} - missing human labels
 */
export function getBirdeyeGateMissing(toolId, p) {
  const gate = BIRDEYE_TOOL_GATES[toolId];
  if (!gate || gate === 'none') return null;

  const has = (k) => p[k] != null && String(p[k]).trim() !== '';

  if (gate === 'address') {
    if (!has('address') && !has('mint')) return ['address or mint'];
    return null;
  }
  if (gate === 'base_quote') {
    const b = has('base_address') || has('baseAddress');
    const q = has('quote_address') || has('quoteAddress');
    if (!b || !q) return ['base_address and quote_address (Solana mints)'];
    return null;
  }
  if (gate === 'body') {
    if (!has('body') && !has('body_json') && !has('bodyJson')) return ['body (JSON string for POST body)'];
    return null;
  }
  return null;
}

/**
 * @param {string} toolId
 * @returns {string | undefined}
 */
export function getBirdeyeParamsHintForLlm(toolId) {
  const gate = BIRDEYE_TOOL_GATES[toolId];
  if (!gate || gate === 'none') {
    return 'Optional: chain, offset, limit, time_from, time_to, and other Birdeye query keys as flat strings (see docs.birdeye.so x402).';
  }
  if (gate === 'address') {
    return 'Params: address or mint (Solana token mint, required); optional chain, type, time_from, time_to, offset, limit — use Birdeye query param names.';
  }
  if (gate === 'base_quote') {
    return 'Params: base_address, quote_address (required Solana mints); optional chain, type, time_from, time_to.';
  }
  if (gate === 'body') {
    return 'Params: body (required) — JSON string matching Birdeye POST body for this route; optional extra query keys as flat params.';
  }
  return undefined;
}
