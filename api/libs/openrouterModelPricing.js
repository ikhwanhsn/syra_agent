/**
 * OpenRouter model pricing cache + per-request /chat/completions price estimation.
 * Rates sourced from GET /models (pricing.prompt, pricing.completion, pricing.request).
 */
import {
  X402_CHAT_PRICE_MARGIN,
  X402_CHAT_PRICE_FLOOR_USD,
  X402_CHAT_DEFAULT_MAX_TOKENS,
} from '../config/x402Pricing.js';
import { OPENROUTER_DEFAULT_MODEL } from '../config/openrouterModels.js';
import { resolveOpenRouterModelId } from './openrouter.js';
import { getOpenRouterX402ApiKey } from './openrouterX402.js';

const OPENROUTER_BASE = (process.env.OPENROUTER_API_BASE || 'https://openrouter.ai/api/v1').replace(
  /\/$/,
  ''
);

const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

/** @type {{ fetchedAt: number; byId: Map<string, { promptRate: number; completionRate: number; requestFee: number; contextLength: number | null }> } | null} */
let pricingCache = null;

/**
 * @param {unknown} value
 * @returns {number}
 */
function parseUsdRate(value) {
  if (value == null) return 0;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

/**
 * Serialize message content to a string for token estimation.
 * @param {unknown} content
 * @returns {string}
 */
function serializeMessageContent(content) {
  if (typeof content === 'string') return content;
  if (content == null) return '';
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === 'string') return part;
        if (part && typeof part === 'object') {
          if (typeof part.text === 'string') return part.text;
          if (typeof part.content === 'string') return part.content;
          try {
            return JSON.stringify(part);
          } catch {
            return '';
          }
        }
        return '';
      })
      .join('');
  }
  if (typeof content === 'object') {
    try {
      return JSON.stringify(content);
    } catch {
      return '';
    }
  }
  return String(content);
}

/**
 * Rough token estimate from messages (chars/4 + per-message overhead, ×1.1 safety).
 * @param {Array<{ role?: string; content?: unknown; tool_calls?: unknown[]; name?: string }>} messages
 * @returns {number}
 */
export function estimateTokens(messages) {
  if (!Array.isArray(messages) || messages.length === 0) return 0;
  let chars = 0;
  for (const msg of messages) {
    if (!msg || typeof msg !== 'object') continue;
    chars += serializeMessageContent(msg.content).length;
    if (Array.isArray(msg.tool_calls)) {
      try {
        chars += JSON.stringify(msg.tool_calls).length;
      } catch {
        /* ignore */
      }
    }
    if (typeof msg.name === 'string') chars += msg.name.length;
    chars += 12;
  }
  const base = Math.ceil(chars / 4);
  return Math.ceil(base * 1.1);
}

/**
 * @param {number} maxTokens
 * @param {number | null | undefined} contextLength
 * @returns {number}
 */
function clampMaxTokens(maxTokens, contextLength) {
  const requested = Number.isFinite(maxTokens) && maxTokens > 0 ? Math.floor(maxTokens) : X402_CHAT_DEFAULT_MAX_TOKENS;
  const cap =
    contextLength != null && Number.isFinite(contextLength) && contextLength > 0
      ? Math.min(requested, Math.floor(contextLength * 0.5))
      : requested;
  return Math.max(1, Math.min(cap, 32_768));
}

async function refreshPricingCache() {
  const apiKey = getOpenRouterX402ApiKey();
  const byId = new Map();
  if (!apiKey) {
    pricingCache = { fetchedAt: Date.now(), byId };
    return;
  }
  try {
    const res = await fetch(`${OPENROUTER_BASE}/models`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!res.ok) {
      pricingCache = { fetchedAt: Date.now(), byId };
      return;
    }
    const data = await res.json();
    const list = data?.data ?? [];
    if (Array.isArray(list)) {
      for (const m of list) {
        const id = m?.id;
        if (!id || typeof id !== 'string') continue;
        const pricing = m?.pricing ?? {};
        byId.set(id, {
          promptRate: parseUsdRate(pricing.prompt),
          completionRate: parseUsdRate(pricing.completion),
          requestFee: parseUsdRate(pricing.request),
          contextLength:
            typeof m.context_length === 'number' && m.context_length > 0 ? m.context_length : null,
        });
      }
    }
  } catch (e) {
    console.warn('[openrouter-pricing] failed to fetch /models:', e instanceof Error ? e.message : e);
  }
  pricingCache = { fetchedAt: Date.now(), byId };
}

/**
 * @param {string} modelId
 * @returns {Promise<{ promptRate: number; completionRate: number; requestFee: number; contextLength: number | null } | null>}
 */
export async function getModelPricing(modelId) {
  const id = resolveOpenRouterModelId(modelId || OPENROUTER_DEFAULT_MODEL);
  if (!pricingCache || Date.now() - pricingCache.fetchedAt > CACHE_TTL_MS) {
    await refreshPricingCache();
  }
  return pricingCache?.byId.get(id) ?? null;
}

/**
 * Compute x402 list price for a chat completion request (USD, before playground discount).
 * @param {{ model?: string; messages?: unknown[]; max_tokens?: number }} body
 * @returns {Promise<number>}
 */
export async function computeChatCompletionPriceUsd(body) {
  const model = resolveOpenRouterModelId(
    body?.model && typeof body.model === 'string' ? body.model.trim() : OPENROUTER_DEFAULT_MODEL
  );
  const messages = Array.isArray(body?.messages) ? body.messages : [];
  const pricing = await getModelPricing(model);

  const estPrompt = estimateTokens(messages);
  const outBudget = clampMaxTokens(
    body?.max_tokens != null ? Number(body.max_tokens) : X402_CHAT_DEFAULT_MAX_TOKENS,
    pricing?.contextLength ?? null
  );

  if (!pricing) {
    return X402_CHAT_PRICE_FLOOR_USD;
  }

  const upstream =
    pricing.requestFee + estPrompt * pricing.promptRate + outBudget * pricing.completionRate;
  const withMargin = upstream * X402_CHAT_PRICE_MARGIN;
  return Math.max(X402_CHAT_PRICE_FLOOR_USD, withMargin);
}

/**
 * Expose live rates for GET /chat/completions/models.
 * @param {string} modelId
 * @returns {Promise<{ id: string; promptRateUsd: number; completionRateUsd: number; requestFeeUsd: number; contextLength: number | null } | null>}
 */
export async function getModelPricingPublic(modelId) {
  const id = resolveOpenRouterModelId(modelId);
  const p = await getModelPricing(id);
  if (!p) return null;
  return {
    id,
    promptRateUsd: p.promptRate,
    completionRateUsd: p.completionRate,
    requestFeeUsd: p.requestFee,
    contextLength: p.contextLength,
  };
}
