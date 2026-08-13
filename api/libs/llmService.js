/**
 * LLM Exchange helpers — serialize listings, encrypt API keys, quote prices,
 * record seller earnings, and claim payouts.
 */
import crypto from 'node:crypto';
import LlmProvider from '../models/LlmProvider.js';
import LlmProviderEarnings from '../models/LlmProviderEarnings.js';
import AgentWallet from '../models/agent/AgentWallet.js';
import { isMongooseConnected } from '../config/mongoose.js';
import {
  LLM_EXCHANGE_MARGIN,
  LLM_EXCHANGE_FLOOR_USD,
  LLM_EXCHANGE_DEFAULT_MAX_TOKENS,
  LLM_EXCHANGE_SELLER_FEE_BPS,
  LLM_EXCHANGE_STAKER_FEE_BPS,
  LLM_EXCHANGE_STAKER_MIN_SYRA,
} from '../config/x402Pricing.js';
import { encryptSecretForStorage, decryptSecretFromStorage } from '../utils/secretsCrypto.js';
import { validateUpstreamUrl } from './skillUpstreamGuard.js';
import { resolveCreatorEarnPayTo } from './skillService.js';
import { baseAnonymousIdFrom } from './agentWalletPurpose.js';
import { estimateTokens } from './openrouterModelPricing.js';
import {
  getLlmAdapter,
  normalizeAuthConfig,
  normalizeLlmProtocol,
  resolveProtocolBaseUrl,
} from './llmAdapters.js';

const MIN_CLAIM_USD = 0.01;

/**
 * @param {string} title
 */
export function slugifyLlmTitle(title) {
  const base = String(title || 'llm')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  const suffix = crypto.randomBytes(3).toString('hex');
  return `${base || 'llm'}-${suffix}`;
}

/**
 * @param {string | null | undefined} apiKey
 */
export function encryptLlmApiKey(apiKey) {
  if (apiKey == null || typeof apiKey !== 'string' || !apiKey.trim()) return null;
  return encryptSecretForStorage(apiKey.trim());
}

/**
 * @param {string | null | undefined} stored
 */
export function decryptLlmApiKey(stored) {
  if (!stored) return null;
  try {
    return decryptSecretFromStorage(stored);
  } catch {
    return null;
  }
}

/**
 * Normalize pricing payload from create/update body.
 * @param {unknown} raw
 */
export function normalizePricing(raw) {
  const p = raw && typeof raw === 'object' ? raw : {};
  const mode = p.mode === 'flat' ? 'flat' : 'per_million_tokens';
  const inputUsdPer1M = Math.max(0, Number(p.inputUsdPer1M) || 0);
  const outputUsdPer1M = Math.max(0, Number(p.outputUsdPer1M) || 0);
  const flatUsdPerCall = Math.max(0, Number(p.flatUsdPerCall) || 0);

  if (mode === 'flat') {
    if (flatUsdPerCall < 0.0001) {
      return { ok: false, error: 'flatUsdPerCall must be at least 0.0001' };
    }
  } else if (inputUsdPer1M <= 0 && outputUsdPer1M <= 0) {
    return { ok: false, error: 'inputUsdPer1M or outputUsdPer1M must be > 0' };
  }

  return {
    ok: true,
    pricing: { mode, inputUsdPer1M, outputUsdPer1M, flatUsdPerCall },
  };
}

/**
 * Quote seller base price (before platform margin) for a request body.
 * @param {{ pricing?: object }} provider
 * @param {{ messages?: unknown[]; max_tokens?: unknown }} body
 */
export function quoteProviderBaseUsd(provider, body = {}) {
  const pricing = provider?.pricing || {};
  if (pricing.mode === 'flat') {
    return Math.max(0, Number(pricing.flatUsdPerCall) || 0);
  }

  const messages = Array.isArray(body.messages) ? body.messages : [];
  const promptTokens = Math.max(1, estimateTokens(messages));
  let maxTokens = Number(body.max_tokens);
  if (!Number.isFinite(maxTokens) || maxTokens < 1) {
    maxTokens = LLM_EXCHANGE_DEFAULT_MAX_TOKENS;
  }
  maxTokens = Math.min(Math.floor(maxTokens), 32_768);

  const inputRate = (Number(pricing.inputUsdPer1M) || 0) / 1_000_000;
  const outputRate = (Number(pricing.outputUsdPer1M) || 0) / 1_000_000;
  return promptTokens * inputRate + maxTokens * outputRate;
}

