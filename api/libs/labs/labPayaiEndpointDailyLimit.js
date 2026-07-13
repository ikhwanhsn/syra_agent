/**
 * Global daily call budget for PayAI-facilitated Labs x402 endpoints (5–10/day by default).
 * Rolls a random cap once per UTC day per endpoint; atomic consume prevents race overshoot.
 */
import LabPayaiEndpointQuota from '../../models/labs/LabPayaiEndpointQuota.js';

const DEFAULT_MIN = Number(process.env.LAB_PAYAI_DAILY_LIMIT_MIN) || 5;
const DEFAULT_MAX = Number(process.env.LAB_PAYAI_DAILY_LIMIT_MAX) || 10;

function utcDayKey() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * @param {number} value
 * @param {number} lo
 * @param {number} hi
 */
function clampInt(value, lo, hi) {
  return Math.min(hi, Math.max(lo, Math.round(value)));
}

/**
 * @param {number} min
 * @param {number} max
 */
function randomIntInclusive(min, max) {
  const lo = Math.min(min, max);
  const hi = Math.max(min, max);
  return lo + Math.floor(Math.random() * (hi - lo + 1));
}

/**
 * @param {string} endpointId
 * @param {number} [minCap]
 * @param {number} [maxCap]
 * @returns {Promise<{ allowed: boolean; count: number; max: number; min: number; day: string }>}
 */
export async function checkPayaiEndpointDailyBudget(endpointId, minCap = DEFAULT_MIN, maxCap = DEFAULT_MAX) {
  const id = String(endpointId || '').trim();
  const min = clampInt(minCap, 1, 1000);
  const max = clampInt(maxCap, min, 1000);
  const day = utcDayKey();

  let doc = await LabPayaiEndpointQuota.findOne({ endpointId: id, dayUtc: day }).lean();
  if (!doc) {
    const rolled = randomIntInclusive(min, max);
    doc = await LabPayaiEndpointQuota.findOneAndUpdate(
      { endpointId: id, dayUtc: day },
      { $setOnInsert: { endpointId: id, dayUtc: day, count: 0, dailyCap: rolled } },
      { upsert: true, new: true, lean: true },
    );
    if (doc.dailyCap < min || doc.dailyCap > max) {
      const capped = clampInt(doc.dailyCap, min, max);
      doc = await LabPayaiEndpointQuota.findOneAndUpdate(
        { endpointId: id, dayUtc: day },
        { $set: { dailyCap: capped } },
        { new: true, lean: true },
      );
    }
  }

  const count = doc?.count ?? 0;
  const cap = doc?.dailyCap ?? max;
  return {
    allowed: count < cap,
    count,
    max: cap,
    min,
    day,
  };
}

/**
 * @param {string} endpointId
 * @param {number} [minCap]
 * @param {number} [maxCap]
 * @returns {Promise<{ recorded: boolean; count: number; max: number; day: string }>}
 */
export async function recordPayaiEndpointDailyCall(endpointId, minCap = DEFAULT_MIN, maxCap = DEFAULT_MAX) {
  await checkPayaiEndpointDailyBudget(endpointId, minCap, maxCap);
  const id = String(endpointId || '').trim();
  const day = utcDayKey();
  const min = clampInt(minCap, 1, 1000);
  const max = clampInt(maxCap, min, 1000);

  const doc = await LabPayaiEndpointQuota.findOneAndUpdate(
    { endpointId: id, dayUtc: day },
    [
      { $set: { _pre: { $ifNull: ['$count', 0] }, _cap: { $ifNull: ['$dailyCap', max] } } },
      {
        $set: {
          count: {
            $cond: {
              if: { $lt: ['$_pre', '$_cap'] },
              then: { $add: ['$_pre', 1] },
              else: '$_pre',
            },
          },
          recorded: { $lt: ['$_pre', '$_cap'] },
        },
      },
      { $unset: ['_pre', '_cap'] },
    ],
    { upsert: true, new: true },
  ).lean();

  return {
    recorded: doc?.recorded === true,
    count: doc?.count ?? 0,
    max: doc?.dailyCap ?? max,
    day,
  };
}

/**
 * Check-only middleware — rejects when quota exhausted without consuming (402 flow stays safe).
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @param {{ endpointId: string; minCap?: number; maxCap?: number }} opts
 */
export async function payaiEndpointDailyLimitMiddleware(req, res, next, opts) {
  try {
    const budget = await checkPayaiEndpointDailyBudget(opts.endpointId, opts.minCap, opts.maxCap);
    if (!budget.allowed) {
      return res.status(429).json({
        success: false,
        error: 'daily_limit_reached',
        message: `PayAI endpoint daily limit reached (${budget.count}/${budget.max} calls for ${budget.day} UTC). Resets at midnight UTC.`,
        quota: { count: budget.count, max: budget.max, day: budget.day },
      });
    }
    req.payaiEndpointId = opts.endpointId;
    req.payaiEndpointDailyLimits = { minCap: opts.minCap, maxCap: opts.maxCap };
    next();
  } catch (e) {
    return res.status(503).json({
      success: false,
      error: 'quota_check_failed',
      message: e?.message || 'Failed to check daily quota',
    });
  }
}
