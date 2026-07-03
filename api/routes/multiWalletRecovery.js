import { Router } from 'express';
import { requireMongooseConnection } from '../config/mongoose.js';
import { getAdminDashboardWallets, isAdminWalletAddress } from '../libs/adminWallet.js';
import { requireSession } from '../utils/requireSession.js';
import {
  previewMultiWalletRecovery,
  recoverMultiWalletFunds,
} from '../libs/multiWalletRecovery.js';

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

export function createMultiWalletRecoveryRouter() {
  const router = Router();
  router.use(requireMongooseConnection);
  router.use(requireSession());
  router.use(requireAdminWallet);

  router.get('/preview', async (req, res) => {
    try {
      const wallet = req.user?.walletAddress;
      if (!wallet) {
        return res.status(401).json({ success: false, error: 'auth_required' });
      }
      const data = await previewMultiWalletRecovery(wallet);
      res.json({ success: true, data });
    } catch (err) {
      res.status(400).json({ success: false, error: err?.message || 'preview_failed' });
    }
  });

  router.post('/recover', async (req, res) => {
    try {
      const wallet = req.user?.walletAddress;
      if (!wallet) {
        return res.status(401).json({ success: false, error: 'auth_required' });
      }
      const publicKeys = Array.isArray(req.body?.publicKeys) ? req.body.publicKeys : [];
      const data = await recoverMultiWalletFunds(
        wallet,
        publicKeys.length > 0 ? publicKeys : undefined,
      );
      res.json({ success: true, data });
    } catch (err) {
      res.status(400).json({ success: false, error: err?.message || 'recover_failed' });
    }
  });

  return router;
}
