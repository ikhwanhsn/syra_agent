import express from 'express';
import { buildMintDossier, buildMintChart } from '../../libs/tokensDossierService.js';
import { buildAssetIntelligence } from '../../libs/assetIntelligenceService.js';
import { buildMemecoinAnalysis } from '../../libs/memecoinAnalysisService.js';
import { fetchTokenKolShills } from '../../libs/tokenKolShillService.js';
import { buildSwapMarketNews } from '../../libs/swapMarketNews.js';
import { buildHolderOverlapBatch } from '../../libs/holderOverlapService.js';
import { buildHolderInsights } from '../../libs/holderInsightsService.js';
import { buildTokenDevInfo } from '../../libs/tokenDevInfoService.js';
import { buildTokenSnipers } from '../../libs/tokenSnipersService.js';
import { buildTokenTrades } from '../../libs/tokenTradesService.js';
import {
  getMemecoinAnalysisQuotaStatus,
  tryConsumeMemecoinAnalysisScan,
  buildMemecoinAnalysisDailyLimitMessage,
  resolveDeviceId,
} from '../../libs/memecoinAnalysisDailyLimit.js';
import {
  recordPumpfunScan,
  getPumpfunScanHistory,
  getPumpfunScanByCallId,
  getPumpfunCallerLeaderboard,
  getPumpfunLiveCalls,
  extractScanSnapshotFromAnalysis,
  resolveCallerWallet,
  buildOptimisticScanRecordSummary,
} from '../../libs/pumpfunScanHistoryService.js';
import { optionalWalletSession, requireSession } from '../../utils/requireSession.js';
import { fetchAssetsBoard } from '../../libs/tokensBoardService.js';
import { runTokensAgentTool } from '../../libs/tokensAgentService.js';
import { createBoundedTtlCache } from '../../utils/boundedTtlCache.js';

/** @param {string} s */
function isLikelySolanaMint(s) {
  const t = typeof s === 'string' ? s.trim() : '';
  if (t.length < 32 || t.length > 44) return false;
  return /^[1-9A-HJ-NP-Za-km-z]+$/.test(t);
}

const DEFAULT_TRADE_TAPE_LIMIT = 50;

