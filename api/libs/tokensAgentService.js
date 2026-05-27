/**
 * Tokens.xyz Assets API v1 for the Syra agent (server-side API key).
 * @see https://docs.tokens.xyz/v1/quickstart
 */
import { TOKENS_TOOL_ROUTES } from '../config/tokensAgentTools.js';

const TOKENS_BASE = (process.env.TOKENS_API_BASE_URL || 'https://api.tokens.xyz').replace(/\/$/, '');
const TOKENS_V1 = TOKENS_BASE.endsWith('/v1') ? TOKENS_BASE : `${TOKENS_BASE}/v1`;

function trim(v) {
  return v != null ? String(v).trim() : '';
}

function notConfigured() {
  return {
    ok: false,
    error:
      'Tokens API is not configured. Set TOKENS_API_KEY in the API environment (https://docs.tokens.xyz/v1/quickstart).',
    status: 503,
  };
}

/**
 * @param {string | undefined} raw
 * @returns {string[]}
 */
function parseMintList(raw) {
  if (raw == null || trim(raw) === '') return [];
  return trim(raw)
    .split(/[,;\s]+/)
    .map((x) => x.trim())
    .filter(Boolean);
}

/**
 * @param {Record<string, unknown>} params
 * @returns {string | undefined}
 */
function resolveAssetId(params) {
  return trim(params.assetId) || trim(params.asset_id) || undefined;
}

/**
 * @param {string} template
 * @param {Record<string, unknown>} params
 */
function substitutePath(template, params) {
  const assetId = resolveAssetId(params);
  return template.replace(/\{assetId\}/g, () => {
    if (!assetId) throw new Error('Missing Tokens path param: assetId');
    return encodeURIComponent(assetId);
  });
}

/**
 * Keys consumed by path/body builders — not sent as query params.
 * @type {Set<string>}
 */
const RESERVED_QUERY_KEYS = new Set([
  'assetId',
  'asset_id',
  'body',
  'body_json',
  'bodyJson',
  'mints',
  'addresses',
]);

/**
 * @param {Record<string, unknown>} params
 * @param {string[]} extraReserved
 */
function buildQuery(params, extraReserved = []) {
  const reserved = new Set([...RESERVED_QUERY_KEYS, ...extraReserved]);
  /** @type {Record<string, string>} */
  const q = {};
  for (const [k, v] of Object.entries(params)) {
    if (reserved.has(k)) continue;
    if (v == null || trim(String(v)) === '') continue;
    q[k] = String(v);
  }
  return q;
}

/**
 * @param {Record<string, unknown>} params
 * @returns {object | undefined}
 */
function parseBodyJson(params) {
  const raw = params.body ?? params.body_json ?? params.bodyJson;
  if (raw == null || trim(String(raw)) === '') return undefined;
  try {
    const parsed = JSON.parse(String(raw));
    if (parsed && typeof parsed === 'object') return parsed;
    throw new Error('body must be a JSON object');
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Invalid JSON body';
    throw new Error(`body: ${msg}`);
  }
}

/**
 * @param {Record<string, unknown>} params
 */
function buildMarketSnapshotsBody(params) {
  const fromBody = parseBodyJson(params);
  if (fromBody) return fromBody;
  const mints = parseMintList(params.mints ?? params.addresses);
  if (!mints.length) throw new Error('mints is required (comma-separated) or body JSON with mints array');
  return { mints };
}

/**
 * @param {string} pathTemplate
 * @param {string} method
 * @param {Record<string, unknown>} params
 */
async function callTokensApi(pathTemplate, method, params) {
  const apiKey = process.env.TOKENS_API_KEY?.trim();
  if (!apiKey) return notConfigured();

  const m = (method || 'GET').toUpperCase();
  let path;
  try {
    path = substitutePath(pathTemplate, params);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Invalid path params';
    return { ok: false, error: msg, status: 400 };
  }

  const url = new URL(path.startsWith('/') ? path.slice(1) : path, `${TOKENS_V1}/`);

  /** @type {RequestInit} */
  const init = {
    method: m,
    headers: {
      'x-api-key': apiKey,
      Accept: 'application/json',
    },
  };

  if (m === 'GET') {
    const query = buildQuery(params);
    for (const [k, v] of Object.entries(query)) {
      url.searchParams.set(k, v);
    }
    if (pathTemplate === '/assets/variant-markets') {
      const mints = parseMintList(params.mints ?? params.addresses);
      if (mints.length) {
        url.searchParams.set('mints', mints.join(','));
      }
    }
  } else if (m === 'POST') {
    init.headers = { ...init.headers, 'Content-Type': 'application/json' };
    try {
      if (pathTemplate === '/assets/market-snapshots') {
        init.body = JSON.stringify(buildMarketSnapshotsBody(params));
      } else {
        const body = parseBodyJson(params);
        if (!body) {
          return { ok: false, error: 'POST requires body (JSON string) or mints for market-snapshots', status: 400 };
        }
        init.body = JSON.stringify(body);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Invalid body';
      return { ok: false, error: msg, status: 400 };
    }
  }

  let res;
  try {
    res = await fetch(url.toString(), init);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Tokens API request failed';
    return { ok: false, error: msg, status: 502 };
  }

  const requestId = res.headers.get('x-request-id') || undefined;
  let body;
  const text = await res.text();
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = { raw: text };
  }

  if (!res.ok) {
    const errObj = body?.error;
    const message =
      (typeof errObj?.message === 'string' && errObj.message) ||
      (typeof body?.message === 'string' && body.message) ||
      `Tokens API ${res.status}`;
    const details = typeof errObj?.details === 'string' ? errObj.details : undefined;
    return {
      ok: false,
      error: details ? `${message} (${details})` : message,
      status: res.status >= 400 && res.status < 600 ? res.status : 502,
      requestId,
      data: body,
    };
  }

  return { ok: true, data: body, requestId };
}

/**
 * @param {string} toolId
 * @param {Record<string, unknown>} [rawParams]
 */
export async function runTokensAgentTool(toolId, rawParams = {}) {
  const route = TOKENS_TOOL_ROUTES[toolId];
  if (!route) {
    return { ok: false, error: `Unknown Tokens tool: ${toolId}`, status: 400 };
  }

  return callTokensApi(route.tokensPath, route.method, { ...rawParams });
}
