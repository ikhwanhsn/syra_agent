/**
 * x402 paid route — RugCheck Solana token risk report.
 */
import express from 'express';
import { getV2Payment } from '../../utils/getV2Payment.js';
import { getResourceDescription } from '../../config/x402ResourceCatalog.js';
import { X402_API_PRICE_RUGCHECK_REPORT_USD } from '../../config/x402Pricing.js';
import {
  fetchRugcheckReport,
  parseRugcheckReportRequest,
} from '../../libs/rugcheckService.js';

const { requirePayment, settlePaymentAndSetResponse } = await getV2Payment();

const MINT_PARAM = {
  type: 'string',
  required: true,
  description: 'Solana token mint (base58)',
};

const paymentOptionsBase = {
  price: X402_API_PRICE_RUGCHECK_REPORT_USD,
  description: getResourceDescription('rugcheck/report'),
  discoverable: true,
  resource: '/rugcheck/report',
  outputSchema: {
    mint: { type: 'string' },
    riskScore: { type: 'number' },
    risks: { type: 'array' },
    topHolders: { type: 'array' },
    mintAuthority: { type: 'object' },
    freezeAuthority: { type: 'object' },
    computedAt: { type: 'string' },
  },
};

function attachParsedRequest(req, res, next) {
  try {
    req.rugcheckReportParams = parseRugcheckReportRequest({
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

async function handleReport(req, res) {
  try {
    const data = await fetchRugcheckReport(req.rugcheckReportParams);
    await settlePaymentAndSetResponse(res, req);
    res.json({ success: true, data });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const status = /required|valid|not found/i.test(msg) ? 400 : 502;
    res.status(status).json({ success: false, error: msg });
  }
}

export async function createRugcheckReportRouter() {
  const router = express.Router();

  router.get(
    '/',
    requirePayment({
      ...paymentOptionsBase,
      method: 'GET',
      inputSchema: { queryParams: { mint: MINT_PARAM } },
    }),
    attachParsedRequest,
    handleReport,
  );

  router.post(
    '/',
    express.json(),
    requirePayment({
      ...paymentOptionsBase,
      method: 'POST',
      inputSchema: { bodyType: 'json', bodyFields: { mint: MINT_PARAM } },
    }),
    attachParsedRequest,
    handleReport,
  );

  return router;
}
