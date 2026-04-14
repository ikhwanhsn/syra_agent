import { OPENROUTER_DEFAULT_MODEL, OPENROUTER_MODELS } from '../config/openrouterModels.js';

/**
 * OpenRouter — OpenAI-compatible chat completions.
 * @see https://openrouter.ai/docs
 */
const OPENROUTER_BASE = (process.env.OPENROUTER_API_BASE || 'https://openrouter.ai/api/v1').replace(/\/$/, '');

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
  if (OPENROUTER_MODELS.some((m) => m.id === id)) return id;
  return OPENROUTER_DEFAULT_MODEL;
}

/**
 * @param {Array<{ role: string; content: string }>} messages
 * @param {{ max_tokens?: number; temperature?: number; model?: string }} [options]
 * @returns {Promise<{ response: string; raw: object; truncated: boolean; finishReason: string | null; usage: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } | null }>}
 */
export async function callOpenRouter(messages, options = {}) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not set');
  }

  const requestedId = options.model && typeof options.model === 'string' ? options.model.trim() : null;
  const model = resolveOpenRouterModelId(requestedId || OPENROUTER_DEFAULT_MODEL);

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
  const rawContent = choice?.message?.content;
  let textOut = '';
  if (typeof rawContent === 'string') {
    textOut = rawContent;
  } else if (Array.isArray(rawContent)) {
    textOut = rawContent
      .map((part) => {
        if (typeof part === 'string') return part;
        if (part?.type === 'text' && typeof part.text === 'string') return part.text;
        return '';
      })
      .join('');
  }
  const content =
    typeof textOut === 'string' && textOut.trim().length > 0
      ? textOut
      : "I couldn't generate a response for that request. Please try again or rephrase your question.";
  const finishReason = choice?.finish_reason;
  const truncated = finishReason === 'length';

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
