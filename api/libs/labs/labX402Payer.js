/**
 * Outbound x402 payer for lab wallets — calls /insights/* endpoints with automatic payment.
 * Supports Solana (ExactSvmScheme), Base/Celo (ExactEvmScheme), and Algorand (ExactAvmScheme via GoPlausible).
 */
import { wrapFetchWithPayment } from '@x402/fetch';
import { x402Client } from '@x402/core/client';
import { ExactSvmScheme } from '@x402/svm/exact/client';
import { ExactEvmScheme } from '@x402/evm/exact/client';
import { createKeyPairSignerFromBytes } from '@solana/kit';
import {
  registerRequiredExtensionsHook,
  registerBuilderCodeClientExtension,
} from '../agentX402Client.js';
import { createAlgorandX402WrapFetch } from '../agentAvmX402Client.js';
import {
  getLabWalletDocByAddress,
  keypairFromLabWalletDoc,
  evmAccountFromLabWalletDoc,
  algorandAccountFromLabWalletDoc,
} from './labWalletService.js';
import { pickRandomAvailableLabX402Endpoint, findLabX402Endpoint } from './labX402Endpoints.js';
import { checkPayaiEndpointDailyBudget } from './labPayaiEndpointDailyLimit.js';
import {
  logLabX402Call,
  resolveActiveDailyCallCap,
  findLabX402SettingsDoc,
} from './labX402CallLog.js';
import LabX402Settings, {
  normalizeLabChain,
  settingsKeyForChain,
  isEvmLabChain,
  isAvmLabChain,
} from '../../models/labs/LabX402Settings.js';
import LabX402Call from '../../models/labs/LabX402Call.js';
import { CELO_MAINNET_CAIP2 } from '../../config/celoX402Networks.js';
import { getCeloBuilderCode } from '../../config/celoBuilderCode.js';

/** @type {Map<string, ReturnType<typeof wrapFetchWithPayment>>} */
const paymentFetchCache = new Map();

/**
 * @param {import('@solana/web3.js').Keypair} keypair
 */
async function getSolanaPaymentFetchForKeypair(keypair) {
  const addr = keypair.publicKey.toBase58();
  const cacheKey = `solana:${addr}`;
  if (paymentFetchCache.has(cacheKey)) return paymentFetchCache.get(cacheKey);

  const signer = await createKeyPairSignerFromBytes(keypair.secretKey);
  // Prefer blockchain-capable RPC (same rules as agentX402Client). Never use a
  // read-only Alchemy URL here — ExactSvmScheme needs getAccountInfo / blockhash.
  const rpcUrl =
    process.env.SOLANA_RPC_BLOCKCHAIN_URL ||
    process.env.SOLANA_RPC_URL ||
    process.env.VITE_SOLANA_RPC_URL ||
    'https://api.mainnet-beta.solana.com';
  const scheme = new ExactSvmScheme(signer, { rpcUrl });
  const client = x402Client.fromConfig({ schemes: [{ network: 'solana:*', client: scheme }] });
  registerRequiredExtensionsHook(client);
  const pf = wrapFetchWithPayment(globalThis.fetch, client);
  paymentFetchCache.set(cacheKey, pf);
  return pf;
}

/**
 * @param {import('viem').Account} account
 * @param {'base' | 'celo'} [chain='base']
 */
async function getEvmPaymentFetchForAccount(account, chain = 'base') {
  const addr = account.address;
  const cacheKey = `${chain}:${addr.toLowerCase()}`;
  if (paymentFetchCache.has(cacheKey)) return paymentFetchCache.get(cacheKey);

  const scheme = new ExactEvmScheme(account);
  const network = chain === 'celo' ? CELO_MAINNET_CAIP2 : 'eip155:*';
  const client = x402Client.fromConfig({
    schemes: [{ network, client: scheme }],
  });
  registerRequiredExtensionsHook(client);
  if (chain === 'celo') {
    const code = getCeloBuilderCode();
    if (code) {
      const { BuilderCodeClientExtension } = await import('@x402/extensions/builder-code');
      client.registerExtension(new BuilderCodeClientExtension(code));
    }
  } else {
    await registerBuilderCodeClientExtension(client);
  }
  const pf = wrapFetchWithPayment(globalThis.fetch, client);
  paymentFetchCache.set(cacheKey, pf);
  return pf;
}

