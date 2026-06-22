import AgentWallet from '../models/agent/AgentWallet.js';
import { normalizeAgentChain } from './syraChains.js';
import {
  baseAnonymousIdFrom,
  lpAnonymousIdFromChat,
  normalizeAgentWalletPurpose,
  purposeQuery,
  siblingAnonymousId,
} from './agentWalletPurpose.js';

/**
 * @param {string} address
 * @param {import('./syraChains.js').SyraAgentChain} chain
 * @param {import('./agentWalletPurpose.js').AgentWalletPurpose} purpose
 */
function canonicalAnonymousId(address, chain, purpose = 'spend') {
  const normalizedPurpose = normalizeAgentWalletPurpose(purpose);
  let base;
  if (chain === 'base') base = `wallet:${address}:base`;
  else if (chain === 'bsc') base = `wallet:${address}:bsc`;
  else base = `wallet:${address}`;
  if (normalizedPurpose === 'spend') return base;
  return siblingAnonymousId(base, normalizedPurpose) || base;
}

/**
 * @param {string} address
 * @param {import('./syraChains.js').SyraAgentChain} chain
 * @param {import('./agentWalletPurpose.js').AgentWalletPurpose} purpose
 */
function walletAddressQuery(address, chain, purpose = 'spend') {
  const purposeClause = purposeQuery(purpose);
  if (chain === 'base') {
    return { walletAddress: address, chain: 'base', ...purposeClause };
  }
  if (chain === 'bsc') {
    return { walletAddress: address, chain: 'bsc', ...purposeClause };
  }
  return {
    walletAddress: address,
    ...purposeClause,
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
 * @param {{
 *   address: string;
 *   chain?: import('./syraChains.js').SyraAgentChain;
 *   guestAnonymousId?: string | null;
 *   purpose?: import('./agentWalletPurpose.js').AgentWalletPurpose;
 * }} params
 * @returns {Promise<import('mongoose').LeanDocument|null>}
 */
export async function resolveAgentWalletForUser({
  address,
  chain = 'solana',
  guestAnonymousId = null,
  purpose = 'spend',
}) {
  const normalizedChain = normalizeAgentChain(chain);
  const normalizedPurpose = normalizeAgentWalletPurpose(purpose);
  const canonicalId = canonicalAnonymousId(address, normalizedChain, normalizedPurpose);

  const linked = await AgentWallet.findOne({
    ...walletAddressQuery(address, normalizedChain, normalizedPurpose),
    status: { $ne: 'retired' },
  }).lean();
  if (linked) return linked;

  const byCanonical = await AgentWallet.findOne({ anonymousId: canonicalId, status: { $ne: 'retired' } }).lean();
  if (byCanonical) {
    if (isUnlinkedGuest(byCanonical)) {
      await AgentWallet.updateOne(
        { _id: byCanonical._id },
        { $set: { walletAddress: address, chain: normalizedChain, purpose: normalizedPurpose } },
      );
      return AgentWallet.findOne({ _id: byCanonical._id }).lean();
    }
    return byCanonical;
  }

  const guestIdRaw =
    typeof guestAnonymousId === 'string' && guestAnonymousId.trim() && guestAnonymousId.trim() !== canonicalId
      ? guestAnonymousId.trim()
      : null;
  const guestId =
    guestIdRaw && normalizedPurpose !== 'spend'
      ? siblingAnonymousId(guestIdRaw, normalizedPurpose) || guestIdRaw
      : baseAnonymousIdFrom(guestIdRaw) || guestIdRaw;
  if (!guestId) return null;

  const guest = await AgentWallet.findOne({ anonymousId: guestId, status: { $ne: 'retired' } }).lean();
  if (!guest || !isUnlinkedGuest(guest)) return null;

  const canonicalFree = !(await AgentWallet.findOne({ anonymousId: canonicalId }).select('_id').lean());
  if (canonicalFree) {
    await AgentWallet.updateOne(
      { _id: guest._id },
      {
        $set: {
          anonymousId: canonicalId,
          walletAddress: address,
          chain: normalizedChain,
          purpose: normalizedPurpose,
        },
      },
    );
    return AgentWallet.findOne({ anonymousId: canonicalId }).lean();
  }

  await AgentWallet.updateOne(
    { _id: guest._id },
    { $set: { walletAddress: address, chain: normalizedChain, purpose: normalizedPurpose } },
  );
  return AgentWallet.findOne({ _id: guest._id }).lean();
}

/**
 * Resolve spend base id for wallet-set loading. When walletAddress is known, prefer the linked spend row
 * so stale guest anonymousIds do not trigger duplicate walletAddress provision errors.
 *
 * @param {{ anonymousId?: string | null; walletAddress?: string | null; chain?: 'solana'|'base'|'bsc' }} params
 */
export async function resolveSpendBaseForWalletSet({
  anonymousId = null,
  walletAddress = null,
  chain = 'solana',
}) {
  const requestedBase = baseAnonymousIdFrom(anonymousId) || anonymousId || null;

  let spendDoc = null;
  if (requestedBase) {
    spendDoc = await AgentWallet.findOne({
      anonymousId: requestedBase,
      status: { $ne: 'retired' },
      ...purposeQuery('spend'),
    }).lean();
  }

  const addr = typeof walletAddress === 'string' ? walletAddress.trim() : '';
  if (!spendDoc && addr) {
    spendDoc = await AgentWallet.findOne({
      ...walletAddressQuery(addr, chain, 'spend'),
      status: { $ne: 'retired' },
    }).lean();
  }

  const baseAnonymousId = spendDoc
    ? baseAnonymousIdFrom(spendDoc.anonymousId) || spendDoc.anonymousId
    : requestedBase;

  if (!baseAnonymousId) {
    throw new Error('base_anonymous_id_required');
  }

  return { baseAnonymousId, spendDoc };
}

export { canonicalAnonymousId, walletAddressQuery };
