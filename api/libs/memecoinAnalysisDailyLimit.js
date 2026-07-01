/**
 * Daily scan quota for Pumpfun memecoin analysis (/agent/tokens/memecoin-analysis).
 * - Default: 3 scans / UTC day (per IP or verified wallet)
 * - ≥1M SYRA staked (Streamflow): 15 / day
 * - ≥10M SYRA staked (Streamflow): unlimited
 */
import MemecoinAnalysisDailyQuota from '../models/agent/MemecoinAnalysisDailyQuota.js';
import { isMongooseConnected } from '../config/mongoose.js';
import { isActiveStakerEligible } from './syraStakingEligibility.js';

export const MEMECOIN_SCAN_LIMIT_DEFAULT = 3;
export const MEMECOIN_SCAN_LIMIT_STAKER = 15;
export const MEMECOIN_SCAN_SYRA_STAKER_THRESHOLD = 1_000_000;
export const MEMECOIN_SCAN_SYRA_WHALE_THRESHOLD = 10_000_000;

/** @deprecated Wallet-balance tier removed; kept for env compat only. */
export const MEMECOIN_SCAN_LIMIT_HOLDER = 15;
/** @deprecated Use whale unlimited tier instead. */
export const MEMECOIN_SCAN_LIMIT_STAKER_LEGACY = 25;
/** @deprecated Use MEMECOIN_SCAN_SYRA_STAKER_THRESHOLD */
export const MEMECOIN_SCAN_SYRA_THRESHOLD = MEMECOIN_SCAN_SYRA_STAKER_THRESHOLD;

const BYPASS_WALLETS_DEFAULT = ['FiejqEgqQ8bxtUJpZMy5p1wVCcejKyy5PgZ4cwmLBvYD'];

function getBypassWalletSet() {
  const set = new Set(BYPASS_WALLETS_DEFAULT);
  const raw = process.env.MEMECOIN_ANALYSIS_DAILY_LIMIT_BYPASS_WALLETS;
  if (raw && typeof raw === 'string') {
    for (const w of raw.split(/[\s,]+/).map((s) => s.trim()).filter(Boolean)) {
      set.add(w);
    }
  }
  return set;
}

function parseLimitEnv(name, fallback) {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return fallback;
  return Math.floor(n);
}

export const SYRA_DEVICE_ID_HEADER = 'x-syra-device-id';

function getClientIp(req) {
  const forwarded = req.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0].trim();
    if (first) return first;
  }
  return req.ip || req.socket?.remoteAddress || 'unknown';
}

/**
 * @param {import('express').Request} req
 * @returns {string | null}
 */
export function resolveDeviceId(req) {
  const raw = req.get(SYRA_DEVICE_ID_HEADER);
  if (typeof raw !== 'string') return null;
  const id = raw.trim();
  if (id.length < 8 || id.length > 64) return null;
  if (!/^[a-zA-Z0-9_-]+$/.test(id)) return null;
  return id;
}

function nextUtcMidnightIso() {
  const now = new Date();
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  return next.toISOString();
}

/**
 * @param {import('express').Request} req
 * @returns {{ ownerKey: string; walletAddress: string | null; verifiedWallet: boolean }}
 */
export function resolveMemecoinScanOwner(req) {
  const deviceId = resolveDeviceId(req);
  const wallet = req.user?.walletAddress?.trim() || null;
  if (wallet) {
    return {
      ownerKey: `wallet:${wallet}`,
      walletAddress: wallet,
      verifiedWallet: true,
      deviceId,
    };
  }
  if (deviceId) {
    return {
      ownerKey: `device:${deviceId}`,
      walletAddress: null,
      verifiedWallet: false,
      deviceId,
    };
  }
  const ip = getClientIp(req);
  return { ownerKey: `ip:${ip}`, walletAddress: null, verifiedWallet: false, deviceId: null };
}

/**
 * @param {string | null | undefined} walletAddress
 * @returns {Promise<{ limit: number; tier: string }>}
 */
