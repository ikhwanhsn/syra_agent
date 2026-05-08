/**
 * OpenAPI 3.1 for Syra gateway — multiple real routes (strict-schema friendly: no info.guidance, no x-payment-info).
 * Served at GET /openapi.json and repo-root openapi.json (`npm run openapi`).
 */
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { SIGNAL_CEX_SOURCES } from './cexSignalAnalysis.js';

const GATEWAY_DIR = path.dirname(fileURLToPath(import.meta.url));

/** Loaded from docs/examples (same snapshot clients can rely on for shape). */
function loadXAnalyzerOpenApiExample() {
  try {
    return JSON.parse(
      readFileSync(
        path.join(GATEWAY_DIR, '../docs/examples/x-analyzer-response.example.json'),
        'utf8',
      ),
    );
  } catch {
    return {
      success: true,
      data: {
        username: 'syra_agent',
        score: 0,
        grade: 'F',
        breakdown: {},
        signals: {},
        redFlags: [],
        aiSummary: null,
        updatedAt: new Date().toISOString(),
      },
    };
  }
}

const X_ANALYZER_OPENAPI_EXAMPLE = loadXAnalyzerOpenApiExample();

const DEFAULT_SERVER = 'https://api.syraa.fun';

const CEX_DOC = `${SIGNAL_CEX_SOURCES.join(', ')} (alias: crypto.com → cryptocom)`;

const LOOSE_OBJECT = { type: 'object', additionalProperties: true };

const OK_JSON = {
  description: 'OK',
  content: { 'application/json': { schema: LOOSE_OBJECT } },
};

/**
 * Rate-limit envelope. Every non-x402 / preview / agent route in this gateway shares the same
 * dual-window throttle (see {@link RATE_LIMIT_INFO} and api/utils/rateLimit.js).
 * Mirrored verbatim from the runtime rate-limit middleware response.
 */
const RATE_LIMIT_429_RESPONSE = {
  description:
    'Too Many Requests — burst (25 req / 10s per IP) or sustained (100 req / 60s per IP) limit exceeded. Wait for the duration in `Retry-After` (seconds) before retrying.',
  headers: {
    'Retry-After': {
      description: 'Seconds the client must wait before retrying.',
      schema: { type: 'integer', minimum: 1 },
    },
  },
  content: {
    'application/json': {
      schema: {
        type: 'object',
        required: ['success', 'message'],
        properties: {
          success: { type: 'boolean', const: false },
          message: { type: 'string', example: 'Too many requests. Please slow down.' },
        },
        additionalProperties: false,
      },
    },
  },
};

/**
 * Machine-readable description of the optional `x-payment-info` per-operation OpenAPI extension.
 *
 * Some x402 ecosystems (notably MPP / AgentCash registries) expect a per-operation extension
 * named `x-payment-info` to describe price + protocol metadata. The Syra **gateway** OpenAPI
 * (this document) deliberately does NOT emit it — gateway integrators get the full, canonical
 * payment shape from the **402 response body's `accepts` array** at runtime (that's the real
 * x402 V1 wire spec, not an OpenAPI annotation). The Syra **MPP discovery** doc at
 * `/mpp-openapi.json` DOES emit it because the MPP registry validator requires it.
 *
 * Exposed at the OpenAPI root as `x-payment-info-spec` so SDK generators and registries can
 * read the explanation programmatically instead of scraping `info.description`.
 */
