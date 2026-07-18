/**
 * Pumpfun Alpha scan history — records wallet calls and tracks gain multipliers.
 */
import crypto from 'crypto';
import PumpfunScanRecord from '../models/agent/PumpfunScanRecord.js';
import PumpfunLiveCall from '../models/agent/PumpfunLiveCall.js';
import { isMongooseConnected } from '../config/mongoose.js';
import { buildPumpfunMarketProfile } from './pumpfunCoinAnalysis.js';

export const PUMPFUN_LIVE_FEED_CAP = 100;

/** @param {number | null | undefined} scanMcap @param {number | null | undefined} currentMcap */
export function computeGainMultiplier(scanMcap, currentMcap) {
  if (
    scanMcap == null ||
    currentMcap == null ||
    !Number.isFinite(scanMcap) ||
    !Number.isFinite(currentMcap) ||
    scanMcap <= 0
  ) {
    return null;
  }
  return currentMcap / scanMcap;
}

function newCallId() {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 12);
}

/**
 * Immediate scan record for API response — DB persist runs in background.
 * @param {string} callerWallet
 * @param {ReturnType<typeof extractScanSnapshotFromAnalysis>} snapshot
 */
export function buildOptimisticScanRecordSummary(callerWallet, snapshot) {
  return {
    callId: newCallId(),
    callerWallet: callerWallet.trim(),
    mint: snapshot.mint,
    symbol: snapshot.symbol || 'TOKEN',
    name: snapshot.name || 'Token',
    imageUri: snapshot.imageUri ?? null,
    scanMarketCapUsd: snapshot.scanMarketCapUsd ?? null,
    peakGainMultiplier: 1,
    scannedAt: new Date().toISOString(),
  };
}

/**
 * @param {import('express').Request} req
 * @returns {string | null}
 */
export function resolveCallerWallet(req) {
  return req.user?.walletAddress?.trim() || null;
}

/**
 * @param {{
 *   callerWallet: string;
 *   mint: string;
 *   symbol?: string;
 *   name?: string;
 *   imageUri?: string | null;
 *   scanPriceUsd?: number | null;
 *   scanMarketCapUsd?: number | null;
 *   syraAlphaScore?: number;
 *   syraAlphaVerdict?: string;
 *   syraAlphaTone?: string;
 * }} input
 */
export async function recordPumpfunScan(input) {
  if (!isMongooseConnected()) return null;

  const callerWallet = input.callerWallet.trim();
  const mint = input.mint.trim();

  try {
    /** One call per wallet+mint — always keep the earliest scan as the call. */
    const existing = await PumpfunScanRecord.findOne({ callerWallet, mint })
      .sort({ scannedAt: 1 })
      .lean();

    if (existing) {
      const [refreshed] = await refreshScanMarketData([existing]);
      const result = refreshed ?? existing;
      await upsertLiveCallFeed(result);
      return result;
    }

    const callId = newCallId();
    const doc = await PumpfunScanRecord.create({
      callId,
      callerWallet,
      mint,
      symbol: input.symbol || 'TOKEN',
      name: input.name || 'Token',
      imageUri: input.imageUri || null,
      scanPriceUsd: input.scanPriceUsd ?? null,
      scanMarketCapUsd: input.scanMarketCapUsd ?? null,
      currentMarketCapUsd: input.scanMarketCapUsd ?? null,
      peakMarketCapUsd: input.scanMarketCapUsd ?? null,
      gainMultiplier: 1,
      peakGainMultiplier: 1,
      syraAlphaScore: input.syraAlphaScore ?? 0,
      syraAlphaVerdict: input.syraAlphaVerdict ?? '',
      syraAlphaTone: input.syraAlphaTone ?? 'warning',
      scannedAt: new Date(),
      lastRefreshedAt: new Date(),
    });

    const created = doc.toObject();
    await upsertLiveCallFeed(created);
    return created;
  } catch (e) {
    console.error('[pumpfunScanHistory] recordPumpfunScan failed:', e?.message || e);
    return null;
  }
}

/**
 * @param {Record<string, unknown>} row
 */
