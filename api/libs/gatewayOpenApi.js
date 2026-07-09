/**
 * OpenAPI 3.1 for Syra gateway — multiple real routes (strict-schema friendly: no info.guidance, no x-payment-info).
 * Served at GET /openapi.json and repo-root openapi.json (`npm run openapi`).
 */
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { SIGNAL_CEX_SOURCES } from './cexSignalAnalysis.js';
import {
  X402_DISPLAY_PRICE_USD,
  X402_DISPLAY_PRICE_CHECK_STATUS_USD,
  X402_DISPLAY_PRICE_NEWS_USD,
  X402_DISPLAY_PRICE_BRAIN_USD,
  X402_DISPLAY_PRICE_X_ANALYZER_USD,
  X402_DISPLAY_PRICE_ARBITRAGE_EXPERIMENT_USD,
  X402_DISPLAY_PRICE_SPCX_USD,
  X402_DISPLAY_PRICE_EQUITY_USD,
  X402_DISPLAY_PRICE_INDICATOR_USD,
  X402_DISPLAY_PRICE_JUPITER_QUOTE_USD,
  X402_DISPLAY_PRICE_PUMP_FUN_MARKET_LIST_USD,
  X402_DISPLAY_PRICE_PUMP_FUN_ANALYZER_USD,
  X402_DISPLAY_PRICE_PUMP_FUN_SCOUT_USD,
  X402_DISPLAY_PRICE_RISE_SCOUT_USD,
  X402_DISPLAY_PRICE_COINGECKO_SCOUT_USD,
  X402_DISPLAY_PRICE_DEXSCREENER_PAIRS_USD,
  X402_DISPLAY_PRICE_GECKOTERMINAL_POOLS_USD,
  X402_DISPLAY_PRICE_DEFILLAMA_TVL_USD,
  X402_DISPLAY_PRICE_RUGCHECK_REPORT_USD,
  X402_DISPLAY_PRICE_PYTH_PRICE_USD,
  X402_DISPLAY_PRICE_INSIGHTS_NETWORK_HEALTH_USD,
  X402_DISPLAY_PRICE_INSIGHTS_GAS_ORACLE_USD,
  X402_DISPLAY_PRICE_INSIGHTS_MARKET_PULSE_USD,
  X402_DISPLAY_PRICE_INSIGHTS_TOKEN_METRICS_USD,
  X402_DISPLAY_PRICE_INSIGHTS_DEFI_TVL_USD,
  X402_DISPLAY_PRICE_INSIGHTS_VOLATILITY_INDEX_USD,
  X402_DISPLAY_PRICE_ASSETS_BOARD_USD,
  X402_DISPLAY_PRICE_ASSETS_DETAIL_USD,
  X402_DISPLAY_PRICE_BITCOIN_USD,
} from '../config/x402Pricing.js';
import { getResourceDescription, getResourceSummary, getResourcePillar } from '../config/x402ResourceCatalog.js';
import { resolvePillarForOpenApiPath } from '../config/pillars.js';

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

const SYRA_DATA_RESPONSE_SCHEMA = {
  type: 'object',
  required: ['success', 'data'],
  properties: {
    success: { type: 'boolean', const: true },
    data: { type: 'object', additionalProperties: true },
  },
  additionalProperties: false,
};

/** @param {boolean} [paid] */
function syraDataResponses(paid = true) {
  /** @type {Record<string, unknown>} */
  const r = {
    '200': {
      description: 'Success — `{ success: true, data: { ... } }`',
      content: { 'application/json': { schema: SYRA_DATA_RESPONSE_SCHEMA } },
    },
  };
  if (paid) r['402'] = PAID_402_RESPONSE;
  r['429'] = RATE_LIMIT_429_RESPONSE;
  return r;
}

const JUPITER_QUOTE_DATA_SCHEMA = {
  type: 'object',
  properties: {
    quote: { type: 'object', additionalProperties: true, description: 'Jupiter quoteResponse payload' },
    referral: { type: 'object', additionalProperties: true, description: 'Syra referral fee metadata' },
    computedAt: { type: 'string' },
  },
  additionalProperties: true,
};

const PUMPFUN_ANALYZER_DATA_SCHEMA = {
  type: 'object',
  properties: {
    mint: { type: 'string' },
    syraAlpha: { type: 'object', additionalProperties: true },
    market: { type: 'object', additionalProperties: true },
    dossier: { type: 'object', additionalProperties: true },
    pumpfun: { type: 'object', additionalProperties: true },
    holders: { type: 'object', additionalProperties: true },
    distribution: { type: 'object', additionalProperties: true },
    onChainSecurity: { type: 'object', additionalProperties: true },
    kolShills: { type: 'object', additionalProperties: true },
    fetchedAt: { type: 'string' },
  },
  additionalProperties: true,
};

