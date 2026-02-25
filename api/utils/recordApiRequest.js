/**
 * Record an API request for insights (volume, errors, latency).
 * Fire-and-forget: never throws; errors are swallowed so response is not blocked.
 * @param {object} req - Express request (path, method)
 * @param {object} res - Express response (statusCode set when finished)
 * @param {number} durationMs - Elapsed time in ms
 * @param {{ source?: string, paid?: boolean }} [options]
 */
import ApiRequestLog from '../models/ApiRequestLog.js';

export async function recordApiRequest(req, res, durationMs, options = {}) {
  if (!req?.path) return;
  try {
    const statusCode = typeof res.statusCode === 'number' ? res.statusCode : 200;
    await ApiRequestLog.create({
      path: req.path,
      method: (req.method || 'GET').toUpperCase(),
      statusCode,
      durationMs: Math.round(durationMs),
      source: options.source || 'api',
      paid: options.paid === true,
    });
  } catch {
    // Fire-and-forget
  }
}
