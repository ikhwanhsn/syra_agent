/**
 * Call Nansen API (https://api.nansen.ai) with the agent wallet for x402 payment.
 * Used when the agent invokes a Nansen tool — we call the real Nansen endpoint, not our own route.
 */
import { getAgentKeypair } from './agentWallet.js';
import { pay402AndRetry } from './agentX402Client.js';

const NANSEN_BASE = process.env.NANSEN_API_BASE_URL || 'https://api.nansen.ai';

/**
 * Parse 402 payment options from Nansen response. Nansen may return accepts in body or in
 * Payment-Required header (base64-encoded JSON).
 * @param {Response} res - 402 response
 * @param {object} body - Parsed response body
 * @returns {{ accepts: object[]; x402Version?: number } | null}
 */
function parse402FromNansen(res, body) {
  if (body?.accepts && Array.isArray(body.accepts) && body.accepts.length > 0) {
    return { accepts: body.accepts, x402Version: body.x402Version ?? 2 };
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
        return { accepts, x402Version: decoded.x402Version ?? 2 };
      }
    } catch {
      // ignore
    }
  }
  return null;
}

/**
 * Normalize agent params to Nansen request body. Params are string key-value; values that look
 * like JSON are parsed.
 * @param {Record<string, string>} params
 * @returns {object}
 */
function paramsToBody(params) {
  const body = {};
  for (const [key, value] of Object.entries(params || {})) {
    if (value === undefined || value === '') continue;
    const s = String(value).trim();
    if (s.startsWith('{') || s.startsWith('[')) {
      try {
        body[key] = JSON.parse(s);
      } catch {
        body[key] = value;
      }
    } else {
      body[key] = value;
    }
  }
  return body;
}

/**
 * Call Nansen API with agent wallet. On 402, pay with agent keypair and retry.
 * @param {string} anonymousId - Agent wallet anonymousId
 * @param {string} nansenPath - Nansen API path (e.g. /api/v1/profiler/address/current-balance)
 * @param {Record<string, string>} params - Request params (sent as JSON body; values can be JSON strings)
 * @returns {Promise<{ success: true; data: any } | { success: false; error: string }>}
 */
export async function callNansenWithAgent(anonymousId, nansenPath, params) {
  const keypair = await getAgentKeypair(anonymousId);
  if (!keypair) {
    return { success: false, error: 'Agent wallet not found for this user' };
  }

  const url = `${NANSEN_BASE.replace(/\/$/, '')}${nansenPath}`;
  const body = paramsToBody(params);

  const res = await fetch(url, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));

  if (res.status !== 402) {
    if (!res.ok) {
      return {
        success: false,
        error: data?.detail || data?.error || data?.message || res.statusText || `Nansen API ${res.status}`,
      };
    }
    return { success: true, data };
  }

  const parsed = parse402FromNansen(res, data);
  if (!parsed) {
    return { success: false, error: '402 response missing payment options (accepts or Payment-Required header)' };
  }

  // Prefer Solana accept if multiple (agent wallet is Solana)
  let accepts = parsed.accepts;
  const solana = accepts.filter((a) => (a.network || '').toLowerCase().includes('solana'));
  if (solana.length) accepts = solana;

  return pay402AndRetry(keypair, {
    url,
    method: 'POST',
    body,
    accepts,
    x402Version: parsed.x402Version ?? 2,
  });
}
