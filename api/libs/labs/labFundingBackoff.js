/**
 * In-memory per-wallet funding backoff for the Labs x402 scheduler.
 * Prevents flooding the call log with repeated (funding) errors when PayTo is underfunded.
 *
 * Keyed by `chain:address` (lowercase). Process-local — resets on restart (acceptable:
 * one fresh log row + alert after deploy is fine).
 */

/** Base cooldown after first failure (30 min). */
export const FUNDING_BACKOFF_BASE_MS = 30 * 60 * 1000;
/** Cap on exponential cooldown (2 hours). */
export const FUNDING_BACKOFF_MAX_MS = 2 * 60 * 60 * 1000;

/**
 * @typedef {{
 *   reason: string;
 *   failCount: number;
 *   cooldownUntil: number;
 *   lastLoggedAt: number;
 * }} FundingBackoffEntry
 */

/** @type {Map<string, FundingBackoffEntry>} */
const stateByKey = new Map();

/**
 * @param {string} chain
 * @param {string} address
 * @returns {string}
 */
function keyFor(chain, address) {
  return `${String(chain || '').trim().toLowerCase()}:${String(address || '').trim().toLowerCase()}`;
}

/**
 * @param {number} failCount
 * @returns {number}
 */
export function computeFundingCooldownMs(failCount) {
  const n = Math.max(1, Math.floor(Number(failCount) || 1));
  const ms = FUNDING_BACKOFF_BASE_MS * Math.pow(2, n - 1);
  return Math.min(FUNDING_BACKOFF_MAX_MS, ms);
}

/**
 * Whether the scheduler should skip a funding attempt for this wallet.
 * @param {string} chain
 * @param {string} address
 * @param {number} [now]
 * @returns {boolean}
 */
export function shouldSkipFundingAttempt(chain, address, now = Date.now()) {
  const c = String(chain || '').trim();
  const a = String(address || '').trim();
  if (!c || !a) return false;
  const entry = stateByKey.get(keyFor(c, a));
  if (!entry) return false;
  return Number(now) < entry.cooldownUntil;
}

/**
 * Record a funding failure. Returns whether this is a new/changed failure that should be logged.
 * Same reason while still in cooldown → not a transition (do not re-log).
 * New reason or first failure → transition (log once).
 *
 * @param {string} chain
 * @param {string} address
 * @param {string} reason
 * @param {number} [now]
 * @returns {{ isTransition: boolean; failCount: number; cooldownMs: number }}
 */
export function recordFundingFailure(chain, address, reason, now = Date.now()) {
  const key = keyFor(chain, address);
  const r = String(reason || 'cannot_pay').trim() || 'cannot_pay';
  const t = Number(now) || Date.now();
  const prev = stateByKey.get(key);

  const sameReasonInCooldown =
    prev && prev.reason === r && t < prev.cooldownUntil;

  if (sameReasonInCooldown) {
    return {
      isTransition: false,
      failCount: prev.failCount,
      cooldownMs: Math.max(0, prev.cooldownUntil - t),
    };
  }

  const failCount = prev && prev.reason === r ? prev.failCount + 1 : 1;
  const cooldownMs = computeFundingCooldownMs(failCount);
  stateByKey.set(key, {
    reason: r,
    failCount,
    cooldownUntil: t + cooldownMs,
    lastLoggedAt: t,
  });

  return { isTransition: true, failCount, cooldownMs };
}

/**
 * Clear backoff after a successful funding / canPay path.
 * @param {string} chain
 * @param {string} address
 */
export function recordFundingSuccess(chain, address) {
  stateByKey.delete(keyFor(chain, address));
}

/**
 * Test helper: clear all backoff state.
 */
export function resetFundingBackoffState() {
  stateByKey.clear();
}

/**
 * Test helper: inspect entry (or null).
 * @param {string} chain
 * @param {string} address
 * @returns {FundingBackoffEntry | null}
 */
export function getFundingBackoffEntry(chain, address) {
  return stateByKey.get(keyFor(chain, address)) ?? null;
}
