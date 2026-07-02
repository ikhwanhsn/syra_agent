import { Router } from 'express';
import { requireMongooseConnection } from '../config/mongoose.js';
import { getAdminDashboardWallets, isAdminWalletAddress } from '../libs/adminWallet.js';
import { requireSession } from '../utils/requireSession.js';
import {
  archiveWallet,
  executeAnsemBuy,
  generateWallets,
  getMultiWalletTierSummary,
  listWallets,
  revealSecret,
} from '../libs/multiWalletService.js';

function positiveInt(value, fallback) {
  const n = Number.parseInt(String(value ?? ''), 10);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return n;
}

function requireAdminWallet(req, res, next) {
  const allow = getAdminDashboardWallets();
  if (allow.length === 0) {
    return res.status(403).json({ success: false, error: 'admin_disabled' });
  }
  if (!req.user || req.user.guest || !req.user.walletAddress) {
    return res.status(403).json({ success: false, error: 'admin_required' });
  }
  if (!isAdminWalletAddress(req.user.walletAddress)) {
    return res.status(403).json({ success: false, error: 'not_admin' });
  }
  next();
}

export function createMultiWalletRouter() {
  const router = Router();
  router.use(requireMongooseConnection);
  router.use(requireSession());
  router.use(requireAdminWallet);

  router.get('/tier', async (req, res) => {
    try {
      const wallet = req.user?.walletAddress;
      if (!wallet) {
        return res.status(401).json({ success: false, error: 'auth_required' });
      }
      const data = await getMultiWalletTierSummary(wallet);
      res.json({ success: true, data });
    } catch (err) {
      res.status(500).json({ success: false, error: err?.message || 'tier_lookup_failed' });
    }
  });

  router.get('/wallets', async (req, res) => {
    try {
      const wallet = req.user?.walletAddress;
      if (!wallet) {
        return res.status(401).json({ success: false, error: 'auth_required' });
      }
      const includeBalances = req.query.includeBalances === '1' || req.query.includeBalances === 'true';
      const data = await listWallets(wallet, { includeBalances });
      res.json({ success: true, data });
    } catch (err) {
      res.status(500).json({ success: false, error: err?.message || 'list_wallets_failed' });
    }
  });

  router.post('/generate', async (req, res) => {
    try {
      const wallet = req.user?.walletAddress;
      if (!wallet) {
        return res.status(401).json({ success: false, error: 'auth_required' });
      }
      const count = positiveInt(req.body?.count, 0);
      if (count <= 0) {
        return res.status(400).json({ success: false, error: 'count must be a positive integer' });
      }
      const data = await generateWallets(wallet, count);
      res.json({ success: true, data });
    } catch (err) {
      if (err?.code === 'WALLET_LIMIT_EXCEEDED') {
        return res.status(403).json({
          success: false,
          error: err.message,
          details: err.details,
        });
      }
      res.status(400).json({ success: false, error: err?.message || 'generate_failed' });
    }
  });

  router.post('/reveal', async (req, res) => {
    try {
      const wallet = req.user?.walletAddress;
      if (!wallet) {
        return res.status(401).json({ success: false, error: 'auth_required' });
      }
      const publicKey = String(req.body?.publicKey || '').trim();
      if (!publicKey) {
        return res.status(400).json({ success: false, error: 'publicKey is required' });
      }
      const data = await revealSecret(wallet, publicKey);
      res.json({ success: true, data });
    } catch (err) {
      const status = err?.message === 'wallet_not_found' ? 404 : 400;
      res.status(status).json({ success: false, error: err?.message || 'reveal_failed' });
    }
  });

  router.post('/execute-buy', async (req, res) => {
    try {
      const wallet = req.user?.walletAddress;
      if (!wallet) {
        return res.status(401).json({ success: false, error: 'auth_required' });
      }
      const publicKeys = Array.isArray(req.body?.publicKeys) ? req.body.publicKeys : [];
      const swapSol = req.body?.swapSol != null ? Number(req.body.swapSol) : undefined;
      const data = await executeAnsemBuy(wallet, publicKeys, swapSol);
      res.json({ success: true, data });
    } catch (err) {
      res.status(400).json({ success: false, error: err?.message || 'execute_buy_failed' });
    }
  });

  router.post('/archive', async (req, res) => {
    try {
      const wallet = req.user?.walletAddress;
      if (!wallet) {
        return res.status(401).json({ success: false, error: 'auth_required' });
      }
      const publicKey = String(req.body?.publicKey || '').trim();
      if (!publicKey) {
        return res.status(400).json({ success: false, error: 'publicKey is required' });
      }
      const data = await archiveWallet(wallet, publicKey);
      res.json({ success: true, data });
    } catch (err) {
      const status = err?.message === 'wallet_not_found' ? 404 : 400;
      res.status(status).json({ success: false, error: err?.message || 'archive_failed' });
    }
  });

  return router;
}
