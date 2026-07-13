/**
 * Lab x402 call logging with daily caps, document pruning, and lab-payer-only writes.
 * Scoped per chain (solana | base).
 */
import LabX402Call from '../../models/labs/LabX402Call.js';
import LabWallet from '../../models/labs/LabWallet.js';
import LabX402Settings, {
  normalizeLabChain,
  settingsKeyForChain,
} from '../../models/labs/LabX402Settings.js';

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
 * Load settings doc for a chain, migrating legacy `default` -> `solana` on first read.
 * @param {'solana' | 'base'} [chain]
 * @returns {Promise<object | null>}
 */
export async function findLabX402SettingsDoc(chain = 'solana') {
  const key = settingsKeyForChain(chain);
  let doc = await LabX402Settings.findOne({ singletonKey: key }).lean();
  if (!doc && key === 'solana') {
    const legacy = await LabX402Settings.findOne({ singletonKey: 'default' }).lean();
    if (legacy) {
      await LabX402Settings.updateOne({ _id: legacy._id }, { $set: { singletonKey: 'solana' } });
      doc = { ...legacy, singletonKey: 'solana' };
    }
  }
  return doc;
}

/**
 * Pick (and persist) today's random daily call cap within the configured range for a chain.
 * @param {'solana' | 'base'} [chain]
 * @returns {Promise<{ max: number; min: number; maxBound: number; day: string; rolled: boolean }>}
 */
export async function resolveActiveDailyCallCap(chain = 'solana') {
  const key = settingsKeyForChain(chain);
  const doc = await findLabX402SettingsDoc(chain);
  const range = resolveDailyCallCapRange(doc);
  const day = utcDayKey();

  if (doc?.activeDailyCallCapDay === day && typeof doc.activeDailyCallCap === 'number') {
    const capped = clampInt(doc.activeDailyCallCap, range.min, range.max);
    if (capped !== doc.activeDailyCallCap) {
      await LabX402Settings.updateOne(
        { singletonKey: key },
        { $set: { activeDailyCallCap: capped, activeDailyCallCapDay: day } },
        { upsert: true },
      );
    }
    return { max: capped, min: range.min, maxBound: range.max, day, rolled: false };
  }

  const rolled = randomIntInclusive(range.min, range.max);
  await LabX402Settings.findOneAndUpdate(
    { singletonKey: key },
    {
      $set: {
        activeDailyCallCap: rolled,
        activeDailyCallCapDay: day,
        maxDailyCallsMin: range.min,
        maxDailyCallsMax: range.max,
      },
      $setOnInsert: { singletonKey: key },
    },
    { upsert: true },
  );
  console.info(
    `[lab-x402-log] rolled ${key} daily call cap ${rolled} for ${day} (range ${range.min}-${range.max})`,
  );
  return { max: rolled, min: range.min, maxBound: range.max, day, rolled: true };
}

/**
 * @param {string} address
 * @param {'solana' | 'base'} [chain]
 * @returns {Promise<boolean>}
 */
export async function isActiveLabPayer(address, chain) {
  const addr = String(address || '').trim();
  if (!addr) return false;
  const c = chain ? normalizeLabChain(chain) : null;
  const cacheKey = c ? `${c}:${addr}` : addr;
  const hit = labPayerCache.get(cacheKey);
  if (hit && hit > Date.now()) return true;
  const cachedFalse = labPayerCache.get(`!${cacheKey}`);
  if (cachedFalse && cachedFalse > Date.now()) return false;

  /** @type {Record<string, unknown>} */
  const filter = { role: 'payer', active: true };
  if (c === 'base') {
    filter.chain = 'base';
    filter.address = { $regex: new RegExp(`^${addr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') };
  } else if (c === 'solana') {
    filter.chain = 'solana';
    filter.address = addr;
  } else {
    filter.$or = [
      { address: addr, chain: 'solana' },
      {
        chain: 'base',
        address: { $regex: new RegExp(`^${addr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
      },
    ];
  }

  const doc = await LabWallet.findOne(filter).select('_id chain').lean();
  const isLab = Boolean(doc);
  labPayerCache.set(isLab ? cacheKey : `!${cacheKey}`, Date.now() + LAB_PAYER_CACHE_MS);
  return isLab;
}

export function getMaxPayerWallets() {
  return MAX_PAYER_WALLETS;
}

/**
 * @param {'solana' | 'base'} [chain]
 * @returns {Promise<number>}
 */
export async function countLabCallsToday(chain) {
  const filter = { createdAt: { $gte: startOfUtcDay() } };
  if (chain) filter.chain = normalizeLabChain(chain);
  return LabX402Call.countDocuments(filter);
}

/**
 * @param {'solana' | 'base'} [chain]
 * @returns {Promise<{ allowed: boolean; count: number; max: number; min: number; maxBound: number }>}
 */
export async function checkLabDailyCallBudget(chain = 'solana') {
  const c = normalizeLabChain(chain);
  const [cap, count] = await Promise.all([resolveActiveDailyCallCap(c), countLabCallsToday(c)]);
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
  const chain = normalizeLabChain(doc?.chain);

  const isLab = await isActiveLabPayer(payerAddress, chain);
  if (!isLab) return false;

  const budget = await checkLabDailyCallBudget(chain);
  if (!budget.allowed) {
    console.warn(
      `[lab-x402-log] ${chain} daily cap reached (${budget.count}/${budget.max}); skipping log`,
    );
    return false;
  }

  await LabX402Call.create({
    payerAddress,
    endpoint: doc.endpoint,
    priceUsd: doc.priceUsd,
    chain,
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
