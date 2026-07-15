/**
 * x402 API: POST /audio/speech via OpenRouter TTS.
 * Returns JSON with base64 audio for agent-friendly consumption.
 */
import express from 'express';
import { getResourceDescription } from '../config/x402ResourceCatalog.js';
import {
  OPENROUTER_SPEECH_DEFAULT_MODEL,
  OPENROUTER_SPEECH_DEFAULT_VOICE,
  OPENROUTER_SPEECH_MODELS,
  isAllowedSpeechModel,
} from '../config/openrouterAgentModalityModels.js';
import { getV2Payment } from '../utils/getV2Payment.js';
import { callOpenRouterSpeech } from '../libs/openrouterAgentModalities.js';
import {
  computeSpeechPriceUsd,
  getModalityModelPricingPublic,
} from '../libs/openrouterAgentModalityPricing.js';

const { requirePayment, settlePaymentAndSetResponse } = await getV2Payment();

const outputSchema = {
  audioBase64: { type: 'string', description: 'Base64-encoded audio bytes' },
  contentType: { type: 'string', description: 'MIME type (e.g. audio/mpeg or audio/wav)' },
  model: { type: 'string', description: 'Model slug used' },
  voice: { type: 'string', description: 'Voice id used' },
  generationId: { type: 'string', description: 'OpenRouter generation id when provided' },
};

const postPaymentOptions = {
  description: getResourceDescription('audio/speech'),
  method: 'POST',
  discoverable: true,
  resource: '/audio/speech',
  getPriceUsd: (req) => computeSpeechPriceUsd(req.body ?? {}),
  inputSchema: {
    bodyType: 'json',
    bodyFields: {
      model: {
        type: 'string',
        required: false,
        description: `TTS model slug (default ${OPENROUTER_SPEECH_DEFAULT_MODEL}). Must be in Syra allowlist.`,
      },
      input: { type: 'string', required: true, description: 'Text to synthesize' },
      voice: {
        type: 'string',
        required: false,
        description: `Provider-specific voice id (default ${OPENROUTER_SPEECH_DEFAULT_VOICE} for Kokoro).`,
      },
      response_format: {
        type: 'string',
        required: false,
        description: 'mp3 or pcm (Gemini TTS requires pcm; Syra wraps pcm as wav)',
      },
      speed: { type: 'number', required: false, description: 'Playback speed when supported' },
    },
  },
  outputSchema,
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function validateSpeechRequest(req, res, next) {
  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const input = typeof body.input === 'string' ? body.input.trim() : '';
  if (!input) {
    return res.status(400).json({
      error: {
        message: 'input is required and must be a non-empty string',
        type: 'invalid_request_error',
      },
    });
  }
  if (input.length > 4096) {
    return res.status(400).json({
      error: {
        message: 'input must be at most 4096 characters',
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
    if (!isAllowedSpeechModel(body.model)) {
      return res.status(400).json({
        error: {
          message: `model "${body.model}" is not in the Syra allowlist. GET /audio/speech/models for allowed models.`,
          type: 'invalid_request_error',
        },
      });
    }
  }

  return next();
}

export async function createAudioSpeechRouter() {
  const router = express.Router();

  router.get('/models', async (_req, res) => {
    try {
      const models = await Promise.all(
        OPENROUTER_SPEECH_MODELS.map(async (cfg) => {
          const pricing = await getModalityModelPricingPublic(cfg.id);
          return {
            ...cfg,
            default: cfg.id === OPENROUTER_SPEECH_DEFAULT_MODEL,
            pricing,
          };
        })
      );
      return res.json({
        object: 'list',
        default_model: OPENROUTER_SPEECH_DEFAULT_MODEL,
        default_voice: OPENROUTER_SPEECH_DEFAULT_VOICE,
        data: models,
      });
    } catch (e) {
      return res.status(500).json({
        error: {
          message: e instanceof Error ? e.message : 'Failed to list speech models',
          type: 'server_error',
        },
      });
    }
  });

  router.post('/', validateSpeechRequest, requirePayment(postPaymentOptions), async (req, res) => {
    try {
      const body = req.body && typeof req.body === 'object' ? req.body : {};
      const model =
        body.model && typeof body.model === 'string' && isAllowedSpeechModel(body.model)
          ? body.model.trim()
          : OPENROUTER_SPEECH_DEFAULT_MODEL;

      const result = await callOpenRouterSpeech({
        model,
        input: body.input,
        voice: body.voice,
        response_format: body.response_format,
        speed: body.speed,
      });

      console.log(
        '[audio/speech]',
        JSON.stringify({
          model: result.model,
          voice: result.voice,
          priceUsd: req.x402Payment?.priceUsd,
          contentType: result.contentType,
          bytesApprox: Math.floor((result.audioBase64.length * 3) / 4),
        })
      );

      await settlePaymentAndSetResponse(res, req);
      return res.json(result);
    } catch (error) {
      const status = typeof error?.status === 'number' ? error.status : 502;
      return res.status(status).json({
        error: {
          message: error instanceof Error ? error.message : 'Speech synthesis failed',
          type: 'upstream_error',
          ...(error?.raw && { details: error.raw }),
        },
      });
    }
  });

  return router;
}
