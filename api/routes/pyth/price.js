/**
 * x402 paid route — Pyth Hermes oracle prices.
 */
import express from 'express';
import { getV2Payment } from '../../utils/getV2Payment.js';
import { getResourceDescription } from '../../config/x402ResourceCatalog.js';
import { X402_API_PRICE_PYTH_PRICE_USD } from '../../config/x402Pricing.js';
import {
  fetchPythPrices,
  parsePythPriceRequest,
} from '../../libs/pythHermesService.js';

const { requirePayment, settlePaymentAndSetResponse } = await getV2Payment();

const SYMBOLS_PARAM = {
  type: 'string',
  required: true,
  description: 'Comma-separated Pyth symbols (e.g. BTC/USD,SOL/USD) or feed ids',
};

const paymentOptionsBase = {
  price: X402_API_PRICE_PYTH_PRICE_USD,
  description: getResourceDescription('pyth/price'),
  discoverable: true,
  resource: '/pyth/price',
  outputSchema: {
    prices: { type: 'array' },
    count: { type: 'integer' },
    computedAt: { type: 'string' },
  },
};

function attachParsedRequest(req, res, next) {
  try {
    req.pythPriceParams = parsePythPriceRequest({
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

async function handlePrice(req, res) {
  try {
    const data = await fetchPythPrices(req.pythPriceParams);
    await settlePaymentAndSetResponse(res, req);
    res.json({ success: true, data });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const status = /required|unknown|max/i.test(msg) ? 400 : 502;
    res.status(status).json({ success: false, error: msg });
  }
}

export async function createPythPriceRouter() {
  const router = express.Router();

  router.get(
    '/',
    requirePayment({
      ...paymentOptionsBase,
      method: 'GET',
      inputSchema: { queryParams: { symbols: SYMBOLS_PARAM } },
    }),
    attachParsedRequest,
    handlePrice,
  );

  router.post(
    '/',
    express.json(),
    requirePayment({
      ...paymentOptionsBase,
      method: 'POST',
      inputSchema: { bodyType: 'json', bodyFields: { symbols: SYMBOLS_PARAM } },
    }),
    attachParsedRequest,
    handlePrice,
  );

  return router;
}
