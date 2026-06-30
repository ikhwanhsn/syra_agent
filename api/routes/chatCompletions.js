/**
 * x402 API: OpenAI-compatible POST /chat/completions via OpenRouter.
 * Dynamic per-request pricing from live token rates × margin.
 */
import express from 'express';
import { getResourceDescription } from '../config/x402ResourceCatalog.js';
import {
  OPENROUTER_DEFAULT_MODEL,
  OPENROUTER_MODELS,
  isAllowedOpenRouterModel,
} from '../config/openrouterModels.js';
import { X402_CHAT_DEFAULT_MAX_TOKENS } from '../config/x402Pricing.js';
import { getV2Payment } from '../utils/getV2Payment.js';
import { callOpenRouterChatCompletion } from '../libs/openrouter.js';
import {
  computeChatCompletionPriceUsd,
  getModelPricingPublic,
} from '../libs/openrouterModelPricing.js';

const { requirePayment, settlePaymentAndSetResponse } = await getV2Payment();

const outputSchema = {
  id: { type: 'string', description: 'Completion id' },
  object: { type: 'string', description: 'Always chat.completion' },
  created: { type: 'number', description: 'Unix timestamp' },
  model: { type: 'string', description: 'Model slug used' },
  choices: { type: 'array', description: 'OpenAI-style choices with message / finish_reason' },
  usage: {
    type: 'object',
    description: 'Token usage and optional cost from OpenRouter',
  },
};

const postPaymentOptions = {
  description: getResourceDescription('chat/completions'),
  method: 'POST',
  discoverable: true,
  resource: '/chat/completions',
  getPriceUsd: (req) => computeChatCompletionPriceUsd(req.body ?? {}),
  inputSchema: {
    bodyType: 'json',
    bodyFields: {
      model: {
        type: 'string',
        required: false,
        description: `OpenRouter model slug (default ${OPENROUTER_DEFAULT_MODEL}). Must be in Syra allowlist.`,
      },
      messages: {
        type: 'array',
        required: true,
        description: 'OpenAI-style messages array (role + content)',
      },
      max_tokens: {
        type: 'number',
        required: false,
        description: `Max completion tokens (default ${X402_CHAT_DEFAULT_MAX_TOKENS}). Affects x402 price.`,
      },
      temperature: { type: 'number', required: false, description: 'Sampling temperature (default 0.2)' },
      tools: { type: 'array', required: false, description: 'Tool definitions for function calling' },
      tool_choice: { type: 'string', required: false, description: 'Tool choice policy' },
      response_format: { type: 'object', required: false, description: 'Structured output format (e.g. json_object)' },
      seed: { type: 'number', required: false, description: 'Deterministic seed when supported' },
    },
  },
  outputSchema,
};

/**
 * Validate request before payment (invalid → 400, no charge).
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function validateChatRequest(req, res, next) {
  const body = req.body && typeof req.body === 'object' ? req.body : {};

  if (body.stream === true) {
    return res.status(400).json({
      error: {
        message: 'stream: true is not supported on this endpoint. Use stream: false or omit stream.',
        type: 'invalid_request_error',
      },
    });
  }

  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return res.status(400).json({
      error: {
        message: 'messages is required and must be a non-empty array',
        type: 'invalid_request_error',
      },
    });
  }

  for (let i = 0; i < body.messages.length; i++) {
    const msg = body.messages[i];
    if (!msg || typeof msg !== 'object' || typeof msg.role !== 'string' || !msg.role.trim()) {
      return res.status(400).json({
        error: {
          message: `messages[${i}].role is required`,
          type: 'invalid_request_error',
        },
      });
    }
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
    if (!isAllowedOpenRouterModel(body.model)) {
      return res.status(400).json({
        error: {
          message: `model "${body.model}" is not in the Syra allowlist. GET /chat/completions/models for allowed models.`,
          type: 'invalid_request_error',
        },
      });
    }
  }

  if (body.max_tokens != null) {
    const n = Number(body.max_tokens);
    if (!Number.isFinite(n) || n < 1 || n > 32_768) {
      return res.status(400).json({
        error: {
          message: 'max_tokens must be between 1 and 32768',
          type: 'invalid_request_error',
        },
      });
    }
  }

  return next();
}

export async function createChatCompletionsRouter() {
  const router = express.Router();

  router.get('/models', async (_req, res) => {
    try {
      const models = await Promise.all(
        OPENROUTER_MODELS.map(async (cfg) => {
          const pricing = await getModelPricingPublic(cfg.id);
          return {
            ...cfg,
            default: cfg.id === OPENROUTER_DEFAULT_MODEL,
            pricing: pricing
              ? {
                  promptUsdPerToken: pricing.promptRateUsd,
                  completionUsdPerToken: pricing.completionRateUsd,
                  requestFeeUsd: pricing.requestFeeUsd,
                  contextLength: pricing.contextLength,
                }
              : null,
          };
        })
      );
      return res.json({
        object: 'list',
        default_model: OPENROUTER_DEFAULT_MODEL,
        data: models,
      });
    } catch (e) {
      return res.status(500).json({
        error: {
          message: e instanceof Error ? e.message : 'Failed to list models',
          type: 'server_error',
        },
      });
    }
  });

  router.post(
    '/',
    validateChatRequest,
    requirePayment(postPaymentOptions),
    async (req, res) => {
      try {
        const body = req.body && typeof req.body === 'object' ? req.body : {};
        const model =
          body.model && typeof body.model === 'string' && isAllowedOpenRouterModel(body.model)
            ? body.model.trim()
            : OPENROUTER_DEFAULT_MODEL;

        const completion = await callOpenRouterChatCompletion({
          model,
          messages: body.messages,
          max_tokens: body.max_tokens,
          temperature: body.temperature,
          top_p: body.top_p,
          frequency_penalty: body.frequency_penalty,
          presence_penalty: body.presence_penalty,
          seed: body.seed,
          stop: body.stop,
          tools: body.tools,
          tool_choice: body.tool_choice,
          parallel_tool_calls: body.parallel_tool_calls,
          response_format: body.response_format,
        });

        const priceUsd = req.x402Payment?.priceUsd;
        const actualCost =
          completion?.usage && typeof completion.usage === 'object'
            ? completion.usage.cost
            : undefined;
        console.log(
          '[chat/completions]',
          JSON.stringify({
            model: completion?.model ?? model,
            priceUsd,
            promptTokens: completion?.usage?.prompt_tokens,
            completionTokens: completion?.usage?.completion_tokens,
            actualCostUsd: actualCost,
          })
        );

        await settlePaymentAndSetResponse(res, req);
        return res.json(completion);
      } catch (error) {
        const status = typeof error?.status === 'number' ? error.status : 502;
        return res.status(status).json({
          error: {
            message: error instanceof Error ? error.message : 'Chat completion failed',
            type: 'upstream_error',
            ...(error?.raw && { details: error.raw }),
          },
        });
      }
    }
  );

  return router;
}
