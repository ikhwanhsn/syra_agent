/**
 * Minimal OpenAPI 3.1 for the public non-x402 signal API only (GET/POST /api/signal).
 * Served at GET /openapi.json and written to repo-root openapi.json by the export script.
 */
import { SIGNAL_CEX_SOURCES } from './cexSignalAnalysis.js';

const DEFAULT_SERVER = 'https://api.syraa.fun';

const CEX_DOC = `${SIGNAL_CEX_SOURCES.join(', ')} (alias: crypto.com → cryptocom)`;

const QUERY_PARAMS = [
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
    description: `Data source. Default: binance (spot OHLC + engine). CEX: ${CEX_DOC}. Use n8n or webhook for legacy n8n webhook.`,
  },
  {
    name: 'instId',
    in: 'query',
    required: false,
    schema: { type: 'string' },
    description:
      'Venue symbol override, e.g. BTCUSDT, BTC-USDT (OKX), BTC-USD (Coinbase), XBTUSDT (Kraken).',
  },
  {
    name: 'bar',
    in: 'query',
    required: false,
    schema: { type: 'string' },
    description: 'Candle interval (venue-specific; e.g. 1m, 1h, 4h, 1d).',
  },
  {
    name: 'limit',
    in: 'query',
    required: false,
    schema: { type: 'string' },
    description: 'Number of candles (venue max varies; default 200).',
  },
];

const SIGNAL_RESPONSE = {
  description: 'Signal result',
  content: {
    'application/json': {
      schema: {
        type: 'object',
        required: ['success'],
        properties: {
          success: { type: 'boolean' },
          data: {
            type: 'object',
            properties: {
              signal: { type: 'object', additionalProperties: true },
            },
          },
          meta: {
            type: 'object',
            additionalProperties: true,
            properties: {
              token: { type: 'string' },
              source: { type: 'string' },
            },
          },
          error: { type: 'string' },
        },
        additionalProperties: true,
      },
    },
  },
};

/**
 * @returns {Record<string, unknown>}
 */
export function buildPublicSignalOpenApi() {
  const serverUrl = (process.env.SYRA_PUBLIC_API_URL || DEFAULT_SERVER).replace(/\/$/, '');

  return {
    openapi: '3.1.0',
    info: {
      title: 'Syra Public Signal API',
      version: '1.0.0',
      description:
        'Single endpoint: trading signal from CEX OHLC + Syra engine, or n8n webhook when configured. **No x402 payment.** When the server sets `API_KEY` or `API_KEYS`, send `X-API-Key`, `api-key`, or `Authorization: Bearer`. Docs: https://docs.syraa.fun',
    },
    servers: [{ url: serverUrl }],
    paths: {
      '/api/signal': {
        get: {
          tags: ['Signal'],
          summary: 'Get trading signal',
          operationId: 'getPublicSignal',
          parameters: QUERY_PARAMS,
          responses: {
            '200': SIGNAL_RESPONSE,
            '500': {
              description: 'Upstream or configuration error',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', const: false },
                      error: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
        post: {
          tags: ['Signal'],
          summary: 'Get trading signal (JSON body)',
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
            '200': SIGNAL_RESPONSE,
            '500': {
              description: 'Upstream or configuration error',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', const: false },
                      error: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    tags: [{ name: 'Signal', description: 'Non-x402 signal' }],
    components: {
      securitySchemes: {
        SyraApiKey: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
          description:
            'Optional at runtime unless the server sets API_KEY/API_KEYS. Also: `api-key` header or `Authorization: Bearer <token>`.',
        },
      },
    },
  };
}
