/**
 * Circuit breaker for Celo facilitator prepaid credits (insufficient_credits).
 * When open: public/Labs should not accept new Celo payments that will fail settle.
 *
 * Env:
 *   CELO_CREDIT_CIRCUIT_COOLDOWN_MS — default 900000 (15 min)
 *   CELO_CREDIT_CIRCUIT_AUTO_OPEN — default true
 */
import { startupVerbose } from '../utils/startupLog.js';

const DEFAULT_COOLDOWN_MS = 900_000;

/** @type {{ openUntil: number, reason: string, openedAt: number } | null} */
let circuit = null;

function cooldownMs() {
  const n = Number.parseInt(String(process.env.CELO_CREDIT_CIRCUIT_COOLDOWN_MS || ''), 10);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_COOLDOWN_MS;
}

function autoOpenEnabled() {
  const raw = String(process.env.CELO_CREDIT_CIRCUIT_AUTO_OPEN ?? 'true').trim().toLowerCase();
  return !['0', 'false', 'no', 'off'].includes(raw);
}

/**
 * @param {string} [reason]
 */
export function openCeloCreditCircuit(reason = 'insufficient_credits') {
  if (!autoOpenEnabled()) return;
  const now = Date.now();
  const openUntil = now + cooldownMs();
  circuit = { openUntil, reason: String(reason || 'insufficient_credits').slice(0, 200), openedAt: now };
  console.warn(
    `[celo-credit-gate] OPEN until ${new Date(openUntil).toISOString()} — ${circuit.reason}. Top up at https://x402.celo.org`,
  );
}

export function closeCeloCreditCircuit() {
  if (circuit) {
    console.info('[celo-credit-gate] CLOSED (credits recovered or manual clear)');
  }
  circuit = null;
}

/**
 * @returns {boolean}
 */
export function isCeloCreditCircuitOpen() {
  if (!circuit) return false;
  if (Date.now() >= circuit.openUntil) {
    circuit = null;
    return false;
  }
  return true;
}

/**
 * @returns {{ open: boolean, reason?: string, openUntil?: string, openedAt?: string } | null}
 */
export function getCeloCreditCircuitStatus() {
  if (!isCeloCreditCircuitOpen()) return { open: false };
  return {
    open: true,
    reason: circuit.reason,
    openUntil: new Date(circuit.openUntil).toISOString(),
    openedAt: new Date(circuit.openedAt).toISOString(),
  };
}

/**
 * Detect facilitator credit/auth failures that should trip the circuit.
 * @param {string} reason
 */
export function isCeloInsufficientCreditsReason(reason) {
  const s = String(reason || '').toLowerCase();
  return (
    s.includes('insufficient_credits') ||
    s.includes('insufficient credits') ||
    s.includes('out of credits') ||
    s.includes('no credits') ||
    (s.includes('unauthorized') && s.includes('credit'))
  );
}

/**
 * Seed circuit from recent Mongo settle_failed (call once at boot).
 */
export async function seedCeloCreditCircuitFromRecentFailures() {
  if (!autoOpenEnabled()) return;
  try {
    const X402CallLog = (await import('../models/X402CallLog.js')).default;
    const since = new Date(Date.now() - 30 * 60 * 1000);
    const hit = await X402CallLog.findOne({
      direction: 'inbound',
      outcome: 'settle_failed',
      network: /42220|celo/i,
      errorReason: /insufficient_credits|insufficient credits/i,
      createdAt: { $gte: since },
    })
      .sort({ createdAt: -1 })
      .select('errorReason createdAt')
      .lean();
    if (hit) {
      openCeloCreditCircuit(String(hit.errorReason || 'insufficient_credits'));
      startupVerbose('[celo-credit-gate] seeded open from recent settle_failed');
    }
  } catch (e) {
    console.warn('[celo-credit-gate] seed failed:', e instanceof Error ? e.message : e);
  }
}
