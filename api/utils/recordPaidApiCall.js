/**
 * Record a successful paid API call for KPI tracking.
 * Fire-and-forget: never throws; logs errors so response is not blocked.
 * @param {object} req - Express request (must have req.path)
 * @param {{ source?: string }} [options] - Optional: { source: 'api' | 'agent' }
 */
import PaidApiCall from '../models/PaidApiCall.js';

export async function recordPaidApiCall(req, options = {}) {
  if (!req?.path) return;
  try {
    await PaidApiCall.create({
      path: req.path,
      source: options.source || 'api',
    });
  } catch (err) {
    // Fire-and-forget: log only so payment flow is never broken
    console.error('[recordPaidApiCall]', err?.message || err);
  }
}
