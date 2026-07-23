/**
 * Dexter x402 onchain data tools (activity / entity) + free catalog.
 * @see https://x402.dexter.cash/.well-known/x402
 */
import { X402_API_PRICE_DEXTER_USD, X402_DISPLAY_PRICE_DEXTER_USD } from './x402Pricing.js';

/**
 * @param {string} slug
 * @param {string | null} dexterPath
 * @param {string} method
 * @param {string} name
 * @param {string} description
 * @param {number} priceUsd
 * @param {number} displayPriceUsd
 * @param {boolean} [catalog]
 */
function row(slug, dexterPath, method, name, description, priceUsd, displayPriceUsd, catalog = false) {
  return {
    id: `dexter-${slug}`,
    path: `/dexter/${slug}`,
    dexterPath,
    method,
    priceUsd,
    displayPriceUsd,
    pillar: 'spend',
    name,
    description,
    dexterCatalog: catalog,
  };
}

/** @type {ReturnType<typeof row>[]} */
export const DEXTER_AGENT_TOOLS = [
  row(
    'x402-catalog',
    null,
    'GET',
    'Dexter: x402 catalog',
    'Free list of Dexter paid resources from /.well-known/x402 (activity, entity, shield, …).',
    0,
    0,
    true
  ),
  row(
    'onchain-activity',
    '/onchain/activity',
    'GET',
    'Dexter: onchain activity',
    'Solana token/wallet trade summary with volumes and top counterparties (x402 ~$0.05). Params: scope=token|wallet|trade, mint and/or wallet, optional timeframe, limit, includeRaw.',
    X402_API_PRICE_DEXTER_USD,
    X402_DISPLAY_PRICE_DEXTER_USD
  ),
  row(
    'onchain-entity',
    '/onchain/entity',
    'GET',
    'Dexter: onchain entity',
    'Detailed entity insight (token/wallet/trade) with SOL/token deltas (x402 ~$0.05). Params: scope, mint, wallet, signature (for trade), timeframe, limit, includeRaw.',
    X402_API_PRICE_DEXTER_USD,
    X402_DISPLAY_PRICE_DEXTER_USD
  ),
];

/**
 * @param {string} toolId
 * @returns {string | null}
 */
export function getDexterParamsHintForLlm(toolId) {
  const hints = {
    'dexter-x402-catalog': 'No params required.',
    'dexter-onchain-activity':
      'Params: scope=token|wallet|trade; mint (token) and/or wallet; optional timeframe (15m|1h|1d), limit, includeRaw=true|false.',
    'dexter-onchain-entity':
      'Params: scope=token|wallet|trade; mint and/or wallet; signature required when scope=trade; optional timeframe, limit, includeRaw.',
  };
  return hints[toolId] || null;
}

/**
 * @param {string} toolId
 * @param {Record<string, unknown>} p
 * @returns {string[] | null}
 */
export function getDexterGateMissing(toolId, p) {
  if (toolId === 'dexter-onchain-entity' && String(p.scope || '').trim() === 'trade') {
    if (p.signature == null || String(p.signature).trim() === '') return ['signature'];
  }
  if (toolId === 'dexter-onchain-activity' || toolId === 'dexter-onchain-entity') {
    const scope = String(p.scope || '').trim();
    if (scope === 'wallet' && (p.wallet == null || String(p.wallet).trim() === '')) {
      return ['wallet'];
    }
    if (scope === 'token' && (p.mint == null || String(p.mint).trim() === '')) {
      return ['mint'];
    }
  }
  return null;
}
