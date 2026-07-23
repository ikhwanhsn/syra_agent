/**
 * LabX402Settings — per-chain singleton documents for x402 Labs auto-caller configuration.
 * singletonKey: 'solana' | 'base' | 'algorand' (legacy 'default' migrates to 'solana' at read time).
 */
import mongoose from 'mongoose';

export const LAB_X402_CHAINS = Object.freeze(['solana', 'base', 'algorand']);

/**
 * @param {string} [chain]
 * @returns {'solana' | 'base' | 'algorand'}
 */
export function settingsKeyForChain(chain) {
  const c = normalizeLabChain(chain);
  return c;
}

/**
 * @param {string} [raw]
 * @returns {'solana' | 'base' | 'algorand'}
 */
export function normalizeLabChain(raw) {
  const c = String(raw || '').trim().toLowerCase();
  if (c === 'base') return 'base';
  if (c === 'algorand' || c === 'algo' || c === 'avm') return 'algorand';
  return 'solana';
}

/**
 * @param {'solana' | 'base' | 'algorand'} chain
 * @returns {boolean}
 */
export function isEvmLabChain(chain) {
  return chain === 'base';
}

/**
 * @param {'solana' | 'base' | 'algorand'} chain
 * @returns {boolean}
 */
export function isAvmLabChain(chain) {
  return chain === 'algorand';
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
    /** Ops target for gross x402 volume (USD) in a UTC day — guidance + simulation, not a hard cap. */
    targetVolumeUsd: { type: Number, default: 50, min: 1, max: 100_000 },
    /** Multiplies base /insights endpoint price for lab calls only (1–100). */
    priceMultiplier: { type: Number, default: 1, min: 1, max: 100 },
    /** Rolled cap for the current UTC day (stable across process restarts). */
    activeDailyCallCap: { type: Number, min: 100, max: 10_000 },
    /** UTC date key `YYYY-MM-DD` for which activeDailyCallCap was rolled. */
    activeDailyCallCapDay: { type: String },
    /** Auto-sweep deposit hub → equal split to payer/payto wallets. */
    depositDistributeEnabled: { type: Boolean, default: true },
    /** Min USDC on deposit wallet before a USDC distribute runs. */
    depositMinUsdc: { type: Number, default: 1, min: 0 },
    /** Min ETH (after gas reserve) before an ETH distribute runs. */
    depositMinEth: { type: Number, default: 0.001, min: 0 },
    /** ETH kept on deposit wallet for outbound gas. */
    depositEthGasReserve: { type: Number, default: 0.0002, min: 0 },
    /** Last successful distribute timestamp (informational). */
    depositLastDistributedAt: { type: Date },
    /** Multi-instance distribute lock — do not start another run until this time. */
    depositDistributeLockUntil: { type: Date, default: null },
    /** Optional owner label for the lock (pid / host). */
    depositDistributeLockOwner: { type: String, default: null },
  },
  { timestamps: true },
);

export default mongoose.models.LabX402Settings || mongoose.model('LabX402Settings', labX402SettingsSchema);
