/**
 * Admin-gated management API for x402 Labs — wallets, settings, manual runs, call log.
 * All endpoints accept a `chain` query/body param: `solana` (default) | `base` | `celo` | `algorand`.
 */
import express from 'express';
import { getAdminDashboardWallets, isAdminWalletAddress } from '../../libs/adminWallet.js';
import { requireMongooseConnection } from '../../config/mongoose.js';
import { optionalWalletSession } from '../../utils/requireSession.js';
import {
  createLabWallet,
  createLabWalletsBulk,
  listLabWallets,
  getLabWalletBalances,
} from '../../libs/labs/labWalletService.js';
import {
  runLabX402Payment,
  getLabX402Settings,
  updateLabX402Settings,
  listLabX402Calls,
} from '../../libs/labs/labX402Payer.js';
import { listLabX402EndpointsWithQuota } from '../../libs/labs/labX402Endpoints.js';
import { ensurePayerFundedForNextCall } from '../../libs/labs/labX402Refund.js';
import { restartLabX402Scheduler } from '../../libs/labs/labX402Scheduler.js';
import {
  getLabDepositHub,
  distributeLabDeposit,
} from '../../libs/labs/labDepositDistributor.js';
import { getMaxPayerWallets } from '../../libs/labs/labX402CallLog.js';
import { normalizeLabChain } from '../../models/labs/LabX402Settings.js';

/** @type {Map<string, number>} */
const manualRunCooldown = new Map();
const MANUAL_RUN_COOLDOWN_MS = 30_000;

/**
 * @param {import('express').Request} req
 * @returns {'solana' | 'base' | 'celo'}
 */
function parseChain(req) {
  const raw = req.query?.chain ?? req.body?.chain;
  return normalizeLabChain(raw);
}

