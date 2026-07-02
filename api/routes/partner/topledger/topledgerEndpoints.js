/**
 * TopLedger x402 proxy routes — Syra charges caller; treasury pays TopLedger MPP upstream.
 */
import express from 'express';
import { getV2Payment } from '../../../utils/getV2Payment.js';
import { X402_API_PRICE_TOPLEDGER_USD } from '../../../config/x402Pricing.js';
import { TOPLEDGER_WALLET_PATHS } from '../../../config/topledger.js';
import { callTopledgerWithTreasury } from '../../../libs/topledgerClient.js';

const { requirePayment, settlePaymentAndSetResponse } = await getV2Payment();

/**
 * @param {Record<string, string | undefined>} query
 */
function pickWalletQuery(query) {
  const wallet = String(query.wallet || query.address || '').trim();
  /** @type {Record<string, string>} */
  const extra = {};
  if (query.min_value_usd != null && String(query.min_value_usd).trim() !== '') {
    extra.min_value_usd = String(query.min_value_usd).trim();
  }
  return { wallet, extra };
}

/**
 * @param {string} pathTemplate
 * @param {string} expressPath e.g. /wallet/analyze
 * @param {string} resourcePath e.g. /topledger/wallet/analyze
 * @param {string} description
 */
function registerWalletRoute(router, pathTemplate, expressPath, resourcePath, description) {
  const opts = {
    price: X402_API_PRICE_TOPLEDGER_USD,
    description,
    method: 'GET',
    discoverable: true,
    resource: resourcePath,
    outputSchema: { success: { type: 'boolean' }, data: { type: 'object' } },
  };

  router.get(
    expressPath,
    requirePayment(opts),
    async (req, res) => {
      try {
        const { wallet, extra } = pickWalletQuery(req.query ?? {});
        if (!wallet) {
          return res.status(400).json({ success: false, error: 'wallet query param is required' });
        }
        const result = await callTopledgerWithTreasury(pathTemplate, 'GET', { wallet, ...extra });
        if (!result.success) {
          return res.status(502).json({ success: false, error: result.error || 'TopLedger upstream failed' });
        }
        await settlePaymentAndSetResponse(res, req);
        return res.json({ success: true, data: result.data });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return res.status(500).json({ success: false, error: message });
      }
    },
  );
}

export async function createTopledgerEndpointsRouter() {
  const router = express.Router();

  registerWalletRoute(
    router,
    TOPLEDGER_WALLET_PATHS.analyze,
    '/wallet/analyze',
    '/topledger/wallet/analyze',
    'TopLedger: full Solana wallet DeFi portfolio analysis (net worth, lending, perps, LP, staking, yield, rewards)',
  );
  registerWalletRoute(
    router,
    TOPLEDGER_WALLET_PATHS.holdings,
    '/wallet/holdings',
    '/topledger/wallet/holdings',
    'TopLedger: Solana token holdings with USD pricing',
  );
  registerWalletRoute(
    router,
    TOPLEDGER_WALLET_PATHS.lending,
    '/wallet/lending',
    '/topledger/wallet/lending',
    'TopLedger: lending deposits and borrows across Solana lending protocols',
  );
  registerWalletRoute(
    router,
    TOPLEDGER_WALLET_PATHS.perps,
    '/wallet/perps',
    '/topledger/wallet/perps',
    'TopLedger: perpetual futures positions and PnL',
  );
  registerWalletRoute(
    router,
    TOPLEDGER_WALLET_PATHS.lp,
    '/wallet/lp',
    '/topledger/wallet/lp',
    'TopLedger: liquidity provider positions across Solana AMMs',
  );
  registerWalletRoute(
    router,
    TOPLEDGER_WALLET_PATHS.staking,
    '/wallet/staking',
    '/topledger/wallet/staking',
    'TopLedger: native and protocol staking positions',
  );
  registerWalletRoute(
    router,
    TOPLEDGER_WALLET_PATHS.yield,
    '/wallet/yield',
    '/topledger/wallet/yield',
    'TopLedger: yield vault positions',
  );
  registerWalletRoute(
    router,
    TOPLEDGER_WALLET_PATHS.rewards,
    '/wallet/rewards',
    '/topledger/wallet/rewards',
    'TopLedger: pending and unclaimed protocol rewards',
  );
  registerWalletRoute(
    router,
    TOPLEDGER_WALLET_PATHS.dex,
    '/wallet/dex-pnl',
    '/topledger/wallet/dex-pnl',
    'TopLedger: FIFO DEX trading PnL and 7-day performance',
  );

  return router;
}
