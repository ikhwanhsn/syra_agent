/**
 * Birdeye Data public API (x402) — same payment flow as Zerion/Nansen: plain fetch → 402 → pay402AndRetry.
 * Direct callX402V2WithAgent (wrapFetch on first hop) was unreliable for Birdeye’s facilitator/CDP headers.
 * @see https://docs.birdeye.so/reference/x402
 */
import { getAgentKeypair } from './agentWallet.js';
import { getTreasuryKeypair, pay402AndRetry } from './agentX402Client.js';
import { getSentinelFetch, SentinelBudgetError } from './sentinelFetch.js';

const BIRDEYE_BASE = (process.env.BIRDEYE_API_BASE_URL || 'https://public-api.birdeye.so').replace(/\/$/, '');

/** Use raw fetch for the unpaid 402 probe so Sentinel does not alter status/body before we parse PAYMENT-REQUIRED. */
const RAW_FETCH = globalThis.fetch.bind(globalThis);

function trim(v) {
  return v != null ? String(v).trim() : '';
}

function substituteBraces(template, params) {
  return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (_, key) => {
    let val = params[key];
    if ((val == null || trim(val) === '') && key === 'address') {
      val = params.mint;
    }
    if (val == null || trim(val) === '') {
      throw new Error(`Missing Birdeye path param: ${key}`);
    }
    return encodeURIComponent(trim(val));
  });
}

/**
 * Parse 402 (CDP / x402 v2) from Birdeye — same shapes as Zerion.
 * @param {Response} res
 * @param {object} body
 */
