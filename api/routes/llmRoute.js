/**
 * x402 LLM Exchange smart router.
 * POST /llm/route — OpenAI-compatible chat with cheapest/reliable/fastest/quality routing.
 * GET /llm/models — discovery of routable models + live price hints.
 */
import express from 'express';
import { getResourceDescription } from '../config/x402ResourceCatalog.js';
import {
  LLM_EXCHANGE_DEFAULT_MAX_TOKENS,
  LLM_EXCHANGE_FLOOR_USD,
} from '../config/x402Pricing.js';
import { getV2Payment } from '../utils/getV2Payment.js';
import {
  applyLlmExchangeMargin,
  quoteProviderBaseUsd,
} from '../libs/llmService.js';
import {
  LLM_ROUTE_POLICIES,
  listLlmExchangeModels,
  listRoutableProviders,
  parseRoutePolicy,
  rankProviders,
  routeLlmChatCompletion,
} from '../libs/llmRouter.js';

const {
  requirePayment,
  settlePaymentAndSetResponse,
  getPaymentSignatureHeaderFromReq,
} = await getV2Payment();

const outputSchema = {
  id: { type: 'string', description: 'Completion id' },
  object: { type: 'string', description: 'Always chat.completion' },
  model: { type: 'string', description: 'Upstream model slug used' },
  choices: { type: 'array', description: 'OpenAI-style choices' },
  usage: { type: 'object', description: 'Token usage when provided by upstream' },
  syra_route: {
    type: 'object',
    description: 'Router metadata: policy, provider, price split, failover attempts',
  },
};

/**
 * Dynamic price: rank providers for policy, quote top candidate.
 * @param {import('express').Request} req
 */
async function getLlmRoutePriceUsd(req) {
  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const policy = parseRoutePolicy(
    req.get('x-syra-route') || req.get('X-Syra-Route') || body.route_policy || body.routePolicy,
  );
  const preferred =
    req.get('x-syra-provider') ||
    req.get('X-Syra-Provider') ||
    body.provider_id ||
    body.providerId ||
    null;

  try {
    let providers = await listRoutableProviders();
    if (typeof body.model === 'string' && body.model.trim()) {
      const mid = body.model.trim();
      const matching = providers.filter(
        (p) =>
          p.isSystemFallback ||
          (Array.isArray(p.models) && p.models.some((m) => m.id === mid)),
      );
      if (matching.length > 0) providers = matching;
    }
    if (preferred) {
      const hit = providers.find((p) => String(p._id) === String(preferred));
      if (hit) providers = [hit, ...providers.filter((p) => p !== hit)];
    }
    const ranked = rankProviders(providers, body, policy);
    const top = ranked[0];
    if (!top) return LLM_EXCHANGE_FLOOR_USD;
    // Stash for handler so we don't re-rank inconsistently after payment.
    req.llmRouteQuote = {
      policy,
      preferredProviderId: preferred,
      providerId: String(top.provider._id),
      baseUsd: top.baseUsd,
      callerUsd: top.callerUsd,
    };
    return top.callerUsd;
  } catch {
    const fallbackBase = quoteProviderBaseUsd(
      {
        pricing: {
          mode: 'per_million_tokens',
          inputUsdPer1M: 0.15,
          outputUsdPer1M: 0.6,
        },
      },
      body,
    );
    return applyLlmExchangeMargin(fallbackBase);
  }
}

const postPaymentOptions = {
  description: getResourceDescription('llm/route'),
  method: 'POST',
  discoverable: true,
  resource: '/llm/route',
  getPriceUsd: (req) => getLlmRoutePriceUsd(req),
  inputSchema: {
    bodyType: 'json',
    bodyFields: {
      messages: {
        type: 'array',
        required: true,
        description: 'OpenAI-style messages array (role + content)',
      },
      model: {
        type: 'string',
        required: false,
        description:
          'Optional model id. When set, router prefers providers that list this model.',
      },
      max_tokens: {
        type: 'number',
        required: false,
        description: `Max completion tokens (default ${LLM_EXCHANGE_DEFAULT_MAX_TOKENS}). Affects x402 price.`,
      },
      temperature: { type: 'number', required: false },
      tools: { type: 'array', required: false },
      tool_choice: { type: 'string', required: false },
      response_format: { type: 'object', required: false },
      seed: { type: 'number', required: false },
      route_policy: {
        type: 'string',
        required: false,
        description: `Routing policy: ${LLM_ROUTE_POLICIES.join(' | ')} (or send X-Syra-Route header)`,
      },
    },
  },
  outputSchema,
};