export async function resolveMemecoinScanDailyLimit(walletAddress) {
  const defaultLimit = parseLimitEnv('MEMECOIN_SCAN_LIMIT_DEFAULT', MEMECOIN_SCAN_LIMIT_DEFAULT);
  const stakerLimit = parseLimitEnv('MEMECOIN_SCAN_LIMIT_STAKER', MEMECOIN_SCAN_LIMIT_STAKER);

  if (!walletAddress?.trim()) {
    return { limit: defaultLimit, tier: 'free' };
  }

  const wallet = walletAddress.trim();
  const [whaleEligible, stakerEligible] = await Promise.all([
    isActiveStakerEligible(wallet, MEMECOIN_SCAN_SYRA_WHALE_THRESHOLD),
    isActiveStakerEligible(wallet, MEMECOIN_SCAN_SYRA_STAKER_THRESHOLD),
  ]);

  if (whaleEligible) return { limit: 0, tier: 'unlimited' };
  if (stakerEligible) return { limit: stakerLimit, tier: 'staker' };
  return { limit: defaultLimit, tier: 'free' };
}

/**
 * @param {string | null | undefined} walletAddress
 */
export function isMemecoinScanBypassWallet(walletAddress) {
  if (!walletAddress || typeof walletAddress !== 'string') return false;
  return getBypassWalletSet().has(walletAddress.trim());
}

/**
 * @param {string} ownerKey
 * @param {string} dayUtc
 */
async function readUsedCount(ownerKey, dayUtc) {
  if (!isMongooseConnected()) return 0;
  try {
    const _id = `${ownerKey}:${dayUtc}`;
    const doc = await MemecoinAnalysisDailyQuota.findById(_id).select('count').lean();
    return doc?.count ?? 0;
  } catch (e) {
    console.error('[memecoinAnalysisDailyLimit] readUsedCount failed:', e?.message || e);
    return 0;
  }
}

/**
 * Merge guest/device quota into wallet bucket when user connects mid-day.
 * @param {string} fromOwnerKey
 * @param {string} toOwnerKey
 * @param {string} dayUtc
 */
async function migrateMemecoinScanQuota(fromOwnerKey, toOwnerKey, dayUtc) {
  if (!isMongooseConnected() || fromOwnerKey === toOwnerKey) return;
  const fromId = `${fromOwnerKey}:${dayUtc}`;
  const toId = `${toOwnerKey}:${dayUtc}`;
  try {
    const fromDoc = await MemecoinAnalysisDailyQuota.findById(fromId).select('count').lean();
    const fromCount = fromDoc?.count ?? 0;
    if (fromCount <= 0) return;

    const toDoc = await MemecoinAnalysisDailyQuota.findById(toId).select('count').lean();
    const toCount = toDoc?.count ?? 0;
    const merged = Math.max(fromCount, toCount);

    await MemecoinAnalysisDailyQuota.findOneAndUpdate(
      { _id: toId },
      { $set: { count: merged, ownerKey: toOwnerKey, dayUtc } },
      { upsert: true },
    );
  } catch (e) {
    console.error('[memecoinAnalysisDailyLimit] migrateMemecoinScanQuota failed:', e?.message || e);
  }
}

/**
 * @param {import('express').Request} req
 * @returns {Promise<{
 *   limit: number;
 *   used: number;
 *   remaining: number;
 *   tier: string;
 *   resetAt: string;
 *   ownerKey: string;
 *   verifiedWallet: boolean;
 * }>}
 */
