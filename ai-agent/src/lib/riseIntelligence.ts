import type { RiseMarketRow } from "@/lib/riseMarketsTypes";

export type AlphaScore = {
  score: number;
  momentum: number;
  flow: number;
  depth: number;
  freshness: number;
};

export type RiskFlag =
  | "LowLiquidity"
  | "HighFee"
  | "NewAge"
  | "LowLocked"
  | "Unverified"
  | "DisableSell";

export type NarrativeTag =
  | "Verified"
  | "FloorBacked"
  | "Momentum"
  | "Cooldown"
  | "BlueChip"
  | "Microcap"
  | "Fresh";

/** Deterministic tier for future live trading — data-only today. */
export type AgentTradeTier = "ready" | "watch" | "avoid";

export type RankedRiseMarket = {
  market: RiseMarketRow;
  alpha: AlphaScore;
  riskFlags: RiskFlag[];
  narratives: NarrativeTag[];
  agentTier: AgentTradeTier;
  agentNote: string;
};

export const RISK_THRESHOLDS = {
  lowLiquidityUsd: 5_000,
  /** Below this — effectively untradeable for an agent clip. */
  agentDeadVolumeUsd: 1_500,
  /** Minimum 24h volume for watch-tier (RISE microcaps, not CEX depth). */
  agentWatchVolumeUsd: 2_500,
  /** Minimum 24h volume for ready-tier. */
  agentReadyVolumeUsd: 6_000,
  highCreatorFeePct: 4,
  newAgeHours: 24,
  lowLockedSupplyPct: 20,
  blueChipMcapUsd: 5_000_000,
  microCapMcapUsd: 250_000,
  agentReadyAlphaMin: 55,
  agentWatchAlphaMin: 35,
} as const;

const HARD_RISK_FLAGS = new Set<RiskFlag>(["DisableSell", "HighFee"]);

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

function splitRiskFlags(flags: RiskFlag[]): { hard: RiskFlag[]; soft: RiskFlag[] } {
  const hard: RiskFlag[] = [];
  const soft: RiskFlag[] = [];
  for (const f of flags) {
    if (HARD_RISK_FLAGS.has(f)) hard.push(f);
    else soft.push(f);
  }
  return { hard, soft };
}

function agentNoteForTier(
  tier: AgentTradeTier,
  riskFlags: RiskFlag[],
  alpha: AlphaScore,
  volumeUsd: number,
): string {
  const { hard, soft } = splitRiskFlags(riskFlags);
  if (tier === "ready") {
    return `Alpha ${alpha.score.toFixed(0)} · $${Math.round(volumeUsd / 1000)}k 24h vol · ${soft.length ? "one soft flag" : "clean"}`;
  }
  if (tier === "watch") {
    if (hard.length) return `${hard.map((f) => f).join(", ")} — hard block if live`;
    if (soft.includes("Unverified")) return "Unverified — default on RISE; size down";
    if (soft.includes("NewAge")) return "Young market — smaller clip, wider stops";
    if (soft.includes("LowLiquidity")) return "Thin tape — limit size";
    if (soft.length >= 2) return `${soft.length} soft flags — reduce size only`;
    return `Alpha ${alpha.score.toFixed(0)} — monitor / reduced clip`;
  }
  if (hard.includes("DisableSell")) return "Sell disabled on-chain — do not allocate";
  if (hard.includes("HighFee")) return "Creator fee too high for agent economics";
  if (volumeUsd < RISK_THRESHOLDS.agentDeadVolumeUsd) return "24h volume too thin to exit";
  if (alpha.score < RISK_THRESHOLDS.agentWatchAlphaMin) return `Alpha ${alpha.score.toFixed(0)} below watch floor`;
  if (soft.length >= 3) return `${soft.length} soft flags stacked — skip for live capital`;
  return "Below ready/watch gates for this tape";
}

/**
 * Agent tiers tuned for RISE microcaps (not CEX liquidity).
 * Hard blocks: sell disabled, high fee, dead volume.
 * Soft flags (unverified, new, thin, low lock) can still be watch — most RISE names are unverified.
 */
export function computeAgentTradeTier(
  row: RiseMarketRow,
  alpha: AlphaScore,
  riskFlags: RiskFlag[],
): AgentTradeTier {
  const volumeUsd = safe(row.volume24hUsd);
  const { hard, soft } = splitRiskFlags(riskFlags);

  if (row.disableSell || hard.includes("DisableSell")) return "avoid";
  if (hard.includes("HighFee")) return "avoid";
  if (volumeUsd < RISK_THRESHOLDS.agentDeadVolumeUsd) return "avoid";

  const ready =
    row.isVerified &&
    alpha.score >= RISK_THRESHOLDS.agentReadyAlphaMin &&
    volumeUsd >= RISK_THRESHOLDS.agentReadyVolumeUsd &&
    soft.length <= 1;

  if (ready) return "ready";

  const watch =
    alpha.score >= RISK_THRESHOLDS.agentWatchAlphaMin &&
    volumeUsd >= RISK_THRESHOLDS.agentWatchVolumeUsd &&
    hard.length === 0 &&
    soft.length <= 2;

  return watch ? "watch" : "avoid";
}

export function enrichRiseMarket(row: RiseMarketRow): RankedRiseMarket {
  const alpha = computeAlphaScore(row);
  const riskFlags = computeRiskFlags(row);
  const narratives = computeNarrativeTags(row);
  const agentTier = computeAgentTradeTier(row, alpha, riskFlags);
  return {
    market: row,
    alpha,
    riskFlags,
    narratives,
    agentTier,
    agentNote: agentNoteForTier(agentTier, riskFlags, alpha, safe(row.volume24hUsd)),
  };
}

export function rankByAlpha(rows: RiseMarketRow[]): RiseMarketRow[] {
  const ranked = rows.map((row) => ({
    row,
    alpha: computeAlphaScore(row).score,
    volume: safe(row.volume24hUsd),
  }));
  ranked.sort((a, b) => b.alpha - a.alpha || b.volume - a.volume);
  return ranked.map((item) => item.row);
}

export function rankEnrichedByAlpha(rows: RankedRiseMarket[]): RankedRiseMarket[] {
  return [...rows].sort((a, b) => {
    const tierOrder: Record<AgentTradeTier, number> = { ready: 0, watch: 1, avoid: 2 };
    const td = tierOrder[a.agentTier] - tierOrder[b.agentTier];
    if (td !== 0) return td;
    return b.alpha.score - a.alpha.score || safe(b.market.volume24hUsd) - safe(a.market.volume24hUsd);
  });
}

export function countAgentReady(rows: RankedRiseMarket[]): number {
  return rows.filter((r) => r.agentTier === "ready").length;
}
