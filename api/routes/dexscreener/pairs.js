/**
 * x402 paid route — DexScreener token pairs / search.
 */
import express from 'express';
import { getV2Payment } from '../../utils/getV2Payment.js';
import { getResourceDescription } from '../../config/x402ResourceCatalog.js';
import { X402_API_PRICE_DEXSCREENER_PAIRS_USD } from '../../config/x402Pricing.js';
import {
  fetchDexscreenerPairs,
  parseDexscreenerPairsRequest,
} from '../../libs/dexscreenerService.js';

const { requirePayment, settlePaymentAndSetResponse } = await getV2Payment();

const QUERY_SCHEMA = {
  chainId: {
    type: 'string',
    required: false,
    description: 'Chain id (e.g. solana, base, ethereum) — required with tokenAddress',
  },
  tokenAddress: {
    type: 'string',
    required: false,
    description: 'Token contract/mint address — required with chainId',
  },
  q: {
    type: 'string',
    required: false,
    description: 'Search query (alternative to chainId + tokenAddress)',
  },
};

const paymentOptionsBase = {
  price: X402_API_PRICE_DEXSCREENER_PAIRS_USD,
  description: getResourceDescription('dexscreener/pairs'),
  discoverable: true,
  resource: '/dexscreener/pairs',
  outputSchema: {
    mode: { type: 'string' },
    pairs: { type: 'array' },
    count: { type: 'integer' },
    computedAt: { type: 'string' },
  },
};

function attachParsedRequest(req, res, next) {
  try {
    req.dexscreenerPairsParams = parseDexscreenerPairsRequest({
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

async function handlePairs(req, res) {
  try {
    const data = await fetchDexscreenerPairs(req.dexscreenerPairsParams);
    await settlePaymentAndSetResponse(res, req);
    res.json({ success: true, data });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const status = /required|provide/i.test(msg) ? 400 : 502;
    res.status(status).json({ success: false, error: msg });
  }
}

export async function createDexscreenerPairsRouter() {
  const router = express.Router();

  router.get(
    '/',
    requirePayment({
      ...paymentOptionsBase,
      method: 'GET',
      inputSchema: { queryParams: QUERY_SCHEMA },
    }),
    attachParsedRequest,
    handlePairs,
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
    handlePairs,
  );

  return router;
}
