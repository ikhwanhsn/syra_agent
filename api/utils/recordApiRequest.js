/**
 * Record an API request for insights (volume, errors, latency).
 * Fire-and-forget: never throws; errors are swallowed so response is not blocked.
 * @param {object} req - Express request (path, method)
 * @param {object} res - Express response (statusCode set when finished)
 * @param {number} durationMs - Elapsed time in ms
 * @param {{ source?: string, paid?: boolean }} [options]
 */
import ApiRequestLog from '../models/ApiRequestLog.js';

const SKIP_PATH_PREFIXES = ['/internal/tester-agent', '/health', '/metrics'];

/**
 * @param {string} [path]
 * @returns {boolean}
 */
function shouldSkipApiRequestPath(path) {
  if (!path) return true;
  return SKIP_PATH_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );
}

/**
 * @returns {number}
 */
function getApiRequestLogSampleRate() {
  const raw = Number(process.env.API_REQUEST_LOG_SAMPLE_RATE);
  if (Number.isFinite(raw) && raw >= 0 && raw <= 1) return raw;
  return 0.1;
}

/**
 * @param {object} req
 * @param {object} res
 * @param {{ paid?: boolean }} [options]
 * @returns {boolean}
 */
export function shouldPersistApiRequest(req, res, options = {}) {
  if (shouldSkipApiRequestPath(req?.path)) return false;

  const statusCode = typeof res.statusCode === 'number' ? res.statusCode : 200;
  if (options.paid === true) return true;
  if (statusCode < 200 || statusCode >= 300) return true;

  const rate = getApiRequestLogSampleRate();
  if (rate >= 1) return true;
  if (rate <= 0) return false;
  return Math.random() < rate;
}

export async function recordApiRequest(req, res, durationMs, options = {}) {
  if (!req?.path) return;
  if (!shouldPersistApiRequest(req, res, options)) return;

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
