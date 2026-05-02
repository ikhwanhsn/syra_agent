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
  };

  return {
    openapi: '3.1.0',
    info: {
      title: 'Syra API',
      version: '1.0.0',
      description: [
        'Syra gateway: preview and dashboard routes may require `X-API-Key` / Bearer when the server sets `API_KEY`.',
        '**x402** routes return **HTTP 402** until paid (Solana/Base USDC); no `x-payment-info` in this spec — see https://docs.syraa.fun.',
        'Paid catalog with full discovery: `GET /mpp-openapi.json`.',
      ].join('\n\n'),
    },
    servers: [{ url: serverUrl }],
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
