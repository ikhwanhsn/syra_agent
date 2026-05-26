import AgentWallet from '../models/agent/AgentWallet.js';
import { normalizeAgentChain } from './syraChains.js';

/**
 * @param {string} address
 * @param {import('./syraChains.js').SyraAgentChain} chain
 */
function canonicalAnonymousId(address, chain) {
  if (chain === 'base') return `wallet:${address}:base`;
  if (chain === 'bsc') return `wallet:${address}:bsc`;
  return `wallet:${address}`;
}

/**
 * @param {string} address
 * @param {import('./syraChains.js').SyraAgentChain} chain
 */
function walletAddressQuery(address, chain) {
  if (chain === 'base') {
    return { walletAddress: address, chain: 'base' };
  }
  if (chain === 'bsc') {
    return { walletAddress: address, chain: 'bsc' };
  }
  return {
    walletAddress: address,
    $or: [{ chain: 'solana' }, { chain: { $exists: false } }, { chain: null }],
  };
}

function isUnlinkedGuest(doc) {
  const w = doc?.walletAddress;
  return !w || (typeof w === 'string' && !w.trim());
}

/**
 * Resolve the agent wallet for a signed-in user.
 *
 * Order (preserves funded legacy wallets):
 *  1. Row already linked to walletAddress + chain (any anonymousId)
 *  2. Row at canonical anonymousId (wallet:address[:chain])
 *  3. Unlinked guest row from client localStorage (migrate on link)
 *
 * @returns {Promise<import('mongoose').LeanDocument|null>}
 */
export async function resolveAgentWalletForUser({ address, chain = 'solana', guestAnonymousId = null }) {
  const normalizedChain = normalizeAgentChain(chain);
  const canonicalId = canonicalAnonymousId(address, normalizedChain);

  const linked = await AgentWallet.findOne(walletAddressQuery(address, normalizedChain)).lean();
  if (linked) return linked;

  const byCanonical = await AgentWallet.findOne({ anonymousId: canonicalId }).lean();
  if (byCanonical) {
    if (isUnlinkedGuest(byCanonical)) {
      await AgentWallet.updateOne(
        { _id: byCanonical._id },
        { $set: { walletAddress: address, chain: normalizedChain } },
      );
      return AgentWallet.findOne({ _id: byCanonical._id }).lean();
    }
    return byCanonical;
  }

  const guestId =
    typeof guestAnonymousId === 'string' && guestAnonymousId.trim() && guestAnonymousId.trim() !== canonicalId
      ? guestAnonymousId.trim()
      : null;
  if (!guestId) return null;

  const guest = await AgentWallet.findOne({ anonymousId: guestId }).lean();
  if (!guest || !isUnlinkedGuest(guest)) return null;

  const canonicalFree = !(await AgentWallet.findOne({ anonymousId: canonicalId }).select('_id').lean());
  if (canonicalFree) {
    await AgentWallet.updateOne(
      { _id: guest._id },
      { $set: { anonymousId: canonicalId, walletAddress: address, chain: normalizedChain } },
    );
    return AgentWallet.findOne({ anonymousId: canonicalId }).lean();
  }

  await AgentWallet.updateOne(
    { _id: guest._id },
    { $set: { walletAddress: address, chain: normalizedChain } },
  );
  return AgentWallet.findOne({ _id: guest._id }).lean();
}

export { canonicalAnonymousId, walletAddressQuery };
