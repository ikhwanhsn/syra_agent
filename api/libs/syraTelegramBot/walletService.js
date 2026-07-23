/**
 * Syra Telegram bot — wallet provisioning and management.
 */
import AgentWallet from '../../models/agent/AgentWallet.js';
import TelegramBotUser, { telegramAnonymousIdFrom } from '../../models/agent/TelegramBotUser.js';
import { createAgentWalletRecord } from '../agentWalletProvision.js';
import { ensureTelegramIntelToolsAllowed, getAgentBalances } from '../agentWallet.js';
import { fetchAgentWalletBalances } from '../agentWalletBalance.js';
import { decryptAgentSecretFromStorage } from '../agentWalletSecretCrypto.js';
import { withdrawTelegramAgentToAddress } from '../telegramAgentWithdraw.js';
import {
  getCachedBalances,
  setCachedBalances,
  invalidateBalanceCache,
} from './balanceCache.js';

/**
 * @typedef {{
 *   telegramUserId: number;
 *   chatId: number;
 *   username?: string | null;
 *   firstName?: string | null;
 * }} TelegramUserInput
 */

/**
 * @typedef {{
 *   telegramUser: import('../../models/agent/TelegramBotUser.js').default extends infer T ? T : never;
 *   agentAddress: string;
 *   spendAnonymousId: string;
 *   isNewWallet: boolean;
 * }} EnsureWalletResult
 */

/**
 * Synthetic walletAddress for Telegram-only users (not an on-chain pubkey).
 * Avoids MongoDB unique-index collision on walletAddress=null for unlinked spend rows.
 * @param {number} telegramUserId
 * @returns {string}
 */
export function telegramSyntheticWalletAddress(telegramUserId) {
  return `telegram:${Math.trunc(Number(telegramUserId))}`;
}

/**
 * Upsert Telegram user and ensure a fresh Solana spend wallet exists.
 * @param {TelegramUserInput} telegramUser
 * @returns {Promise<{ telegramUser: object; agentAddress: string; spendAnonymousId: string; isNewWallet: boolean }>}
 */
export async function ensureTelegramUserWallet(telegramUser) {
  const telegramUserId = Math.trunc(Number(telegramUser.telegramUserId));
  const chatId = Math.trunc(Number(telegramUser.chatId));
  if (!Number.isFinite(telegramUserId) || telegramUserId <= 0) {
    throw new Error('invalid_telegram_user_id');
  }
  if (!Number.isFinite(chatId)) {
    throw new Error('invalid_chat_id');
  }

  const anonymousId = telegramAnonymousIdFrom(telegramUserId);
  const syntheticWalletAddress = telegramSyntheticWalletAddress(telegramUserId);
  let isNewWallet = false;

  /** @type {Record<string, unknown>} */
  const $set = {
    chatId,
    lastActiveAt: new Date(),
  };
  /** @type {Record<string, unknown>} */
  const $setOnInsert = {
    telegramUserId,
    anonymousId,
  };
  if (telegramUser.username) {
    $set.username = telegramUser.username;
  } else {
    $setOnInsert.username = null;
  }
  if (telegramUser.firstName) {
    $set.firstName = telegramUser.firstName;
  } else {
    $setOnInsert.firstName = null;
  }

  let tgUser = await TelegramBotUser.findOneAndUpdate(
    { telegramUserId },
    { $set, $setOnInsert },
    { upsert: true, new: true, lean: true, setDefaultsOnInsert: true },
  );

  if (!tgUser) {
    tgUser = (
      await TelegramBotUser.create({
        telegramUserId,
        chatId,
        username: telegramUser.username || null,
        firstName: telegramUser.firstName || null,
        anonymousId,
      })
    ).toObject();
  }

  let spendDoc = await AgentWallet.findOne({
    anonymousId,
    status: { $ne: 'retired' },
  }).lean();

  if (!spendDoc) {
    isNewWallet = true;
    try {
      const created = await createAgentWalletRecord({
        anonymousId,
        purpose: 'spend',
        walletAddress: syntheticWalletAddress,
        chain: 'solana',
        avatarSeed: anonymousId,
        provisionedVia: 'telegram',
      });
      spendDoc = created?.toObject ? created.toObject() : created;
    } catch (err) {
      if (err?.code === 11000) {
        spendDoc = await AgentWallet.findOne({
          anonymousId,
          status: { $ne: 'retired' },
        }).lean();
      }
      if (!spendDoc) {
        console.error(
          '[syra-telegram] wallet provision failed:',
          err instanceof Error ? err.message : err,
        );
        throw err;
      }
      isNewWallet = false;
    }
  }

  if (!spendDoc?.agentAddress) {
    throw new Error('telegram_wallet_provision_failed');
  }

  await ensureTelegramIntelToolsAllowed(spendDoc.anonymousId || anonymousId).catch((e) => {
    console.warn(
      '[syra-telegram] ensureTelegramIntelToolsAllowed failed:',
      e instanceof Error ? e.message : e,
    );
  });

  return {
    telegramUser: tgUser,
    agentAddress: spendDoc.agentAddress,
    spendAnonymousId: spendDoc.anonymousId || anonymousId,
    isNewWallet,
  };
}

