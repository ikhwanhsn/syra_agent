/**
 * LabX402Settings — per-chain singleton documents for x402 Labs auto-caller configuration.
 * singletonKey: 'solana' | 'base' | 'celo' (legacy 'default' migrates to 'solana' at read time).
 */
import mongoose from 'mongoose';

export const LAB_X402_CHAINS = Object.freeze(['solana', 'base', 'celo']);

/**
 * @param {string} [chain]
 * @returns {'solana' | 'base' | 'celo'}
 */
export function settingsKeyForChain(chain) {
  const c = normalizeLabChain(chain);
  return c;
}

/**
 * @param {string} [raw]
 * @returns {'solana' | 'base' | 'celo'}
 */
export function normalizeLabChain(raw) {
  const c = String(raw || '').trim().toLowerCase();
  if (c === 'base') return 'base';
  if (c === 'celo') return 'celo';
  return 'solana';
}

/**
 * @param {'solana' | 'base' | 'celo'} chain
 * @returns {boolean}
 */
export function isEvmLabChain(chain) {
  return chain === 'base' || chain === 'celo';
}

const labX402SettingsSchema = new mongoose.Schema(
  {
    singletonKey: { type: String, default: 'solana', unique: true },
    autoCallEnabled: { type: Boolean, default: false },
    intervalMs: { type: Number, default: 300_000, min: 60_000, max: 3_600_000 },
    refundEnabled: { type: Boolean, default: true },
    jitterPct: { type: Number, default: 20, min: 0, max: 50 },
    /** Inclusive daily call-cap range; system picks a random value once per UTC day. */
    maxDailyCallsMin: { type: Number, default: 2000, min: 100, max: 10_000 },
    maxDailyCallsMax: { type: Number, default: 2000, min: 100, max: 10_000 },
    /** Legacy flat cap — kept for migration; prefer min/max. */
    maxDailyCalls: { type: Number, default: 2000, min: 100, max: 10_000 },
    /** Rolled cap for the current UTC day (stable across process restarts). */
    activeDailyCallCap: { type: Number, min: 100, max: 10_000 },
    /** UTC date key `YYYY-MM-DD` for which activeDailyCallCap was rolled. */
    activeDailyCallCapDay: { type: String },
  },
  { timestamps: true },
);

export default mongoose.models.LabX402Settings || mongoose.model('LabX402Settings', labX402SettingsSchema);
