/**
 * Admin-gated management API for x402 Labs — wallets, settings, manual runs, call log.
 */
import express from 'express';
import { getAdminDashboardWallets, isAdminWalletAddress } from '../../libs/adminWallet.js';
import { requireMongooseConnection } from '../../config/mongoose.js';
import { optionalWalletSession } from '../../utils/requireSession.js';
import {
  createLabWallet,
  listLabWallets,
  getLabWalletBalances,
} from '../../libs/labs/labWalletService.js';
import {
  runLabX402Payment,
  getLabX402Settings,
  updateLabX402Settings,
  listLabX402Calls,
} from '../../libs/labs/labX402Payer.js';
import { listLabX402Endpoints } from '../../libs/labs/labX402Endpoints.js';
import { ensurePayerFundedForNextCall } from '../../libs/labs/labX402Refund.js';
import { restartLabX402Scheduler } from '../../libs/labs/labX402Scheduler.js';

/** @type {Map<string, number>} */
const manualRunCooldown = new Map();
const MANUAL_RUN_COOLDOWN_MS = 30_000;

function requireManualRunCooldown(req, res, next) {
  const wallet = req.user?.walletAddress ?? req.get('x-admin-wallet') ?? '';
  const key = String(wallet).trim();
  if (!key) return next();
  const last = manualRunCooldown.get(key) ?? 0;
  if (Date.now() - last < MANUAL_RUN_COOLDOWN_MS) {
    return res.status(429).json({
      success: false,
      error: 'run_cooldown',
      message: 'Manual run cooldown — wait 30 seconds between batch runs.',
    });
  }
  manualRunCooldown.set(key, Date.now());
  next();
}

function requireAdminWallet(req, res, next) {
  const allow = getAdminDashboardWallets();
  if (allow.length === 0) {
    return res.status(403).json({ success: false, error: 'admin_disabled' });
  }

  let walletAddress = req.user?.walletAddress ?? null;
  if (!walletAddress) {
    const fromHeader = req.get('x-admin-wallet') || req.get('x-wallet-address');
    if (typeof fromHeader === 'string' && fromHeader.trim()) {
      walletAddress = fromHeader.trim();
    }
  }

  if (!walletAddress) {
    return res.status(403).json({ success: false, error: 'admin_required' });
  }
  if (!isAdminWalletAddress(walletAddress)) {
    return res.status(403).json({ success: false, error: 'not_admin' });
  }

  req.user = { ...(req.user || {}), walletAddress, guest: false };
  next();
}

export function createLabsX402Router() {
  const router = express.Router();
  router.use(optionalWalletSession(), requireAdminWallet, requireMongooseConnection);

  router.get('/wallets', async (_req, res) => {
    try {
      const wallets = await listLabWallets();
      return res.json({ success: true, data: wallets });
    } catch (e) {
      return res.status(500).json({ success: false, error: e?.message || 'Failed to list wallets' });
    }
  });

  router.post('/wallets', express.json(), async (req, res) => {
    try {
      const label = typeof req.body?.label === 'string' ? req.body.label.trim() : '';
      const role = req.body?.role === 'payto' ? 'payto' : 'payer';
      if (!label) {
        return res.status(400).json({ success: false, error: 'label is required' });
      }
      const wallet = await createLabWallet({ label, role });
      return res.status(201).json({ success: true, data: wallet });
    } catch (e) {
      const status = /already exists/i.test(e?.message || '') ? 409 : 500;
      return res.status(status).json({ success: false, error: e?.message || 'Failed to create wallet' });
    }
  });

  router.get('/wallets/:address/balance', async (req, res) => {
    try {
      const balances = await getLabWalletBalances(req.params.address);
      if (!balances) {
        return res
          .status(503)
          .json({ success: false, error: 'balance_unavailable', message: 'RPC balance read failed; try again shortly.' });
      }
      return res.json({ success: true, data: { address: req.params.address, ...balances } });
    } catch (e) {
      return res.status(500).json({ success: false, error: e?.message || 'Failed to read balance' });
    }
  });

  router.get('/settings', async (_req, res) => {
    try {
      const settings = await getLabX402Settings();
      return res.json({ success: true, data: settings });
    } catch (e) {
      return res.status(500).json({ success: false, error: e?.message || 'Failed to read settings' });
    }
  });

  router.put('/settings', express.json(), async (req, res) => {
    try {
      const settings = await updateLabX402Settings(req.body ?? {});
      restartLabX402Scheduler();
      return res.json({ success: true, data: settings });
    } catch (e) {
      return res.status(500).json({ success: false, error: e?.message || 'Failed to update settings' });
    }
  });

  router.post('/run', express.json(), requireManualRunCooldown, async (req, res) => {
    try {
      const payerAddress =
        typeof req.body?.payerAddress === 'string' ? req.body.payerAddress.trim() : null;
      const endpoint = typeof req.body?.endpoint === 'string' ? req.body.endpoint.trim() : undefined;

      const { refundEnabled } = await getLabX402Settings();

      if (payerAddress) {
        const funding = await ensurePayerFundedForNextCall(payerAddress, { refundEnabled });
        if (!funding.canPay) {
          return res.json({
            success: false,
            data: {
              success: false,
              endpoint: endpoint ?? null,
              skipped: true,
              reason: funding.reason,
              error: `Payer cannot pay (${funding.reason}). Top up the PayTo/payer wallet.`,
            },
          });
        }
        const result = await runLabX402Payment(payerAddress, { endpoint, trigger: 'manual' });
        return res.json({ success: true, data: result });
      }

      const { listActivePayerWallets } = await import('../../libs/labs/labWalletService.js');
      const payers = await listActivePayerWallets();
      if (payers.length === 0) {
        return res.status(400).json({ success: false, error: 'No active payer wallets' });
      }

      const results = [];
      for (const p of payers) {
        const funding = await ensurePayerFundedForNextCall(p.address, { refundEnabled });
        if (!funding.canPay) {
          results.push({
            success: false,
            endpoint: endpoint ?? null,
            skipped: true,
            reason: funding.reason,
            error: `Payer cannot pay (${funding.reason}).`,
          });
          continue;
        }
        results.push(await runLabX402Payment(p.address, { endpoint, trigger: 'manual' }));
      }
      return res.json({ success: true, data: { results } });
    } catch (e) {
      return res.status(500).json({ success: false, error: e?.message || 'Run failed' });
    }
  });

  router.get('/calls', async (req, res) => {
    try {
      const limit = Number(req.query?.limit) || 10;
      const calls = await listLabX402Calls({ limit });
      return res.json({ success: true, data: calls });
    } catch (e) {
      return res.status(500).json({ success: false, error: e?.message || 'Failed to list calls' });
    }
  });

  router.get('/endpoints', (_req, res) => {
    return res.json({ success: true, data: listLabX402Endpoints() });
  });

  return router;
}