/**
 * Caller-facing price = seller base × margin, with floor.
 * @param {number} baseUsd
 * @param {number} [margin]
 */
export function applyLlmExchangeMargin(baseUsd, margin = LLM_EXCHANGE_MARGIN) {
  const n = Number(baseUsd);
  if (!Number.isFinite(n) || n <= 0) return LLM_EXCHANGE_FLOOR_USD;
  return Math.max(LLM_EXCHANGE_FLOOR_USD, n * margin);
}

/**
 * Resolve platform fee bps for a seller (lower fee when they hold/stake enough $SYRA).
 * @param {string | null | undefined} payoutWallet
 */
export async function resolveSellerFeeBps(payoutWallet) {
  const wallet = typeof payoutWallet === 'string' ? payoutWallet.trim() : '';
  if (!wallet || wallet.startsWith('0x')) return LLM_EXCHANGE_SELLER_FEE_BPS;

  try {
    const { getSyraBalance } = await import('./syraToken.js');
    const { getActiveStakedSyra } = await import('./syraStakingEligibility.js');
    const [bal, staked] = await Promise.all([
      getSyraBalance(wallet).catch(() => 0),
      getActiveStakedSyra(wallet).catch(() => 0),
    ]);
    const amount = Math.max(Number(bal) || 0, Number(staked) || 0);
    if (amount >= LLM_EXCHANGE_STAKER_MIN_SYRA) {
      return LLM_EXCHANGE_STAKER_FEE_BPS;
    }
  } catch {
    /* ignore */
  }
  return LLM_EXCHANGE_SELLER_FEE_BPS;
}

/**
 * Split a settled USD charge into platform fee + seller share.
 * @param {number} priceUsd
 * @param {number} feeBps
 */
export function splitLlmExchangeRevenue(priceUsd, feeBps = LLM_EXCHANGE_SELLER_FEE_BPS) {
  const gross = Math.max(0, Number(priceUsd) || 0);
  const bps = Math.min(10_000, Math.max(0, Math.floor(feeBps)));
  const platformFeeUsd = (gross * bps) / 10_000;
  const sellerShareUsd = Math.max(0, gross - platformFeeUsd);
  return {
    grossUsd: gross,
    platformFeeUsd,
    sellerShareUsd,
    feeBps: bps,
    amountMicroUsdc: Math.round(gross * 1_000_000),
    platformFeeMicroUsdc: Math.round(platformFeeUsd * 1_000_000),
    sellerShareMicroUsdc: Math.round(sellerShareUsd * 1_000_000),
  };
}

/**
 * Public / owner serialization (never includes API key).
 * @param {object} doc
 * @param {{ includeOwnerFields?: boolean }} [opts]
 */
