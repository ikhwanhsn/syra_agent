import {
  OPENROUTER_DEFAULT_MODEL,
  OPENROUTER_MODELS,
  isAllowedOpenRouterModel,
} from '../config/openrouterModels.js';
import { X402_CHAT_DEFAULT_MAX_TOKENS } from '../config/x402Pricing.js';
import { buildOpenRouterX402Headers } from './openrouterX402.js';

/**
 * OpenRouter — OpenAI-compatible chat completions.
 * @see https://openrouter.ai/docs
 */
const OPENROUTER_BASE = (process.env.OPENROUTER_API_BASE || 'https://openrouter.ai/api/v1').replace(/\/$/, '');

/** When the model returns no usable text; agent chat may replace this after deterministic tool runs (e.g. swap). */
export const OPENROUTER_EMPTY_RESPONSE_PLACEHOLDER =
  "I couldn't generate a response for that request. Please try again or rephrase your question.";

/** Legacy short model ids stored on old chats → OpenRouter slug */
const LEGACY_MODEL_MAP = {
  'gpt-oss-120b': 'openai/gpt-oss-120b',
  'kimi-k2.5': 'moonshotai/kimi-k2.5',
  'qwen-2.5-v1-72b': OPENROUTER_DEFAULT_MODEL,
  'deepseek-v3.2': OPENROUTER_DEFAULT_MODEL,
  'glm-4.6v': OPENROUTER_DEFAULT_MODEL,
  'glm-4.7': OPENROUTER_DEFAULT_MODEL,
  'glm-4.7-fp8': OPENROUTER_DEFAULT_MODEL,
  'llama-4-maverick': OPENROUTER_DEFAULT_MODEL,
  'qwen-2.5-vl': OPENROUTER_DEFAULT_MODEL,
  'qwen-3-coder-480b': OPENROUTER_DEFAULT_MODEL,
};

/**
 * @param {string | undefined} modelId
 * @returns {string}
 */
function resolveOpenRouterModelId(modelId) {
  if (!modelId || typeof modelId !== 'string') return OPENROUTER_DEFAULT_MODEL;
  const id = modelId.trim();
  if (LEGACY_MODEL_MAP[id]) return LEGACY_MODEL_MAP[id];
  if (isAllowedOpenRouterModel(id)) return id;
  return OPENROUTER_DEFAULT_MODEL;
}

/**
 * Build OpenRouter request headers.
 * @returns {Record<string, string>}
 */
function buildOpenRouterHeaders() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not set');
  }
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  };
  const referer = process.env.OPENROUTER_HTTP_REFERER;
  if (referer && typeof referer === 'string' && referer.trim()) {
    headers['HTTP-Referer'] = referer.trim();
  }
  const title = process.env.OPENROUTER_APP_TITLE || 'Syra';
  if (title) {
    headers['X-Title'] = title.slice(0, 128);
  }
  return headers;
}

/**
 * Normalize OpenRouter choice payload to user-visible assistant text.
 * Some providers return empty `content` with text in legacy `text` or multipart shapes.
 * @param {object | undefined} choice
 * @returns {string}
 */
function extractAssistantTextFromChoice(choice) {
  const message = choice?.message;
  if (!message || typeof message !== 'object') {
    const legacy = choice?.text;
    return typeof legacy === 'string' ? legacy : '';
  }

  const rawContent = message.content;
  if (typeof rawContent === 'string') {
    return rawContent;
  }
  if (Array.isArray(rawContent)) {
    return rawContent
      .map((part) => {
        if (typeof part === 'string') return part;
        if (part?.type === 'text' && typeof part.text === 'string') return part.text;
        if (part?.type === 'output_text' && typeof part.text === 'string') return part.text;
        return '';
      })
      .join('');
  }

  if (typeof message.refusal === 'string' && message.refusal.trim()) {
    return message.refusal;
  }

  const legacy = choice?.text;
  return typeof legacy === 'string' ? legacy : '';
}

/**
 * @param {Array<{ role: string; content: string }>} messages
 * @param {{ max_tokens?: number; temperature?: number; model?: string; _retryAttempt?: number }} [options]
 * @returns {Promise<{ response: string; raw: object; truncated: boolean; finishReason: string | null; usage: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } | null }>}
 */
