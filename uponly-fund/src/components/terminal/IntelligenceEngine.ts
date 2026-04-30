import type { RiseMarketRow } from "@/lib/riseDashboardTypes";
import type { AlphaScore, NarrativeTag, RankedMarket, RiskFlag } from "./types";

export const RISK_THRESHOLDS = {
  lowLiquidityUsd: 5_000,
  highCreatorFeePct: 4,
  newAgeHours: 24,
  lowLockedSupplyPct: 20,
  blueChipMcapUsd: 5_000_000,
  microCapMcapUsd: 250_000,
} as const;

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

function safe(value: number | null): number {
  return value === null || !Number.isFinite(value) ? 0 : value;
}

export function computeAlphaScore(row: RiseMarketRow): AlphaScore {
  const deltaPct = safe(row.priceChange24hPct);
  const momentumNormalized = (Math.tanh(deltaPct / 50) + 1) / 2;
  const momentum = clamp(momentumNormalized * 40, 0, 40);

  const volumeUsd = safe(row.volume24hUsd);
  const mcapUsd = safe(row.marketCapUsd);
  const flowRatio = mcapUsd > 0 ? volumeUsd / mcapUsd : 0;
  const flow = clamp((Math.log10(flowRatio + 1) / Math.log10(2)) * 25, 0, 25);

  const holders = safe(row.holders);
  const depth = clamp((Math.log10(holders + 1) / 5) * 20, 0, 20);

  const ageHours = row.ageHours;
  let freshnessBase = 0;
  if (ageHours !== null && Number.isFinite(ageHours)) {
    if (ageHours < RISK_THRESHOLDS.newAgeHours) freshnessBase = 4;
    else if (ageHours <= 240) freshnessBase = 15;
    else if (ageHours <= 30 * 24) freshnessBase = 9;
    else freshnessBase = 4;
  }
  const freshness = clamp(freshnessBase, 0, 15);

  const score = clamp(momentum + flow + depth + freshness, 0, 100);
  return { score, momentum, flow, depth, freshness };
}

export function computeRiskFlags(row: RiseMarketRow): RiskFlag[] {
  const flags: RiskFlag[] = [];
  if (safe(row.volume24hUsd) < RISK_THRESHOLDS.lowLiquidityUsd) flags.push("LowLiquidity");
  if (safe(row.creatorFeePct) > RISK_THRESHOLDS.highCreatorFeePct) flags.push("HighFee");
  if ((row.ageHours ?? Number.POSITIVE_INFINITY) < RISK_THRESHOLDS.newAgeHours) flags.push("NewAge");
  if (row.lockedSupplyPct !== null && row.lockedSupplyPct < RISK_THRESHOLDS.lowLockedSupplyPct) flags.push("LowLocked");
  if (!row.isVerified) flags.push("Unverified");
  if (row.disableSell) flags.push("DisableSell");
  return flags;
}

export function computeNarrativeTags(row: RiseMarketRow): NarrativeTag[] {
  const tags: NarrativeTag[] = [];
  if (row.isVerified) tags.push("Verified");
  if (safe(row.floorMarketCapUsd) > 0) tags.push("FloorBacked");
  if (safe(row.priceChange24hPct) >= 15) tags.push("Momentum");
  if (safe(row.priceChange24hPct) <= -10) tags.push("Cooldown");
  if (safe(row.marketCapUsd) >= RISK_THRESHOLDS.blueChipMcapUsd) tags.push("BlueChip");
  if (row.marketCapUsd !== null && row.marketCapUsd < RISK_THRESHOLDS.microCapMcapUsd) tags.push("Microcap");
  if (row.ageHours !== null && row.ageHours < 48) tags.push("Fresh");
  return tags;
}

export function enrichMarket(row: RiseMarketRow): RankedMarket {
  return {
    market: row,
    alpha: computeAlphaScore(row),
    riskFlags: computeRiskFlags(row),
    narratives: computeNarrativeTags(row),
  };
}

export function rankByAlpha(rows: RiseMarketRow[]): RiseMarketRow[] {
  const ranked = rows.map((row) => ({ row, alpha: computeAlphaScore(row).score, volume: safe(row.volume24hUsd) }));
  ranked.sort((a, b) => b.alpha - a.alpha || b.volume - a.volume);
  return ranked.map((item) => item.row);
}

export function rankByRisk(rows: RiseMarketRow[]): RiseMarketRow[] {
  const ranked = rows.map((row) => ({
    row,
    riskCount: computeRiskFlags(row).length,
    volume: safe(row.volume24hUsd),
  }));
  ranked.sort((a, b) => b.riskCount - a.riskCount || a.volume - b.volume);
  return ranked.map((item) => item.row);
}
