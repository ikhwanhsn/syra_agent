/**
 * Shared agent wallet provisioning (chat + LP purposes).
 */
import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';
import pkg from 'random-avatar-generator';
import AgentWallet from '../models/agent/AgentWallet.js';
import { encryptAgentSecretForStorage } from './agentWalletSecretCrypto.js';
import { isPrivyConfigured, createPrivyServerWallet, getDefaultCustodyMode } from '../services/privyServerWallet.js';
import { LP_REAL_TOOL_IDS } from '../services/policyEngine.js';
import {
  chatAnonymousIdFrom,
  lpAnonymousIdFromChat,
  normalizeAgentWalletPurpose,
  purposeQuery,
} from './agentWalletPurpose.js';
import { canonicalAnonymousId, resolveAgentWalletForUser } from './agentWalletResolve.js';

const { AvatarGenerator } = pkg;
const avatarGenerator = new AvatarGenerator();

const CHAT_GUEST_TOOLS = Object.freeze([
  'news',
  'signal',
  'sentiment',
  'event',
  'analytics-summary',
  'arbitrage',
  'trending-jupiter',
]);

const LP_DEFAULT_TOOLS = Object.freeze([...LP_REAL_TOOL_IDS, 'lp_real_swap']);

/**
 * @param {import('./agentWalletPurpose.js').AgentWalletPurpose} purpose
 */
function policyDefaultsForPurpose(purpose) {
  if (purpose === 'lp') {
    return {
      allowedTools: [...LP_DEFAULT_TOOLS],
      perTxCapUsd: 250,
      dailySpendCapUsd: 2500,
      hourlySpendCapUsd: 400,
    };
  }
  return {
    allowedTools: [...CHAT_GUEST_TOOLS],
    perTxCapUsd: 50,
    dailySpendCapUsd: 250,
    hourlySpendCapUsd: 100,
  };
}

/**
 * @param {{
 *   anonymousId: string;
 *   purpose?: import('./agentWalletPurpose.js').AgentWalletPurpose;
 *   walletAddress?: string | null;
 *   chain?: 'solana' | 'base' | 'bsc';
 *   avatarSeed?: string;
 * }} params
 */
export async function createAgentWalletRecord({
  anonymousId,
  purpose = 'chat',
  walletAddress = null,
  chain = 'solana',
  avatarSeed,
}) {
  const normalizedPurpose = normalizeAgentWalletPurpose(purpose);
  const avatarUrl = avatarGenerator.generateRandomAvatar(avatarSeed || anonymousId);
  const policy = policyDefaultsForPurpose(normalizedPurpose);
  const custody = getDefaultCustodyMode();

  if (custody === 'privy' && isPrivyConfigured()) {
    const out = await createPrivyServerWallet({ chain, anonymousId });
    return AgentWallet.create({
      anonymousId,
      walletAddress: walletAddress || undefined,
      chain,
      agentAddress: out.agentAddress,
      custody: 'privy',
      privyWalletId: out.privyWalletId,
      status: 'active',
      purpose: normalizedPurpose,
      avatarUrl,
      destinationAllowlist: walletAddress ? [walletAddress] : [],
      ...policy,
    });
  }

  const keypair = Keypair.generate();
  const agentAddress = keypair.publicKey.toBase58();
  return AgentWallet.create({
    anonymousId,
    walletAddress: walletAddress || undefined,
    chain,
    agentAddress,
    agentSecretKey: encryptAgentSecretForStorage(bs58.encode(keypair.secretKey)),
    custody: 'legacy',
    status: 'active',
    purpose: normalizedPurpose,
    avatarUrl,
    destinationAllowlist: walletAddress ? [walletAddress] : [],
    ...policy,
  });
}

/**
 * Get or create LP wallet for a chat anonymousId (guest or linked).
 * @param {string} chatAnonymousId
 */
export async function getOrCreateLpAgentWallet(chatAnonymousId) {
  const chatId = typeof chatAnonymousId === 'string' ? chatAnonymousId.trim() : '';
  if (!chatId) throw new Error('chat_anonymous_id_required');
  const lpId = lpAnonymousIdFromChat(chatId);
  if (!lpId) throw new Error('lp_anonymous_id_invalid');

  let doc = await AgentWallet.findOne({ anonymousId: lpId, status: { $ne: 'retired' } }).lean();
  if (doc) {
    return { anonymousId: lpId, agentAddress: doc.agentAddress, avatarUrl: doc.avatarUrl || null, isNewWallet: false };
  }

  const chatWallet = await AgentWallet.findOne({ anonymousId: chatId }).lean();
  await createAgentWalletRecord({
    anonymousId: lpId,
    purpose: 'lp',
    walletAddress: chatWallet?.walletAddress ?? null,
    chain: chatWallet?.chain || 'solana',
    avatarSeed: lpId,
  });

  doc = await AgentWallet.findOne({ anonymousId: lpId }).lean();
  return {
    anonymousId: lpId,
    agentAddress: doc.agentAddress,
    avatarUrl: doc.avatarUrl || null,
    isNewWallet: true,
  };
}

