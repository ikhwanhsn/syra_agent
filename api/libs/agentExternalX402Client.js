/**
 * Shared agent-wallet x402 client for external partners (Blocksize, Dexter onchain APIs, etc.).
 * Pattern: unpaid probe → parse 402 → pay402AndRetry with Solana USDC prefers.
 */
import { getAgentKeypair } from './agentWallet.js';
import { getTreasuryKeypair, pay402AndRetry } from './agentX402Client.js';
import { getAgentFetch, SentinelBudgetError } from './agentFetch.js';

const RAW_FETCH = globalThis.fetch.bind(globalThis);

/**
 * @param {Response} res
 * @param {object} body
 * @returns {{ accepts: object[]; x402Version?: number; resource?: unknown; extensions?: Record<string, unknown> } | null}
 */
export function parseExternal402(res, body) {
  if (body?.accepts && Array.isArray(body.accepts) && body.accepts.length > 0) {
    return {
      accepts: body.accepts,
      x402Version: body.x402Version ?? 2,
      resource: body.resource,
      extensions: body.extensions,
    };
  }
  const nested =
    body?.paymentRequirements?.accepts ||
    body?.x402?.accepts ||
    (Array.isArray(body?.paymentRequirements) ? body.paymentRequirements : null);
  if (nested && Array.isArray(nested) && nested.length > 0 && (nested[0]?.payTo || nested[0]?.asset)) {
    return {
      accepts: nested,
      x402Version: body.x402Version ?? body.paymentRequirements?.x402Version ?? 2,
      resource: body.resource ?? body.paymentRequirements?.resource ?? body.x402?.resource,
      extensions: body.extensions ?? body.paymentRequirements?.extensions ?? body.x402?.extensions,
    };
  }
  const header =
    res.headers.get('Payment-Required') ||
    res.headers.get('PAYMENT-REQUIRED') ||
    res.headers.get('payment-required');
  if (header) {
    try {
      const decoded = JSON.parse(Buffer.from(header, 'base64').toString('utf8'));
      const accepts = Array.isArray(decoded) ? decoded : decoded?.accepts;
      if (accepts?.length) {
        return {
          accepts,
          x402Version: decoded.x402Version ?? 2,
          resource: decoded.resource,
          extensions: decoded.extensions,
        };
      }
    } catch {
      // ignore
    }
  }
  return null;
}

/**
 * @param {string} pathTemplate
 * @param {Record<string, string>} params
 * @returns {{ path: string; query: Record<string, string> }}
 */
export function buildPathAndQuery(pathTemplate, params) {
  const used = new Set();
  const pathOnly = String(pathTemplate || '').replace(/\{([a-zA-Z0-9_]+)\}/g, (_, key) => {
    const val = params?.[key];
    if (val == null || String(val).trim() === '') {
      throw new Error(`Missing required path param: ${key}`);
    }
    used.add(key);
    return encodeURIComponent(String(val).trim());
  });
  const path = pathOnly.startsWith('/') ? pathOnly : `/${pathOnly}`;
  /** @type {Record<string, string>} */
  const query = {};
  for (const [k, v] of Object.entries(params || {})) {
    if (used.has(k)) continue;
    if (v == null || String(v).trim() === '') continue;
    query[k] = String(v);
  }
  return { path, query };
}

/**
 * @param {object} opts
 * @param {string} opts.baseUrl
 * @param {string} opts.pathTemplate
 * @param {string} [opts.method]
 * @param {Record<string, string>} opts.params
 * @param {Record<string, string>} [opts.extraHeaders]
 * @param {import('@solana/web3.js').Keypair} opts.keypair
 * @param {typeof globalThis.fetch} opts.fetchFn
 * @param {string} [opts.partnerLabel]
 * @param {boolean} [opts.preferSolana]
 */
export async function callExternalX402WithKeypair(opts) {
  const label = opts.partnerLabel || 'Partner';
  const method = (opts.method || 'GET').toUpperCase();
  let built;
  try {
    built = buildPathAndQuery(opts.pathTemplate, opts.params || {});
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : String(e) };
  }
  const urlObj = new URL(built.path, `${String(opts.baseUrl).replace(/\/$/, '')}/`);
  for (const [k, v] of Object.entries(built.query)) {
    urlObj.searchParams.set(k, v);
  }
  const url = urlObj.toString();
  /** @type {Record<string, string>} */
  const headers = { Accept: 'application/json', ...(opts.extraHeaders || {}) };
  let body;
  if (method === 'POST') {
    headers['Content-Type'] = 'application/json';
    body = { ...(opts.params || {}) };
  }

  const init = {
    method,
    headers,
    redirect: 'manual',
    ...(body != null ? { body: JSON.stringify(body) } : {}),
  };

  const res = await RAW_FETCH(url, init);
  const data = await res.json().catch(() => ({}));

  if (res.status !== 402) {
    if (!res.ok) {
      const msg =
        (typeof data?.message === 'string' && data.message) ||
        (typeof data?.error === 'string' && data.error) ||
        (typeof data?.detail === 'string' && data.detail) ||
        `${label} API ${res.status}`;
      return { success: false, error: msg };
    }
    return { success: true, data };
  }

  const parsed = parseExternal402(res, data);
  if (!parsed?.accepts?.length) {
    return {
      success: false,
      error: `${label} 402 missing payment options (accepts or PAYMENT-REQUIRED)`,
    };
  }

  const preferSolana = opts.preferSolana !== false;
  let accepts = parsed.accepts;
  if (preferSolana) {
    const solana = accepts.filter((a) => String(a.network || '').toLowerCase().includes('solana'));
    if (!solana.length) {
      return {
        success: false,
        error: `${label} offered only non-Solana payment rails; Syra agents pay with Solana USDC.`,
      };
    }
    accepts = solana;
  }

  return pay402AndRetry(
    opts.keypair,
    {
      url,
      method,
      body: method === 'POST' ? body : undefined,
      accepts,
      x402Version: parsed.x402Version ?? 2,
      resource: parsed.resource,
      extensions: parsed.extensions,
    },
    opts.fetchFn
  );
}

/**
 * @param {object} opts
 * @param {string} opts.anonymousId
 * @param {string} opts.baseUrl
 * @param {string} opts.pathTemplate
 * @param {string} [opts.method]
 * @param {Record<string, string>} opts.params
 * @param {Record<string, string>} [opts.extraHeaders]
 * @param {string} [opts.partnerLabel]
 */
export async function callExternalX402WithAgent(opts) {
  try {
    const keypair = await getAgentKeypair(opts.anonymousId);
    if (!keypair) {
      return { success: false, error: 'Agent wallet not found for this user' };
    }
    const fetchFn = await getAgentFetch(opts.anonymousId, { budget: false });
    return callExternalX402WithKeypair({ ...opts, keypair, fetchFn });
  } catch (err) {
    if (err instanceof SentinelBudgetError) {
      return { success: false, error: err.message, budgetExceeded: true };
    }
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * @param {object} opts — same as callExternalX402WithAgent without anonymousId
 */
export async function callExternalX402WithTreasury(opts) {
  try {
    const keypair = getTreasuryKeypair();
    if (!keypair) {
      return { success: false, error: 'Treasury keypair not configured (AGENT_PRIVATE_KEY)' };
    }
    return callExternalX402WithKeypair({
      ...opts,
      keypair,
      fetchFn: globalThis.fetch.bind(globalThis),
    });
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
