/**
 * x402 paid /insights/* routes — professional on-chain data endpoints for x402 Labs.
 * Payments route to the lab payTo wallet when configured (buyback skipped via payToOverride).
 * Listed in GET /.well-known/x402 for x402scan discovery.
 */
import express from 'express';
import { getV2Payment } from '../../utils/getV2Payment.js';
import { getResourceDescription } from '../../config/x402ResourceCatalog.js';
import { getActivePayToAddress } from '../../libs/labs/labWalletService.js';
import { refundUsdcToPayer } from '../../libs/labs/labX402Refund.js';
import { getLabX402Settings } from '../../libs/labs/labX402Payer.js';
import {
  isActiveLabPayer,
  logLabX402Call,
} from '../../libs/labs/labX402CallLog.js';
import { runAfterResponse } from '../../utils/x402PaymentV2.js';
import {
  fetchNetworkHealthInsight,
  fetchGasOracleInsight,
  fetchMarketPulseInsight,
  fetchTokenMetricsInsight,
  fetchDefiTvlInsight,
  fetchVolatilityIndexInsight,
} from '../../libs/labs/insightsDataService.js';

const { requirePayment, settlePaymentAndSetResponse } = await getV2Payment();

async function labsPayToOverride() {
  const addr = await getActivePayToAddress();
  if (!addr) return null;
  return { solanaPayTo: addr };
}

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {string} endpointPath
 * @param {string} catalogSegment
 * @param {() => Promise<object>} fetchData
 */
async function handleInsightRoute(req, res, endpointPath, catalogSegment, fetchData) {
  try {
    const data = await fetchData();
    const settle = await settlePaymentAndSetResponse(res, req);
    if (settle?.success === false) {
      return res.status(502).json({
        success: false,
        error: settle.errorReason || settle.error || 'Payment settlement failed',
      });
    }

    const payer = typeof settle?.payer === 'string' ? settle.payer.trim() : '';
    const priceUsd = req.x402Payment?.priceUsd ?? 0;
    const paymentTx = typeof settle?.transaction === 'string' ? settle.transaction : null;
    const trigger = req.get('x-lab-x402-trigger') === 'scheduler' ? 'scheduler' : 'manual';

    runAfterResponse(async () => {
      if (!payer) return;
      const labPayer = await isActiveLabPayer(payer);
      if (!labPayer) return;

      const payToAddr = await getActivePayToAddress();
      if (!payToAddr) return;

      try {
        const settings = await getLabX402Settings();
        if (!settings.refundEnabled || priceUsd <= 0) {
          await logLabX402Call({
            payerAddress: payer,
            endpoint: endpointPath,
            priceUsd,
            status: 'refund_skipped',
            paymentTx,
            trigger,
          });
          return;
        }
        const refund = await refundUsdcToPayer(payer, priceUsd);
        await logLabX402Call({
          payerAddress: payer,
          endpoint: endpointPath,
          priceUsd,
          status: 'success',
          paymentTx,
          refundTx: refund?.signature ?? null,
          trigger,
        });
      } catch (e) {
        console.warn('[insights] refund failed:', e?.message || e);
        await logLabX402Call({
          payerAddress: payer,
          endpoint: endpointPath,
          priceUsd,
          status: 'refund_failed',
          paymentTx,
          error: e?.message || String(e),
          trigger,
        }).catch(() => {});
      }
    });

    return res.json({ success: true, data });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const status = /not configured|required/i.test(msg) ? 400 : 502;
    return res.status(status).json({ success: false, error: msg });
  }
}

function labsPaymentMiddleware(priceUsd, resource, catalogSegment) {
  return requirePayment({
    price: priceUsd,
    description: getResourceDescription(catalogSegment),
    resource,
    discoverable: true,
    method: 'GET',
    getPayTo: labsPayToOverride,
  });
}

export async function createInsightsRouter() {
  const router = express.Router();

  router.get(
    '/network-health',
    labsPaymentMiddleware(0.01, '/insights/network-health', 'insights/network-health'),
    (req, res) =>
      handleInsightRoute(
        req,
        res,
        '/insights/network-health',
        'insights/network-health',
        fetchNetworkHealthInsight,
      ),
  );

  router.get(
    '/gas-oracle',
    labsPaymentMiddleware(0.01, '/insights/gas-oracle', 'insights/gas-oracle'),
    (req, res) =>
      handleInsightRoute(req, res, '/insights/gas-oracle', 'insights/gas-oracle', fetchGasOracleInsight),
  );

  router.get(
    '/market-pulse',
    labsPaymentMiddleware(0.02, '/insights/market-pulse', 'insights/market-pulse'),
    (req, res) =>
      handleInsightRoute(
        req,
        res,
        '/insights/market-pulse',
        'insights/market-pulse',
        fetchMarketPulseInsight,
      ),
  );

  router.get(
    '/token-metrics',
    labsPaymentMiddleware(0.03, '/insights/token-metrics', 'insights/token-metrics'),
    (req, res) =>
      handleInsightRoute(
        req,
        res,
        '/insights/token-metrics',
        'insights/token-metrics',
        fetchTokenMetricsInsight,
      ),
  );

  router.get(
    '/defi-tvl',
    labsPaymentMiddleware(0.05, '/insights/defi-tvl', 'insights/defi-tvl'),
    (req, res) =>
      handleInsightRoute(req, res, '/insights/defi-tvl', 'insights/defi-tvl', fetchDefiTvlInsight),
  );

  router.get(
    '/volatility-index',
    labsPaymentMiddleware(0.1, '/insights/volatility-index', 'insights/volatility-index'),
    (req, res) =>
      handleInsightRoute(
        req,
        res,
        '/insights/volatility-index',
        'insights/volatility-index',
        fetchVolatilityIndexInsight,
      ),
  );

  return router;
}
