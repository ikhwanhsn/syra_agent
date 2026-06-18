/**
 * x402 paid route — pump.fun memecoin analyzer (Pumpfun Alpha page).
 */
import express from 'express';
import { getV2Payment } from '../../utils/getV2Payment.js';
import { getResourceDescription } from '../../config/x402ResourceCatalog.js';
import { X402_API_PRICE_PUMP_FUN_ANALYZER_USD } from '../../config/x402Pricing.js';
import {
  fetchPumpfunAnalyzerX402,
  parsePumpfunAnalyzerX402Request,
} from '../../libs/pumpfunAnalyzerX402Service.js';

const { requirePayment, settlePaymentAndSetResponse } = await getV2Payment();

const MINT_PARAM = {
  type: 'string',
  required: true,
  description: 'Solana token mint (base58) — pump.fun or graduated token',
};

const paymentOptionsBase = {
  price: X402_API_PRICE_PUMP_FUN_ANALYZER_USD,
  description: getResourceDescription('pumpfun/analyzer'),
  discoverable: true,
  resource: '/pumpfun/analyzer',
  outputSchema: {
    mint: { type: 'string' },
    syraAlpha: { type: 'object', description: 'Composite score, verdict, and factor breakdown' },
    market: { type: 'object', description: 'Merged price, liquidity, volume, and DEX pair stats' },
    dossier: { type: 'object', description: 'Tokens.xyz dossier section' },
    pumpfun: { type: 'object', description: 'pump.fun coins-v2 profile' },
    holders: { type: 'object', description: 'On-chain top holders' },
    distribution: { type: 'object', description: 'Holder concentration and decentralization' },
    onChainSecurity: { type: 'object', description: 'Mint/freeze authority status' },
    kolShills: { type: 'object', description: 'KOL mentions on X' },
    fetchedAt: { type: 'string' },
  },
};

function attachParsedRequest(req, res, next) {
  try {
    req.pumpfunAnalyzerParams = parsePumpfunAnalyzerX402Request({
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

async function handleAnalyzer(req, res) {
  try {
    const data = await fetchPumpfunAnalyzerX402(req.pumpfunAnalyzerParams);
    await settlePaymentAndSetResponse(res, req);
    res.json({ success: true, data });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const status =
      err && typeof err === 'object' && 'status' in err && Number.isFinite(err.status)
        ? err.status
        : /must be|required|provide|valid solana/i.test(msg)
          ? 400
          : 502;
    res.status(status).json({
      success: false,
      error: msg,
      ...(err && typeof err === 'object' && err.partial && { partial: err.partial }),
    });
  }
}

export function createPumpfunAnalyzerRouter() {
  const router = express.Router();

  router.get(
    '/',
    attachParsedRequest,
    requirePayment({
      ...paymentOptionsBase,
      method: 'GET',
      inputSchema: { queryParams: { mint: MINT_PARAM } },
    }),
    handleAnalyzer,
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
        bodyFields: { mint: MINT_PARAM },
      },
    }),
    handleAnalyzer,
  );

  return router;
}
