/**
 * Dynamic x402 pricing for embeddings / rerank / speech / transcription.
 * Rates from OpenRouter Models API × margin, with per-modality floors.
 */
import {
  X402_EMBEDDINGS_PRICE_MARGIN,
  X402_EMBEDDINGS_PRICE_FLOOR_USD,
  X402_RERANK_PRICE_MARGIN,
  X402_RERANK_PRICE_FLOOR_USD,
  X402_SPEECH_PRICE_MARGIN,
  X402_SPEECH_PRICE_FLOOR_USD,
  X402_TRANSCRIPTION_PRICE_MARGIN,
  X402_TRANSCRIPTION_PRICE_FLOOR_USD,
  X402_TRANSCRIPTION_FALLBACK_USD_PER_MB,
} from '../config/x402Pricing.js';
import {
  OPENROUTER_EMBEDDINGS_DEFAULT_MODEL,
  OPENROUTER_RERANK_DEFAULT_MODEL,
  OPENROUTER_SPEECH_DEFAULT_MODEL,
  OPENROUTER_TRANSCRIPTION_DEFAULT_MODEL,
  resolveEmbeddingsModelId,
  resolveRerankModelId,
  resolveSpeechModelId,
  resolveTranscriptionModelId,
} from '../config/openrouterAgentModalityModels.js';
import { estimateTokensFromText } from './openrouterMediaPricing.js';
import { getOpenRouterX402ApiKey } from './openrouterX402.js';

const OPENROUTER_BASE = (process.env.OPENROUTER_API_BASE || 'https://openrouter.ai/api/v1').replace(
  /\/$/,
  ''
);

const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

/** @type {{ fetchedAt: number; byId: Map<string, ModalityPricingRow> } | null} */
let pricingCache = null;

/**
 * @typedef {{
 *   promptRate: number;
 *   completionRate: number;
 *   requestFee: number;
 *   audioRate: number;
 * }} ModalityPricingRow
 */

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
 * @returns {Promise<Map<string, ModalityPricingRow>>}
 */
