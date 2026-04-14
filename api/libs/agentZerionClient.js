/**
 * Call Zerion API (https://api.zerion.io) with the agent wallet for x402 payment (USDC Base or Solana).
 * Syra agent wallet is Solana — we prefer Solana accepts; payment uses the same flow as Syra v2 / Nansen.
 * @see https://developers.zerion.io/build-with-ai/x402
 */
import { getAgentKeypair } from './agentWallet.js';
import { getTreasuryKeypair, pay402AndRetry } from './agentX402Client.js';
import { getSentinelFetch, SentinelBudgetError } from './sentinelFetch.js';

const ZERION_BASE = (process.env.ZERION_API_BASE_URL || 'https://api.zerion.io').replace(/\/$/, '');

/**
 * Parse 402 payment options from Zerion / CDP-style responses (body or Payment-Required header).
 * @param {Response} res
 * @param {object} body
 * @returns {{ accepts: object[]; x402Version?: number; resource?: unknown; extensions?: Record<string, unknown> } | null}
 */
function parse402FromZerion(res, body) {
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
  if (nested && Array.isArray(nested) && nested.length > 0 && nested[0]?.payTo) {
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
 * Build absolute Zerion URL from path template `{address}` etc. and string query params.
 * Reserved: path placeholder keys are consumed; `x_env` / `X_Env` set header only (not query).
 * @param {string} pathTemplate - e.g. `/v1/wallets/{address}/portfolio`
 * @param {Record<string, string>} params
 * @returns {{ url: string; xEnv?: string }}
 */
export function buildZerionUrl(pathTemplate, params) {
  const usedKeys = new Set();
  const pathOnly = pathTemplate.replace(/\{([a-zA-Z0-9_]+)\}/g, (_, key) => {
    const val = params[key];
    if (val == null || String(val).trim() === '') {
      throw new Error(`Missing required Zerion path param: ${key}`);
    }
    usedKeys.add(key);
    return encodeURIComponent(String(val).trim());
  });
  const path = pathOnly.startsWith('/') ? pathOnly : `/${pathOnly}`;
  const url = new URL(path, `${ZERION_BASE}/`);
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params || {})) {
    if (usedKeys.has(k)) continue;
    if (k === 'x_env' || k === 'X_Env') continue;
    if (v == null || v === '') continue;
    sp.append(k, String(v));
  }
  const qs = sp.toString();
  if (qs) url.search = qs;
  const xEnvRaw = params.x_env ?? params.X_Env;
  const xEnv = xEnvRaw != null && String(xEnvRaw).trim() ? String(xEnvRaw).trim() : undefined;
  return { url: url.toString(), xEnv };
}

/**
 * Prefer Solana USDC payment (agent keypair). If Zerion returns only Base, we cannot pay with this client.
 * Set ZERION_X402_PREFER_SOLANA=false to attempt first accept only (still Solana-only settlement).
 */
function filterAcceptsForAgent(accepts) {
  const preferSolana = String(process.env.ZERION_X402_PREFER_SOLANA || 'true').trim() !== 'false';
  if (!preferSolana || !accepts?.length) return accepts;
  const solana = accepts.filter((a) => String(a.network || '').toLowerCase().includes('solana'));
  return solana.length ? solana : accepts;
}

function zerionErrorMessage(status, body) {
  const errors = body?.errors;
  if (Array.isArray(errors) && errors[0]?.detail) return String(errors[0].detail);
  if (Array.isArray(errors) && errors[0]?.title) return String(errors[0].title);
  if (typeof body?.message === 'string') return body.message;
  if (typeof body?.error === 'string') return body.error;
  return `Zerion API ${status}`;
}

/**
 * GET (or POST) Zerion v1 with agent wallet x402 payment.
 * @param {string} anonymousId
 * @param {string} pathTemplate - Path under host, may include `{address}` placeholders
 * @param {string} method - GET or POST
 * @param {Record<string, string>} params - Path + query (and optional x_env for X-Env header)
 * @returns {Promise<{ success: true; data: unknown } | { success: false; error: string; budgetExceeded?: boolean }>}
 */
/**
 * @param {import('@solana/web3.js').Keypair} keypair
 * @param {typeof globalThis.fetch} fetchFn - Sentinel-wrapped or raw fetch
 */
async function callZerionWithKeypair(keypair, fetchFn, pathTemplate, method, params) {
  let url;
  let xEnv;
  try {
    const built = buildZerionUrl(pathTemplate, params || {});
    url = built.url;
    xEnv = built.xEnv;
  } catch (e) {
    return { success: false, error: e?.message || 'Invalid Zerion request params' };
  }

  const m = (method || 'GET').toUpperCase();
  const headers = { Accept: 'application/json' };
  if (xEnv) headers['X-Env'] = xEnv;

  const res = await fetchFn(url, { method: m, headers });
  const data = await res.json().catch(() => ({}));

  if (res.status !== 402) {
    if (!res.ok) {
      return {
        success: false,
        error: zerionErrorMessage(res.status, data),
      };
    }
    return { success: true, data };
  }

  const parsed = parse402FromZerion(res, data);
  if (!parsed) {
    return {
      success: false,
      error: '402 response missing payment options (accepts or Payment-Required header)',
    };
  }

  let accepts = filterAcceptsForAgent(parsed.accepts);
  const solana = accepts.filter((a) => String(a.network || '').toLowerCase().includes('solana'));
  if (!solana.length && parsed.accepts?.length) {
    return {
      success: false,
      error:
        'Zerion offered only non-Solana payment rails; Syra pays with Solana USDC. Try again later or contact support.',
    };
  }
  if (solana.length) accepts = solana;

  return pay402AndRetry(
    keypair,
    {
      url,
      method: m,
      accepts,
      x402Version: parsed.x402Version ?? 2,
      resource: parsed.resource,
      extensions: parsed.extensions,
    },
    fetchFn
  );
}

export async function callZerionWithAgent(anonymousId, pathTemplate, method, params) {
  try {
    const keypair = await getAgentKeypair(anonymousId);
    if (!keypair) {
      return { success: false, error: 'Agent wallet not found for this user' };
    }
    const sentinelFetch = getSentinelFetch(anonymousId);
    return await callZerionWithKeypair(keypair, sentinelFetch, pathTemplate, method, params);
  } catch (e) {
    const msg = e?.message || String(e);
    if (e && (e.name === 'SentinelBudgetError' || e instanceof SentinelBudgetError)) {
      return { success: false, error: msg, budgetExceeded: true };
    }
    return { success: false, error: msg };
  }
}

/**
 * Zerion x402 using treasury (AGENT_PRIVATE_KEY). Used by Syra Brain API.
 * @returns {Promise<{ success: true; data: unknown } | { success: false; error: string; budgetExceeded?: boolean }>}
 */
export async function callZerionWithTreasury(pathTemplate, method, params) {
  try {
    const keypair = getTreasuryKeypair();
    if (!keypair) {
      return { success: false, error: 'Treasury wallet not configured (AGENT_PRIVATE_KEY)' };
    }
    const sentinelFetch = getSentinelFetch('treasury');
    return await callZerionWithKeypair(keypair, sentinelFetch, pathTemplate, method, params);
  } catch (e) {
    const msg = e?.message || String(e);
    if (e && (e.name === 'SentinelBudgetError' || e instanceof SentinelBudgetError)) {
      return { success: false, error: msg, budgetExceeded: true };
    }
    return { success: false, error: msg };
  }
}