/**
 * @param {{ address: string; keyB64: string }} account
 */
async function getAlgorandPaymentFetchForAccount(account) {
  const cacheKey = `algorand:${account.address}`;
  if (paymentFetchCache.has(cacheKey)) return paymentFetchCache.get(cacheKey);
  const pf = await createAlgorandX402WrapFetch(globalThis.fetch, account.keyB64);
  paymentFetchCache.set(cacheKey, pf);
  return pf;
}

function getApiBaseUrl() {
  const base = (process.env.BASE_URL || process.env.SYRA_PROBE_BASE_URL || 'http://localhost:3000')
    .trim()
    .replace(/\/+$/, '');
  return base;
}

function getServerApiKey() {
  const raw = (process.env.API_KEYS || process.env.API_KEY || '').trim();
  if (!raw) return null;
  return raw.split(',')[0].trim() || null;
}

/**
 * @param {string} payerAddress
 * @param {{ endpoint?: string; trigger?: 'manual' | 'scheduler'; chain?: 'solana' | 'base' | 'celo' | 'algorand' }} [opts]
 * @returns {Promise<object>}
 */
export async function runLabX402Payment(payerAddress, opts = {}) {
  const trigger = opts.trigger === 'scheduler' ? 'scheduler' : 'manual';
  const chainHint = opts.chain ? normalizeLabChain(opts.chain) : undefined;
  const doc = await getLabWalletDocByAddress(payerAddress, chainHint);
  if (!doc) {
    throw new Error(`Lab payer wallet not found: ${payerAddress}`);
  }
  const chain = normalizeLabChain(doc.chain);

  let endpoint = opts.endpoint
    ? findLabX402Endpoint(opts.endpoint)
    : await pickRandomAvailableLabX402Endpoint({ chain });
  if (!endpoint) {
    throw new Error('Unknown x402 endpoint');
  }
  const skipPayai = isEvmLabChain(chain) || isAvmLabChain(chain);
  if (skipPayai && endpoint.facilitator === 'payai') {
    endpoint = await pickRandomAvailableLabX402Endpoint({ chain });
    if (!endpoint || endpoint.facilitator === 'payai') {
      throw new Error(
        `No ${chain}-compatible x402 endpoint available (PayAI routes skipped on ${chain})`,
      );
    }
  }

  const settings = await getLabX402Settings(chain);
  const priceMultiplier = clampPriceMultiplier(settings.priceMultiplier);
  const effectivePriceUsd = Math.round(endpoint.priceUsd * priceMultiplier * 1e6) / 1e6;

  if (endpoint.facilitator === 'payai') {
    const budget = await checkPayaiEndpointDailyBudget(
      endpoint.id,
      endpoint.dailyLimitMin ?? 5,
      endpoint.dailyLimitMax ?? 10,
    );
    if (!budget.allowed) {
      return {
        success: false,
        endpoint: endpoint.path,
        priceUsd: effectivePriceUsd,
        skipped: true,
        reason: 'payai_daily_limit',
        error: `PayAI endpoint daily limit reached (${budget.count}/${budget.max} for ${budget.day} UTC).`,
      };
    }
  }

  const url = `${getApiBaseUrl()}${endpoint.path}`;
  let paymentFetch;
  let payerAddrForLog;
  if (isAvmLabChain(chain)) {
    const account = algorandAccountFromLabWalletDoc(doc);
    payerAddrForLog = account.address;
    paymentFetch = await getAlgorandPaymentFetchForAccount(account);
  } else if (isEvmLabChain(chain)) {
    const account = evmAccountFromLabWalletDoc(doc);
    payerAddrForLog = account.address;
    paymentFetch = await getEvmPaymentFetchForAccount(account, chain === 'celo' ? 'celo' : 'base');
  } else {
    const keypair = keypairFromLabWalletDoc(doc);
    payerAddrForLog = keypair.publicKey.toBase58();
    paymentFetch = await getSolanaPaymentFetchForKeypair(keypair);
  }

  const headers = {
    Accept: 'application/json',
    'x-lab-x402-trigger': trigger,
    'x-lab-x402-chain': chain,
    'X-Payer-Address': payerAddrForLog,
    'x-lab-x402-payer': payerAddrForLog,
  };
  const apiKey = getServerApiKey();
  if (apiKey) headers['X-API-Key'] = apiKey;

  let httpStatus = 0;
  let responseBody = null;
  let paymentTx = null;
  let errorMsg = null;

  try {
    const res = await paymentFetch(url, { method: 'GET', headers, redirect: 'manual' });
    httpStatus = res.status;
    responseBody = await res.json().catch(() => ({}));

    const paymentResponse = res.headers.get('Payment-Response') || res.headers.get('payment-response');
    if (paymentResponse) {
      try {
        const { decodePaymentResponseHeader } = await import('@x402/core/http');
        const decoded = decodePaymentResponseHeader(paymentResponse);
        paymentTx = decoded?.transaction ?? decoded?.txSignature ?? null;
      } catch {
        /* ignore decode errors */
      }
    }

    if (!res.ok) {
      errorMsg = responseBody?.error || responseBody?.message || `HTTP ${res.status}`;
      const errText = String(errorMsg);
      const looksLikeUpstreamData =
        /pyth|hermes|upstream|oracle|not found|timeout|ECONN|ENOTFOUND|502|503/i.test(errText);
      // Facilitator fee-payer dry / rent failures are operational — keep as payment_failed
      // but rewrite to an actionable message so the Labs UI is not opaque.
      if (/InsufficientFundsForRent|transaction_simulation_failed/i.test(errText)) {
        errorMsg =
          'Facilitator Solana fee payer underfunded (InsufficientFundsForRent). ' +
          'Syra falls back to PayAI automatically — retry after deploy, or top up Dexter fee payer.';
      }
      await logLabX402Call({
        payerAddress: payerAddrForLog,
        endpoint: endpoint.path,
        priceUsd: effectivePriceUsd,
        chain,
        status: looksLikeUpstreamData ? 'error' : 'payment_failed',
        paymentTx,
        error: String(errorMsg).slice(0, 500),
        trigger,
      });
      return {
        success: false,
        endpoint: endpoint.path,
        priceUsd: effectivePriceUsd,
        httpStatus,
        error: errorMsg,
      };
    }

    // Always log paid successes here. Insights refund logging is secondary and may
    // skip when Dexter settle omits `payer` — without this the UI only shows failures.
    await logLabX402Call({
      payerAddress: payerAddrForLog,
      endpoint: endpoint.path,
      priceUsd: effectivePriceUsd,
      chain,
      status: 'success',
      paymentTx,
      trigger,
    });

    return {
      success: true,
      endpoint: endpoint.path,
      priceUsd: effectivePriceUsd,
      httpStatus,
      data: responseBody,
      paymentTx,
    };
  } catch (e) {
    errorMsg = e?.message || String(e);
    await logLabX402Call({
      payerAddress: payerAddrForLog,
      endpoint: endpoint.path,
      priceUsd: effectivePriceUsd,
      chain,
      status: 'error',
      error: errorMsg.slice(0, 500),
      trigger,
    });
    return {
      success: false,
      endpoint: endpoint.path,
      priceUsd: effectivePriceUsd,
      error: errorMsg,
    };
  }
}