/**
 * @param {string} anonymousId
 * @returns {Promise<{ agentAddress: string; solBalance: number; usdcBalance: number } | null>}
 */
export async function getAgentBalancesCached(anonymousId) {
  const id = String(anonymousId || '').trim();
  if (!id) return null;
  const cached = getCachedBalances(id);
  if (cached) {
    return {
      agentAddress: cached.agentAddress,
      solBalance: cached.solBalance,
      usdcBalance: cached.usdcBalance,
    };
  }
  const balances = await getAgentBalances(id);
  if (!balances?.agentAddress) return balances;
  setCachedBalances(id, {
    agentAddress: balances.agentAddress,
    solBalance: balances.solBalance,
    usdcBalance: balances.usdcBalance,
  });
  setCachedBalances(balances.agentAddress, {
    agentAddress: balances.agentAddress,
    solBalance: balances.solBalance,
    usdcBalance: balances.usdcBalance,
  });
  return balances;
}

/**
 * @param {string} anonymousId
 * @returns {Promise<{ agentAddress: string; solBalance: number; usdcBalance: number } | null>}
 */
export async function getWalletSummary(anonymousId) {
  const id = String(anonymousId || '').trim();
  const cached = getCachedBalances(id);
  if (cached) {
    return {
      agentAddress: cached.agentAddress,
      solBalance: cached.solBalance,
      usdcBalance: cached.usdcBalance,
      custody: cached.custody || 'legacy',
    };
  }

  const doc = await AgentWallet.findOne({
    anonymousId: id,
    status: { $ne: 'retired' },
  }).lean();
  if (!doc?.agentAddress) return null;
  const balances = await fetchAgentWalletBalances(doc.agentAddress);
  if (!balances) return null;
  const summary = {
    agentAddress: doc.agentAddress,
    solBalance: balances.solBalance,
    usdcBalance: balances.usdcBalance,
    custody: doc.custody || 'legacy',
  };
  setCachedBalances(id, summary);
  setCachedBalances(doc.agentAddress, summary);
  return summary;
}

/**
 * @param {string} anonymousId
 * @param {string} toAddress
 * @param {number} amount
 * @param {'usdc' | 'sol'} token
 * @returns {Promise<{ signature: string }>}
 */
export async function withdraw(anonymousId, toAddress, amount, token = 'usdc') {
  const id = String(anonymousId || '').trim();
  const recipient = String(toAddress || '').trim();
  if (!id || !recipient) {
    throw new Error('anonymousId and toAddress are required');
  }
  if (token !== 'usdc' && token !== 'sol') {
    throw new Error('token must be usdc or sol');
  }

  const opts =
    token === 'usdc'
      ? { asset: /** @type {'usdc'} */ ('usdc'), usdcAmount: amount }
      : { asset: /** @type {'sol'} */ ('sol'), solAmount: amount };

  const result = await withdrawTelegramAgentToAddress(id, recipient, opts);
  invalidateBalanceCache(id);
  return result;
}