/**
 * LP wallet fields for API responses (chat connect / guest create / sign-in).
 * @param {string} chatAnonymousId
 */
export async function lpWalletResponseFields(chatAnonymousId) {
  const out = await getOrCreateLpAgentWallet(chatAnonymousId);
  return {
    lpAnonymousId: out.anonymousId,
    lpAgentAddress: out.agentAddress,
    lpAvatarUrl: out.avatarUrl || null,
    lpIsNewWallet: out.isNewWallet,
  };
}

/**
 * Ensure LP wallet exists after linked sign-in.
 * @param {{ address: string; chain?: string; guestChatAnonymousId?: string | null }} params
 */
export async function ensureLpAgentWalletForUser({ address, chain = 'solana', guestChatAnonymousId = null }) {
  const chatWallet = await resolveAgentWalletForUser({
    address,
    chain,
    guestAnonymousId: guestChatAnonymousId,
    purpose: 'chat',
  });
  if (!chatWallet?.anonymousId) return null;

  const lpId = lpAnonymousIdFromChat(chatWallet.anonymousId);
  const existing = await AgentWallet.findOne({ anonymousId: lpId }).lean();
  if (existing) {
    if (chatWallet.walletAddress && existing.walletAddress !== chatWallet.walletAddress) {
      await AgentWallet.updateOne(
        { _id: existing._id },
        { $set: { walletAddress: chatWallet.walletAddress, chain: chatWallet.chain || chain } },
      );
    }
    return existing;
  }

  await createAgentWalletRecord({
    anonymousId: lpId,
    purpose: 'lp',
    walletAddress: chatWallet.walletAddress || address,
    chain: chatWallet.chain || chain,
    avatarSeed: lpId,
  });
  return AgentWallet.findOne({ anonymousId: lpId }).lean();
}

/**
 * Find linked chat wallet by user wallet address.
 * @param {string} walletAddress
 * @param {'solana'|'base'|'bsc'} chain
 */
export async function findLinkedChatWallet(walletAddress, chain = 'solana') {
  const base =
    chain === 'base'
      ? { walletAddress, chain: 'base', ...purposeQuery('chat') }
      : chain === 'bsc'
        ? { walletAddress, chain: 'bsc', ...purposeQuery('chat') }
        : {
            walletAddress,
            ...purposeQuery('chat'),
            $or: [{ chain: 'solana' }, { chain: { $exists: false } }, { chain: null }],
          };
  return AgentWallet.findOne({ ...base, status: { $ne: 'retired' } }).lean();
}

/**
 * Find linked LP wallet by user wallet address.
 */
export async function findLinkedLpWallet(walletAddress, chain = 'solana') {
  const lpId = `${canonicalAnonymousId(walletAddress, chain)}:lp`;
  return AgentWallet.findOne({ anonymousId: lpId, status: { $ne: 'retired' } }).lean();
}

/**
 * Retire an agent wallet so a fresh one can be provisioned later.
 * @param {string} anonymousId
 */
export async function retireAgentWalletRecord(anonymousId) {
  const id = typeof anonymousId === 'string' ? anonymousId.trim() : '';
  if (!id) throw new Error('anonymous_id_required');

  const doc = await AgentWallet.findOne({ anonymousId: id, status: { $ne: 'retired' } });
  if (!doc) return null;

  const retiredAnonymousId = `retired:${Date.now()}:${id}`.slice(0, 240);

  await AgentWallet.updateOne(
    { _id: doc._id },
    {
      $set: {
        status: 'retired',
        anonymousId: retiredAnonymousId,
        walletAddress: null,
        agentSecretKey: null,
      },
    },
  );

  return {
    previousAnonymousId: id,
    retiredAnonymousId,
    purpose: doc.purpose || 'chat',
  };
}

/**
 * Retire chat wallet and its LP sibling when present.
 * @param {string} chatOrLpAnonymousId
 */
export async function retireAgentWalletWithSibling(chatOrLpAnonymousId) {
  const chatId = chatAnonymousIdFrom(chatOrLpAnonymousId);
  if (!chatId) throw new Error('anonymous_id_required');

  const lpId = lpAnonymousIdFromChat(chatId);
  const results = [];

  const chatResult = await retireAgentWalletRecord(chatId);
  if (chatResult) results.push(chatResult);

  if (lpId && lpId !== chatId) {
    const lpResult = await retireAgentWalletRecord(lpId);
    if (lpResult) results.push(lpResult);
  }

  return results;
}
