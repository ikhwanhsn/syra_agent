/**
 * x402 paid route — RISE scout (intel, markets, targets views).
 */
import express from 'express';
import { getV2Payment } from '../utils/getV2Payment.js';
import { getResourceDescription } from '../config/x402ResourceCatalog.js';
import { X402_API_PRICE_RISE_SCOUT_USD } from '../config/x402Pricing.js';
import { getRiseScout, parseRiseScoutParams } from '../libs/riseScoutService.js';

const { requirePayment, settlePaymentAndSetResponse } = await getV2Payment();

const RISE_QUERY_SCHEMA = {
  view: {
    type: 'string',
    required: false,
    description: 'View selector: intel | markets | targets (default intel)',
  },
  mint: {
    type: 'string',
    required: false,
    description: 'Optional single RISE market mint for focused intel',
  },
  limit: {
    type: 'integer',
    required: false,
    description: 'Max markets/targets to return (default 25, max 100)',
  },
  tier: {
    type: 'string',
    required: false,
    description: 'Agent tier filter for targets: ready | watch',
  },
};

const paymentOptionsBase = {
  price: X402_API_PRICE_RISE_SCOUT_USD,
  description: getResourceDescription('rise'),
  discoverable: true,
  resource: '/rise',
  outputSchema: {
    view: { type: 'string' },
    nowMs: { type: 'integer' },
    token: { type: 'object', description: 'UPONLY token snapshot (intel view)' },
    rise: { type: 'object', description: 'Fund lens metrics (intel view)' },
    riseAlphaMintTargets: { type: 'array' },
    markets: { type: 'array' },
    targets: { type: 'array' },
    marketCount: { type: 'integer' },
    computedAt: { type: 'string' },
  },
};

function attachParsedRequest(req, res, next) {
  try {
    req.riseScoutParams = parseRiseScoutParams({
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

async function handleRise(req, res) {
  try {
    const data = await getRiseScout(req.riseScoutParams);
    await settlePaymentAndSetResponse(res, req);
    res.json({ success: true, data });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const status = /not found|invalid/i.test(msg) ? 404 : 502;
    res.status(status).json({ success: false, error: msg });
  }
}

export function createRiseScoutRouter() {
  const router = express.Router();

  router.get(
    '/',
    attachParsedRequest,
    requirePayment({
      ...paymentOptionsBase,
      method: 'GET',
      inputSchema: { queryParams: RISE_QUERY_SCHEMA },
    }),
    handleRise,
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
        bodyFields: RISE_QUERY_SCHEMA,
      },
    }),
    handleRise,
  );

  return router;
}
