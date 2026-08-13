/**
 * LLM Exchange protocol adapters.
 * Callers always send OpenAI-shaped chat bodies; adapters translate to
 * openai / anthropic / google / openai_custom upstreams and normalize responses.
 */

import { X402_CHAT_DEFAULT_MAX_TOKENS } from '../config/x402Pricing.js';
import { LLM_PROTOCOLS } from '../models/LlmProvider.js';

export const LLM_PROTOCOL_DEFAULTS = Object.freeze({
  openai: {
    baseUrl: '',
    chatPath: '/chat/completions',
    authHeader: 'Authorization',
    authScheme: 'bearer',
  },
  anthropic: {
    baseUrl: 'https://api.anthropic.com',
    chatPath: '/v1/messages',
    authHeader: 'x-api-key',
    authScheme: 'raw',
    apiVersion: '2023-06-01',
  },
  google: {
    baseUrl: 'https://generativelanguage.googleapis.com',
    chatPath: '',
    authHeader: '',
    authScheme: 'query',
  },
  openai_custom: {
    baseUrl: '',
    chatPath: '/chat/completions',
    authHeader: 'Authorization',
    authScheme: 'bearer',
  },
});

/**
 * @param {string | null | undefined} raw
 * @returns {'openai'|'anthropic'|'google'|'openai_custom'}
 */
export function normalizeLlmProtocol(raw) {
  const v = String(raw || 'openai').trim().toLowerCase();
  if (LLM_PROTOCOLS.includes(v)) return /** @type {any} */ (v);
  return 'openai';
}

/**
 * @param {unknown} raw
 */
export function normalizeAuthConfig(raw) {
  const a = raw && typeof raw === 'object' ? raw : {};
  const extra = {};
  const src =
    a.extraHeaders && typeof a.extraHeaders === 'object'
      ? a.extraHeaders instanceof Map
        ? Object.fromEntries(a.extraHeaders.entries())
        : a.extraHeaders
      : {};
  for (const [k, v] of Object.entries(src)) {
    const key = String(k || '').trim().toLowerCase();
    if (!key || v == null) continue;
    extra[key] = String(v);
  }
  return {
    chatPath: typeof a.chatPath === 'string' ? a.chatPath.trim() : '',
    authHeader: typeof a.authHeader === 'string' ? a.authHeader.trim() : '',
    authScheme: typeof a.authScheme === 'string' ? a.authScheme.trim().toLowerCase() : '',
    apiVersion: typeof a.apiVersion === 'string' ? a.apiVersion.trim() : '',
    extraHeaders: extra,
  };
}

/**
 * @param {string} protocol
 * @param {string | null | undefined} baseUrl
 */
export function resolveProtocolBaseUrl(protocol, baseUrl) {
  const p = normalizeLlmProtocol(protocol);
  const trimmed = String(baseUrl || '').trim().replace(/\/+$/, '');
  if (trimmed) return trimmed;
  return String(LLM_PROTOCOL_DEFAULTS[p]?.baseUrl || '').replace(/\/+$/, '');
}

/**
 * @param {string} base
 * @param {string} path
 */
function joinUrl(base, path) {
  const b = String(base || '').replace(/\/+$/, '');
  const p = String(path || '');
  if (!p) return b;
  if (p.startsWith('http://') || p.startsWith('https://')) return p;
  return `${b}${p.startsWith('/') ? p : `/${p}`}`;
}

/**
 * @param {unknown} content
 * @returns {string}
 */
function contentToText(content) {
  if (content == null) return '';
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === 'string') return part;
        if (part && typeof part === 'object') {
          if (typeof part.text === 'string') return part.text;
          if (typeof part.content === 'string') return part.content;
        }
        return '';
      })
      .filter(Boolean)
      .join('\n');
  }
  if (typeof content === 'object' && typeof content.text === 'string') {
    return content.text;
  }
  return String(content);
}

/**
 * @param {unknown[]} messages
 */
function splitOpenAiMessages(messages) {
  const list = Array.isArray(messages) ? messages : [];
  const systemParts = [];
  const rest = [];
  for (const m of list) {
    if (!m || typeof m !== 'object') continue;
    const role = String(m.role || 'user');
    const text = contentToText(m.content);
    if (role === 'system') {
      if (text) systemParts.push(text);
      continue;
    }
    rest.push({ role, content: text, name: m.name });
  }
  return {
    system: systemParts.join('\n\n') || undefined,
    messages: rest,
  };
}

function defaultMaxTokens(body) {
  let maxTokens = Number(body?.max_tokens);
  if (!Number.isFinite(maxTokens) || maxTokens < 1) {
    maxTokens = X402_CHAT_DEFAULT_MAX_TOKENS;
  }
  return Math.min(Math.floor(maxTokens), 32_768);
}

