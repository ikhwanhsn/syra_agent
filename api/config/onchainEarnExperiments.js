/**
 * Onchain earn experiments — intervals, evolution, and real gates live in code.
 * Flip `realEnabled` here when a paper lab graduates; no env sprawl required.
 *
 * Optional overrides (rarely needed):
 *   EARN_EXPERIMENT_CRON_SECRET — shared cron auth for all three paper+real routes
 */

export const EARN_EXPERIMENT_CRON = Object.freeze({
  /** Shared secret for POST /cron/* on momentum / lst-loop / sniper (paper + real). Empty = open. */
  secretEnv: 'EARN_EXPERIMENT_CRON_SECRET',
});

export const MOMENTUM_CRON = Object.freeze({
  paperSignalMs: 300_000,
  paperResolveMs: 120_000,
  realSignalMs: 300_000,
  realResolveMs: 120_000,
  /** Paper cron always on. Real opens only when true. */
  realEnabled: false,
  evolution: Object.freeze({
    enabled: true,
    intervalMs: 86_400_000,
    removeCount: 2,
    minDecided: 5,
  }),
});

export const LST_LOOP_CRON = Object.freeze({
  paperSignalMs: 600_000,
  paperResolveMs: 300_000,
  realSignalMs: 600_000,
  realResolveMs: 300_000,
  /** Paper graduated (≥50 decided, net+). Lab only — public Earn still gated by adapter readiness. */
  realEnabled: true,
  /** Optional Rise market address; empty = auto-pick from riseGetMarkets. */
  riseMarketAddress: '',
  evolution: Object.freeze({
    enabled: true,
    intervalMs: 86_400_000,
    removeCount: 2,
    minDecided: 5,
  }),
});

export const SNIPER_CRON = Object.freeze({
  paperSignalMs: 180_000,
  paperResolveMs: 90_000,
  realSignalMs: 180_000,
  realResolveMs: 90_000,
  realEnabled: false,
  evolution: Object.freeze({
    enabled: true,
    intervalMs: 86_400_000,
    removeCount: 2,
    minDecided: 5,
  }),
});

export const MERIDIAN_CRON = Object.freeze({
  paperSignalMs: 90_000,
  paperResolveMs: 45_000,
  realSignalMs: 120_000,
  realResolveMs: 45_000,
  realEnabled: true, // cron loop on, but agents start disabled
  evolution: Object.freeze({
    enabled: true,
    intervalMs: 45 * 60_000, // 45 min — fast autolearn
    removeCount: 3,
    minDecided: 3,
  }),
});

/**
 * Live Meridian engine (yunus-0x/meridian) managed as a Syra child process.
 * When enabled, the engine owns trading; Syra only syncs state into MeridianReal*.
 */
export const MERIDIAN_ENGINE = Object.freeze({
  /** Master gate for spawning the external engine. */
  enabled: true,
  /** How often Syra mirrors engine state.json into Mongo. */
  syncMs: 30_000,
  /** Relative path from Syra repo root to the engine cwd. */
  repoRelPath: 'reference/meridian',
  entry: 'index.js',
  /** Soft capital guidance shown in UI (true cap = wallet balance + maxDeployAmount). */
  capSol: 1,
  maxPositions: 2,
  deployAmountSol: 0.3,
  maxDeployAmount: 0.5,
  /** Restart backoff when the child exits while MeridianRealConfig.enabled. */
  restartBackoffMs: 5_000,
  maxRestarts: 20,
});

/**
 * Delphi — Polymarket smart-money mirror into Jupiter Solana spot.
 * Paper cron on; real layer stays off until paper graduation.
 */
export const DELPHI_CRON = Object.freeze({
  paperSignalMs: 12 * 60_000,
  paperResolveMs: 3 * 60_000,
  realSignalMs: 12 * 60_000,
  realResolveMs: 3 * 60_000,
  realEnabled: false,
  evolution: Object.freeze({
    enabled: true,
    intervalMs: 45 * 60_000,
    removeCount: 2,
    minDecided: 5,
  }),
  caps: Object.freeze({
    maxPositionSol: 0.3,
    maxConcurrentPositions: 2,
    maxPositionUsd: 50,
  }),
});

/**
 * AyeLabs — GMGN V/L radar desk (paper + gated real, no external engine child).
 * Paper signal interval matches gmgn-vl-radar cron (every 5 minutes).
 */
export const AYE_LABS_CRON = Object.freeze({
  paperSignalMs: 300_000,
  paperResolveMs: 45_000,
  realSignalMs: 300_000,
  realResolveMs: 45_000,
  /** Cron loop may run; agents start disabled until enable. */
  realEnabled: true,
  evolution: Object.freeze({
    enabled: true,
    intervalMs: 45 * 60_000,
    removeCount: 3,
    minDecided: 3,
  }),
  /** Hard caps for the real layer (no AYE_LABS_ENGINE child process). */
  caps: Object.freeze({
    capSol: 1,
    maxPositions: 2,
    deployAmountSol: 0.3,
    maxDeployAmount: 0.5,
    dailyMaxLossSol: 0.5,
  }),
});

/**
 * Shared cron-secret middleware factory for the three experiments.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export function requireEarnExperimentCronSecret(req, res, next) {
  const secret = String(process.env[EARN_EXPERIMENT_CRON.secretEnv] || '').trim();
  if (!secret) return next();
  const got = String(
    req.get('x-earn-experiment-secret') ||
      req.get('x-momentum-experiment-secret') ||
      req.get('x-lst-loop-experiment-secret') ||
      req.get('x-sniper-experiment-secret') ||
      req.get('x-meridian-experiment-secret') ||
      req.get('x-ayelabs-experiment-secret') ||
      req.get('x-delphi-experiment-secret') ||
      '',
  ).trim();
  if (got !== secret) {
    return res.status(403).json({ success: false, error: 'Invalid or missing cron secret' });
  }
  return next();
}
