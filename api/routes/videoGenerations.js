/**
 * x402 API: POST /videos/generations (paid submit) + GET /videos/generations/:id (free poll).
 * Dynamic per-request pricing from live video rates × margin.
 */
import express from 'express';
import { getResourceDescription } from '../config/x402ResourceCatalog.js';
import {
  OPENROUTER_VIDEO_DEFAULT_MODEL,
  OPENROUTER_VIDEO_MODELS,
  isAllowedVideoModel,
} from '../config/openrouterVideoModels.js';
import { X402_VIDEO_DEFAULT_DURATION_SEC } from '../config/x402Pricing.js';
import { getV2Payment } from '../utils/getV2Payment.js';
import {
  submitOpenRouterVideo,
  getOpenRouterVideoStatus,
} from '../libs/openrouterMedia.js';
import {
  computeVideoGenerationPriceUsd,
  getVideoModelPricingPublic,
} from '../libs/openrouterMediaPricing.js';

const { requirePayment, settlePaymentAndSetResponse } = await getV2Payment();

const submitOutputSchema = {
  success: { type: 'boolean', description: 'Whether the job was submitted' },
  generation_id: { type: 'string', description: 'OpenRouter generation job id' },
  polling_url: { type: 'string', description: 'OpenRouter polling URL' },
  status: { type: 'string', description: 'Initial job status (e.g. pending)' },
  statusUrl: { type: 'string', description: 'Syra status endpoint to poll' },
};