function serializeLiveCall(row) {
  return {
    callId: row.callId,
    callerWallet: row.callerWallet,
    mint: row.mint,
    symbol: row.symbol,
    name: row.name,
    imageUri: row.imageUri,
    scanMarketCapUsd: row.scanMarketCapUsd,
    peakGainMultiplier: row.peakGainMultiplier,
    syraAlphaScore: row.syraAlphaScore,
    syraAlphaVerdict: row.syraAlphaVerdict,
    syraAlphaTone: row.syraAlphaTone,
    scannedAt: row.scannedAt,
    feedAt: row.feedAt,
  };
}

/**
 * Push scan to global live feed and trim to {@link PUMPFUN_LIVE_FEED_CAP} entries.
 * @param {Record<string, unknown>} scanRecord
 */
export async function upsertLiveCallFeed(scanRecord) {
  if (!isMongooseConnected() || !scanRecord?.callId) return;

  const now = new Date();
  try {
    await PumpfunLiveCall.findOneAndUpdate(
      { callId: String(scanRecord.callId) },
      {
        $set: {
          callId: scanRecord.callId,
          callerWallet: scanRecord.callerWallet,
          mint: scanRecord.mint,
          symbol: scanRecord.symbol ?? 'TOKEN',
          name: scanRecord.name ?? 'Token',
          imageUri: scanRecord.imageUri ?? null,
          scanMarketCapUsd: scanRecord.scanMarketCapUsd ?? null,
          peakGainMultiplier: scanRecord.peakGainMultiplier ?? scanRecord.gainMultiplier ?? null,
          syraAlphaScore: scanRecord.syraAlphaScore ?? 0,
          syraAlphaVerdict: scanRecord.syraAlphaVerdict ?? '',
          syraAlphaTone: scanRecord.syraAlphaTone ?? 'warning',
          scannedAt: scanRecord.scannedAt ?? now,
          feedAt: now,
        },
      },
      { upsert: true },
    );

    const count = await PumpfunLiveCall.countDocuments();
    if (count > PUMPFUN_LIVE_FEED_CAP) {
      const trim = count - PUMPFUN_LIVE_FEED_CAP;
      const oldest = await PumpfunLiveCall.find()
        .sort({ feedAt: 1 })
        .limit(trim)
        .select('_id')
        .lean();
      if (oldest.length > 0) {
        await PumpfunLiveCall.deleteMany({ _id: { $in: oldest.map((d) => d._id) } });
      }
    }
  } catch (e) {
    console.error('[pumpfunScanHistory] upsertLiveCallFeed failed:', e?.message || e);
  }
}

/**
 * @param {{ limit?: number; offset?: number }} opts
 */
export async function getPumpfunLiveCalls(opts = {}) {
  if (!isMongooseConnected()) {
    return { items: [], total: 0, hasMore: false };
  }

  const limit = Math.min(25, Math.max(1, opts.limit ?? 20));
  const offset = Math.max(0, opts.offset ?? 0);

  try {
    const [total, rows] = await Promise.all([
      PumpfunLiveCall.countDocuments(),
      PumpfunLiveCall.find().sort({ feedAt: -1 }).skip(offset).limit(limit).lean(),
    ]);

    return {
      items: rows.map(serializeLiveCall),
      total,
      hasMore: offset + rows.length < total,
    };
  } catch (e) {
    console.error('[pumpfunScanHistory] getPumpfunLiveCalls failed:', e?.message || e);
    return { items: [], total: 0, hasMore: false };
  }
}

/**
 * @param {Record<string, unknown>} row
 */
function serializeScanRecord(row) {
  return {
    callId: row.callId,
    callerWallet: row.callerWallet,
    mint: row.mint,
    symbol: row.symbol,
    name: row.name,
    imageUri: row.imageUri,
    scanPriceUsd: row.scanPriceUsd,
    scanMarketCapUsd: row.scanMarketCapUsd,
    currentMarketCapUsd: row.currentMarketCapUsd,
    peakMarketCapUsd: row.peakMarketCapUsd,
    gainMultiplier: row.gainMultiplier,
    peakGainMultiplier: row.peakGainMultiplier,
    syraAlphaScore: row.syraAlphaScore,
    syraAlphaVerdict: row.syraAlphaVerdict,
    syraAlphaTone: row.syraAlphaTone,
    scannedAt: row.scannedAt,
    lastRefreshedAt: row.lastRefreshedAt,
  };
}

/**
 * Refresh market caps for a batch of scan records (max 20 concurrent profile fetches).
 * @param {Array<Record<string, unknown>>} rows
 */
