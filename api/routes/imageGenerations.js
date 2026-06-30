/**
 * x402 API: POST /images/generations via OpenRouter Unified Image API.
 * Dynamic per-request pricing from live rates × margin.
 */
import express from 'express';
import { getResourceDescription } from '../config/x402ResourceCatalog.js';
import {
  OPENROUTER_IMAGE_DEFAULT_MODEL,
  OPENROUTER_IMAGE_MODELS,
  isAllowedImageModel,
} from '../config/openrouterImageModels.js';
import { X402_IMAGE_DEFAULT_N } from '../config/x402Pricing.js';
import { getV2Payment } from '../utils/getV2Payment.js';
import { callOpenRouterImageGeneration } from '../libs/openrouterMedia.js';
import {
  computeImageGenerationPriceUsd,
  getImageModelPricingPublic,
} from '../libs/openrouterMediaPricing.js';

const { requirePayment, settlePaymentAndSetResponse } = await getV2Payment();

const outputSchema = {
  created: { type: 'number', description: 'Unix timestamp' },
  data: { type: 'array', description: 'Generated images (url or b64_json)' },
  usage: { type: 'object', description: 'Token/cost usage from OpenRouter' },
};

const postPaymentOptions = {
  description: getResourceDescription('images/generations'),
  method: 'POST',
  discoverable: true,
  resource: '/images/generations',
  getPriceUsd: (req) => computeImageGenerationPriceUsd(req.body ?? {}),
  inputSchema: {
    bodyType: 'json',
    bodyFields: {
      model: {
        type: 'string',
        required: false,
        description: `Image model slug (default ${OPENROUTER_IMAGE_DEFAULT_MODEL}). Must be in Syra allowlist.`,
      },
      prompt: { type: 'string', required: true, description: 'Text description of the image to generate' },
      n: {
        type: 'number',
        required: false,
        description: `Number of images (1–10, default ${X402_IMAGE_DEFAULT_N}). Affects x402 price.`,
      },
      resolution: { type: 'string', required: false, description: 'Resolution tier (512, 1K, 2K, 4K)' },
      aspect_ratio: { type: 'string', required: false, description: 'Aspect ratio (e.g. 1:1, 16:9)' },
      quality: { type: 'string', required: false, description: 'auto, low, medium, high' },
      output_format: { type: 'string', required: false, description: 'png, jpeg, webp' },
      seed: { type: 'number', required: false, description: 'Deterministic seed when supported' },
      input_references: { type: 'array', required: false, description: 'Reference images for image-to-image' },
    },
  },
  outputSchema,
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function validateImageRequest(req, res, next) {
  const body = req.body && typeof req.body === 'object' ? req.body : {};

  if (body.stream === true) {
    return res.status(400).json({
      error: {
        message: 'stream: true is not supported on this endpoint.',
        type: 'invalid_request_error',
      },
    });
  }

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
    if (!isAllowedImageModel(body.model)) {
      return res.status(400).json({
        error: {
          message: `model "${body.model}" is not in the Syra allowlist. GET /images/generations/models for allowed models.`,
          type: 'invalid_request_error',
        },
      });
    }
  }

  if (body.n != null) {
    const n = Number(body.n);
    if (!Number.isFinite(n) || n < 1 || n > 10) {
      return res.status(400).json({
        error: {
          message: 'n must be between 1 and 10',
          type: 'invalid_request_error',
        },
      });
    }
  }

  return next();
}

export async function createImageGenerationsRouter() {
  const router = express.Router();

  router.get('/models', async (_req, res) => {
    try {
      const models = await Promise.all(
        OPENROUTER_IMAGE_MODELS.map(async (cfg) => {
          const pricing = await getImageModelPricingPublic(cfg.id);
          return {
            ...cfg,
            default: cfg.id === OPENROUTER_IMAGE_DEFAULT_MODEL,
            pricing: pricing
              ? {
                  promptUsdPerToken: pricing.promptUsdPerToken,
                  imageUsdPerImage: pricing.imageUsdPerImage,
                  requestFeeUsd: pricing.requestFeeUsd,
                }
              : null,
          };
        })
      );
      return res.json({
        object: 'list',
        default_model: OPENROUTER_IMAGE_DEFAULT_MODEL,
        data: models,
      });
    } catch (e) {
      return res.status(500).json({
        error: {
          message: e instanceof Error ? e.message : 'Failed to list image models',
          type: 'server_error',
        },
      });
    }
  });

  router.post(
    '/',
    validateImageRequest,
    requirePayment(postPaymentOptions),
    async (req, res) => {
      try {
        const body = req.body && typeof req.body === 'object' ? req.body : {};
        const model =
          body.model && typeof body.model === 'string' && isAllowedImageModel(body.model)
            ? body.model.trim()
            : OPENROUTER_IMAGE_DEFAULT_MODEL;

        const result = await callOpenRouterImageGeneration({
          model,
          prompt: body.prompt,
          n: body.n,
          resolution: body.resolution,
          aspect_ratio: body.aspect_ratio,
          size: body.size,
          quality: body.quality,
          output_format: body.output_format,
          background: body.background,
          output_compression: body.output_compression,
          seed: body.seed,
          input_references: body.input_references,
          provider: body.provider,
        });

        const priceUsd = req.x402Payment?.priceUsd;
        const actualCost =
          result?.usage && typeof result.usage === 'object' ? result.usage.cost : undefined;
        console.log(
          '[images/generations]',
          JSON.stringify({
            model,
            priceUsd,
            imageCount: Array.isArray(result?.data) ? result.data.length : undefined,
            actualCostUsd: actualCost,
          })
        );

        await settlePaymentAndSetResponse(res, req);
        return res.json(result);
      } catch (error) {
        const status = typeof error?.status === 'number' ? error.status : 502;
        return res.status(status).json({
          error: {
            message: error instanceof Error ? error.message : 'Image generation failed',
            type: 'upstream_error',
            ...(error?.raw && { details: error.raw }),
          },
        });
      }
    }
  );

  return router;
}
