/**
 * Dexter x402 onchain data APIs (activity / entity) via agent wallet settlement.
 * Deepens Syra↔Dexter beyond Labs facilitator usage.
 * @see https://x402.dexter.cash/.well-known/x402
 */
import { callExternalX402WithAgent, callExternalX402WithTreasury } from './agentExternalX402Client.js';

const DEXTER_X402_BASE = (
  process.env.DEXTER_X402_API_BASE_URL || 'https://x402.dexter.cash'
).replace(/\/$/, '');

/**
 * @param {string} anonymousId
 * @param {string} pathTemplate
 * @param {string} method
 * @param {Record<string, string>} params
 */
export async function callDexterWithAgent(anonymousId, pathTemplate, method, params) {
  return callExternalX402WithAgent({
    anonymousId,
    baseUrl: DEXTER_X402_BASE,
    pathTemplate,
    method: method || 'GET',
    params: params || {},
    partnerLabel: 'Dexter',
  });
}

/**
 * @param {string} pathTemplate
 * @param {string} method
 * @param {Record<string, string>} params
 */
export async function callDexterWithTreasury(pathTemplate, method, params) {
  return callExternalX402WithTreasury({
    baseUrl: DEXTER_X402_BASE,
    pathTemplate,
    method: method || 'GET',
    params: params || {},
    partnerLabel: 'Dexter',
  });
}

/**
 * Free discovery document for Dexter paid resources.
 * @returns {Promise<{ success: true; data: unknown } | { success: false; error: string }>}
 */
export async function fetchDexterX402Catalog() {
  try {
    const res = await fetch(`${DEXTER_X402_BASE}/.well-known/x402`, {
      headers: { Accept: 'application/json' },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        success: false,
        error: typeof data?.error === 'string' ? data.error : `Dexter catalog HTTP ${res.status}`,
      };
    }
    return { success: true, data };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export const dexterConfig = {
  baseUrl: DEXTER_X402_BASE,
  marketplace: 'https://dexter.cash/opendexter',
  xAccount: 'https://x.com/dexteraisol',
};