const postPaymentOptions = {
  description: getResourceDescription('videos/generations'),
  method: 'POST',
  discoverable: true,
  resource: '/videos/generations',
  getPriceUsd: (req) => computeVideoGenerationPriceUsd(req.body ?? {}),
  inputSchema: {
    bodyType: 'json',
    bodyFields: {
      model: {
        type: 'string',
        required: false,
        description: `Video model slug (default ${OPENROUTER_VIDEO_DEFAULT_MODEL}). Must be in Syra allowlist.`,
      },
      prompt: { type: 'string', required: true, description: 'Text description of the video to generate' },
      duration: {
        type: 'number',
        required: false,
        description: `Clip duration in seconds (1–60, default ${X402_VIDEO_DEFAULT_DURATION_SEC}). Affects x402 price.`,
      },
      resolution: { type: 'string', required: false, description: '480p, 720p, 1080p, 4k' },
      aspect_ratio: { type: 'string', required: false, description: 'Aspect ratio (e.g. 16:9)' },
      generate_audio: { type: 'boolean', required: false, description: 'Whether to generate audio' },
      seed: { type: 'number', required: false, description: 'Deterministic seed when supported' },
      frame_images: { type: 'array', required: false, description: 'First/last frame images for image-to-video' },
      input_references: { type: 'array', required: false, description: 'Reference assets for style guidance' },
    },
  },
  outputSchema: submitOutputSchema,
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function validateVideoRequest(req, res, next) {
  const body = req.body && typeof req.body === 'object' ? req.body : {};

  const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
  if (!prompt) {
    return res.status(400).json({
      error: {
        message: 'prompt is required and must be a non-empty string',
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
    if (!isAllowedVideoModel(body.model)) {
      return res.status(400).json({
        error: {
          message: `model "${body.model}" is not in the Syra allowlist. GET /videos/generations/models for allowed models.`,
          type: 'invalid_request_error',
        },
      });
    }
  }

  if (body.duration != null) {
    const d = Number(body.duration);
    if (!Number.isFinite(d) || d < 1 || d > 60) {
      return res.status(400).json({
        error: {
          message: 'duration must be between 1 and 60 seconds',
          type: 'invalid_request_error',
        },
      });
    }
  }

  return next();
}

/**
 * @param {object} job
 * @returns {string | undefined}
 */
function extractVideoUrl(job) {
  if (!job || typeof job !== 'object') return undefined;
  const unsigned = job.unsigned_urls ?? job.unsignedUrls;
  if (Array.isArray(unsigned) && typeof unsigned[0] === 'string') return unsigned[0];
  const assets = job.assets ?? job.output;
  if (Array.isArray(assets) && assets[0]?.url) return assets[0].url;
  if (typeof job.video_url === 'string') return job.video_url;
  return undefined;
}

export async function createVideoGenerationsRouter() {
  const router = express.Router();

  router.get('/models', async (_req, res) => {
    try {
      const models = await Promise.all(
        OPENROUTER_VIDEO_MODELS.map(async (cfg) => {
          const pricing = await getVideoModelPricingPublic(cfg.id);
          return {
            ...cfg,
            default: cfg.id === OPENROUTER_VIDEO_DEFAULT_MODEL,
            pricing: pricing
              ? {
                  videoUsdPerSecond: pricing.videoUsdPerSecond,
                  requestFeeUsd: pricing.requestFeeUsd,
                  resolutionSpecific: pricing.resolutionSpecific,
                }
              : null,
          };
        })
      );
      return res.json({
        object: 'list',
        default_model: OPENROUTER_VIDEO_DEFAULT_MODEL,
        data: models,
      });
    } catch (e) {
      return res.status(500).json({
        error: {
          message: e instanceof Error ? e.message : 'Failed to list video models',
          type: 'server_error',
        },
      });
    }
  });

  router.get('/:id', async (req, res) => {
    try {
      const id = String(req.params.id || '').trim();
      if (!id || id === 'models') {
        return res.status(400).json({
          error: {
            message: 'generation id is required',
            type: 'invalid_request_error',
          },
        });
      }

      const job = await getOpenRouterVideoStatus(id);
      const status = job?.status ?? job?.state ?? 'unknown';
      const videoUrl = extractVideoUrl(job);

      return res.json({
        success: true,
        generation_id: job?.generation_id ?? job?.id ?? id,
        status,
        video_url: videoUrl,
        polling_url: job?.polling_url ?? job?.pollingUrl,
        usage: job?.usage ?? null,
        error: job?.error ?? null,
        raw: job,
      });
    } catch (error) {
      const status = typeof error?.status === 'number' ? error.status : 502;
      return res.status(status).json({
        error: {
          message: error instanceof Error ? error.message : 'Video status check failed',
          type: 'upstream_error',
          ...(error?.raw && { details: error.raw }),
        },
      });
    }
  });

  router.post(
    '/',
    validateVideoRequest,
    requirePayment(postPaymentOptions),
    async (req, res) => {
      try {
        const body = req.body && typeof req.body === 'object' ? req.body : {};
        const model =
          body.model && typeof body.model === 'string' && isAllowedVideoModel(body.model)
            ? body.model.trim()
            : OPENROUTER_VIDEO_DEFAULT_MODEL;

        const job = await submitOpenRouterVideo({
          model,
          prompt: body.prompt,
          duration: body.duration,
          resolution: body.resolution,
          aspect_ratio: body.aspect_ratio,
          size: body.size,
          seed: body.seed,
          generate_audio: body.generate_audio,
          frame_images: body.frame_images,
          input_references: body.input_references,
          provider: body.provider,
        });

        const generationId =
          job?.generation_id ?? job?.id ?? job?.generationId ?? null;
        const pollingUrl = job?.polling_url ?? job?.pollingUrl ?? null;
        const status = job?.status ?? 'pending';

        const priceUsd = req.x402Payment?.priceUsd;
        console.log(
          '[videos/generations]',
          JSON.stringify({
            model,
            priceUsd,
            generationId,
            status,
          })
        );

        await settlePaymentAndSetResponse(res, req);
        return res.json({
          success: true,
          generation_id: generationId,
          polling_url: pollingUrl,
          status,
          statusUrl: generationId ? `/videos/generations/${generationId}` : null,
        });
      } catch (error) {
        const status = typeof error?.status === 'number' ? error.status : 502;
        return res.status(status).json({
          error: {
            message: error instanceof Error ? error.message : 'Video generation submit failed',
            type: 'upstream_error',
            ...(error?.raw && { details: error.raw }),
          },
        });
      }
    }
  );

  return router;
}
