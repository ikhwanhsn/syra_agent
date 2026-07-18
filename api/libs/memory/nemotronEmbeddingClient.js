/**
 * Internal OpenRouter embeddings client for Syra agent memory.
 * Uses OPENROUTER_API_KEY (same as chat agents). Never throws into the request path —
 * callers receive { vector, status } and decide how to degrade.
 */

import { getMemoryConfig } from '../../config/memoryConfig.js';

const OPENROUTER_BASE = (process.env.OPENROUTER_API_BASE || 'https://openrouter.ai/api/v1').replace(
  /\/$/,
  ''
);

/**
 * @returns {Record<string, string> | null}
 */
function buildHeaders() {
  const apiKey = (process.env.OPENROUTER_API_KEY || '').trim();
  if (!apiKey) return null;
  /** @type {Record<string, string>} */
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
 * @param {{
 *   text: string;
 *   inputType?: 'query' | 'passage';
 *   dimensions?: number;
 *   model?: string;
 * }} params
 * @returns {Promise<{
 *   vector: number[];
 *   status: 'complete' | 'unavailable' | 'failed' | 'skipped';
 *   model?: string;
 *   dimensions?: number;
 *   error?: string;
 * }>}
 */
export async function embed(params) {
  const cfg = getMemoryConfig();
  const text = typeof params?.text === 'string' ? params.text.trim() : '';
  if (!text) {
    return { vector: [], status: 'skipped', error: 'empty text' };
  }

  const headers = buildHeaders();
  if (!headers) {
    return { vector: [], status: 'unavailable', error: 'OPENROUTER_API_KEY is not set' };
  }

  const model = (params.model || cfg.model).trim();
  const dimensions = params.dimensions ?? cfg.dimensions;
  const inputType = params.inputType === 'query' ? 'query' : 'passage';
  const input = text.slice(0, cfg.maxTextChars);

  try {
    const response = await fetch(`${OPENROUTER_BASE}/embeddings`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model,
        input,
        input_type: inputType,
        dimensions,
      }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const msg =
        data?.error?.message ||
        (typeof data?.error === 'string' ? data.error : null) ||
        `OpenRouter embeddings HTTP ${response.status}`;
      return { vector: [], status: 'failed', model, error: msg };
    }
    const vector = data?.data?.[0]?.embedding;
    if (!Array.isArray(vector) || vector.length === 0) {
      return {
        vector: [],
        status: 'failed',
        model,
        error: 'Invalid embedding response',
      };
    }
    return {
      vector,
      status: 'complete',
      model,
      dimensions: vector.length,
    };
  } catch (err) {
    return {
      vector: [],
      status: 'failed',
      model,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * @returns {boolean}
 */
export function isEmbeddingClientConfigured() {
  return Boolean((process.env.OPENROUTER_API_KEY || '').trim());
}
