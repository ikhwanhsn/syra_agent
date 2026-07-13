/**
 * x402 paid /insights/* routes — professional on-chain data endpoints for x402 Labs.
 * Payments route to the lab payTo wallet when configured (buyback skipped via payToOverride).
 * Dexter routes settle via Dexter facilitator (Solana + Base multi-network); PayAI routes stay on PayAI.
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
  X402_API_PRICE_INSIGHTS_ECOSYSTEM_BRIEF_USD,
} from '../../config/x402Pricing.js';
import {
  getActiveLabPayToAddresses,
  getActivePayToAddress,
  getLabWalletBalances,
} from '../../libs/labs/labWalletService.js';
import {
  evaluateLowBalanceRefund,
  refundUsdcToPayer,
  PAYTO_INSUFFICIENT_FUNDS,
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
  fetchEcosystemBriefInsight,
} from '../../libs/labs/insightsDataService.js';
import { payaiEndpointDailyLimitMiddleware, recordPayaiEndpointDailyCall } from '../../libs/labs/labPayaiEndpointDailyLimit.js';
import { findLabX402Endpoint } from '../../libs/labs/labX402Endpoints.js';

const { requirePayment, settlePaymentAndSetResponse } = await getV2Payment();

async function labsPayToOverride(req) {
  const { solanaPayTo, evmPayTo, celoPayTo } = await getActiveLabPayToAddresses();
  const labChain = String(req?.get?.('x-lab-x402-chain') || '').trim().toLowerCase();
  if (labChain === 'celo') {
    if (!celoPayTo) return null;
    return { solanaPayTo: null, evmPayTo: celoPayTo };
  }
  if (!solanaPayTo && !evmPayTo) return null;
  return { solanaPayTo, evmPayTo };
}

/**
 * Infer lab chain from payer address / request header.
 * @param {string} payer
 * @param {import('express').Request} req
 * @returns {'solana' | 'base' | 'celo'}
 */
function inferPayerChain(payer, req) {
  const fromHeader = req.get('x-lab-x402-chain');
  if (fromHeader === 'base' || fromHeader === 'solana' || fromHeader === 'celo') return fromHeader;
  return /^0x/i.test(payer) ? 'base' : 'solana';
}

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {string} endpointPath
 * @param {string} catalogSegment
 * @param {() => Promise<object>} fetchData
 */
