/**
 * StableCrypto x402 tools — CoinGecko, DefiLlama, and related market data via stablecrypto.dev.
 * @see https://stablecrypto.dev/llms.txt
 */
import { X402_API_PRICE_STABLECRYPTO_USD, X402_DISPLAY_PRICE_STABLECRYPTO_USD } from './x402Pricing.js';

/**
 * @typedef {'none' | 'ids' | 'protocol' | 'coins' | 'body'} StablecryptoGate
 */

/**
 * @param {string} slug
 * @param {string} stablecryptoPath
 * @param {string} name
 * @param {string} description
 * @param {StablecryptoGate} [gate]
 */
function row(slug, stablecryptoPath, name, description, gate = 'none') {
  return { slug, stablecryptoPath, name, description, gate };
}

/** @type {ReturnType<typeof row>[]} */
const SPECS = [
  row(
    'coingecko-price',
    '/api/coingecko/price',
    'StableCrypto: CoinGecko price',
    'Spot prices for one or more CoinGecko ids (bitcoin, ethereum, solana, etc.). Params: ids (required, comma-separated or JSON array string); optional vs_currencies (default usd).',
    'ids'
  ),
  row(
    'coingecko-global',
    '/api/coingecko/global',
    'StableCrypto: global crypto market',
    'CoinGecko global market cap, dominance, and volume snapshot. No params.',
    'none'
  ),
  row(
    'coingecko-trending',
    '/api/coingecko/trending',
    'StableCrypto: CoinGecko trending',
    'Currently trending coins on CoinGecko. No params.',
    'none'
  ),
  row(
    'coingecko-markets',
    '/api/coingecko/markets',
    'StableCrypto: CoinGecko markets',
    'Top markets list; optional ids, vs_currency, order, per_page, page as flat params or body JSON.',
    'none'
  ),
  row(
    'coingecko-ohlc',
    '/api/coingecko/ohlc',
    'StableCrypto: CoinGecko OHLC',
    'OHLC candles for a CoinGecko id. Params: id (required, e.g. bitcoin); optional vs_currency, days.',
    'ids'
  ),
  row(
    'defillama-protocols',
    '/api/defillama/protocols',
    'StableCrypto: DeFi protocols',
    'List DeFi protocols with TVL from DefiLlama. No params.',
    'none'
  ),
  row(
    'defillama-chains',
    '/api/defillama/chains',
    'StableCrypto: chain TVL',
    'TVL by chain from DefiLlama. No params.',
    'none'
  ),
  row(
    'defillama-tvl',
    '/api/defillama/tvl',
    'StableCrypto: protocol TVL',
    'Historical TVL for one protocol. Params: protocol (required, DefiLlama slug e.g. aave, uniswap).',
    'protocol'
  ),
  row(
    'defillama-coins-prices',
    '/api/defillama/coins/prices',
    'StableCrypto: DefiLlama coin prices',
    'Current prices for DefiLlama coin ids. Params: coins (required, comma-separated or JSON array of coin:chain addresses).',
    'coins'
  ),
  row(
    'defillama-yields-pools',
    '/api/defillama/yields/pools',
    'StableCrypto: yield pools',
    'DefiLlama yield pool snapshot. No params.',
    'none'
  ),
];

export const STABLECRYPTO_AGENT_TOOLS = SPECS.map((s) => ({
  id: `stablecrypto-${s.slug}`,
  path: `/stablecrypto/${s.slug}`,
  stablecryptoPath: s.stablecryptoPath,
  method: 'POST',
  priceUsd: X402_API_PRICE_STABLECRYPTO_USD,
  displayPriceUsd: X402_DISPLAY_PRICE_STABLECRYPTO_USD,
  name: s.name,
  description: s.description,
}));

/** @type {Record<string, StablecryptoGate>} */
export const STABLECRYPTO_TOOL_GATES = Object.fromEntries(
  SPECS.map((s) => [`stablecrypto-${s.slug}`, s.gate])
);

/**
 * @param {string} toolId
 * @param {Record<string, unknown>} p
 * @returns {string[] | null}
 */
export function getStablecryptoGateMissing(toolId, p) {
  const gate = STABLECRYPTO_TOOL_GATES[toolId];
  if (!gate || gate === 'none') return null;

  const has = (k) => p[k] != null && String(p[k]).trim() !== '';

  if (gate === 'ids') {
    if (!has('ids') && !has('id')) return ['ids or id (CoinGecko coin id, e.g. bitcoin)'];
    return null;
  }
  if (gate === 'protocol') {
    if (!has('protocol')) return ['protocol (DefiLlama slug, e.g. aave)'];
    return null;
  }
  if (gate === 'coins') {
    if (!has('coins')) return ['coins (DefiLlama coin ids, comma-separated)'];
    return null;
  }
  if (gate === 'body') {
    if (!has('body') && !has('body_json') && !has('bodyJson')) return ['body (JSON string)'];
    return null;
  }
  return null;
}

/**
 * @param {string} toolId
 * @returns {string | undefined}
 */
export function getStablecryptoParamsHintForLlm(toolId) {
  const gate = STABLECRYPTO_TOOL_GATES[toolId];
  if (!gate || gate === 'none') {
    return 'Params: {} or omit. Optional body JSON string to pass through to StableCrypto POST.';
  }
  if (gate === 'ids') {
    return 'Params: ids (required) — CoinGecko id(s), comma-separated e.g. bitcoin,ethereum or ["bitcoin"]; for OHLC use id= bitcoin; optional vs_currency, days.';
  }
  if (gate === 'protocol') {
    return 'Params: protocol (required) — DefiLlama protocol slug e.g. aave, makerdao, uniswap.';
  }
  if (gate === 'coins') {
    return 'Params: coins (required) — DefiLlama coin identifiers, comma-separated.';
  }
  return undefined;
}
