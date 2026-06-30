/**
 * OpenRouter image + video pricing caches and per-request x402 price estimation.
 */
import {
  X402_IMAGE_PRICE_MARGIN,
  X402_IMAGE_PRICE_FLOOR_USD,
  X402_IMAGE_DEFAULT_N,
  X402_VIDEO_PRICE_MARGIN,
  X402_VIDEO_PRICE_FLOOR_USD,
  X402_VIDEO_DEFAULT_DURATION_SEC,
  X402_VIDEO_FALLBACK_USD_PER_SEC,
} from '../config/x402Pricing.js';
import {
  OPENROUTER_IMAGE_DEFAULT_MODEL,
  resolveImageModelId,
} from '../config/openrouterImageModels.js';
import {
  OPENROUTER_VIDEO_DEFAULT_MODEL,
  resolveVideoModelId,
} from '../config/openrouterVideoModels.js';
import { getOpenRouterX402ApiKey } from './openrouterX402.js';

const OPENROUTER_BASE = (process.env.OPENROUTER_API_BASE || 'https://openrouter.ai/api/v1').replace(
  /\/$/,
  ''
);

const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

/** @type {{ fetchedAt: number; byId: Map<string, ImagePricingRow> } | null} */
let imagePricingCache = null;

/** @type {{ fetchedAt: number; byId: Map<string, VideoPricingRow> } | null} */
let videoPricingCache = null;

/**
 * @typedef {{ promptRate: number; imageRate: number; requestFee: number }} ImagePricingRow
 * @typedef {{ perSecondRate: number; requestFee: number; resolutionSpecific: boolean }} VideoPricingRow
 */

const VIDEO_RESOLUTION_MULTIPLIER = {
  '480p': 0.6,
  '720p': 1,
  '1080p': 1.6,
  '4k': 3,
  '4K': 3,
};

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
 * Rough token estimate from text (chars/4 × 1.1 safety).
 * @param {string | undefined} text
 * @returns {number}
 */
export function estimateTokensFromText(text) {
  const s = typeof text === 'string' ? text : '';
  if (!s.length) return 0;
  return Math.ceil(Math.ceil(s.length / 4) * 1.1);
}

/**
 * @param {unknown} pricing
 * @returns {number}
 */
function parseImagePerImageRate(pricing) {
  if (!pricing || typeof pricing !== 'object') return 0;
  const p = /** @type {Record<string, unknown>} */ (pricing);
  const candidates = [
    p.image,
    p.image_output,
    p.output_image,
    p.completion,
  ];
  for (const c of candidates) {
    const n = parseUsdRate(c);
    if (n > 0) return n;
  }
  return 0;
}

/**
 * @param {unknown} modelRow
 * @returns {VideoPricingRow}
 */
function parseVideoModelPricing(modelRow) {
  const pricing = modelRow?.pricing ?? {};
  const requestFee = parseUsdRate(pricing.request);

  const perSecondCandidates = [
    pricing.video,
    pricing.video_per_second,
    pricing.per_second,
    pricing.second,
  ];
  for (const c of perSecondCandidates) {
    const n = parseUsdRate(c);
    if (n > 0) {
      return { perSecondRate: n, requestFee, resolutionSpecific: true };
    }
  }

  const flat = parseUsdRate(pricing.video_flat ?? pricing.flat);
  if (flat > 0) {
    return { perSecondRate: flat, requestFee, resolutionSpecific: false };
  }

  const endpoints = modelRow?.endpoints;
  if (Array.isArray(endpoints) && endpoints.length > 0) {
    for (const ep of endpoints) {
      const epPricing = ep?.pricing ?? {};
      for (const key of ['video', 'video_per_second', 'per_second']) {
        const n = parseUsdRate(epPricing[key]);
        if (n > 0) {
          return { perSecondRate: n, requestFee, resolutionSpecific: true };
        }
      }
    }
  }

  return { perSecondRate: 0, requestFee, resolutionSpecific: false };
}

async function refreshImagePricingCache() {
  const apiKey = getOpenRouterX402ApiKey();
  const byId = new Map();
  if (!apiKey) {
    imagePricingCache = { fetchedAt: Date.now(), byId };
    return;
  }
  try {
    const res = await fetch(`${OPENROUTER_BASE}/models?output_modalities=image`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!res.ok) {
      imagePricingCache = { fetchedAt: Date.now(), byId };
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
          imageRate: parseImagePerImageRate(pricing),
          requestFee: parseUsdRate(pricing.request),
        });
      }
    }
  } catch (e) {
    console.warn(
      '[openrouter-media-pricing] image /models fetch failed:',
      e instanceof Error ? e.message : e
    );
  }
  imagePricingCache = { fetchedAt: Date.now(), byId };
}

async function refreshVideoPricingCache() {
  const apiKey = getOpenRouterX402ApiKey();
  const byId = new Map();
  if (!apiKey) {
    videoPricingCache = { fetchedAt: Date.now(), byId };
    return;
  }
  try {
    const res = await fetch(`${OPENROUTER_BASE}/videos/models`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!res.ok) {
      videoPricingCache = { fetchedAt: Date.now(), byId };
      return;
    }
    const data = await res.json();
    const list = data?.data ?? data?.models ?? [];
    if (Array.isArray(list)) {
      for (const m of list) {
        const id = m?.id ?? m?.model;
        if (!id || typeof id !== 'string') continue;
        byId.set(id, parseVideoModelPricing(m));
      }
    }
  } catch (e) {
    console.warn(
      '[openrouter-media-pricing] video /videos/models fetch failed:',
      e instanceof Error ? e.message : e
    );
  }
  videoPricingCache = { fetchedAt: Date.now(), byId };
}

