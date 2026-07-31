/**
 * Admin LP → earn wallet migration endpoints.
 *
 * GET  /admin/lp-migration/status       — calling admin's LP/earn only
 * GET  /admin/lp-migration/status-all   — every user's LP wallet audit
 * POST /admin/lp-migration/close|sweep|repoint|all — admin's own LP
 * POST /admin/lp-migration/migrate-all  — EVERY user: close → sweep SOL/SPL → retire :lp
 */
import { Router } from 'express';
import { requireMongooseConnection } from '../config/mongoose.js';
import { getAdminDashboardWallets, isAdminWalletAddress } from '../libs/adminWallet.js';
import { requireSession } from '../utils/requireSession.js';
import {
  migrateLpClosePositions,
  migrateLpSweepToEarn,
  migrateLpRepointAndRetire,
  runLpToEarnMigration,
  migrateAllLpWalletsToEarn,
  listAllLpAgentWallets,
  resolveAdminLpMigrationWallets,
  resolveEarnSiblingForLp,
  recoverBaseFromLpAnonymousId,
} from '../libs/lpToEarnMigration.js';
import { snapshotAgentBalances } from '../libs/agentWalletSweep.js';
import LpRealPosition from '../models/LpRealPosition.js';

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

function requestMeta(req) {
  return {
    ip: req.ip,
    userAgent: req.get?.('user-agent') || undefined,
    sessionId: req.user?.sessionId || undefined,
  };
}

