/**
 * MevX Data Provider API (API-key). Used by agentDirect tools.
 * @see https://landing-api.mevx.io/ | https://mevx-docs.readme.io/
 */
const MEVX_BASE = (process.env.MEVX_API_BASE_URL || 'https://api.mevx.io').replace(/\/$/, '');
const API_KEY = (process.env.MEVX_API_KEY || '').trim();
const TIMEOUT_MS = Number(process.env.MEVX_TIMEOUT_MS) || 30_000;

export const mevxConfig = {
  baseUrl: MEVX_BASE,
  configured: Boolean(API_KEY),
  xAccount: 'https://x.com/MEVX_Official',
  docs: 'https://mevx-docs.readme.io/',
};

function headers() {
  /** @type {Record<string, string>} */
  const h = { Accept: 'application/json', 'Content-Type': 'application/json' };
  if (API_KEY) {
    h['X-API-KEY'] = API_KEY;
    h['x-api-key'] = API_KEY;
    h.Authorization = `Bearer ${API_KEY}`;
  }
  return h;
}

/**
 * @param {string} path
 * @param {Record<string, string>} [query]
 * @returns {Promise<{ ok: boolean; status: number; data: unknown }>}
 */
async function fetchMevx(path, query = {}) {
  if (!API_KEY) {
    return {
      ok: false,
      status: 503,
      data: {
        error:
          'MEVX_API_KEY not configured. Get a key at https://landing-api.mevx.io/ and set MEVX_API_KEY in API .env',
      },
    };
  }
  const url = new URL(path.startsWith('/') ? path : `/${path}`, `${MEVX_BASE}/`);
  for (const [k, v] of Object.entries(query || {})) {
    if (v == null || String(v).trim() === '') continue;
    url.searchParams.set(k, String(v));
  }
  const controller = new AbortController();
  const to = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: headers(),
      signal: controller.signal,
    });
    clearTimeout(to);
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    clearTimeout(to);
    const message =
      err && typeof err === 'object' && 'name' in err && err.name === 'AbortError'
        ? 'MevX request timeout'
        : err instanceof Error
          ? err.message
          : String(err);
    return { ok: false, status: 502, data: { error: message } };
  }
}

/**
 * GET /api/v1/trades — recent trades for pool/wallet.
 * @param {Record<string, string>} params
 */
export async function getMevxTrades(params = {}) {
  const query = {
    chain: params.chain || 'sol',
    poolAddress: params.poolAddress || params.pool || params.address || '',
    wallet: params.wallet || '',
    offset: params.offset || '0',
    limit: params.limit || '20',
    orderBy: params.orderBy || 'timestamp desc',
  };
  const { ok, status, data } = await fetchMevx('/api/v1/trades', query);
  if (!ok) {
    const err =
      (data && typeof data === 'object' && 'error' in data && data.error) ||
      (data && typeof data === 'object' && 'message' in data && data.message) ||
      `MevX trades failed (${status})`;
    return { error: String(err) };
  }
  return { data };
}

/**
 * GET /api/v1/pools — pool lookup when available on the account tier.
 * @param {Record<string, string>} params
 */
export async function getMevxPools(params = {}) {
  const query = {
    chain: params.chain || 'sol',
    address: params.address || params.poolAddress || params.pool || '',
    token: params.token || params.mint || '',
    limit: params.limit || '20',
  };
  const { ok, status, data } = await fetchMevx('/api/v1/pools', query);
  if (!ok) {
    const err =
      (data && typeof data === 'object' && 'error' in data && data.error) ||
      (data && typeof data === 'object' && 'message' in data && data.message) ||
      `MevX pools failed (${status})`;
    return { error: String(err) };
  }
  return { data };
}

/**
 * GET /api/v1/tokens — token info when available on the account tier.
 * @param {Record<string, string>} params
 */
export async function getMevxToken(params = {}) {
  const address = params.address || params.mint || params.token || params.ca || '';
  if (!address) return { error: 'address (or mint) is required' };
  const query = {
    chain: params.chain || 'sol',
    address,
  };
  const { ok, status, data } = await fetchMevx('/api/v1/tokens', query);
  if (!ok) {
    // Fallback path used by some MevX deployments
    const alt = await fetchMevx(`/api/v1/token/${encodeURIComponent(address)}`, {
      chain: params.chain || 'sol',
    });
    if (alt.ok) return { data: alt.data };
    const err =
      (data && typeof data === 'object' && 'error' in data && data.error) ||
      (data && typeof data === 'object' && 'message' in data && data.message) ||
      `MevX token failed (${status})`;
    return { error: String(err) };
  }
  return { data };
}
