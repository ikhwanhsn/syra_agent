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
  realEnabled: false,
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
      '',
  ).trim();
  if (got !== secret) {
    return res.status(403).json({ success: false, error: 'Invalid or missing cron secret' });
  }
  return next();
}
