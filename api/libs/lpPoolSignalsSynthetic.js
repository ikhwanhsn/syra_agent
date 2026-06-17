function toNum(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

/** Deterministic pool fingerprint — avoids random sim boosts that mislead real strategy selection. */
function poolFingerprint(pool) {
  const key = String(pool.poolAddress || pool.poolName || "");
  let h = 0;
  for (let i = 0; i < key.length; i += 1) {
    h = (h * 31 + key.charCodeAt(i)) >>> 0;
  }
  return (h % 10_000) / 10_000;
}

/**
 * Pool-derived signals only (no Math.random). Used by sim lab when real signals are disabled.
 */
export function derivePoolSignals(pool) {
  const feeTvl = toNum(pool.feeTvlRatio);
  /** Signal formulas were tuned on Meteora percent points (0.448 = 0.448%/day). */
  const feeTvlPts = feeTvl * 100;
  const tvl = toNum(pool.tvlUsd);
  const vol = toNum(pool.volume24hUsd);
  const fp = poolFingerprint(pool);
  const volTvlRatio = tvl > 0 ? vol / tvl : vol > 0 ? 8 : 0;
  const volatilityScore = Math.max(0, Math.min(1, feeTvlPts * 6 + vol / 400_000 + volTvlRatio * 0.08));
  const organicBase =
    36 + feeTvlPts * 180 + Math.min(24, volTvlRatio * 2.6) + Math.min(8, tvl / 45_000);
  const freshnessScore = Math.max(
    0,
    Math.min(1, Math.min(1, volTvlRatio / 6) * 0.65 + Math.max(0, 1 - tvl / 550_000) * 0.35),
  );
  return {
    organicScore: Math.max(0, Math.min(100, organicBase + fp * 8)),
    holderCount: Math.floor(400 + tvl / 200 + vol / 500),
    mcapUsd: Math.floor(Math.max(120_000, tvl * (5 + fp * 4))),
    smartWalletsPresent: (feeTvlPts > 0.04 || volTvlRatio > 2) && vol > 40_000,
    narrativeScore: Math.max(1, Math.min(10, 4 + feeTvlPts * 12 + fp * 2)),
    studyWinRate: Math.max(0.32, Math.min(0.72, 0.38 + feeTvlPts * 1.6 + fp * 0.12)),
    hiveConsensus: Math.max(0.25, Math.min(0.95, 0.35 + feeTvlPts * 2.5 + fp * 0.2)),
    volatilityScore,
    freshnessScore,
    volTvlRatio,
    priceVsAthPct: Math.max(22, Math.min(92, 38 + volatilityScore * 48 + fp * 14)),
  };
}
