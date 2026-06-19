/**
 * x402 paid route — pump.fun scout (alpha, beta, predicted, utility segments).
 */
import express from 'express';
import { getV2Payment } from '../../utils/getV2Payment.js';
import { getResourceDescription } from '../../config/x402ResourceCatalog.js';
import { X402_API_PRICE_PUMP_FUN_SCOUT_USD } from '../../config/x402Pricing.js';
import {
  getPumpfunScout,
  parsePumpfunScoutParams,
} from '../../libs/pumpfunScoutService.js';

const { requirePayment, settlePaymentAndSetResponse } = await getV2Payment();

const SCOUT_QUERY_SCHEMA = {
  segment: {
    type: 'string',
    required: false,
    description: 'Data segment: alpha | beta | predicted | utility (default alpha)',
  },
  period: {
    type: 'string',
    required: false,
    description: 'Time window: today | week | month (default today)',
  },
  limit: {
    type: 'integer',
    required: false,
    description: 'Max items to return (default 10, max 50)',
  },
  minPumpScore: {
    type: 'integer',
    required: false,
    description: 'Minimum pump score filter (default 48, max 100)',
  },
  llm: {
    type: 'boolean',
    required: false,
    description: 'Enable optional LLM narrative enrichment (default false)',
  },
};

const paymentOptionsBase = {
  price: X402_API_PRICE_PUMP_FUN_SCOUT_USD,
  description: getResourceDescription('pumpfun/scout'),
  discoverable: true,
  resource: '/pumpfun/scout',
  outputSchema: {
    segment: { type: 'string' },
    period: { type: 'string' },
    nowMs: { type: 'integer' },
    candidatePool: { type: 'integer' },
    items: { type: 'array', description: 'Alpha or beta token rows' },
    predictedAlphas: { type: 'array', description: 'Predicted segment only' },
    utilityPicks: { type: 'array', description: 'Utility segment only' },
    analysis: { type: 'object' },
    meta: { type: 'object' },
    computedAt: { type: 'string' },
  },
};

function attachParsedRequest(req, res, next) {
  try {
    req.pumpfunScoutParams = parsePumpfunScoutParams({
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

async function handleScout(req, res) {
  try {
    const data = await getPumpfunScout(req.pumpfunScoutParams);
    await settlePaymentAndSetResponse(res, req);
    res.json({ success: true, data });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(/must be|required|invalid/i.test(msg) ? 400 : 502).json({
      success: false,
      error: msg,
    });
  }
}

export function createPumpfunScoutRouter() {
  const router = express.Router();

  router.get(
    '/',
    attachParsedRequest,
    requirePayment({
      ...paymentOptionsBase,
      method: 'GET',
      inputSchema: { queryParams: SCOUT_QUERY_SCHEMA },
    }),
    handleScout,
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
        bodyFields: SCOUT_QUERY_SCHEMA,
      },
    }),
    handleScout,
  );

  return router;
}
