/**
 * Internal admin: agent wallet sets across all users/agents.
 */
import express from 'express';
import { getAdminDashboardWallets, isAdminWalletAddress } from '../libs/adminWallet.js';
import { listAgentWalletSetsForAdmin } from '../libs/agentWalletSetService.js';
import { optionalWalletSession } from '../utils/requireSession.js';

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

export function createInternalAgentWalletsRouter() {
  const router = express.Router();

  /**
   * GET /internal/agent-wallets
   * Admin-only: all agent wallet sets with balances and provisioning source.
   */
  router.get('/agent-wallets', optionalWalletSession(), requireAdminWallet, async (req, res) => {
    try {
      const limit = req.query?.limit;
      const offset = req.query?.offset;
      const q = typeof req.query?.q === 'string' ? req.query.q : '';
      const data = await listAgentWalletSetsForAdmin({ limit, offset, q });
      return res.json({ success: true, data });
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: err?.message || 'agent_wallets_list_failed',
      });
    }
  });

  return router;
}

export default createInternalAgentWalletsRouter;
