/**
 * Tokens.xyz Assets API v1 — agent tools (server-side TOKENS_API_KEY).
 * @see https://docs.tokens.xyz/v1/quickstart
 */
import { X402_API_PRICE_USD, X402_DISPLAY_PRICE_USD } from './x402Pricing.js';

/**
 * @typedef {'none' | 'q' | 'ref_or_mint' | 'asset_id' | 'mint' | 'mints' | 'mints_optional'} TokensGate
 */

/**
 * @param {string} slug
 * @param {string} tokensPath - path under /v1 (e.g. /assets/search)
 * @param {'GET' | 'POST'} method
 * @param {string} name
 * @param {string} description
 * @param {TokensGate} [gate]
 */
function row(slug, tokensPath, method, name, description, gate = 'none') {
  return { slug, tokensPath, method, name, description, gate };
}

/** @type {ReturnType<typeof row>[]} */
const SPECS = [
  row(
    'assets-search',
    '/assets/search',
    'GET',
    'Tokens: search assets',
    'Search canonical assets by name/ticker; params q (required), optional limit (max 50), category.',
    'q'
  ),
  row(
    'assets-resolve',
    '/assets/resolve',
    'GET',
    'Tokens: resolve asset',
    'Resolve user input to canonical assetId. Provide ref (btc, solana, apple) OR mint (Solana address).',
    'ref_or_mint'
  ),
  row(
    'asset-detail',
    '/assets/{assetId}',
    'GET',
    'Tokens: asset detail',
    'Canonical asset profile. assetId (btc, solana, solana-<mint>). Optional include (profile,risk,ohlcv,markets), mint.',
    'asset_id'
  ),
  row(
    'asset-variants',
    '/assets/{assetId}/variants',
    'GET',
    'Tokens: asset variants',
    'Solana mint variants for an asset. assetId required. Optional kind, liquidityTier (tier1|tier2|tier3).',
    'asset_id'
  ),
  row(
    'asset-markets',
    '/assets/{assetId}/markets',
    'GET',
    'Tokens: asset markets',
    'DEX/pool venues for an asset. assetId required. Optional mint, offset, limit.',
    'asset_id'
  ),
  row(
    'asset-ohlcv',
    '/assets/{assetId}/ohlcv',
    'GET',
    'Tokens: OHLCV candles',
    'OHLCV for a variant. assetId required. Optional mint, interval (1m|5m|15m|1H|4H|1D|1W), from, to (unix sec).',
    'asset_id'
  ),
  row(
    'asset-price-chart',
    '/assets/{assetId}/price-chart',
    'GET',
    'Tokens: price chart',
    'Canonical-first price chart (falls back to mint candles). Same params as OHLCV.',
    'asset_id'
  ),
  row(
    'asset-risk-summary',
    '/assets/{assetId}/risk-summary',
    'GET',
    'Tokens: asset risk summary',
    'Risk summary for canonical asset. assetId required. Optional mint for a specific variant.',
    'asset_id'
  ),
  row(
    'asset-risk-details',
    '/assets/{assetId}/risk-details',
    'GET',
    'Tokens: asset risk details',
    'Detailed risk breakdown. assetId required. Optional mint.',
    'asset_id'
  ),
  row(
    'risk-summary-mint',
    '/assets/risk-summary',
    'GET',
    'Tokens: mint risk summary',
    'Quick risk score for a Solana mint. Param mint (required).',
    'mint'
  ),
  row(
    'assets-curated',
    '/assets/curated',
    'GET',
    'Tokens: curated lists',
    'Curated asset lists. Optional list (all|majors|lsts|currencies|rwas|etfs|metals|stocks), groupBy (asset|mint).',
    'none'
  ),
  row(
    'market-snapshots',
    '/assets/market-snapshots',
    'POST',
    'Tokens: batch market snapshots',
    'Batch market data for up to 250 mints. Param mints (comma-separated) or body JSON { mints: [...] }.',
    'mints'
  ),
  row(
    'variant-markets',
    '/assets/variant-markets',
    'GET',
    'Tokens: variant markets batch',
    'Market snapshots for up to 50 mints. Param mints or addresses (comma-separated).',
    'mints'
  ),
];

/** @type {Record<string, { tokensPath: string; method: string }>} */
export const TOKENS_TOOL_ROUTES = Object.fromEntries(
  SPECS.map((s) => [`tokens-${s.slug}`, { tokensPath: s.tokensPath, method: s.method }])
);

export const TOKENS_AGENT_TOOLS = SPECS.map((s) => ({
  id: `tokens-${s.slug}`,
  agentDirect: true,
  path: `/tokens/${s.slug}`,
  method: s.method,
  priceUsd: X402_API_PRICE_USD,
  displayPriceUsd: X402_DISPLAY_PRICE_USD,
  name: s.name,
  description: s.description,
}));

/** @type {Record<string, TokensGate>} */
export const TOKENS_TOOL_GATES = Object.fromEntries(SPECS.map((s) => [`tokens-${s.slug}`, s.gate]));

/**
 * @param {string} toolId
 * @param {Record<string, unknown>} p
 * @returns {string[] | null}
 */
export function getTokensGateMissing(toolId, p) {
  const gate = TOKENS_TOOL_GATES[toolId];
  if (!gate || gate === 'none') return null;

  const has = (k) => p[k] != null && String(p[k]).trim() !== '';

  if (gate === 'q') {
    if (!has('q')) return ['q (search query)'];
    return null;
  }
  if (gate === 'ref_or_mint') {
    if (!has('ref') && !has('mint')) return ['ref or mint'];
    return null;
  }
  if (gate === 'asset_id') {
    if (!has('assetId') && !has('asset_id')) return ['assetId'];
    return null;
  }
  if (gate === 'mint') {
    if (!has('mint')) return ['mint (Solana address)'];
    return null;
  }
  if (gate === 'mints') {
    const mints = has('mints') || has('addresses') || has('body') || has('body_json') || has('bodyJson');
    if (!mints) return ['mints (comma-separated) or body JSON with mints array'];
    return null;
  }
  return null;
}

/**
 * @param {string} toolId
 * @returns {string | undefined}
 */
export function getTokensParamsHintForLlm(toolId) {
  const gate = TOKENS_TOOL_GATES[toolId];
  if (!gate || gate === 'none') {
    return 'Optional query keys per docs.tokens.xyz (list, groupBy, include, interval, from, to, mint, limit, offset).';
  }
  if (gate === 'q') return 'Params: q (required). Optional limit, category.';
  if (gate === 'ref_or_mint') return 'Params: ref (btc, solana, ticker) OR mint (Solana base58).';
  if (gate === 'asset_id') {
    return 'Params: assetId or asset_id (required, e.g. btc, solana, solana-<mint>). Optional include, mint, interval, from, to, kind, liquidityTier, offset, limit.';
  }
  if (gate === 'mint') return 'Params: mint (required Solana address).';
  if (gate === 'mints') {
    return 'Params: mints (comma-separated Solana addresses, max 250 for POST / 50 for GET) OR body JSON { "mints": ["..."] }. aliases: addresses.';
  }
  return undefined;
}