async function refreshScanMarketData(rows) {
  const now = new Date();
  const updates = [];

  await Promise.all(
    rows.map(async (row) => {
      try {
        const profile = await buildPumpfunMarketProfile(String(row.mint));
        if (!profile.ok || !profile.data) return;

        const currentMcap = profile.data.marketCapUsd ?? null;
        const athMcap = profile.data.athMarketCapUsd ?? currentMcap;
        const scanMcap = row.scanMarketCapUsd;

        const gainMultiplier = computeGainMultiplier(scanMcap, currentMcap);
        const peakGainMultiplier = computeGainMultiplier(scanMcap, athMcap);

        const peakMarketCapUsd =
          row.peakMarketCapUsd != null && athMcap != null
            ? Math.max(row.peakMarketCapUsd, athMcap)
            : athMcap ?? row.peakMarketCapUsd;

        const nextPeakGain = computeGainMultiplier(scanMcap, peakMarketCapUsd);

        updates.push({
          callId: row.callId,
          currentMarketCapUsd: currentMcap,
          peakMarketCapUsd,
          gainMultiplier: gainMultiplier ?? row.gainMultiplier,
          peakGainMultiplier:
            nextPeakGain != null
              ? Math.max(nextPeakGain, row.peakGainMultiplier ?? 1)
              : row.peakGainMultiplier,
          lastRefreshedAt: now,
          symbol: profile.data.symbol || row.symbol,
          name: profile.data.name || row.name,
          imageUri: profile.data.imageUri || row.imageUri,
        });
      } catch {
        /* skip failed refresh */
      }
    }),
  );

  if (updates.length === 0) return rows;

  await Promise.all(
    updates.map((u) =>
      PumpfunScanRecord.updateOne(
        { callId: u.callId },
        {
          $set: {
            currentMarketCapUsd: u.currentMarketCapUsd,
            peakMarketCapUsd: u.peakMarketCapUsd,
            gainMultiplier: u.gainMultiplier,
            peakGainMultiplier: u.peakGainMultiplier,
            lastRefreshedAt: u.lastRefreshedAt,
            symbol: u.symbol,
            name: u.name,
            imageUri: u.imageUri,
          },
        },
      ),
    ),
  );

  const byId = new Map(updates.map((u) => [u.callId, u]));
  return rows.map((row) => {
    const patch = byId.get(row.callId);
    if (!patch) return row;
    return { ...row, ...patch };
  });
}

/**
 * @param {string} callerWallet
 * @param {{ limit?: number; refresh?: boolean }} opts
 */
export async function getPumpfunScanHistory(callerWallet, opts = {}) {
  if (!isMongooseConnected()) return [];

  const limit = Math.min(50, Math.max(1, opts.limit ?? 30));
  try {
    /** One row per mint — earliest scan is the call; list newest calls first. */
    const rows = await PumpfunScanRecord.aggregate([
      { $match: { callerWallet: callerWallet.trim() } },
      { $sort: { scannedAt: 1 } },
      {
        $group: {
          _id: '$mint',
          callId: { $first: '$callId' },
          callerWallet: { $first: '$callerWallet' },
          mint: { $first: '$mint' },
          symbol: { $first: '$symbol' },
          name: { $first: '$name' },
          imageUri: { $first: '$imageUri' },
          scanPriceUsd: { $first: '$scanPriceUsd' },
          scanMarketCapUsd: { $first: '$scanMarketCapUsd' },
          currentMarketCapUsd: { $first: '$currentMarketCapUsd' },
          peakMarketCapUsd: { $max: '$peakMarketCapUsd' },
          gainMultiplier: { $max: '$gainMultiplier' },
          peakGainMultiplier: { $max: '$peakGainMultiplier' },
          syraAlphaScore: { $first: '$syraAlphaScore' },
          syraAlphaVerdict: { $first: '$syraAlphaVerdict' },
          syraAlphaTone: { $first: '$syraAlphaTone' },
          scannedAt: { $first: '$scannedAt' },
          lastRefreshedAt: { $max: '$lastRefreshedAt' },
        },
      },
      { $sort: { scannedAt: -1 } },
      { $limit: limit },
    ]);

    const shouldRefresh =
      opts.refresh !== false &&
      rows.some((r) => {
        if (!r.lastRefreshedAt) return true;
        return Date.now() - new Date(r.lastRefreshedAt).getTime() > 5 * 60_000;
      });

    const refreshed = shouldRefresh ? await refreshScanMarketData(rows) : rows;
    return refreshed.map(serializeScanRecord);
  } catch (e) {
    console.error('[pumpfunScanHistory] getPumpfunScanHistory failed:', e?.message || e);
    return [];
  }
}