const ASSETS_DETAIL_DATA_SCHEMA = {
  type: 'object',
  properties: {
    query: { type: 'object', additionalProperties: true },
    assetId: { type: 'string' },
    chartMint: { type: 'string' },
    asset: { type: 'object', additionalProperties: true },
    includes: { type: 'object', additionalProperties: true },
    ohlcv: { type: 'object', additionalProperties: true },
    mintRisk: { type: 'object', additionalProperties: true },
    fetchedAt: { type: 'string' },
  },
  additionalProperties: true,
};

/** @param {Record<string, unknown>} dataSchema */
function syraDataResponsesWithSchema(dataSchema, paid = true) {
  const base = syraDataResponses(paid);
  return {
    ...base,
    '200': {
      description: 'Success — `{ success: true, data: { ... } }`',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['success', 'data'],
            properties: {
              success: { type: 'boolean', const: true },
              data: dataSchema,
            },
            additionalProperties: false,
          },
        },
      },
    },
  };
}

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
  emittedHere: true,
  reason:
    'Each paid operation in this document includes x-payment-info (catalog hint for x402scan / tryponcho). Canonical payment metadata is still returned at runtime in the HTTP 402 response body `accepts` array and the Payment-Required header (x402 v2). Pay one offer and retry with PAYMENT-SIGNATURE or X-PAYMENT. See: https://docs.syraa.fun/docs/api/x402-api-standard',
  alsoEmittedAt: {
    document: 'https://api.syraa.fun/mpp-openapi.json',
    description:
      'MPP / AgentCash discovery document with the full x402 catalog. Settlement is x402 v2 (HTTP 402 + accepts); x-payment-info is registry metadata.',
  },
  shape: {
    type: 'object',
    required: ['protocols', 'price'],
    properties: {
      protocols: {
        type: 'array',
        items: { type: 'object' },
        description: 'Protocol objects, e.g. [{ "x402": {} }, { "mpp": { ... } }].',
        example: [{ x402: {} }, { mpp: { method: '', intent: '', currency: '' } }],
      },
      price: {
        type: 'object',
        required: ['mode', 'currency', 'amount'],
        properties: {
          mode: { type: 'string', enum: ['fixed'] },
          currency: { type: 'string', example: 'USD' },
          amount: { type: 'string', description: 'USD price as decimal string', example: '0.01' },
        },
      },
    },
    additionalProperties: true,
  },
  example: {
    'x-payment-info': {
      protocols: [{ x402: {} }, { mpp: { method: '', intent: '', currency: '' } }],
      price: { mode: 'fixed', currency: 'USD', amount: '0.01' },
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
      'Routes excluded from this throttle. x402 paid routes are gated by HTTP 402 instead. OpenAPI free routes (/info, /prediction-game/health) are public for discovery. Internal cron paths require a shared secret. RISE proxies are skipped because one user session can fan out across many list pages.',
    paths: [
      'all x402 routes (see GET /.well-known/x402)',
      '/info',
      '/info/*',
      '/prediction-game/health',
      '/internal/tester-agent*',
      '/internal/trend-scout/run',
      '/internal/growth-scout/run',
      '/internal/partnership-scout/run',
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

/** @param {number} n */
function usdPriceString(n) {
  const x = Number(n);
  if (!Number.isFinite(x) || x < 0) return '0';
  const s = x.toFixed(6).replace(/\.?0+$/, '');
  return s === '' ? '0' : s;
}

/** @param {number} usd */
function xPaymentInfo(usd) {
  const amount = usdPriceString(usd);
  return {
    protocols: [{ x402: {} }, { mpp: { method: '', intent: '', currency: '' } }],
    price: { mode: 'fixed', currency: 'USD', amount },
  };
}

const SECURITY_FREE = [];
const SECURITY_PAID = [{ x402: [] }];

const PAID_402_RESPONSE = {
  description:
    'Payment required — x402 v2 (Payment-Required header + JSON body with accepts). Retry with PAYMENT-SIGNATURE or X-PAYMENT.',
  headers: {
    'Payment-Required': {
      description: 'x402 v2 encoded payment requirements',
      schema: { type: 'string' },
    },
  },
};

function discoveryOwnershipProofs() {
  const proofs = [];
  if (process.env.X402_OWNERSHIP_PROOF_EVM?.trim()) {
    proofs.push(process.env.X402_OWNERSHIP_PROOF_EVM.trim());
  }
  if (process.env.X402_OWNERSHIP_PROOF_SVM?.trim()) {
    proofs.push(process.env.X402_OWNERSHIP_PROOF_SVM.trim());
  }
  if (proofs.length === 0 && process.env.X402_OWNERSHIP_PROOF?.trim()) {
    proofs.push(process.env.X402_OWNERSHIP_PROOF.trim());
  }
  return proofs;
}

const SIGNAL_X402_RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    signal: { type: 'object', additionalProperties: true },
  },
  additionalProperties: true,
};

/**
 * @param {boolean} paid
 */
function responsesFor(paid) {
  /** @type {Record<string, unknown>} */
  const r = { '200': OK_JSON };
  if (paid) {
    r['402'] = PAID_402_RESPONSE;
  }
  r['429'] = RATE_LIMIT_429_RESPONSE;
  return r;
}

/**
 * @param {string} tag
 * @param {string} summary
 * @param {string} operationId
 * @param {unknown[]} [parameters]
 * @param {boolean} [paid]
 * @param {number} [priceUsd]
 * @param {string} [description]
 */
function opGet(tag, summary, operationId, parameters = [], paid = false, priceUsd = X402_DISPLAY_PRICE_USD, description) {
  return {
    tags: [tag],
    summary,
    ...(description ? { description } : {}),
    operationId,
    security: paid ? SECURITY_PAID : SECURITY_FREE,
    ...(paid ? { 'x-payment-info': xPaymentInfo(priceUsd) } : {}),
    ...(parameters.length ? { parameters } : {}),
    responses: responsesFor(paid),
  };
}

/**
 * @param {string} tag
 * @param {string} summary
 * @param {string} operationId
 * @param {boolean} [paid]
 * @param {number} [priceUsd]
 * @param {string} [description]
 */
function opPost(tag, summary, operationId, paid = false, priceUsd = X402_DISPLAY_PRICE_USD, description) {
  return {
    tags: [tag],
    summary,
    ...(description ? { description } : {}),
    operationId,
    security: paid ? SECURITY_PAID : SECURITY_FREE,
    ...(paid ? { 'x-payment-info': xPaymentInfo(priceUsd) } : {}),
    requestBody: JSON_BODY_LOOSE,
    responses: responsesFor(paid),
  };
}

/** Discovery catalog helper — summary + description from x402ResourceCatalog. */
function opGetCat(segment, tag, operationId, parameters = [], paid = false, priceUsd = X402_DISPLAY_PRICE_USD) {
  const op = opGet(tag, getResourceSummary(segment), operationId, parameters, paid, priceUsd, getResourceDescription(segment));
  return { ...op, 'x-syra-pillar': getResourcePillar(segment) };
}

function opPostCat(segment, tag, operationId, paid = false, priceUsd = X402_DISPLAY_PRICE_USD) {
  const op = opPost(tag, getResourceSummary(segment), operationId, paid, priceUsd, getResourceDescription(segment));
  return { ...op, 'x-syra-pillar': getResourcePillar(segment) };
}

/**
 * Attach pillar tag to an OpenAPI operation from its path.
 * @param {Record<string, unknown>} op
 * @param {string} openApiPath
 */
function withPillarTag(op, openApiPath) {
  return { ...op, 'x-syra-pillar': resolvePillarForOpenApiPath(openApiPath) };
}

/**
 * @returns {Record<string, unknown>}
 */
export function buildGatewayOpenApi() {
  const serverUrl = (process.env.SYRA_PUBLIC_API_URL || DEFAULT_SERVER).replace(/\/$/, '');

  /** @type {Record<string, Record<string, unknown>>} */
  const paths = {
    '/signal': {
      get: {
        tags: ['Market data (x402)'],
        summary: getResourceSummary('signal'),
        description: getResourceDescription('signal'),
        operationId: 'getSignal',
        security: SECURITY_PAID,
        'x-payment-info': xPaymentInfo(X402_DISPLAY_PRICE_USD),
        parameters: SIGNAL_QUERY,
        responses: {
          '200': {
            description: 'Signal result',
            content: { 'application/json': { schema: SIGNAL_X402_RESPONSE_SCHEMA } },
          },
          '402': PAID_402_RESPONSE,
          '429': RATE_LIMIT_429_RESPONSE,
          '500': {
            description: 'Upstream or configuration error',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { error: { type: 'string' } },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Market data (x402)'],
        summary: `${getResourceSummary('signal')} (POST)`,
        description: getResourceDescription('signal'),
        operationId: 'postSignal',
        security: SECURITY_PAID,
        'x-payment-info': xPaymentInfo(X402_DISPLAY_PRICE_USD),
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
            content: { 'application/json': { schema: SIGNAL_X402_RESPONSE_SCHEMA } },
          },
          '402': PAID_402_RESPONSE,
          '429': RATE_LIMIT_429_RESPONSE,
          '500': {
            description: 'Error',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { error: { type: 'string' } },
                },
              },
            },
          },
        },
      },
    },

    '/info': { get: opGet('Info', 'Gateway info', 'getInfo', [], false) },
    '/info/stats': { get: opGet('Info', 'Public usage stats', 'getInfoStats', [], false) },

    '/prediction-game/health': {
      get: opGet('Prediction game', 'Prediction game health', 'getPredictionGameHealth', [], false),
    },

    '/news': {
      get: opGetCat('news', 'Market data (x402)', 'getNews', TICKER_QUERY, true, X402_DISPLAY_PRICE_NEWS_USD),
      post: opPostCat('news', 'Market data (x402)', 'postNews', true, X402_DISPLAY_PRICE_NEWS_USD),
    },
    '/sentiment': {
      get: opGetCat('sentiment', 'Market data (x402)', 'getSentiment', TICKER_QUERY, true, X402_DISPLAY_PRICE_NEWS_USD),
      post: opPostCat('sentiment', 'Market data (x402)', 'postSentiment', true, X402_DISPLAY_PRICE_NEWS_USD),
    },
    '/event': {
      get: opGetCat('event', 'Market data (x402)', 'getEvent', TICKER_QUERY, true, X402_DISPLAY_PRICE_NEWS_USD),
      post: opPostCat('event', 'Market data (x402)', 'postEvent', true, X402_DISPLAY_PRICE_NEWS_USD),
    },
    '/health': {
      get: opGetCat('health', 'Gateway (x402)', 'getHealth', [], true, X402_DISPLAY_PRICE_CHECK_STATUS_USD),
      post: opPostCat('health', 'Gateway (x402)', 'postHealth', true, X402_DISPLAY_PRICE_CHECK_STATUS_USD),
    },
    '/brain': {
      get: opGetCat(
        'brain',
        'AI (x402)',
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
        X402_DISPLAY_PRICE_BRAIN_USD,
      ),
      post: opPostCat('brain', 'AI (x402)', 'postBrain', true, X402_DISPLAY_PRICE_BRAIN_USD),
    },

    '/arbitrage': {
      get: opGetCat(
        'arbitrage',
        'Market data (x402)',
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
        X402_DISPLAY_PRICE_ARBITRAGE_EXPERIMENT_USD,
      ),
      post: opPostCat('arbitrage', 'Market data (x402)', 'postArbitrage', true, X402_DISPLAY_PRICE_ARBITRAGE_EXPERIMENT_USD),
    },

    '/x-analyzer': {
      get: {
        tags: ['Social (x402)'],
        summary: 'X Project Analyzer — profile + tweets + score (x402)',
        description:
          'Micropayment via x402. Returns deterministic 0–100 score, category breakdown, signals, red flags; optional `includeAiSummary` adds grounded LLM bullets. Example `200` body is maintained at `api/docs/examples/x-analyzer-response.example.json`.',
        operationId: 'getXAnalyzer',
        security: SECURITY_PAID,
        'x-payment-info': xPaymentInfo(X402_DISPLAY_PRICE_X_ANALYZER_USD),
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
          '402': PAID_402_RESPONSE,
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
        security: SECURITY_PAID,
        'x-payment-info': xPaymentInfo(X402_DISPLAY_PRICE_X_ANALYZER_USD),
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
          '402': PAID_402_RESPONSE,
          '404': { description: 'X user not found' },
          '502': { description: 'X API upstream error' },
          '503': { description: 'Server missing X_BEARER_TOKEN' },
        },
      },
    },

    '/spcx': {
      get: {
        tags: ['Equity (x402)'],
        summary: getResourceSummary('spcx'),
        description: getResourceDescription('spcx'),
        operationId: 'getSpcxIntelligence',
        security: SECURITY_PAID,
        'x-payment-info': xPaymentInfo(X402_DISPLAY_PRICE_SPCX_USD),
        parameters: [
          { name: 'symbol', in: 'query', schema: { type: 'string', default: 'SPCXx' } },
        ],
        responses: responsesFor(true),
      },
    },
    '/equity': {
      get: {
        tags: ['Equity (x402)'],
        summary: getResourceSummary('equity'),
        description: getResourceDescription('equity'),
        operationId: 'getEquityIntelligence',
        security: SECURITY_PAID,
        'x-payment-info': xPaymentInfo(X402_DISPLAY_PRICE_EQUITY_USD),
        parameters: [
          { name: 'symbol', in: 'query', schema: { type: 'string' }, required: true },
        ],
        responses: responsesFor(true),
      },
    },
    '/jupiter/quote': {
      get: {
        ...opGetCat(
          'jupiter/quote',
          'Jupiter quote (x402)',
          'getJupiterQuote',
          [
            {
              name: 'inputMint',
              in: 'query',
              schema: { type: 'string' },
              required: true,
              description: 'Input token mint (base58)',
            },
            {
              name: 'outputMint',
              in: 'query',
              schema: { type: 'string' },
              required: true,
              description: 'Output token mint (referral fee taken on output)',
            },
            {
              name: 'amount',
              in: 'query',
              schema: { type: 'string' },
              required: true,
              description: 'Input amount in raw token units',
            },
            { name: 'slippageBps', in: 'query', schema: { type: 'integer', default: 50 } },
            { name: 'swapMode', in: 'query', schema: { type: 'string' } },
          ],
          true,
          X402_DISPLAY_PRICE_JUPITER_QUOTE_USD,
        ),
        responses: syraDataResponsesWithSchema(JUPITER_QUOTE_DATA_SCHEMA),
      },
      post: {
        tags: ['Jupiter quote (x402)'],
        summary: `${getResourceSummary('jupiter/quote')} (POST)`,
        description: getResourceDescription('jupiter/quote'),
        operationId: 'postJupiterQuote',
        security: SECURITY_PAID,
        'x-payment-info': xPaymentInfo(X402_DISPLAY_PRICE_JUPITER_QUOTE_USD),
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['inputMint', 'outputMint', 'amount'],
                properties: {
                  inputMint: { type: 'string', description: 'Input token mint (base58)' },
                  outputMint: { type: 'string', description: 'Output token mint (base58)' },
                  amount: { type: 'string', description: 'Input amount in raw token units' },
                  slippageBps: { type: 'integer', description: 'Slippage in basis points (default 50)' },
                  swapMode: { type: 'string', description: 'Jupiter swapMode e.g. ExactIn' },
                },
              },
            },
          },
        },
        responses: syraDataResponsesWithSchema(JUPITER_QUOTE_DATA_SCHEMA),
        'x-syra-pillar': getResourcePillar('jupiter/quote'),
      },
    },
    '/pumpfun/trending': {
      get: opGetCat(
        'pumpfun/trending',
        'pump.fun trending (x402)',
        'getPumpfunTrending',
        [
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'offset', in: 'query', schema: { type: 'integer', default: 0 } },
          { name: 'includeNsfw', in: 'query', schema: { type: 'boolean', default: false } },
        ],
        true,
        X402_DISPLAY_PRICE_PUMP_FUN_MARKET_LIST_USD,
      ),
    },
    '/pumpfun/movers': {
      get: opGetCat(
        'pumpfun/movers',
        'pump.fun movers (x402)',
        'getPumpfunMovers',
        [
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'offset', in: 'query', schema: { type: 'integer', default: 0 } },
          { name: 'includeNsfw', in: 'query', schema: { type: 'boolean', default: false } },
        ],
        true,
        X402_DISPLAY_PRICE_PUMP_FUN_MARKET_LIST_USD,
      ),
    },
    '/pumpfun/analyzer': {
      get: {
        ...opGetCat(
          'pumpfun/analyzer',
          'pump.fun analyzer (x402)',
          'getPumpfunAnalyzer',
          [
            {
              name: 'mint',
              in: 'query',
              required: true,
              schema: { type: 'string' },
              description: 'Solana token mint (base58)',
            },
          ],
          true,
          X402_DISPLAY_PRICE_PUMP_FUN_ANALYZER_USD,
        ),
        responses: syraDataResponsesWithSchema(PUMPFUN_ANALYZER_DATA_SCHEMA),
      },
      post: {
        tags: ['pump.fun analyzer (x402)'],
        summary: `${getResourceSummary('pumpfun/analyzer')} (POST)`,
        description: getResourceDescription('pumpfun/analyzer'),
        operationId: 'postPumpfunAnalyzer',
        security: SECURITY_PAID,
        'x-payment-info': xPaymentInfo(X402_DISPLAY_PRICE_PUMP_FUN_ANALYZER_USD),
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['mint'],
                properties: {
                  mint: { type: 'string', description: 'Solana token mint (base58)' },
                },
              },
            },
          },
        },
        responses: syraDataResponsesWithSchema(PUMPFUN_ANALYZER_DATA_SCHEMA),
        'x-syra-pillar': getResourcePillar('pumpfun/analyzer'),
      },
    },
    '/pumpfun/scout': {
      get: opGetCat(
        'pumpfun/scout',
        'pump.fun scout (x402)',
        'getPumpfunScout',
        [
          { name: 'segment', in: 'query', schema: { type: 'string', default: 'alpha' } },
          { name: 'period', in: 'query', schema: { type: 'string', default: 'today' } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
          { name: 'minPumpScore', in: 'query', schema: { type: 'integer', default: 48 } },
          { name: 'llm', in: 'query', schema: { type: 'boolean', default: false } },
        ],
        true,
        X402_DISPLAY_PRICE_PUMP_FUN_SCOUT_USD,
      ),
    },
    '/rise': {
      get: opGetCat(
        'rise',
        'RISE scout (x402)',
        'getRiseScout',
        [
          { name: 'view', in: 'query', schema: { type: 'string', default: 'intel' } },
          { name: 'mint', in: 'query', schema: { type: 'string' } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 25 } },
          { name: 'tier', in: 'query', schema: { type: 'string' } },
        ],
        true,
        X402_DISPLAY_PRICE_RISE_SCOUT_USD,
      ),
    },
    '/coingecko': {
      get: opGetCat(
        'coingecko',
        'CoinGecko scout (x402)',
        'getCoingeckoScout',
        [
          { name: 'view', in: 'query', schema: { type: 'string', default: 'brief' } },
          { name: 'topN', in: 'query', schema: { type: 'integer', default: 8 } },
          { name: 'minMarketCap', in: 'query', schema: { type: 'integer', default: 1000000 } },
          { name: 'includeNews', in: 'query', schema: { type: 'boolean', default: true } },
          { name: 'llm', in: 'query', schema: { type: 'boolean', default: false } },
        ],
        true,
        X402_DISPLAY_PRICE_COINGECKO_SCOUT_USD,
      ),
    },
    '/dexscreener/pairs': {
      get: opGetCat(
        'dexscreener/pairs',
        'Onchain data (x402)',
        'getDexscreenerPairs',
        [
          { name: 'chainId', in: 'query', schema: { type: 'string' } },
          { name: 'tokenAddress', in: 'query', schema: { type: 'string' } },
          { name: 'q', in: 'query', schema: { type: 'string' } },
        ],
        true,
        X402_DISPLAY_PRICE_DEXSCREENER_PAIRS_USD,
      ),
    },
    '/geckoterminal/pools': {
      get: opGetCat(
        'geckoterminal/pools',
        'Onchain data (x402)',
        'getGeckoterminalPools',
        [
          { name: 'network', in: 'query', schema: { type: 'string', default: 'solana' } },
          { name: 'kind', in: 'query', schema: { type: 'string', default: 'trending', enum: ['trending', 'new'] } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        true,
        X402_DISPLAY_PRICE_GECKOTERMINAL_POOLS_USD,
      ),
    },
    '/defillama/tvl': {
      get: opGetCat(
        'defillama/tvl',
        'Onchain data (x402)',
        'getDefillamaTvl',
        [
          { name: 'protocol', in: 'query', schema: { type: 'string' } },
          { name: 'chain', in: 'query', schema: { type: 'string' } },
        ],
        true,
        X402_DISPLAY_PRICE_DEFILLAMA_TVL_USD,
      ),
    },
    '/rugcheck/report': {
      get: opGetCat(
        'rugcheck/report',
        'Onchain data (x402)',
        'getRugcheckReport',
        [{ name: 'mint', in: 'query', required: true, schema: { type: 'string' } }],
        true,
        X402_DISPLAY_PRICE_RUGCHECK_REPORT_USD,
      ),
    },
    '/pyth/price': {
      get: opGetCat(
        'pyth/price',
        'Onchain data (x402)',
        'getPythPrice',
        [{ name: 'symbols', in: 'query', required: true, schema: { type: 'string' } }],
        true,
        X402_DISPLAY_PRICE_PYTH_PRICE_USD,
      ),
    },
    '/insights/network-health': {
      get: opGetCat(
        'insights/network-health',
        'Insights (x402)',
        'getInsightsNetworkHealth',
        [],
        true,
        X402_DISPLAY_PRICE_INSIGHTS_NETWORK_HEALTH_USD,
      ),
    },
    '/insights/gas-oracle': {
      get: opGetCat(
        'insights/gas-oracle',
        'Insights (x402)',
        'getInsightsGasOracle',
        [],
        true,
        X402_DISPLAY_PRICE_INSIGHTS_GAS_ORACLE_USD,
      ),
    },
    '/insights/market-pulse': {
      get: opGetCat(
        'insights/market-pulse',
        'Insights (x402)',
        'getInsightsMarketPulse',
        [],
        true,
        X402_DISPLAY_PRICE_INSIGHTS_MARKET_PULSE_USD,
      ),
    },
    '/insights/token-metrics': {
      get: opGetCat(
        'insights/token-metrics',
        'Insights (x402)',
        'getInsightsTokenMetrics',
        [],
        true,
        X402_DISPLAY_PRICE_INSIGHTS_TOKEN_METRICS_USD,
      ),
    },
    '/insights/defi-tvl': {
      get: opGetCat(
        'insights/defi-tvl',
        'Insights (x402)',
        'getInsightsDefiTvl',
        [],
        true,
        X402_DISPLAY_PRICE_INSIGHTS_DEFI_TVL_USD,
      ),
    },
    '/insights/volatility-index': {
      get: opGetCat(
        'insights/volatility-index',
        'Insights (x402)',
        'getInsightsVolatilityIndex',
        [],
        true,
        X402_DISPLAY_PRICE_INSIGHTS_VOLATILITY_INDEX_USD,
      ),
    },
    '/assets': {
      get: opGetCat(
        'assets',
        'Assets board (x402)',
        'getAssetsBoard',
        [
          {
            name: 'list',
            in: 'query',
            schema: {
              type: 'string',
              default: 'all',
              enum: ['all', 'majors', 'lsts', 'currencies', 'rwas', 'etfs', 'metals', 'stocks'],
            },
          },
          { name: 'groupBy', in: 'query', schema: { type: 'string', default: 'asset', enum: ['asset', 'mint'] } },
          { name: 'assetClass', in: 'query', schema: { type: 'string', default: 'all', enum: ['all', 'crypto', 'equity'] } },
          { name: 'q', in: 'query', schema: { type: 'string' }, description: 'Search name, symbol, ref, or assetId' },
          {
            name: 'sort',
            in: 'query',
            schema: {
              type: 'string',
              default: 'marketCap',
              enum: ['marketCap', 'name', 'symbol', 'price', 'change24h', 'volume24h', 'assetClass'],
            },
          },
          { name: 'order', in: 'query', schema: { type: 'string', enum: ['asc', 'desc'] } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20, maximum: 100 } },
          { name: 'offset', in: 'query', schema: { type: 'integer', default: 0 } },
          { name: 'maxPages', in: 'query', schema: { type: 'integer', default: 20, maximum: 20 } },
        ],
        true,
        X402_DISPLAY_PRICE_ASSETS_BOARD_USD,
      ),
    },
    '/assets/detail': {
      get: {
        ...opGetCat(
          'assets/detail',
          'Asset detail (x402)',
          'getAssetsDetail',
          [
            {
              name: 'ref',
              in: 'query',
              required: true,
              schema: { type: 'string' },
              description: 'Canonical ref e.g. btc, solana, apple (alternatives: mint, assetId, q)',
            },
            { name: 'mint', in: 'query', schema: { type: 'string' }, description: 'Solana mint (base58)' },
            { name: 'assetId', in: 'query', schema: { type: 'string' }, description: 'assetId e.g. bitcoin' },
            {
              name: 'q',
              in: 'query',
              schema: { type: 'string' },
              description: 'Freeform lookup (ref, mint, or assetId)',
            },
          ],
          true,
          X402_DISPLAY_PRICE_ASSETS_DETAIL_USD,
        ),
        responses: syraDataResponsesWithSchema(ASSETS_DETAIL_DATA_SCHEMA),
      },
      post: {
        tags: ['Asset detail (x402)'],
        summary: `${getResourceSummary('assets/detail')} (POST)`,
        description: getResourceDescription('assets/detail'),
        operationId: 'postAssetsDetail',
        security: SECURITY_PAID,
        'x-payment-info': xPaymentInfo(X402_DISPLAY_PRICE_ASSETS_DETAIL_USD),
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['ref'],
                properties: {
                  ref: { type: 'string', description: 'Canonical ref e.g. btc, solana, apple' },
                  mint: { type: 'string', description: 'Solana mint (base58)' },
                  assetId: { type: 'string', description: 'Tokens.xyz assetId e.g. bitcoin' },
                  q: { type: 'string', description: 'Freeform lookup (ref, mint, or assetId)' },
                },
              },
            },
          },
        },
        responses: syraDataResponsesWithSchema(ASSETS_DETAIL_DATA_SCHEMA),
        'x-syra-pillar': getResourcePillar('assets/detail'),
      },
    },
    '/bitcoin': {
      get: opGetCat(
        'bitcoin',
        'Bitcoin Intelligence Hub (x402)',
        'getBitcoinHub',
        [
          { name: 'exchange', in: 'query', schema: { type: 'string', default: 'binance', enum: ['binance', 'coinbase'] } },
          {
            name: 'interval',
            in: 'query',
            schema: { type: 'string', default: '1h', enum: ['1m', '5m', '15m', '1h', '4h', '1d'] },
          },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 200, minimum: 20, maximum: 500 } },
        ],
        true,
        X402_DISPLAY_PRICE_BITCOIN_USD,
      ),
    },
    '/indicator': {
      get: opGetCat(
        'indicator',
        'Technical indicators (x402)',
        'getIndicator',
        [
          { name: 'symbol', in: 'query', schema: { type: 'string', default: 'BTCUSDT' } },
          { name: 'source', in: 'query', schema: { type: 'string', default: 'binance' } },
          { name: 'interval', in: 'query', schema: { type: 'string', default: '1h' } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 200 } },
          { name: 'series', in: 'query', schema: { type: 'boolean', default: false } },
          {
            name: 'indicators',
            in: 'query',
            schema: { type: 'string', default: 'rsi' },
            description: 'Comma-separated ids e.g. rsi,macd. Per-indicator params: rsi.period=21',
          },
        ],
        true,
        X402_DISPLAY_PRICE_INDICATOR_USD,
      ),
      post: {
        tags: ['Technical indicators (x402)'],
        summary: 'Technical indicators (POST, combinable)',
        description:
          'Same as GET /indicator with JSON body for complex multi-indicator requests.',
        operationId: 'postIndicator',
        security: SECURITY_PAID,
        'x-payment-info': xPaymentInfo(X402_DISPLAY_PRICE_INDICATOR_USD),
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  symbol: { type: 'string' },
                  source: { type: 'string' },
                  interval: { type: 'string' },
                  limit: { type: 'integer' },
                  series: { type: 'boolean' },
                  indicators: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: responsesFor(true),
      },
    },
  };

  const ownershipProofs = discoveryOwnershipProofs();

  /** @type {Record<string, unknown>} */
  const doc = {
    openapi: '3.1.0',
    info: {
      title: 'Syra API',
      version: '1.0.0',
      contact: { email: 'support@syraa.fun' },
      'x-guidance':
        'Free routes (security: []) include /info and /prediction-game/health. Paid routes return HTTP 402 until settled via x402 (Solana/Base USDC) — pay an offer from the 402 body accepts array and retry with PAYMENT-SIGNATURE or X-PAYMENT. Docs: https://docs.syraa.fun',
      description: [
        'Syra gateway: routes with `security: []` are free (no payment). Trading signals are at **GET/POST /signal** (x402).',
        '**x402** routes return **HTTP 402** until paid (Solana/Base USDC). The full payment offer (network, asset, price in micro-USDC, `payTo`, etc.) is returned at runtime in the 402 response body\'s `accepts` array and the `Payment-Required` header (x402 v2). Pay one offer and retry with `PAYMENT-SIGNATURE` or `X-PAYMENT`. See https://docs.syraa.fun/docs/api/x402-api-standard for the wire format and signing examples.',
        'Paid operations declare `x-payment-info` (catalog hint) and `security: [{ x402: [] }]`. The **MPP discovery** document at `GET /mpp-openapi.json` mirrors the full x402 catalog.',
        '**Rate limits** (per IP, applied to non-x402 / non-cron routes not listed as free in this spec): burst **25 req / 10s** + sustained **100 req / 60s**. Exceeding either returns **HTTP 429** with `Retry-After: <seconds>` and `{ success: false, message }`. x402 paid routes and openapi free routes bypass this throttle. See the `x-ratelimit` extension below.',
      ].join('\n\n'),
    },
    servers: [{ url: serverUrl }],
    'x-payment-info-spec': X_PAYMENT_INFO_SPEC,
    'x-ratelimit': RATE_LIMIT_INFO,
    paths,
    tags: [
      { name: 'Info', description: 'Public info' },
      { name: 'Prediction game', description: 'Prediction game API' },
      { name: 'Market data (x402)', description: 'Cryptonews-backed and signal engine; payment via x402' },
      { name: 'Gateway (x402)', description: 'Health and gateway checks' },
      { name: 'AI (x402)', description: 'Syra Brain Q&A' },
      {
        name: 'Social (x402)',
        description: 'X (Twitter) analysis — pay-per-call via x402',
      },
      {
        name: 'Equity (x402)',
        description: 'Tokenized equity intelligence — SPCX SpaceX IPO + xStocks catalog',
      },
      {
        name: 'Insights (x402)',
        description: 'On-chain intelligence — Solana network health, gas oracle, market pulse, TVL, volatility',
      },
    ],
    components: {
      securitySchemes: {
        x402: {
          type: 'apiKey',
          in: 'header',
          name: 'PAYMENT-SIGNATURE',
          description:
            'x402 v2 payment proof (also accepts X-PAYMENT header). Obtain by paying an offer from the HTTP 402 response.',
        },
        SyraApiKey: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
          description: 'Legacy internal routes only — openapi-listed free and x402 routes do not use this.',
        },
      },
    },
  };

  if (ownershipProofs.length > 0) {
    doc['x-discovery'] = { ownershipProofs };
  }

  // Tag every operation with its five-pillar classification
  for (const [openApiPath, methods] of Object.entries(paths)) {
    if (!methods || typeof methods !== 'object') continue;
    for (const method of Object.keys(methods)) {
      const op = methods[method];
      if (op && typeof op === 'object' && !op['x-syra-pillar']) {
        methods[method] = withPillarTag(/** @type {Record<string, unknown>} */ (op), openApiPath);
      }
    }
  }

  doc['x-syra-pillars'] = {
    narrative: 'Machine Money for Agents',
    pillars: ['earn', 'treasury', 'invest', 'spend', 'grow'],
    discovery: '/pillars',
  };

  return doc;
}
