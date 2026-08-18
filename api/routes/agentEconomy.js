/**
 * Agent economy feeds from agenteconomy.to.
 * Free: GET /agent-economy/summary, GET /agent-economy/freshness
 * Paid: GET /agent-economy/on-chain, GET /agent-economy/off-chain
 */
import express from 'express';
import { getV2Payment } from '../utils/getV2Payment.js';
import { getResourceDescription } from '../config/x402ResourceCatalog.js';
import {
  X402_API_PRICE_AGENT_ECONOMY_ON_CHAIN_USD,
  X402_API_PRICE_AGENT_ECONOMY_OFF_CHAIN_USD,
} from '../config/x402Pricing.js';
import {
  fetchOffChainFeed,
  fetchOnChainFeed,
  getFreshness,
  getSummary,
} from '../libs/agentEconomyService.js';

const { requirePayment, settlePaymentAndSetResponse } = await getV2Payment();

const FREE_CACHE =
  'public, max-age=60, s-maxage=120, stale-while-revalidate=600';

const onChainPayment = {
  price: X402_API_PRICE_AGENT_ECONOMY_ON_CHAIN_USD,
  description: getResourceDescription('agent-economy/on-chain'),
  discoverable: true,
  resource: '/agent-economy/on-chain',
  outputSchema: {
    source: { type: 'string' },
    upstreamUrl: { type: 'string' },
    feed: { type: 'object' },
  },
};

const offChainPayment = {
  price: X402_API_PRICE_AGENT_ECONOMY_OFF_CHAIN_USD,
  description: getResourceDescription('agent-economy/off-chain'),
  discoverable: true,
  resource: '/agent-economy/off-chain',
  outputSchema: {
    source: { type: 'string' },
    upstreamUrl: { type: 'string' },
    feed: { type: 'object' },
  },
};

/**
 * @param {import('express').Response} res
 * @param {unknown} err
 */
function sendUpstreamError(res, err) {
  const msg = err instanceof Error ? err.message : String(err);
  console.error('[agent-economy]', msg);
  res.status(502).json({ success: false, error: 'Failed to load agent economy feed' });
}

export async function createAgentEconomyRouter() {
  const router = express.Router();

  router.get('/summary', async (_req, res) => {
    try {
      const data = await getSummary();
      res.setHeader('Cache-Control', FREE_CACHE);
      res.json(data);
    } catch (err) {
      sendUpstreamError(res, err);
    }
  });

  router.get('/freshness', async (_req, res) => {
    try {
      const data = await getFreshness();
      res.setHeader('Cache-Control', FREE_CACHE);
      res.json({ success: true, ...data });
    } catch (err) {
      sendUpstreamError(res, err);
    }
  });

  router.get(
    '/on-chain',
    requirePayment({
      ...onChainPayment,
      method: 'GET',
      inputSchema: { queryParams: {} },
    }),
    async (req, res) => {
      try {
        const data = await fetchOnChainFeed();
        await settlePaymentAndSetResponse(res, req);
        res.json({ success: true, ...data });
      } catch (err) {
        sendUpstreamError(res, err);
      }
    },
  );

  router.get(
    '/off-chain',
    requirePayment({
      ...offChainPayment,
      method: 'GET',
      inputSchema: { queryParams: {} },
    }),
    async (req, res) => {
      try {
        const data = await fetchOffChainFeed();
        await settlePaymentAndSetResponse(res, req);
        res.json({ success: true, ...data });
      } catch (err) {
        sendUpstreamError(res, err);
      }
    },
  );

  return router;
}
