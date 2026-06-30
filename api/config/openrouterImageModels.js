/**
 * OpenRouter image-generation model catalog (curated allowlist).
 * @see https://openrouter.ai/models?output_modalities=image&order=agentic-high-to-low
 */
export const OPENROUTER_IMAGE_DEFAULT_MODEL = 'google/gemini-2.5-flash-image';

/** @typedef {{ id: string; name: string; capabilities: string[] }} OpenRouterImageModelConfig */

/** @type {OpenRouterImageModelConfig[]} */
export const OPENROUTER_IMAGE_MODELS = [
  {
    id: 'google/gemini-2.5-flash-image',
    name: 'Gemini 2.5 Flash Image',
    capabilities: ['text-to-image', 'image-to-image', 'fast', 'agentic'],
  },
  {
    id: 'bytedance-seed/seedream-4.5',
    name: 'Seedream 4.5',
    capabilities: ['text-to-image', 'high-quality', 'agentic'],
  },
  {
    id: 'black-forest-labs/flux-1.1-pro',
    name: 'Flux 1.1 Pro',
    capabilities: ['text-to-image', 'photorealistic', 'agentic'],
  },
  {
    id: 'openai/gpt-image-1',
    name: 'GPT Image 1',
    capabilities: ['text-to-image', 'editing', 'agentic'],
  },
  {
    id: 'openai/gpt-5-image',
    name: 'GPT-5 Image',
    capabilities: ['text-to-image', 'multimodal', 'agentic'],
  },
  {
    id: 'recraft/recraft-v4',
    name: 'Recraft V4',
    capabilities: ['text-to-image', 'vector', 'design', 'agentic'],
  },
  {
    id: 'sourceful/riverflow-v2-pro',
    name: 'Riverflow V2 Pro',
    capabilities: ['text-to-image', 'typography', 'agentic'],
  },
  {
    id: 'stability-ai/sd3.5-large',
    name: 'Stable Diffusion 3.5 Large',
    capabilities: ['text-to-image', 'open-source', 'agentic'],
  },
  {
    id: 'x-ai/grok-2-image',
    name: 'Grok 2 Image',
    capabilities: ['text-to-image', 'agentic'],
  },
  {
    id: 'ideogram/ideogram-v3',
    name: 'Ideogram V3',
    capabilities: ['text-to-image', 'typography', 'agentic'],
  },
];

export const OPENROUTER_IMAGE_MODEL_IDS = new Set(OPENROUTER_IMAGE_MODELS.map((m) => m.id));

/**
 * @param {string | undefined} modelId
 * @returns {boolean}
 */
export function isAllowedImageModel(modelId) {
  if (!modelId || typeof modelId !== 'string') return false;
  return OPENROUTER_IMAGE_MODEL_IDS.has(modelId.trim());
}

/**
 * @param {string | undefined} modelId
 * @returns {string}
 */
export function resolveImageModelId(modelId) {
  if (!modelId || typeof modelId !== 'string') return OPENROUTER_IMAGE_DEFAULT_MODEL;
  const id = modelId.trim();
  return isAllowedImageModel(id) ? id : OPENROUTER_IMAGE_DEFAULT_MODEL;
}
