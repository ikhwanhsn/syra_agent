/**
 * Internal LLM playground service — OpenRouter proxy using OPENROUTER_API_KEY.
 * No x402 payment; admin-wallet gated at the route layer.
 */
import {
  getLlmModalityConfig,
  isLlmModality,
  LLM_MODALITY_CONFIG,
} from '../../config/openrouterLlmModels.js';

const OPENROUTER_BASE = (process.env.OPENROUTER_API_BASE || 'https://openrouter.ai/api/v1').replace(
  /\/$/,
  ''
);

const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

/** @type {Map<string, { fetchedAt: number; models: LlmModelInfo[] }>} */
const modelCache = new Map();

/**
 * @typedef {{
 *   id: string;
 *   name: string;
 *   pricing: Record<string, number | null>;
 *   cheapest: boolean;
 *   priceScore: number;
 * }} LlmModelInfo
 */

/**
 * @returns {Record<string, string>}
 */
function buildInternalHeaders() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw Object.assign(new Error('OPENROUTER_API_KEY is not set'), { status: 500 });
  }
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  };
  const referer = process.env.OPENROUTER_HTTP_REFERER;
  if (referer && typeof referer === 'string' && referer.trim()) {
    headers['HTTP-Referer'] = referer.trim();
  }
  const title = process.env.OPENROUTER_APP_TITLE || 'Syra LLM Playground';
  if (title) {
    headers['X-Title'] = title.slice(0, 128);
  }
  return headers;
}

/**
 * @param {Response} response
 * @param {object} data
 */
function throwOpenRouterError(response, data) {
  const msg =
    data?.error?.message ||
    (typeof data?.error === 'string' ? data.error : null) ||
    'OpenRouter API error';
  const err = new Error(msg);
  err.status = response.status;
  err.raw = data;
  throw err;
}

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
 * @param {Record<string, unknown> | undefined} pricing
 * @param {string} pricingKey
 * @returns {number}
 */
function scorePricing(pricing, pricingKey) {
  if (!pricing || typeof pricing !== 'object') return Number.POSITIVE_INFINITY;
  const candidates = [pricing[pricingKey]];
  if (pricingKey === 'image') {
    candidates.push(pricing.image_output, pricing.output_image, pricing.completion);
  }
  if (pricingKey === 'audio') {
    candidates.push(
      pricing.audio,
      pricing.audio_output,
      pricing.completion,
      pricing.request,
      pricing.prompt
    );
  }
  if (pricingKey === 'video') {
    candidates.push(pricing.video, pricing.video_per_second, pricing.per_second);
  }
  if (pricingKey === 'request') {
    candidates.push(pricing.request, pricing.prompt);
  }
  for (const c of candidates) {
    const n = parseUsdRate(c);
    if (n > 0) return n;
  }
  // Prefer free / zero-cost models over unknown
  const anyRate = Object.values(pricing)
    .map(parseUsdRate)
    .find((n) => n > 0);
  return anyRate ?? 0;
}

/**
 * @param {unknown} pricing
 * @returns {Record<string, number | null>}
 */
function normalizePricing(pricing) {
  if (!pricing || typeof pricing !== 'object') {
    return {
      prompt: null,
      completion: null,
      image: null,
      request: null,
      audio: null,
      video: null,
    };
  }
  const p = /** @type {Record<string, unknown>} */ (pricing);
  return {
    prompt: parseUsdRate(p.prompt) || null,
    completion: parseUsdRate(p.completion) || null,
    image:
      parseUsdRate(p.image) ||
      parseUsdRate(p.image_output) ||
      parseUsdRate(p.output_image) ||
      null,
    request: parseUsdRate(p.request) || null,
    audio: parseUsdRate(p.audio) || parseUsdRate(p.audio_output) || null,
    video:
      parseUsdRate(p.video) ||
      parseUsdRate(p.video_per_second) ||
      parseUsdRate(p.per_second) ||
      null,
  };
}

/**
 * Pull a scoreable pricing object from general Models API or dedicated media catalogs.
 * @param {Record<string, unknown>} model
 * @returns {Record<string, unknown>}
 */