async function loadPricingMap() {
  if (pricingCache && Date.now() - pricingCache.fetchedAt < CACHE_TTL_MS) {
    return pricingCache.byId;
  }

  const apiKey = getOpenRouterX402ApiKey();
  /** @type {Map<string, ModalityPricingRow>} */
  const byId = new Map();

  if (!apiKey) {
    pricingCache = { fetchedAt: Date.now(), byId };
    return byId;
  }

  try {
    const res = await fetch(`${OPENROUTER_BASE}/models`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (res.ok) {
      const data = await res.json();
      const list = Array.isArray(data?.data) ? data.data : [];
      for (const row of list) {
        const id = typeof row?.id === 'string' ? row.id : '';
        if (!id) continue;
        const pricing = row.pricing && typeof row.pricing === 'object' ? row.pricing : {};
        byId.set(id, {
          promptRate: parseUsdRate(pricing.prompt),
          completionRate: parseUsdRate(pricing.completion),
          requestFee: parseUsdRate(pricing.request),
          audioRate: parseUsdRate(pricing.audio) || parseUsdRate(pricing.audio_output),
        });
      }
    }
  } catch (e) {
    console.warn(
      '[openrouter-agent-modality-pricing] models fetch failed:',
      e instanceof Error ? e.message : e
    );
  }

  pricingCache = { fetchedAt: Date.now(), byId };
  return byId;
}

/**
 * @param {string} modelId
 * @returns {Promise<ModalityPricingRow | null>}
 */
async function getRow(modelId) {
  const map = await loadPricingMap();
  return map.get(modelId) ?? null;
}

/**
 * @param {string} modelId
 * @returns {Promise<{ promptUsdPerToken: number | null; requestFeeUsd: number | null; audioUsdPerUnit: number | null } | null>}
 */
export async function getModalityModelPricingPublic(modelId) {
  const row = await getRow(modelId);
  if (!row) return null;
  return {
    promptUsdPerToken: row.promptRate > 0 ? row.promptRate : null,
    requestFeeUsd: row.requestFee > 0 ? row.requestFee : null,
    audioUsdPerUnit: row.audioRate > 0 ? row.audioRate : null,
  };
}

/**
 * @param {string | string[]} input
 * @returns {number}
 */
function estimateInputTokens(input) {
  if (typeof input === 'string') return estimateTokensFromText(input);
  if (Array.isArray(input)) {
    return input.reduce((sum, item) => sum + estimateTokensFromText(String(item ?? '')), 0);
  }
  return 0;
}

/**
 * @param {object} body
 * @returns {Promise<number>}
 */
export async function computeEmbeddingsPriceUsd(body) {
  const b = body && typeof body === 'object' ? body : {};
  const model = resolveEmbeddingsModelId(
    typeof b.model === 'string' ? b.model : OPENROUTER_EMBEDDINGS_DEFAULT_MODEL
  );
  const row = await getRow(model);
  const tokens = Math.max(1, estimateInputTokens(b.input));
  const promptRate = row?.promptRate ?? 0.00000002;
  const requestFee = row?.requestFee ?? 0;
  const upstream = tokens * promptRate + requestFee;
  return Math.max(upstream * X402_EMBEDDINGS_PRICE_MARGIN, X402_EMBEDDINGS_PRICE_FLOOR_USD);
}

/**
 * @param {object} body
 * @returns {Promise<number>}
 */
export async function computeRerankPriceUsd(body) {
  const b = body && typeof body === 'object' ? body : {};
  const model = resolveRerankModelId(
    typeof b.model === 'string' ? b.model : OPENROUTER_RERANK_DEFAULT_MODEL
  );
  const row = await getRow(model);
  const docs = Array.isArray(b.documents) ? b.documents : [];
  const queryTokens = estimateTokensFromText(typeof b.query === 'string' ? b.query : '');
  const docTokens = docs.reduce(
    (sum, d) => sum + estimateTokensFromText(typeof d === 'string' ? d : String(d ?? '')),
    0
  );
  const tokens = Math.max(1, queryTokens + docTokens);
  const promptRate = row?.promptRate ?? 0;
  const requestFee = row?.requestFee ?? 0.001;
  const upstream =
    promptRate > 0 ? tokens * promptRate + requestFee : requestFee * Math.max(1, docs.length);
  return Math.max(upstream * X402_RERANK_PRICE_MARGIN, X402_RERANK_PRICE_FLOOR_USD);
}

/**
 * @param {object} body
 * @returns {Promise<number>}
 */
export async function computeSpeechPriceUsd(body) {
  const b = body && typeof body === 'object' ? body : {};
  const model = resolveSpeechModelId(
    typeof b.model === 'string' ? b.model : OPENROUTER_SPEECH_DEFAULT_MODEL
  );
  const row = await getRow(model);
  const text = typeof b.input === 'string' ? b.input : '';
  // OpenRouter TTS often prices per character via prompt rate.
  const units = Math.max(1, text.length);
  const rate = row?.promptRate || row?.audioRate || 0.00000062;
  const requestFee = row?.requestFee ?? 0;
  const upstream = units * rate + requestFee;
  return Math.max(upstream * X402_SPEECH_PRICE_MARGIN, X402_SPEECH_PRICE_FLOOR_USD);
}

/**
 * @param {object} body
 * @returns {Promise<number>}
 */
export async function computeTranscriptionPriceUsd(body) {
  const b = body && typeof body === 'object' ? body : {};
  const model = resolveTranscriptionModelId(
    typeof b.model === 'string' ? b.model : OPENROUTER_TRANSCRIPTION_DEFAULT_MODEL
  );
  const row = await getRow(model);
  const data =
    b.input_audio && typeof b.input_audio === 'object' && typeof b.input_audio.data === 'string'
      ? b.input_audio.data
      : '';
  // base64 length ≈ 4/3 of bytes; estimate MB of decoded audio.
  const approxBytes = Math.max(1, Math.floor((data.length * 3) / 4));
  const mb = approxBytes / (1024 * 1024);
  const requestFee = row?.requestFee ?? 0;
  const promptRate = row?.promptRate ?? 0;
  // Prefer request/prompt when present; otherwise size-based fallback.
  let upstream = requestFee;
  if (promptRate > 0) {
    // Rough: ~1 token-equivalent unit per 100 bytes of audio payload for budgeting.
    upstream += Math.ceil(approxBytes / 100) * promptRate;
  } else {
    upstream += mb * X402_TRANSCRIPTION_FALLBACK_USD_PER_MB;
  }
  return Math.max(upstream * X402_TRANSCRIPTION_PRICE_MARGIN, X402_TRANSCRIPTION_PRICE_FLOOR_USD);
}
