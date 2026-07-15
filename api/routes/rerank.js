/**
 * x402 API: POST /rerank via OpenRouter.
 * Dynamic per-request pricing from live rates × margin.
 */
import express from 'express';
import { getResourceDescription } from '../config/x402ResourceCatalog.js';
import {
  OPENROUTER_RERANK_DEFAULT_MODEL,
  OPENROUTER_RERANK_MODELS,
  isAllowedRerankModel,
} from '../config/openrouterAgentModalityModels.js';
import { getV2Payment } from '../utils/getV2Payment.js';
import { callOpenRouterRerank } from '../libs/openrouterAgentModalities.js';
import {
  computeRerankPriceUsd,
  getModalityModelPricingPublic,
} from '../libs/openrouterAgentModalityPricing.js';

const { requirePayment, settlePaymentAndSetResponse } = await getV2Payment();

const outputSchema = {
  results: {
    type: 'array',
    description: 'Ranked documents with index + relevance_score',
  },
  model: { type: 'string', description: 'Model slug used' },
};

const postPaymentOptions = {
  description: getResourceDescription('rerank'),
  method: 'POST',
  discoverable: true,
  resource: '/rerank',
  getPriceUsd: (req) => computeRerankPriceUsd(req.body ?? {}),
  inputSchema: {
    bodyType: 'json',
    bodyFields: {
      model: {
        type: 'string',
        required: false,
        description: `Rerank model slug (default ${OPENROUTER_RERANK_DEFAULT_MODEL}). Must be in Syra allowlist.`,
      },
      query: { type: 'string', required: true, description: 'Search / ranking query' },
      documents: {
        type: 'array',
        required: true,
        description: 'Candidate documents (strings) to rank',
      },
      top_n: {
        type: 'number',
        required: false,
        description: 'Return only the top N results',
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
function validateRerankRequest(req, res, next) {
  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const query = typeof body.query === 'string' ? body.query.trim() : '';
  if (!query) {
    return res.status(400).json({
      error: {
        message: 'query is required and must be a non-empty string',
        type: 'invalid_request_error',
      },
    });
  }
  if (!Array.isArray(body.documents) || body.documents.length === 0) {
    return res.status(400).json({
      error: {
        message: 'documents must be a non-empty array',
        type: 'invalid_request_error',
      },
    });
  }
  if (body.documents.length > 100) {
    return res.status(400).json({
      error: {
        message: 'documents must contain at most 100 items',
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
    if (!isAllowedRerankModel(body.model)) {
      return res.status(400).json({
        error: {
          message: `model "${body.model}" is not in the Syra allowlist. GET /rerank/models for allowed models.`,
          type: 'invalid_request_error',
        },
      });
    }
  }

  if (body.top_n != null) {
    const n = Number(body.top_n);
    if (!Number.isFinite(n) || n < 1 || n > body.documents.length) {
      return res.status(400).json({
        error: {
          message: 'top_n must be between 1 and documents.length',
          type: 'invalid_request_error',
        },
      });
    }
  }

  return next();
}

export async function createRerankRouter() {
  const router = express.Router();

  router.get('/models', async (_req, res) => {
    try {
      const models = await Promise.all(
        OPENROUTER_RERANK_MODELS.map(async (cfg) => {
          const pricing = await getModalityModelPricingPublic(cfg.id);
          return {
            ...cfg,
            default: cfg.id === OPENROUTER_RERANK_DEFAULT_MODEL,
            pricing,
          };
        })
      );
      return res.json({
        object: 'list',
        default_model: OPENROUTER_RERANK_DEFAULT_MODEL,
        data: models,
      });
    } catch (e) {
      return res.status(500).json({
        error: {
          message: e instanceof Error ? e.message : 'Failed to list rerank models',
          type: 'server_error',
        },
      });
    }
  });

  router.post('/', validateRerankRequest, requirePayment(postPaymentOptions), async (req, res) => {
    try {
      const body = req.body && typeof req.body === 'object' ? req.body : {};
      const model =
        body.model && typeof body.model === 'string' && isAllowedRerankModel(body.model)
          ? body.model.trim()
          : OPENROUTER_RERANK_DEFAULT_MODEL;

      const result = await callOpenRouterRerank({
        model,
        query: body.query,
        documents: body.documents,
        top_n: body.top_n,
      });

      console.log(
        '[rerank]',
        JSON.stringify({
          model,
          priceUsd: req.x402Payment?.priceUsd,
          docs: Array.isArray(body.documents) ? body.documents.length : undefined,
        })
      );

      await settlePaymentAndSetResponse(res, req);
      return res.json(result);
    } catch (error) {
      const status = typeof error?.status === 'number' ? error.status : 502;
      return res.status(status).json({
        error: {
          message: error instanceof Error ? error.message : 'Rerank failed',
          type: 'upstream_error',
          ...(error?.raw && { details: error.raw }),
        },
      });
    }
  });

  return router;
}