function extractRawPricing(model) {
  if (!model || typeof model !== 'object') return {};

  if (model.pricing && typeof model.pricing === 'object' && !Array.isArray(model.pricing)) {
    return /** @type {Record<string, unknown>} */ (model.pricing);
  }

  // Dedicated Video Models API: pricing_skus.duration_seconds_*
  if (model.pricing_skus && typeof model.pricing_skus === 'object' && !Array.isArray(model.pricing_skus)) {
    const skus = /** @type {Record<string, unknown>} */ (model.pricing_skus);
    const rates = Object.values(skus).map(parseUsdRate).filter((n) => n > 0);
    const min = rates.length > 0 ? Math.min(...rates) : null;
    return { video: min, video_per_second: min, per_second: min };
  }

  // Dedicated Image/Embeddings catalogs may return pricing line arrays
  if (Array.isArray(model.pricing)) {
    /** @type {Record<string, unknown>} */
    const mapped = {};
    for (const line of model.pricing) {
      if (!line || typeof line !== 'object') continue;
      const row = /** @type {Record<string, unknown>} */ (line);
      const billable = String(row.billable || '').toLowerCase();
      const unit = String(row.unit || '').toLowerCase();
      const cost = parseUsdRate(row.cost_usd ?? row.cost);
      if (!(cost > 0)) continue;
      if (billable.includes('image') || unit === 'image' || unit === 'megapixel') {
        mapped.image = mapped.image == null ? cost : Math.min(Number(mapped.image), cost);
      } else if (billable.includes('prompt') || unit === 'token') {
        mapped.prompt = mapped.prompt == null ? cost : Math.min(Number(mapped.prompt), cost);
      } else if (billable.includes('request') || unit === 'request') {
        mapped.request = mapped.request == null ? cost : Math.min(Number(mapped.request), cost);
      }
    }
    return mapped;
  }

  return {};
}

/**
 * @param {string} modality
 * @param {Array<Record<string, unknown>>} rawList
 * @returns {LlmModelInfo[]}
 */
function rankModels(modality, rawList) {
  const cfg = getLlmModalityConfig(modality);
  /** @type {LlmModelInfo[]} */
  const models = [];
  for (const m of rawList) {
    const id = typeof m?.id === 'string' ? m.id : typeof m?.model === 'string' ? m.model : '';
    if (!id) continue;
    const rawPricing = extractRawPricing(m);
    const pricing = normalizePricing(rawPricing);
    const priceScore = scorePricing(rawPricing, cfg.pricingKey);
    models.push({
      id,
      name: typeof m.name === 'string' && m.name.trim() ? m.name.trim() : id,
      pricing,
      cheapest: false,
      priceScore,
    });
  }

  if (models.length === 0) {
    return cfg.fallbackModels.map((m, i) => ({
      id: m.id,
      name: m.name,
      pricing: {
        prompt: null,
        completion: null,
        image: null,
        request: null,
        audio: null,
        video: null,
      },
      cheapest: i === 0 || m.id === cfg.fallbackDefault,
      priceScore: i,
    }));
  }

  models.sort((a, b) => a.priceScore - b.priceScore || a.id.localeCompare(b.id));
  const cheapestScore = models[0].priceScore;
  for (const m of models) {
    m.cheapest = m.priceScore === cheapestScore;
  }
  return models;
}

/**
 * @param {string} modality
 * @returns {Promise<{ default_model: string; models: LlmModelInfo[] }>}
 */
export async function listModelsForModality(modality) {
  if (!isLlmModality(modality)) {
    const err = new Error(`Invalid modality: ${modality}`);
    err.status = 400;
    throw err;
  }

  const cached = modelCache.get(modality);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    const cheapest = cached.models.find((m) => m.cheapest)?.id ?? cached.models[0]?.id;
    return { default_model: cheapest, models: cached.models };
  }

  const cfg = LLM_MODALITY_CONFIG[modality];
  let rawList = [];

  try {
    const headers = buildInternalHeaders();
    const endpoint = cfg.modelsEndpoint || `/models?output_modalities=${cfg.outputModality}`;
    const res = await fetch(`${OPENROUTER_BASE}${endpoint}`, { headers });
    if (res.ok) {
      const data = await res.json();
      rawList = data?.data ?? data?.models ?? [];
      if (!Array.isArray(rawList)) rawList = [];
    } else if (modality === 'embeddings') {
      // Older gateways may lack /embeddings/models — fall back to general filter.
      const fallbackRes = await fetch(
        `${OPENROUTER_BASE}/models?output_modalities=embeddings`,
        { headers }
      );
      if (fallbackRes.ok) {
        const data = await fallbackRes.json();
        rawList = data?.data ?? data?.models ?? [];
        if (!Array.isArray(rawList)) rawList = [];
      }
    }
  } catch (e) {
    console.warn(
      '[llm-playground] models fetch failed:',
      modality,
      e instanceof Error ? e.message : e
    );
  }

  // STT list can include chat-audio hybrids; keep transcription-oriented ids when possible.
  if (modality === 'transcription' && Array.isArray(rawList) && rawList.length > 0) {
    const sttOnly = rawList.filter((m) => {
      const id = String(m?.id || '').toLowerCase();
      return (
        id.includes('whisper') ||
        id.includes('transcri') ||
        id.includes('stt') ||
        id.includes('asr') ||
        id.includes('chirp') ||
        id.includes('parakeet')
      );
    });
    if (sttOnly.length > 0) rawList = sttOnly;
  }

  const models = rankModels(modality, rawList);
  modelCache.set(modality, { fetchedAt: Date.now(), models });
  const default_model = models.find((m) => m.cheapest)?.id ?? cfg.fallbackDefault;
  return { default_model, models };
}

