/**
 * Default per-wallet allocation rules (placeholder — enforcement TBD).
 * Stored on AgentWallet.allocationConfig when provisioned; ops can override per wallet later.
 */

/** @typedef {'spend' | 'earn' | 'treasury' | 'invest' | 'grow' | 'lp'} WalletPurpose */

/** @type {Record<WalletPurpose, Record<string, number>>} */
export const DEFAULT_WALLET_ALLOCATIONS = Object.freeze({
  spend: Object.freeze({
    chat: 0.1,
    other: 0.9,
  }),
  earn: Object.freeze({}),
  treasury: Object.freeze({}),
  invest: Object.freeze({}),
  grow: Object.freeze({}),
  lp: Object.freeze({}),
});

/**
 * @param {import('../libs/agentWalletPurpose.js').AgentWalletPurpose} purpose
 * @returns {Record<string, number>}
 */
export function defaultAllocationConfigForPurpose(purpose) {
  const key = /** @type {WalletPurpose} */ (purpose);
  const defaults = DEFAULT_WALLET_ALLOCATIONS[key];
  return defaults ? { ...defaults } : {};
}
