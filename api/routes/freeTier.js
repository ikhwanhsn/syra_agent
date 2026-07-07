/**
 * Free-tier onboarding funnel — zero USDC entry points that upsell paid intelligence.
 * Listed in OpenAPI + /.well-known/x402 instructions as free catalog.
 */
import express from 'express';
import { buildPillarsDiscovery } from '../config/pillars.js';
import { ANSEM_MINT } from '../config/multiWalletRecovery.js';
import { fetchAssetsBoard } from '../libs/tokensBoardService.js';
import { buildMintDossier } from '../libs/tokensDossierService.js';
import { buildAnsemCommunitySnapshot } from '../libs/ansemCommunityService.js';
import { resolveAnsemHolderCount, getAnsemHolderCountLastKnown } from '../libs/ansemHolderCountService.js';
import { getAnsemEngagementLeaderboard } from '../libs/ansemEngagementService.js';

const router = express.Router();

const ANSEM_COMMUNITY_CACHE_MS = 15 * 60_000;
/** @type {{ data: object; expires: number; cachedAt: string } | null} */
let ansemCommunityCache = null;

/** Bust stale cache shape from older builds. */
const ANSEM_COMMUNITY_CACHE_VERSION = 4;

const ANSEM_HOLDER_COUNT_CACHE_MS = 90_000;
const ANSEM_HOLDER_COUNT_NULL_CACHE_MS = 15_000;
/** @type {{ count: number | null; source: string | null; expires: number } | null} */
let ansemHolderCountCache = null;
router.get('/pillars', async (_req, res) => {
  try {
    const pillars = await buildPillarsDiscovery();
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.json({
      success: true,
      tier: 'free',
      data: {
        narrative: 'Machine Money for Agents',
        pillars,
        upsell: 'Deep intelligence routes (signal, brain, dossier forensics) are x402 paid — see GET /.well-known/x402',
      },
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e instanceof Error ? e.message : String(e) });
  }
});

router.get('/assets', async (req, res) => {
  try {
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
    const board = await fetchAssetsBoard({ limit });
    res.setHeader('Cache-Control', 'public, max-age=120');
    res.json({
      success: true,
      tier: 'free',
      data: {
        assets: (board?.assets ?? board?.items ?? []).slice(0, limit),
        upsell: 'Full asset dossier: GET /assets/detail (x402) or /agent/tokens/dossier',
      },
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e instanceof Error ? e.message : String(e) });
  }
});

