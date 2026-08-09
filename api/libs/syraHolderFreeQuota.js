/**
 * Daily free-call quotas for $SYRA holders/stakers (treasury-paid agent tools).
 */
import SyraHolderFreeQuota from '../models/agent/SyraHolderFreeQuota.js';
import { isMongooseConnected } from '../config/mongoose.js';
import {
  HOLDER_STARTER_DAILY_LIMIT,
  STAKE_T2_DAILY_LIMIT,
  STAKE_T3_DAILY_LIMIT,
  STAKE_BRAIN_DAILY_LIMIT,
  classifyHolderFreeTool,
  resolveSyraHolding,
  nextUtcMidnightIso,
  utilityTiersPublic,
  SYRA_HOLDER_THRESHOLD,
  estimateMonthlySavingsUsd,
  HOLDER_STARTER_TOOL_IDS,
  STAKE_T2_TOOL_IDS,
  STAKE_T3_TOOL_IDS,
  STAKE_BRAIN_TOOL_IDS,
} from './syraHolderBenefits.js';

/**
 * @param {object} doc
 */
function bucketsFromDoc(doc) {
  return {
    starter: {
      limit: HOLDER_STARTER_DAILY_LIMIT,
      used: doc?.starterUsed ?? 0,
      remaining: Math.max(0, HOLDER_STARTER_DAILY_LIMIT - (doc?.starterUsed ?? 0)),
    },
    stakeT2: {
      limit: STAKE_T2_DAILY_LIMIT,
      used: doc?.stakeT2Used ?? 0,
      remaining: Math.max(0, STAKE_T2_DAILY_LIMIT - (doc?.stakeT2Used ?? 0)),
    },
    stakeT3: {
      limit: STAKE_T3_DAILY_LIMIT,
      used: doc?.stakeT3Used ?? 0,
      remaining: Math.max(0, STAKE_T3_DAILY_LIMIT - (doc?.stakeT3Used ?? 0)),
    },
    stakeBrain: {
      limit: STAKE_BRAIN_DAILY_LIMIT,
      used: doc?.stakeBrainUsed ?? 0,
      remaining: Math.max(0, STAKE_BRAIN_DAILY_LIMIT - (doc?.stakeBrainUsed ?? 0)),
    },
  };
}

/**
 * Pick the best available bucket for a tool given holding + current usage.
 * Preference: stake-specific → starter (so staking unlocks extra capacity).
 *
 * @param {{ holderEligible: boolean; stakeT2Eligible: boolean; stakeT3Eligible: boolean }} holding
 * @param {ReturnType<typeof bucketsFromDoc>} buckets
 * @param {string} toolId
 * @returns {{ bucket: string; field: string; limit: number } | null}
 */
export function pickFreeBucket(holding, buckets, toolId) {
  const kind = classifyHolderFreeTool(toolId);
  if (!kind) return null;

  if (kind === 'brain' && holding.stakeT3Eligible && buckets.stakeBrain.remaining > 0) {
    return { bucket: 'stake_brain', field: 'stakeBrainUsed', limit: STAKE_BRAIN_DAILY_LIMIT };
  }
  if (kind === 't3' && holding.stakeT3Eligible && buckets.stakeT3.remaining > 0) {
    return { bucket: 'stake_t3', field: 'stakeT3Used', limit: STAKE_T3_DAILY_LIMIT };
  }
  if (kind === 't2' && holding.stakeT2Eligible && buckets.stakeT2.remaining > 0) {
    return { bucket: 'stake_t2', field: 'stakeT2Used', limit: STAKE_T2_DAILY_LIMIT };
  }
  // analytics-summary is t3 for stake bucket but also in starter pack
  if (
    (kind === 'starter' || kind === 't2' || kind === 't3') &&
    holding.holderEligible &&
    buckets.starter.remaining > 0 &&
    classifyHolderFreeTool(toolId) // curated only
  ) {
    // Only starter-list tools can use starter bucket
    const id = String(toolId || '').trim();
    if (HOLDER_STARTER_TOOL_IDS.includes(id)) {
      return { bucket: 'starter', field: 'starterUsed', limit: HOLDER_STARTER_DAILY_LIMIT };
    }
  }
  // brain can fall back to starter only if somehow listed — it is not
  return null;
}

