/**
 * Agent wallet Crossmint onramp routes.
 * POST /agent/wallet/:anonymousId/onramp — create order for embedded checkout
 * GET  /agent/wallet/:anonymousId/onramp/:orderId — local order status
 * GET  /agent/wallet/onramp/status — public feature flag for UI
 */
import express from 'express';
import AgentWallet from '../../models/agent/AgentWallet.js';
import CrossmintOnrampOrder from '../../models/agent/CrossmintOnrampOrder.js';
import {
  getCrossmintClientApiKey,
  getCrossmintPublicStatus,
  getOnrampAmountLimits,
  isCrossmintOnrampEnabled,
} from '../../libs/crossmint/crossmintConfig.js';
import { createCrossmintOnrampOrder } from '../../libs/crossmint/crossmintOrders.js';
import { optionalWalletSession } from '../../utils/requireSession.js';

function decodeAnonymousId(param) {
  if (typeof param !== 'string') return '';
  try {
    return decodeURIComponent(param).trim();
  } catch {
    return param.trim();
  }
}

function normalizeChain(raw, walletChain) {
  const c = String(raw || walletChain || 'solana')
    .trim()
    .toLowerCase();
  if (c === 'base') return 'base';
  return 'solana';
}

/**
 * @param {import('express').Router} router
 */
export function mountCrossmintOnrampRoutes(router) {
  router.get('/onramp/status', (_req, res) => {
    return res.json({ success: true, ...getCrossmintPublicStatus() });
  });

  router.post('/:anonymousId/onramp', optionalWalletSession(), async (req, res) => {
    try {
      if (!isCrossmintOnrampEnabled()) {
        return res.status(503).json({
          success: false,
          error: 'crossmint_onramp_disabled',
          message: 'Fiat onramp is not enabled. Transfer USDC to your agent wallet instead.',
        });
      }

      const anonymousId = decodeAnonymousId(req.params.anonymousId);
      if (!anonymousId) {
        return res.status(400).json({ success: false, error: 'anonymousId_required' });
      }

      const wallet = await AgentWallet.findOne({ anonymousId }).lean();
      if (!wallet || wallet.status === 'retired') {
        return res.status(404).json({ success: false, error: 'wallet_not_found' });
      }

      const chain = normalizeChain(req.body?.chain, wallet.chain);
      if (chain === 'solana' && String(wallet.agentAddress || '').startsWith('0x')) {
        return res.status(400).json({
          success: false,
          error: 'chain_mismatch',
          message: 'This agent wallet is EVM; request chain=base.',
        });
      }
      if (chain === 'base' && !String(wallet.agentAddress || '').startsWith('0x')) {
        return res.status(400).json({
          success: false,
          error: 'chain_mismatch',
          message: 'This agent wallet is Solana; request chain=solana (default).',
        });
      }

      const limits = getOnrampAmountLimits();
      const amountNum = Number(req.body?.amountUsd ?? limits.defaultUsd);
      if (!Number.isFinite(amountNum) || amountNum < limits.minUsd || amountNum > limits.maxUsd) {
        return res.status(400).json({
          success: false,
          error: 'invalid_amount',
          message: `amountUsd must be between ${limits.minUsd} and ${limits.maxUsd}`,
          minAmountUsd: limits.minUsd,
          maxAmountUsd: limits.maxUsd,
        });
      }

      const receiptEmail = String(req.body?.receiptEmail || '').trim().toLowerCase();
      const amountUsd = amountNum.toFixed(2);

      const created = await createCrossmintOnrampOrder({
        walletAddress: wallet.agentAddress,
        receiptEmail,
        amountUsd,
        chain,
      });

      const orderId = created?.order?.orderId;
      const clientSecret = created?.clientSecret;
      if (!orderId || !clientSecret) {
        return res.status(502).json({
          success: false,
          error: 'crossmint_incomplete_response',
          message: 'Crossmint did not return orderId/clientSecret',
        });
      }

      await CrossmintOnrampOrder.findOneAndUpdate(
        { orderId },
        {
          $set: {
            orderId,
            anonymousId,
            agentAddress: wallet.agentAddress,
            chain,
            amountUsd,
            receiptEmail,
            fundingSource: 'crossmint_onramp',
            phase: created?.order?.phase || 'payment',
            paymentStatus: created?.order?.payment?.status || null,
            deliveryStatus: created?.order?.lineItems?.[0]?.delivery?.status || null,
            status: 'pending',
            clientSecretPresent: true,
          },
        },
        { upsert: true, new: true },
      );

      // Soft-tag wallet with last funding source (non-custody field via allocationConfig bag).
      await AgentWallet.updateOne(
        { anonymousId },
        {
          $set: {
            'allocationConfig.lastFundingSource': 'crossmint_onramp',
            'allocationConfig.lastOnrampOrderId': orderId,
            'allocationConfig.lastOnrampAt': new Date().toISOString(),
          },
        },
      ).catch(() => {});

      return res.status(201).json({
        success: true,
        orderId,
        clientSecret,
        clientApiKey: getCrossmintClientApiKey(),
        agentAddress: wallet.agentAddress,
        chain,
        amountUsd,
        receiptEmail,
        fundingSource: 'crossmint_onramp',
        order: created.order,
      });
    } catch (e) {
      const status = e?.status && Number.isFinite(e.status) ? e.status : 500;
      return res.status(status >= 400 && status < 600 ? status : 500).json({
        success: false,
        error: e?.code || 'onramp_failed',
        message: e instanceof Error ? e.message : 'Failed to create onramp order',
      });
    }
  });

  router.get('/:anonymousId/onramp/:orderId', optionalWalletSession(), async (req, res) => {
    try {
      const anonymousId = decodeAnonymousId(req.params.anonymousId);
      const orderId = String(req.params.orderId || '').trim();
      if (!anonymousId || !orderId) {
        return res.status(400).json({ success: false, error: 'invalid_params' });
      }
      const row = await CrossmintOnrampOrder.findOne({ orderId, anonymousId }).lean();
      if (!row) {
        return res.status(404).json({ success: false, error: 'order_not_found' });
      }
      return res.json({
        success: true,
        orderId: row.orderId,
        status: row.status,
        phase: row.phase,
        paymentStatus: row.paymentStatus,
        deliveryStatus: row.deliveryStatus,
        amountUsd: row.amountUsd,
        chain: row.chain,
        agentAddress: row.agentAddress,
        fundingSource: row.fundingSource,
        updatedAt: row.updatedAt,
      });
    } catch (e) {
      return res.status(500).json({
        success: false,
        error: 'onramp_status_failed',
        message: e instanceof Error ? e.message : 'Failed to load order',
      });
    }
  });
}
