/**
 * Earn payout rail — creator attribution on paid calls + treasury-gated payout.
 */
import SkillEarning from '../models/agent/SkillEarning.js';
import UserPrompt from '../models/agent/UserPrompt.js';
import AgentWallet from '../models/agent/AgentWallet.js';
import { isMongooseConnected } from '../config/mongoose.js';

/** Creator receives 80% of attributed micro-USDC; platform retains 20%. */
const CREATOR_SHARE_BPS = 8000;
const PLATFORM_FEE_BPS = 10000 - CREATOR_SHARE_BPS;

/**
 * @param {number} microUsdc
 */
function splitCreatorShare(microUsdc) {
  const gross = Math.max(0, Math.floor(microUsdc));
  const creatorShare = Math.floor((gross * CREATOR_SHARE_BPS) / 10000);
  const platformFee = gross - creatorShare;
  return { gross, creatorShare, platformFee };
}

/**
 * Record skill/prompt attribution when a paid call uses a published prompt.
 * @param {{
 *   promptId?: string;
 *   creatorAnonymousId?: string;
 *   paidPath: string;
 *   amountMicroUsdc?: number;
 *   paidApiCallId?: import('mongoose').Types.ObjectId;
 * }} opts
 */
export async function recordSkillAttribution(opts) {
  if (!isMongooseConnected()) return null;
  const { promptId, creatorAnonymousId, paidPath, amountMicroUsdc = 10_000, paidApiCallId } = opts;

  let creatorId = creatorAnonymousId;
  let sourceId = promptId;

  if (promptId && !creatorId) {
    const prompt = await UserPrompt.findById(promptId).lean();
    if (!prompt) return null;
    creatorId = prompt.anonymousId;
    sourceId = String(prompt._id);
  }

  if (!creatorId || !sourceId) return null;

  const wallet = await AgentWallet.findOne({ anonymousId: creatorId }).lean();
  const { gross, creatorShare, platformFee } = splitCreatorShare(amountMicroUsdc);

  try {
    return await SkillEarning.create({
      creatorAnonymousId: creatorId,
      creatorWallet: wallet?.walletAddress ?? wallet?.agentAddress ?? null,
      sourceType: 'prompt',
      sourceId,
      paidPath,
      amountMicroUsdc: gross,
      creatorShareMicroUsdc: creatorShare,
      platformFeeMicroUsdc: platformFee,
      status: 'pending',
      paidApiCallId: paidApiCallId ?? null,
    });
  } catch {
    return null;
  }
}

/**
 * @param {string} walletOrAnonymousId
 */
export async function getEarnSummary(walletOrAnonymousId) {
  if (!isMongooseConnected()) {
    return {
      wallet: walletOrAnonymousId,
      pendingMicroUsdc: 0,
      paidMicroUsdc: 0,
      totalMicroUsdc: 0,
      earnings: [],
    };
  }

  const key = String(walletOrAnonymousId || '').trim();
  const walletDoc = key.startsWith('wallet:')
    ? await AgentWallet.findOne({ anonymousId: key }).lean()
    : await AgentWallet.findOne({
        $or: [{ walletAddress: key }, { agentAddress: key }, { anonymousId: key }],
      }).lean();

  const creatorAnonymousId = walletDoc?.anonymousId ?? (key.startsWith('wallet:') ? key : null);
  const creatorWallet = walletDoc?.walletAddress ?? walletDoc?.agentAddress ?? key;

  const filter = creatorAnonymousId
    ? { creatorAnonymousId }
    : { creatorWallet: creatorWallet };

  const earnings = await SkillEarning.find(filter).sort({ createdAt: -1 }).limit(100).lean();

  let pendingMicroUsdc = 0;
  let paidMicroUsdc = 0;
  for (const e of earnings) {
    if (e.status === 'paid') paidMicroUsdc += e.creatorShareMicroUsdc ?? 0;
    else if (e.status === 'pending') pendingMicroUsdc += e.creatorShareMicroUsdc ?? 0;
  }

  return {
    wallet: creatorWallet,
    creatorAnonymousId,
    pendingMicroUsdc,
    paidMicroUsdc,
    totalMicroUsdc: pendingMicroUsdc + paidMicroUsdc,
    pendingUsd: pendingMicroUsdc / 1_000_000,
    paidUsd: paidMicroUsdc / 1_000_000,
    earnings: earnings.map((e) => ({
      id: String(e._id),
      sourceType: e.sourceType,
      sourceId: e.sourceId,
      paidPath: e.paidPath,
      creatorShareMicroUsdc: e.creatorShareMicroUsdc,
      creatorShareUsd: (e.creatorShareMicroUsdc ?? 0) / 1_000_000,
      status: e.status,
      payoutTxSignature: e.payoutTxSignature,
      createdAt: e.createdAt,
    })),
  };
}

/**
 * Record direct skill earning when payment settled to creator payTo (100% to creator).
 * @param {{
 *   skillId: string;
 *   creatorAnonymousId: string;
 *   paidPath: string;
 *   amountMicroUsdc: number;
 *   payoutTxSignature?: string | null;
 * }} opts
 */
export async function recordDirectSkillEarning(opts) {
  if (!isMongooseConnected()) return null;
  const { skillId, creatorAnonymousId, paidPath, amountMicroUsdc, payoutTxSignature } = opts;

  const wallet = await AgentWallet.findOne({ anonymousId: creatorAnonymousId }).lean();
  const gross = Math.max(0, Math.floor(amountMicroUsdc));

  try {
    return await SkillEarning.create({
      creatorAnonymousId,
      creatorWallet: wallet?.walletAddress ?? wallet?.agentAddress ?? null,
      sourceType: 'skill',
      sourceId: skillId,
      paidPath,
      amountMicroUsdc: gross,
      creatorShareMicroUsdc: gross,
      platformFeeMicroUsdc: 0,
      status: 'paid',
      payoutTxSignature: payoutTxSignature ?? null,
      paidAt: new Date(),
    });
  } catch {
    return null;
  }
}

/**
 * Mark pending earnings as paid (treasury-gated payout stub — wire Tempo/SOL payout in ops).
 * @param {{ creatorAnonymousId: string; maxPayoutMicroUsdc?: number }} opts
 */
export async function processEarnPayout(opts) {
  if (!isMongooseConnected()) {
    return { success: false, error: 'Database not connected' };
  }

  const { creatorAnonymousId, maxPayoutMicroUsdc = 1_000_000_000 } = opts;
  const pending = await SkillEarning.find({
    creatorAnonymousId,
    status: 'pending',
  })
    .sort({ createdAt: 1 })
    .lean();

  let total = 0;
  const ids = [];
  for (const e of pending) {
    const share = e.creatorShareMicroUsdc ?? 0;
    if (total + share > maxPayoutMicroUsdc) break;
    total += share;
    ids.push(e._id);
  }

  if (ids.length === 0) {
    return { success: false, error: 'No pending earnings to payout' };
  }

  await SkillEarning.updateMany(
    { _id: { $in: ids } },
    {
      $set: {
        status: 'paid',
        paidAt: new Date(),
        payoutTxSignature: `earn-payout-${Date.now()}`,
      },
    },
  );

  return {
    success: true,
    data: {
      creatorAnonymousId,
      paidMicroUsdc: total,
      paidUsd: total / 1_000_000,
      count: ids.length,
      note: 'Payout recorded — wire on-chain settlement via treasury broker / Tempo in production ops.',
    },
  };
}
