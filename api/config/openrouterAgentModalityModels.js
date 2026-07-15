/**
 * Curated OpenRouter allowlists for x402 agent modality routes
 * (embeddings / rerank / speech / transcriptions).
 * Internal /labs/llm playground uses the live catalog + OPENROUTER_API_KEY instead.
 */

/** @typedef {{ id: string; name: string; capabilities?: string[] }} AgentModalityModel */

export const OPENROUTER_EMBEDDINGS_DEFAULT_MODEL = 'openai/text-embedding-3-small';

/** @type {AgentModalityModel[]} */
export const OPENROUTER_EMBEDDINGS_MODELS = [
  {
    id: 'openai/text-embedding-3-small',
    name: 'Text Embedding 3 Small',
    capabilities: ['embeddings', 'fast'],
  },
  {
    id: 'openai/text-embedding-3-large',
    name: 'Text Embedding 3 Large',
    capabilities: ['embeddings', 'high-quality'],
  },
  {
    id: 'google/gemini-embedding-001',
    name: 'Gemini Embedding 001',
    capabilities: ['embeddings'],
  },
];

export const OPENROUTER_RERANK_DEFAULT_MODEL = 'cohere/rerank-4-fast';

/** @type {AgentModalityModel[]} */
export const OPENROUTER_RERANK_MODELS = [
  {
    id: 'cohere/rerank-4-fast',
    name: 'Cohere Rerank 4 Fast',
    capabilities: ['rerank', 'fast'],
  },
  {
    id: 'cohere/rerank-v3.5',
    name: 'Cohere Rerank v3.5',
    capabilities: ['rerank'],
  },
  {
    id: 'voyage/rerank-2',
    name: 'Voyage Rerank 2',
    capabilities: ['rerank'],
  },
];

export const OPENROUTER_SPEECH_DEFAULT_MODEL = 'hexgrad/kokoro-82m';
export const OPENROUTER_SPEECH_DEFAULT_VOICE = 'af_heart';

/** @type {AgentModalityModel[]} */
export const OPENROUTER_SPEECH_MODELS = [
  {
    id: 'hexgrad/kokoro-82m',
    name: 'Kokoro 82M',
    capabilities: ['tts', 'multilingual', 'cheap'],
  },
  {
    id: 'mistralai/voxtral-mini-tts-2603',
    name: 'Voxtral Mini TTS',
    capabilities: ['tts'],
  },
  {
    id: 'microsoft/mai-voice-2',
    name: 'MAI Voice 2',
    capabilities: ['tts'],
  },
  {
    id: 'google/gemini-3.1-flash-tts-preview',
    name: 'Gemini 3.1 Flash TTS Preview',
    capabilities: ['tts', 'pcm-only'],
  },
];

export const OPENROUTER_TRANSCRIPTION_DEFAULT_MODEL = 'openai/gpt-4o-mini-transcribe';

/** @type {AgentModalityModel[]} */
export const OPENROUTER_TRANSCRIPTION_MODELS = [
  {
    id: 'openai/gpt-4o-mini-transcribe',
    name: 'GPT-4o Mini Transcribe',
    capabilities: ['stt', 'fast'],
  },
  {
    id: 'openai/gpt-4o-transcribe',
    name: 'GPT-4o Transcribe',
    capabilities: ['stt', 'high-quality'],
  },
  {
    id: 'openai/whisper-1',
    name: 'Whisper 1',
    capabilities: ['stt'],
  },
  {
    id: 'openai/whisper-large-v3',
    name: 'Whisper Large V3',
    capabilities: ['stt'],
  },
];

/**
 * @param {AgentModalityModel[]} models
 * @returns {Set<string>}
 */
function idSet(models) {
  return new Set(models.map((m) => m.id));
}

export const OPENROUTER_EMBEDDINGS_MODEL_IDS = idSet(OPENROUTER_EMBEDDINGS_MODELS);
export const OPENROUTER_RERANK_MODEL_IDS = idSet(OPENROUTER_RERANK_MODELS);
export const OPENROUTER_SPEECH_MODEL_IDS = idSet(OPENROUTER_SPEECH_MODELS);
export const OPENROUTER_TRANSCRIPTION_MODEL_IDS = idSet(OPENROUTER_TRANSCRIPTION_MODELS);

/**
 * @param {string | undefined} modelId
 * @param {Set<string>} allowed
 * @returns {boolean}
 */
function isAllowed(modelId, allowed) {
  if (!modelId || typeof modelId !== 'string') return false;
  return allowed.has(modelId.trim());
}

export function isAllowedEmbeddingsModel(modelId) {
  return isAllowed(modelId, OPENROUTER_EMBEDDINGS_MODEL_IDS);
}
export function isAllowedRerankModel(modelId) {
  return isAllowed(modelId, OPENROUTER_RERANK_MODEL_IDS);
}
export function isAllowedSpeechModel(modelId) {
  return isAllowed(modelId, OPENROUTER_SPEECH_MODEL_IDS);
}
export function isAllowedTranscriptionModel(modelId) {
  return isAllowed(modelId, OPENROUTER_TRANSCRIPTION_MODEL_IDS);
}

/**
 * @param {string | undefined} modelId
 * @param {string} fallback
 * @param {(id: string | undefined) => boolean} check
 * @returns {string}
 */
function resolve(modelId, fallback, check) {
  if (!modelId || typeof modelId !== 'string') return fallback;
  const id = modelId.trim();
  return check(id) ? id : fallback;
}

export function resolveEmbeddingsModelId(modelId) {
  return resolve(modelId, OPENROUTER_EMBEDDINGS_DEFAULT_MODEL, isAllowedEmbeddingsModel);
}
export function resolveRerankModelId(modelId) {
  return resolve(modelId, OPENROUTER_RERANK_DEFAULT_MODEL, isAllowedRerankModel);
}
export function resolveSpeechModelId(modelId) {
  return resolve(modelId, OPENROUTER_SPEECH_DEFAULT_MODEL, isAllowedSpeechModel);
}
export function resolveTranscriptionModelId(modelId) {
  return resolve(modelId, OPENROUTER_TRANSCRIPTION_DEFAULT_MODEL, isAllowedTranscriptionModel);
}