/**
 * @param {unknown} raw
 * @returns {number}
 */
function clampPriceMultiplier(raw) {
  const n = Number(raw);
  if (!Number.isFinite(n)) return 1;
  return Math.min(100, Math.max(1, Math.round(n * 100) / 100));
}

/**
 * @param {object} doc
 * @returns {object}
 */
function formatLabX402Settings(doc) {
  const legacy = doc.maxDailyCalls ?? 2000;
  const rawMin = typeof doc.maxDailyCallsMin === 'number' ? doc.maxDailyCallsMin : legacy;
  const rawMax = typeof doc.maxDailyCallsMax === 'number' ? doc.maxDailyCallsMax : legacy;
  const min = Math.min(Math.max(100, Math.round(rawMin)), 10_000);
  const max = Math.min(Math.max(100, Math.round(rawMax)), 10_000);
  const maxDailyCallsMin = Math.min(min, max);
  const maxDailyCallsMax = Math.max(min, max);
  const today = new Date().toISOString().slice(0, 10);
  const activeDailyCallCap =
    doc.activeDailyCallCapDay === today && typeof doc.activeDailyCallCap === 'number'
      ? doc.activeDailyCallCap
      : null;

  const key = String(doc.singletonKey || 'solana');
  const chain = settingsKeyForChain(key === 'default' ? 'solana' : key);

  return {
    autoCallEnabled: doc.autoCallEnabled ?? false,
    intervalMs: doc.intervalMs ?? 300_000,
    refundEnabled: doc.refundEnabled ?? true,
    jitterPct: doc.jitterPct ?? 20,
    maxDailyCallsMin,
    maxDailyCallsMax,
    maxDailyCalls: activeDailyCallCap ?? Math.round((maxDailyCallsMin + maxDailyCallsMax) / 2),
    targetVolumeUsd:
      typeof doc.targetVolumeUsd === 'number' && Number.isFinite(doc.targetVolumeUsd)
        ? Math.min(100_000, Math.max(1, doc.targetVolumeUsd))
        : 50,
    priceMultiplier: clampPriceMultiplier(doc.priceMultiplier),
    activeDailyCallCap,
    activeDailyCallCapDay: doc.activeDailyCallCapDay ?? null,
    depositDistributeEnabled: doc.depositDistributeEnabled !== false,
    depositMinUsdc: typeof doc.depositMinUsdc === 'number' ? doc.depositMinUsdc : 1,
    depositMinEth: typeof doc.depositMinEth === 'number' ? doc.depositMinEth : 0.001,
    depositEthGasReserve:
      typeof doc.depositEthGasReserve === 'number' ? doc.depositEthGasReserve : 0.0002,
    depositLastDistributedAt: doc.depositLastDistributedAt ?? null,
    chain,
    updatedAt: doc.updatedAt,
  };
}

