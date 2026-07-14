/**
 * OpenRouter modality catalog for the internal /llm playground.
 * Live model lists are fetched from OpenRouter; these are curated fallbacks.
 */
import { OPENROUTER_IMAGE_DEFAULT_MODEL, OPENROUTER_IMAGE_MODELS } from './openrouterImageModels.js';
import { OPENROUTER_VIDEO_DEFAULT_MODEL, OPENROUTER_VIDEO_MODELS } from './openrouterVideoModels.js';

/** @typedef {'image' | 'video' | 'embeddings' | 'rerank' | 'speech' | 'transcription'} LlmModality */

/** @type {LlmModality[]} */
export const LLM_MODALITIES = [
  'image',
  'embeddings',
  'speech',
  'video',
  'rerank',
  'transcription',
];

/**
 * @typedef {{
 *   id: LlmModality;
 *   label: string;
 *   outputModality: string;
 *   modelsEndpoint: string | null;
 *   pricingKey: 'image' | 'prompt' | 'completion' | 'request' | 'video' | 'audio';
 *   fallbackDefault: string;
 *   fallbackModels: Array<{ id: string; name: string }>;
 * }} LlmModalityConfig
 */

/** @type {Record<LlmModality, LlmModalityConfig>} */
export const LLM_MODALITY_CONFIG = {
  image: {
    id: 'image',
    label: 'Image',
    outputModality: 'image',
    modelsEndpoint: '/models?output_modalities=image',
    pricingKey: 'image',
    fallbackDefault: OPENROUTER_IMAGE_DEFAULT_MODEL,
    fallbackModels: OPENROUTER_IMAGE_MODELS.map((m) => ({ id: m.id, name: m.name })),
  },
  video: {
    id: 'video',
    label: 'Video',
    outputModality: 'video',
    modelsEndpoint: '/videos/models',
    pricingKey: 'video',
    fallbackDefault: OPENROUTER_VIDEO_DEFAULT_MODEL,
    fallbackModels: OPENROUTER_VIDEO_MODELS.map((m) => ({ id: m.id, name: m.name })),
  },
  embeddings: {
    id: 'embeddings',
    label: 'Embeddings',
    outputModality: 'embeddings',
    // Prefer dedicated embeddings catalog when available; general filter is the fallback path.
    modelsEndpoint: '/embeddings/models',
    pricingKey: 'prompt',
    fallbackDefault: 'openai/text-embedding-3-small',
    fallbackModels: [
      { id: 'openai/text-embedding-3-small', name: 'Text Embedding 3 Small' },
      { id: 'openai/text-embedding-3-large', name: 'Text Embedding 3 Large' },
      { id: 'google/gemini-embedding-001', name: 'Gemini Embedding 001' },
    ],
  },
  rerank: {
    id: 'rerank',
    label: 'Rerank',
    outputModality: 'rerank',
    modelsEndpoint: '/models?output_modalities=rerank',
    pricingKey: 'request',
    fallbackDefault: 'cohere/rerank-v3.5',
    fallbackModels: [
      { id: 'cohere/rerank-v3.5', name: 'Cohere Rerank v3.5' },
      { id: 'voyage/rerank-2', name: 'Voyage Rerank 2' },
    ],
  },
  speech: {
    id: 'speech',
    label: 'Audio (TTS)',
    // OpenRouter TTS uses output_modalities=speech. "audio" returns non-TTS models
    // (e.g. gpt-audio / Lyria) that 404 on POST /audio/speech.
    outputModality: 'speech',
    modelsEndpoint: '/models?output_modalities=speech',
    // OpenRouter currently exposes TTS rates under prompt (per-character/token), not audio.
    pricingKey: 'prompt',
    fallbackDefault: 'mistralai/voxtral-mini-tts-2603',
    fallbackModels: [
      { id: 'mistralai/voxtral-mini-tts-2603', name: 'Voxtral Mini TTS' },
      { id: 'hexgrad/kokoro-82m', name: 'Kokoro 82M' },
      { id: 'microsoft/mai-voice-2', name: 'MAI Voice 2' },
      { id: 'google/gemini-3.1-flash-tts-preview', name: 'Gemini 3.1 Flash TTS Preview' },
    ],
  },
  transcription: {
    id: 'transcription',
    label: 'Speech Transcription',
    outputModality: 'transcription',
    // OpenRouter accepts "transcription" (singular); "transcriptions" returns 400.
    modelsEndpoint: '/models?output_modalities=transcription',
    // Live STT rates are currently on prompt (not audio).
    pricingKey: 'prompt',
    fallbackDefault: 'openai/whisper-1',
    fallbackModels: [
      { id: 'openai/whisper-1', name: 'Whisper 1' },
      { id: 'openai/whisper-large-v3', name: 'Whisper Large V3' },
      { id: 'openai/gpt-4o-mini-transcribe', name: 'GPT-4o Mini Transcribe' },
      { id: 'openai/gpt-4o-transcribe', name: 'GPT-4o Transcribe' },
    ],
  },
};

/**
 * @param {string | undefined} value
 * @returns {value is LlmModality}
 */
export function isLlmModality(value) {
  return typeof value === 'string' && LLM_MODALITIES.includes(/** @type {LlmModality} */ (value));
}

/**
 * @param {string | undefined} modality
 * @returns {LlmModalityConfig}
 */
export function getLlmModalityConfig(modality) {
  if (isLlmModality(modality)) return LLM_MODALITY_CONFIG[modality];
  return LLM_MODALITY_CONFIG.image;
}
