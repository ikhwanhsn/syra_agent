/**
 * MongoDB persistence for precomputed BTC intelligence snapshots.
 */
import BtcIntelligenceSnapshot from "../models/BtcIntelligenceSnapshot.js";
import { isMongooseConnected } from "../config/mongoose.js";

export const BTC_SNAPSHOT_KEYS = {
  overview: "overview",
  dashboard: "dashboard",
};

/** @param {string} exchange @param {string} interval @param {number} limit */
export function btcBubblemapSnapshotKey(exchange, interval, limit) {
  return `bubblemap:${String(exchange).toLowerCase()}:${interval}:${limit}`;
}

/**
 * @param {string} key
 * @returns {Promise<{ payload: unknown; computedAt: Date; refreshDurationMs: number | null; lastError: string | null } | null>}
 */
export async function readBtcSnapshot(key) {
  if (!isMongooseConnected()) return null;
  const doc = await BtcIntelligenceSnapshot.findOne({ key }).lean();
  if (!doc?.payload) return null;
  return {
    payload: doc.payload,
    computedAt: doc.computedAt,
    refreshDurationMs: doc.refreshDurationMs ?? null,
    lastError: doc.lastError ?? null,
  };
}

/**
 * @param {string} key
 * @returns {Promise<unknown | null>}
 */
export async function readBtcSnapshotPayload(key) {
  const snap = await readBtcSnapshot(key);
  return snap?.payload ?? null;
}

/**
 * @param {string} key
 * @param {unknown} payload
 * @param {{ computedAt?: Date | string; refreshDurationMs?: number; lastError?: string | null }} [meta]
 */
export async function writeBtcSnapshot(key, payload, meta = {}) {
  if (!isMongooseConnected()) {
    throw new Error("mongodb_not_connected");
  }
  const computedAt =
    meta.computedAt instanceof Date
      ? meta.computedAt
      : meta.computedAt
        ? new Date(meta.computedAt)
        : new Date();

  await BtcIntelligenceSnapshot.findOneAndUpdate(
    { key },
    {
      $set: {
        key,
        payload,
        computedAt,
        refreshDurationMs: meta.refreshDurationMs ?? null,
        lastError: meta.lastError ?? null,
      },
    },
    { upsert: true },
  );
}

/**
 * @param {string} key
 * @param {string} message
 */
export async function recordBtcSnapshotError(key, message) {
  if (!isMongooseConnected()) return;
  await BtcIntelligenceSnapshot.updateOne({ key }, { $set: { lastError: message } });
}
