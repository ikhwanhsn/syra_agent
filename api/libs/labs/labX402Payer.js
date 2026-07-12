/**
 * Outbound x402 payer for lab wallets — calls /insights/* endpoints with automatic payment.
 */
import { wrapFetchWithPayment } from '@x402/fetch';
import { x402Client } from '@x402/core/client';
import { ExactSvmScheme } from '@x402/svm/exact/client';
import { createKeyPairSignerFromBytes } from '@solana/kit';
import { registerRequiredExtensionsHook } from '../agentX402Client.js';
import { getLabWalletKeypairByAddress } from './labWalletService.js';
import { pickRandomLabX402Endpoint, findLabX402Endpoint } from './labX402Endpoints.js';
import {
  logLabX402Call,
} from './labX402CallLog.js';
import LabX402Settings from '../../models/labs/LabX402Settings.js';
import LabX402Call from '../../models/labs/LabX402Call.js';

/** @type {Map<string, ReturnType<typeof wrapFetchWithPayment>>} */
const paymentFetchCache = new Map();

/**
 * @param {Keypair} keypair
 */
async function getPaymentFetchForKeypair(keypair) {
  const addr = keypair.publicKey.toBase58();
  if (paymentFetchCache.has(addr)) return paymentFetchCache.get(addr);

  const signer = await createKeyPairSignerFromBytes(keypair.secretKey);
  const rpcUrl =
    process.env.SOLANA_RPC_BLOCKCHAIN_URL ||
    process.env.SOLANA_RPC_URL ||
    'https://api.mainnet-beta.solana.com';
  const scheme = new ExactSvmScheme(signer, { rpcUrl });
  const client = x402Client.fromConfig({ schemes: [{ network: 'solana:*', client: scheme }] });
  registerRequiredExtensionsHook(client);
  const pf = wrapFetchWithPayment(globalThis.fetch, client);
  paymentFetchCache.set(addr, pf);
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
 * @param {{ endpoint?: string; trigger?: 'manual' | 'scheduler' }} [opts]
 * @returns {Promise<object>}
 */
export async function runLabX402Payment(payerAddress, opts = {}) {
  const trigger = opts.trigger === 'scheduler' ? 'scheduler' : 'manual';
  const keypair = await getLabWalletKeypairByAddress(payerAddress);
  if (!keypair) {
    throw new Error(`Lab payer wallet not found: ${payerAddress}`);
  }

  const endpoint = opts.endpoint
    ? findLabX402Endpoint(opts.endpoint)
    : pickRandomLabX402Endpoint();
  if (!endpoint) {
    throw new Error('Unknown x402 endpoint');
  }

  const url = `${getApiBaseUrl()}${endpoint.path}`;
  const headers = {
    Accept: 'application/json',
    'x-lab-x402-trigger': trigger,
  };
  const apiKey = getServerApiKey();
  if (apiKey) headers['X-API-Key'] = apiKey;

  const paymentFetch = await getPaymentFetchForKeypair(keypair);
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
      errorMsg =
        responseBody?.error ||
        responseBody?.message ||
        `HTTP ${res.status}`;
      const looksLikeUpstreamData =
        /pyth|hermes|upstream|oracle|not found|timeout|ECONN|ENOTFOUND|502|503/i.test(
          String(errorMsg),
        );
      await logLabX402Call({
        payerAddress: keypair.publicKey.toBase58(),
        endpoint: endpoint.path,
        priceUsd: endpoint.priceUsd,
        status: looksLikeUpstreamData ? 'error' : 'payment_failed',
        paymentTx,
        error: String(errorMsg).slice(0, 500),
        trigger,
      });
      return {
        success: false,
        endpoint: endpoint.path,
        priceUsd: endpoint.priceUsd,
        httpStatus,
        error: errorMsg,
      };
    }

    return {
      success: true,
      endpoint: endpoint.path,
      priceUsd: endpoint.priceUsd,
      httpStatus,
      data: responseBody,
      paymentTx,
    };
  } catch (e) {
    errorMsg = e?.message || String(e);
    await logLabX402Call({
      payerAddress: keypair.publicKey.toBase58(),
      endpoint: endpoint.path,
      priceUsd: endpoint.priceUsd,
      status: 'error',
      error: errorMsg.slice(0, 500),
      trigger,
    });
    return {
      success: false,
      endpoint: endpoint.path,
      priceUsd: endpoint.priceUsd,
      error: errorMsg,
    };
  }
}

/**
 * @returns {Promise<object>}
 */
export async function getLabX402Settings() {
  let doc = await LabX402Settings.findOne({ singletonKey: 'default' }).lean();
  if (!doc) {
    doc = (await LabX402Settings.create({ singletonKey: 'default' })).toObject();
  }
  return {
    autoCallEnabled: doc.autoCallEnabled ?? false,
    intervalMs: doc.intervalMs ?? 300_000,
    refundEnabled: doc.refundEnabled ?? true,
    jitterPct: doc.jitterPct ?? 20,
    maxDailyCalls: doc.maxDailyCalls ?? 2000,
    updatedAt: doc.updatedAt,
  };
}

/**
 * @param {Partial<{ autoCallEnabled: boolean; intervalMs: number; refundEnabled: boolean; jitterPct: number }>} patch
 * @returns {Promise<object>}
 */
export async function updateLabX402Settings(patch) {
  const update = {};
  if (typeof patch.autoCallEnabled === 'boolean') update.autoCallEnabled = patch.autoCallEnabled;
  if (typeof patch.intervalMs === 'number' && patch.intervalMs >= 60_000 && patch.intervalMs <= 3_600_000) {
    update.intervalMs = Math.round(patch.intervalMs);
  }
  if (typeof patch.refundEnabled === 'boolean') update.refundEnabled = patch.refundEnabled;
  if (typeof patch.jitterPct === 'number' && patch.jitterPct >= 0 && patch.jitterPct <= 50) {
    update.jitterPct = Math.round(patch.jitterPct);
  }
  if (typeof patch.maxDailyCalls === 'number' && patch.maxDailyCalls >= 100 && patch.maxDailyCalls <= 10_000) {
    update.maxDailyCalls = Math.round(patch.maxDailyCalls);
  }

  const doc = await LabX402Settings.findOneAndUpdate(
    { singletonKey: 'default' },
    { $set: update, $setOnInsert: { singletonKey: 'default' } },
    { upsert: true, new: true, lean: true },
  );
  return {
    autoCallEnabled: doc.autoCallEnabled ?? false,
    intervalMs: doc.intervalMs ?? 300_000,
    refundEnabled: doc.refundEnabled ?? true,
    jitterPct: doc.jitterPct ?? 20,
    maxDailyCalls: doc.maxDailyCalls ?? 2000,
    updatedAt: doc.updatedAt,
  };
}

/**
 * @param {{ limit?: number }} [opts]
 * @returns {Promise<object[]>}
 */
export async function listLabX402Calls(opts = {}) {
  const limit = Math.min(Math.max(Number(opts.limit) || 10, 1), 200);
  const docs = await LabX402Call.find().sort({ createdAt: -1 }).limit(limit).lean();
  return docs.map((d) => ({
    id: d._id.toString(),
    payerAddress: d.payerAddress,
    endpoint: d.endpoint,
    priceUsd: d.priceUsd,
    status: d.status,
    paymentTx: d.paymentTx,
    refundTx: d.refundTx,
    error: d.error,
    trigger: d.trigger,
    createdAt: d.createdAt,
  }));
}
