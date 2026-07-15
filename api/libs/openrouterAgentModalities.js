/**
 * OpenRouter clients for x402 agent modalities (embeddings, rerank, TTS, STT).
 * Uses OPENROUTER_API_KEY_x402 — separate from internal /labs/llm playground key.
 */
import { buildOpenRouterX402Headers } from './openrouterX402.js';
import {
  OPENROUTER_EMBEDDINGS_DEFAULT_MODEL,
  OPENROUTER_RERANK_DEFAULT_MODEL,
  OPENROUTER_SPEECH_DEFAULT_MODEL,
  OPENROUTER_SPEECH_DEFAULT_VOICE,
  OPENROUTER_TRANSCRIPTION_DEFAULT_MODEL,
  resolveEmbeddingsModelId,
  resolveRerankModelId,
  resolveSpeechModelId,
  resolveTranscriptionModelId,
} from '../config/openrouterAgentModalityModels.js';

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
export async function callOpenRouterEmbeddings(params) {
  const body = params && typeof params === 'object' ? params : {};
  const input = body.input;
  if (input == null || (typeof input === 'string' && !input.trim())) {
    const err = new Error('input is required');
    err.status = 400;
    throw err;
  }

  const model = resolveEmbeddingsModelId(
    body.model && typeof body.model === 'string' ? body.model.trim() : OPENROUTER_EMBEDDINGS_DEFAULT_MODEL
  );

  const payload = { model, input, usage: { include: true } };
  if (body.dimensions != null) payload.dimensions = body.dimensions;
  if (body.encoding_format != null) payload.encoding_format = body.encoding_format;
  if (body.input_type != null) payload.input_type = body.input_type;

  const response = await fetch(`${OPENROUTER_BASE}/embeddings`, {
    method: 'POST',
    headers: buildOpenRouterX402Headers(),
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
export async function callOpenRouterRerank(params) {
  const body = params && typeof params === 'object' ? params : {};
  const query = typeof body.query === 'string' ? body.query.trim() : '';
  if (!query) {
    const err = new Error('query is required');
    err.status = 400;
    throw err;
  }
  if (!Array.isArray(body.documents) || body.documents.length === 0) {
    const err = new Error('documents must be a non-empty array');
    err.status = 400;
    throw err;
  }

  const model = resolveRerankModelId(
    body.model && typeof body.model === 'string' ? body.model.trim() : OPENROUTER_RERANK_DEFAULT_MODEL
  );

  const payload = {
    model,
    query,
    documents: body.documents,
  };
  if (body.top_n != null) payload.top_n = body.top_n;

  const response = await fetch(`${OPENROUTER_BASE}/rerank`, {
    method: 'POST',
    headers: buildOpenRouterX402Headers(),
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throwOpenRouterError(response, data);
  return data;
}

/**
 * Wrap 16-bit little-endian PCM into a WAV container (browser / agent friendly).
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
 * @returns {Promise<{ audioBase64: string; contentType: string; generationId: string | null; model: string; voice: string }>}
 */
export async function callOpenRouterSpeech(params) {
  const body = params && typeof params === 'object' ? params : {};
  const input = typeof body.input === 'string' ? body.input.trim() : '';
  if (!input) {
    const err = new Error('input is required');
    err.status = 400;
    throw err;
  }

  const model = resolveSpeechModelId(
    body.model && typeof body.model === 'string' ? body.model.trim() : OPENROUTER_SPEECH_DEFAULT_MODEL
  );

  const voice =
    typeof body.voice === 'string' && body.voice.trim()
      ? body.voice.trim()
      : model.includes('kokoro')
        ? OPENROUTER_SPEECH_DEFAULT_VOICE
        : model.includes('voxtral')
          ? 'en_paul_neutral'
          : model.includes('gemini')
            ? 'Kore'
            : model.includes('mai-voice')
              ? 'en-US-Harper:MAI-Voice-2'
              : 'alloy';

  let response_format =
    typeof body.response_format === 'string' && body.response_format.trim()
      ? body.response_format.trim()
      : 'mp3';
  if (model.toLowerCase().includes('gemini') && response_format !== 'pcm') {
    response_format = 'pcm';
  }

  const payload = { model, input, voice, response_format };
  if (body.speed != null) payload.speed = body.speed;

  const response = await fetch(`${OPENROUTER_BASE}/audio/speech`, {
    method: 'POST',
    headers: buildOpenRouterX402Headers(),
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

  if (/audio\/pcm/i.test(contentType) || response_format === 'pcm') {
    const rateMatch = /rate=(\d+)/i.exec(contentType);
    const chMatch = /channels=(\d+)/i.exec(contentType);
    const sampleRate = rateMatch ? Number(rateMatch[1]) : 24000;
    const channels = chMatch ? Number(chMatch[1]) : 1;
    buf = pcmToWav(buf, sampleRate, channels);
    outType = 'audio/wav';
  }

  return {
    audioBase64: buf.toString('base64'),
    contentType: outType,
    generationId: generationId || null,
    model,
    voice,
  };
}

/**
 * @param {object} params
 * @returns {Promise<object>}
 */
export async function callOpenRouterTranscription(params) {
  const body = params && typeof params === 'object' ? params : {};
  const inputAudio = body.input_audio;
  if (!inputAudio || typeof inputAudio !== 'object') {
    const err = new Error('input_audio is required');
    err.status = 400;
    throw err;
  }
  const dataB64 = typeof inputAudio.data === 'string' ? inputAudio.data.trim() : '';
  const format =
    typeof inputAudio.format === 'string' && inputAudio.format.trim()
      ? inputAudio.format.trim()
      : 'mp3';
  if (!dataB64) {
    const err = new Error('input_audio.data is required');
    err.status = 400;
    throw err;
  }

  const model = resolveTranscriptionModelId(
    body.model && typeof body.model === 'string'
      ? body.model.trim()
      : OPENROUTER_TRANSCRIPTION_DEFAULT_MODEL
  );

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
    headers: buildOpenRouterX402Headers(),
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throwOpenRouterError(response, data);
  return data;
}