function parsePositiveIntEnv(raw, fallback) {
  const n = Number.parseInt(String(raw ?? '').trim(), 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

/** Success / empty-result TTL for page-triggered X posts (~15 min). */
const X_POSTS_CACHE_TTL_MS = parsePositiveIntEnv(
  process.env.X_POSTS_CACHE_MS,
  900_000,
);
/** Negative TTL for upstream failures (~5 min) — avoids re-billing on errors. */
const X_POSTS_NEGATIVE_CACHE_TTL_MS = parsePositiveIntEnv(
  process.env.X_POSTS_NEGATIVE_CACHE_MS,
  300_000,
);
const X_POSTS_CACHE_MAX_AGE_SEC = Math.max(30, Math.floor(X_POSTS_CACHE_TTL_MS / 1000));
const X_POSTS_NEGATIVE_MAX_AGE_SEC = Math.max(30, Math.floor(X_POSTS_NEGATIVE_CACHE_TTL_MS / 1000));

const xPostsCache = createBoundedTtlCache({
  name: 'x-posts',
  maxEntries: parsePositiveIntEnv(process.env.X_POSTS_CACHE_MAX_ENTRIES, 500),
  defaultTtlMs: X_POSTS_CACHE_TTL_MS,
});

/**
 * @param {{ mint: string; symbol?: string; name?: string; twitter?: string }} params
 */
function xPostsCacheKey(params) {
  const mint = String(params.mint || '').trim().toLowerCase();
  const symbol = String(params.symbol || '').trim().toLowerCase();
  const name = String(params.name || '').trim().toLowerCase();
  const twitter = String(params.twitter || '').trim().toLowerCase().replace(/^@/, '');
  return `${mint}|${symbol}|${name}|${twitter}`;
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

  /**
   * GET /agent/tokens/chart?mint=<solana>
   * Fast swap-panel chart: resolve + OHLCV + profile only.
   */
  router.get('/chart', async (req, res) => {
    try {
      const mint = typeof req.query.mint === 'string' ? req.query.mint.trim() : '';
      if (!mint || !/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(mint)) {
        return res.status(400).json({ success: false, error: 'Valid Solana mint is required' });
      }

      const result = await buildMintChart({ mint });
      if (!result.ok) {
        return res.status(result.status ?? 502).json({
          success: false,
          error: result.error || 'Chart fetch failed',
          ...(result.requestId && { requestId: result.requestId }),
        });
      }
      return res.json({ success: true, data: result.data });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Chart fetch failed';
      return res.status(500).json({ success: false, error: message });
    }
  });

  /**
   * GET /agent/tokens/news?symbol=SOL&name=Solana&mint=<optional>
   * Fast swap-panel news — no resolve / signal / events.
   */
  router.get('/news', async (req, res) => {
    try {
      const mint = typeof req.query.mint === 'string' ? req.query.mint.trim() : undefined;
      const symbol = typeof req.query.symbol === 'string' ? req.query.symbol.trim() : undefined;
      const name = typeof req.query.name === 'string' ? req.query.name.trim() : undefined;

      const result = await buildSwapMarketNews({ mint, symbol, name });
      if (!result.ok) {
        return res.status(result.status ?? 502).json({
          success: false,
          error: result.error || 'News fetch failed',
        });
      }
      return res.json({ success: true, data: result.data });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'News fetch failed';
      return res.status(500).json({ success: false, error: message });
    }
  });

  /**
   * GET /agent/tokens/x-posts?mint=<solana>&symbol=SOL&name=Solana
   * Recent X posts mentioning the token (KOL / social radar, fast mode).
   * Bounded in-memory cache (~15 min success / ~5 min negative) to avoid
   * re-billing twitterapi.io on repeated page visits.
   */
  router.get('/x-posts', async (req, res) => {
    try {
      const mint = typeof req.query.mint === 'string' ? req.query.mint.trim() : '';
      const symbol = typeof req.query.symbol === 'string' ? req.query.symbol.trim() : undefined;
      const name = typeof req.query.name === 'string' ? req.query.name.trim() : undefined;
      const twitter = typeof req.query.twitter === 'string' ? req.query.twitter.trim() : undefined;

      if (!mint || !/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(mint)) {
        return res.status(400).json({ success: false, error: 'Valid Solana mint is required' });
      }

      const cacheKey = xPostsCacheKey({ mint, symbol, name, twitter });
      const cached = xPostsCache.get(cacheKey);
      if (
        cached &&
        typeof cached === 'object' &&
        'status' in /** @type {Record<string, unknown>} */ (cached) &&
        'body' in /** @type {Record<string, unknown>} */ (cached)
      ) {
        const entry = /** @type {{ status: number; body: unknown; maxAgeSec: number }} */ (cached);
        res.setHeader('Cache-Control', `public, max-age=${entry.maxAgeSec}`);
        return res.status(entry.status).json(entry.body);
      }

      const result = await fetchTokenKolShills(
        { mint, symbol, name, twitter },
        { fast: true },
      );

      if (!result.ok) {
        const status = result.status ?? 502;
        const body = {
          success: false,
          error: result.error || 'X posts fetch failed',
        };
        xPostsCache.set(
          cacheKey,
          { status, body, maxAgeSec: X_POSTS_NEGATIVE_MAX_AGE_SEC },
          X_POSTS_NEGATIVE_CACHE_TTL_MS,
        );
        res.setHeader('Cache-Control', `public, max-age=${X_POSTS_NEGATIVE_MAX_AGE_SEC}`);
        return res.status(status).json(body);
      }

      const kols = Array.isArray(result.data?.topKols) ? result.data.topKols : [];
      const posts = kols
        .filter((row) => row?.sampleTweet?.id && row?.sampleTweet?.text)
        .map((row) => ({
          id: row.sampleTweet.id,
          text: row.sampleTweet.text,
          url: row.sampleTweet.url,
          createdAt: row.sampleTweet.createdAt,
          engagement: row.sampleTweet.engagement,
          username: row.username,
          displayName: row.displayName,
          followers: row.followers,
          verified: row.verified,
          profileImageUrl: row.profileImageUrl ?? null,
        }))
        .sort((a, b) => (b.engagement ?? 0) - (a.engagement ?? 0))
        .slice(0, 8);

      const body = {
        success: true,
        data: {
          mint,
          posts,
          summary: result.data.summary ?? null,
          source: result.data.source ?? null,
          searchTerms: result.data.searchTerms ?? null,
          fetchedAt: new Date().toISOString(),
        },
      };

      // Empty results use the success TTL so quiet tokens don't re-hit the API.
      xPostsCache.set(
        cacheKey,
        { status: 200, body, maxAgeSec: X_POSTS_CACHE_MAX_AGE_SEC },
        X_POSTS_CACHE_TTL_MS,
      );
      res.setHeader('Cache-Control', `public, max-age=${X_POSTS_CACHE_MAX_AGE_SEC}`);
      return res.json(body);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'X posts fetch failed';
      return res.status(500).json({ success: false, error: message });
    }
  });

  router.get('/memecoin-analysis/quota', async (req, res) => {
    try {
      const wallet = resolveCallerWallet(req);
      const deviceId = resolveDeviceId(req);
      if (!wallet && !deviceId) {
        return res.status(400).json({
          success: false,
          error: 'device_id_required',
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
      const deviceId = resolveDeviceId(req);
      if (!wallet && !deviceId) {
        return res.status(400).json({
          success: false,
          error: 'Provide a device id or connect your Solana wallet to scan tokens.',
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
        const guestNeedsWallet = !wallet && quota.used > 0;
        return res.status(guestNeedsWallet ? 401 : 429).json({
          success: false,
          error: guestNeedsWallet
            ? 'Connect your Solana wallet to continue scanning. Your first daily scan was free.'
            : buildMemecoinAnalysisDailyLimitMessage(quota),
          quota: {
            limit: quota.limit,
            used: quota.used,
            remaining: quota.remaining,
            tier: quota.tier,
            resetAt: quota.resetAt,
          },
        });
      }

      const force = req.query.force === 'true';

      const result = await buildMemecoinAnalysis({ mint, force });
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

      const snapshot = extractScanSnapshotFromAnalysis(result.data);
      const scanRecord = wallet
        ? buildOptimisticScanRecordSummary(wallet, snapshot)
        : null;
      if (wallet) {
        void recordPumpfunScan({ callerWallet: wallet, ...snapshot }).catch((recordErr) => {
          console.error('[memecoin-analysis] scan record failed:', recordErr?.message || recordErr);
        });
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

  router.get('/dev-info', async (req, res) => {
    try {
      const wallet = resolveCallerWallet(req);
      if (!wallet) {
        return res.status(401).json({
          success: false,
          error: 'Connect your Solana wallet to view dev wallet info.',
        });
      }

      const mint = typeof req.query.mint === 'string' ? req.query.mint.trim() : '';
      if (!mint || !isLikelySolanaMint(mint)) {
        return res.status(400).json({
          success: false,
          error: 'Provide a valid Solana mint address via ?mint=',
        });
      }

      const result = await buildTokenDevInfo({ mint });
      if (!result.ok) {
        return res.status(result.status ?? 502).json({
          success: false,
          error: result.error || 'Dev info lookup failed',
        });
      }

      return res.json({ success: true, data: result.data });
    } catch (err) {
      console.error('[dev-info] failed:', err?.stack || err?.message || err);
      const message = err instanceof Error ? err.message : 'Dev info lookup failed';
      return res.status(500).json({ success: false, error: message });
    }
  });

  router.get('/snipers', async (req, res) => {
    try {
      const wallet = resolveCallerWallet(req);
      if (!wallet) {
        return res.status(401).json({
          success: false,
          error: 'Connect your Solana wallet to view sniper data.',
        });
      }

      const mint = typeof req.query.mint === 'string' ? req.query.mint.trim() : '';
      if (!mint || !isLikelySolanaMint(mint)) {
        return res.status(400).json({
          success: false,
          error: 'Provide a valid Solana mint address via ?mint=',
        });
      }

      const result = await buildTokenSnipers({ mint });
      if (!result.ok) {
        return res.status(result.status ?? 502).json({
          success: false,
          error: result.error || 'Sniper lookup failed',
        });
      }

      return res.json({ success: true, data: result.data });
    } catch (err) {
      console.error('[snipers] failed:', err?.stack || err?.message || err);
      const message = err instanceof Error ? err.message : 'Sniper lookup failed';
      return res.status(500).json({ success: false, error: message });
    }
  });

  router.get('/trades', async (req, res) => {
    try {
      const wallet = resolveCallerWallet(req);
      if (!wallet) {
        return res.status(401).json({
          success: false,
          error: 'Connect your Solana wallet to view trade tape.',
        });
      }

      const mint = typeof req.query.mint === 'string' ? req.query.mint.trim() : '';
      if (!mint || !isLikelySolanaMint(mint)) {
        return res.status(400).json({
          success: false,
          error: 'Provide a valid Solana mint address via ?mint=',
        });
      }

      const limitRaw =
        typeof req.query.limit === 'string' ? parseInt(req.query.limit, 10) : DEFAULT_TRADE_TAPE_LIMIT;
      const limit = Number.isFinite(limitRaw) ? limitRaw : DEFAULT_TRADE_TAPE_LIMIT;

      const result = await buildTokenTrades({ mint, limit });
      if (!result.ok) {
        return res.status(result.status ?? 502).json({
          success: false,
          error: result.error || 'Trade tape lookup failed',
        });
      }

      return res.json({ success: true, data: result.data });
    } catch (err) {
      console.error('[trades] failed:', err?.stack || err?.message || err);
      const message = err instanceof Error ? err.message : 'Trade tape lookup failed';
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
