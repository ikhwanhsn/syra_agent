/**
 * x402 API: POST /audio/transcriptions via OpenRouter STT.
 * Accepts JSON { input_audio: { data: base64, format } }.
 */
import express from 'express';
import { getResourceDescription } from '../config/x402ResourceCatalog.js';
import {
  OPENROUTER_TRANSCRIPTION_DEFAULT_MODEL,
  OPENROUTER_TRANSCRIPTION_MODELS,
  isAllowedTranscriptionModel,
} from '../config/openrouterAgentModalityModels.js';
import { getV2Payment } from '../utils/getV2Payment.js';
import { callOpenRouterTranscription } from '../libs/openrouterAgentModalities.js';
import {
  computeTranscriptionPriceUsd,
  getModalityModelPricingPublic,
} from '../libs/openrouterAgentModalityPricing.js';

const { requirePayment, settlePaymentAndSetResponse } = await getV2Payment();

const MAX_AUDIO_B64_CHARS = 20 * 1024 * 1024; // ~15MB decoded

const outputSchema = {
  text: { type: 'string', description: 'Transcribed text' },
  language: { type: 'string', description: 'Detected or requested language when provided' },
  usage: { type: 'object', description: 'Token/cost usage from OpenRouter when available' },
};

const postPaymentOptions = {
  description: getResourceDescription('audio/transcriptions'),
  method: 'POST',
  discoverable: true,
  resource: '/audio/transcriptions',
  getPriceUsd: (req) => computeTranscriptionPriceUsd(req.body ?? {}),
  inputSchema: {
    bodyType: 'json',
    bodyFields: {
      model: {
        type: 'string',
        required: false,
        description: `Transcription model slug (default ${OPENROUTER_TRANSCRIPTION_DEFAULT_MODEL}). Must be in Syra allowlist.`,
      },
      input_audio: {
        type: 'object',
        required: true,
        description: '{ data: base64 audio, format: mp3|wav|… }',
      },
      language: { type: 'string', required: false, description: 'Optional BCP-47 / ISO language hint' },
      temperature: { type: 'number', required: false, description: 'Optional decoding temperature' },
    },
  },
  outputSchema,
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function validateTranscriptionRequest(req, res, next) {
  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const inputAudio = body.input_audio;
  if (!inputAudio || typeof inputAudio !== 'object') {
    return res.status(400).json({
      error: {
        message: 'input_audio is required as { data, format }',
        type: 'invalid_request_error',
      },
    });
  }
  const data = typeof inputAudio.data === 'string' ? inputAudio.data.trim() : '';
  if (!data) {
    return res.status(400).json({
      error: {
        message: 'input_audio.data (base64) is required',
        type: 'invalid_request_error',
      },
    });
  }
  if (data.length > MAX_AUDIO_B64_CHARS) {
    return res.status(400).json({
      error: {
        message: 'input_audio.data exceeds size limit (~15MB decoded)',
        type: 'invalid_request_error',
      },
    });
  }

  if (body.model != null) {
    if (typeof body.model !== 'string' || !body.model.trim()) {
      return res.status(400).json({
        error: {
          message: 'model must be a non-empty string when provided',
          type: 'invalid_request_error',
        },
      });
    }
    if (!isAllowedTranscriptionModel(body.model)) {
      return res.status(400).json({
        error: {
          message: `model "${body.model}" is not in the Syra allowlist. GET /audio/transcriptions/models for allowed models.`,
          type: 'invalid_request_error',
        },
      });
    }
  }

  return next();
}

export async function createAudioTranscriptionsRouter() {
  const router = express.Router();

  router.get('/models', async (_req, res) => {
    try {
      const models = await Promise.all(
        OPENROUTER_TRANSCRIPTION_MODELS.map(async (cfg) => {
          const pricing = await getModalityModelPricingPublic(cfg.id);
          return {
            ...cfg,
            default: cfg.id === OPENROUTER_TRANSCRIPTION_DEFAULT_MODEL,
            pricing,
          };
        })
      );
      return res.json({
        object: 'list',
        default_model: OPENROUTER_TRANSCRIPTION_DEFAULT_MODEL,
        data: models,
      });
    } catch (e) {
      return res.status(500).json({
        error: {
          message: e instanceof Error ? e.message : 'Failed to list transcription models',
          type: 'server_error',
        },
      });
    }
  });

  router.post(
    '/',
    validateTranscriptionRequest,
    requirePayment(postPaymentOptions),
    async (req, res) => {
      try {
        const body = req.body && typeof req.body === 'object' ? req.body : {};
        const model =
          body.model && typeof body.model === 'string' && isAllowedTranscriptionModel(body.model)
            ? body.model.trim()
            : OPENROUTER_TRANSCRIPTION_DEFAULT_MODEL;

        const result = await callOpenRouterTranscription({
          model,
          input_audio: body.input_audio,
          language: body.language,
          temperature: body.temperature,
        });

        console.log(
          '[audio/transcriptions]',
          JSON.stringify({
            model,
            priceUsd: req.x402Payment?.priceUsd,
            textLen: typeof result?.text === 'string' ? result.text.length : undefined,
          })
        );

        await settlePaymentAndSetResponse(res, req);
        return res.json(result);
      } catch (error) {
        const status = typeof error?.status === 'number' ? error.status : 502;
        return res.status(status).json({
          error: {
            message: error instanceof Error ? error.message : 'Transcription failed',
            type: 'upstream_error',
            ...(error?.raw && { details: error.raw }),
          },
        });
      }
    }
  );

  return router;
}
