/**
 * x402 paid route — Bitcoin Intelligence Hub (full /btc page payload).
 */
import express from 'express';
import { getV2Payment } from '../../utils/getV2Payment.js';
import { getResourceDescription } from '../../config/x402ResourceCatalog.js';
import { X402_API_PRICE_BITCOIN_USD } from '../../config/x402Pricing.js';
import { BTC_VALID_INTERVALS } from '../../libs/btcIntelligenceService.js';
import { fetchBitcoinX402, parseBitcoinX402Request } from '../../libs/bitcoinX402Service.js';

const { requirePayment, settlePaymentAndSetResponse } = await getV2Payment();

const inputFields = {
  exchange: {
    type: 'string',
    required: false,
    description: 'Bubblemap exchange: binance | coinbase (default binance)',
  },
  interval: {
    type: 'string',
    required: false,
    description: `Bubblemap candle interval (default 1h). One of: ${BTC_VALID_INTERVALS.join(', ')}`,
  },
  limit: {
    type: 'integer',
    required: false,
    description: 'Bubblemap point limit (default 200, min 20, max 500)',
  },
};

const paymentOptionsBase = {
  price: X402_API_PRICE_BITCOIN_USD,
  description: getResourceDescription('bitcoin'),
  discoverable: true,
  resource: '/bitcoin',
  outputSchema: {
    dashboard: {
      type: 'object',
      description: 'Overview + sections (same as GET /btc/dashboard)',
    },
    bubblemap: {
      type: 'object',
      description: 'Taker buy/sell ratio bubble chart series (same as GET /btc/bubblemap)',
    },
    bubblemapParams: { type: 'object' },
    sources: { type: 'object', description: 'snapshot vs live compute per section' },
    computedAt: { type: 'string' },
  },
};

function attachParsedRequest(req, res, next) {
  try {
    req.bitcoinX402Params = parseBitcoinX402Request({
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

async function handleBitcoin(req, res) {
  try {
    const data = await fetchBitcoinX402(req.bitcoinX402Params);
    await settlePaymentAndSetResponse(res, req);
    res.json({ success: true, data });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const status =
      err && typeof err === 'object' && 'status' in err && Number.isFinite(err.status)
        ? err.status
        : /must be|required/i.test(msg)
          ? 400
          : 502;
    res.status(status).json({ success: false, error: msg });
  }
}

export async function createBitcoinX402Router() {
  const router = express.Router();

  router.get(
    '/',
    attachParsedRequest,
    requirePayment({
      ...paymentOptionsBase,
      method: 'GET',
      inputSchema: { queryParams: inputFields },
    }),
    handleBitcoin,
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
        bodyFields: inputFields,
      },
    }),
    handleBitcoin,
  );

  return router;
}
