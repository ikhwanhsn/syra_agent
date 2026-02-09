import { JATEVO_DEFAULT_MODEL } from '../config/jatevoModels.js';

/**
 * Jatevo Private AI API – OpenAI-compatible chat completions.
 * Docs: https://jatevo.ai/private-ai/api
 * Override base URL with env JATEVO_API_BASE (e.g. https://api.jatevo.ai/v1) if required by docs.
 */
const JATEVO_BASE = process.env.JATEVO_API_BASE || 'https://inference.jatevo.id/v1';

/**
 * Resolve the model id to send to Jatevo. Uses a mapping for known mismatches (our id -> Jatevo id).
 * @param {string} [modelId] - Model id from our config/frontend
 * @returns {string} - Model id to send to Jatevo API
 */
function resolveJatevoModelId(modelId) {
  if (!modelId || typeof modelId !== 'string') return JATEVO_DEFAULT_MODEL;
  const id = modelId.trim();
  // Map our config ids to Jatevo API ids only when docs specify a different format. Pass through otherwise.
  const map = {
    'qwen-2.5-v1-72b': 'qwen-2.5-vl-72b',
  };
  return map[id] ?? id;
}

/**
 * Call Jatevo LLM API (OpenAI-compatible chat completions).
 * When the model hits max_tokens, the API returns finish_reason "length" and the reply is truncated.
 * @param {Array<{ role: string; content: string }>} messages - Conversation messages (system can be first).
 * @param {{ max_tokens?: number; temperature?: number; model?: string }} [options]
 * @returns {Promise<{ response: string; raw: object; truncated: boolean; finishReason: string | null }>}
 */
export async function callJatevo(messages, options = {}) {
  const apiKey = process.env.JATEVO_API_KEY;
  if (!apiKey) {
    throw new Error("JATEVO_API_KEY is not set");
  }

  const requestedId = options.model && typeof options.model === 'string' ? options.model.trim() : null;
  const model = resolveJatevoModelId(requestedId || JATEVO_DEFAULT_MODEL);

  const response = await fetch(`${JATEVO_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      stop: [],
      stream: false,
      top_p: 1,
      max_tokens: options.max_tokens ?? 2000,
      temperature: options.temperature ?? 0.7,
      presence_penalty: 0,
      frequency_penalty: 0,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    const err = new Error(data?.error?.message || "Jatevo API error");
    err.status = response.status;
    err.raw = data;
    throw err;
  }

  const choice = data?.choices?.[0];
  const content = choice?.message?.content || "No response";
  const finishReason = choice?.finish_reason;
  const truncated = finishReason === "length";

  return {
    response: truncated
      ? `${content}\n\n[Response was cut off due to length limit. You can ask for more or rephrase.]`
      : content,
    raw: data,
    truncated,
    finishReason: finishReason ?? null,
  };
}

/**
 * Fetch list of available models from Jatevo (OpenAI-compatible GET /v1/models).
 * @returns {Promise<Array<{ id: string; name?: string; contextWindow?: string }>>} - Models or empty array on failure
 */
export async function getJatevoModels() {
  const apiKey = process.env.JATEVO_API_KEY;
  if (!apiKey) return [];
  try {
    const res = await fetch(`${JATEVO_BASE}/models`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!res.ok) return [];
    const data = await res.json();
    const list = data?.data ?? data?.models ?? [];
    if (!Array.isArray(list)) return [];
    return list.map((m) => ({
      id: m.id ?? m?.root ?? '',
      name: m.id ?? m?.root ?? m?.name ?? '',
      contextWindow: m.context_window ? `${m.context_window}` : undefined,
    })).filter((m) => m.id);
  } catch {
    return [];
  }
}

export { resolveJatevoModelId };
