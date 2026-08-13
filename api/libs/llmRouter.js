/**
 * Smart LLM router — pick cheapest / most-callable / fastest / quality provider,
 * proxy via protocol adapters (openai / anthropic / google / openai_custom),
 * normalize to OpenAI chat.completion, failover on error.
 */
import LlmProvider from '../models/LlmProvider.js';
import { isMongooseConnected } from '../config/mongoose.js';
import { OPENROUTER_DEFAULT_MODEL } from '../config/openrouterModels.js';
import { X402_CHAT_DEFAULT_MAX_TOKENS } from '../config/x402Pricing.js';
import { callOpenRouterChatCompletion } from './openrouter.js';
import {
  applyLlmExchangeMargin,
  decryptLlmApiKey,
  quoteProviderBaseUsd,
  resolveSellerFeeBps,
  serializeLlmProvider,
} from './llmService.js';
import { validateUpstreamUrl } from './skillUpstreamGuard.js';
import {
  getLlmAdapter,
  normalizeAuthConfig,
  normalizeLlmProtocol,
} from './llmAdapters.js';

export const LLM_ROUTE_POLICIES = Object.freeze([
  'cheapest',
  'reliable',
  'fastest',
  'quality',
]);

const SYSTEM_FALLBACK_ID = 'syra-openrouter-fallback';
const UPSTREAM_TIMEOUT_MS = 45_000;
const MAX_FAILOVER = 3;

/**
 * Virtual system fallback (Syra OpenRouter). Always available as last resort.
 */
export function getSystemFallbackProvider() {
  return {
    _id: SYSTEM_FALLBACK_ID,
    id: SYSTEM_FALLBACK_ID,
    creatorAnonymousId: 'system:syra',
    slug: 'syra-openrouter',
    title: 'Syra OpenRouter',
    description: 'Syra-operated OpenRouter fallback for the LLM Exchange router.',
    baseUrl: 'https://openrouter.ai/api/v1',
    protocol: 'openai',
    authConfig: {},
    apiKeyEnc: null,
    models: [{ id: OPENROUTER_DEFAULT_MODEL, displayName: OPENROUTER_DEFAULT_MODEL }],
    pricing: {
      mode: 'per_million_tokens',
      inputUsdPer1M: 0.15,
      outputUsdPer1M: 0.6,
      flatUsdPerCall: 0,
    },
    capabilities: {
      contextWindow: 128_000,
      streaming: false,
      tools: true,
      modalities: ['text'],
    },
    payoutWallet: null,
    status: 'active',
    isSystemFallback: true,
    featured: true,
    health: {
      successRate: 0.99,
      p50LatencyMs: 800,
      p95LatencyMs: 2500,
      consecutiveFailures: 0,
      callabilityScore: 0.95,
    },
    useCount: 0,
  };
}

/**
 * @param {string | null | undefined} raw
 */
export function parseRoutePolicy(raw) {
  const v = String(raw || 'cheapest').trim().toLowerCase();
  if (LLM_ROUTE_POLICIES.includes(v)) return v;
  return 'cheapest';
}

/**
 * Load active marketplace providers (+ optional model filter).
 * @param {{ modelId?: string | null }} [opts]
 */
export async function listRoutableProviders(opts = {}) {
  const fallback = getSystemFallbackProvider();
  if (!isMongooseConnected()) return [fallback];

  const filter = {
    status: 'active',
    isSystemFallback: { $ne: true },
  };
  if (opts.modelId) {
    filter['models.id'] = String(opts.modelId).trim();
  }

  const docs = await LlmProvider.find(filter).lean();
  // Prefer featured listings slightly via sort in score; keep raw list here.
  return [...docs, fallback];
}

/**
 * Score a provider for a policy (higher = better).
 * @param {object} provider
 * @param {'cheapest'|'reliable'|'fastest'|'quality'} policy
 * @param {number} baseUsd
 */
