/**
 * OpenRouter video-generation model catalog (curated allowlist).
 * @see https://openrouter.ai/models?output_modalities=video&order=agentic-high-to-low
 */
export const OPENROUTER_VIDEO_DEFAULT_MODEL = 'google/veo-3.1-lite';

/** @typedef {{ id: string; name: string; capabilities: string[] }} OpenRouterVideoModelConfig */

/** @type {OpenRouterVideoModelConfig[]} */
export const OPENROUTER_VIDEO_MODELS = [
  {
    id: 'google/veo-3.1',
    name: 'Veo 3.1',
    capabilities: ['text-to-video', 'image-to-video', 'audio', 'agentic'],
  },
  {
    id: 'google/veo-3.1-lite',
    name: 'Veo 3.1 Lite',
    capabilities: ['text-to-video', 'fast', 'agentic'],
  },
  {
    id: 'bytedance/seedance-2.0',
    name: 'Seedance 2.0',
    capabilities: ['text-to-video', 'image-to-video', 'reference-to-video', 'agentic'],
  },
  {
    id: 'bytedance/seedance-1.5',
    name: 'Seedance 1.5',
    capabilities: ['text-to-video', 'image-to-video', 'agentic'],
  },
  {
    id: 'alibaba/wan-2.7',
    name: 'Wan 2.7',
    capabilities: ['text-to-video', 'image-to-video', 'agentic'],
  },
  {
    id: 'openai/sora-2-pro',
    name: 'Sora 2 Pro',
    capabilities: ['text-to-video', 'cinematic', 'agentic'],
  },
];

export const OPENROUTER_VIDEO_MODEL_IDS = new Set(OPENROUTER_VIDEO_MODELS.map((m) => m.id));

/**
 * @param {string | undefined} modelId
 * @returns {boolean}
 */
export function isAllowedVideoModel(modelId) {
  if (!modelId || typeof modelId !== 'string') return false;
  return OPENROUTER_VIDEO_MODEL_IDS.has(modelId.trim());
}

/**
 * @param {string | undefined} modelId
 * @returns {string}
 */
export function resolveVideoModelId(modelId) {
  if (!modelId || typeof modelId !== 'string') return OPENROUTER_VIDEO_DEFAULT_MODEL;
  const id = modelId.trim();
  return isAllowedVideoModel(id) ? id : OPENROUTER_VIDEO_DEFAULT_MODEL;
}