export function createAdminLpMigrationRouter() {
  const router = Router();
  router.use(requireMongooseConnection);
  router.use(requireSession());
  router.use(requireAdminWallet);

  router.get('/status', async (req, res) => {
    try {
      const ctx = await resolveAdminLpMigrationWallets(req.user.walletAddress);
      const openCount = ctx.lp?.agentAddress
        ? await LpRealPosition.countDocuments({
            agentAddress: ctx.lp.agentAddress,
            status: { $in: ['open', 'opening', 'closing'] },
          })
        : 0;
      const [lpBalances, earnBalances] = await Promise.all([
        ctx.lp?.agentAddress && ctx.lp.status !== 'retired'
          ? snapshotAgentBalances(ctx.lp.agentAddress).catch((e) => ({ error: e.message }))
          : null,
        ctx.earn?.agentAddress
          ? snapshotAgentBalances(ctx.earn.agentAddress).catch((e) => ({ error: e.message }))
          : null,
      ]);
      res.json({
        success: true,
        data: {
          ownerWallet: ctx.ownerWallet,
          baseAnonymousId: ctx.baseAnonymousId,
          lp: ctx.lp
            ? {
                anonymousId: ctx.lp.anonymousId,
                agentAddress: ctx.lp.agentAddress,
                status: ctx.lp.status,
                balances: lpBalances,
              }
            : null,
          earn: {
            anonymousId: ctx.earnAnonymousId,
            agentAddress: ctx.earn.agentAddress,
            balances: earnBalances,
          },
          openLpPositions: openCount,
        },
      });
    } catch (err) {
      res.status(400).json({ success: false, error: err?.code || err?.message || 'status_failed' });
    }
  });

  router.post('/close', async (req, res) => {
    try {
      const dryRun = Boolean(req.body?.dryRun);
      const confirm = Boolean(req.body?.confirm);
      if (!dryRun && !confirm) {
        return res.status(400).json({ success: false, error: 'confirm_required' });
      }
      const data = await migrateLpClosePositions({
        ownerWallet: req.user.walletAddress,
        dryRun,
      });
      res.json({ success: true, data });
    } catch (err) {
      res.status(400).json({
        success: false,
        error: err?.code || err?.message || 'close_failed',
        openCount: err?.openCount,
      });
    }
  });

  router.post('/sweep', async (req, res) => {
    try {
      const dryRun = Boolean(req.body?.dryRun);
      const confirm = Boolean(req.body?.confirm);
      if (!dryRun && !confirm) {
        return res.status(400).json({ success: false, error: 'confirm_required' });
      }
      const data = await migrateLpSweepToEarn({
        ownerWallet: req.user.walletAddress,
        dryRun,
        ...requestMeta(req),
      });
      res.json({ success: true, data });
    } catch (err) {
      res.status(400).json({
        success: false,
        error: err?.code || err?.message || 'sweep_failed',
        openCount: err?.openCount,
      });
    }
  });

  router.post('/repoint', async (req, res) => {
    try {
      const dryRun = Boolean(req.body?.dryRun);
      const confirm = Boolean(req.body?.confirm);
      if (!dryRun && !confirm) {
        return res.status(400).json({ success: false, error: 'confirm_required' });
      }
      const data = await migrateLpRepointAndRetire({
        ownerWallet: req.user.walletAddress,
        dryRun,
      });
      res.json({ success: true, data });
    } catch (err) {
      res.status(400).json({
        success: false,
        error: err?.code || err?.message || 'repoint_failed',
        openCount: err?.openCount,
      });
    }
  });

  /** Migrate the calling admin's own LP → earn (legacy single-wallet path). */
  router.post('/all', async (req, res) => {
    try {
      const dryRun = Boolean(req.body?.dryRun);
      const confirm = Boolean(req.body?.confirm);
      const data = await runLpToEarnMigration({
        ownerWallet: req.user.walletAddress,
        dryRun,
        confirm,
        all: false,
        ...requestMeta(req),
      });
      res.json({ success: true, data });
    } catch (err) {
      res.status(400).json({
        success: false,
        error: err?.code || err?.message || 'migration_failed',
        openCount: err?.openCount,
      });
    }
  });

  /** Audit every LP wallet (balances + open positions + earn sibling). */
  router.get('/status-all', async (_req, res) => {
    try {
      const all = await listAllLpAgentWallets();
      const wallets = [];
      for (const lp of all) {
        let earn = null;
        try {
          earn = (await resolveEarnSiblingForLp(lp)).earn;
        } catch {
          earn = null;
        }
        let balances = null;
        let balError = null;
        try {
          balances = await snapshotAgentBalances(lp.agentAddress);
        } catch (e) {
          balError = e?.message || String(e);
        }
        const openPositions = await LpRealPosition.countDocuments({
          agentAddress: lp.agentAddress,
          status: { $in: ['open', 'opening', 'closing'] },
        });
        const hasFunds =
          balances &&
          (balances.sol > 0.005 || (balances.tokens && balances.tokens.length > 0));
        wallets.push({
          lpAnonymousId: lp.anonymousId,
          lpAgentAddress: lp.agentAddress,
          lpStatus: lp.status,
          ownerWallet: lp.walletAddress || null,
          baseAnonymousId: recoverBaseFromLpAnonymousId(lp.anonymousId),
          earnAnonymousId: earn?.anonymousId || null,
          earnAgentAddress: earn?.agentAddress || null,
          openPositions,
          sol: balances?.sol ?? null,
          tokenCount: balances?.tokens?.length ?? 0,
          hasFunds: Boolean(hasFunds),
          needsMigration: Boolean(hasFunds || openPositions > 0 || lp.status === 'active'),
          balError,
        });
      }
      res.json({
        success: true,
        data: {
          total: wallets.length,
          needsMigration: wallets.filter((w) => w.needsMigration).length,
          withFunds: wallets.filter((w) => w.hasFunds).length,
          withOpen: wallets.filter((w) => w.openPositions > 0).length,
          wallets,
        },
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        error: err?.code || err?.message || 'status_all_failed',
      });
    }
  });

  /**
   * Migrate EVERY user's LP → earn (close → sweep SOL/SPL → retire).
   * Body: { dryRun?: boolean, confirm?: boolean }
   */
  router.post('/migrate-all', async (req, res) => {
    try {
      const dryRun = Boolean(req.body?.dryRun);
      const confirm = Boolean(req.body?.confirm);
      if (!dryRun && !confirm) {
        return res.status(400).json({ success: false, error: 'confirm_required' });
      }
      const data = await migrateAllLpWalletsToEarn({
        dryRun,
        confirm,
        onlyWithFunds: true,
        ...requestMeta(req),
      });
      res.json({ success: true, data });
    } catch (err) {
      res.status(400).json({
        success: false,
        error: err?.code || err?.message || 'migrate_all_failed',
        openCount: err?.openCount,
      });
    }
  });

  return router;
}
