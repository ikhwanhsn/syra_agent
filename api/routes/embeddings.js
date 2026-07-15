/**
 * x402 API: POST /embeddings via OpenRouter.
 * Dynamic per-request pricing from live token rates × margin.
 */
import express from 'express';
import { getResourceDescription } from '../config/x402ResourceCatalog.js';
import {
  OPENROUTER_EMBEDDINGS_DEFAULT_MODEL,
  OPENROUTER_EMBEDDINGS_MODELS,
  isAllowedEmbeddingsModel,
} from '../config/openrouterAgentModalityModels.js';
import { getV2Payment } from '../utils/getV2Payment.js';
import { callOpenRouterEmbeddings } from '../libs/openrouterAgentModalities.js';
import {
  computeEmbeddingsPriceUsd,
  getModalityModelPricingPublic,
} from '../libs/openrouterAgentModalityPricing.js';

const { requirePayment, settlePaymentAndSetResponse } = await getV2Payment();

const outputSchema = {
  object: { type: 'string', description: 'Usually list' },
  model: { type: 'string', description: 'Model slug used' },
  data: { type: 'array', description: 'Embedding vectors with index' },
  usage: { type: 'object', description: 'Token/cost usage from OpenRouter' },
};

const postPaymentOptions = {
  description: getResourceDescription('embeddings'),
  method: 'POST',
  discoverable: true,
  resource: '/embeddings',
  getPriceUsd: (req) => computeEmbeddingsPriceUsd(req.body ?? {}),
  inputSchema: {
    bodyType: 'json',
    bodyFields: {
      model: {
        type: 'string',
        required: false,
        description: `Embeddings model slug (default ${OPENROUTER_EMBEDDINGS_DEFAULT_MODEL}). Must be in Syra allowlist.`,
      },
      input: {
        type: 'string',
        required: true,
        description: 'Text or array of texts to embed',
      },
      dimensions: {
        type: 'number',
        required: false,
        description: 'Optional output dimensions when supported by the model',
      },
    },
  },
  outputSchema,
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function validateEmbeddingsRequest(req, res, next) {
  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const input = body.input;
  const emptyString = typeof input === 'string' && !input.trim();
  const emptyArray = Array.isArray(input) && input.length === 0;
  if (input == null || emptyString || emptyArray) {
    return res.status(400).json({
      error: {
        message: 'input is required (non-empty string or string[])',
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
    if (!isAllowedEmbeddingsModel(body.model)) {
      return res.status(400).json({
        error: {
          message: `model "${body.model}" is not in the Syra allowlist. GET /embeddings/models for allowed models.`,
          type: 'invalid_request_error',
        },
      });
    }
  }

  return next();
}

export async function createEmbeddingsRouter() {
  const router = express.Router();

  router.get('/models', async (_req, res) => {
    try {
      const models = await Promise.all(
        OPENROUTER_EMBEDDINGS_MODELS.map(async (cfg) => {
          const pricing = await getModalityModelPricingPublic(cfg.id);
          return {
            ...cfg,
            default: cfg.id === OPENROUTER_EMBEDDINGS_DEFAULT_MODEL,
            pricing,
          };
        })
      );
      return res.json({
        object: 'list',
        default_model: OPENROUTER_EMBEDDINGS_DEFAULT_MODEL,
        data: models,
      });
    } catch (e) {
      return res.status(500).json({
        error: {
          message: e instanceof Error ? e.message : 'Failed to list embeddings models',
          type: 'server_error',
        },
      });
    }
  });

  router.post('/', validateEmbeddingsRequest, requirePayment(postPaymentOptions), async (req, res) => {
    try {
      const body = req.body && typeof req.body === 'object' ? req.body : {};
      const model =
        body.model && typeof body.model === 'string' && isAllowedEmbeddingsModel(body.model)
          ? body.model.trim()
          : OPENROUTER_EMBEDDINGS_DEFAULT_MODEL;

      const result = await callOpenRouterEmbeddings({
        model,
        input: body.input,
        dimensions: body.dimensions,
        encoding_format: body.encoding_format,
        input_type: body.input_type,
      });

      console.log(
        '[embeddings]',
        JSON.stringify({
          model,
          priceUsd: req.x402Payment?.priceUsd,
          vectors: Array.isArray(result?.data) ? result.data.length : undefined,
        })
      );

      await settlePaymentAndSetResponse(res, req);
      return res.json(result);
    } catch (error) {
      const status = typeof error?.status === 'number' ? error.status : 502;
      return res.status(status).json({
        error: {
          message: error instanceof Error ? error.message : 'Embeddings failed',
          type: 'upstream_error',
          ...(error?.raw && { details: error.raw }),
        },
      });
    }
  });

  return router;
}
