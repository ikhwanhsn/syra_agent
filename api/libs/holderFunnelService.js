/**
 * Holder-growth funnel: snapshot DexScreener + staking metrics for public /api/metrics.
 *
 * Live pulse (Solana top-holders RPC + Streamflow) is best-effort with a short budget.
 * Prefer the latest Mongo snapshot so /api/metrics never waits on hung RPCs.
 */
import { isMongooseConnected } from "../config/mongoose.js";
import HolderFunnelSnapshot from "../models/HolderFunnelSnapshot.js";
import { SYRA_TOKEN_MINT } from "./syraToken.js";
import { gatherHolderPulseSnapshot } from "./syraHolderSnapshot.js";

const SNAPSHOT_MIN_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6h
const PULSE_BUDGET_MS = Math.max(
  800,
  Number.parseInt(process.env.PUBLIC_METRICS_HOLDER_PULSE_MS || "2500", 10) || 2_500,
);

function round(n, digits = 2) {
  const x = Number(n);
  if (!Number.isFinite(x)) return null;
  const m = 10 ** digits;
  return Math.round(x * m) / m;
}

/**
 * @template T
 * @param {Promise<T>} promise
 * @param {number} ms
 * @param {T} fallback
 * @returns {Promise<T>}
 */
function withBudget(promise, ms, fallback) {
  let timer;
  return Promise.race([
    Promise.resolve(promise).catch(() => fallback),
    new Promise((resolve) => {
      timer = setTimeout(() => resolve(fallback), ms);
      timer.unref?.();
    }),
  ]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

async function loadPulseData() {
  const out = await gatherHolderPulseSnapshot().catch(() => null);
  return out?.data ?? null;
}

function currentFromPulse(pulse) {
  if (!pulse) return null;
  return {
    mint: SYRA_TOKEN_MINT,
    marketCapUsd: round(pulse.marketCapUsd),
    liquidityUsd: round(pulse.price?.liquidityUsd),
    volume24hUsd: round(pulse.price?.volume24h),
    priceUsd: round(pulse.price?.priceUsd, 8),
    priceChange24hPct: round(pulse.price?.priceChange24h),
    topHoldersSampled: pulse.holders?.holders?.length ?? null,
    top10ConcentrationPct: round(pulse.holders?.top10ConcentrationPct),
    uniqueStakers: pulse.staking?.uniqueWallets ?? null,
    totalStakedFormatted: pulse.staking?.totalStakedFormatted ?? null,
    dexscreenerUrl: `https://dexscreener.com/solana/${SYRA_TOKEN_MINT}`,
  };
}

function currentFromDbRow(row) {
  if (!row) return null;
  return {
    mint: row.mint || SYRA_TOKEN_MINT,
    marketCapUsd: row.marketCapUsd ?? null,
    liquidityUsd: row.liquidityUsd ?? null,
    volume24hUsd: row.volume24hUsd ?? null,
    priceUsd: row.priceUsd ?? null,
    priceChange24hPct: row.priceChange24hPct ?? null,
    topHoldersSampled: null,
    top10ConcentrationPct: row.top10ConcentrationPct ?? null,
    uniqueStakers: row.uniqueStakers ?? null,
    totalStakedFormatted: row.totalStakedFormatted ?? null,
    dexscreenerUrl: `https://dexscreener.com/solana/${SYRA_TOKEN_MINT}`,
  };
}

/**
 * Persist a holder funnel snapshot if the last one is older than SNAPSHOT_MIN_INTERVAL_MS.
 * Safe to call from public metrics (best-effort, never throws).
 */
export async function maybeCaptureHolderFunnelSnapshot() {
  if (!isMongooseConnected()) return null;
  try {
    const latest = await HolderFunnelSnapshot.findOne({})
      .sort({ capturedAt: -1 })
      .select("capturedAt")
      .lean();
    if (
      latest?.capturedAt &&
      Date.now() - new Date(latest.capturedAt).getTime() < SNAPSHOT_MIN_INTERVAL_MS
    ) {
      return null;
    }

    const pulse = await loadPulseData();
    if (!pulse) return null;

    return HolderFunnelSnapshot.create({
      capturedAt: new Date(),
      mint: SYRA_TOKEN_MINT,
      holderCount: null,
      marketCapUsd: round(pulse.marketCapUsd),
      liquidityUsd: round(pulse.price?.liquidityUsd),
      volume24hUsd: round(pulse.price?.volume24h),
      priceUsd: round(pulse.price?.priceUsd, 8),
      priceChange24hPct: round(pulse.price?.priceChange24h),
      top10ConcentrationPct: round(pulse.holders?.top10ConcentrationPct),
      uniqueStakers: pulse.staking?.uniqueWallets ?? null,
      totalStakedFormatted: pulse.staking?.totalStakedFormatted ?? null,
      source: "holder_pulse",
    });
  } catch {
    return null;
  }
}

/**
 * Build public holders section for /api/metrics.
 */
export async function buildPublicHolderFunnelSnapshot() {
  const empty = {
    note:
      "Holder funnel tracks market structure and staking — not a promise of price. Captured from DexScreener + Streamflow when available.",
    current: null,
    history7d: [],
  };

  try {
    const latestPromise = isMongooseConnected()
      ? HolderFunnelSnapshot.findOne({})
          .sort({ capturedAt: -1 })
          .lean()
          .catch(() => null)
      : Promise.resolve(null);

    const historyPromise = isMongooseConnected()
      ? HolderFunnelSnapshot.find({
          capturedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        })
          .sort({ capturedAt: 1 })
          .limit(28)
          .lean()
          .catch(() => [])
      : Promise.resolve([]);

    const pulsePromise = withBudget(loadPulseData(), PULSE_BUDGET_MS, null);

    const [latest, history, pulse] = await Promise.all([
      latestPromise,
      historyPromise,
      pulsePromise,
    ]);

    // Refresh snapshot off the request path when live pulse succeeded.
    if (pulse && isMongooseConnected()) {
      maybeCaptureHolderFunnelSnapshot().catch(() => {});
    }

    const current = currentFromPulse(pulse) || currentFromDbRow(latest);

    return {
      ...empty,
      current,
      history7d: (history || []).map((h) => ({
        at: h.capturedAt ? new Date(h.capturedAt).toISOString() : null,
        marketCapUsd: h.marketCapUsd,
        liquidityUsd: h.liquidityUsd,
        volume24hUsd: h.volume24hUsd,
        priceUsd: h.priceUsd,
        uniqueStakers: h.uniqueStakers,
        top10ConcentrationPct: h.top10ConcentrationPct,
      })),
    };
  } catch {
    return empty;
  }
}