export function serializeLlmProvider(doc, opts = {}) {
  const includeOwner = Boolean(opts.includeOwnerFields);
  const health = doc.health || {};
  const pricing = doc.pricing || {};
  const capabilities = doc.capabilities || {};

  const callerPriceHint =
    pricing.mode === 'flat'
      ? applyLlmExchangeMargin(pricing.flatUsdPerCall || 0)
      : null;

  const protocol = normalizeLlmProtocol(doc.protocol);
  const authConfig = normalizeAuthConfig(doc.authConfig);

  return {
    id: String(doc._id),
    creatorAnonymousId: doc.creatorAnonymousId,
    slug: doc.slug,
    title: doc.title,
    description: doc.description ?? '',
    protocol,
    baseUrl: includeOwner ? doc.baseUrl : redactBaseUrl(doc.baseUrl),
    authConfig: includeOwner
      ? {
          chatPath: authConfig.chatPath || '',
          authHeader: authConfig.authHeader || '',
          authScheme: authConfig.authScheme || '',
          apiVersion: authConfig.apiVersion || '',
          extraHeaders: authConfig.extraHeaders || {},
        }
      : undefined,
    hasApiKey: Boolean(doc.apiKeyEnc) || Boolean(doc.isSystemFallback),
    models: Array.isArray(doc.models)
      ? doc.models.map((m) => ({
          id: m.id,
          displayName: m.displayName || m.id,
        }))
      : [],
    pricing: {
      mode: pricing.mode || 'per_million_tokens',
      inputUsdPer1M: Number(pricing.inputUsdPer1M) || 0,
      outputUsdPer1M: Number(pricing.outputUsdPer1M) || 0,
      flatUsdPerCall: Number(pricing.flatUsdPerCall) || 0,
    },
    callerPriceHintUsd: callerPriceHint,
    capabilities: {
      contextWindow: Number(capabilities.contextWindow) || 8192,
      streaming: Boolean(capabilities.streaming),
      tools: Boolean(capabilities.tools),
      modalities: Array.isArray(capabilities.modalities)
        ? capabilities.modalities
        : ['text'],
    },
    payoutWallet: includeOwner ? doc.payoutWallet ?? null : null,
    payToChain: doc.payToChain ?? 'solana',
    status: doc.status,
    isSystemFallback: Boolean(doc.isSystemFallback),
    featured: Boolean(doc.featured),
    health: {
      successRate: Number(health.successRate) || 0,
      p50LatencyMs: health.p50LatencyMs ?? null,
      p95LatencyMs: health.p95LatencyMs ?? null,
      consecutiveFailures: Number(health.consecutiveFailures) || 0,
      lastProbeAt: health.lastProbeAt ?? null,
      lastSuccessAt: health.lastSuccessAt ?? null,
      callabilityScore: Number(health.callabilityScore) || 0,
    },
    useCount: doc.useCount ?? 0,
    totalRevenueUsd: includeOwner ? Number(doc.totalRevenueUsd) || 0 : undefined,
    totalSellerEarnedUsd: includeOwner
      ? Number(doc.totalSellerEarnedUsd) || 0
      : undefined,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

/**
 * @param {string} url
 */
function redactBaseUrl(url) {
  try {
    const u = new URL(String(url || ''));
    return `${u.protocol}//${u.host}`;
  } catch {
    return null;
  }
}

/**
 * Validate + normalize provider base URL.
 * When empty, falls back to protocol defaults (anthropic / google).
 * @param {string} raw
 * @param {{ protocol?: string }} [opts]
 */
export async function validateLlmBaseUrl(raw, opts = {}) {
  const protocol = normalizeLlmProtocol(opts.protocol);
  const resolved = resolveProtocolBaseUrl(protocol, raw);
  if (!resolved) {
    return { ok: false, error: 'baseUrl is required for this protocol' };
  }

  // Allow paths like https://host/v1 — validate host via SSRF guard on origin+path.
  const check = await validateUpstreamUrl(resolved);
  if (!check.ok) return check;

  return {
    ok: true,
    url: check.url.toString().replace(/\/+$/, ''),
    protocol,
  };
}

/**
 * Probe upstream via the provider's protocol adapter (no charge).
 * @param {{ baseUrl: string; apiKeyEnc?: string | null; models?: Array<{ id: string }>; protocol?: string; authConfig?: object }} provider
 * @param {{ modelId?: string; timeoutMs?: number }} [opts]
 */
export async function testLlmProviderConnection(provider, opts = {}) {
  const protocol = normalizeLlmProtocol(provider.protocol);
  const adapter = getLlmAdapter(protocol);
  const base = adapter.resolveBaseUrl(provider.baseUrl);
  const modelId =
    opts.modelId ||
    provider.models?.[0]?.id ||
    (protocol === 'anthropic'
      ? 'claude-3-5-sonnet-latest'
      : protocol === 'google'
        ? 'gemini-1.5-pro'
        : 'gpt-4o-mini');
  const apiKey = decryptLlmApiKey(provider.apiKeyEnc);
  const timeoutMs = Math.min(Math.max(Number(opts.timeoutMs) || 12_000, 3_000), 30_000);
  const authConfig = normalizeAuthConfig(provider.authConfig);
  const probeBody = adapter.buildProbe(modelId);
  const built = adapter.buildRequest({
    base,
    modelId,
    apiKey,
    body: probeBody,
    authConfig,
  });

  const urlCheck = await validateUpstreamUrl(built.url.split('?')[0]);
  if (!urlCheck.ok) {
    return { ok: false, status: 0, latencyMs: 0, error: urlCheck.error, modelId };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const started = Date.now();

  try {
    const res = await fetch(built.url, {
      method: built.method || 'POST',
      headers: built.headers,
      body: JSON.stringify(built.body),
      signal: controller.signal,
    });
    const latencyMs = Date.now() - started;
    const text = await res.text().catch(() => '');
    let json = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      /* ignore */
    }

    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        latencyMs,
        error: adapter.parseError(json, text) || `HTTP ${res.status}`,
        modelId,
      };
    }

    return { ok: true, status: res.status, latencyMs, modelId };
  } catch (e) {
    return {
      ok: false,
      status: 0,
      latencyMs: Date.now() - started,
      error: e instanceof Error ? e.message : String(e),
      modelId,
    };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Record seller earning after a settled LLM route call.
 */
export async function recordLlmProviderEarning(opts) {
  if (!isMongooseConnected()) return null;
  const {
    providerId,
    creatorAnonymousId,
    payoutWallet,
    paidPath = '/llm/route',
    priceUsd,
    feeBps,
    callIdempotencyKey,
    paidApiCallId,
    modelId,
    routePolicy,
  } = opts;

  if (!providerId || !creatorAnonymousId) return null;
  const split = splitLlmExchangeRevenue(priceUsd, feeBps);

  try {
    const earning = await LlmProviderEarnings.create({
      creatorAnonymousId,
      providerId,
      payoutWallet: payoutWallet ?? null,
      paidPath,
      amountMicroUsdc: split.amountMicroUsdc,
      sellerShareMicroUsdc: split.sellerShareMicroUsdc,
      platformFeeMicroUsdc: split.platformFeeMicroUsdc,
      status: 'pending',
      paidApiCallId: paidApiCallId ?? null,
      callIdempotencyKey: callIdempotencyKey || undefined,
      modelId: modelId ?? null,
      routePolicy: routePolicy ?? null,
    });

    await LlmProvider.updateOne(
      { _id: providerId },
      {
        $inc: {
          useCount: 1,
          totalRevenueUsd: split.grossUsd,
          totalSellerEarnedUsd: split.sellerShareUsd,
        },
      },
    );

    return { earning, split };
  } catch (e) {
    // Duplicate idempotency key → already recorded.
    if (e && (e.code === 11000 || String(e.message || '').includes('duplicate'))) {
      return null;
    }
    throw e;
  }
}

/**
 * Earnings summary for a creator.
 * @param {string} creatorAnonymousId
 */
export async function getLlmEarningsSummary(creatorAnonymousId) {
  if (!isMongooseConnected()) {
    return {
      pendingUsd: 0,
      paidUsd: 0,
      totalUsd: 0,
      pendingMicroUsdc: 0,
      paidMicroUsdc: 0,
      earnings: [],
    };
  }

  const base = baseAnonymousIdFrom(creatorAnonymousId) || creatorAnonymousId;
  const earnings = await LlmProviderEarnings.find({ creatorAnonymousId: base })
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  let pendingMicroUsdc = 0;
  let paidMicroUsdc = 0;
  for (const e of earnings) {
    if (e.status === 'paid') paidMicroUsdc += e.sellerShareMicroUsdc ?? 0;
    else if (e.status === 'pending') pendingMicroUsdc += e.sellerShareMicroUsdc ?? 0;
  }

  return {
    pendingMicroUsdc,
    paidMicroUsdc,
    totalMicroUsdc: pendingMicroUsdc + paidMicroUsdc,
    pendingUsd: pendingMicroUsdc / 1_000_000,
    paidUsd: paidMicroUsdc / 1_000_000,
    totalUsd: (pendingMicroUsdc + paidMicroUsdc) / 1_000_000,
    earnings: earnings.map((e) => ({
      id: String(e._id),
      providerId: String(e.providerId),
      paidPath: e.paidPath,
      sellerShareUsd: (e.sellerShareMicroUsdc ?? 0) / 1_000_000,
      platformFeeUsd: (e.platformFeeMicroUsdc ?? 0) / 1_000_000,
      status: e.status,
      modelId: e.modelId,
      routePolicy: e.routePolicy,
      payoutTxSignature: e.payoutTxSignature,
      createdAt: e.createdAt,
      paidAt: e.paidAt,
    })),
  };
}

/**
 * Mark pending LLM earnings as paid for the session creator.
 * Mirrors processEarnPayout (treasury-gated ops wire USDC transfer separately).
 * @param {{ creatorAnonymousId: string; maxPayoutUsd?: number }} opts
 */
export async function claimLlmProviderPayout(opts) {
  if (!isMongooseConnected()) {
    return { success: false, error: 'Database not connected' };
  }

  const base = baseAnonymousIdFrom(opts.creatorAnonymousId) || opts.creatorAnonymousId;
  const maxMicro = Math.floor((Number(opts.maxPayoutUsd) || 1_000_000) * 1_000_000);

  const pending = await LlmProviderEarnings.find({
    creatorAnonymousId: base,
    status: 'pending',
  })
    .sort({ createdAt: 1 })
    .lean();

  let total = 0;
  const ids = [];
  for (const e of pending) {
    const share = e.sellerShareMicroUsdc ?? 0;
    if (total + share > maxMicro) break;
    total += share;
    ids.push(e._id);
  }

  if (ids.length === 0 || total / 1_000_000 < MIN_CLAIM_USD) {
    return {
      success: false,
      error: `No claimable earnings (minimum $${MIN_CLAIM_USD})`,
    };
  }

  let payoutWallet = null;
  try {
    const { payToAddress } = await resolveCreatorEarnPayTo(base);
    payoutWallet = payToAddress;
  } catch {
    const wallet = await AgentWallet.findOne({
      anonymousId: base,
      status: { $ne: 'retired' },
    }).lean();
    payoutWallet = wallet?.agentAddress ?? wallet?.walletAddress ?? null;
  }

  const stubSig = `llm-payout-pending:${base}:${Date.now()}`;
  await LlmProviderEarnings.updateMany(
    { _id: { $in: ids } },
    {
      $set: {
        status: 'paid',
        paidAt: new Date(),
        payoutTxSignature: stubSig,
        payoutWallet: payoutWallet,
      },
    },
  );

  return {
    success: true,
    claimedUsd: total / 1_000_000,
    claimedMicroUsdc: total,
    count: ids.length,
    payoutWallet,
    payoutTxSignature: stubSig,
    note: 'Earnings marked paid. Treasury USDC transfer is processed by ops / payout worker.',
  };
}

/**
 * Public marketplace leaderboard snapshot for metrics.
 */
export async function buildLlmExchangeMetricsSnapshot() {
  if (!isMongooseConnected()) {
    return {
      activeProviders: 0,
      totalCalls: 0,
      totalVolumeUsd: 0,
      topProviders: [],
    };
  }

  const [activeProviders, volumeAgg, top] = await Promise.all([
    LlmProvider.countDocuments({ status: 'active', isSystemFallback: { $ne: true } }),
    LlmProvider.aggregate([
      { $match: { isSystemFallback: { $ne: true } } },
      {
        $group: {
          _id: null,
          totalCalls: { $sum: '$useCount' },
          totalVolumeUsd: { $sum: '$totalRevenueUsd' },
        },
      },
    ]),
    LlmProvider.find({ status: 'active', isSystemFallback: { $ne: true } })
      .sort({ totalRevenueUsd: -1, useCount: -1 })
      .limit(10)
      .select({
        title: 1,
        slug: 1,
        useCount: 1,
        totalRevenueUsd: 1,
        'health.callabilityScore': 1,
        featured: 1,
      })
      .lean(),
  ]);

  const vol = volumeAgg[0] || {};
  return {
    activeProviders,
    totalCalls: vol.totalCalls ?? 0,
    totalVolumeUsd: Number(vol.totalVolumeUsd) || 0,
    topProviders: top.map((p) => ({
      id: String(p._id),
      title: p.title,
      slug: p.slug,
      useCount: p.useCount ?? 0,
      volumeUsd: Number(p.totalRevenueUsd) || 0,
      callabilityScore: Number(p.health?.callabilityScore) || 0,
      featured: Boolean(p.featured),
    })),
  };
}