/**
 * @param {string} walletAddress
 */
async function readQuotaDoc(walletAddress) {
  const wallet = walletAddress.trim();
  const dayUtc = new Date().toISOString().slice(0, 10);
  if (!isMongooseConnected()) {
    return { dayUtc, doc: null };
  }
  try {
    const _id = `${wallet}:${dayUtc}`;
    const doc = await SyraHolderFreeQuota.findById(_id).lean();
    return { dayUtc, doc };
  } catch (e) {
    console.error('[syraHolderFreeQuota] read failed:', e?.message || e);
    return { dayUtc, doc: null };
  }
}

/**
 * Public status for UI /rewards and /token.
 * @param {string} walletAddress
 * @param {{ lifetimeSpendUsd?: number }} [opts]
 */
export async function getHolderBenefitsStatus(walletAddress, opts = {}) {
  const holding = await resolveSyraHolding(walletAddress);
  const { dayUtc, doc } = holding.wallet ? await readQuotaDoc(holding.wallet) : { dayUtc: new Date().toISOString().slice(0, 10), doc: null };
  const buckets = bucketsFromDoc(doc);
  const totalRemaining =
    (holding.holderEligible ? buckets.starter.remaining : 0) +
    (holding.stakeT2Eligible ? buckets.stakeT2.remaining : 0) +
    (holding.stakeT3Eligible ? buckets.stakeT3.remaining + buckets.stakeBrain.remaining : 0);

  const spend30d = Number(opts.lifetimeSpendUsd) || 0;
  // Approximate 30d from lifetime when we lack a window; UI can refine later
  const estimatedSavingsUsd = estimateMonthlySavingsUsd(spend30d, holding.discount);

  return {
    wallet: holding.wallet,
    balance: holding.balance,
    staked: holding.staked,
    syraAmount: holding.syraAmount,
    tier: holding.tier,
    discount: holding.discount,
    discountPct: Math.round((holding.discount || 0) * 100),
    holderEligible: holding.holderEligible,
    holderThreshold: SYRA_HOLDER_THRESHOLD,
    rewardMultiplier: holding.rewardMultiplier,
    stakeT2Eligible: holding.stakeT2Eligible,
    stakeT3Eligible: holding.stakeT3Eligible,
    dayUtc,
    resetAt: nextUtcMidnightIso(),
    holder_quota_remaining: totalRemaining,
    buckets: {
      starter: {
        ...buckets.starter,
        eligible: holding.holderEligible,
        tools: [...HOLDER_STARTER_TOOL_IDS],
        label: 'Free Agent Starter Pack',
      },
      stakeT2: {
        ...buckets.stakeT2,
        eligible: holding.stakeT2Eligible,
        tools: [...STAKE_T2_TOOL_IDS],
        label: 'Stake Tier-2 intel',
        minStake: 100_000,
      },
      stakeT3: {
        ...buckets.stakeT3,
        eligible: holding.stakeT3Eligible,
        tools: [...STAKE_T3_TOOL_IDS],
        label: 'Stake Tier-3 synthesis',
        minStake: 1_000_000,
      },
      stakeBrain: {
        ...buckets.stakeBrain,
        eligible: holding.stakeT3Eligible,
        tools: [...STAKE_BRAIN_TOOL_IDS],
        label: 'Stake Brain',
        minStake: 1_000_000,
      },
    },
    estimatedSavingsUsd,
    savingsNote:
      spend30d > 0 && holding.discount > 0
        ? `At your tracked spend and ${Math.round(holding.discount * 100)}% discount, ~$${estimatedSavingsUsd.toFixed(2)} in fee relief (approx).`
        : holding.discount > 0
          ? `You get ${Math.round(holding.discount * 100)}% off x402 calls (Solana payers). Make paid calls to see savings.`
          : 'Hold or stake 10k+ $SYRA for x402 fee discounts (Solana payers only).',
    tiers: utilityTiersPublic(),
    solanaOnlyDiscount: true,
  };
}