function applyAuthHeaders(headers, apiKey, authHeader, authScheme) {
  if (!apiKey) return;
  const header = authHeader || 'Authorization';
  const scheme = (authScheme || 'bearer').toLowerCase();
  if (scheme === 'raw' || scheme === 'none' || scheme === '') {
    headers[header] = apiKey;
  } else if (scheme === 'bearer') {
    headers[header] = `Bearer ${apiKey}`;
  } else {
    headers[header] = `${scheme} ${apiKey}`;
  }
}

function applyExtraHeaders(headers, extraHeaders) {
  if (!extraHeaders || typeof extraHeaders !== 'object') return;
  for (const [k, v] of Object.entries(extraHeaders)) {
    if (!k || v == null) continue;
    headers[k] = String(v);
  }
}

function openaiCompletionId() {
  return `chatcmpl-syra-${Date.now().toString(36)}`;
}

/**
 * Normalize a text completion into OpenAI chat.completion shape.
 * @param {{ modelId: string; text: string; promptTokens?: number; completionTokens?: number; finishReason?: string; raw?: object }} opts
 */
export function toOpenAiChatCompletion(opts) {
  const promptTokens = Number(opts.promptTokens) || 0;
  const completionTokens = Number(opts.completionTokens) || 0;
  return {
    id: openaiCompletionId(),
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model: opts.modelId,
    choices: [
      {
        index: 0,
        message: {
          role: 'assistant',
          content: opts.text ?? '',
        },
        finish_reason: opts.finishReason || 'stop',
      },
    ],
    usage: {
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      total_tokens: promptTokens + completionTokens,
    },
  };
}

function parseOpenAiError(json, text) {
  if (json?.error?.message) return String(json.error.message);
  if (typeof json?.error === 'string') return json.error;
  if (typeof json?.message === 'string') return json.message;
  return (text || '').slice(0, 500) || 'Upstream error';
}

const openaiAdapter = {
  protocol: 'openai',
  resolveBaseUrl(baseUrl) {
    return resolveProtocolBaseUrl('openai', baseUrl);
  },
  buildRequest({ base, modelId, apiKey, body, authConfig }) {
    const cfg = normalizeAuthConfig(authConfig);
    const defaults = LLM_PROTOCOL_DEFAULTS.openai;
    const path = cfg.chatPath || defaults.chatPath;
    const url = joinUrl(base, path);
    const headers = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    };
    applyAuthHeaders(
      headers,
      apiKey,
      cfg.authHeader || defaults.authHeader,
      cfg.authScheme || defaults.authScheme,
    );
    applyExtraHeaders(headers, cfg.extraHeaders);

    const upstreamBody = {
      model: modelId,
      messages: body.messages,
      max_tokens: defaultMaxTokens(body),
      stream: false,
    };
    if (body.temperature != null) upstreamBody.temperature = body.temperature;
    if (body.tools != null) upstreamBody.tools = body.tools;
    if (body.tool_choice != null) upstreamBody.tool_choice = body.tool_choice;
    if (body.response_format != null) upstreamBody.response_format = body.response_format;
    if (body.seed != null) upstreamBody.seed = body.seed;

    return { url, method: 'POST', headers, body: upstreamBody };
  },
  parseResponse(json, { modelId }) {
    if (json && Array.isArray(json.choices)) {
      return { ...json, model: json.model || modelId };
    }
    const text =
      typeof json?.output_text === 'string'
        ? json.output_text
        : contentToText(json?.message?.content ?? json?.content);
    return toOpenAiChatCompletion({
      modelId,
      text,
      promptTokens: json?.usage?.prompt_tokens,
      completionTokens: json?.usage?.completion_tokens,
    });
  },
  buildProbe(modelId) {
    return {
      messages: [{ role: 'user', content: 'ping' }],
      max_tokens: 1,
      stream: false,
      model: modelId,
    };
  },
  parseError: parseOpenAiError,
};

const openaiCustomAdapter = {
  ...openaiAdapter,
  protocol: 'openai_custom',
  resolveBaseUrl(baseUrl) {
    return resolveProtocolBaseUrl('openai_custom', baseUrl);
  },
  buildRequest(args) {
    return openaiAdapter.buildRequest(args);
  },
};