async function handleInsightRoute(req, res, endpointPath, catalogSegment, fetchData, opts = {}) {
  try {
    const data = await fetchData();
    const settle = await settlePaymentAndSetResponse(res, req);
    if (settle?.success === false) {
      return res.status(502).json({
        success: false,
        error: settle.errorReason || settle.error || 'Payment settlement failed',
      });
    }

    if (opts.recordPayaiQuota && req.payaiEndpointId) {
      const limits = req.payaiEndpointDailyLimits ?? {};
      await recordPayaiEndpointDailyCall(
        req.payaiEndpointId,
        limits.minCap ?? 5,
        limits.maxCap ?? 10,
      );
    }

    const payer = typeof settle?.payer === 'string' ? settle.payer.trim() : '';
    const priceUsd = req.x402Payment?.priceUsd ?? 0;
    const paymentTx = typeof settle?.transaction === 'string' ? settle.transaction : null;
    const trigger = req.get('x-lab-x402-trigger') === 'scheduler' ? 'scheduler' : 'manual';
    const chain = inferPayerChain(payer, req);

    runAfterResponse(async () => {
      if (!payer) return;
      const labPayer = await isActiveLabPayer(payer, chain);
      if (!labPayer) return;

      const payToAddr = await getActivePayToAddress(chain);
      if (!payToAddr) return;

      try {
        const settings = await getLabX402Settings(chain);
        if (!settings.refundEnabled || priceUsd <= 0) {
          await logLabX402Call({
            payerAddress: payer,
            endpoint: endpointPath,
            priceUsd,
            chain,
            status: 'refund_skipped',
            paymentTx,
            trigger,
          });
          return;
        }

        const balances = await getLabWalletBalances(payer, chain);
        // Balance unknown (RPC unavailable): don't refund on a false low reading — skip cleanly.
        if (!balances) {
          await logLabX402Call({
            payerAddress: payer,
            endpoint: endpointPath,
            priceUsd,
            chain,
            status: 'refund_skipped',
            paymentTx,
            responseSnippet: 'balance_unavailable',
            trigger,
          });
          return;
        }

        const maxPriceUsd = getMaxLabX402PriceUsd();
        const avgPriceUsd = getWeightedAvgLabX402PriceUsd();
        const decision = evaluateLowBalanceRefund(balances.usdcBalance, maxPriceUsd, avgPriceUsd);

        if (!decision.shouldRefund) {
          await logLabX402Call({
            payerAddress: payer,
            endpoint: endpointPath,
            priceUsd,
            chain,
            status: 'refund_skipped',
            paymentTx,
            responseSnippet: `balance_ok:${balances.usdcBalance.toFixed(4)}>=${decision.thresholdUsd}`,
            trigger,
          });
          return;
        }

        const refund = await refundUsdcToPayer(payer, decision.refundAmountUsd, chain);
        await logLabX402Call({
          payerAddress: payer,
          endpoint: endpointPath,
          priceUsd,
          chain,
          status: 'success',
          paymentTx,
          refundTx: refund?.signature ?? null,
          responseSnippet: `topup:${decision.refundAmountUsd.toFixed(4)}→${decision.targetUsd}`,
          trigger,
        });
      } catch (e) {
        const msg = e?.message || String(e);
        // PayTo underfunded is an operational funding issue, not a broken refund — log it as a
        // clean skip (not a failure) and surface the actionable reason in server logs.
        const underfunded = msg.includes(PAYTO_INSUFFICIENT_FUNDS);
        if (underfunded) {
          console.warn('[insights] refund skipped — payTo wallet underfunded:', msg);
        } else {
          console.warn('[insights] refund failed:', msg);
        }
        await logLabX402Call({
          payerAddress: payer,
          endpoint: endpointPath,
          priceUsd,
          chain,
          status: underfunded ? 'refund_skipped' : 'refund_failed',
          paymentTx,
          responseSnippet: underfunded ? 'payto_underfunded' : undefined,
          error: msg,
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
  return (req, res, next) => {
    const labChain = String(req.get('x-lab-x402-chain') || '').trim().toLowerCase();
    const profile = labChain === 'celo' ? 'celo' : 'dexter';
    if (labChain === 'celo') {
      req.x402ResourceServerProfile = 'celo';
    }
    return requirePayment({
      price: priceUsd,
      description: getResourceDescription(catalogSegment),
      resource,
      discoverable: true,
      method: 'GET',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      outputSchema,
      getPayTo: labsPayToOverride,
      /** Labs Dexter routes settle via Dexter; Celo Labs routes self-settle with ERC-8021 tags. */
      resourceServerProfile: profile,
    })(req, res, next);
  };
}

function labsPayaiPaymentMiddleware(priceUsd, resource, catalogSegment, outputSchema = {}) {
  return requirePayment({
    price: priceUsd,
    description: getResourceDescription(catalogSegment),
    resource,
    discoverable: true,
    method: 'GET',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    outputSchema,
    getPayTo: labsPayToOverride,
    /** PayAI-facilitated Labs route — limited daily call cap enforced upstream. */
    resourceServerProfile: 'payai',
  });
}

/**
 * @param {string} endpointId
 */
function createPayaiDailyLimitMiddleware(endpointId) {
  const ep = findLabX402Endpoint(endpointId);
  return (req, res, next) =>
    payaiEndpointDailyLimitMiddleware(req, res, next, {
      endpointId,
      minCap: ep?.dailyLimitMin ?? 5,
      maxCap: ep?.dailyLimitMax ?? 10,
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

  router.get(
    '/ecosystem-brief',
    createPayaiDailyLimitMiddleware('ecosystem-brief'),
    labsPayaiPaymentMiddleware(
      X402_API_PRICE_INSIGHTS_ECOSYSTEM_BRIEF_USD,
      '/insights/ecosystem-brief',
      'insights/ecosystem-brief',
      {
        facilitator: { type: 'string' },
        network: { type: 'object' },
        market: { type: 'object' },
        defi: { type: 'object' },
        computedAt: { type: 'string' },
      },
    ),
    (req, res) =>
      handleInsightRoute(
        req,
        res,
        '/insights/ecosystem-brief',
        'insights/ecosystem-brief',
        fetchEcosystemBriefInsight,
        { recordPayaiQuota: true },
      ),
  );

  return router;
}
