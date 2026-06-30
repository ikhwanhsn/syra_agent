/**
 * OpenRouter Unified Image API + async Video API clients.
 * @see https://openrouter.ai/docs/guides/overview/multimodal/image-generation
 * @see https://openrouter.ai/docs/guides/overview/multimodal/video-generation
 */
import {
  OPENROUTER_IMAGE_DEFAULT_MODEL,
  resolveImageModelId,
} from '../config/openrouterImageModels.js';
import {
  OPENROUTER_VIDEO_DEFAULT_MODEL,
  resolveVideoModelId,
} from '../config/openrouterVideoModels.js';
import {
  X402_IMAGE_DEFAULT_N,
  X402_VIDEO_DEFAULT_DURATION_SEC,
} from '../config/x402Pricing.js';
import { buildOpenRouterX402Headers } from './openrouterX402.js';

const OPENROUTER_BASE = (process.env.OPENROUTER_API_BASE || 'https://openrouter.ai/api/v1').replace(
  /\/$/,
  ''
);

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
 * @param {object} params
 * @returns {Promise<object>}
 */
export async function callOpenRouterImageGeneration(params) {
  const body = params && typeof params === 'object' ? params : {};
  const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
  if (!prompt) {
    const err = new Error('prompt is required');
    err.status = 400;
    throw err;
  }

  const model = resolveImageModelId(
    body.model && typeof body.model === 'string' ? body.model.trim() : OPENROUTER_IMAGE_DEFAULT_MODEL
  );
  const headers = buildOpenRouterX402Headers();

  const payload = {
    model,
    prompt,
    n: body.n ?? X402_IMAGE_DEFAULT_N,
    usage: { include: true },
  };

  const passthroughKeys = [
    'resolution',
    'aspect_ratio',
    'size',
    'quality',
    'output_format',
    'background',
    'output_compression',
    'seed',
    'input_references',
    'provider',
  ];
  for (const key of passthroughKeys) {
    if (body[key] !== undefined) payload[key] = body[key];
  }

  const response = await fetch(`${OPENROUTER_BASE}/images`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throwOpenRouterError(response, data);
  }
  return data;
}

/**
 * @param {object} params
 * @returns {Promise<object>}
 */
export async function submitOpenRouterVideo(params) {
  const body = params && typeof params === 'object' ? params : {};
  const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
  if (!prompt) {
    const err = new Error('prompt is required');
    err.status = 400;
    throw err;
  }

  const model = resolveVideoModelId(
    body.model && typeof body.model === 'string' ? body.model.trim() : OPENROUTER_VIDEO_DEFAULT_MODEL
  );
  const headers = buildOpenRouterX402Headers();

  const payload = {
    model,
    prompt,
    duration: body.duration ?? X402_VIDEO_DEFAULT_DURATION_SEC,
  };

  const passthroughKeys = [
    'resolution',
    'aspect_ratio',
    'size',
    'seed',
    'generate_audio',
    'frame_images',
    'input_references',
    'provider',
  ];
  for (const key of passthroughKeys) {
    if (body[key] !== undefined) payload[key] = body[key];
  }

  const response = await fetch(`${OPENROUTER_BASE}/videos`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok && response.status !== 202) {
    throwOpenRouterError(response, data);
  }
  return data;
}

/**
 * @param {string} generationId
 * @returns {Promise<object>}
 */
export async function getOpenRouterVideoStatus(generationId) {
  const id = String(generationId || '').trim();
  if (!id) {
    const err = new Error('generation id is required');
    err.status = 400;
    throw err;
  }

  const headers = buildOpenRouterX402Headers();
  const response = await fetch(`${OPENROUTER_BASE}/videos/${encodeURIComponent(id)}`, {
    method: 'GET',
    headers,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throwOpenRouterError(response, data);
  }
  return data;
}
