/**
 * Call Purch Vault API (https://api.purch.xyz) with the agent wallet for x402 payment.
 * Used when the agent invokes Purch Vault tools — search, buy, download.
 * Payment: $0.01 USDC per API call (x402). Item purchase is a separate on-chain USDC transfer.
 */
import { getAgentKeypair } from './agentWallet.js';
import { pay402AndRetry } from './agentX402Client.js';
import { getSentinelFetch, SentinelBudgetError } from './sentinelFetch.js';

const PURCH_VAULT_BASE = process.env.PURCH_VAULT_API_BASE_URL || 'https://api.purch.xyz';

/**
 * Parse 402 payment options from Purch Vault response (body or Payment-Required header).
 * @param {Response} res - 402 response
 * @param {object} body - Parsed response body
 * @returns {{ accepts: object[]; x402Version?: number; resource?: unknown; extensions?: Record<string, unknown> } | null}
 */
function parse402FromPurch(res, body) {
  if (body?.accepts && Array.isArray(body.accepts) && body.accepts.length > 0) {
    return {
      accepts: body.accepts,
      x402Version: body.x402Version ?? 2,
      resource: body.resource,
      extensions: body.extensions,
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
 * Generic request to Purch Vault: GET or POST, on 402 pay with keypair and retry.
 * @param {import('@solana/web3.js').Keypair} keypair
 * @param {string} url - Full URL (with query string for GET)
 * @param {'GET'|'POST'} method
 * @param {object} [body] - JSON body for POST
 * @param {string} anonymousId - For Sentinel fetch
 * @returns {Promise<{ success: true; data?: any; blob?: ArrayBuffer } | { success: false; error: string }>}
 */
async function purchVaultRequest(keypair, url, method, body, anonymousId) {
  const sentinelFetch = getSentinelFetch(anonymousId);
  const opts = {
    method,
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    ...(body && method === 'POST' ? { body: JSON.stringify(body) } : {}),
  };
  const res = await sentinelFetch(url, opts);

  // Download endpoint returns application/zip; don't parse as JSON
  const contentType = res.headers.get('content-type') || '';
  const isZip = contentType.includes('application/zip') || contentType.includes('octet-stream');
  if (res.ok && isZip) {
    const blob = await res.arrayBuffer();
    return { success: true, blob };
  }

  const data = await res.json().catch(() => ({}));

  if (res.status !== 402) {
    if (!res.ok) {
      return {
        success: false,
        error: data?.error || data?.message || data?.detail || res.statusText || `Purch Vault API ${res.status}`,
      };
    }
    return { success: true, data };
  }

  const parsed = parse402FromPurch(res, data);
  if (!parsed) {
    return { success: false, error: '402 response missing payment options (accepts)' };
  }

  let accepts = parsed.accepts;
  const solana = accepts.filter((a) => (a.network || '').toLowerCase().includes('solana'));
  if (solana.length) accepts = solana;

  const result = await pay402AndRetry(keypair, {
    url,
    method,
    body,
    accepts,
    x402Version: parsed.x402Version ?? 2,
    resource: parsed.resource,
    extensions: parsed.extensions,
  }, sentinelFetch);

  if (!result.success) return result;
  if (result.data && typeof result.data === 'object' && !Buffer.isBuffer(result.data)) {
    return { success: true, data: result.data };
  }
  return result;
}

/**
 * Search Purch Vault (skills, knowledge, personas).
 * @param {string} anonymousId - Agent wallet anonymousId
 * @param {Record<string, string>} params - q, category, productType, minPrice, maxPrice, cursor, limit
 * @returns {Promise<{ success: true; data: { items: any[]; nextCursor?: string } } | { success: false; error: string }>}
 */
export async function purchVaultSearch(anonymousId, params = {}) {
  try {
    const keypair = await getAgentKeypair(anonymousId);
    if (!keypair) {
      return { success: false, error: 'Agent wallet not found for this user' };
    }
    const u = new URL(`${PURCH_VAULT_BASE.replace(/\/$/, '')}/x402/vault/search`);
    const allowed = ['q', 'category', 'productType', 'minPrice', 'maxPrice', 'cursor', 'limit'];
    for (const [k, v] of Object.entries(params || {})) {
      if (allowed.includes(k) && v != null && String(v).trim() !== '') {
        u.searchParams.set(k, String(v).trim());
      }
    }
    if (!u.searchParams.has('limit')) u.searchParams.set('limit', '30');
    const result = await purchVaultRequest(keypair, u.toString(), 'GET', undefined, anonymousId);
    return result;
  } catch (e) {
    const msg = e?.message || String(e);
    if (e && (e.name === 'SentinelBudgetError' || e instanceof SentinelBudgetError)) {
      return { success: false, error: msg, budgetExceeded: true };
    }
    return { success: false, error: msg };
  }
}

/**
 * Buy a Purch Vault item. Returns purchase details and serialized Solana transaction; caller must sign and submit, then call purchVaultDownload.
 * @param {string} anonymousId - Agent wallet anonymousId
 * @param {{ slug: string; walletAddress?: string; email?: string }} params - slug required; walletAddress defaults to agent wallet
 * @returns {Promise<{ success: true; data: { purchaseId: string; downloadToken: string; serializedTransaction: string; blockhash?: string; lastValidBlockHeight?: number; item?: object; payment?: object } } | { success: false; error: string }>}
 */
export async function purchVaultBuy(anonymousId, params = {}) {
  try {
    const keypair = await getAgentKeypair(anonymousId);
    if (!keypair) {
      return { success: false, error: 'Agent wallet not found for this user' };
    }
    const slug = params?.slug && String(params.slug).trim();
    if (!slug) {
      return { success: false, error: 'slug is required to buy a Purch Vault item' };
    }
    const walletAddress = (params.walletAddress && String(params.walletAddress).trim()) || keypair.publicKey.toBase58();
    const email = (params.email && String(params.email).trim()) || 'support@syraa.fun';
    const url = `${PURCH_VAULT_BASE.replace(/\/$/, '')}/x402/vault/buy`;
    const body = { slug, walletAddress, email };
    const result = await purchVaultRequest(keypair, url, 'POST', body, anonymousId);
    return result;
  } catch (e) {
    const msg = e?.message || String(e);
    if (e && (e.name === 'SentinelBudgetError' || e instanceof SentinelBudgetError)) {
      return { success: false, error: msg, budgetExceeded: true };
    }
    return { success: false, error: msg };
  }
}

/**
 * Download a purchased file. Requires purchaseId, downloadToken, and on first download txSignature.
 * @param {string} anonymousId - Agent wallet anonymousId
 * @param {{ purchaseId: string; downloadToken: string; txSignature?: string }} params
 * @returns {Promise<{ success: true; data?: object; blob?: ArrayBuffer } | { success: false; error: string }>}
 */
export async function purchVaultDownload(anonymousId, params = {}) {
  try {
    const keypair = await getAgentKeypair(anonymousId);
    if (!keypair) {
      return { success: false, error: 'Agent wallet not found for this user' };
    }
    const purchaseId = params?.purchaseId && String(params.purchaseId).trim();
    const downloadToken = params?.downloadToken && String(params.downloadToken).trim();
    if (!purchaseId || !downloadToken) {
      return { success: false, error: 'purchaseId and downloadToken are required to download' };
    }
    const u = new URL(`${PURCH_VAULT_BASE.replace(/\/$/, '')}/x402/vault/download/${purchaseId}`);
    u.searchParams.set('downloadToken', downloadToken);
    if (params.txSignature && String(params.txSignature).trim()) {
      u.searchParams.set('txSignature', String(params.txSignature).trim());
    }
    const result = await purchVaultRequest(keypair, u.toString(), 'GET', undefined, anonymousId);
    return result;
  } catch (e) {
    const msg = e?.message || String(e);
    if (e && (e.name === 'SentinelBudgetError' || e instanceof SentinelBudgetError)) {
      return { success: false, error: msg, budgetExceeded: true };
    }
    return { success: false, error: msg };
  }
}
