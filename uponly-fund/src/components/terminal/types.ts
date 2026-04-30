import type { RiseMarketRow } from "@/lib/riseDashboardTypes";

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

export type RankedMarket = {
  market: RiseMarketRow;
  alpha: AlphaScore;
  riskFlags: RiskFlag[];
  narratives: NarrativeTag[];
};