export async function getMemecoinAnalysisQuotaStatus(req) {
  const owner = resolveMemecoinScanOwner(req);
  const dayUtc = new Date().toISOString().slice(0, 10);

  if (owner.verifiedWallet && isMemecoinScanBypassWallet(owner.walletAddress)) {
    return {
      limit: 0,
      used: 0,
      remaining: 0,
      tier: 'bypass',
      resetAt: nextUtcMidnightIso(),
      ownerKey: owner.ownerKey,
      verifiedWallet: owner.verifiedWallet,
    };
  }

  const { limit, tier } = await resolveMemecoinScanDailyLimit(
    owner.verifiedWallet ? owner.walletAddress : null,
  );

  if (tier === 'unlimited' || limit === 0) {
    return {
      limit: 0,
      used: 0,
      remaining: 0,
      tier: 'unlimited',
      resetAt: nextUtcMidnightIso(),
      ownerKey: owner.ownerKey,
      verifiedWallet: owner.verifiedWallet,
    };
  }

  const used = await readUsedCount(owner.ownerKey, dayUtc);
  const remaining = limit === 0 ? 0 : Math.max(0, limit - used);

  return {
    limit,
    used,
    remaining,
    tier,
    resetAt: nextUtcMidnightIso(),
    ownerKey: owner.ownerKey,
    verifiedWallet: owner.verifiedWallet,
  };
}

export function buildMemecoinAnalysisDailyLimitMessage(quota) {
  const tierHints = {
    free: 'Stake 1M+ $SYRA for 15 scans/day, or 10M+ $SYRA staked for unlimited scans/day.',
    holder: 'Stake 1M+ $SYRA for 15 scans/day, or 10M+ $SYRA staked for unlimited scans/day.',
    staker: 'Stake 10M+ $SYRA staked for unlimited scans/day.',
    unlimited: '',
    bypass: '',
  };
  const hint = tierHints[quota?.tier] || tierHints.free;
  const lines = [
    `You've used all ${quota?.limit ?? 3} Pumpfun Alpha scans for today (resets at midnight UTC).`,
  ];
  if (hint) lines.push(hint);
  return lines.join(' ');
}

/**
 * Try to consume one scan slot for the current UTC day.
 * @param {import('express').Request} req
 * @returns {Promise<{ allowed: boolean; limit: number; used: number; remaining: number; tier: string; resetAt: string }>}
 */
export async function tryConsumeMemecoinAnalysisScan(req) {
  const owner = resolveMemecoinScanOwner(req);
  const dayUtc = new Date().toISOString().slice(0, 10);

  if (owner.verifiedWallet && owner.deviceId) {
    await migrateMemecoinScanQuota(`device:${owner.deviceId}`, owner.ownerKey, dayUtc);
  }

  const status = await getMemecoinAnalysisQuotaStatus(req);

  if (!owner.verifiedWallet && status.used > 0) {
    return { allowed: false, ...status, remaining: Math.max(0, status.remaining) };
  }

  if (status.tier === 'bypass' || status.tier === 'unlimited' || status.limit === 0) {
    return { allowed: true, ...status };
  }

  if (!isMongooseConnected()) {
    return { allowed: true, ...status };
  }

  const _id = `${owner.ownerKey}:${dayUtc}`;
  const limit = status.limit;

  try {
    const doc = await MemecoinAnalysisDailyQuota.findOneAndUpdate(
      { _id },
      [
        { $set: { _pre: { $ifNull: ['$count', 0] } } },
        {
          $set: {
            count: {
              $cond: {
                if: { $lt: ['$_pre', limit] },
                then: { $add: ['$_pre', 1] },
                else: '$_pre',
              },
            },
            lastScanAllowed: { $lt: ['$_pre', limit] },
            ownerKey: owner.ownerKey,
            dayUtc,
          },
        },
        { $unset: '_pre' },
      ],
      { upsert: true, new: true },
    )
      .lean()
      .exec();

    const allowed = !!doc?.lastScanAllowed;
    const used = doc?.count ?? status.used;
    const remaining = Math.max(0, limit - used);

    return {
      allowed,
      limit,
      used,
      remaining,
      tier: status.tier,
      resetAt: status.resetAt,
    };
  } catch (e) {
    console.error('[memecoinAnalysisDailyLimit] tryConsume failed:', e?.message || e);
    return { allowed: true, ...status };
  }
}