const anthropicAdapter = {
  protocol: 'anthropic',
  resolveBaseUrl(baseUrl) {
    return resolveProtocolBaseUrl('anthropic', baseUrl);
  },
  buildRequest({ base, modelId, apiKey, body, authConfig }) {
    const cfg = normalizeAuthConfig(authConfig);
    const defaults = LLM_PROTOCOL_DEFAULTS.anthropic;
    const path = cfg.chatPath || defaults.chatPath;
    const url = joinUrl(base, path);
    const headers = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'anthropic-version': cfg.apiVersion || defaults.apiVersion,
    };
    applyAuthHeaders(
      headers,
      apiKey,
      cfg.authHeader || defaults.authHeader,
      cfg.authScheme || defaults.authScheme,
    );
    applyExtraHeaders(headers, cfg.extraHeaders);

    const { system, messages } = splitOpenAiMessages(body.messages);
    const anthropicMessages = messages.map((m) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content || '',
    }));
    // Anthropic requires alternating roles; merge consecutive same-role if needed.
    const merged = [];
    for (const m of anthropicMessages) {
      const last = merged[merged.length - 1];
      if (last && last.role === m.role) {
        last.content = `${last.content}\n\n${m.content}`;
      } else {
        merged.push({ ...m });
      }
    }
    if (merged.length === 0) {
      merged.push({ role: 'user', content: 'ping' });
    }

    const upstreamBody = {
      model: modelId,
      max_tokens: defaultMaxTokens(body),
      messages: merged,
    };
    if (system) upstreamBody.system = system;
    if (body.temperature != null) upstreamBody.temperature = body.temperature;

    return { url, method: 'POST', headers, body: upstreamBody };
  },
  parseResponse(json, { modelId }) {
    const blocks = Array.isArray(json?.content) ? json.content : [];
    const text = blocks
      .map((b) => (b && typeof b.text === 'string' ? b.text : ''))
      .filter(Boolean)
      .join('\n');
    return toOpenAiChatCompletion({
      modelId: json?.model || modelId,
      text,
      promptTokens: json?.usage?.input_tokens,
      completionTokens: json?.usage?.output_tokens,
      finishReason: json?.stop_reason || 'stop',
    });
  },
  buildProbe(modelId) {
    return {
      messages: [{ role: 'user', content: 'ping' }],
      max_tokens: 1,
      model: modelId,
    };
  },
  parseError(json, text) {
    if (json?.error?.message) return String(json.error.message);
    if (typeof json?.message === 'string') return json.message;
    return parseOpenAiError(json, text);
  },
};

const googleAdapter = {
  protocol: 'google',
  resolveBaseUrl(baseUrl) {
    return resolveProtocolBaseUrl('google', baseUrl);
  },
  buildRequest({ base, modelId, apiKey, body, authConfig }) {
    const cfg = normalizeAuthConfig(authConfig);
    const modelPath = String(modelId || '').replace(/^models\//, '');
    let url = joinUrl(base, `/v1beta/models/${encodeURIComponent(modelPath)}:generateContent`);
    if (apiKey) {
      const u = new URL(url);
      u.searchParams.set('key', apiKey);
      url = u.toString();
    }

    const headers = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    };
    applyExtraHeaders(headers, cfg.extraHeaders);

    const { system, messages } = splitOpenAiMessages(body.messages);
    const contents = [];
    for (const m of messages) {
      const role = m.role === 'assistant' ? 'model' : 'user';
      const last = contents[contents.length - 1];
      if (last && last.role === role) {
        last.parts[0].text = `${last.parts[0].text}\n\n${m.content || ''}`;
      } else {
        contents.push({
          role,
          parts: [{ text: m.content || '' }],
        });
      }
    }
    if (contents.length === 0) {
      contents.push({ role: 'user', parts: [{ text: 'ping' }] });
    }

    const upstreamBody = {
      contents,
      generationConfig: {
        maxOutputTokens: defaultMaxTokens(body),
      },
    };
    if (system) {
      upstreamBody.systemInstruction = {
        parts: [{ text: system }],
      };
    }
    if (body.temperature != null) {
      upstreamBody.generationConfig.temperature = body.temperature;
    }

    return { url, method: 'POST', headers, body: upstreamBody };
  },
  parseResponse(json, { modelId }) {
    const candidate = Array.isArray(json?.candidates) ? json.candidates[0] : null;
    const parts = candidate?.content?.parts;
    const text = Array.isArray(parts)
      ? parts.map((p) => (typeof p?.text === 'string' ? p.text : '')).filter(Boolean).join('\n')
      : '';
    const usage = json?.usageMetadata || {};
    return toOpenAiChatCompletion({
      modelId,
      text,
      promptTokens: usage.promptTokenCount,
      completionTokens: usage.candidatesTokenCount,
      finishReason: candidate?.finishReason || 'stop',
    });
  },
  buildProbe(modelId) {
    return {
      messages: [{ role: 'user', content: 'ping' }],
      max_tokens: 1,
      model: modelId,
    };
  },
  parseError(json, text) {
    if (json?.error?.message) return String(json.error.message);
    if (typeof json?.message === 'string') return json.message;
    return parseOpenAiError(json, text);
  },
};

const ADAPTERS = Object.freeze({
  openai: openaiAdapter,
  anthropic: anthropicAdapter,
  google: googleAdapter,
  openai_custom: openaiCustomAdapter,
});

/**
 * @param {string | null | undefined} protocol
 */
export function getLlmAdapter(protocol) {
  const p = normalizeLlmProtocol(protocol);
  return ADAPTERS[p] || ADAPTERS.openai;
}

export { LLM_PROTOCOLS };