function validateLlmRouteRequest(req, res, next) {
  const body = req.body && typeof req.body === 'object' ? req.body : {};

  if (body.stream === true) {
    return res.status(400).json({
      error: {
        message: 'stream: true is not supported on /llm/route yet. Omit stream or set false.',
        type: 'invalid_request_error',
      },
    });
  }

  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    if (!getPaymentSignatureHeaderFromReq(req)) {
      return next();
    }
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

export async function createLlmRouteRouter() {
  const router = express.Router();

  router.get('/models', async (_req, res) => {
    try {
      const models = await listLlmExchangeModels();
      return res.json({
        object: 'list',
        policies: LLM_ROUTE_POLICIES,
        default_policy: 'cheapest',
        endpoint: '/llm/route',
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

  router.get('/policies', (_req, res) => {
    res.json({
      success: true,
      data: {
        policies: LLM_ROUTE_POLICIES,
        default: 'cheapest',
        header: 'X-Syra-Route',
      },
    });
  });

  router.post(
    '/route',
    validateLlmRouteRequest,
    requirePayment(postPaymentOptions),
    async (req, res) => {
      try {
        const body = req.body && typeof req.body === 'object' ? req.body : {};
        const policy = parseRoutePolicy(
          req.get('x-syra-route') ||
            req.get('X-Syra-Route') ||
            body.route_policy ||
            body.routePolicy ||
            req.llmRouteQuote?.policy,
        );
        const preferredProviderId =
          req.get('x-syra-provider') ||
          req.get('X-Syra-Provider') ||
          body.provider_id ||
          body.providerId ||
          req.llmRouteQuote?.providerId ||
          null;

        const routed = await routeLlmChatCompletion({
          body,
          policy,
          preferredProviderId,
        });

        if (!routed.ok) {
          return res.status(502).json({
            error: {
              message: routed.error || 'LLM routing failed',
              type: 'upstream_error',
              attempts: routed.attempts,
            },
          });
        }

        const { splitLlmExchangeRevenue } = await import('../libs/llmService.js');
        const split = splitLlmExchangeRevenue(routed.callerUsd, routed.feeBps);

        // Attach fee-split metadata for settlePaymentAndSetResponse buyback hook.
        if (req.x402Payment) {
          req.x402Payment.buybackRevenueUsd = routed.provider.isSystemFallback
            ? routed.callerUsd
            : split.platformFeeUsd;
          req.x402Payment.llmExchange = {
            providerId: routed.provider.isSystemFallback
              ? null
              : String(routed.provider._id),
            creatorAnonymousId: routed.provider.isSystemFallback
              ? null
              : routed.provider.creatorAnonymousId,
            payoutWallet: routed.provider.payoutWallet ?? null,
            isSystemFallback: Boolean(routed.provider.isSystemFallback),
            sellerShareUsd: routed.provider.isSystemFallback ? 0 : split.sellerShareUsd,
            platformFeeUsd: split.platformFeeUsd,
            feeBps: routed.feeBps,
            modelId: routed.modelId,
            routePolicy: routed.policy,
          };
        }

        await settlePaymentAndSetResponse(res, req);

        const completion =
          routed.completion && typeof routed.completion === 'object'
            ? { ...routed.completion }
            : { choices: [] };

        completion.syra_route = {
          policy: routed.policy,
          provider_id: String(routed.provider._id),
          provider_slug: routed.provider.slug,
          provider_title: routed.provider.title,
          model: routed.modelId,
          price_usd: routed.callerUsd,
          platform_fee_usd: split.platformFeeUsd,
          seller_share_usd: routed.provider.isSystemFallback ? 0 : split.sellerShareUsd,
          attempts: routed.attempts,
          latency_ms: routed.latencyMs,
        };

        return res.json(completion);
      } catch (e) {
        return res.status(500).json({
          error: {
            message: e instanceof Error ? e.message : 'LLM route failed',
            type: 'server_error',
          },
        });
      }
    },
  );

  return router;
}

export default createLlmRouteRouter;