/**
 * @param {'solana' | 'base' | 'celo' | 'algorand'} [chain]
 * @returns {Promise<object>}
 */
export async function getLabX402Settings(chain = 'solana') {
  const c = normalizeLabChain(chain);
  await resolveActiveDailyCallCap(c);
  let doc = await findLabX402SettingsDoc(c);
  if (!doc) {
    doc = (await LabX402Settings.create({ singletonKey: settingsKeyForChain(c) })).toObject();
  }
  return formatLabX402Settings(doc);
}

/**
 * @param {Partial<{
 *   autoCallEnabled: boolean;
 *   intervalMs: number;
 *   refundEnabled: boolean;
 *   jitterPct: number;
 *   maxDailyCallsMin: number;
 *   maxDailyCallsMax: number;
 *   maxDailyCalls: number;
 *   targetVolumeUsd: number;
 *   priceMultiplier: number;
 * }>} patch
 * @param {'solana' | 'base' | 'celo' | 'algorand'} [chain]
 * @returns {Promise<object>}
 */
export async function updateLabX402Settings(patch, chain = 'solana') {
  const c = normalizeLabChain(chain);
  const key = settingsKeyForChain(c);
  const update = {};
  let clearActiveCap = false;
  if (typeof patch.autoCallEnabled === 'boolean') update.autoCallEnabled = patch.autoCallEnabled;
  if (typeof patch.intervalMs === 'number' && patch.intervalMs >= 60_000 && patch.intervalMs <= 3_600_000) {
    update.intervalMs = Math.round(patch.intervalMs);
  }
  if (typeof patch.refundEnabled === 'boolean') update.refundEnabled = patch.refundEnabled;
  if (typeof patch.jitterPct === 'number' && patch.jitterPct >= 0 && patch.jitterPct <= 50) {
    update.jitterPct = Math.round(patch.jitterPct);
  }
  if (typeof patch.targetVolumeUsd === 'number' && Number.isFinite(patch.targetVolumeUsd)) {
    update.targetVolumeUsd = Math.min(100_000, Math.max(1, Math.round(patch.targetVolumeUsd * 100) / 100));
  }
  if (typeof patch.priceMultiplier === 'number' && Number.isFinite(patch.priceMultiplier)) {
    update.priceMultiplier = clampPriceMultiplier(patch.priceMultiplier);
  }

  const hasMin = typeof patch.maxDailyCallsMin === 'number';
  const hasMax = typeof patch.maxDailyCallsMax === 'number';
  const hasLegacy = typeof patch.maxDailyCalls === 'number';

  if (hasMin || hasMax || hasLegacy) {
    const existing = await findLabX402SettingsDoc(c);
    const legacyFallback = existing?.maxDailyCalls ?? 2000;
    let min = hasMin
      ? Math.round(patch.maxDailyCallsMin)
      : (existing?.maxDailyCallsMin ?? (hasLegacy ? Math.round(patch.maxDailyCalls) : legacyFallback));
    let max = hasMax
      ? Math.round(patch.maxDailyCallsMax)
      : (existing?.maxDailyCallsMax ?? (hasLegacy ? Math.round(patch.maxDailyCalls) : legacyFallback));
    if (hasLegacy && !hasMin && !hasMax) {
      min = Math.round(patch.maxDailyCalls);
      max = Math.round(patch.maxDailyCalls);
    }
    min = Math.min(10_000, Math.max(100, min));
    max = Math.min(10_000, Math.max(100, max));
    if (min > max) {
      const swap = min;
      min = max;
      max = swap;
    }
    update.maxDailyCallsMin = min;
    update.maxDailyCallsMax = max;
    update.maxDailyCalls = max;
    clearActiveCap = true;
  }

  const doc = await LabX402Settings.findOneAndUpdate(
    { singletonKey: key },
    {
      $set: update,
      $setOnInsert: { singletonKey: key },
      ...(clearActiveCap ? { $unset: { activeDailyCallCap: 1, activeDailyCallCapDay: 1 } } : {}),
    },
    { upsert: true, new: true, lean: true },
  );
  if (clearActiveCap) {
    await resolveActiveDailyCallCap(c);
    const refreshed = await findLabX402SettingsDoc(c);
    return formatLabX402Settings(refreshed ?? doc);
  }
  return formatLabX402Settings(doc);
}