/**
 * Export legacy-custody private key for Telegram guest wallet.
 * @param {string} anonymousId
 * @returns {Promise<{ agentAddress: string; privateKeyBase58: string } | { error: string; custody?: string }>}
 */
export async function exportWalletKey(anonymousId) {
  const id = String(anonymousId || '').trim();
  const doc = await AgentWallet.findOne({ anonymousId: id })
    .select('+agentSecretKey custody status chain agentAddress')
    .lean();

  if (!doc) {
    return { error: 'wallet_not_found' };
  }
  if (doc.custody === 'privy') {
    return { error: 'privy_custody_not_exportable', custody: 'privy' };
  }
  if (doc.status && doc.status !== 'active') {
    return { error: `wallet_${doc.status}` };
  }
  if (!doc.agentSecretKey) {
    return { error: 'no_exportable_key' };
  }

  try {
    const privateKeyBase58 = decryptAgentSecretFromStorage(doc.agentSecretKey);
    return {
      agentAddress: doc.agentAddress,
      privateKeyBase58,
    };
  } catch {
    return { error: 'decrypt_failed' };
  }
}

/**
 * @param {number} telegramUserId
 * @returns {Promise<object | null>}
 */
export async function getTelegramBotUser(telegramUserId) {
  return TelegramBotUser.findOne({ telegramUserId: Math.trunc(Number(telegramUserId)) }).lean();
}

/**
 * @param {number} telegramUserId
 * @param {object | null} pendingAction
 */
export async function setPendingAction(telegramUserId, pendingAction) {
  await TelegramBotUser.updateOne(
    { telegramUserId: Math.trunc(Number(telegramUserId)) },
    { $set: { pendingAction } },
  );
}

/**
 * @param {number} telegramUserId
 */
export async function clearPendingAction(telegramUserId) {
  await setPendingAction(telegramUserId, null);
}

/**
 * @param {number} telegramUserId
 */
export async function incrementMessageCount(telegramUserId) {
  await TelegramBotUser.updateOne(
    { telegramUserId: Math.trunc(Number(telegramUserId)) },
    { $inc: { messagesCount: 1 }, $set: { lastActiveAt: new Date() } },
  );
}

/**
 * @param {number} telegramUserId
 * @param {string[]} questions
 * @param {Date} expiresAt
 */
export async function setSuggestedQuestions(telegramUserId, questions, expiresAt) {
  const cleaned = (Array.isArray(questions) ? questions : [])
    .map((q) => String(q || '').trim())
    .filter(Boolean)
    .slice(0, 3);

  await TelegramBotUser.updateOne(
    { telegramUserId: Math.trunc(Number(telegramUserId)) },
    {
      $set: {
        suggestedQuestions: cleaned.length
          ? { questions: cleaned, expiresAt }
          : null,
      },
    },
  );
}

/**
 * @param {number} telegramUserId
 * @param {number} index
 * @returns {Promise<string | null>}
 */
export async function getSuggestedQuestion(telegramUserId, index) {
  const doc = await TelegramBotUser.findOne({
    telegramUserId: Math.trunc(Number(telegramUserId)),
  })
    .select('suggestedQuestions')
    .lean();

  const bucket = doc?.suggestedQuestions;
  if (!bucket?.questions?.length) return null;
  if (bucket.expiresAt && new Date(bucket.expiresAt).getTime() < Date.now()) return null;

  const idx = Math.trunc(Number(index));
  if (!Number.isFinite(idx) || idx < 0 || idx >= bucket.questions.length) return null;
  return String(bucket.questions[idx] || '').trim() || null;
}
