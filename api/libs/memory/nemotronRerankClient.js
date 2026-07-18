/**
 * Internal OpenRouter rerank client for Syra agent memory (two-stage RAG).
 * Uses OPENROUTER_API_KEY (same as chat agents / embeddings). Never throws —
 * callers receive { results, status } and fall back to vector order on failure.
 */

import { getMemoryRerankConfig } from '../../config/memoryConfig.js';

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
 *   query: string;
 *   documents: string[];
 *   topN?: number;
 *   model?: string;
 *   timeoutMs?: number;
 * }} params
 * @returns {Promise<{
 *   results: Array<{ index: number; relevanceScore: number }>;
 *   status: 'complete' | 'unavailable' | 'failed' | 'skipped';
 *   model?: string;
 *   error?: string;
 * }>}
 */
export async function rerank(params) {
  const cfg = getMemoryRerankConfig();
  const query = typeof params?.query === 'string' ? params.query.trim() : '';
  const documents = Array.isArray(params?.documents)
    ? params.documents.filter((d) => typeof d === 'string' && d.trim())
    : [];

  if (!query) {
    return { results: [], status: 'skipped', error: 'empty query' };
  }
  if (documents.length === 0) {
    return { results: [], status: 'skipped', error: 'empty documents' };
  }
  if (documents.length === 1) {
    return {
      results: [{ index: 0, relevanceScore: 1 }],
      status: 'complete',
      model: params.model || cfg.model,
    };
  }

  const headers = buildHeaders();
  if (!headers) {
    return {
      results: [],
      status: 'unavailable',
      error: 'OPENROUTER_API_KEY is not set',
    };
  }

  const model = (params.model || cfg.model).trim();
  const topN = Math.min(
    Math.max(1, params.topN ?? documents.length),
    documents.length
  );
  const timeoutMs = params.timeoutMs ?? cfg.timeoutMs;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${OPENROUTER_BASE}/rerank`, {
      method: 'POST',
      headers,
      signal: controller.signal,
      body: JSON.stringify({
        model,
        query,
        documents,
        top_n: topN,
      }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const msg =
        data?.error?.message ||
        (typeof data?.error === 'string' ? data.error : null) ||
        `OpenRouter rerank HTTP ${response.status}`;
      return { results: [], status: 'failed', model, error: msg };
    }

    const raw = Array.isArray(data?.results) ? data.results : [];
    /** @type {Array<{ index: number; relevanceScore: number }>} */
    const results = [];
    for (const row of raw) {
      const index = Number(row?.index);
      const relevanceScore = Number(
        row?.relevance_score ?? row?.relevanceScore ?? row?.score
      );
      if (!Number.isInteger(index) || index < 0 || index >= documents.length) {
        continue;
      }
      if (!Number.isFinite(relevanceScore)) continue;
      results.push({ index, relevanceScore });
    }

    if (!results.length) {
      return {
        results: [],
        status: 'failed',
        model,
        error: 'Invalid rerank response (no usable results)',
      };
    }

    return { results, status: 'complete', model };
  } catch (err) {
    const aborted =
      err instanceof Error &&
      (err.name === 'AbortError' || /aborted/i.test(err.message));
    return {
      results: [],
      status: 'failed',
      model,
      error: aborted
        ? `rerank timeout after ${timeoutMs}ms`
        : err instanceof Error
          ? err.message
          : String(err),
    };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * @returns {boolean}
 */
export function isRerankClientConfigured() {
  return Boolean((process.env.OPENROUTER_API_KEY || '').trim());
}
