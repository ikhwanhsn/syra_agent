/**
 * x402 paid route — GeckoTerminal trending/new pools.
 */
import express from 'express';
import { getV2Payment } from '../../utils/getV2Payment.js';
import { getResourceDescription } from '../../config/x402ResourceCatalog.js';
import { X402_API_PRICE_GECKOTERMINAL_POOLS_USD } from '../../config/x402Pricing.js';
import {
  fetchGeckoterminalPools,
  parseGeckoterminalPoolsRequest,
} from '../../libs/geckoterminalService.js';

const { requirePayment, settlePaymentAndSetResponse } = await getV2Payment();

const QUERY_SCHEMA = {
  network: {
    type: 'string',
    required: false,
    description: 'GeckoTerminal network slug (default solana)',
  },
  kind: {
    type: 'string',
    required: false,
    description: 'Pool list kind: trending | new (default trending)',
  },
  limit: {
    type: 'integer',
    required: false,
    description: 'Max pools to return (default 20, max 50)',
  },
};

const paymentOptionsBase = {
  price: X402_API_PRICE_GECKOTERMINAL_POOLS_USD,
  description: getResourceDescription('geckoterminal/pools'),
  discoverable: true,
  resource: '/geckoterminal/pools',
  outputSchema: {
    network: { type: 'string' },
    kind: { type: 'string' },
    pools: { type: 'array' },
    count: { type: 'integer' },
    computedAt: { type: 'string' },
  },
};

function attachParsedRequest(req, res, next) {
  try {
    req.geckoterminalPoolsParams = parseGeckoterminalPoolsRequest({
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

async function handlePools(req, res) {
  try {
    const data = await fetchGeckoterminalPools(req.geckoterminalPoolsParams);
    await settlePaymentAndSetResponse(res, req);
    res.json({ success: true, data });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(502).json({ success: false, error: msg });
  }
}

export async function createGeckoterminalPoolsRouter() {
  const router = express.Router();

  router.get(
    '/',
    requirePayment({
      ...paymentOptionsBase,
      method: 'GET',
      inputSchema: { queryParams: QUERY_SCHEMA },
    }),
    attachParsedRequest,
    handlePools,
  );

  router.post(
    '/',
    express.json(),
    requirePayment({
      ...paymentOptionsBase,
      method: 'POST',
      inputSchema: { bodyType: 'json', bodyFields: QUERY_SCHEMA },
    }),
    attachParsedRequest,
    handlePools,
  );

  return router;
}
