/**
 * Composed agent outbound fetch: globalThis.fetch → Sentinel (audit/budget) → Pact (refund coverage).
 * Single entry point for all agent-paid x402 upstream calls.
 */
import { getSentinelFetch, SentinelBudgetError } from './sentinelFetch.js';
import { wrapFetchWithPact } from './pactFetch.js';
import { getAgentKeypair } from './agentWallet.js';
import { getTreasuryKeypair } from './agentTreasuryKey.js';
import connectMongoose, { isMongooseConnected } from '../config/mongoose.js';

export { SentinelBudgetError };

/** IDs that are not user agent wallets — skip keypair lookup. */
const SYSTEM_AGENT_IDS = new Set([
  'playground',
  'syra-api',
  'x402-api',
  'x402-api-nansen',
  'x402-api-tester-base',
]);

/**
 * Resolve keypair for Pact signer attribution / refunds.
 * @param {string} agentId
 * @returns {Promise<import('@solana/web3.js').Keypair | null>}
 */
async function resolveKeypairForAgent(agentId) {
  if (agentId === 'treasury') {
    return getTreasuryKeypair();
  }
  if (!agentId || SYSTEM_AGENT_IDS.has(agentId)) {
    return null;
  }
  if (!isMongooseConnected()) {
    const ok = await connectMongoose({ required: false });
    if (!ok) return null;
  }
  return getAgentKeypair(agentId);
}

/**
 * Get the composed fetch for an agent: Sentinel inner, Pact outer (when enabled).
 * @param {string} [agentId] - anonymousId, 'treasury', or system id
 * @param {{ budget?: boolean }} [opts] - Sentinel budget policy (default: standardPolicy)
 * @returns {Promise<typeof fetch>}
 */
export async function getAgentFetch(agentId, opts = {}) {
  const id = agentId || process.env.SENTINEL_AGENT_ID || 'syra-api';
  const sentinelFetch = getSentinelFetch(id, opts);
  const keypair = await resolveKeypairForAgent(id);
  return wrapFetchWithPact(sentinelFetch, { agentId: id, keypair });
}