function parse402FromBirdeye(res, body) {
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

function filterAcceptsSolana(accepts) {
  const preferSolana = String(process.env.BIRDEYE_X402_PREFER_SOLANA || 'true').trim() !== 'false';
  if (!preferSolana || !accepts?.length) return accepts;
  const solana = accepts.filter((a) => String(a.network || '').toLowerCase().includes('solana'));
  return solana.length ? solana : accepts;
}

function birdeyeErrorMessage(status, body) {
  if (typeof body?.message === 'string') return body.message;
  if (typeof body?.error === 'string') return body.error;
  if (typeof body?.detail === 'string') return body.detail;
  return `Birdeye API ${status}`;
}

/**
 * Build final URL (with query) and optional JSON body for Birdeye.
 * @returns {{ url: string; method: string; body?: object }}
 */
export function buildBirdeyeHttpRequest(pathTemplate, method, params) {
  const m = (method || 'GET').toUpperCase();
  /** @type {Record<string, string>} */
  const p = { ...params };
  if (!trim(p.address) && trim(p.mint)) {
    p.address = trim(p.mint);
  }

  const resolvePath = (template) => {
    const path = template.startsWith('/') ? template : `/${template}`;
    return /\{/.test(path) ? substituteBraces(path, p) : path;
  };

  const appendQuery = (baseUrl) => {
    const u = new URL(baseUrl);
    for (const [k, v] of Object.entries(p)) {
      if (v == null || trim(String(v)) === '') continue;
      u.searchParams.set(k, String(v));
    }
    return u.toString();
  };

  if (m === 'POST') {
    const bodyRaw = p.body ?? p.body_json ?? p.bodyJson;
    delete p.body;
    delete p.body_json;
    delete p.bodyJson;
    /** @type {object | undefined} */
    let bodyObj;
    if (bodyRaw != null && trim(bodyRaw) !== '') {
      try {
        bodyObj = typeof bodyRaw === 'string' ? JSON.parse(String(bodyRaw)) : bodyRaw;
      } catch {
        throw new Error('Invalid JSON in body (use a JSON string for Birdeye POST payloads)');
      }
    }
    const originPath = new URL(resolvePath(pathTemplate), `${BIRDEYE_BASE}/`);
    const url = appendQuery(originPath.toString());
    return { url, method: 'POST', body: bodyObj };
  }

  const originPath = new URL(resolvePath(pathTemplate), `${BIRDEYE_BASE}/`);
  const url = appendQuery(originPath.toString());
  return { url, method: 'GET' };
}

/**
 * @param {import('@solana/web3.js').Keypair} keypair
 * @param {typeof globalThis.fetch} fetchFn - Used only inside pay402AndRetry (x402 wrap); initial probe uses RAW_FETCH
 * @param {string} pathTemplate
 * @param {string} method
 * @param {Record<string, string>} params
 * @param {string} [connectedWalletAddress]
 */
async function callBirdeyeWithKeypair(keypair, fetchFn, pathTemplate, method, params, connectedWalletAddress) {
  let built;
  try {
    built = buildBirdeyeHttpRequest(pathTemplate, method, params);
  } catch (e) {
    return { success: false, error: e?.message || 'Invalid Birdeye request' };
  }

  const { url, method: m, body } = built;
  const headers = { Accept: 'application/json' };
  if (m === 'POST' && body != null) {
    headers['Content-Type'] = 'application/json';
  }
  if (connectedWalletAddress && trim(connectedWalletAddress)) {
    headers['X-Connected-Wallet'] = trim(connectedWalletAddress);
  }

  const init = {
    method: m,
    headers,
    redirect: 'manual',
    ...(body != null && m === 'POST' ? { body: JSON.stringify(body) } : {}),
  };

  const res = await RAW_FETCH(url, init);
  const data = await res.json().catch(() => ({}));

  if (res.status !== 402) {
    if (!res.ok) {
      return { success: false, error: birdeyeErrorMessage(res.status, data) };
    }
    return { success: true, data };
  }

  const parsed = parse402FromBirdeye(res, data);
  if (!parsed) {
    return {
      success: false,
      error: '402 response missing payment options (accepts or PAYMENT-REQUIRED header)',
    };
  }

  let accepts = filterAcceptsSolana(parsed.accepts);
  const solana = accepts.filter((a) => String(a.network || '').toLowerCase().includes('solana'));
  if (!solana.length && parsed.accepts?.length) {
    return {
      success: false,
      error:
        'Birdeye offered only non-Solana payment rails; Syra agent pays with Solana USDC. Try again later or contact support.',
    };
  }
  if (solana.length) accepts = solana;

  return pay402AndRetry(
    keypair,
    {
      url,
      method: m,
      body: m === 'POST' ? body : undefined,
      accepts,
      x402Version: parsed.x402Version ?? 2,
      resource: parsed.resource,
      extensions: parsed.extensions,
      connectedWalletAddress,
    },
    fetchFn
  );
}

/**
 * Birdeye x402 with agent wallet.
 * @param {string} anonymousId
 * @param {string} pathTemplate
 * @param {string} method
 * @param {Record<string, string>} params
 * @param {string} [connectedWalletAddress]
 */
export async function callBirdeyeWithAgent(
  anonymousId,
  pathTemplate,
  method,
  params,
  connectedWalletAddress
) {
  try {
    const keypair = await getAgentKeypair(anonymousId);
    if (!keypair) {
      return { success: false, error: 'Agent wallet not found for this user' };
    }
    const fetchFn = getSentinelFetch(anonymousId, { budget: false });
    return await callBirdeyeWithKeypair(keypair, fetchFn, pathTemplate, method, params, connectedWalletAddress);
  } catch (e) {
    const msg = e?.message || String(e);
    if (e && (e.name === 'SentinelBudgetError' || e instanceof SentinelBudgetError)) {
      return { success: false, error: msg, budgetExceeded: true };
    }
    return { success: false, error: msg };
  }
}

/**
 * Birdeye x402 with treasury (Syra Brain).
 */
export async function callBirdeyeWithTreasury(pathTemplate, method, params) {
  try {
    const keypair = getTreasuryKeypair();
    if (!keypair) {
      return { success: false, error: 'Treasury wallet not configured (AGENT_PRIVATE_KEY)' };
    }
    const fetchFn = getSentinelFetch('treasury', { budget: false });
    return await callBirdeyeWithKeypair(keypair, fetchFn, pathTemplate, method, params, undefined);
  } catch (e) {
    return { success: false, error: e?.message || String(e) };
  }
}
