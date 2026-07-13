/**
 * Lab x402 call logging with daily caps, document pruning, and lab-payer-only writes.
 * Avoids MongoDB bloat from high-volume scheduler runs or external /insights traffic.
 */
import LabX402Call from '../../models/labs/LabX402Call.js';
import LabWallet from '../../models/labs/LabWallet.js';
import LabX402Settings from '../../models/labs/LabX402Settings.js';

const MAX_CALL_LOG_DOCS = Number(process.env.LAB_X402_MAX_CALL_LOG_DOCS) || 5_000;
const DEFAULT_MAX_DAILY_CALLS = Number(process.env.LAB_X402_MAX_DAILY_CALLS) || 2_000;
const MAX_PAYER_WALLETS = Number(process.env.LAB_X402_MAX_PAYER_WALLETS) || 20;
const CALL_CAP_BOUNDS = { min: 100, max: 10_000 };

/** @type {Map<string, number>} */
const labPayerCache = new Map();
const LAB_PAYER_CACHE_MS = 60_000;

function startOfUtcDay() {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

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
 * Resolve configured min/max range from settings doc (supports legacy flat maxDailyCalls).
 * @param {object | null | undefined} doc
 * @returns {{ min: number; max: number }}
 */
export function resolveDailyCallCapRange(doc) {
  const legacy = typeof doc?.maxDailyCalls === 'number' ? doc.maxDailyCalls : DEFAULT_MAX_DAILY_CALLS;
  const rawMin = typeof doc?.maxDailyCallsMin === 'number' ? doc.maxDailyCallsMin : legacy;
  const rawMax = typeof doc?.maxDailyCallsMax === 'number' ? doc.maxDailyCallsMax : legacy;
  const min = clampInt(rawMin, CALL_CAP_BOUNDS.min, CALL_CAP_BOUNDS.max);
  const max = clampInt(rawMax, CALL_CAP_BOUNDS.min, CALL_CAP_BOUNDS.max);
  return { min: Math.min(min, max), max: Math.max(min, max) };
}

/**
 * Pick (and persist) today's random daily call cap within the configured range.
 * Stable for the UTC day across scheduler ticks and process restarts.
 * @returns {Promise<{ max: number; min: number; maxBound: number; day: string; rolled: boolean }>}
 */
export async function resolveActiveDailyCallCap() {
  const doc = await LabX402Settings.findOne({ singletonKey: 'default' })
    .select(
      'maxDailyCalls maxDailyCallsMin maxDailyCallsMax activeDailyCallCap activeDailyCallCapDay',
    )
    .lean();
  const range = resolveDailyCallCapRange(doc);
  const day = utcDayKey();

  if (
    doc?.activeDailyCallCapDay === day &&
    typeof doc.activeDailyCallCap === 'number'
  ) {
    const capped = clampInt(doc.activeDailyCallCap, range.min, range.max);
    if (capped !== doc.activeDailyCallCap) {
      await LabX402Settings.updateOne(
        { singletonKey: 'default' },
        { $set: { activeDailyCallCap: capped, activeDailyCallCapDay: day } },
        { upsert: true },
      );
    }
    return { max: capped, min: range.min, maxBound: range.max, day, rolled: false };
  }

  const rolled = randomIntInclusive(range.min, range.max);
  await LabX402Settings.findOneAndUpdate(
    { singletonKey: 'default' },
    {
      $set: {
        activeDailyCallCap: rolled,
        activeDailyCallCapDay: day,
        maxDailyCallsMin: range.min,
        maxDailyCallsMax: range.max,
      },
      $setOnInsert: { singletonKey: 'default' },
    },
    { upsert: true },
  );
  console.info(
    `[lab-x402-log] rolled daily call cap ${rolled} for ${day} (range ${range.min}-${range.max})`,
  );
  return { max: rolled, min: range.min, maxBound: range.max, day, rolled: true };
}

/**
 * @param {string} address
 * @returns {Promise<boolean>}
 */
export async function isActiveLabPayer(address) {
  const addr = String(address || '').trim();
  if (!addr) return false;
  const hit = labPayerCache.get(addr);
  if (hit && hit > Date.now()) return true;
  const cachedFalse = labPayerCache.get(`!${addr}`);
  if (cachedFalse && cachedFalse > Date.now()) return false;

  const doc = await LabWallet.findOne({ address: addr, role: 'payer', active: true })
    .select('_id')
    .lean();
  const isLab = Boolean(doc);
  labPayerCache.set(isLab ? addr : `!${addr}`, Date.now() + LAB_PAYER_CACHE_MS);
  return isLab;
}

export function getMaxPayerWallets() {
  return MAX_PAYER_WALLETS;
}

/**
 * @returns {Promise<number>}
 */
export async function countLabCallsToday() {
  return LabX402Call.countDocuments({ createdAt: { $gte: startOfUtcDay() } });
}

/**
 * @returns {Promise<{ allowed: boolean; count: number; max: number; min: number; maxBound: number }>}
 */
export async function checkLabDailyCallBudget() {
  const [cap, count] = await Promise.all([resolveActiveDailyCallCap(), countLabCallsToday()]);
  return {
    allowed: count < cap.max,
    count,
    max: cap.max,
    min: cap.min,
    maxBound: cap.maxBound,
  };
}

async function pruneOldCallLogs() {
  const total = await LabX402Call.countDocuments();
  if (total <= MAX_CALL_LOG_DOCS) return;
  const excess = total - MAX_CALL_LOG_DOCS;
  const old = await LabX402Call.find()
    .sort({ createdAt: 1 })
    .limit(excess)
    .select('_id')
    .lean();
  if (old.length === 0) return;
  await LabX402Call.deleteMany({ _id: { $in: old.map((d) => d._id) } });
}

/**
 * Log a lab x402 call. Skips external payers and enforces daily + document caps.
 * @param {object} doc
 * @returns {Promise<boolean>} true if logged
 */
export async function logLabX402Call(doc) {
  const payerAddress = String(doc?.payerAddress || '').trim();
  if (!payerAddress) return false;

  const isLab = await isActiveLabPayer(payerAddress);
  if (!isLab) return false;

  const budget = await checkLabDailyCallBudget();
  if (!budget.allowed) {
    console.warn(
      `[lab-x402-log] daily cap reached (${budget.count}/${budget.max}); skipping log`,
    );
    return false;
  }

  await LabX402Call.create({
    payerAddress,
    endpoint: doc.endpoint,
    priceUsd: doc.priceUsd,
    status: doc.status,
    paymentTx: doc.paymentTx ?? null,
    refundTx: doc.refundTx ?? null,
    error: doc.error ? String(doc.error).slice(0, 500) : null,
    responseSnippet: doc.responseSnippet ? String(doc.responseSnippet).slice(0, 300) : null,
    trigger: doc.trigger === 'scheduler' ? 'scheduler' : 'manual',
  });

  pruneOldCallLogs().catch(() => {});
  return true;
}

/**
 * Ensure TTL index exists for automatic expiry of old call logs.
 */
export async function ensureLabX402CallIndexes() {
  try {
    await LabX402Call.collection.createIndex(
      { createdAt: 1 },
      { expireAfterSeconds: 14 * 24 * 60 * 60, name: 'lab_x402_call_ttl' },
    );
  } catch {
    /* index may already exist with different options */
  }
}
