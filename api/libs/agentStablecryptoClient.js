/**
 * StableCrypto API (https://stablecrypto.dev) — x402 POST market data via agent wallet.
 * @see https://stablecrypto.dev/llms.txt
 */
import { callX402V2WithAgent } from './agentX402Client.js';

const STABLECRYPTO_BASE = (process.env.STABLECRYPTO_API_BASE_URL || 'https://stablecrypto.dev').replace(
  /\/$/,
  ''
);

function trim(v) {
  return v != null ? String(v).trim() : '';
}

/**
 * @param {string} raw
 * @returns {string[]}
 */
function parseIdList(raw) {
  const t = trim(raw);
  if (!t) return [];
  if (t.startsWith('[')) {
    try {
      const parsed = JSON.parse(t);
      if (Array.isArray(parsed)) {
        return parsed.map((x) => String(x).trim()).filter(Boolean);
      }
    } catch {
      /* fall through */
    }
  }
  return t
    .split(/[,;\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * @param {Record<string, string>} params
 * @returns {Record<string, unknown> | undefined}
 */
function parseBodyOverride(params) {
  const raw = params.body ?? params.body_json ?? params.bodyJson;
  if (!trim(raw)) return undefined;
  try {
    const parsed = JSON.parse(String(raw));
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('body must be a JSON object');
    }
    return /** @type {Record<string, unknown>} */ (parsed);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`Invalid JSON in body: ${msg}`);
  }
}

/**
 * Build POST JSON body for a StableCrypto route from flat agent params.
 * @param {string} stablecryptoPath
 * @param {Record<string, string>} params
 * @returns {Record<string, unknown>}
 */
export function buildStablecryptoPostBody(stablecryptoPath, params) {
  const override = parseBodyOverride(params);
  if (override) return override;

  const path = stablecryptoPath.startsWith('/') ? stablecryptoPath : `/${stablecryptoPath}`;

  if (path === '/api/coingecko/price') {
    const ids = parseIdList(params.ids || params.id);
    const vs = parseIdList(params.vs_currencies || params.vs_currency || 'usd');
    return {
      ids: ids.length ? ids : ['bitcoin'],
      vs_currencies: vs.length ? vs : ['usd'],
    };
  }

  if (path === '/api/coingecko/ohlc') {
    const id = trim(params.id) || parseIdList(params.ids)[0] || 'bitcoin';
    const vs = trim(params.vs_currency) || 'usd';
    const days = trim(params.days) || '7';
    return { id, vs_currency: vs, days: Number(days) || 7 };
  }

  if (path === '/api/coingecko/markets') {
    const ids = parseIdList(params.ids);
    const body = /** @type {Record<string, unknown>} */ ({
      vs_currency: trim(params.vs_currency) || 'usd',
    });
    if (ids.length) body.ids = ids;
    if (trim(params.order)) body.order = trim(params.order);
    if (trim(params.per_page)) body.per_page = Number(params.per_page) || 100;
    if (trim(params.page)) body.page = Number(params.page) || 1;
    return body;
  }

  if (path === '/api/defillama/tvl') {
    const protocol = trim(params.protocol);
    if (!protocol) throw new Error('protocol is required for DefiLlama TVL');
    return { protocol };
  }

  if (path === '/api/defillama/protocol') {
    const protocol = trim(params.protocol);
    if (!protocol) throw new Error('protocol is required');
    return { protocol };
  }

  if (path === '/api/defillama/coins/prices') {
    const coins = parseIdList(params.coins);
    if (!coins.length) throw new Error('coins is required (comma-separated DefiLlama coin ids)');
    return { coins };
  }

  return {};
}

/**
 * @param {string} anonymousId
 * @param {string} stablecryptoPath
 * @param {Record<string, string>} params
 * @param {string} [connectedWalletAddress]
 */
export async function callStablecryptoWithAgent(
  anonymousId,
  stablecryptoPath,
  params,
  connectedWalletAddress
) {
  try {
    const path = stablecryptoPath.startsWith('/') ? stablecryptoPath : `/${stablecryptoPath}`;
    const body = buildStablecryptoPostBody(path, params);
    const url = `${STABLECRYPTO_BASE}${path}`;
    return await callX402V2WithAgent({
      anonymousId,
      url,
      method: 'POST',
      body,
      connectedWalletAddress,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { success: false, error: msg };
  }
}
