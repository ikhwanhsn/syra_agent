import type { RiseMarketRow } from "@/lib/riseDashboardTypes";

/** Which field drives bubble area (sqrt-scaled in bubbleMapMath). */
export type BubbleSizeMetric = "marketCapUsd" | "volume24hUsd" | "holders";

/** 24h move tone for fill / glow. */
export type BubbleTone = "up" | "down" | "neutral";

/** Minimal market fields needed by the bubble map (from RiseMarketRow). */
export type BubbleDatum = Pick<
  RiseMarketRow,
  | "mint"
  | "symbol"
  | "name"
  | "imageUrl"
  | "priceUsd"
  | "priceChange24hPct"
  | "marketCapUsd"
  | "floorMarketCapUsd"
  | "volume24hUsd"
  | "holders"
  | "ageHours"
  | "level"
  | "isVerified"
>;

/** Runtime physics + render state for one bubble. */
export type BubbleSimNode = {
  mint: string;
  datum: BubbleDatum;
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Current draw radius (px), tweened toward targetR */
  r: number;
  targetR: number;
  /** Fade 0–1 for enter/exit */
  alpha: number;
  /** When true, alpha goes to 0 then node is dropped */
  removing: boolean;
  /** $UPONLY highlight ring */
  isUponly: boolean;
};

export type DragEndResult = {
  /** True if release should count as a click (open modal). */
  click: boolean;
  mint: string | null;
};