/**
 * @param {{ limit?: number; chain?: 'solana' | 'base' | 'celo' | 'algorand' }} [opts]
 * @returns {Promise<object[]>}
 */
export async function listLabX402Calls(opts = {}) {
  const limit = Math.min(Math.max(Number(opts.limit) || 10, 1), 200);
  const filter = {};
  if (opts.chain) filter.chain = normalizeLabChain(opts.chain);
  const docs = await LabX402Call.find(filter).sort({ createdAt: -1 }).limit(limit).lean();
  return docs.map((d) => ({
    id: d._id.toString(),
    payerAddress: d.payerAddress,
    endpoint: d.endpoint,
    priceUsd: d.priceUsd,
    chain: d.chain || 'solana',
    status: d.status,
    paymentTx: d.paymentTx,
    refundTx: d.refundTx,
    error: d.error,
    trigger: d.trigger,
    createdAt: d.createdAt,
  }));
}

/**
 * Gross x402 volume for the current UTC day (successful paid calls only).
 * @param {'solana' | 'base' | 'celo' | 'algorand'} [chain]
 * @returns {Promise<{
 *   dayUtc: string;
 *   volumeUsd: number;
 *   callCount: number;
 *   targetVolumeUsd: number;
 *   remainingUsd: number;
 *   progressPct: number;
 *   chain: string;
 * }>}
 */
export async function getLabX402VolumeStats(chain = 'solana') {
  const c = normalizeLabChain(chain);
  const dayUtc = new Date().toISOString().slice(0, 10);
  const start = new Date(`${dayUtc}T00:00:00.000Z`);
  const end = new Date(`${dayUtc}T23:59:59.999Z`);

  const [agg, settings] = await Promise.all([
    LabX402Call.aggregate([
      {
        $match: {
          chain: c,
          status: 'success',
          createdAt: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: null,
          volumeUsd: { $sum: { $ifNull: ['$priceUsd', 0] } },
          callCount: { $sum: 1 },
        },
      },
    ]),
    getLabX402Settings(c),
  ]);

  const volumeUsd = Math.round((agg[0]?.volumeUsd ?? 0) * 100) / 100;
  const callCount = agg[0]?.callCount ?? 0;
  const targetVolumeUsd = settings.targetVolumeUsd ?? 50;
  const remainingUsd = Math.max(0, Math.round((targetVolumeUsd - volumeUsd) * 100) / 100);
  const progressPct =
    targetVolumeUsd > 0
      ? Math.min(100, Math.round((volumeUsd / targetVolumeUsd) * 1000) / 10)
      : 0;

  return {
    dayUtc,
    volumeUsd,
    callCount,
    targetVolumeUsd,
    remainingUsd,
    progressPct,
    chain: c,
  };
}
