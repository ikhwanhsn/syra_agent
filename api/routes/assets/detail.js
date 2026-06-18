/**
 * x402 paid route — Tokens.xyz asset detail / mint dossier.
 */
import express from 'express';
import { getV2Payment } from '../../utils/getV2Payment.js';
import { getResourceDescription } from '../../config/x402ResourceCatalog.js';
import { X402_API_PRICE_ASSETS_DETAIL_USD } from '../../config/x402Pricing.js';
import {
  fetchAssetsDetailX402,
  parseAssetsDetailX402Request,
} from '../../libs/assetsDetailX402Service.js';

const { requirePayment, settlePaymentAndSetResponse } = await getV2Payment();

const LOOKUP_PARAM = {
  type: 'string',
  required: false,
  description: 'Asset ref (btc, solana, apple), Solana mint, solana-<mint> assetId, or freeform q',
};

const inputFields = {
  ref: {
    type: 'string',
    required: false,
    description: 'Canonical ref e.g. btc, solana, apple',
  },
  mint: {
    type: 'string',
    required: false,
    description: 'Solana mint address (base58)',
  },
  assetId: {
    type: 'string',
    required: false,
    description: 'Tokens.xyz assetId e.g. bitcoin or solana-<mint>',
  },
  q: LOOKUP_PARAM,
};

const paymentOptionsBase = {
  price: X402_API_PRICE_ASSETS_DETAIL_USD,
  description: getResourceDescription('assets/detail'),
  discoverable: true,
  resource: '/assets/detail',
  outputSchema: {
    query: { type: 'object', description: 'Resolved lookup keys' },
    assetId: { type: 'string' },
    chartMint: { type: 'string', description: 'Mint used for chart and risk' },
    asset: { type: 'object', description: 'Canonical asset profile and stats' },
    includes: { type: 'object', description: 'profile, risk, markets includes' },
    ohlcv: { type: 'object', description: '1H OHLCV candles' },
    mintRisk: { type: 'object', description: 'Solana mint risk summary when applicable' },
    fetchedAt: { type: 'string' },
  },
};

function attachParsedRequest(req, res, next) {
  try {
    req.assetsDetailX402Params = parseAssetsDetailX402Request({
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

async function handleAssetsDetail(req, res) {
  try {
    const data = await fetchAssetsDetailX402(req.assetsDetailX402Params);
    await settlePaymentAndSetResponse(res, req);
    res.json({ success: true, data });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const status =
      err && typeof err === 'object' && 'status' in err && Number.isFinite(err.status)
        ? err.status
        : /must be|required|provide/i.test(msg)
          ? 400
          : 502;
    res.status(status).json({
      success: false,
      error: msg,
      ...(err && typeof err === 'object' && err.requestId && { requestId: err.requestId }),
    });
  }
}

export async function createAssetsDetailX402Router() {
  const router = express.Router();

  router.get(
    '/',
    attachParsedRequest,
    requirePayment({
      ...paymentOptionsBase,
      method: 'GET',
      inputSchema: { queryParams: inputFields },
    }),
    handleAssetsDetail,
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
    handleAssetsDetail,
  );

  return router;
}
