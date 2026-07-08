/**
 * Admin-gated CRUD API for Organize tracker entries.
 */
import express from 'express';
import { getAdminDashboardWallets, isAdminWalletAddress } from '../../libs/adminWallet.js';
import { requireMongooseConnection } from '../../config/mongoose.js';
import { optionalWalletSession } from '../../utils/requireSession.js';
import {
  anonymousIdFromWallet,
  createEntry,
  deleteEntry,
  listEntries,
  updateEntry,
} from '../../libs/labs/organizeService.js';
import {
  ORGANIZE_ENTRY_STATUSES,
  ORGANIZE_ENTRY_TYPES,
} from '../../models/labs/OrganizeEntry.js';

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

export function createOrganizeRouter() {
  const router = express.Router();
  router.use(optionalWalletSession(), requireAdminWallet, requireMongooseConnection);

  router.get('/entries', async (req, res) => {
    try {
      const anonymousId = anonymousIdFromWallet(req.user.walletAddress);
      const type = typeof req.query?.type === 'string' ? req.query.type.trim() : undefined;
      const status = typeof req.query?.status === 'string' ? req.query.status.trim() : undefined;
      const entries = await listEntries(anonymousId, { type, status });
      return res.json({ success: true, data: entries });
    } catch (e) {
      return res.status(500).json({ success: false, error: e?.message || 'Failed to list entries' });
    }
  });

  router.post('/entries', express.json(), async (req, res) => {
    try {
      const anonymousId = anonymousIdFromWallet(req.user.walletAddress);
      const entry = await createEntry(anonymousId, req.body ?? {});
      return res.status(201).json({ success: true, data: entry });
    } catch (e) {
      const status = /required|must be|invalid/i.test(e?.message || '') ? 400 : 500;
      return res.status(status).json({ success: false, error: e?.message || 'Failed to create entry' });
    }
  });

  router.patch('/entries/:id', express.json(), async (req, res) => {
    try {
      const anonymousId = anonymousIdFromWallet(req.user.walletAddress);
      const entry = await updateEntry(anonymousId, req.params.id, req.body ?? {});
      return res.json({ success: true, data: entry });
    } catch (e) {
      const msg = e?.message || 'Failed to update entry';
      const status = msg === 'entry not found' ? 404 : /required|must be|invalid|no fields/i.test(msg) ? 400 : 500;
      return res.status(status).json({ success: false, error: msg });
    }
  });

  router.delete('/entries/:id', async (req, res) => {
    try {
      const anonymousId = anonymousIdFromWallet(req.user.walletAddress);
      await deleteEntry(anonymousId, req.params.id);
      return res.json({ success: true, data: { deleted: true } });
    } catch (e) {
      const msg = e?.message || 'Failed to delete entry';
      const status = msg === 'entry not found' ? 404 : /invalid/i.test(msg) ? 400 : 500;
      return res.status(status).json({ success: false, error: msg });
    }
  });

  router.get('/meta', (_req, res) => {
    return res.json({
      success: true,
      data: {
        types: ORGANIZE_ENTRY_TYPES,
        statuses: ORGANIZE_ENTRY_STATUSES,
      },
    });
  });

  return router;
}
