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

/** @type {Map<string, number>} */
const labPayerCache = new Map();
const LAB_PAYER_CACHE_MS = 60_000;

function startOfUtcDay() {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
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
 * @returns {Promise<{ allowed: boolean; count: number; max: number }>}
 */
export async function checkLabDailyCallBudget() {
  const doc = await LabX402Settings.findOne({ singletonKey: 'default' }).select('maxDailyCalls').lean();
  const max = doc?.maxDailyCalls ?? DEFAULT_MAX_DAILY_CALLS;
  const count = await countLabCallsToday();
  return { allowed: count < max, count, max };
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
