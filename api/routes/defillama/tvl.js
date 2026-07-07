/**
 * x402 paid route — DefiLlama protocol or chain TVL.
 */
import express from 'express';
import { getV2Payment } from '../../utils/getV2Payment.js';
import { getResourceDescription } from '../../config/x402ResourceCatalog.js';
import { X402_API_PRICE_DEFILLAMA_TVL_USD } from '../../config/x402Pricing.js';
import {
  fetchDefillamaTvl,
  parseDefillamaTvlRequest,
} from '../../libs/defillamaService.js';

const { requirePayment, settlePaymentAndSetResponse } = await getV2Payment();

const QUERY_SCHEMA = {
  protocol: {
    type: 'string',
    required: false,
    description: 'DefiLlama protocol slug (e.g. aave, uniswap) — alternative to chain',
  },
  chain: {
    type: 'string',
    required: false,
    description: 'Blockchain name (e.g. Solana, Ethereum) — alternative to protocol',
  },
};

const paymentOptionsBase = {
  price: X402_API_PRICE_DEFILLAMA_TVL_USD,
  description: getResourceDescription('defillama/tvl'),
  discoverable: true,
  resource: '/defillama/tvl',
  outputSchema: {
    mode: { type: 'string' },
    currentTvlUsd: { type: 'number' },
    name: { type: 'string' },
    computedAt: { type: 'string' },
  },
};

function attachParsedRequest(req, res, next) {
  try {
    req.defillamaTvlParams = parseDefillamaTvlRequest({
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

async function handleTvl(req, res) {
  try {
    const data = await fetchDefillamaTvl(req.defillamaTvlParams);
    await settlePaymentAndSetResponse(res, req);
    res.json({ success: true, data });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const status = /provide|not found/i.test(msg) ? 400 : 502;
    res.status(status).json({ success: false, error: msg });
  }
}

export async function createDefillamaTvlRouter() {
  const router = express.Router();

  router.get(
    '/',
    requirePayment({
      ...paymentOptionsBase,
      method: 'GET',
      inputSchema: { queryParams: QUERY_SCHEMA },
    }),
    attachParsedRequest,
    handleTvl,
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
    handleTvl,
  );

  return router;
}
