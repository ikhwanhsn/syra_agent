/**
 * x402 paid /insights/* routes — professional on-chain data endpoints for x402 Labs.
 * Payments route to the lab payTo wallet when configured (buyback skipped via payToOverride).
 * Verify/settle uses the Dexter facilitator (https://x402.dexter.cash); other Syra routes stay on PayAI.
 * Listed in GET /.well-known/x402 for x402scan discovery.
 */
import express from 'express';
import { getV2Payment } from '../../utils/getV2Payment.js';
import { getResourceDescription } from '../../config/x402ResourceCatalog.js';
import {
  X402_API_PRICE_INSIGHTS_NETWORK_HEALTH_USD,
  X402_API_PRICE_INSIGHTS_GAS_ORACLE_USD,
  X402_API_PRICE_INSIGHTS_MARKET_PULSE_USD,
  X402_API_PRICE_INSIGHTS_TOKEN_METRICS_USD,
  X402_API_PRICE_INSIGHTS_DEFI_TVL_USD,
  X402_API_PRICE_INSIGHTS_VOLATILITY_INDEX_USD,
} from '../../config/x402Pricing.js';
import { getActivePayToAddress, getLabWalletBalances } from '../../libs/labs/labWalletService.js';
import {
  evaluateLowBalanceRefund,
  refundUsdcToPayer,
} from '../../libs/labs/labX402Refund.js';
import {
  getMaxLabX402PriceUsd,
  getWeightedAvgLabX402PriceUsd,
} from '../../libs/labs/labX402Endpoints.js';
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

        const balances = await getLabWalletBalances(payer);
        const maxPriceUsd = getMaxLabX402PriceUsd();
        const avgPriceUsd = getWeightedAvgLabX402PriceUsd();
        const decision = evaluateLowBalanceRefund(balances?.usdcBalance ?? 0, maxPriceUsd, avgPriceUsd);

        if (!decision.shouldRefund) {
          await logLabX402Call({
            payerAddress: payer,
            endpoint: endpointPath,
            priceUsd,
            status: 'refund_skipped',
            paymentTx,
            responseSnippet: `balance_ok:${(balances?.usdcBalance ?? 0).toFixed(4)}>=${decision.thresholdUsd}`,
            trigger,
          });
          return;
        }

        const refund = await refundUsdcToPayer(payer, decision.refundAmountUsd);
        await logLabX402Call({
          payerAddress: payer,
          endpoint: endpointPath,
          priceUsd,
          status: 'success',
          paymentTx,
          refundTx: refund?.signature ?? null,
          responseSnippet: `topup:${decision.refundAmountUsd.toFixed(4)}→${decision.targetUsd}`,
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

function labsPaymentMiddleware(priceUsd, resource, catalogSegment, outputSchema = {}) {
  return requirePayment({
    price: priceUsd,
    description: getResourceDescription(catalogSegment),
    resource,
    discoverable: true,
    method: 'GET',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    outputSchema,
    getPayTo: labsPayToOverride,
    /** Labs settle via Dexter facilitator; all other Syra x402 routes stay on PayAI. */
    resourceServerProfile: 'dexter',
  });
}

export async function createInsightsRouter() {
  const router = express.Router();

  router.get(
    '/network-health',
    labsPaymentMiddleware(
      X402_API_PRICE_INSIGHTS_NETWORK_HEALTH_USD,
      '/insights/network-health',
      'insights/network-health',
      {
        network: { type: 'string' },
        slot: { type: 'integer' },
        avgTps: { type: 'number' },
        medianPriorityFeeLamports: { type: 'integer' },
        computedAt: { type: 'string' },
      },
    ),
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
    labsPaymentMiddleware(
      X402_API_PRICE_INSIGHTS_GAS_ORACLE_USD,
      '/insights/gas-oracle',
      'insights/gas-oracle',
      {
        network: { type: 'string' },
        sampleCount: { type: 'integer' },
        p50Lamports: { type: 'integer' },
        computedAt: { type: 'string' },
      },
    ),
    (req, res) =>
      handleInsightRoute(req, res, '/insights/gas-oracle', 'insights/gas-oracle', fetchGasOracleInsight),
  );

  router.get(
    '/market-pulse',
    labsPaymentMiddleware(
      X402_API_PRICE_INSIGHTS_MARKET_PULSE_USD,
      '/insights/market-pulse',
      'insights/market-pulse',
      {
        assets: { type: 'array' },
        computedAt: { type: 'string' },
      },
    ),
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
    labsPaymentMiddleware(
      X402_API_PRICE_INSIGHTS_TOKEN_METRICS_USD,
      '/insights/token-metrics',
      'insights/token-metrics',
      {
        token: { type: 'string' },
        pairs: { type: 'array' },
        computedAt: { type: 'string' },
      },
    ),
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
    labsPaymentMiddleware(
      X402_API_PRICE_INSIGHTS_DEFI_TVL_USD,
      '/insights/defi-tvl',
      'insights/defi-tvl',
      {
        chain: { type: 'string' },
        currentTvlUsd: { type: 'number' },
        computedAt: { type: 'string' },
      },
    ),
    (req, res) =>
      handleInsightRoute(req, res, '/insights/defi-tvl', 'insights/defi-tvl', fetchDefiTvlInsight),
  );

  router.get(
    '/volatility-index',
    labsPaymentMiddleware(
      X402_API_PRICE_INSIGHTS_VOLATILITY_INDEX_USD,
      '/insights/volatility-index',
      'insights/volatility-index',
      {
        index: { type: 'number' },
        assets: { type: 'array' },
        computedAt: { type: 'string' },
      },
    ),
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

