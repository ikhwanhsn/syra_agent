/**
 * Syra agent long-term memory (RAG) — embedding / store settings.
 * Always on in code (no SYRA_MEMORY_ENABLED env gate). Soft-fails if OpenRouter is missing.
 * Uses free NVIDIA Nemotron VL embed via OpenRouter.
 */

/** Hard-enabled in code — flip to false only to disable memory globally. */
export const MEMORY_ENABLED = true;

export const MEMORY_EMBEDDING_MODEL = 'nvidia/llama-nemotron-embed-vl-1b-v2';
export const MEMORY_DIMENSIONS = 1024;
export const MEMORY_TOP_K = 4;
export const MEMORY_MIN_SCORE = 0.35;
export const MEMORY_MAX_TEXT_CHARS = 4000;
export const MEMORY_MIN_QUERY_CHARS = 12;
export const MEMORY_TTL_DAYS = 90;
export const MEMORY_QDRANT_COLLECTION = 'syra_agent_memory';

/** Two-stage RAG: vector retrieve then Nemotron cross-encoder rerank. */
export const MEMORY_RERANK_ENABLED = true;
export const MEMORY_RERANK_MODEL = 'nvidia/llama-nemotron-rerank-vl-1b-v2';
/** Vector hits fetched before rerank (wider than topK). */
export const MEMORY_RERANK_CANDIDATES = 20;
export const MEMORY_RERANK_TIMEOUT_MS = 8000;
/**
 * Absolute rerank score floor. null = ordering + top-K only
 * (Nemotron returns logit-scale scores, not 0–1).
 * @type {number | null}
 */
export const MEMORY_RERANK_MIN_SCORE = null;

/**
 * @returns {boolean}
 */
export function isMemoryEnabled() {
  return MEMORY_ENABLED === true;
}

/**
 * @returns {{
 *   enabled: boolean;
 *   model: string;
 *   dimensions: number;
 *   topK: number;
 *   minScore: number;
 *   maxTextChars: number;
 *   minQueryChars: number;
 *   ttlDays: number;
 *   openRouterConfigured: boolean;
 * }}
 */
export function getMemoryConfig() {
  return {
    enabled: isMemoryEnabled(),
    model: MEMORY_EMBEDDING_MODEL,
    dimensions: MEMORY_DIMENSIONS,
    topK: MEMORY_TOP_K,
    minScore: MEMORY_MIN_SCORE,
    maxTextChars: MEMORY_MAX_TEXT_CHARS,
    minQueryChars: MEMORY_MIN_QUERY_CHARS,
    ttlDays: MEMORY_TTL_DAYS,
    openRouterConfigured: Boolean((process.env.OPENROUTER_API_KEY || '').trim()),
  };
}

/**
 * Two-stage RAG rerank settings (code-enabled, soft-fail to vector order).
 * @returns {{
 *   enabled: boolean;
 *   model: string;
 *   candidates: number;
 *   timeoutMs: number;
 *   minScore: number | null;
 *   openRouterConfigured: boolean;
 * }}
 */
export function getMemoryRerankConfig() {
  return {
    enabled: MEMORY_RERANK_ENABLED === true,
    model: MEMORY_RERANK_MODEL,
    candidates: MEMORY_RERANK_CANDIDATES,
    timeoutMs: MEMORY_RERANK_TIMEOUT_MS,
    minScore: MEMORY_RERANK_MIN_SCORE,
    openRouterConfigured: Boolean((process.env.OPENROUTER_API_KEY || '').trim()),
  };
}

/**
 * Qdrant settings for agent memory (separate collection from BTC3).
 * Reuses existing QDRANT_URL / QDRANT_API_KEY when present; Mongo cosine fallback otherwise.
 * @returns {{ url: string; apiKey: string; collection: string; configured: boolean }}
 */
export function getMemoryQdrantConfig() {
  const url = (process.env.QDRANT_URL || '').trim().replace(/\/$/, '');
  const apiKey = (process.env.QDRANT_API_KEY || '').trim();
  return {
    url,
    apiKey,
    collection: MEMORY_QDRANT_COLLECTION,
    configured: Boolean(url),
  };
}
