import { Router } from 'express';
import { requireMongooseConnection } from '../config/mongoose.js';
import StreamflowLock from '../models/StreamflowLock.js';
import { sumAmountRaw, computeOperatorStats } from '../services/streamflowLockAggregates.js';
import {
  upsertStreamflowLock,
  bulkUpsertStreamflowLocks,
  getWalletStakingSummary,
  checkStakingEligibility,
  reconcileStreamflowLocks,
  isLockActive,
  nowUnix,
  DEFAULT_STAKING_MINT,
} from '../services/streamflowStakingService.js';

function toPositiveInt(value, fallback) {
  const n = Number.parseInt(String(value ?? ''), 10);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return n;
}

export async function createStreamflowLocksRouter() {
  const router = Router();
  router.use(requireMongooseConnection);

  router.post('/upsert', async (req, res) => {
    try {
      const { lock, snapshot } = await upsertStreamflowLock(req.body || {});
      res.json({ success: true, data: lock, snapshot });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message || 'Invalid payload' });
    }
  });

  router.post('/bulk-upsert', async (req, res) => {
    try {
      const items = Array.isArray(req.body?.items) ? req.body.items : [];
      if (items.length === 0) {
        res.status(400).json({ success: false, error: 'items must be a non-empty array' });
        return;
      }

      const { bulkResult, snapshots } = await bulkUpsertStreamflowLocks(items);
      res.json({ success: true, data: { bulkResult, snapshots } });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message || 'Bulk upsert failed' });
    }
  });

  /**
   * Wallet staking summary for utility gating (active locked SYRA).
   * GET /streamflow-locks/wallet-summary?wallet=...&mint=...&network=mainnet
   */
  router.get('/wallet-summary', async (req, res) => {
    try {
      const wallet = String(req.query.wallet || '').trim();
      if (!wallet) {
        res.status(400).json({ success: false, error: 'wallet is required' });
        return;
      }
      const mint = String(req.query.mint || DEFAULT_STAKING_MINT).trim();
      const network = req.query.network === 'devnet' ? 'devnet' : 'mainnet';
      const minAmount = req.query.minAmount != null ? Number(req.query.minAmount) : undefined;

      const data = await getWalletStakingSummary(wallet, {
        mint,
        network,
        minAmountFormatted: minAmount,
      });
      res.json({ success: true, data });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message || 'Wallet summary failed' });
    }
  });

  /**
   * Eligibility check for product utilities (e.g. trading agent requires 1M+ active stake).
   * GET /streamflow-locks/eligibility?wallet=...&minAmount=1000000
   */
  router.get('/eligibility', async (req, res) => {
    try {
      const wallet = String(req.query.wallet || '').trim();
      if (!wallet) {
        res.status(400).json({ success: false, error: 'wallet is required' });
        return;
      }
      const mint = String(req.query.mint || DEFAULT_STAKING_MINT).trim();
      const network = req.query.network === 'devnet' ? 'devnet' : 'mainnet';
      const minAmount =
        req.query.minAmount != null ? Number(req.query.minAmount) : undefined;

      const data = await checkStakingEligibility(wallet, {
        mint,
        network,
        minAmountFormatted: minAmount,
      });
      res.json({ success: true, data });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message || 'Eligibility check failed' });
    }
  });

  /**
   * Mark expired locks and refresh wallet snapshots. Operator key required in production.
   */
  router.post('/reconcile', async (req, res) => {
    try {
      const key = String(req.headers['x-operator-key'] || '').trim();
      const expected = process.env.STREAMFLOW_LOCKS_OPERATOR_KEY;
      if (expected && key !== expected) {
        res.status(403).json({ success: false, error: 'Forbidden' });
        return;
      }
      const mint = req.body?.mint ? String(req.body.mint).trim() : req.query.mint;
      const network = req.body?.network ?? req.query.network;
      const data = await reconcileStreamflowLocks({ mint, network });
      res.json({ success: true, data });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message || 'Reconcile failed' });
    }
  });

  /** Public aggregate for dashboards (no wallet PII). */
  router.get('/stats/summary', async (req, res) => {
    try {
      const mint = String(req.query.mint || '').trim();
      const network = req.query.network === 'devnet' ? 'devnet' : 'mainnet';
      if (!mint) {
        res.status(400).json({ success: false, error: 'mint is required' });
        return;
      }
      const atUnix = nowUnix();
      const locks = await StreamflowLock.find({ mint, network })
        .select('amountRaw wallet remainingAmountRaw closed unlockAtUnix status')
        .lean();
      const activeLocks = locks.filter((d) => isLockActive(d, atUnix));
      const openLockCount = activeLocks.length;
      const totalAmountRaw = sumAmountRaw(activeLocks);
      const uniqueWallets = new Set(activeLocks.map((d) => d.wallet).filter(Boolean)).size;
      const closedLockCount = locks.length - activeLocks.length;
      res.json({
        success: true,
        data: {
          network,
          mint,
          openLockCount,
          closedLockCount,
          uniqueWallets,
          totalAmountRaw,
        },
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message || 'Summary failed' });
    }
  });

  /**
   * Operator-only registry analytics. Requires STREAMFLOW_LOCKS_OPERATOR_KEY on the API server.
   */
  router.get('/stats/operator', async (req, res) => {
    try {
      const key = String(req.headers['x-operator-key'] || '').trim();
      const expected = process.env.STREAMFLOW_LOCKS_OPERATOR_KEY;
      if (!expected || key !== expected) {
        res.status(403).json({ success: false, error: 'Forbidden' });
        return;
      }
      const mint = String(req.query.mint || '').trim();
      const network = req.query.network === 'devnet' ? 'devnet' : 'mainnet';
      if (!mint) {
        res.status(400).json({ success: false, error: 'mint is required' });
        return;
      }
      const data = await computeOperatorStats(mint, network);
      res.json({ success: true, data });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message || 'Operator stats failed' });
    }
  });

  router.get('/', async (req, res) => {
    try {
      const wallet = String(req.query.wallet || '').trim();
      const mint = String(req.query.mint || '').trim();
      const network = req.query.network === 'devnet' ? 'devnet' : 'mainnet';
      const includeClosed = String(req.query.includeClosed || 'false') === 'true';
      const activeOnly = String(req.query.activeOnly || 'false') === 'true';
      const limit = Math.min(toPositiveInt(req.query.limit, 200), 500);

      if (!wallet) {
        res.status(400).json({ success: false, error: 'wallet is required' });
        return;
      }

      const filter = { wallet, network };
      if (mint) filter.mint = mint;
      if (!includeClosed) filter.closed = false;

      let items = await StreamflowLock.find(filter).sort({ unlockAtUnix: 1 }).limit(limit).lean();

      if (activeOnly) {
        const atUnix = nowUnix();
        items = items.filter((d) => isLockActive(d, atUnix));
      }

      res.json({ success: true, data: items });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message || 'Failed to fetch locks' });
    }
  });

  return router;
}
