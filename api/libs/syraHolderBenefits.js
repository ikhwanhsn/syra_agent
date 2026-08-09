/**
 * $SYRA holder free benefits: curated starter pack, stake-only intel quotas,
 * reward point multipliers, and expensive-tool denylist for treasury pay.
 */
import {
  SYRA_HOLDER_THRESHOLD,
  SYRA_UTILITY_TIERS,
  getSyraBalance,
  resolveUtilityTierFromAmount,
} from './syraToken.js';
import { getActiveStakedSyra } from './syraStakingEligibility.js';

/** Curated tools treasury may pay for Silver+ (hold or stake ≥ threshold). */
export const HOLDER_STARTER_TOOL_IDS = Object.freeze([
  'news',
  'sentiment',
  'signal',
  'analytics-summary',
  'health',
]);

/** Stake ≥100k: Tier-2 intel free quota. */
export const STAKE_T2_TOOL_IDS = Object.freeze(['news', 'sentiment', 'signal']);

/** Stake ≥1M: Tier-3 deep synthesis free quota. */
export const STAKE_T3_TOOL_IDS = Object.freeze(['analytics-summary']);

/** Stake ≥1M: Brain free quota (agent tool id or path-based). */
export const STAKE_BRAIN_TOOL_IDS = Object.freeze(['brain', 'syra-brain']);

export const HOLDER_STARTER_DAILY_LIMIT =
  Number(process.env.SYRA_HOLDER_STARTER_DAILY_LIMIT) > 0
    ? Math.floor(Number(process.env.SYRA_HOLDER_STARTER_DAILY_LIMIT))
    : 25;

export const STAKE_T2_DAILY_LIMIT =
  Number(process.env.SYRA_STAKE_T2_DAILY_LIMIT) > 0
    ? Math.floor(Number(process.env.SYRA_STAKE_T2_DAILY_LIMIT))
    : 10;

export const STAKE_T3_DAILY_LIMIT =
  Number(process.env.SYRA_STAKE_T3_DAILY_LIMIT) > 0
    ? Math.floor(Number(process.env.SYRA_STAKE_T3_DAILY_LIMIT))
    : 3;

export const STAKE_BRAIN_DAILY_LIMIT =
  Number(process.env.SYRA_STAKE_BRAIN_DAILY_LIMIT) > 0
    ? Math.floor(Number(process.env.SYRA_STAKE_BRAIN_DAILY_LIMIT))
    : 1;

export const STAKE_T2_THRESHOLD = 100_000;
export const STAKE_T3_THRESHOLD = 1_000_000;

/** Prefixes / ids that must never be treasury-paid (high COGS passthroughs). */
const EXPENSIVE_TOOL_PREFIXES = Object.freeze([
  'nansen-',
  'birdeye-',
  'zerion-',
  'blocksize-',
  'openrouter-',
  'stablesocial-',
  'stableenrich-',
  'dexter-',
  'purch-',
  'bankr-',
  'x-analyzer',
  'paysh-',
]);

const EXPENSIVE_TOOL_IDS = Object.freeze(
  new Set([
    'nansen-smart-money-netflow',
    'images',
    'image',
    'video',
    'chat-completion',
  ]),
);

/**
 * @param {string | null | undefined} toolId
 * @returns {boolean}
 */
export function isExpensivePassthroughTool(toolId) {
  const id = String(toolId || '').trim().toLowerCase();
  if (!id) return true;
  if (EXPENSIVE_TOOL_IDS.has(id)) return true;
  return EXPENSIVE_TOOL_PREFIXES.some((p) => id.startsWith(p) || id.includes(p));
}

/**
 * @param {string | null | undefined} toolId
 * @returns {boolean}
 */
export function isHolderStarterTool(toolId) {
  const id = String(toolId || '').trim();
  return HOLDER_STARTER_TOOL_IDS.includes(id) && !isExpensivePassthroughTool(id);
}

/**
 * @param {string | null | undefined} toolId
 * @returns {'brain' | 't3' | 't2' | 'starter' | null}
 */
export function classifyHolderFreeTool(toolId) {
  const id = String(toolId || '').trim();
  if (!id || isExpensivePassthroughTool(id)) return null;
  if (STAKE_BRAIN_TOOL_IDS.includes(id)) return 'brain';
  if (STAKE_T3_TOOL_IDS.includes(id)) return 't3';
  if (STAKE_T2_TOOL_IDS.includes(id)) return 't2';
  if (HOLDER_STARTER_TOOL_IDS.includes(id)) return 'starter';
  return null;
}

/**
 * Reward points multiplier from max(balance, stake).
 * @param {number} syraAmount
 * @returns {number}
 */
export function resolveRewardMultiplier(syraAmount) {
  const n = Number(syraAmount) || 0;
  if (n >= 1_000_000) return 1.25;
  if (n >= SYRA_HOLDER_THRESHOLD) return 1.1;
  return 1;
}

/**
 * Resolve balance + stake + tier for a Solana wallet.
 * @param {string} walletAddress
 */
export async function resolveSyraHolding(walletAddress) {
  const wallet = typeof walletAddress === 'string' ? walletAddress.trim() : '';
  if (!wallet || wallet.startsWith('0x')) {
    return {
      wallet: wallet || null,
      balance: 0,
      staked: 0,
      syraAmount: 0,
      tier: null,
      holderEligible: false,
      stakeT2Eligible: false,
      stakeT3Eligible: false,
      discount: 0,
      rewardMultiplier: 1,
    };
  }

  const [bal, staked] = await Promise.all([
    getSyraBalance(wallet),
    getActiveStakedSyra(wallet),
  ]);
  const balance = Number(bal?.balance) || 0;
  const stakedAmount = Number(staked?.amount) || 0;
  const syraAmount = Math.max(balance, stakedAmount);
  const tier = resolveUtilityTierFromAmount(syraAmount);
  return {
    wallet,
    balance,
    staked: stakedAmount,
    syraAmount,
    tier: tier?.id ?? null,
    holderEligible: syraAmount >= SYRA_HOLDER_THRESHOLD,
    stakeT2Eligible: stakedAmount >= STAKE_T2_THRESHOLD,
    stakeT3Eligible: stakedAmount >= STAKE_T3_THRESHOLD,
    discount: tier?.discount ?? 0,
    rewardMultiplier: resolveRewardMultiplier(syraAmount),
  };
}

/**
 * Hold or stake ≥ SYRA_HOLDER_THRESHOLD → free starter eligibility.
 * @param {string} walletAddress
 */
export async function isSyraHolderOrStakerEligible(walletAddress) {
  const h = await resolveSyraHolding(walletAddress);
  return h.holderEligible;
}

/**
 * Estimated monthly savings from discount at a given spend level.
 * @param {number} spendUsd30d
 * @param {number} discount
 */
export function estimateMonthlySavingsUsd(spendUsd30d, discount) {
  const spend = Number(spendUsd30d) || 0;
  const d = Number(discount) || 0;
  if (!(spend > 0) || !(d > 0)) return 0;
  // If they paid discounted prices, gross ≈ paid / (1-d); savings ≈ gross - paid
  const gross = spend / (1 - d);
  return Math.round((gross - spend) * 100) / 100;
}

export function nextUtcMidnightIso() {
  const now = new Date();
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  return next.toISOString();
}

export function utilityTiersPublic() {
  return SYRA_UTILITY_TIERS.map((t) => ({
    id: t.id,
    min: t.min,
    discount: t.discount,
    label: t.label,
  }));
}

export {
  SYRA_HOLDER_THRESHOLD,
  SYRA_UTILITY_TIERS,
};