export async function callOpenRouter(messages, options = {}) {
  const requestedId = options.model && typeof options.model === 'string' ? options.model.trim() : null;
  const model = resolveOpenRouterModelId(requestedId || OPENROUTER_DEFAULT_MODEL);
  const headers = buildOpenRouterHeaders();

  const response = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model,
      messages,
      stream: false,
      top_p: 1,
      max_tokens: options.max_tokens ?? 2000,
      temperature: options.temperature ?? 0.7,
      presence_penalty: 0,
      frequency_penalty: 0,
    }),
    ...(typeof options.timeoutMs === 'number' && options.timeoutMs > 0
      ? { signal: AbortSignal.timeout(options.timeoutMs) }
      : {}),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const msg =
      data?.error?.message ||
      (typeof data?.error === 'string' ? data.error : null) ||
      'OpenRouter API error';
    const err = new Error(msg);
    err.status = response.status;
    err.raw = data;
    throw err;
  }

  const choice = data?.choices?.[0];
  const textOut = extractAssistantTextFromChoice(choice);
  const finishReason = choice?.finish_reason ?? choice?.finishReason ?? null;
  const trimmed = typeof textOut === 'string' ? textOut.trim() : '';
  const truncated = finishReason === 'length';

  if (!trimmed.length) {
    const retryAttempt = Number(options._retryAttempt) || 0;
    console.warn(
      `[openrouter] empty assistant content (model=${model}, finish=${finishReason ?? 'unknown'}, attempt=${retryAttempt})`
    );
    if (retryAttempt < 1) {
      return callOpenRouter(messages, { ...options, _retryAttempt: retryAttempt + 1 });
    }
  }

  const content = trimmed.length > 0 ? textOut : OPENROUTER_EMPTY_RESPONSE_PLACEHOLDER;

  const u = data?.usage;
  const usage =
    u && typeof u === 'object'
      ? {
          prompt_tokens: typeof u.prompt_tokens === 'number' ? u.prompt_tokens : undefined,
          completion_tokens: typeof u.completion_tokens === 'number' ? u.completion_tokens : undefined,
          total_tokens: typeof u.total_tokens === 'number' ? u.total_tokens : undefined,
        }
      : null;

  return {
    response: truncated
      ? `${content}\n\n[Response was cut off due to length limit. You can ask for more or rephrase.]`
      : content,
    raw: data,
    truncated,
    finishReason: finishReason ?? null,
    usage,
  };
}

/**
 * Agent-tuned OpenAI-compatible chat completion (full upstream response).
 * @param {object} params
 * @param {string} [params.model]
 * @param {Array<{ role: string; content?: unknown }>} params.messages
 * @param {number} [params.max_tokens]
 * @param {number} [params.temperature]
 * @param {number} [params.top_p]
 * @param {number} [params.frequency_penalty]
 * @param {number} [params.presence_penalty]
 * @param {number} [params.seed]
 * @param {string | string[]} [params.stop]
 * @param {unknown[]} [params.tools]
 * @param {unknown} [params.tool_choice]
 * @param {boolean} [params.parallel_tool_calls]
 * @param {unknown} [params.response_format]
 * @param {boolean} [params.stream]
 * @returns {Promise<object>}
 */
export async function callOpenRouterChatCompletion(params) {
  const body = params && typeof params === 'object' ? params : {};
  const messages = Array.isArray(body.messages) ? body.messages : [];
  const model = resolveOpenRouterModelId(
    body.model && typeof body.model === 'string' ? body.model.trim() : OPENROUTER_DEFAULT_MODEL
  );
  const headers = buildOpenRouterX402Headers();

  const payload = {
    model,
    messages,
    stream: false,
    temperature: body.temperature ?? 0.2,
    top_p: body.top_p ?? 1,
    max_tokens: body.max_tokens ?? X402_CHAT_DEFAULT_MAX_TOKENS,
    presence_penalty: body.presence_penalty ?? 0,
    frequency_penalty: body.frequency_penalty ?? 0,
    provider: { require_parameters: true },
    usage: { include: true },
  };

  if (body.seed != null && Number.isFinite(Number(body.seed))) {
    payload.seed = Number(body.seed);
  }
  if (body.stop != null) payload.stop = body.stop;
  if (Array.isArray(body.tools) && body.tools.length > 0) payload.tools = body.tools;
  if (body.tool_choice != null) payload.tool_choice = body.tool_choice;
  if (typeof body.parallel_tool_calls === 'boolean') {
    payload.parallel_tool_calls = body.parallel_tool_calls;
  }
  if (body.response_format != null) payload.response_format = body.response_format;

  const response = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const msg =
      data?.error?.message ||
      (typeof data?.error === 'string' ? data.error : null) ||
      'OpenRouter API error';
    const err = new Error(msg);
    err.status = response.status;
    err.raw = data;
    throw err;
  }

  return data;
}

/**
 * Returns curated models (same order as config), with optional context length from OpenRouter /models.
 * @returns {Promise<Array<{ id: string; name: string; contextWindow?: string; capabilities?: string[] }>>}
 */
export async function getOpenRouterModels() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const allowedIds = new Set(OPENROUTER_MODELS.map((m) => m.id));
  if (!apiKey) {
    return OPENROUTER_MODELS.map((m) => ({ ...m }));
  }
  try {
    const res = await fetch(`${OPENROUTER_BASE}/models`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!res.ok) {
      return OPENROUTER_MODELS.map((m) => ({ ...m }));
    }
    const data = await res.json();
    const list = data?.data ?? [];
    const apiById = new Map();
    if (Array.isArray(list)) {
      for (const m of list) {
        const id = m?.id;
        if (id && allowedIds.has(id)) {
          apiById.set(id, m);
        }
      }
    }
    return OPENROUTER_MODELS.map((cfg) => {
      const m = apiById.get(cfg.id);
      const ctx =
        m?.context_length != null ? `${m.context_length}` : cfg.contextWindow;
      return {
        ...cfg,
        contextWindow: ctx ?? cfg.contextWindow,
      };
    });
  } catch {
    return OPENROUTER_MODELS.map((m) => ({ ...m }));
  }
}

export { resolveOpenRouterModelId };
