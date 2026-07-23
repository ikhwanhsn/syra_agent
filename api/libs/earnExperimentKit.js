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
    return {
      strategyId: r._id,
      strategyName: r.strategyName,
      wins,
      losses: toNum(r.losses),
      expired: toNum(r.expired),
      decided,
      openPositions: toNum(r.openPositions),
      winRate: decided > 0 ? wins / decided : null,
      sumPnlUsd: toNum(r.sumPnlUsd),
      avgPnlPct: toNum(r.avgPnlPct),
      leaderScore: decided > 0 ? toNum(r.sumPnlUsd) * (0.4 + (wins / decided) * 0.6) : -999,
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

  const elites = stats
    .filter((s) => s.decided >= minDecided && s.sumPnlUsd > 0)
    .sort((a, b) => b.leaderScore - a.leaderScore)
    .slice(0, 5);

  const usedIds = new Set((await resolveStrategies()).map((s) => s.id));
  let spawned = 0;
  for (let i = 0; i < spawnCount && usedIds.size < maxStrategies; i += 1) {
    if (elites.length === 0) break;
    const elite = elites[i % elites.length];
    const parent = byId.get(elite.strategyId);
    if (!parent || !mutateFn) break;
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
