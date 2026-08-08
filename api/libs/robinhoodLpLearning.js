/**
 * Robinhood LP online learning — update pool multipliers from every closed paper trade.
 */
import RobinhoodLpLearningState from "../models/RobinhoodLpLearningState.js";

const GLOBAL_ID = "singleton";
const COOLDOWN_HOURS = 12;
const COOLDOWN_LOSS_STREAK = 3;

function toNum(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function normalizePoolKey(poolAddress) {
  return String(poolAddress || "").trim().toLowerCase();
}

/**
 * @param {number} winRate
 * @param {number} sampleSize
 * @param {number} avgNetPnlUsd
 */
export function deriveRobinhoodPoolScoreMultiplier(winRate, sampleSize, avgNetPnlUsd = 0) {
  if (sampleSize < 2) return 1;
  let mult = 1;
  if (winRate >= 0.65) mult = clamp(1.08 + (winRate - 0.5) * 0.6, 1.08, 1.3);
  else if (winRate >= 0.55) mult = clamp(1.02 + (winRate - 0.5) * 0.4, 1.02, 1.15);
  else if (winRate < 0.35) mult = clamp(0.4 + winRate, 0.4, 0.7);
  else if (winRate < 0.45) mult = clamp(0.7 + (winRate - 0.35) * 2, 0.7, 0.9);
  // Expectancy haircut when net PnL is underwater despite OK win rate.
  if (avgNetPnlUsd < 0 && sampleSize >= 3) {
    mult = clamp(mult * 0.85, 0.35, 1.15);
  }
  return mult;
}

async function getOrCreateLearningDoc() {
  let doc = await RobinhoodLpLearningState.findById(GLOBAL_ID).lean();
  if (!doc) {
    await RobinhoodLpLearningState.create({
      _id: GLOBAL_ID,
      lessons: [],
      poolStats: {},
      poolCooldowns: [],
      runsAnalyzed: 0,
    });
    doc = await RobinhoodLpLearningState.findById(GLOBAL_ID).lean();
  }
  return doc;
}

/**
 * @param {string} poolAddress
 * @param {{ nowMs?: number }} [opts]
 */
export async function getRobinhoodPoolScoreMultiplier(poolAddress, opts = {}) {
  const key = normalizePoolKey(poolAddress);
  if (!key) return { multiplier: 1, onCooldown: false, reason: null };
  const doc = await getOrCreateLearningDoc();
  const nowMs = opts.nowMs ?? Date.now();
  const cooldown = (doc.poolCooldowns || []).find(
    (c) => normalizePoolKey(c.poolAddress) === key && new Date(c.until).getTime() > nowMs,
  );
  if (cooldown) {
    return { multiplier: 0, onCooldown: true, reason: cooldown.reason || "pool_cooldown" };
  }
  const stat = doc.poolStats?.[key];
  return {
    multiplier: toNum(stat?.scoreMultiplier, 1) || 1,
    onCooldown: false,
    reason: null,
    decided: toNum(stat?.decided),
    winRate: stat?.winRate ?? null,
  };
}

/**
 * Apply one closed paper trade to pool stats (online learning).
 * @param {{
 *   poolAddress: string;
 *   status: string;
 *   simNetPnlUsd?: number | null;
 * }} closed
 */
export async function recordRobinhoodLpClosedTrade(closed) {
  const key = normalizePoolKey(closed?.poolAddress);
  if (!key) return { ok: false, reason: "missing_pool" };
  const status = String(closed.status || "");
  if (!["win", "loss", "expired"].includes(status)) {
    return { ok: false, reason: "not_settled" };
  }

  const doc = await getOrCreateLearningDoc();
  const prev = doc.poolStats?.[key] || {
    decided: 0,
    wins: 0,
    losses: 0,
    expired: 0,
    sumNetPnlUsd: 0,
    winRate: 0,
    avgNetPnlUsd: 0,
    scoreMultiplier: 1,
    consecutiveLosses: 0,
  };

  const wins = toNum(prev.wins) + (status === "win" ? 1 : 0);
  const losses = toNum(prev.losses) + (status === "loss" ? 1 : 0);
  const expired = toNum(prev.expired) + (status === "expired" ? 1 : 0);
  const decided = wins + losses + expired;
  const sumNetPnlUsd = toNum(prev.sumNetPnlUsd) + toNum(closed.simNetPnlUsd);
  const winRate = decided > 0 ? wins / decided : 0;
  const avgNetPnlUsd = decided > 0 ? sumNetPnlUsd / decided : 0;
  const consecutiveLosses =
    status === "loss" ? toNum(prev.consecutiveLosses) + 1 : status === "win" ? 0 : toNum(prev.consecutiveLosses);
  const scoreMultiplier = deriveRobinhoodPoolScoreMultiplier(winRate, decided, avgNetPnlUsd);

  const poolStats = { ...(doc.poolStats || {}) };
  poolStats[key] = {
    decided,
    wins,
    losses,
    expired,
    sumNetPnlUsd,
    winRate,
    avgNetPnlUsd,
    scoreMultiplier,
    consecutiveLosses,
  };

  const lessons = [...(doc.lessons || [])];
  const lesson = `pool ${key.slice(0, 10)}… ${status} → mult ${scoreMultiplier.toFixed(2)} (n=${decided}, wr=${(winRate * 100).toFixed(0)}%)`;
  lessons.unshift(lesson);
  while (lessons.length > 40) lessons.pop();

  let poolCooldowns = (doc.poolCooldowns || []).filter(
    (c) => new Date(c.until).getTime() > Date.now() - 60_000,
  );
  if (consecutiveLosses >= COOLDOWN_LOSS_STREAK) {
    const until = new Date(Date.now() + COOLDOWN_HOURS * 3_600_000);
    poolCooldowns = [
      ...poolCooldowns.filter((c) => normalizePoolKey(c.poolAddress) !== key),
      { poolAddress: key, reason: `consecutive_losses_${consecutiveLosses}`, until },
    ];
  }

  await RobinhoodLpLearningState.findByIdAndUpdate(
    GLOBAL_ID,
    {
      $set: {
        poolStats,
        poolCooldowns,
        lessons,
        lastLearnedAt: new Date(),
        runsAnalyzed: toNum(doc.runsAnalyzed) + 1,
      },
    },
    { upsert: true },
  );

  return { ok: true, poolAddress: key, scoreMultiplier, decided, winRate };
}

/**
 * Batch-load multipliers for a set of pools (one DB read).
 * @param {string[]} poolAddresses
 * @param {{ nowMs?: number }} [opts]
 */
export async function getRobinhoodPoolScoreMultipliers(poolAddresses, opts = {}) {
  const doc = await getOrCreateLearningDoc();
  const nowMs = opts.nowMs ?? Date.now();
  const cooldownKeys = new Set(
    (doc.poolCooldowns || [])
      .filter((c) => new Date(c.until).getTime() > nowMs)
      .map((c) => normalizePoolKey(c.poolAddress)),
  );
  const out = new Map();
  for (const addr of poolAddresses || []) {
    const key = normalizePoolKey(addr);
    if (!key) continue;
    if (cooldownKeys.has(key)) {
      out.set(key, { multiplier: 0, onCooldown: true });
      continue;
    }
    const stat = doc.poolStats?.[key];
    out.set(key, {
      multiplier: toNum(stat?.scoreMultiplier, 1) || 1,
      onCooldown: false,
    });
  }
  return out;
}

export async function resetRobinhoodLpLearningState() {
  await RobinhoodLpLearningState.findByIdAndUpdate(
    GLOBAL_ID,
    {
      $set: {
        lessons: [],
        poolStats: {},
        poolCooldowns: [],
        runsAnalyzed: 0,
        lastLearnedAt: null,
      },
    },
    { upsert: true },
  );
}
