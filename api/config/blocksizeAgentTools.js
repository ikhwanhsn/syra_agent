/**
 * Blocksize market-data agent tools (x402 / credits).
 * @see https://mcp.blocksize.info/
 */
import {
  X402_API_PRICE_BLOCKSIZE_USD,
  X402_API_PRICE_BLOCKSIZE_PRETRADE_USD,
  X402_DISPLAY_PRICE_BLOCKSIZE_USD,
  X402_DISPLAY_PRICE_BLOCKSIZE_PRETRADE_USD,
} from './x402Pricing.js';

/**
 * @param {string} slug
 * @param {string} blocksizePath
 * @param {string} method
 * @param {string} name
 * @param {string} description
 * @param {string[]} [requiredParams]
 */
function row(slug, blocksizePath, method, name, description, requiredParams = []) {
  return {
    id: `blocksize-${slug}`,
    path: `/blocksize/${slug}`,
    blocksizePath,
    method,
    priceUsd: X402_API_PRICE_BLOCKSIZE_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_BLOCKSIZE_USD,
    pillar: 'spend',
    name,
    description,
    requiredParams,
  };
}

/** @type {ReturnType<typeof row>[]} */
export const BLOCKSIZE_AGENT_TOOLS = [
  row(
    'search',
    '/v1/search',
    'GET',
    'Blocksize: instrument search',
    'Free discovery search for VWAP/bidask pairs (e.g. q=SOLUSD). Use before paid quotes.',
    ['q']
  ),
  row(
    'vwap',
    '/v1/vwap/{pair}',
    'GET',
    'Blocksize: crypto VWAP',
    'Institutional real-time VWAP snapshot. Params: pair (e.g. SOLUSD, BTCUSD).',
    ['pair']
  ),
  row(
    'bidask',
    '/v1/bidask/{pair}',
    'GET',
    'Blocksize: bid/ask',
    'Bid/ask snapshot with spread. Params: pair (e.g. SOLUSD).',
    ['pair']
  ),
  {
    id: 'blocksize-pre-trade',
    path: '/blocksize/pre-trade',
    blocksizePath: '/v1/checks/pre-trade',
    method: 'POST',
    priceUsd: X402_API_PRICE_BLOCKSIZE_PRETRADE_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_BLOCKSIZE_PRETRADE_USD,
    pillar: 'spend',
    name: 'Blocksize: pre-trade sanity check',
    description:
      'Quote freshness / spread / reference-drift guardrails (~$0.10). Params: pair (required); optional extra flat string fields for the POST body.',
    requiredParams: ['pair'],
  },
];

/**
 * @param {string} toolId
 * @returns {string | null}
 */
export function getBlocksizeParamsHintForLlm(toolId) {
  const hints = {
    'blocksize-search': 'Params: q (required) — e.g. SOLUSD, BTC, ETHUSD.',
    'blocksize-vwap': 'Params: pair (required) — e.g. SOLUSD or BTCUSD (no slash).',
    'blocksize-bidask': 'Params: pair (required) — e.g. SOLUSD.',
    'blocksize-pre-trade': 'Params: pair (required). Optional extra fields as flat string keys for the POST body.',
  };
  return hints[toolId] || null;
}

/**
 * @param {string} toolId
 * @param {Record<string, unknown>} p
 * @returns {string[] | null}
 */
export function getBlocksizeGateMissing(toolId, p) {
  const tool = BLOCKSIZE_AGENT_TOOLS.find((t) => t.id === toolId);
  if (!tool?.requiredParams?.length) return null;
  const missing = [];
  for (const k of tool.requiredParams) {
    if (p[k] == null || String(p[k]).trim() === '') missing.push(k);
  }
  return missing.length ? missing : null;
}