/**
 * @param {string} modelId
 * @returns {Promise<ImagePricingRow | null>}
 */
export async function getImageModelPricing(modelId) {
  const id = resolveImageModelId(modelId || OPENROUTER_IMAGE_DEFAULT_MODEL);
  if (!imagePricingCache || Date.now() - imagePricingCache.fetchedAt > CACHE_TTL_MS) {
    await refreshImagePricingCache();
  }
  return imagePricingCache?.byId.get(id) ?? null;
}

/**
 * @param {string} modelId
 * @returns {Promise<VideoPricingRow | null>}
 */
export async function getVideoModelPricing(modelId) {
  const id = resolveVideoModelId(modelId || OPENROUTER_VIDEO_DEFAULT_MODEL);
  if (!videoPricingCache || Date.now() - videoPricingCache.fetchedAt > CACHE_TTL_MS) {
    await refreshVideoPricingCache();
  }
  return videoPricingCache?.byId.get(id) ?? null;
}

/**
 * @param {number} n
 * @returns {number}
 */
function clampImageN(n) {
  const v = Number.isFinite(n) && n > 0 ? Math.floor(n) : X402_IMAGE_DEFAULT_N;
  return Math.max(1, Math.min(v, 10));
}

/**
 * @param {number} duration
 * @returns {number}
 */
function clampVideoDuration(duration) {
  const v =
    Number.isFinite(duration) && duration > 0
      ? Math.floor(duration)
      : X402_VIDEO_DEFAULT_DURATION_SEC;
  return Math.max(1, Math.min(v, 60));
}

/**
 * @param {{ model?: string; prompt?: string; n?: number }} body
 * @returns {Promise<number>}
 */
export async function computeImageGenerationPriceUsd(body) {
  const model = resolveImageModelId(
    body?.model && typeof body.model === 'string' ? body.model.trim() : OPENROUTER_IMAGE_DEFAULT_MODEL
  );
  const prompt = typeof body?.prompt === 'string' ? body.prompt : '';
  const n = clampImageN(body?.n != null ? Number(body.n) : X402_IMAGE_DEFAULT_N);
  const estPrompt = estimateTokensFromText(prompt);
  const pricing = await getImageModelPricing(model);

  if (!pricing) {
    return X402_IMAGE_PRICE_FLOOR_USD;
  }

  const imageUnit = pricing.imageRate > 0 ? pricing.imageRate : pricing.promptRate * 1000;
  const upstream =
    pricing.requestFee + estPrompt * pricing.promptRate + n * imageUnit;
  return Math.max(X402_IMAGE_PRICE_FLOOR_USD, upstream * X402_IMAGE_PRICE_MARGIN);
}

/**
 * @param {{ model?: string; duration?: number; resolution?: string }} body
 * @returns {Promise<number>}
 */
export async function computeVideoGenerationPriceUsd(body) {
  const model = resolveVideoModelId(
    body?.model && typeof body.model === 'string' ? body.model.trim() : OPENROUTER_VIDEO_DEFAULT_MODEL
  );
  const duration = clampVideoDuration(
    body?.duration != null ? Number(body.duration) : X402_VIDEO_DEFAULT_DURATION_SEC
  );
  const resolution =
    typeof body?.resolution === 'string' ? body.resolution.trim().toLowerCase() : '';
  const pricing = await getVideoModelPricing(model);

  const perSec =
    pricing && pricing.perSecondRate > 0
      ? pricing.perSecondRate
      : X402_VIDEO_FALLBACK_USD_PER_SEC;
  const requestFee = pricing?.requestFee ?? 0;
  const resMult =
    pricing?.resolutionSpecific === false && resolution
      ? VIDEO_RESOLUTION_MULTIPLIER[resolution] ?? 1
      : 1;

  const upstream = requestFee + duration * perSec * resMult;
  return Math.max(X402_VIDEO_PRICE_FLOOR_USD, upstream * X402_VIDEO_PRICE_MARGIN);
}

/**
 * @param {string} modelId
 */
export async function getImageModelPricingPublic(modelId) {
  const id = resolveImageModelId(modelId);
  const p = await getImageModelPricing(id);
  if (!p) return null;
  return {
    id,
    promptUsdPerToken: p.promptRate,
    imageUsdPerImage: p.imageRate,
    requestFeeUsd: p.requestFee,
  };
}

/**
 * @param {string} modelId
 */
export async function getVideoModelPricingPublic(modelId) {
  const id = resolveVideoModelId(modelId);
  const p = await getVideoModelPricing(id);
  if (!p) return null;
  return {
    id,
    videoUsdPerSecond: p.perSecondRate > 0 ? p.perSecondRate : X402_VIDEO_FALLBACK_USD_PER_SEC,
    requestFeeUsd: p.requestFee,
    resolutionSpecific: p.resolutionSpecific,
  };
}
