import { Router } from 'express';
import connectMongoose from '../config/mongoose.js';
import StreamflowLock from '../models/StreamflowLock.js';
import { sumAmountRaw, computeOperatorStats } from '../services/streamflowLockAggregates.js';

function toPositiveInt(value, fallback) {
  const n = Number.parseInt(String(value ?? ''), 10);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return n;
}

function normalizeLockPayload(payload) {
  const p = payload || {};
  const streamId = String(p.streamId || '').trim();
  const txId = String(p.txId || '').trim();
  const wallet = String(p.wallet || '').trim();
  const mint = String(p.mint || '').trim();
  const tokenSymbol = String(p.tokenSymbol || 'TOKEN').trim() || 'TOKEN';
  const decimals = Number(p.decimals);
  const amountRaw = String(p.amountRaw || '').trim();
  const amountFormatted = String(p.amountFormatted || '').trim();
  const unlockedRaw = String(p.unlockedRaw || '0').trim();
  const unlockedFormatted = String(p.unlockedFormatted || '0').trim();
  const withdrawnRaw = String(p.withdrawnRaw || '0').trim();
  const withdrawnFormatted = String(p.withdrawnFormatted || '0').trim();
  const unlockAtUnix = Number(p.unlockAtUnix);
  const unlockAtIso = String(p.unlockAtIso || '').trim();
  const network = p.network === 'devnet' ? 'devnet' : 'mainnet';
  const source = p.source === 'onchain_sync' ? 'onchain_sync' : 'app';

  if (!streamId || !txId || !wallet || !mint || !amountRaw || !amountFormatted) {
    throw new Error('Missing required fields');
  }
  if (!Number.isFinite(decimals) || decimals < 0) {
    throw new Error('Invalid decimals');
  }
  if (!Number.isFinite(unlockAtUnix) || unlockAtUnix <= 0 || !unlockAtIso) {
    throw new Error('Invalid unlockAt values');
  }

  return {
    streamId,
    txId,
    wallet,
    sender: p.sender ? String(p.sender).trim() : null,
    recipient: p.recipient ? String(p.recipient).trim() : null,
    mint,
    tokenSymbol,
    decimals,
    amountRaw,
    amountFormatted,
    unlockedRaw,
    unlockedFormatted,
    withdrawnRaw,
    withdrawnFormatted,
    unlockAtUnix,
    unlockAtIso,
    network,
    source,
    closed: Boolean(p.closed),
    metadata: p.metadata && typeof p.metadata === 'object' ? p.metadata : null,
  };
}

export async function createStreamflowLocksRouter() {
  await connectMongoose();
  const router = Router();

  router.post('/upsert', async (req, res) => {
    try {
      const normalized = normalizeLockPayload(req.body || {});
      const doc = await StreamflowLock.findOneAndUpdate(
        { streamId: normalized.streamId },
        { $set: normalized },
        { upsert: true, new: true }
      ).lean();

      res.json({ success: true, data: doc });
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

      const ops = items.map((item) => {
        const normalized = normalizeLockPayload(item);
        return {
          updateOne: {
            filter: { streamId: normalized.streamId },
            update: { $set: normalized },
            upsert: true,
          },
        };
      });

      const result = await StreamflowLock.bulkWrite(ops, { ordered: false });
      res.json({ success: true, data: result });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message || 'Bulk upsert failed' });
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
      const filter = { mint, network, closed: false };
      const locks = await StreamflowLock.find(filter).select('amountRaw').lean();
      const openLockCount = locks.length;
      const totalAmountRaw = sumAmountRaw(locks);
      res.json({
        success: true,
        data: {
          network,
          mint,
          openLockCount,
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
      const limit = Math.min(toPositiveInt(req.query.limit, 200), 500);

      if (!wallet) {
        res.status(400).json({ success: false, error: 'wallet is required' });
        return;
      }

      const filter = { wallet, network };
      if (mint) filter.mint = mint;
      if (!includeClosed) filter.closed = false;

      const items = await StreamflowLock.find(filter).sort({ unlockAtUnix: 1 }).limit(limit).lean();
      res.json({ success: true, data: items });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message || 'Failed to fetch locks' });
    }
  });

  return router;
}
