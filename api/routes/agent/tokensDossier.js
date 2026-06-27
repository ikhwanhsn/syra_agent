import express from 'express';
import { buildMintDossier } from '../../libs/tokensDossierService.js';
import { buildAssetIntelligence } from '../../libs/assetIntelligenceService.js';
import { buildMemecoinAnalysis } from '../../libs/memecoinAnalysisService.js';
import { buildHolderOverlapBatch } from '../../libs/holderOverlapService.js';
import { buildHolderInsights } from '../../libs/holderInsightsService.js';
import {
  getMemecoinAnalysisQuotaStatus,
  tryConsumeMemecoinAnalysisScan,
  buildMemecoinAnalysisDailyLimitMessage,
} from '../../libs/memecoinAnalysisDailyLimit.js';
import {
  recordPumpfunScan,
  getPumpfunScanHistory,
  getPumpfunScanByCallId,
  getPumpfunCallerLeaderboard,
  getPumpfunLiveCalls,
  extractScanSnapshotFromAnalysis,
  resolveCallerWallet,
} from '../../libs/pumpfunScanHistoryService.js';
import { optionalWalletSession, requireSession } from '../../utils/requireSession.js';
import { fetchAssetsBoard } from '../../libs/tokensBoardService.js';
import { runTokensAgentTool } from '../../libs/tokensAgentService.js';

/** @param {string} s */
function isLikelySolanaMint(s) {
  const t = typeof s === 'string' ? s.trim() : '';
  if (t.length < 32 || t.length > 44) return false;
  return /^[1-9A-HJ-NP-Za-km-z]+$/.test(t);
}

/** @param {unknown} raw */
function normalizeSearchHit(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const row = /** @type {Record<string, unknown>} */ (raw);
  const assetId = String(row.assetId ?? row.id ?? row.asset_id ?? '').trim();
  const name = String(row.name ?? row.label ?? '').trim();
  const symbol = String(row.symbol ?? row.ticker ?? name ?? assetId).trim();
  if (!assetId && !symbol) return null;
  return {
    assetId: assetId || symbol.toLowerCase(),
    name: name || symbol,
    symbol: symbol || assetId,
    ref: typeof row.ref === 'string' ? row.ref : undefined,
    imageUrl: typeof row.imageUrl === 'string' ? row.imageUrl : undefined,
    category: typeof row.category === 'string' ? row.category : undefined,
  };
}

/** @param {unknown} body */
function extractSearchHits(body) {
  if (!body || typeof body !== 'object') return [];
  const root = /** @type {Record<string, unknown>} */ (body);
  const data = root.data;
  /** @type {unknown[]} */
  const candidates = [];

  if (Array.isArray(data)) candidates.push(...data);
  else if (data && typeof data === 'object') {
    const d = /** @type {Record<string, unknown>} */ (data);
    if (Array.isArray(d.assets)) candidates.push(...d.assets);
    else if (Array.isArray(d.items)) candidates.push(...d.items);
    else if (Array.isArray(d.results)) candidates.push(...d.results);
  }
  if (Array.isArray(root.assets)) candidates.push(...root.assets);
  if (Array.isArray(root.items)) candidates.push(...root.items);

  const seen = new Set();
  /** @type {ReturnType<typeof normalizeSearchHit>[]} */
  const hits = [];
  for (const c of candidates) {
    const hit = normalizeSearchHit(c);
    if (!hit) continue;
    const key = hit.assetId.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    hits.push(hit);
  }
  return hits;
}

/**
 * Dashboard Mint Dossier — free aggregated Tokens.xyz read (server API key).
 * GET /agent/tokens/dossier?ref=btc | ?mint=<solana> | ?assetId=bitcoin
 */
