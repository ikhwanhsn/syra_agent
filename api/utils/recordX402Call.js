/**
 * Fire-and-forget x402 call telemetry. Never throws — payment flows must not be blocked.
 */
import X402CallLog from '../models/X402CallLog.js';

const MAX_ERROR_LEN = 300;
const MAX_PATH_LEN = 200;

/**
 * Sanitize error strings for storage (strip secrets, truncate).
 * @param {unknown} err
 * @returns {string|null}
 */
export function sanitizeX402Error(err) {
  if (err == null) return null;
  let msg = typeof err === 'string' ? err : err instanceof Error ? err.message : String(err);
  msg = msg.replace(/Bearer\s+\S+/gi, 'Bearer [redacted]');
  msg = msg.replace(/api[_-]?key[=:]\s*\S+/gi, 'api_key=[redacted]');
  msg = msg.trim();
  if (!msg) return null;
  return msg.length > MAX_ERROR_LEN ? `${msg.slice(0, MAX_ERROR_LEN)}…` : msg;
}

/**
 * Parse URL into host + path for logging.
 * @param {string} url
 * @returns {{ host: string|null; path: string }}
 */
export function parseUrlForX402Log(url) {
  if (typeof url !== 'string' || !url.trim()) {
    return { host: null, path: '/' };
  }
  try {
    const u = new URL(url);
    const path = (u.pathname || '/').slice(0, MAX_PATH_LEN);
    return { host: u.hostname || null, path };
  } catch {
    const path = url.startsWith('/') ? url.slice(0, MAX_PATH_LEN) : `/${url.slice(0, MAX_PATH_LEN)}`;
    return { host: null, path };
  }
}

/**
 * Resolve facilitator label from inbound req.x402Payment context.
 * @param {object} req
 * @returns {string|null}
 */
export function resolveInboundFacilitator(req) {
  const xp = req?.x402Payment;
  if (!xp) return null;
  if (xp.useAlgorandFacilitator) return 'algorand';
  if (xp.useB402Facilitator) return 'b402';
  if (xp.useOkxFacilitator) return 'okx';
  if (xp.resourceServerProfile === 'corbits') return 'corbits';
  if (xp.resourceServerProfile === 'dexter') return 'dexter';
  if (xp.resourceServerProfile === 'celo') return 'celo';
  if (xp.resourceServerProfile === 'payai') return 'payai';
  // Labs header path may settle Celo before resourceServerProfile is mirrored
  const labChain = String(req?.get?.('x-lab-x402-chain') || '')
    .trim()
    .toLowerCase();
  if (labChain === 'celo') return 'celo';
  return null;
}

/**
 * @param {object} event
 * @param {'inbound'|'outbound'} event.direction
 * @param {string} event.path
 * @param {string} [event.host]
 * @param {string} [event.method]
 * @param {string} event.outcome
 * @param {number} [event.httpStatus]
 * @param {string} [event.network]
 * @param {string} [event.facilitator]
 * @param {number} [event.amountUsd]
 * @param {string|number} [event.amountMicroUsdc]
 * @param {string} [event.payer]
 * @param {string} [event.agentId]
 * @param {string} [event.source]
 * @param {number} [event.latencyMs]
 * @param {number} [event.retries]
 * @param {unknown} [event.errorReason]
 * @param {string} [event.txSignature]
 */
export async function recordX402Call(event) {
  if (!event?.direction || !event?.path || !event?.outcome) return;
  try {
    const doc = {
      direction: event.direction,
      path: String(event.path).slice(0, MAX_PATH_LEN),
      host: event.host ? String(event.host).slice(0, 120) : null,
      method: event.method ? String(event.method).toUpperCase().slice(0, 10) : 'GET',
      outcome: event.outcome,
      httpStatus: Number.isFinite(event.httpStatus) ? event.httpStatus : null,
      network: event.network ? String(event.network) : null,
      facilitator: event.facilitator || null,
      amountUsd: Number.isFinite(event.amountUsd) && event.amountUsd > 0 ? event.amountUsd : 0,
      amountMicroUsdc: event.amountMicroUsdc != null ? String(event.amountMicroUsdc) : null,
      payer: event.payer ? String(event.payer).slice(0, 64) : null,
      agentId: event.agentId ? String(event.agentId).slice(0, 64) : null,
      source: event.source || (event.direction === 'outbound' ? 'agent' : 'api'),
      latencyMs: Number.isFinite(event.latencyMs) && event.latencyMs >= 0 ? Math.round(event.latencyMs) : 0,
      retries: Number.isFinite(event.retries) && event.retries >= 0 ? event.retries : 0,
      errorReason: sanitizeX402Error(event.errorReason),
      txSignature: event.txSignature ? String(event.txSignature).slice(0, 128) : null,
    };
    await X402CallLog.create(doc);
  } catch {
    // Fire-and-forget
  }
}

/**
 * Record outbound x402 call from agent client result.
 * @param {object} params
 */
export function recordOutboundX402Call(params) {
  const {
    url,
    method = 'GET',
    agentId = null,
    result,
    httpStatus = null,
    latencyMs = 0,
    retries = 0,
    startTime,
  } = params;

  const { host, path } = parseUrlForX402Log(url);
  const elapsed = startTime ? Date.now() - startTime : latencyMs;

  let outcome = 'error';
  if (result?.success) {
    outcome = 'paid';
  } else if (result?.budgetExceeded) {
    outcome = 'budget_exceeded';
  } else if (httpStatus === 402) {
    outcome = 'upstream_error';
  } else if (httpStatus != null && httpStatus >= 400) {
    outcome = 'upstream_error';
  }

  recordX402Call({
    direction: 'outbound',
    path,
    host,
    method,
    outcome,
    httpStatus,
    facilitator: 'upstream',
    agentId,
    source: 'agent',
    latencyMs: elapsed,
    retries,
    errorReason: result?.success ? null : result?.error,
  }).catch(() => {});
}