export function scoreProvider(provider, policy, baseUsd) {
  const health = provider.health || {};
  const callability = clamp01(Number(health.callabilityScore) ?? Number(health.successRate) ?? 0.5);
  const latency = Number(health.p50LatencyMs);
  const latencyScore =
    Number.isFinite(latency) && latency > 0
      ? clamp01(1 - Math.min(latency, 10_000) / 10_000)
      : 0.5;
  const price = Math.max(baseUsd, 1e-9);
  const priceScore = 1 / price; // cheaper → higher
  const featuredBoost = provider.featured ? 1.05 : 1;
  const qualityHint = provider.isSystemFallback ? 0.85 : callability;

  switch (policy) {
    case 'reliable':
      return callability * 10 * featuredBoost + priceScore * 0.01;
    case 'fastest':
      return latencyScore * 10 * featuredBoost + callability * 2 + priceScore * 0.01;
    case 'quality':
      return qualityHint * 8 + callability * 3 + latencyScore + priceScore * 0.01;
    case 'cheapest':
    default:
      return priceScore * featuredBoost + callability * 0.5 + latencyScore * 0.1;
  }
}

function clamp01(n) {
  if (!Number.isFinite(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

/**
 * Rank providers for a request.
 * @param {object[]} providers
 * @param {object} body
 * @param {string} policy
 */
export function rankProviders(providers, body, policy) {
  const ranked = providers
    .map((p) => {
      const baseUsd = quoteProviderBaseUsd(p, body);
      const callerUsd = applyLlmExchangeMargin(baseUsd);
      return {
        provider: p,
        baseUsd,
        callerUsd,
        score: scoreProvider(p, policy, baseUsd),
      };
    })
    .sort((a, b) => b.score - a.score);

  // Keep system fallback last unless it wins on policy (e.g. reliable when empty market).
  const nonSystem = ranked.filter((r) => !r.provider.isSystemFallback);
  const system = ranked.filter((r) => r.provider.isSystemFallback);
  if (nonSystem.length === 0) return ranked;
  if (policy === 'cheapest' || policy === 'fastest') {
    return [...nonSystem, ...system];
  }
  return ranked;
}

/**
 * Resolve model id for a provider given request body.
 * @param {object} provider
 * @param {object} body
 */
export function resolveProviderModelId(provider, body) {
  const requested = typeof body.model === 'string' ? body.model.trim() : '';
  const models = Array.isArray(provider.models) ? provider.models : [];
  if (requested && models.some((m) => m.id === requested)) return requested;
  if (requested && provider.isSystemFallback) return requested;
  return models[0]?.id || OPENROUTER_DEFAULT_MODEL;
}

/**
 * Proxy chat completion to a marketplace provider.
 * @param {object} provider
 * @param {object} body
 * @param {{ modelId?: string; timeoutMs?: number }} [opts]
 */
export async function proxyLlmProviderChat(provider, body, opts = {}) {
  if (provider.isSystemFallback || String(provider._id) === SYSTEM_FALLBACK_ID) {
    const model = resolveProviderModelId(provider, body);
    const completion = await callOpenRouterChatCompletion({
      model,
      messages: body.messages,
      max_tokens: body.max_tokens ?? X402_CHAT_DEFAULT_MAX_TOKENS,
      temperature: body.temperature,
      tools: body.tools,
      tool_choice: body.tool_choice,
      response_format: body.response_format,
      seed: body.seed,
    });
    return {
      ok: true,
      status: 200,
      latencyMs: 0,
      json: completion,
      modelId: model,
    };
  }

  const protocol = normalizeLlmProtocol(provider.protocol);
  const adapter = getLlmAdapter(protocol);
  const authConfig = normalizeAuthConfig(provider.authConfig);
  const modelId = opts.modelId || resolveProviderModelId(provider, body);
  const apiKey = decryptLlmApiKey(provider.apiKeyEnc);
  const base = adapter.resolveBaseUrl(provider.baseUrl);
  if (!base) {
    return { ok: false, error: 'Provider baseUrl is missing', status: 502, latencyMs: 0 };
  }

  const built = adapter.buildRequest({
    base,
    modelId,
    apiKey,
    body,
    authConfig,
  });

  const urlForGuard = built.url.split('?')[0];
  const urlCheck = await validateUpstreamUrl(urlForGuard);
  if (!urlCheck.ok) {
    return { ok: false, error: urlCheck.error, status: 502, latencyMs: 0 };
  }

  const timeoutMs = Math.min(
    Math.max(Number(opts.timeoutMs) || UPSTREAM_TIMEOUT_MS, 5_000),
    90_000,
  );

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
    const text = await res.text();
    let json = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = { error: { message: text.slice(0, 500) || 'Invalid upstream JSON' } };
    }

    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        latencyMs,
        error: adapter.parseError(json, text) || `Upstream HTTP ${res.status}`,
        json,
        modelId,
        protocol,
      };
    }

    const normalized = adapter.parseResponse(json, { modelId });
    return {
      ok: true,
      status: res.status,
      latencyMs,
      json: normalized,
      modelId,
      protocol,
    };
  } catch (e) {
    return {
      ok: false,
      status: 502,
      latencyMs: Date.now() - started,
      error: e instanceof Error ? e.message : String(e),
      modelId,
      protocol,
    };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Update health after a live call (best-effort).
 * @param {string|object} providerId
 * @param {{ ok: boolean; latencyMs?: number; error?: string }} result
 */
export async function recordProviderCallHealth(providerId, result) {
  if (!isMongooseConnected()) return;
  if (!providerId || String(providerId) === SYSTEM_FALLBACK_ID) return;

  try {
    const doc = await LlmProvider.findById(providerId);
    if (!doc) return;

    const health = doc.health || {};
    const successCount = (health.successCount || 0) + (result.ok ? 1 : 0);
    const failureCount = (health.failureCount || 0) + (result.ok ? 0 : 1);
    const total = successCount + failureCount;
    const successRate = total > 0 ? successCount / total : 1;
    let consecutiveFailures = result.ok ? 0 : (health.consecutiveFailures || 0) + 1;

    const latencies = Array.isArray(health.recentLatenciesMs)
      ? [...health.recentLatenciesMs]
      : [];
    if (Number.isFinite(result.latencyMs) && result.latencyMs >= 0) {
      latencies.push(Math.round(result.latencyMs));
      while (latencies.length > 40) latencies.shift();
    }
    const sorted = [...latencies].sort((a, b) => a - b);
    const p50 =
      sorted.length > 0 ? sorted[Math.floor(sorted.length * 0.5)] : health.p50LatencyMs;
    const p95 =
      sorted.length > 0 ? sorted[Math.floor(sorted.length * 0.95)] : health.p95LatencyMs;

    // Recency-weighted callability: recent success matters more.
    const recency = result.ok ? 1 : Math.max(0, 1 - consecutiveFailures * 0.2);
    const callabilityScore = clamp01(successRate * 0.7 + recency * 0.3);

    doc.health = {
      ...health.toObject?.() ?? health,
      successCount,
      failureCount,
      successRate,
      recentLatenciesMs: latencies,
      p50LatencyMs: p50 ?? null,
      p95LatencyMs: p95 ?? null,
      consecutiveFailures,
      lastProbeAt: new Date(),
      lastSuccessAt: result.ok ? new Date() : health.lastSuccessAt ?? null,
      lastError: result.ok ? null : String(result.error || 'error').slice(0, 300),
      callabilityScore,
    };

    // Auto-pause after repeated failures.
    if (!result.ok && consecutiveFailures >= 5 && doc.status === 'active') {
      doc.status = 'paused';
    }

    await doc.save();
  } catch {
    /* ignore health write failures */
  }
}

/**
 * Full route: pick provider(s), failover, return completion + settlement metadata.
 * @param {{
 *   body: object;
 *   policy?: string;
 *   preferredProviderId?: string | null;
 * }} opts
 */
export async function routeLlmChatCompletion(opts) {
  const body = opts.body && typeof opts.body === 'object' ? opts.body : {};
  const policy = parseRoutePolicy(opts.policy);
  const modelFilter =
    typeof body.model === 'string' && body.model.trim() && !body.model.includes('/')
      ? null // marketplace model ids may be anything; don't over-filter
      : null;

  let providers = await listRoutableProviders({ modelId: modelFilter });

  // If client asks for a specific marketplace model id that matches listings, prefer those.
  if (typeof body.model === 'string' && body.model.trim()) {
    const mid = body.model.trim();
    const matching = providers.filter(
      (p) =>
        p.isSystemFallback ||
        (Array.isArray(p.models) && p.models.some((m) => m.id === mid)),
    );
    if (matching.length > 0) providers = matching;
  }

  if (opts.preferredProviderId) {
    const preferred = providers.find(
      (p) => String(p._id) === String(opts.preferredProviderId),
    );
    if (preferred) {
      providers = [preferred, ...providers.filter((p) => p !== preferred)];
    }
  }

  const ranked = rankProviders(providers, body, policy);
  const attempts = [];
  const maxAttempts = Math.min(MAX_FAILOVER, ranked.length);

  for (let i = 0; i < maxAttempts; i++) {
    const candidate = ranked[i];
    const provider = candidate.provider;
    const started = Date.now();
    const result = await proxyLlmProviderChat(provider, body);
    const latencyMs = result.latencyMs || Date.now() - started;

    attempts.push({
      providerId: String(provider._id),
      slug: provider.slug,
      ok: result.ok,
      status: result.status,
      latencyMs,
      error: result.error || null,
    });

    void recordProviderCallHealth(provider._id, {
      ok: Boolean(result.ok),
      latencyMs,
      error: result.error,
    });

    if (result.ok) {
      const feeBps = provider.isSystemFallback
        ? 10_000 // 100% platform on system fallback
        : await resolveSellerFeeBps(provider.payoutWallet);

      return {
        ok: true,
        completion: result.json,
        provider,
        modelId: result.modelId,
        policy,
        baseUsd: candidate.baseUsd,
        callerUsd: candidate.callerUsd,
        feeBps,
        attempts,
        latencyMs,
      };
    }
  }

  return {
    ok: false,
    error: 'All LLM providers failed for this request',
    attempts,
    policy,
  };
}

/**
 * Discovery list for GET /llm/models
 */
export async function listLlmExchangeModels() {
  const providers = await listRoutableProviders();
  const byModel = new Map();

  for (const p of providers) {
    if (p.status && p.status !== 'active') continue;
    const baseSample = quoteProviderBaseUsd(p, {
      messages: [{ role: 'user', content: 'hi' }],
      max_tokens: LLM_EXCHANGE_DEFAULT_MAX_TOKENS_SAFE(),
    });
    const callerUsd = applyLlmExchangeMargin(baseSample);
    for (const m of p.models || []) {
      const key = m.id;
      const existing = byModel.get(key);
      const entry = {
        id: m.id,
        displayName: m.displayName || m.id,
        providerId: String(p._id),
        providerSlug: p.slug,
        providerTitle: p.title,
        priceHintUsd: callerUsd,
        sellerBaseUsd: baseSample,
        callabilityScore: Number(p.health?.callabilityScore) || 0,
        p50LatencyMs: p.health?.p50LatencyMs ?? null,
        featured: Boolean(p.featured),
        isSystemFallback: Boolean(p.isSystemFallback),
        capabilities: p.capabilities || {},
      };
      if (!existing || entry.priceHintUsd < existing.priceHintUsd) {
        byModel.set(key, entry);
      }
    }
  }

  return [...byModel.values()].sort((a, b) => a.priceHintUsd - b.priceHintUsd);
}

function LLM_EXCHANGE_DEFAULT_MAX_TOKENS_SAFE() {
  return X402_CHAT_DEFAULT_MAX_TOKENS;
}

/**
 * Marketplace catalog serialization helper.
 * @param {object[]} docs
 * @param {{ includeOwnerFields?: boolean }} [opts]
 */
export function serializeMarketplaceProviders(docs, opts = {}) {
  return docs.map((d) => serializeLlmProvider(d, opts));
}
