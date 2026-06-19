/**
 * x402 paid route — CoinGecko scout (brief, gainers, predictions views).
 */
import express from 'express';
import { getV2Payment } from '../utils/getV2Payment.js';
import { getResourceDescription } from '../config/x402ResourceCatalog.js';
import { X402_API_PRICE_COINGECKO_SCOUT_USD } from '../config/x402Pricing.js';
import { getCoingeckoScout, parseCoingeckoScoutParams } from '../libs/coingeckoScoutService.js';

const { requirePayment, settlePaymentAndSetResponse } = await getV2Payment();

const COINGECKO_QUERY_SCHEMA = {
  view: {
    type: 'string',
    required: false,
    description: 'View selector: brief | gainers | predictions (default brief)',
  },
  topN: {
    type: 'integer',
    required: false,
    description: 'Number of top gainers to analyze (default 8, max 25)',
  },
  minMarketCap: {
    type: 'integer',
    required: false,
    description: 'Minimum market cap USD filter (default 1000000)',
  },
  includeNews: {
    type: 'boolean',
    required: false,
    description: 'Include news/X bundles (default true)',
  },
  llm: {
    type: 'boolean',
    required: false,
    description: 'Enable optional LLM narrative enrichment (default false)',
  },
};

const paymentOptionsBase = {
  price: X402_API_PRICE_COINGECKO_SCOUT_USD,
  description: getResourceDescription('coingecko'),
  discoverable: true,
  resource: '/coingecko',
  outputSchema: {
    view: { type: 'string' },
    date: { type: 'string' },
    topGainer: { type: 'object' },
    topGainers: { type: 'array' },
    dailyDigests: { type: 'array' },
    predictions: { type: 'array' },
    meta: { type: 'object' },
    computedAt: { type: 'string' },
  },
};

function attachParsedRequest(req, res, next) {
  try {
    req.coingeckoScoutParams = parseCoingeckoScoutParams({
      method: req.method,
      query: req.query,
      body: req.body,
    });
    next();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(400).json({ success: false, error: msg });
  }
}

async function handleCoingecko(req, res) {
  try {
    const data = await getCoingeckoScout(req.coingeckoScoutParams);
    await settlePaymentAndSetResponse(res, req);
    res.json({ success: true, data });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(502).json({ success: false, error: msg });
  }
}

export function createCoingeckoScoutRouter() {
  const router = express.Router();

  router.get(
    '/',
    attachParsedRequest,
    requirePayment({
      ...paymentOptionsBase,
      method: 'GET',
      inputSchema: { queryParams: COINGECKO_QUERY_SCHEMA },
    }),
    handleCoingecko,
  );

  router.post(
    '/',
    express.json(),
    attachParsedRequest,
    requirePayment({
      ...paymentOptionsBase,
      method: 'POST',
      inputSchema: {
        bodyType: 'json',
        bodyFields: COINGECKO_QUERY_SCHEMA,
      },
    }),
    handleCoingecko,
  );

  return router;
}
