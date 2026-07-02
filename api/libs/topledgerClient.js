/**
 * TopLedger pay.sh gateway client — MPP / x402 Solana USDC per call.
 * @see https://api.topledger.xyz/.well-known/x402
 */
import { PublicKey } from '@solana/web3.js';
import { callX402V2WithAgent, callX402V2WithTreasury } from './agentX402Client.js';
import { TOPLEDGER_PAY_BASE_URL } from '../config/topledger.js';

/**
 * @param {Record<string, string>} params
 * @returns {Record<string, string>}
 */
export function normalizeTopledgerParams(params) {
  const out = { ...(params || {}) };
  const wallet =
    out.wallet?.trim() ||
    out.address?.trim() ||
    out.wallet_address?.trim() ||
    out.walletAddress?.trim() ||
    '';
  if (wallet) out.wallet = wallet;
  return out;
}

/**
 * @param {string} wallet
 * @returns {boolean}
 */
export function isValidSolanaWalletAddress(wallet) {
  try {
    // eslint-disable-next-line no-new
    new PublicKey(String(wallet || '').trim());
    return true;
  } catch {
    return false;
  }
}

/**
 * Build absolute TopLedger pay gateway URL from path template and params.
 * @param {string} pathTemplate - e.g. `/api/wallets/{wallet}/analyze`
 * @param {Record<string, string>} params
 * @returns {{ url: string; query: Record<string, string> }}
 */
export function buildTopledgerUrl(pathTemplate, params) {
  const normalized = normalizeTopledgerParams(params);
  const usedKeys = new Set();
  const pathOnly = pathTemplate.replace(/\{([a-zA-Z0-9_]+)\}/g, (_, key) => {
    const val = normalized[key];
    if (val == null || String(val).trim() === '') {
      throw new Error(`Missing required TopLedger path param: ${key}`);
    }
    usedKeys.add(key);
    return encodeURIComponent(String(val).trim());
  });
  const path = pathOnly.startsWith('/') ? pathOnly : `/${pathOnly}`;
  const url = new URL(path, `${TOPLEDGER_PAY_BASE_URL}/`);

  /** @type {Record<string, string>} */
  const query = {};
  for (const [k, v] of Object.entries(normalized)) {
    if (usedKeys.has(k)) continue;
    if (v == null || v === '') continue;
    query[k] = String(v);
    url.searchParams.set(k, String(v));
  }

  return { url: url.toString(), query };
}

function topledgerErrorMessage(status, body) {
  if (typeof body?.error === 'string') return body.error;
  if (typeof body?.message === 'string') return body.message;
  if (typeof body?.detail === 'string') return body.detail;
  return `TopLedger API ${status}`;
}

/**
 * @param {string} anonymousId
 * @param {string} pathTemplate
 * @param {string} method
 * @param {Record<string, string>} params
 * @returns {Promise<{ success: true; data: unknown } | { success: false; error: string; budgetExceeded?: boolean }>}
 */
export async function callTopledgerWithAgent(anonymousId, pathTemplate, method, params) {
  const normalized = normalizeTopledgerParams(params);
  const wallet = normalized.wallet;
  if (!wallet) {
    return { success: false, error: 'wallet (or address) is required' };
  }
  if (!isValidSolanaWalletAddress(wallet)) {
    return { success: false, error: 'Invalid Solana wallet address' };
  }

  let built;
  try {
    built = buildTopledgerUrl(pathTemplate, normalized);
  } catch (e) {
    return { success: false, error: e?.message || 'Invalid TopLedger request params' };
  }

  const apiKey = process.env.TOPLEDGER_API_KEY?.trim();
  if (apiKey) {
    try {
      const res = await fetch(built.url, {
        method: (method || 'GET').toUpperCase(),
        headers: {
          Accept: 'application/json',
          'X-API-Key': apiKey,
        },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { success: false, error: topledgerErrorMessage(res.status, data) };
      }
      return { success: true, data };
    } catch (e) {
      return { success: false, error: e?.message || String(e) };
    }
  }

  return callX402V2WithAgent({
    anonymousId,
    url: built.url,
    method: method || 'GET',
    query: built.query,
  });
}

/**
 * Treasury-paid TopLedger call for internal Grow/portfolio enrichment.
 * @param {string} pathTemplate
 * @param {string} method
 * @param {Record<string, string>} params
 */
export async function callTopledgerWithTreasury(pathTemplate, method, params) {
  const normalized = normalizeTopledgerParams(params);
  const wallet = normalized.wallet;
  if (!wallet) {
    return { success: false, error: 'wallet (or address) is required' };
  }
  if (!isValidSolanaWalletAddress(wallet)) {
    return { success: false, error: 'Invalid Solana wallet address' };
  }

  let built;
  try {
    built = buildTopledgerUrl(pathTemplate, normalized);
  } catch (e) {
    return { success: false, error: e?.message || 'Invalid TopLedger request params' };
  }

  const apiKey = process.env.TOPLEDGER_API_KEY?.trim();
  if (apiKey) {
    try {
      const res = await fetch(built.url, {
        method: (method || 'GET').toUpperCase(),
        headers: {
          Accept: 'application/json',
          'X-API-Key': apiKey,
        },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { success: false, error: topledgerErrorMessage(res.status, data) };
      }
      return { success: true, data };
    } catch (e) {
      return { success: false, error: e?.message || String(e) };
    }
  }

  return callX402V2WithTreasury({
    url: built.url,
    method: method || 'GET',
    query: built.query,
  });
}
