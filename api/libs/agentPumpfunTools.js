/**
 * Shared helpers for pump.fun x402 tools in agent chat and POST /agent/tools/call.
 */
import { getAgentAddress } from './agentWallet.js';

const PUMPFUN_POST_IDS_NEED_USER = new Set([
  'pumpfun-agents-swap',
  'pumpfun-agents-create-coin',
  'pumpfun-collect-fees',
  'pumpfun-sharing-config',
  'pumpfun-agent-payments-build',
]);

/** Tools whose API response may include a base64 `transaction` to sign with the agent wallet. */
export const PUMPFUN_TX_TOOL_IDS = new Set([
  'pumpfun-agents-swap',
  'pumpfun-agents-create-coin',
  'pumpfun-collect-fees',
  'pumpfun-sharing-config',
  'pumpfun-agent-payments-build',
  /** Jupiter Ultra returns a base64 legacy transaction (same sign path as pump.fun). */
  'jupiter-swap-order',
]);

/**
 * Replace `:mint` etc. in AGENT_TOOLS paths. Returns consumed param keys to strip from query/body.
 * @param {string} path
 * @param {Record<string, string>} params
 * @returns {{ path: string; consumed?: string[] } | { error: string }}
 */
export function substituteAgentToolPath(path, params) {
  let p = path;
  /** @type {string[]} */
  const consumed = [];
  if (p.includes(':mint')) {
    const mint = params.mint != null ? String(params.mint).trim() : '';
    if (!mint) {
      return { error: 'mint is required (pass param mint, base58).' };
    }
    p = p.replace(':mint', encodeURIComponent(mint));
    consumed.push('mint');
  }
  return consumed.length ? { path: p, consumed } : { path: p };
}

/**
 * @param {Record<string, string>} params
 * @param {string[]} keys
 */
export function omitParamsKeys(params, keys) {
  const out = { ...params };
  for (const k of keys) delete out[k];
  return out;
}

/**
 * Default `user` (fee payer / tx subject) to the agent Solana wallet for pump.fun POST bodies.
 * @param {string} anonymousId
 * @param {string} toolId
 * @param {Record<string, string>} params
 */
export async function enrichPumpfunToolParams(anonymousId, toolId, params) {
  const out = { ...params };
  if (PUMPFUN_POST_IDS_NEED_USER.has(toolId) && !String(out.user || '').trim()) {
    const addr = await getAgentAddress(anonymousId);
    if (addr) out.user = addr;
  }
  return out;
}