const X_PAYMENT_INFO_SPEC = {
  emittedHere: false,
  reason:
    "Strict-schema friendly. Canonical payment metadata for paid (x402) routes is returned at runtime in the 402 response body's `accepts` array (V1 wire format: scheme, network, asset, maxAmountRequired in micro-USDC, payTo, resource, maxTimeoutSeconds, outputSchema). Pay one of those offers and retry with `X-PAYMENT`. See: https://docs.syraa.fun/docs/api/x402-api-standard",
  alsoEmittedAt: {
    document: 'https://api.syraa.fun/mpp-openapi.json',
    description:
      'MPP / AgentCash discovery document. Each paid operation includes an `x-payment-info` extension with the shape below. Settlement is still x402 V1 (HTTP 402 + `accepts`); `x-payment-info` is registry metadata only.',
  },
  shape: {
    type: 'object',
    required: ['protocols', 'pricingMode', 'price'],
    properties: {
      protocols: {
        type: 'array',
        items: { type: 'string' },
        description: 'Supported payment protocols. Syra emits `["mpp"]` in the MPP doc.',
        example: ['mpp'],
      },
      pricingMode: {
        type: 'string',
        description: 'Always `"fixed"` for Syra (per-call USD price, no auction or tiering).',
        enum: ['fixed'],
      },
      price: {
        type: 'string',
        description:
          'USD price as a decimal string (e.g. "0.01"). The runtime 402 response converts this to USDC micro-units (USDC has 6 decimals) and exposes it as `accepts[i].maxAmountRequired`.',
        example: '0.01',
      },
    },
    additionalProperties: true,
  },
  example: {
    'x-payment-info': {
      protocols: ['mpp'],
      pricingMode: 'fixed',
      price: '0.01',
    },
  },
};

/**
 * Machine-readable rate-limit metadata exposed at the OpenAPI root as `x-ratelimit`.
 * Mirrors api/utils/rateLimit.js (default export) with the burst/sustained windows configured
 * in api/index.js, and the skip allow-list also defined there.
 */
const RATE_LIMIT_INFO = {
  scope: 'per-ip',
  windows: [
    {
      type: 'burst',
      maxRequests: 25,
      windowSeconds: 10,
      description: 'Mitigates short bursts and DDoS attempts.',
    },
    {
      type: 'sustained',
      maxRequests: 100,
      windowSeconds: 60,
      description: 'Mitigates sustained spam.',
    },
  ],
  status: 429,
  retryAfterHeader: 'Retry-After',
  responseBody: { success: false, message: 'Too many requests. Please slow down.' },
  skip: {
    description:
      'Routes excluded from this throttle. x402 paid routes (`/news`, `/signal`, `/sentiment`, `/event`, `/health`, `/brain`, `/x*`, `/8004*`, etc.) are gated by HTTP 402 instead. Internal cron paths require a shared secret. RISE proxies are skipped because one user session can fan out across many list pages.',
    paths: [
      'all x402 routes (see GET /.well-known/x402)',
      '/internal/tester-agent*',
      '/internal/agent-team/run',
      '/internal/x402-x-trends/run',
      '/internal/growth-*',
      '/uponly-rise-market*',
      '/uponly-rise-portfolio*',
    ],
  },
};

const SIGNAL_QUERY = [
  {
    name: 'token',
    in: 'query',
    required: false,
    schema: { type: 'string', default: 'bitcoin' },
    description: 'Asset name for signal routing (e.g. bitcoin, solana).',
  },
  {
    name: 'source',
    in: 'query',
    required: false,
    schema: { type: 'string' },
    description: `Data source. Default: binance. CEX: ${CEX_DOC}. n8n | webhook for legacy webhook.`,
  },
  {
    name: 'instId',
    in: 'query',
    required: false,
    schema: { type: 'string' },
    description: 'Venue symbol override (e.g. BTCUSDT, BTC-USDT).',
  },
  {
    name: 'bar',
    in: 'query',
    required: false,
    schema: { type: 'string' },
    description: 'Candle interval (e.g. 1m, 1h, 4h, 1d).',
  },
  {
    name: 'limit',
    in: 'query',
    required: false,
    schema: { type: 'string' },
    description: 'Candle count (default ~200).',
  },
];

const TICKER_QUERY = [
  {
    name: 'ticker',
    in: 'query',
    required: false,
    schema: { type: 'string', default: 'general' },
    description: 'Ticker symbol or general for broad feed.',
  },
];

const JSON_BODY_LOOSE = {
  required: false,
  content: {
    'application/json': {
      schema: {
        type: 'object',
        additionalProperties: true,
        description: 'Request body — see https://docs.syraa.fun for fields.',
      },
    },
  },
};