function requireManualRunCooldown(req, res, next) {
  const wallet = req.user?.walletAddress ?? req.get('x-admin-wallet') ?? '';
  const chain = parseChain(req);
  const key = `${String(wallet).trim()}:${chain}`;
  if (!key.startsWith(':')) {
    const last = manualRunCooldown.get(key) ?? 0;
    if (Date.now() - last < MANUAL_RUN_COOLDOWN_MS) {
      return res.status(429).json({
        success: false,
        error: 'run_cooldown',
        message: 'Manual run cooldown — wait 30 seconds between batch runs.',
      });
    }
    manualRunCooldown.set(key, Date.now());
  }
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

  router.get('/wallets', async (req, res) => {
    try {
      const chain = parseChain(req);
      const wallets = await listLabWallets(chain);
      return res.json({ success: true, data: wallets });
    } catch (e) {
      return res.status(500).json({ success: false, error: e?.message || 'Failed to list wallets' });
    }
  });

  router.post('/wallets', express.json(), async (req, res) => {
    try {
      const label = typeof req.body?.label === 'string' ? req.body.label.trim() : '';
      const role = req.body?.role === 'payto' ? 'payto' : 'payer';
      const chain = parseChain(req);
      if (!label) {
        return res.status(400).json({ success: false, error: 'label is required' });
      }
      const wallet = await createLabWallet({ label, role, chain });
      return res.status(201).json({ success: true, data: wallet });
    } catch (e) {
      const status = /already exists|Maximum of/i.test(e?.message || '') ? 409 : 500;
      return res.status(status).json({ success: false, error: e?.message || 'Failed to create wallet' });
    }
  });

  router.post('/wallets/bulk', express.json(), async (req, res) => {
    try {
      const chain = parseChain(req);
      const count = Number(req.body?.count);
      const labelPrefix =
        typeof req.body?.labelPrefix === 'string' ? req.body.labelPrefix.trim() : 'Payer';
      if (!Number.isFinite(count) || count < 1) {
        return res.status(400).json({ success: false, error: 'count must be a positive number' });
      }
      if (count > getMaxPayerWallets()) {
        return res.status(400).json({
          success: false,
          error: `count cannot exceed ${getMaxPayerWallets()}`,
        });
      }
      const wallets = await createLabWalletsBulk({
        count,
        chain,
        labelPrefix,
        role: 'payer',
      });
      return res.status(201).json({ success: true, data: wallets });
    } catch (e) {
      const status = /Maximum of/i.test(e?.message || '') ? 409 : 500;
      return res
        .status(status)
        .json({ success: false, error: e?.message || 'Failed to create wallets' });
    }
  });

  router.get('/wallets/:address/balance', async (req, res) => {
    try {
      const chain = parseChain(req);
      const balances = await getLabWalletBalances(req.params.address, chain);
      if (!balances) {
        return res
          .status(503)
          .json({ success: false, error: 'balance_unavailable', message: 'RPC balance read failed; try again shortly.' });
      }
      return res.json({
        success: true,
        data: {
          address: req.params.address,
          chain: balances.chain,
          nativeBalance: balances.nativeBalance,
          nativeSymbol: nativeSymbolForChain(balances.chain),
          solBalance: balances.nativeBalance,
          usdcBalance: balances.usdcBalance,
        },
      });
    } catch (e) {
      return res.status(500).json({ success: false, error: e?.message || 'Failed to read balance' });
    }
  });

  router.get('/deposit', async (req, res) => {
    try {
      const chain = parseChain(req);
      const deposit = await getLabDepositHub(chain);
      return res.json({ success: true, data: deposit });
    } catch (e) {
      return res
        .status(500)
        .json({ success: false, error: e?.message || 'Failed to get deposit hub' });
    }
  });

  router.post('/deposit/distribute', express.json(), async (req, res) => {
    try {
      const chain = parseChain(req);
      const result = await distributeLabDeposit(chain, { force: true });
      return res.json({ success: true, data: result });
    } catch (e) {
      return res
        .status(500)
        .json({ success: false, error: e?.message || 'Distribute failed' });
    }
  });

  router.get('/settings', async (req, res) => {
    try {
      const chain = parseChain(req);
      const settings = await getLabX402Settings(chain);
      return res.json({ success: true, data: settings });
    } catch (e) {
      return res.status(500).json({ success: false, error: e?.message || 'Failed to read settings' });
    }
  });

  router.put('/settings', express.json(), async (req, res) => {
    try {
      const chain = parseChain(req);
      const settings = await updateLabX402Settings(req.body ?? {}, chain);
      restartLabX402Scheduler(chain);
      return res.json({ success: true, data: settings });
    } catch (e) {
      return res.status(500).json({ success: false, error: e?.message || 'Failed to update settings' });
    }
  });

  router.post('/run', express.json(), requireManualRunCooldown, async (req, res) => {
    try {
      const chain = parseChain(req);
      const payerAddress =
        typeof req.body?.payerAddress === 'string' ? req.body.payerAddress.trim() : null;
      const endpoint = typeof req.body?.endpoint === 'string' ? req.body.endpoint.trim() : undefined;

      const { refundEnabled } = await getLabX402Settings(chain);

      if (payerAddress) {
        const funding = await ensurePayerFundedForNextCall(payerAddress, {
          refundEnabled,
          chain,
        });
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
        const result = await runLabX402Payment(payerAddress, {
          endpoint,
          trigger: 'manual',
          chain,
        });
        return res.json({ success: true, data: result });
      }

      const { listActivePayerWallets } = await import('../../libs/labs/labWalletService.js');
      const payers = await listActivePayerWallets(chain);
      if (payers.length === 0) {
        return res.status(400).json({ success: false, error: 'No active payer wallets' });
      }

      const results = [];
      for (const p of payers) {
        const funding = await ensurePayerFundedForNextCall(p.address, { refundEnabled, chain });
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
        results.push(
          await runLabX402Payment(p.address, { endpoint, trigger: 'manual', chain }),
        );
      }
      return res.json({ success: true, data: { results } });
    } catch (e) {
      return res.status(500).json({ success: false, error: e?.message || 'Run failed' });
    }
  });

  router.get('/calls', async (req, res) => {
    try {
      const chain = parseChain(req);
      const limit = Number(req.query?.limit) || 10;
      const calls = await listLabX402Calls({ limit, chain });
      return res.json({ success: true, data: calls });
    } catch (e) {
      return res.status(500).json({ success: false, error: e?.message || 'Failed to list calls' });
    }
  });

  router.get('/endpoints', async (_req, res) => {
    try {
      const endpoints = await listLabX402EndpointsWithQuota();
      return res.json({ success: true, data: endpoints });
    } catch (e) {
      return res.status(500).json({ success: false, error: e?.message || 'Failed to list endpoints' });
    }
  });

  return router;
}
