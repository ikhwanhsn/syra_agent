/**
 * Shared helpers for multi-strategy paper earn experiments.
 */
export function toNum(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function newCohortId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(16).slice(2, 8)}`;
}

export function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

/**
 * Risk-adjusted evolution score shared across earn desks.
 * Prefer positive PnL with enough samples, penalize expiry-heavy / clone strategies.
 *
 * @param {{
 *   sumPnl?: number,
 *   winRate?: number|null,
 *   decided?: number,
 *   wins?: number,
 *   losses?: number,
 *   expired?: number,
 *   diversityBonus?: number,
 *   clonePenalty?: number,
 *   drawdownPct?: number,
 * }} row
 */
export function computeRiskAdjustedLeaderScore(row = {}) {
  const decided = toNum(row.decided);
  const sumPnl = toNum(row.sumPnl);
  const wins = toNum(row.wins);
  const losses = toNum(row.losses);
  const expired = toNum(row.expired);
  if (decided <= 0) return -999;
  if (sumPnl <= 0) {
    // Still rank underwater strategies for cull ordering (more negative = worse).
    const sampleFactor = Math.min(1, decided / 12);
    return -100 - Math.log1p(Math.abs(sumPnl)) * (0.5 + sampleFactor * 0.5)
      - toNum(row.clonePenalty) * 20
      + toNum(row.diversityBonus) * 5;
  }
  const winRate = row.winRate != null ? toNum(row.winRate) : decided > 0 ? wins / decided : 0;
  const expiryShare = decided > 0 ? expired / decided : 0;
  const sampleFactor = Math.min(1, decided / 12);
  const winFactor = Math.max(0, Math.min(1, (winRate - 0.35) / 0.55));
  const pnlFactor = Math.log1p(Math.max(0, sumPnl) * 0.012);
  const expiryPenalty = expiryShare * 0.35;
  const drawdownPenalty = Math.min(0.4, Math.max(0, toNum(row.drawdownPct)) / 100);
  const diversityBonus = Math.max(0, toNum(row.diversityBonus));
  const clonePenalty = Math.max(0, toNum(row.clonePenalty));
  return (
    pnlFactor * (0.45 + winFactor * 0.55) * (0.3 + sampleFactor * 0.7)
    * (1 - expiryPenalty)
    * (1 - drawdownPenalty)
    * (1 - Math.min(0.5, clonePenalty))
    * (1 + Math.min(0.25, diversityBonus))
  );
}

/**
 * Aggregate per-strategy stats from runs collection.
 */
export async function aggregateStrategyStats(RunModel, experimentId) {
  if (!experimentId) return [];
  const rows = await RunModel.aggregate([
    { $match: { experimentId } },
    {
      $group: {
        _id: '$strategyId',
        strategyName: { $last: '$strategyName' },
        wins: { $sum: { $cond: [{ $eq: ['$status', 'win'] }, 1, 0] } },
        losses: { $sum: { $cond: [{ $eq: ['$status', 'loss'] }, 1, 0] } },
        expired: { $sum: { $cond: [{ $eq: ['$status', 'expired'] }, 1, 0] } },
        openPositions: { $sum: { $cond: [{ $eq: ['$status', 'open'] }, 1, 0] } },
        sumPnlUsd: {
          $sum: {
            $cond: [
              { $in: ['$status', ['win', 'loss', 'expired']] },
              { $ifNull: ['$simPnlUsd', 0] },
              0,
            ],
          },
        },
        avgPnlPct: { $avg: '$simPnlPct' },
      },
    },
  ]);
  return rows.map((r) => {
    const decided = toNum(r.wins) + toNum(r.losses) + toNum(r.expired);
    const wins = toNum(r.wins);
    const losses = toNum(r.losses);
    const expired = toNum(r.expired);
    const sumPnlUsd = toNum(r.sumPnlUsd);
    const winRate = decided > 0 ? wins / decided : null;
    return {
      strategyId: r._id,
      strategyName: r.strategyName,
      wins,
      losses,
      expired,
      decided,
      openPositions: toNum(r.openPositions),
      winRate,
      sumPnlUsd,
      avgPnlPct: toNum(r.avgPnlPct),
      leaderScore: computeRiskAdjustedLeaderScore({
        sumPnl: sumPnlUsd,
        winRate,
        decided,
        wins,
        losses,
        expired,
      }),
    };
  });
}

/**
 * Simple evolution: remove worst evolvable strategies, spawn mutations from elites.
 */
export async function runSimpleEvolution({
  RunModel,
  OverrideModel,
  StateModel,
  resolveStrategies,
  invalidateCache,
  staticCount,
  evolvableMin,
  evolvableMax,
  maxStrategies,
  removeCount = 2,
  spawnCount = 2,
  minDecided = 5,
  mutateFn,
}) {
  const state = await StateModel.findById('singleton').lean();
  const experimentId = state?.activeExperimentId;
  if (!experimentId) return { removed: 0, spawned: 0 };

  const stats = await aggregateStrategyStats(RunModel, experimentId);
  const strategies = await resolveStrategies();
  const byId = new Map(strategies.map((s) => [s.id, s]));

  const ranked = stats
    .filter((s) => s.decided >= minDecided && s.strategyId >= evolvableMin)
    .sort((a, b) => a.leaderScore - b.leaderScore);

  let removed = 0;
  for (const row of ranked.slice(0, removeCount)) {
    await OverrideModel.deleteOne({ strategyId: row.strategyId });
    removed += 1;
  }

  // Prefer profitable elites; if none exist, bootstrap from least-bad experienced parents
  // so desks like momentum are not stuck forever with empty overrides.
  let elites = stats
    .filter((s) => s.decided >= minDecided && s.sumPnlUsd > 0)
    .sort((a, b) => b.leaderScore - a.leaderScore)
    .slice(0, 5);
  if (elites.length === 0) {
    elites = stats
      .filter((s) => s.decided >= Math.max(1, Math.min(minDecided, 3)))
      .sort((a, b) => b.leaderScore - a.leaderScore)
      .slice(0, 3);
  }

  const usedIds = new Set((await resolveStrategies()).map((s) => s.id));
  let spawned = 0;
  for (let i = 0; i < spawnCount && usedIds.size < maxStrategies; i += 1) {
    if (elites.length === 0 || !mutateFn) break;
    const elite = elites[i % elites.length];
    const parent = byId.get(elite.strategyId);
    if (!parent) continue;
    let newId = null;
    for (let id = evolvableMin; id <= evolvableMax; id += 1) {
      if (!usedIds.has(id)) {
        newId = id;
        break;
      }
    }
    if (newId == null) break;
    const mutated = mutateFn(parent, newId);
    await OverrideModel.findOneAndUpdate(
      { strategyId: newId },
      { $set: mutated },
      { upsert: true },
    );
    usedIds.add(newId);
    spawned += 1;
  }

  if (invalidateCache) invalidateCache();
  return { removed, spawned, experimentId };
}