/**
 * @param {string} callId
 */
export async function getPumpfunScanByCallId(callId) {
  if (!isMongooseConnected()) return null;
  try {
    const row = await PumpfunScanRecord.findOne({ callId: callId.trim() }).lean();
    if (!row) return null;
    const [refreshed] = await refreshScanMarketData([row]);
    return serializeScanRecord(refreshed ?? row);
  } catch (e) {
    console.error('[pumpfunScanHistory] getPumpfunScanByCallId failed:', e?.message || e);
    return null;
  }
}

/**
 * @param {{ limit?: number; minGain?: number }} opts
 */
export async function getPumpfunCallerLeaderboard(opts = {}) {
  if (!isMongooseConnected()) return [];

  const limit = Math.min(50, Math.max(1, opts.limit ?? 25));
  const minGain = opts.minGain ?? 1;

  try {
    const pipeline = [
    {
      $group: {
        _id: '$callerWallet',
        totalCalls: { $sum: 1 },
        bestPeakGain: { $max: '$peakGainMultiplier' },
        bestCurrentGain: { $max: '$gainMultiplier' },
        avgPeakGain: { $avg: '$peakGainMultiplier' },
        calls10x: {
          $sum: { $cond: [{ $gte: ['$peakGainMultiplier', 10] }, 1, 0] },
        },
        calls100x: {
          $sum: { $cond: [{ $gte: ['$peakGainMultiplier', 100] }, 1, 0] },
        },
        lastCallAt: { $max: '$scannedAt' },
        topCall: {
          $top: {
            output: {
              callId: '$callId',
              mint: '$mint',
              symbol: '$symbol',
              name: '$name',
              imageUri: '$imageUri',
              peakGainMultiplier: '$peakGainMultiplier',
              scanMarketCapUsd: '$scanMarketCapUsd',
              peakMarketCapUsd: '$peakMarketCapUsd',
              scannedAt: '$scannedAt',
            },
            sortBy: { peakGainMultiplier: -1 },
          },
        },
      },
    },
    { $match: { bestPeakGain: { $gte: minGain } } },
    { $sort: { bestPeakGain: -1, totalCalls: -1 } },
    { $limit: limit },
  ];

    const rows = await PumpfunScanRecord.aggregate(pipeline);

    return rows.map((row, index) => ({
      rank: index + 1,
      callerWallet: row._id,
      totalCalls: row.totalCalls,
      bestPeakGain: row.bestPeakGain,
      bestCurrentGain: row.bestCurrentGain,
      avgPeakGain: row.avgPeakGain,
      calls10x: row.calls10x,
      calls100x: row.calls100x,
      lastCallAt: row.lastCallAt,
      topCall: row.topCall,
    }));
  } catch (e) {
    console.error('[pumpfunScanHistory] getPumpfunCallerLeaderboard failed:', e?.message || e);
    return [];
  }
}

/**
 * Build scan record payload from memecoin analysis result.
 * @param {import('./memecoinAnalysisService.js').buildMemecoinAnalysis extends (...args: any) => Promise<{ ok: boolean; data?: any }> ? any : never} data
 */
export function extractScanSnapshotFromAnalysis(data) {
  const token = data.token && typeof data.token === 'object' ? data.token : null;
  const pumpfun = data.pumpfun?.ok ? data.pumpfun.data : null;
  const market = data.market ?? {};
  return {
    mint: data.mint,
    symbol: token?.symbol ?? pumpfun?.symbol ?? 'TOKEN',
    name: token?.name ?? pumpfun?.name ?? 'Token',
    imageUri: token?.imageUri ?? pumpfun?.imageUri ?? null,
    scanPriceUsd: market.priceUsd ?? pumpfun?.priceUsd ?? null,
    scanMarketCapUsd: market.marketCapUsd ?? pumpfun?.marketCapUsd ?? null,
    syraAlphaScore: data.syraAlpha?.score ?? 0,
    syraAlphaVerdict: data.syraAlpha?.verdict ?? '',
    syraAlphaTone: data.syraAlpha?.tone ?? 'warning',
  };
}