const SIGNAL_SUCCESS_SCHEMA = {
  type: 'object',
  required: ['success'],
  properties: {
    success: { type: 'boolean' },
    data: {
      type: 'object',
      properties: { signal: { type: 'object', additionalProperties: true } },
    },
    meta: { type: 'object', additionalProperties: true },
    error: { type: 'string' },
  },
  additionalProperties: true,
};

/**
 * @param {boolean} x402
 */
function responsesFor(x402) {
  /** @type {Record<string, unknown>} */
  const r = { '200': OK_JSON };
  if (x402) {
    r['402'] = {
      description: 'Payment required — x402 (Solana/Base USDC). Retry with payment proof per response body.',
    };
  }
  // Every operation in this gateway shares the same rate-limit envelope (x402 routes are skipped
  // at runtime — see RATE_LIMIT_INFO.skip — but advertising 429 here is harmless and lets clients
  // generate uniform error handling).
  r['429'] = RATE_LIMIT_429_RESPONSE;
  return r;
}

/**
 * @param {string} tag
 * @param {string} summary
 * @param {string} operationId
 * @param {unknown[]} [parameters]
 * @param {boolean} [x402]
 */
function opGet(tag, summary, operationId, parameters = [], x402 = false) {
  return {
    tags: [tag],
    summary,
    operationId,
    ...(parameters.length ? { parameters } : {}),
    responses: responsesFor(x402),
  };
}

/**
 * @param {string} tag
 * @param {string} summary
 * @param {string} operationId
 * @param {boolean} [x402]
 */
function opPost(tag, summary, operationId, x402 = false) {
  return {
    tags: [tag],
    summary,
    operationId,
    requestBody: JSON_BODY_LOOSE,
    responses: responsesFor(x402),
  };
}

/**
 * @returns {Record<string, unknown>}
 */
