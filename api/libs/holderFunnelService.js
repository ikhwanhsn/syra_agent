/**
 * Holder-growth funnel: snapshot DexScreener + staking metrics for public /api/metrics.
 */
import { isMongooseConnected } from "../config/mongoose.js";
import HolderFunnelSnapshot from "../models/HolderFunnelSnapshot.js";
import { SYRA_TOKEN_MINT } from "./syraToken.js";
import { gatherHolderPulseSnapshot } from "./syraHolderPulseService.js";

const SNAPSHOT_MIN_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6h

function round(n, digits = 2) {
  const x = Number(n);
  if (!Number.isFinite(x)) return null;
  const m = 10 ** digits;
  return Math.round(x * m) / m;
}

async function loadPulseData() {
  const out = await gatherHolderPulseSnapshot().catch(() => null);
  return out?.data ?? null;
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
    const pulse = await loadPulseData();
    if (isMongooseConnected()) {
      maybeCaptureHolderFunnelSnapshot().catch(() => {});
    }

    const history = isMongooseConnected()
      ? await HolderFunnelSnapshot.find({
          capturedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        })
          .sort({ capturedAt: 1 })
          .limit(28)
          .lean()
          .catch(() => [])
      : [];

    const current = pulse
      ? {
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
        }
      : null;

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
