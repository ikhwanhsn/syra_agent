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
/** Bump when ranking/filter rules change so hot-reloads do not keep bad catalogs. */
const MODEL_CACHE_EPOCH = 'v3-voices-and-auto-filter';

/** @type {Map<string, { fetchedAt: number; models: LlmModelInfo[] }>} */
const modelCache = new Map();

/**
 * @typedef {{
 *   id: string;
 *   name: string;
 *   pricing: Record<string, number | null>;
 *   cheapest: boolean;
 *   priceScore: number;
 *   supported_voices?: string[];
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
 * @returns {number | null} USD rate, or null when missing / dynamic (-1) / invalid
 */
function parseUsdRateOrNull(value) {
  if (value == null || value === '') return null;
  const n = Number(value);
  // OpenRouter uses -1 for dynamic / "contact for price" rates.
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

/**
 * @param {unknown} value
 * @returns {number}
 */
function parseUsdRate(value) {
  return parseUsdRateOrNull(value) ?? 0;
}

/**
 * Meta routers (e.g. openrouter/auto) appear in image catalogs but have no
 * POST /images endpoint — selecting them as "cheapest" breaks generation.
 * @param {Record<string, unknown>} model
 * @returns {boolean}
 */
function isUsableModalityModel(model) {
  const id = String(model?.id || model?.model || '').toLowerCase();
  if (!id) return false;
  if (id === 'openrouter/auto' || id === 'openrouter/free') return false;
  if (id.endsWith('/auto') || id.includes('auto-router') || id.includes('meta-router')) {
    return false;
  }
  const tokenizer = String(
    /** @type {Record<string, unknown>} */ (model.architecture || {})?.tokenizer || ''
  ).toLowerCase();
  if (tokenizer === 'router') return false;
  return true;
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
    candidates.push(pricing.image_output, pricing.output_image, pricing.completion, pricing.prompt);
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
  let sawExplicitZero = false;
  for (const c of candidates) {
    const n = parseUsdRateOrNull(c);
    if (n == null) continue;
    if (n > 0) return n;
    sawExplicitZero = true;
  }
  // Explicit $0 rates beat unknown/dynamic (-1) pricing.
  if (sawExplicitZero) return 0;
  const anyRate = Object.values(pricing)
    .map(parseUsdRateOrNull)
    .find((n) => n != null && n > 0);
  if (anyRate != null) return anyRate;
  return Number.POSITIVE_INFINITY;
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
 * @param {Record<string, unknown>} model
 * @returns {string[] | undefined}
 */
function extractSupportedVoices(model) {
  const raw = model.supported_voices;
  if (Array.isArray(raw) && raw.length > 0) {
    return raw
      .map((v) => (typeof v === 'string' ? v.trim() : ''))
      .filter(Boolean);
  }
  const arch = model.architecture;
  if (arch && typeof arch === 'object' && !Array.isArray(arch)) {
    const nested = /** @type {Record<string, unknown>} */ (arch).supported_voices;
    if (Array.isArray(nested) && nested.length > 0) {
      return nested
        .map((v) => (typeof v === 'string' ? v.trim() : ''))
        .filter(Boolean);
    }
  }
  return undefined;
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
    if (!m || typeof m !== 'object' || !isUsableModalityModel(m)) continue;
    const id = typeof m?.id === 'string' ? m.id : typeof m?.model === 'string' ? m.model : '';
    if (!id) continue;
    const rawPricing = extractRawPricing(m);
    const pricing = normalizePricing(rawPricing);
    const priceScore = scorePricing(rawPricing, cfg.pricingKey);
    /** @type {LlmModelInfo} */
    const info = {
      id,
      name: typeof m.name === 'string' && m.name.trim() ? m.name.trim() : id,
      pricing,
      cheapest: false,
      priceScore,
    };
    const voices = extractSupportedVoices(m);
    if (voices && voices.length > 0) info.supported_voices = voices;
    models.push(info);
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
    m.cheapest = Number.isFinite(cheapestScore) && m.priceScore === cheapestScore;
  }
  // When every rate is unknown, prefer the curated fallback if present.
  if (!Number.isFinite(cheapestScore)) {
    const preferred = models.find((m) => m.id === cfg.fallbackDefault);
    if (preferred) preferred.cheapest = true;
    else if (models[0]) models[0].cheapest = true;
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

  const cacheKey = `${MODEL_CACHE_EPOCH}:${modality}`;
  const cached = modelCache.get(cacheKey);
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
  modelCache.set(cacheKey, { fetchedAt: Date.now(), models });
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
 * OpenRouter returns unsigned_urls that require API-key auth — normalize a
 * browser-usable `url` field for the playground UI / content proxy.
 * @param {object} data
 * @returns {object}
 */
function normalizeVideoStatusResult(data) {
  if (!data || typeof data !== 'object') return data;
  const row = /** @type {Record<string, unknown>} */ (data);
  if (typeof row.url === 'string' && row.url.trim()) return data;
  if (typeof row.video_url === 'string' && row.video_url.trim()) {
    return { ...row, url: row.video_url };
  }
  const unsigned = row.unsigned_urls;
  if (Array.isArray(unsigned) && typeof unsigned[0] === 'string' && unsigned[0].trim()) {
    const id = typeof row.id === 'string' ? row.id : '';
    return {
      ...row,
      url: unsigned[0],
      // Playground proxy path (auth via x-admin-wallet) — used by the web UI.
      content_proxy_path: id ? `/labs/llm/video/${encodeURIComponent(id)}/content` : null,
    };
  }
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
  return normalizeVideoStatusResult(data);
}

/**
 * Stream generated video bytes (OpenRouter content URLs require Authorization).
 * Prefer streaming to avoid buffering large videos into the Node heap.
 * @param {string} generationId
 * @param {number} [index]
 * @returns {Promise<{ response: Response; contentType: string }>}
 */
export async function getVideoContentResponse(generationId, index = 0) {
  const id = String(generationId || '').trim();
  if (!id) {
    throw Object.assign(new Error('generation id is required'), { status: 400 });
  }
  const idx = Number.isFinite(Number(index)) ? Math.max(0, Math.floor(Number(index))) : 0;
  const response = await fetch(
    `${OPENROUTER_BASE}/videos/${encodeURIComponent(id)}/content?index=${idx}`,
    {
      method: 'GET',
      headers: buildInternalHeaders(),
    }
  );
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throwOpenRouterError(response, data);
  }
  const contentType = response.headers.get('content-type') || 'video/mp4';
  return { response, contentType };
}

/**
 * @deprecated Prefer getVideoContentResponse for streaming; kept for small fixtures.
 * @param {string} generationId
 * @param {number} [index]
 * @returns {Promise<{ buffer: Buffer; contentType: string }>}
 */
export async function getVideoContent(generationId, index = 0) {
  const { response, contentType } = await getVideoContentResponse(generationId, index);
  const buffer = Buffer.from(await response.arrayBuffer());
  return { buffer, contentType };
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

  const listed = await listModelsForModality('speech');
  const modelMeta = listed.models.find((m) => m.id === model);
  const defaultVoice =
    modelMeta?.supported_voices?.[0] ||
    (model.includes('kokoro')
      ? 'af_heart'
      : model.includes('voxtral')
        ? 'en_paul_neutral'
        : model.includes('gemini')
          ? 'Kore'
          : 'alloy');

  const voice =
    typeof body.voice === 'string' && body.voice.trim() ? body.voice.trim() : defaultVoice;

  let response_format =
    typeof body.response_format === 'string' && body.response_format.trim()
      ? body.response_format.trim()
      : 'mp3';
  // Gemini TTS rejects mp3 — only pcm is supported.
  if (model.toLowerCase().includes('gemini') && response_format !== 'pcm') {
    response_format = 'pcm';
  }

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
  let buf = Buffer.from(await response.arrayBuffer());
  let outType = contentType;

  // Browser <audio> cannot play raw PCM — wrap as WAV for the playground UI.
  if (/audio\/pcm/i.test(contentType) || response_format === 'pcm') {
    const rateMatch = /rate=(\d+)/i.exec(contentType);
    const chMatch = /channels=(\d+)/i.exec(contentType);
    const sampleRate = rateMatch ? Number(rateMatch[1]) : 24000;
    const channels = chMatch ? Number(chMatch[1]) : 1;
    buf = pcmToWav(buf, sampleRate, channels);
    outType = 'audio/wav';
  } else {
    outType = normalizeSpeechContentType(contentType);
  }

  return {
    audioBase64: buf.toString('base64'),
    contentType: outType,
    generationId: generationId || null,
  };
}

/**
 * Strip charset/params and map common TTS MIME aliases for browser playback.
 * @param {string} contentType
 * @returns {string}
 */
function normalizeSpeechContentType(contentType) {
  const raw = String(contentType || '')
    .split(';')[0]
    .trim()
    .toLowerCase();
  if (!raw || raw === 'application/octet-stream' || raw === 'binary/octet-stream') {
    return 'audio/mpeg';
  }
  if (raw === 'audio/mp3' || raw === 'audio/x-mpeg') return 'audio/mpeg';
  if (raw === 'audio/x-wav' || raw === 'audio/wave') return 'audio/wav';
  if (raw.startsWith('audio/')) return raw;
  return 'audio/mpeg';
}

/**
 * Wrap 16-bit little-endian PCM into a WAV container.
 * @param {Buffer} pcm
 * @param {number} sampleRate
 * @param {number} channels
 * @returns {Buffer}
 */
function pcmToWav(pcm, sampleRate = 24000, channels = 1) {
  const bitsPerSample = 16;
  const blockAlign = (channels * bitsPerSample) / 8;
  const byteRate = sampleRate * blockAlign;
  const dataSize = pcm.length;
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);
  return Buffer.concat([header, pcm]);
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