export function buildGatewayOpenApi() {
  const serverUrl = (process.env.SYRA_PUBLIC_API_URL || DEFAULT_SERVER).replace(/\/$/, '');

  /** @type {Record<string, Record<string, unknown>>} */
  const paths = {
    '/api/signal': {
      get: {
        tags: ['Signal'],
        summary: 'Public signal (no x402)',
        description: 'Same engine as /signal without micropayment. API key if server sets API_KEY.',
        operationId: 'getPublicSignal',
        parameters: SIGNAL_QUERY,
        responses: {
          '200': {
            description: 'Signal result',
            content: { 'application/json': { schema: SIGNAL_SUCCESS_SCHEMA } },
          },
          '500': {
            description: 'Upstream or configuration error',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { success: { type: 'boolean', const: false }, error: { type: 'string' } },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Signal'],
        summary: 'Public signal via JSON body',
        operationId: 'postPublicSignal',
        requestBody: {
          required: false,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  token: { type: 'string' },
                  source: { type: 'string' },
                  instId: { type: 'string' },
                  bar: { type: 'string' },
                  limit: { type: 'number' },
                },
                additionalProperties: false,
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Signal result',
            content: { 'application/json': { schema: SIGNAL_SUCCESS_SCHEMA } },
          },
          '500': {
            description: 'Error',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { success: { type: 'boolean', const: false }, error: { type: 'string' } },
                },
              },
            },
          },
        },
      },
    },

    '/info': { get: opGet('Info', 'Gateway info', 'getInfo', [], false) },
    '/info/stats': { get: opGet('Info', 'Public usage stats', 'getInfoStats', [], false) },

    '/preview/news': {
      get: opGet('Preview', 'News preview (no x402)', 'getPreviewNews', TICKER_QUERY, false),
    },
    '/preview/sentiment': {
      get: opGet('Preview', 'Sentiment preview (no x402)', 'getPreviewSentiment', TICKER_QUERY, false),
    },
    '/preview/signal': {
      get: opGet('Preview', 'Signal preview (no x402)', 'getPreviewSignal', SIGNAL_QUERY, false),
    },

    '/dashboard-summary': {
      get: opGet('Dashboard', 'Dashboard KPI summary', 'getDashboardSummary', [], false),
    },
    '/binance-ticker': {
      get: opGet('Dashboard', 'Binance ticker prices', 'getBinanceTicker', [], false),
    },

    '/prediction-game/health': {
      get: opGet('Prediction game', 'Prediction game health', 'getPredictionGameHealth', [], false),
    },

    '/news': {
      get: opGet('Market data (x402)', 'Crypto news', 'getNews', TICKER_QUERY, true),
      post: opPost('Market data (x402)', 'Crypto news (POST)', 'postNews', true),
    },
    '/sentiment': {
      get: opGet('Market data (x402)', 'Sentiment', 'getSentiment', TICKER_QUERY, true),
      post: opPost('Market data (x402)', 'Sentiment (POST)', 'postSentiment', true),
    },
    '/event': {
      get: opGet('Market data (x402)', 'Crypto events', 'getEvent', TICKER_QUERY, true),
      post: opPost('Market data (x402)', 'Crypto events (POST)', 'postEvent', true),
    },
    '/health': {
      get: opGet('Gateway (x402)', 'API health (x402 liveness)', 'getHealth', [], true),
      post: opPost('Gateway (x402)', 'API health (POST)', 'postHealth', true),
    },
    '/brain': {
      get: opGet(
        'AI (x402)',
        'Syra Brain (GET)',
        'getBrain',
        [
          {
            name: 'question',
            in: 'query',
            required: false,
            schema: { type: 'string' },
            description: 'Natural language question.',
          },
        ],
        true,
      ),
      post: opPost('AI (x402)', 'Syra Brain (POST)', 'postBrain', true),
    },

    '/arbitrage': {
      get: opGet(
        'Market data (x402)',
        'Arbitrage — CMC top + cross-CEX snapshots + ranked routes (x402)',
        'getArbitrage',
        [
          {
            name: 'limit',
            in: 'query',
            required: false,
            schema: { type: 'integer', minimum: 1, maximum: 25, default: 10 },
            description: 'Number of top tradable assets to include (default 10, max 25).',
          },
        ],
        true,
      ),
      post: opPost(
        'Market data (x402)',
        'Arbitrage — POST body may include { limit } (x402)',
        'postArbitrage',
        true,
      ),
    },

    '/x-analyzer': {
      get: {
        tags: ['Social (x402)'],
        summary: 'X Project Analyzer — profile + tweets + score (x402)',
        description:
          'Micropayment via x402. Returns deterministic 0–100 score, category breakdown, signals, red flags; optional `includeAiSummary` adds grounded LLM bullets. Example `200` body is maintained at `api/docs/examples/x-analyzer-response.example.json`.',
        operationId: 'getXAnalyzer',
        parameters: [
          {
            name: 'username',
            in: 'query',
            required: false,
            schema: { type: 'string', default: 'syra_agent' },
            description: 'X handle without @.',
          },
          {
            name: 'max_results',
            in: 'query',
            required: false,
            schema: { type: 'integer', minimum: 5, maximum: 50, default: 20 },
            description: 'Recent tweets sampled for scoring.',
          },
          {
            name: 'includeAiSummary',
            in: 'query',
            required: false,
            schema: { type: 'boolean', default: false },
            description: 'If true, append optional LLM summary (still grounded on returned metrics).',
          },
        ],
        responses: {
          '200': {
            description:
              'Success — `success: true` and `data` (shape matches checked-in example file).',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['success'],
                  properties: {
                    success: { type: 'boolean' },
                    data: { type: 'object', additionalProperties: true },
                    error: { type: 'string' },
                  },
                },
                example: X_ANALYZER_OPENAPI_EXAMPLE,
              },
            },
          },
          '402': responsesFor(true)['402'],
          '404': { description: 'X user not found' },
          '502': { description: 'X API upstream error' },
          '503': { description: 'Server missing X_BEARER_TOKEN' },
        },
      },
      post: {
        tags: ['Social (x402)'],
        summary: 'X Project Analyzer — POST body (x402)',
        description:
          'Same as GET; body may include `username`, `max_results`, `includeAiSummary`. Example response identical to GET.',
        operationId: 'postXAnalyzer',
        requestBody: {
          required: false,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  username: { type: 'string', description: 'Default syra_agent' },
                  max_results: { type: 'integer', minimum: 5, maximum: 50 },
                  includeAiSummary: { type: 'boolean' },
                },
              },
              example: {
                username: 'syra_agent',
                max_results: 20,
                includeAiSummary: false,
              },
            },
          },
        },
        responses: {
          '200': {
            description:
              'Success — same shape as GET; see example file and GET operation example.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['success'],
                  properties: {
                    success: { type: 'boolean' },
                    data: { type: 'object', additionalProperties: true },
                    error: { type: 'string' },
                  },
                },
                example: X_ANALYZER_OPENAPI_EXAMPLE,
              },
            },
          },
          '402': responsesFor(true)['402'],
          '404': { description: 'X user not found' },
          '502': { description: 'X API upstream error' },
          '503': { description: 'Server missing X_BEARER_TOKEN' },
        },
      },
    },

    '/x-projects-analyze/types': {
      get: {
        tags: ['Social (batch)'],
        summary: 'List batch analyzer types',
        description:
          'Returns configured `type` ids (labels, provider). X accounts per type are fixed server-side. No X API calls. API key when server sets API_KEY.',
        operationId: 'getXProjectsAnalyzeTypes',
        responses: {
          '200': OK_JSON,
        },
      },
    },

    '/x-projects-analyze/account': {
      get: {
        tags: ['Social (batch)'],
        summary: 'Single-account Alpha analysis (allowlisted)',
        description:
          '`username` must belong to the configured `type` handle list. Returns full score payload, optional AI summary (default on), and `recentTweets` sample. API key when API_KEY is set.',
        operationId: 'getXProjectsAnalyzeAccount',
        parameters: [
          {
            name: 'username',
            in: 'query',
            required: true,
            schema: { type: 'string' },
            description: 'X handle without @.',
          },
          {
            name: 'type',
            in: 'query',
            required: false,
            schema: { type: 'string', default: 'x402' },
            description: 'Feed type key.',
          },
          {
            name: 'max_results',
            in: 'query',
            required: false,
            schema: { type: 'integer', minimum: 10, maximum: 50, default: 35 },
            description: 'Tweet sample size.',
          },
          {
            name: 'includeAiSummary',
            in: 'query',
            required: false,
            schema: { type: 'boolean', default: true },
            description: 'Grounded LLM bullets (OpenRouter).',
          },
        ],
        responses: {
          ...responsesFor(false),
          '403': { description: 'Username not in feed type allowlist' },
          '404': { description: 'X user not found' },
          '502': { description: 'X API upstream error' },
          '503': { description: 'Server missing X_BEARER_TOKEN' },
        },
      },
      post: {
        tags: ['Social (batch)'],
        summary: 'Single-account Alpha analysis — POST',
        operationId: 'postXProjectsAnalyzeAccount',
        requestBody: {
          required: false,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  username: { type: 'string' },
                  type: { type: 'string', default: 'x402' },
                  max_results: { type: 'integer', minimum: 10, maximum: 50 },
                  includeAiSummary: { type: 'boolean' },
                },
                required: ['username'],
              },
            },
          },
        },
        responses: {
          ...responsesFor(false),
          '403': { description: 'Username not in feed type allowlist' },
          '404': { description: 'X user not found' },
          '502': { description: 'X API upstream error' },
          '503': { description: 'Server missing X_BEARER_TOKEN' },
        },
      },
    },

    '/x-projects-analyze': {
      get: {
        tags: ['Social (batch)'],
        summary: 'Batch X project analyzer (no x402)',
        description:
          'Runs the same deterministic analysis as /x-analyzer for all X handles configured for `type` (default `x402`). Handles are not client-supplied. See GET /x-projects-analyze/types.',
        operationId: 'getXProjectsAnalyze',
        parameters: [
          {
            name: 'type',
            in: 'query',
            required: false,
            schema: { type: 'string', default: 'x402' },
            description: 'Analyzer type key (e.g. x402).',
          },
          {
            name: 'max_results',
            in: 'query',
            required: false,
            schema: { type: 'integer', minimum: 5, maximum: 50, default: 20 },
            description: 'Tweet sample per account.',
          },
          {
            name: 'includeAiSummary',
            in: 'query',
            required: false,
            schema: { type: 'boolean', default: false },
            description: 'Optional grounded LLM summary per account (OpenRouter).',
          },
        ],
        responses: responsesFor(false),
      },
      post: {
        tags: ['Social (batch)'],
        summary: 'Batch X project analyzer — POST body',
        operationId: 'postXProjectsAnalyze',
        requestBody: {
          required: false,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  type: { type: 'string', default: 'x402' },
                  max_results: { type: 'integer', minimum: 5, maximum: 50 },
                  includeAiSummary: { type: 'boolean' },
                },
              },
            },
          },
        },
        responses: responsesFor(false),
      },
    },
  };

  return {
    openapi: '3.1.0',
    info: {
      title: 'Syra API',
      version: '1.0.0',
      description: [
        'Syra gateway: preview and dashboard routes may require `X-API-Key` / Bearer when the server sets `API_KEY`.',
        '**x402** routes return **HTTP 402** until paid (Solana/Base USDC). The full payment offer (network, asset, price in micro-USDC, `payTo`, etc.) is returned at runtime in the 402 response body\'s `accepts` array — that is the canonical x402 V1 wire spec; pay one offer and retry with `X-PAYMENT`. See https://docs.syraa.fun/docs/api/x402-api-standard for the wire format and signing examples.',
        'Some x402 ecosystems (MPP / AgentCash registries) expect a per-operation OpenAPI extension named `x-payment-info` carrying registry metadata (protocols, pricingMode, price). This **gateway** spec deliberately omits it for strict-schema friendliness; the **MPP discovery** document at `GET /mpp-openapi.json` emits it on every paid operation. The exact shape Syra uses is described in the `x-payment-info-spec` extension at the root of this document.',
        '**Rate limits** (per IP, applied to every non-x402 / non-cron route): burst **25 req / 10s** + sustained **100 req / 60s**. Exceeding either returns **HTTP 429** with `Retry-After: <seconds>` and `{ success: false, message }`. x402 paid routes are gated by HTTP 402 instead and bypass this throttle. See the `x-ratelimit` extension below for the machine-readable spec.',
      ].join('\n\n'),
    },
    servers: [{ url: serverUrl }],
    'x-payment-info-spec': X_PAYMENT_INFO_SPEC,
    'x-ratelimit': RATE_LIMIT_INFO,
    paths,
    tags: [
      { name: 'Signal', description: 'GET/POST /api/signal — no x402' },
      { name: 'Info', description: 'Public info' },
      { name: 'Preview', description: 'No x402 mirrors of news/sentiment/signal' },
      { name: 'Dashboard', description: 'Dashboard helpers' },
      { name: 'Prediction game', description: 'Prediction game API' },
      { name: 'Market data (x402)', description: 'Cryptonews-backed; payment via x402' },
      { name: 'Gateway (x402)', description: 'Health and gateway checks' },
      { name: 'AI (x402)', description: 'Syra Brain Q&A' },
      {
        name: 'Social (x402)',
        description: 'X (Twitter) analysis — pay-per-call via x402',
      },
      {
        name: 'Social (batch)',
        description: 'Batch X project analysis — API key when configured; no x402',
      },
    ],
    components: {
      securitySchemes: {
        SyraApiKey: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
          description: 'When API_KEY is set: also `api-key` or `Authorization: Bearer`. x402 routes do not use this.',
        },
      },
    },
  };
}
