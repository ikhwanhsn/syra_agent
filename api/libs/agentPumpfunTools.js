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

/**
 * Tools whose API response may include a base64 `transaction` to sign with the agent wallet.
 *
 * SECURITY P0.3 — this set must ONLY contain tools that already pass a user-facing confirmation
 * gate (inline swap UI, intent confirmation, etc.). Adding a tool here without an upstream
 * confirmation step lets the LLM trigger fund movement from chat — never do that.
 *
 * `jupiter-swap-order` was previously here. It is now routed through the same inline swap UI
 * as `pumpfun-agents-swap`; the chat router refuses to auto-submit Jupiter transactions and
 * defers to the swap form (see chat.js handling of jupiter-swap-order).
 */
export const PUMPFUN_TX_TOOL_IDS = new Set([
  'pumpfun-agents-swap',
  'pumpfun-agents-create-coin',
  'pumpfun-collect-fees',
  'pumpfun-sharing-config',
  'pumpfun-agent-payments-build',
]);

/**
 * Tools that produce a serialized transaction but MUST go through the inline confirmation UI
 * before the broker is allowed to sign. This is the full list of LLM-callable signing tools.
 */
export const SIGN_REQUIRES_CONFIRMATION = new Set([
  'pumpfun-agents-swap',
  'pumpfun-agents-create-coin',
  'pumpfun-collect-fees',
  'pumpfun-sharing-config',
  'pumpfun-agent-payments-build',
  'jupiter-swap-order',
  'purch-vault-buy',
  'rise-buy-token',
  'rise-sell-token',
  'rise-deposit-and-borrow',
  'rise-repay-and-withdraw',
  'tempo-send-payout',
  'binance-spot-order',
  'binance-spot-order-cancel',
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