export function createTokensDossierRouter() {
  const router = express.Router();
  router.use(optionalWalletSession());

  router.get('/search', async (req, res) => {
    try {
      const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
      const limitRaw = typeof req.query.limit === 'string' ? parseInt(req.query.limit, 10) : 8;
      const limit = Number.isFinite(limitRaw) ? Math.min(20, Math.max(1, limitRaw)) : 8;

      if (!q || q.length < 2) {
        return res.json({ success: true, data: { items: [] } });
      }

      const result = await runTokensAgentTool('tokens-assets-search', {
        q,
        limit: String(limit),
      });

      if (!result.ok) {
        return res.status(result.status ?? 502).json({
          success: false,
          error: result.error || 'Asset search failed',
          ...(result.requestId && { requestId: result.requestId }),
        });
      }

      const items = extractSearchHits(result.data).slice(0, limit);
      return res.json({ success: true, data: { items } });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Asset search failed';
      return res.status(500).json({ success: false, error: message });
    }
  });

  router.get('/board', async (req, res) => {
    try {
      const list = typeof req.query.list === 'string' ? req.query.list.trim() : 'all';
      const groupBy = typeof req.query.groupBy === 'string' ? req.query.groupBy.trim() : 'asset';
      const maxPagesRaw =
        typeof req.query.maxPages === 'string' ? parseInt(req.query.maxPages, 10) : undefined;
      const maxPages = Number.isFinite(maxPagesRaw) ? maxPagesRaw : undefined;

      const result = await fetchAssetsBoard({ list, groupBy, maxPages });
      if (!result.ok) {
        return res.status(result.status ?? 502).json({
          success: false,
          error: result.error || 'Assets board failed',
          ...(result.requestId && { requestId: result.requestId }),
        });
      }
      return res.json({ success: true, data: result.data });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Assets board failed';
      return res.status(500).json({ success: false, error: message });
    }
  });

  router.get('/intelligence', async (req, res) => {
    try {
      const ref = typeof req.query.ref === 'string' ? req.query.ref : undefined;
      const mint = typeof req.query.mint === 'string' ? req.query.mint : undefined;
      const assetId = typeof req.query.assetId === 'string' ? req.query.assetId : undefined;
      const symbol = typeof req.query.symbol === 'string' ? req.query.symbol : undefined;
      const name = typeof req.query.name === 'string' ? req.query.name : undefined;
      const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';

      let input = { ref, mint, assetId, symbol, name };
      if (!ref && !mint && !assetId && q) {
        if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(q)) {
          input = { mint: q };
        } else if (q.includes('-') && q.startsWith('solana-')) {
          input = { assetId: q };
        } else {
          input = { ref: q };
        }
      }

      const result = await buildAssetIntelligence(input);
      if (!result.ok) {
        return res.status(result.status ?? 502).json({
          success: false,
          error: result.error || 'Asset intelligence failed',
          ...(result.requestId && { requestId: result.requestId }),
        });
      }
      return res.json({ success: true, data: result.data });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Asset intelligence failed';
      return res.status(500).json({ success: false, error: message });
    }
  });

  router.get('/memecoin-analysis/quota', async (req, res) => {
    try {
      const wallet = resolveCallerWallet(req);
      if (!wallet) {
        return res.status(401).json({
          success: false,
          error: 'Connect your Solana wallet to scan tokens',
          data: { verifiedWallet: false, limit: 0, used: 0, remaining: 0, tier: 'locked' },
        });
      }
      const quota = await getMemecoinAnalysisQuotaStatus(req);
      return res.json({ success: true, data: quota });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Quota check failed';
      return res.status(500).json({ success: false, error: message });
    }
  });

  router.get('/memecoin-analysis/history', requireSession(), async (req, res) => {
    try {
      const wallet = resolveCallerWallet(req);
      if (!wallet) {
        return res.status(401).json({ success: false, error: 'wallet_required' });
      }
      const limitRaw =
        typeof req.query.limit === 'string' ? parseInt(req.query.limit, 10) : 30;
      const limit = Number.isFinite(limitRaw) ? limitRaw : 30;
      const refresh = req.query.refresh !== 'false';
      const history = await getPumpfunScanHistory(wallet, { limit, refresh });
      return res.json({ success: true, data: history });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'History fetch failed';
      return res.status(500).json({ success: false, error: message });
    }
  });

  router.get('/memecoin-analysis/live', async (req, res) => {
    try {
      const limitRaw =
        typeof req.query.limit === 'string' ? parseInt(req.query.limit, 10) : 20;
      const offsetRaw =
        typeof req.query.offset === 'string' ? parseInt(req.query.offset, 10) : 0;
      const limit = Number.isFinite(limitRaw) ? limitRaw : 20;
      const offset = Number.isFinite(offsetRaw) ? offsetRaw : 0;
      const feed = await getPumpfunLiveCalls({ limit, offset });
      return res.json({ success: true, data: feed });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Live feed fetch failed';
      return res.status(500).json({ success: false, error: message });
    }
  });

  router.get('/memecoin-analysis/callers', async (req, res) => {
    try {
      const limitRaw =
        typeof req.query.limit === 'string' ? parseInt(req.query.limit, 10) : 25;
      const limit = Number.isFinite(limitRaw) ? limitRaw : 25;
      const leaderboard = await getPumpfunCallerLeaderboard({ limit });
      return res.json({ success: true, data: leaderboard });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Leaderboard fetch failed';
      return res.status(500).json({ success: false, error: message });
    }
  });

  router.get('/memecoin-analysis/calls/:callId', async (req, res) => {
    try {
      const callId = typeof req.params.callId === 'string' ? req.params.callId.trim() : '';
      if (!callId) {
        return res.status(400).json({ success: false, error: 'call_id_required' });
      }
      const call = await getPumpfunScanByCallId(callId);
      if (!call) {
        return res.status(404).json({ success: false, error: 'call_not_found' });
      }
      return res.json({ success: true, data: call });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Call fetch failed';
      return res.status(500).json({ success: false, error: message });
    }
  });

  router.get('/holder-profit', async (req, res) => {
    try {
      const wallet = resolveCallerWallet(req);
      if (!wallet) {
        return res.status(401).json({
          success: false,
          error: 'Connect your Solana wallet to view holder profit.',
        });
      }

      const mint = typeof req.query.mint === 'string' ? req.query.mint.trim() : '';
      if (!mint || !isLikelySolanaMint(mint)) {
        return res.status(400).json({
          success: false,
          error: 'Provide a valid Solana mint address via ?mint=',
        });
      }

      /** @type {string[]} */
      const wallets = [];
      const rawWallets = req.query.wallets;
      if (typeof rawWallets === 'string') {
        wallets.push(
          ...rawWallets
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
        );
      }

      const result = await buildHolderInsights({ mint, wallets });
      if (!result.ok) {
        return res.status(result.status ?? 502).json({
          success: false,
          error: result.error || 'Holder profit lookup failed',
        });
      }

      return res.json({ success: true, data: result.data });
    } catch (err) {
      console.error('[holder-profit] failed:', err?.stack || err?.message || err);
      const message = err instanceof Error ? err.message : 'Holder profit lookup failed';
      return res.status(500).json({ success: false, error: message });
    }
  });

  router.get('/holder-overlap', async (req, res) => {
    try {
      const wallet = resolveCallerWallet(req);
      if (!wallet) {
        return res.status(401).json({
          success: false,
          error: 'Connect your Solana wallet to compare holder overlap.',
        });
      }

      const mintA = typeof req.query.mintA === 'string' ? req.query.mintA.trim() : '';

      /** @type {string[]} */
      const mintBs = [];
      const rawMintB = req.query.mintB;
      if (typeof rawMintB === 'string') {
        mintBs.push(
          ...rawMintB
            .split(/[\s,;]+/)
            .map((s) => s.trim())
            .filter(Boolean),
        );
      } else if (Array.isArray(rawMintB)) {
        for (const item of rawMintB) {
          if (typeof item === 'string') {
            mintBs.push(
              ...item
                .split(/[\s,;]+/)
                .map((s) => s.trim())
                .filter(Boolean),
            );
          }
        }
      }

      if (!mintA || !isLikelySolanaMint(mintA)) {
        return res.status(400).json({
          success: false,
          error: 'Provide a valid Solana mint address via ?mintA=',
        });
      }
      if (mintBs.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Provide at least one compare mint via ?mintB= (comma-separated for multiple)',
        });
      }

      const result = await buildHolderOverlapBatch({ mintA, mintBs });
      if (!result.ok) {
        return res.status(result.status ?? 502).json({
          success: false,
          error: result.error || 'Holder overlap analysis failed',
        });
      }

      return res.json({ success: true, data: result.data });
    } catch (err) {
      console.error('[holder-overlap] failed:', err?.stack || err?.message || err);
      const message = err instanceof Error ? err.message : 'Holder overlap analysis failed';
      return res.status(500).json({ success: false, error: message });
    }
  });

  router.get('/memecoin-analysis', async (req, res) => {
    try {
      const wallet = resolveCallerWallet(req);
      if (!wallet) {
        return res.status(401).json({
          success: false,
          error: 'Connect your Solana wallet to scan tokens. Sign in via the wallet button in the header.',
        });
      }

      const mint = typeof req.query.mint === 'string' ? req.query.mint.trim() : '';
      if (!mint || !isLikelySolanaMint(mint)) {
        return res.status(400).json({
          success: false,
          error: 'Provide a valid Solana mint address via ?mint=',
        });
      }

      const quota = await tryConsumeMemecoinAnalysisScan(req);
      if (!quota.allowed) {
        return res.status(429).json({
          success: false,
          error: buildMemecoinAnalysisDailyLimitMessage(quota),
          quota: {
            limit: quota.limit,
            used: quota.used,
            remaining: quota.remaining,
            tier: quota.tier,
            resetAt: quota.resetAt,
          },
        });
      }

      const result = await buildMemecoinAnalysis({ mint });
      if (!result.ok) {
        return res.status(result.status ?? 502).json({
          success: false,
          error: result.error || 'Memecoin analysis failed',
          ...(result.partial && { partial: result.partial }),
          quota: {
            limit: quota.limit,
            used: quota.used,
            remaining: quota.remaining,
            tier: quota.tier,
            resetAt: quota.resetAt,
          },
        });
      }
      let scanRecord = null;
      try {
        const snapshot = extractScanSnapshotFromAnalysis(result.data);
        scanRecord = await recordPumpfunScan({ callerWallet: wallet, ...snapshot });
      } catch (recordErr) {
        console.error('[memecoin-analysis] scan record failed:', recordErr?.message || recordErr);
      }

      return res.json({
        success: true,
        data: result.data,
        scanRecord,
        quota: {
          limit: quota.limit,
          used: quota.used,
          remaining: quota.remaining,
          tier: quota.tier,
          resetAt: quota.resetAt,
        },
      });
    } catch (err) {
      console.error('[memecoin-analysis] failed:', err?.stack || err?.message || err);
      const message = err instanceof Error ? err.message : 'Memecoin analysis failed';
      return res.status(500).json({ success: false, error: message });
    }
  });

  router.get('/dossier', async (req, res) => {
    try {
      const ref = typeof req.query.ref === 'string' ? req.query.ref : undefined;
      const mint = typeof req.query.mint === 'string' ? req.query.mint : undefined;
      const assetId = typeof req.query.assetId === 'string' ? req.query.assetId : undefined;
      const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';

      let input = { ref, mint, assetId };
      if (!ref && !mint && !assetId && q) {
        if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(q)) {
          input = { mint: q };
        } else if (q.includes('-') && q.startsWith('solana-')) {
          input = { assetId: q };
        } else {
          input = { ref: q };
        }
      }

      const result = await buildMintDossier(input);
      if (!result.ok) {
        return res.status(result.status ?? 502).json({
          success: false,
          error: result.error,
          ...(result.requestId && { requestId: result.requestId }),
        });
      }
      return res.json({ success: true, data: result.data });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Dossier request failed';
      return res.status(500).json({ success: false, error: message });
    }
  });

  return router;
}