router.get('/coingecko/price', async (req, res) => {
  const ids = typeof req.query.ids === 'string' ? req.query.ids : 'bitcoin,ethereum,solana';
  try {
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(ids)}&vs_currencies=usd`;
    const upstream = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(8_000),
    });
    if (!upstream.ok) {
      return res.status(502).json({ success: false, error: 'coingecko_unavailable' });
    }
    const prices = await upstream.json();
    res.setHeader('Cache-Control', 'public, max-age=60');
    res.json({
      success: true,
      tier: 'free',
      data: { prices, source: 'coingecko', upsell: 'Scout + signals: GET /coingecko, /signal (x402)' },
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e instanceof Error ? e.message : String(e) });
  }
});

router.get('/dossier/basic', async (req, res) => {
  const mint = typeof req.query.mint === 'string' ? req.query.mint.trim() : '';
  if (!mint || mint.length < 32) {
    return res.status(400).json({ success: false, error: 'mint query param required (Solana mint)' });
  }
  try {
    const result = await buildMintDossier({ mint });
    if (!result.ok) {
      return res.status(result.status ?? 502).json({ success: false, error: result.error });
    }
    const full = result.data ?? {};
    const basic = {
      mint: full.mint ?? mint,
      symbol: full.symbol ?? null,
      name: full.name ?? null,
      priceUsd: full.priceUsd ?? full.price?.usd ?? null,
      marketCapUsd: full.marketCapUsd ?? null,
      volume24hUsd: full.volume24hUsd ?? null,
      holders: full.holders ?? full.holderCount ?? null,
      imageUrl: full.imageUrl ?? full.logo ?? null,
    };
    res.setHeader('Cache-Control', 'public, max-age=90');
    res.json({
      success: true,
      tier: 'free',
      data: basic,
      upsell: 'Deep forensics (KOL shills, snipers, overlap): paid /agent/tokens/* and x402 /pumpfun/analyzer',
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e instanceof Error ? e.message : String(e) });
  }
});

/** Fast holder count — independent of heavy community snapshot. */
router.get('/ansem/holder-count', async (_req, res) => {
  try {
    const now = Date.now();
    if (ansemHolderCountCache && ansemHolderCountCache.expires > now) {
      const maxAge = Math.max(15, Math.floor((ansemHolderCountCache.expires - now) / 1000));
      res.setHeader('Cache-Control', `public, max-age=${maxAge}`);
      return res.json({
        success: true,
        tier: 'free',
        data: {
          mint: ANSEM_MINT,
          count: ansemHolderCountCache.count,
          source: ansemHolderCountCache.source,
        },
      });
    }

    const result = await resolveAnsemHolderCount(ANSEM_MINT);
    const count =
      result.count != null && result.count > 0
        ? result.count
        : getAnsemHolderCountLastKnown() ?? ansemHolderCountCache?.count ?? null;
    const source =
      result.count != null && result.count > 0
        ? result.source
        : count != null
          ? 'cache'
          : null;
    const ttl =
      count != null && count > 0 ? ANSEM_HOLDER_COUNT_CACHE_MS : ANSEM_HOLDER_COUNT_NULL_CACHE_MS;
    ansemHolderCountCache = {
      count,
      source,
      expires: now + ttl,
    };
    res.setHeader('Cache-Control', `public, max-age=${Math.floor(ttl / 1000)}`);
    return res.json({
      success: true,
      tier: 'free',
      data: {
        mint: ANSEM_MINT,
        count,
        source,
        stale: result.stale === true,
      },
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e instanceof Error ? e.message : String(e) });
  }
});

/** Public $ANSEM engagement leaderboard (checks require wallet auth). */
router.get('/ansem/engagement/leaderboard', async (req, res) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 100);
    const data = await getAnsemEngagementLeaderboard({ limit });
    res.setHeader('Cache-Control', 'public, max-age=60');
    return res.json({ success: true, tier: 'free', data });
  } catch (e) {
    res.status(500).json({ success: false, error: e instanceof Error ? e.message : String(e) });
  }
});

/** Public $ANSEM hub — holder pulse, safety, KOL radar (cached, no wallet quota). */
router.get('/ansem/community', async (_req, res) => {
  try {
    const now = Date.now();
    if (
      ansemCommunityCache &&
      ansemCommunityCache.version === ANSEM_COMMUNITY_CACHE_VERSION &&
      ansemCommunityCache.expires > now
    ) {
      const maxAge = Math.max(30, Math.floor((ansemCommunityCache.expires - now) / 1000));
      res.setHeader('Cache-Control', `public, max-age=${maxAge}`);
      return res.json({
        success: true,
        tier: 'free',
        data: ansemCommunityCache.data,
        cachedAt: ansemCommunityCache.cachedAt,
      });
    }

    const data = await buildAnsemCommunitySnapshot(ANSEM_MINT);

    const cachedAt = data.fetchedAt;
    ansemCommunityCache = {
      version: ANSEM_COMMUNITY_CACHE_VERSION,
      data,
      expires: now + ANSEM_COMMUNITY_CACHE_MS,
      cachedAt,
    };
    res.setHeader('Cache-Control', `public, max-age=${Math.floor(ANSEM_COMMUNITY_CACHE_MS / 1000)}`);
    return res.json({
      success: true,
      tier: 'free',
      data,
      cachedAt,
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e instanceof Error ? e.message : String(e) });
  }
});

export function createFreeTierRouter() {
  return router;
}

export default router;