/**
 * Decide whether treasury may pay this tool call (does not consume).
 * @param {string} walletAddress
 * @param {string} toolId
 */
export async function canTreasuryPayTool(walletAddress, toolId) {
  const holding = await resolveSyraHolding(walletAddress);
  if (!holding.wallet) {
    return { allowed: false, reason: 'wallet_required', holder_quota_remaining: 0 };
  }
  const { doc } = await readQuotaDoc(holding.wallet);
  const buckets = bucketsFromDoc(doc);
  const pick = pickFreeBucket(holding, buckets, toolId);
  if (!pick) {
    const kind = classifyHolderFreeTool(toolId);
    let reason = 'not_eligible';
    if (!kind) reason = 'tool_not_in_free_pack';
    else if (!holding.holderEligible && !holding.stakeT2Eligible && !holding.stakeT3Eligible) {
      reason = 'below_holder_threshold';
    } else reason = 'quota_exhausted';
    const status = await getHolderBenefitsStatus(holding.wallet);
    return {
      allowed: false,
      reason,
      holder_quota_remaining: status.holder_quota_remaining,
      buckets: status.buckets,
      holding,
    };
  }
  const status = await getHolderBenefitsStatus(holding.wallet);
  return {
    allowed: true,
    bucket: pick.bucket,
    field: pick.field,
    limit: pick.limit,
    holder_quota_remaining: status.holder_quota_remaining,
    buckets: status.buckets,
    holding,
  };
}

/**
 * Atomically consume one free slot. Call only when about to treasury-pay.
 * @param {string} walletAddress
 * @param {string} toolId
 */
export async function tryConsumeHolderFreeCall(walletAddress, toolId) {
  const pre = await canTreasuryPayTool(walletAddress, toolId);
  if (!pre.allowed) {
    return { ...pre, consumed: false };
  }

  const wallet = pre.holding.wallet;
  const dayUtc = new Date().toISOString().slice(0, 10);
  const _id = `${wallet}:${dayUtc}`;
  const field = pre.field;
  const limit = pre.limit;

  if (!isMongooseConnected()) {
    // Fail open for local/dev without Mongo — still report remaining from in-memory assumption
    return {
      allowed: true,
      consumed: true,
      bucket: pre.bucket,
      holder_quota_remaining: Math.max(0, (pre.holder_quota_remaining || 1) - 1),
      reason: 'mongo_skip',
    };
  }

  const fieldPath = `$${field}`;
  try {
    const doc = await SyraHolderFreeQuota.findOneAndUpdate(
      { _id },
      [
        {
          $set: {
            _pre: { $ifNull: [fieldPath, 0] },
            wallet,
            dayUtc,
          },
        },
        {
          $set: {
            [field]: {
              $cond: {
                if: { $lt: ['$_pre', limit] },
                then: { $add: ['$_pre', 1] },
                else: '$_pre',
              },
            },
            lastAllowed: { $lt: ['$_pre', limit] },
            lastBucket: {
              $cond: {
                if: { $lt: ['$_pre', limit] },
                then: pre.bucket,
                else: '$lastBucket',
              },
            },
          },
        },
        { $unset: '_pre' },
      ],
      { upsert: true, new: true },
    )
      .lean()
      .exec();

    const allowed = !!doc?.lastAllowed;
    if (!allowed) {
      const status = await getHolderBenefitsStatus(wallet);
      return {
        allowed: false,
        consumed: false,
        reason: 'quota_exhausted',
        holder_quota_remaining: status.holder_quota_remaining,
        buckets: status.buckets,
      };
    }

    const status = await getHolderBenefitsStatus(wallet);
    return {
      allowed: true,
      consumed: true,
      bucket: pre.bucket,
      holder_quota_remaining: status.holder_quota_remaining,
      buckets: status.buckets,
    };
  } catch (e) {
    console.error('[syraHolderFreeQuota] tryConsume failed:', e?.message || e);
    // Fail closed on consume errors in production-ish paths: do not treasury-pay
    return {
      allowed: false,
      consumed: false,
      reason: 'quota_error',
      holder_quota_remaining: pre.holder_quota_remaining ?? 0,
    };
  }
}