/**
 * @param {object} params
 * @returns {Promise<object>}
 */
export async function generateImage(params) {
  const body = params && typeof params === 'object' ? params : {};
  const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
  if (!prompt) {
    throw Object.assign(new Error('prompt is required'), { status: 400 });
  }

  const model =
    typeof body.model === 'string' && body.model.trim()
      ? body.model.trim()
      : (await listModelsForModality('image')).default_model;

  const payload = {
    model,
    prompt,
    n: body.n ?? 1,
    usage: { include: true },
  };
  for (const key of [
    'resolution',
    'aspect_ratio',
    'size',
    'quality',
    'output_format',
    'background',
    'seed',
  ]) {
    if (body[key] !== undefined) payload[key] = body[key];
  }

  const response = await fetch(`${OPENROUTER_BASE}/images`, {
    method: 'POST',
    headers: buildInternalHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throwOpenRouterError(response, data);
  return normalizeImageGenerationResult(data);
}

/**
 * Ensure each image has a browser-loadable url (data URI with correct media type).
 * @param {object} data
 * @returns {object}
 */
function normalizeImageGenerationResult(data) {
  if (!data || typeof data !== 'object') return data;
  const items = Array.isArray(data.data) ? data.data : [];
  return {
    ...data,
    data: items.map((item) => {
      if (!item || typeof item !== 'object') return item;
      const row = /** @type {Record<string, unknown>} */ (item);
      if (typeof row.url === 'string' && row.url.trim()) return item;
      const b64 = typeof row.b64_json === 'string' ? row.b64_json : '';
      if (!b64) return item;
      const mediaType =
        typeof row.media_type === 'string' && row.media_type.trim()
          ? row.media_type.trim()
          : 'image/png';
      return { ...row, media_type: mediaType, url: `data:${mediaType};base64,${b64}` };
    }),
  };
}

/**
 * @param {object} params
 * @returns {Promise<object>}
 */
export async function submitVideo(params) {
  const body = params && typeof params === 'object' ? params : {};
  const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
  if (!prompt) {
    throw Object.assign(new Error('prompt is required'), { status: 400 });
  }

  const model =
    typeof body.model === 'string' && body.model.trim()
      ? body.model.trim()
      : (await listModelsForModality('video')).default_model;

  const payload = {
    model,
    prompt,
    duration: body.duration ?? 5,
  };
  for (const key of ['resolution', 'aspect_ratio', 'size', 'seed', 'generate_audio']) {
    if (body[key] !== undefined) payload[key] = body[key];
  }

  const response = await fetch(`${OPENROUTER_BASE}/videos`, {
    method: 'POST',
    headers: buildInternalHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok && response.status !== 202) throwOpenRouterError(response, data);
  return data;
}

/**
 * @param {string} generationId
 * @returns {Promise<object>}
 */
export async function getVideoStatus(generationId) {
  const id = String(generationId || '').trim();
  if (!id) {
    throw Object.assign(new Error('generation id is required'), { status: 400 });
  }
  const response = await fetch(`${OPENROUTER_BASE}/videos/${encodeURIComponent(id)}`, {
    method: 'GET',
    headers: buildInternalHeaders(),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throwOpenRouterError(response, data);
  return data;
}

/**
 * @param {object} params
 * @returns {Promise<object>}
 */
export async function createEmbeddings(params) {
  const body = params && typeof params === 'object' ? params : {};
  const input = body.input;
  if (input == null || (typeof input === 'string' && !input.trim())) {
    throw Object.assign(new Error('input is required'), { status: 400 });
  }

  const model =
    typeof body.model === 'string' && body.model.trim()
      ? body.model.trim()
      : (await listModelsForModality('embeddings')).default_model;

  const payload = { model, input };
  if (body.dimensions != null) payload.dimensions = body.dimensions;
  if (body.encoding_format != null) payload.encoding_format = body.encoding_format;
  if (body.input_type != null) payload.input_type = body.input_type;

  const response = await fetch(`${OPENROUTER_BASE}/embeddings`, {
    method: 'POST',
    headers: buildInternalHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throwOpenRouterError(response, data);
  return data;
}

/**
 * @param {object} params
 * @returns {Promise<object>}
 */
export async function rerankDocuments(params) {
  const body = params && typeof params === 'object' ? params : {};
  const query = typeof body.query === 'string' ? body.query.trim() : '';
  if (!query) {
    throw Object.assign(new Error('query is required'), { status: 400 });
  }
  if (!Array.isArray(body.documents) || body.documents.length === 0) {
    throw Object.assign(new Error('documents must be a non-empty array'), { status: 400 });
  }

  const model =
    typeof body.model === 'string' && body.model.trim()
      ? body.model.trim()
      : (await listModelsForModality('rerank')).default_model;

  const payload = {
    model,
    query,
    documents: body.documents,
  };
  if (body.top_n != null) payload.top_n = body.top_n;

  const response = await fetch(`${OPENROUTER_BASE}/rerank`, {
    method: 'POST',
    headers: buildInternalHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throwOpenRouterError(response, data);
  return data;
}

/**
 * @param {object} params
 * @returns {Promise<{ audioBase64: string; contentType: string; generationId: string | null }>}
 */
export async function synthesizeSpeech(params) {
  const body = params && typeof params === 'object' ? params : {};
  const input = typeof body.input === 'string' ? body.input.trim() : '';
  if (!input) {
    throw Object.assign(new Error('input is required'), { status: 400 });
  }

  const model =
    typeof body.model === 'string' && body.model.trim()
      ? body.model.trim()
      : (await listModelsForModality('speech')).default_model;

  const voice =
    typeof body.voice === 'string' && body.voice.trim() ? body.voice.trim() : 'alloy';
  const response_format =
    typeof body.response_format === 'string' && body.response_format.trim()
      ? body.response_format.trim()
      : 'mp3';

  const payload = {
    model,
    input,
    voice,
    response_format,
  };
  if (body.speed != null) payload.speed = body.speed;

  const response = await fetch(`${OPENROUTER_BASE}/audio/speech`, {
    method: 'POST',
    headers: buildInternalHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throwOpenRouterError(response, data);
  }

  const contentType = response.headers.get('content-type') || 'audio/mpeg';
  const generationId = response.headers.get('x-generation-id');
  const buf = Buffer.from(await response.arrayBuffer());
  return {
    audioBase64: buf.toString('base64'),
    contentType,
    generationId: generationId || null,
  };
}

/**
 * @param {object} params
 * @returns {Promise<object>}
 */
export async function transcribeAudio(params) {
  const body = params && typeof params === 'object' ? params : {};
  const inputAudio = body.input_audio;
  if (!inputAudio || typeof inputAudio !== 'object') {
    throw Object.assign(new Error('input_audio is required'), { status: 400 });
  }
  const dataB64 = typeof inputAudio.data === 'string' ? inputAudio.data.trim() : '';
  const format =
    typeof inputAudio.format === 'string' && inputAudio.format.trim()
      ? inputAudio.format.trim()
      : 'mp3';
  if (!dataB64) {
    throw Object.assign(new Error('input_audio.data is required'), { status: 400 });
  }

  const model =
    typeof body.model === 'string' && body.model.trim()
      ? body.model.trim()
      : (await listModelsForModality('transcription')).default_model;

  const payload = {
    model,
    input_audio: { data: dataB64, format },
  };
  if (typeof body.language === 'string' && body.language.trim()) {
    payload.language = body.language.trim();
  }
  if (body.temperature != null) payload.temperature = body.temperature;

  const response = await fetch(`${OPENROUTER_BASE}/audio/transcriptions`, {
    method: 'POST',
    headers: buildInternalHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throwOpenRouterError(response, data);
  return data;
}
