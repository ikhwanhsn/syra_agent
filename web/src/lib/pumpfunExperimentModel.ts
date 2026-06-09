import type { PumpfunAlphaTrendToken } from "@/lib/pumpfunAlphaTrendApi";

export const PUMPFUN_EXPERIMENT_ENTRY_SOL = 1;
export const PUMPFUN_EXPERIMENT_START_SOL = 10;
export const PUMPFUN_EXPERIMENT_PERSONALITY_COUNT = 15;
export const PUMPFUN_EXPERIMENT_EXIT_COUNT = 15;

/** Aggressive buy styles deploy more SOL per token. */
export const PUMPFUN_PERSONALITY_ENTRY_SOL: Readonly<Record<number, number>> = {
  0: 3,
  1: 2,
  2: 3,
  3: 3,
  4: 3,
  5: 4,
  6: 3,
  7: 4,
  8: 5,
  9: 4,
  10: 3,
  11: 3,
  12: 3,
  13: 2,
  14: 3,
};

/** Max concurrent open positions per strategy cell — stops spray-and-pray into 10 rugs. */
export const PUMPFUN_PERSONALITY_MAX_OPEN: Readonly<Record<number, number>> = {
  0: 1,
  1: 2,
  2: 2,
  3: 2,
  4: 2,
  5: 1,
  6: 1,
  7: 2,
  8: 1,
  9: 1,
  10: 2,
  11: 2,
  12: 2,
  13: 2,
  14: 2,
};

/** Minimum cash to keep in reserve after a new entry. */
export const PUMPFUN_PERSONALITY_MIN_CASH: Readonly<Record<number, number>> = {
  0: 4,
  1: 3,
  5: 3,
  8: 4,
  9: 4,
};

const DEFAULT_MAX_OPEN_POSITIONS = 2;
const DEFAULT_MIN_CASH_RESERVE_SOL = 1;

/** Sniper buy styles — each targets a token lifecycle stage with strict filters. */
export const SNIPER_PERSONALITY_IDS = new Set([0, 1, 5]);

/** Quality-scored strategies — only enter high-conviction tokens. */
export const SMART_PERSONALITY_IDS = new Set([2, 3, 4, 6, 7, 8, 9, 10, 11, 12, 13, 14]);

export const SMART_EXIT_IDS = new Set([4, 5, 6, 8, 10]);

export const AGGRESSIVE_PERSONALITY_IDS = new Set([0, 1, 2, 5, 6, 8, 12, 14]);
export const AGGRESSIVE_EXIT_IDS = new Set([0, 1, 2, 3, 9, 11, 12, 13, 14]);

export function isSniperPersonality(personalityId: number): boolean {
  return SNIPER_PERSONALITY_IDS.has(personalityId);
}

export function isSmartPersonality(personalityId: number): boolean {
  return SMART_PERSONALITY_IDS.has(personalityId);
}

export function entrySolForPersonality(personalityId: number): number {
  const v = PUMPFUN_PERSONALITY_ENTRY_SOL[personalityId];
  const size = v != null && v > 0 ? v : PUMPFUN_EXPERIMENT_ENTRY_SOL;
  return Math.min(size, PUMPFUN_EXPERIMENT_START_SOL);
}

export function maxOpenForPersonality(personalityId: number): number {
  return PUMPFUN_PERSONALITY_MAX_OPEN[personalityId] ?? DEFAULT_MAX_OPEN_POSITIONS;
}

export function minCashReserveForPersonality(personalityId: number): number {
  return PUMPFUN_PERSONALITY_MIN_CASH[personalityId] ?? DEFAULT_MIN_CASH_RESERVE_SOL;
}

export function isAggressiveStrategy(personalityId: number, exitStrategyId: number): boolean {
  return AGGRESSIVE_PERSONALITY_IDS.has(personalityId) || AGGRESSIVE_EXIT_IDS.has(exitStrategyId);
}

/** Score 0–100 from live tape quality signals (activity, MC band, lifecycle). */
export function scoreTokenQuality(token: PumpfunAlphaTrendToken, nowMs: number): number {
  let score = 0;
  const mc = token.marketCapUsd;
  const lastTrade = token.lastTradeTimestampMs;
  const created = token.createdTimestampMs ?? token.anchorTsMs;
  const ath = token.athMarketCapUsd;

  if (mc != null) {
    if (mc >= 20_000 && mc <= 180_000) score += 28;
    else if (mc >= 12_000 && mc <= 400_000) score += 14;
    else score -= 10;
  } else {
    score -= 15;
  }

  if (lastTrade != null) {
    const tradeAge = nowMs - lastTrade;
    if (tradeAge <= 15 * 60 * 1000) score += 25;
    else if (tradeAge <= 45 * 60 * 1000) score += 15;
    else if (tradeAge <= 2 * 60 * 60 * 1000) score += 5;
    else score -= 12;
  } else {
    score -= 20;
  }

  if (created != null) {
    const launchAge = nowMs - created;
    if (launchAge <= 4 * 60 * 60 * 1000) score += 12;
    else if (launchAge <= 24 * 60 * 60 * 1000) score += 6;
  }

  if (token.complete) score += 12;
  else if (mc != null && mc >= 10_000 && mc <= 62_000) score += 16;

  if (ath != null && mc != null && ath > mc * 1.08) score += 14;
  else if (ath != null && mc != null && ath >= mc * 0.97 && ath <= mc * 1.06) score += 10;

  const symLen = token.symbol.trim().length;
  if (symLen >= 2 && symLen <= 8) score += 5;

  return Math.max(0, Math.min(100, score));
}
/** Legacy browser key — migrated once to MongoDB on first API load. */
export const PUMPFUN_EXPERIMENT_LEGACY_STORAGE_KEY = "syra.pumpfunExperiment.v1";

export interface PumpfunPersonalityMeta {
  id: number;
  short: string;
  name: string;
  description: string;
}

export interface PumpfunExitMeta {
  id: number;
  short: string;
  name: string;
  description: string;
}

/** One open paper position — `solNotional` is SOL deployed still in the bag. */
export interface PumpfunOpenPosition {
  mint: string;
  symbol: string;
  entryMc: number;
  entryAtMs: number;
  personalityId: number;
  exitStrategyId: number;
  solNotional: number;
  /** Peak MC ratio (currentMc/entryMc) observed while open — for trailing exits. */
  peakRatio: number;
  /** Previous ratio on last tick — for “first red” exits. */
  prevRatio: number | null;
  /** Exit FSM scratch space (partial legs, timers, etc.). */
  exitScratch: Record<string, number>;
}

export interface PumpfunClosedTrade {
  closedAtMs: number;
  mint: string;
  symbol: string;
  personalityId: number;
  exitStrategyId: number;
  reason: string;
  solIn: number;
  solOut: number;
  pnlSol: number;
}

export interface PumpfunCellState {
  balanceSol: number;
  open: PumpfunOpenPosition[];
  closed: PumpfunClosedTrade[];
  /** Mints this desk has ever opened — survives `closed` log pruning so we never rebuy. */
  boughtMints: Record<string, true>;
}

export interface PumpfunDiscoveryEvent {
  atMs: number;
  mint: string;
  symbol: string;
  marketCapUsd: number | null;
}

export interface PumpfunExperimentPersisted {
  v: 1;
  /** When false, first successful feed tick only records mints as "seen" — no paper buys (avoids mass entries on cold load). */
  feedBootstrapped: boolean;
  seenMints: string[];
  cells: Record<string, PumpfunCellState>;
  discoveries: PumpfunDiscoveryEvent[];
  /** Last MC snapshot for mints we care about (open + recent). */
  mcByMint: Record<string, number | null>;
}

export const PUMPFUN_PERSONALITIES: readonly PumpfunPersonalityMeta[] = [
  {
    id: 0,
    short: "P0",
    name: "Launch sniper",
    description:
      "Snipes brand-new tokens on first feed sighting — MC $8k–$250k, launched <3h, active trade <45m, ticker 2–12 chars. Deploys 3 SOL.",
  },
  {
    id: 1,
    short: "P1",
    name: "Graduate sniper",
    description:
      "Snipes pump.fun graduates (bonding complete) — MC $35k–$2M, launched <72h, last trade <4h. Deploys 2 SOL.",
  },
  {
    id: 2,
    short: "P2",
    name: "Smart micro",
    description: "Quality score ≥52, MC $15k–$48k, active trade <35m. Max 2 positions, 3 SOL each.",
  },
  {
    id: 3,
    short: "P3",
    name: "Velocity hunter",
    description: "Quality score ≥58, MC $22k–$320k, trade <20m. Chases hot momentum only.",
  },
  {
    id: 4,
    short: "P4",
    name: "Graduate alpha",
    description: "Graduated token, MC $48k–$260k, score ≥55, trade <75m. Early graduate sweet spot.",
  },
  {
    id: 5,
    short: "P5",
    name: "Bonding sniper",
    description:
      "Snipes tokens still on bonding curve — MC $10k–$65k, not graduated, launched <8h, last trade <90m. Deploys 4 SOL.",
  },
  {
    id: 6,
    short: "P6",
    name: "Nano launch",
    description: "MC <$30k, launched <2h, quality score ≥50. Max 1 position — one shot only.",
  },
  {
    id: 7,
    short: "P7",
    name: "Bonding alpha",
    description: "On bonding curve, MC $13k–$58k, score ≥56, trade <22m. Max 2 positions.",
  },
  {
    id: 8,
    short: "P8",
    name: "Conviction pick",
    description: "Top-ranked token only, score ≥72 or Alpha watchlist. 5 SOL, max 1 position.",
  },
  {
    id: 9,
    short: "P9",
    name: "Momentum pick",
    description: "Top-2 ranked token, score ≥62, trade <30m. 4 SOL high-conviction entry.",
  },
  {
    id: 10,
    short: "P10",
    name: "Quality tape",
    description: "Graduate, MC $70k–$750k, score ≥54, near ATH breakout zone.",
  },
  {
    id: 11,
    short: "P11",
    name: "Beta play",
    description: "Beta watchlist + aligned follower candidates from alpha radar. Model-guided entries only.",
  },
  {
    id: 12,
    short: "P12",
    name: "Selective degen",
    description: "MC $16k–$52k, score ≥57, trade <40m. Filters out low-quality rugs.",
  },
  {
    id: 13,
    short: "P13",
    name: "Hot tape",
    description: "Trade <40m, MC $22k–$420k, score ≥50. Active tape with quality floor.",
  },
  {
    id: 14,
    short: "P14",
    name: "Smart moonshot",
    description: "MC $24k–$88k, score ≥60, trade <50m. Curated moonshot lane.",
  },
] as const;

export const PUMPFUN_EXIT_STRATEGIES: readonly PumpfunExitMeta[] = [
  {
    id: 0,
    short: "E0",
    name: "Ultra diamond",
    description: "Holds for 100×+ — only cuts on −80% rug. Lets winners run.",
  },
  {
    id: 1,
    short: "E1",
    name: "5× take",
    description: "Full exit when market cap hits 5× vs entry.",
  },
  {
    id: 2,
    short: "E2",
    name: "10× take",
    description: "Full exit at 10× multiple vs entry.",
  },
  {
    id: 3,
    short: "E3",
    name: "Wide stop",
    description: "No take-profit — only cuts at −60% to ride volatility.",
  },
  {
    id: 4,
    short: "E4",
    name: "Smart stop",
    description: "Hard stop at −12%. Takes profit at 2.5× — cut losers fast, bank winners.",
  },
  {
    id: 5,
    short: "E5",
    name: "Smart scale",
    description: "Sells 35% at 1.75×, remainder at 3.5× or −8% after first leg.",
  },
  {
    id: 6,
    short: "E6",
    name: "Quick protect",
    description: "Takes +35% profit or cuts at −10% — fast protection for smart entries.",
  },
  {
    id: 7,
    short: "E7",
    name: "Moon runner",
    description: "After 7 days, exits at 30× or −50% — patience for parabolic moves.",
  },
  {
    id: 8,
    short: "E8",
    name: "Tight trail",
    description: "After +20%, trails 15% from peak — locks in momentum gains.",
  },
  {
    id: 9,
    short: "E9",
    name: "100× ladder",
    description: "Scales out: 10%@5×, 20%@20×, 30%@50×, rest@100×.",
  },
  {
    id: 10,
    short: "E10",
    name: "Breakeven lift",
    description: "After +20%, raises stop to breakeven — free ride on winners.",
  },
  {
    id: 11,
    short: "E11",
    name: "Rocket scale",
    description: "20% at 3×, 30% at 10×, remainder at 50×.",
  },
  {
    id: 12,
    short: "E12",
    name: "Super moon",
    description: "70% off at 10×, remainder rides to 100× or −65%.",
  },
  {
    id: 13,
    short: "E13",
    name: "Parabolic",
    description: "Holds until 25× or −55% stop — no early profit-taking.",
  },
  {
    id: 14,
    short: "E14",
    name: "Sprint",
    description: "Exits at 3× (+200%) or after 72h, whichever comes first.",
  },
] as const;

export function cellKey(personalityId: number, exitStrategyId: number): string {
  return `p${personalityId}_e${exitStrategyId}`;
}

function safeMc(mc: number | null | undefined): number {
  if (mc == null || !Number.isFinite(mc) || mc <= 0) return 1;
  return mc;
}

export function positionMarkValueSol(pos: PumpfunOpenPosition, currentMc: number | null): number {
  const ratio = safeMc(currentMc) / pos.entryMc;
  return pos.solNotional * ratio;
}

export interface EntryContext {
  nowMs: number;
  watchlistMints: ReadonlySet<string>;
  /** Mints discovered for the first time on this feed tick. */
  newDiscoveryMints: ReadonlySet<string>;
  /** Quality score per mint on this tick (0–100). */
  qualityScoreByMint: ReadonlyMap<string, number>;
  /** Top 2 highest-quality mints this tick — conviction strategies only enter these. */
  topRankedMints: ReadonlySet<string>;
}

const LAUNCH_SNIPER_MAX_AGE_MS = 3 * 60 * 60 * 1000;
const LAUNCH_SNIPER_TRADE_MAX_AGE_MS = 45 * 60 * 1000;
const GRADUATE_SNIPER_MAX_AGE_MS = 72 * 60 * 60 * 1000;
const GRADUATE_SNIPER_TRADE_MAX_AGE_MS = 4 * 60 * 60 * 1000;
const BONDING_SNIPER_MAX_AGE_MS = 8 * 60 * 60 * 1000;
const BONDING_SNIPER_TRADE_MAX_AGE_MS = 90 * 60 * 1000;

function hasRecentTrade(lastTrade: number | null, nowMs: number, maxAgeMs: number): boolean {
  return lastTrade != null && nowMs - lastTrade <= maxAgeMs;
}

function hasRecentLaunch(created: number | null, nowMs: number, maxAgeMs: number): boolean {
  return created != null && nowMs - created <= maxAgeMs;
}

function qualityScore(token: PumpfunAlphaTrendToken, ctx: EntryContext): number {
  return ctx.qualityScoreByMint.get(token.mint) ?? 0;
}

function passesQuality(token: PumpfunAlphaTrendToken, ctx: EntryContext, minScore: number): boolean {
  return qualityScore(token, ctx) >= minScore;
}

function isTopRanked(token: PumpfunAlphaTrendToken, ctx: EntryContext): boolean {
  return ctx.topRankedMints.has(token.mint);
}

export function deskHasEverTradedMint(cell: PumpfunCellState, mint: string): boolean {
  if (cell.boughtMints?.[mint]) return true;
  if (cell.open.some((o) => o.mint === mint)) return true;
  if (cell.closed.some((c) => c.mint === mint)) return true;
  return false;
}

export function personalityAllowsEntry(
  personalityId: number,
  token: PumpfunAlphaTrendToken,
  ctx: EntryContext,
): boolean {
  const mc = token.marketCapUsd;
  const ath = token.athMarketCapUsd;
  const anchor = token.anchorTsMs;
  const lastTrade = token.lastTradeTimestampMs;

  const created = token.createdTimestampMs ?? anchor;
  const symLen = token.symbol.trim().length;

  switch (personalityId) {
    case 0:
      return (
        ctx.newDiscoveryMints.has(token.mint) &&
        passesQuality(token, ctx, 45) &&
        hasRecentLaunch(created, ctx.nowMs, LAUNCH_SNIPER_MAX_AGE_MS) &&
        mc != null &&
        mc >= 8_000 &&
        mc <= 250_000 &&
        hasRecentTrade(lastTrade, ctx.nowMs, LAUNCH_SNIPER_TRADE_MAX_AGE_MS) &&
        symLen >= 2 &&
        symLen <= 12
      );
    case 1:
      return (
        token.complete === true &&
        passesQuality(token, ctx, 50) &&
        hasRecentLaunch(created, ctx.nowMs, GRADUATE_SNIPER_MAX_AGE_MS) &&
        mc != null &&
        mc >= 35_000 &&
        mc <= 2_000_000 &&
        hasRecentTrade(lastTrade, ctx.nowMs, GRADUATE_SNIPER_TRADE_MAX_AGE_MS)
      );
    case 2:
      return (
        passesQuality(token, ctx, 52) &&
        mc != null &&
        mc >= 15_000 &&
        mc <= 48_000 &&
        hasRecentTrade(lastTrade, ctx.nowMs, 35 * 60 * 1000)
      );
    case 3:
      return (
        passesQuality(token, ctx, 58) &&
        mc != null &&
        mc >= 22_000 &&
        mc <= 320_000 &&
        hasRecentTrade(lastTrade, ctx.nowMs, 20 * 60 * 1000)
      );
    case 4:
      return (
        token.complete === true &&
        passesQuality(token, ctx, 55) &&
        mc != null &&
        mc >= 48_000 &&
        mc <= 260_000 &&
        hasRecentLaunch(created, ctx.nowMs, 48 * 60 * 60 * 1000) &&
        hasRecentTrade(lastTrade, ctx.nowMs, 75 * 60 * 1000)
      );
    case 5:
      return (
        token.complete === false &&
        passesQuality(token, ctx, 53) &&
        hasRecentLaunch(created, ctx.nowMs, BONDING_SNIPER_MAX_AGE_MS) &&
        mc != null &&
        mc >= 10_000 &&
        mc <= 65_000 &&
        hasRecentTrade(lastTrade, ctx.nowMs, BONDING_SNIPER_TRADE_MAX_AGE_MS)
      );
    case 6:
      return (
        passesQuality(token, ctx, 50) &&
        mc != null &&
        mc < 30_000 &&
        hasRecentLaunch(created, ctx.nowMs, 2 * 60 * 60 * 1000)
      );
    case 7:
      return (
        token.complete === false &&
        passesQuality(token, ctx, 56) &&
        mc != null &&
        mc >= 13_000 &&
        mc <= 58_000 &&
        hasRecentTrade(lastTrade, ctx.nowMs, 22 * 60 * 1000)
      );
    case 8:
      return (
        isTopRanked(token, ctx) &&
        (passesQuality(token, ctx, 72) || ctx.watchlistMints.has(token.mint))
      );
    case 9:
      return (
        isTopRanked(token, ctx) &&
        passesQuality(token, ctx, 62) &&
        hasRecentTrade(lastTrade, ctx.nowMs, 30 * 60 * 1000)
      );
    case 10:
      return (
        token.complete === true &&
        passesQuality(token, ctx, 54) &&
        mc != null &&
        mc >= 70_000 &&
        mc <= 750_000 &&
        ath != null &&
        ath >= mc * 0.97 &&
        ath <= mc * 1.12 &&
        hasRecentTrade(lastTrade, ctx.nowMs, 2 * 60 * 60 * 1000)
      );
    case 11:
      return ctx.watchlistMints.has(token.mint) && passesQuality(token, ctx, 48);
    case 12:
      return (
        passesQuality(token, ctx, 57) &&
        mc != null &&
        mc >= 16_000 &&
        mc <= 52_000 &&
        hasRecentTrade(lastTrade, ctx.nowMs, 40 * 60 * 1000)
      );
    case 13:
      return (
        passesQuality(token, ctx, 50) &&
        mc != null &&
        mc >= 22_000 &&
        mc <= 420_000 &&
        hasRecentTrade(lastTrade, ctx.nowMs, 40 * 60 * 1000)
      );
    case 14:
      return (
        passesQuality(token, ctx, 60) &&
        mc != null &&
        mc >= 24_000 &&
        mc <= 88_000 &&
        hasRecentTrade(lastTrade, ctx.nowMs, 50 * 60 * 1000)
      );
    default:
      return false;
  }
}

function pushClosed(cell: PumpfunCellState, trade: PumpfunClosedTrade, maxClosed = 400): void {
  cell.closed.push(trade);
  if (cell.closed.length > maxClosed) {
    cell.closed.splice(0, cell.closed.length - maxClosed);
  }
}

/** Returns updated scratch + optional partial/full closes via callbacks. */
function applyExitStrategy(args: {
  pos: PumpfunOpenPosition;
  ratio: number;
  nowMs: number;
  onFullClose: (reason: string) => void;
  onPartial: (fraction: number, reason: string) => void;
}): PumpfunOpenPosition {
  const { pos, ratio, nowMs, onFullClose, onPartial } = args;
  const s = pos.exitScratch;
  const heldMs = nowMs - pos.entryAtMs;

  const sellFrac = (fraction: number, reason: string) => {
    if (fraction <= 0 || pos.solNotional <= 0) return;
    const f = Math.min(1, fraction);
    onPartial(f, reason);
  };

  switch (pos.exitStrategyId) {
    case 0:
      if (ratio <= 0.2) onFullClose("Ultra diamond rug −80%");
      break;
    case 1:
      if (ratio >= 5) onFullClose("Take profit 5×");
      break;
    case 2:
      if (ratio >= 10) onFullClose("Take profit 10×");
      break;
    case 3:
      if (ratio <= 0.4) onFullClose("Wide stop −60%");
      break;
    case 4:
      if (ratio <= 0.88) onFullClose("Smart stop −12%");
      else if (ratio >= 2.5) onFullClose("Smart take 2.5×");
      break;
    case 5: {
      const leg1 = s.l1 ?? 0;
      if (leg1 < 1 && ratio >= 1.75) {
        s.l1 = 1;
        sellFrac(0.35, "Smart scale 35% @1.75×");
      }
      if ((s.l1 ?? 0) >= 1) {
        if (ratio >= 3.5) onFullClose("Smart scale 3.5×");
        else if (ratio <= 0.92) onFullClose("Smart scale stop −8%");
      }
      break;
    }
    case 6:
      if (ratio >= 1.35) onFullClose("Quick protect +35%");
      else if (ratio <= 0.9) onFullClose("Quick protect −10%");
      break;
    case 7:
      if (heldMs >= 7 * 24 * 60 * 60 * 1000) {
        if (ratio >= 30) onFullClose("Moon runner 30×");
        else if (ratio <= 0.5) onFullClose("Moon runner −50%");
      }
      break;
    case 8: {
      if (ratio > pos.peakRatio) {
        pos.peakRatio = ratio;
      }
      if (pos.peakRatio >= 1.2 && ratio <= pos.peakRatio * 0.85) onFullClose("Tight trail −15% from peak");
      break;
    }
    case 9: {
      const l5 = s.l5 ?? 0;
      const l20 = s.l20 ?? 0;
      const l50 = s.l50 ?? 0;
      if (l5 < 1 && ratio >= 5) {
        s.l5 = 1;
        sellFrac(0.1, "100× ladder 10% @5×");
      }
      if (l5 >= 1 && l20 < 1 && ratio >= 20) {
        s.l20 = 1;
        sellFrac(0.2, "100× ladder 20% @20×");
      }
      if (l20 >= 1 && l50 < 1 && ratio >= 50) {
        s.l50 = 1;
        sellFrac(0.3, "100× ladder 30% @50×");
      }
      if (l50 >= 1 && ratio >= 100) onFullClose("100× ladder final @100×");
      break;
    }
    case 10: {
      if (ratio >= 1.2) s.seenWin = 1;
      if ((s.seenWin ?? 0) >= 1 && ratio < 1.02) onFullClose("Breakeven lift stop");
      break;
    }
    case 11: {
      const r3 = s.r3 ?? 0;
      const r10 = s.r10 ?? 0;
      if (r3 < 1 && ratio >= 3) {
        s.r3 = 1;
        sellFrac(0.2, "Rocket scale 20% @3×");
      }
      if (r3 >= 1 && r10 < 1 && ratio >= 10) {
        s.r10 = 1;
        sellFrac(0.3, "Rocket scale 30% @10×");
      }
      if (r10 >= 1 && ratio >= 50) onFullClose("Rocket scale 50× (rest)");
      break;
    }
    case 12: {
      const moon = s.moon ?? 0;
      if (moon < 1 && ratio >= 10) {
        s.moon = 1;
        sellFrac(0.7, "Super moon 70% @10×");
      }
      if ((s.moon ?? 0) >= 1) {
        if (ratio >= 100) onFullClose("Super moon 100×");
        if (ratio <= 0.35) onFullClose("Super moon stop −65%");
      }
      break;
    }
    case 13:
      if (ratio >= 25) onFullClose("Parabolic 25×");
      else if (ratio <= 0.45) onFullClose("Parabolic stop −55%");
      break;
    case 14:
      if (ratio >= 3) onFullClose("Sprint 3×");
      else if (heldMs >= 72 * 60 * 60 * 1000) onFullClose("Sprint 72h");
      break;
    default:
      break;
  }

  pos.prevRatio = ratio;
  return pos;
}

export function createInitialPersisted(): PumpfunExperimentPersisted {
  const cells: Record<string, PumpfunCellState> = {};
  for (let p = 0; p < PUMPFUN_EXPERIMENT_PERSONALITY_COUNT; p++) {
    for (let e = 0; e < PUMPFUN_EXPERIMENT_EXIT_COUNT; e++) {
      cells[cellKey(p, e)] = { balanceSol: PUMPFUN_EXPERIMENT_START_SOL, open: [], closed: [], boughtMints: {} };
    }
  }
  return {
    v: 1,
    feedBootstrapped: false,
    seenMints: [],
    cells,
    discoveries: [],
    mcByMint: {},
  };
}

export function totalEquitySol(cell: PumpfunCellState, mcByMint: Record<string, number | null>): number {
  let open = 0;
  for (const pos of cell.open) {
    const mc = mcByMint[pos.mint] ?? pos.entryMc;
    open += positionMarkValueSol(pos, mc);
  }
  return cell.balanceSol + open;
}

export interface ProcessTickInput {
  persisted: PumpfunExperimentPersisted;
  tokens: readonly PumpfunAlphaTrendToken[];
  nowMs: number;
  watchlistMints: ReadonlySet<string>;
}

function runExitPassOnCells(
  cells: Record<string, PumpfunCellState>,
  tokenByMint: Map<string, PumpfunAlphaTrendToken>,
  mcByMint: Record<string, number | null>,
  nowMs: number,
): void {
  for (const cell of Object.values(cells)) {
    const nextOpen: PumpfunOpenPosition[] = [];

    for (let pos of cell.open) {
      const live = tokenByMint.get(pos.mint);
      const currentMc = live?.marketCapUsd ?? mcByMint[pos.mint] ?? pos.entryMc;
      const ratio = safeMc(currentMc) / pos.entryMc;
      if (ratio > pos.peakRatio) pos.peakRatio = ratio;

      let alive = true;

      const closeFull = (reason: string) => {
        const out = pos.solNotional * ratio;
        const solIn = pos.solNotional;
        cell.balanceSol += out;
        pushClosed(cell, {
          closedAtMs: nowMs,
          mint: pos.mint,
          symbol: pos.symbol,
          personalityId: pos.personalityId,
          exitStrategyId: pos.exitStrategyId,
          reason,
          solIn,
          solOut: out,
          pnlSol: out - solIn,
        });
        alive = false;
      };

      const partial = (fraction: number, reason: string) => {
        const f = Math.min(1, Math.max(0, fraction));
        if (f <= 0 || pos.solNotional <= 0) return;
        const chunk = pos.solNotional * f;
        const proceeds = chunk * ratio;
        cell.balanceSol += proceeds;
        pos.solNotional -= chunk;
        pushClosed(cell, {
          closedAtMs: nowMs,
          mint: pos.mint,
          symbol: pos.symbol,
          personalityId: pos.personalityId,
          exitStrategyId: pos.exitStrategyId,
          reason,
          solIn: chunk,
          solOut: proceeds,
          pnlSol: proceeds - chunk,
        });
      };

      pos = applyExitStrategy({
        pos,
        ratio,
        nowMs,
        onFullClose: closeFull,
        onPartial: partial,
      });

      if (alive && pos.solNotional > 1e-9) {
        nextOpen.push(pos);
      }
    }

    cell.open = nextOpen;
  }
}

/**
 * Single synchronous step: record new mints, open entries, mark markets, apply exits.
 * Mutates a cloned persisted object (caller should replace state).
 */
export function processPumpfunExperimentTick(input: ProcessTickInput): PumpfunExperimentPersisted {
  const { tokens, nowMs, watchlistMints } = input;
  const persisted: PumpfunExperimentPersisted = {
    v: 1,
    feedBootstrapped: input.persisted.feedBootstrapped,
    seenMints: [...input.persisted.seenMints],
    cells: {},
    discoveries: [...input.persisted.discoveries],
    mcByMint: { ...input.persisted.mcByMint },
  };

  for (const [k, cell] of Object.entries(input.persisted.cells)) {
    persisted.cells[k] = {
      balanceSol: cell.balanceSol,
      open: cell.open.map((o) => ({ ...o, exitScratch: { ...o.exitScratch } })),
      closed: [...cell.closed],
      boughtMints: { ...(cell.boughtMints ?? {}) },
    };
  }

  const seen = new Set(persisted.seenMints);
  const tokenByMint = new Map(tokens.map((t) => [t.mint, t] as const));

  for (const t of tokens) {
    persisted.mcByMint[t.mint] = t.marketCapUsd;
  }

  const newTokens: PumpfunAlphaTrendToken[] = [];

  for (const t of tokens) {
    if (!seen.has(t.mint)) {
      newTokens.push(t);
      seen.add(t.mint);
    }
  }

  newTokens.sort((a, b) => (b.anchorTsMs ?? 0) - (a.anchorTsMs ?? 0));

  const newDiscoveryMints = new Set(newTokens.map((t) => t.mint));
  const qualityScoreByMint = new Map<string, number>();
  for (const t of newTokens) {
    qualityScoreByMint.set(t.mint, scoreTokenQuality(t, nowMs));
  }
  const topRankedMints = new Set(
    [...newTokens]
      .sort((a, b) => (qualityScoreByMint.get(b.mint) ?? 0) - (qualityScoreByMint.get(a.mint) ?? 0))
      .slice(0, 2)
      .map((t) => t.mint),
  );
  const entryCtx: EntryContext = {
    nowMs,
    watchlistMints,
    newDiscoveryMints,
    qualityScoreByMint,
    topRankedMints,
  };

  if (!persisted.feedBootstrapped && tokens.length > 0) {
    persisted.feedBootstrapped = true;
    persisted.seenMints = Array.from(seen);
    runExitPassOnCells(persisted.cells, tokenByMint, persisted.mcByMint, nowMs);
    return persisted;
  }

  runExitPassOnCells(persisted.cells, tokenByMint, persisted.mcByMint, nowMs);

  for (const t of newTokens) {
    persisted.discoveries.unshift({
      atMs: nowMs,
      mint: t.mint,
      symbol: t.symbol,
      marketCapUsd: t.marketCapUsd,
    });
    if (persisted.discoveries.length > 120) persisted.discoveries.length = 120;
  }

  persisted.seenMints = Array.from(seen);

  for (const t of newTokens) {
    for (let p = 0; p < PUMPFUN_EXPERIMENT_PERSONALITY_COUNT; p++) {
      if (!personalityAllowsEntry(p, t, entryCtx)) continue;
      for (let e = 0; e < PUMPFUN_EXPERIMENT_EXIT_COUNT; e++) {
        const key = cellKey(p, e);
        const cell = persisted.cells[key];
        if (!cell) continue;
        const entrySol = entrySolForPersonality(p);
        if (cell.open.length >= maxOpenForPersonality(p)) continue;
        if (cell.balanceSol < entrySol + minCashReserveForPersonality(p)) continue;
        if (deskHasEverTradedMint(cell, t.mint)) continue;

        cell.boughtMints = { ...cell.boughtMints, [t.mint]: true };
        cell.balanceSol -= entrySol;
        const entryMc = safeMc(t.marketCapUsd);
        cell.open.push({
          mint: t.mint,
          symbol: t.symbol,
          entryMc,
          entryAtMs: nowMs,
          personalityId: p,
          exitStrategyId: e,
          solNotional: entrySol,
          peakRatio: 1,
          prevRatio: null,
          exitScratch: {},
        });
      }
    }
  }

  runExitPassOnCells(persisted.cells, tokenByMint, persisted.mcByMint, nowMs);

  return persisted;
}

function normalizeCell(cell: PumpfunCellState, fallback: PumpfunCellState): PumpfunCellState {
  if (!Array.isArray(cell.open)) cell.open = [];
  if (!Array.isArray(cell.closed)) cell.closed = [];
  if (!cell.boughtMints || typeof cell.boughtMints !== "object") {
    cell.boughtMints = {};
  }
  for (const o of cell.open) {
    cell.boughtMints[o.mint] = true;
  }
  for (const c of cell.closed) {
    cell.boughtMints[c.mint] = true;
  }
  if (typeof cell.balanceSol !== "number" || !Number.isFinite(cell.balanceSol)) {
    cell.balanceSol = fallback.balanceSol;
  }
  return cell;
}

/** Normalize ledger from API / migration payload. */
export function normalizePumpfunLedger(raw: unknown): PumpfunExperimentPersisted {
  const fresh = createInitialPersisted();
  const parsed = raw as PumpfunExperimentPersisted | null | undefined;
  if (!parsed || parsed.v !== 1 || typeof parsed.cells !== "object") {
    return fresh;
  }

  for (const k of Object.keys(fresh.cells)) {
    if (!parsed.cells[k]) parsed.cells[k] = fresh.cells[k];
    else parsed.cells[k] = normalizeCell(parsed.cells[k], fresh.cells[k]);
  }

  if (typeof parsed.feedBootstrapped !== "boolean") {
    parsed.feedBootstrapped = Array.isArray(parsed.seenMints) && parsed.seenMints.length > 0;
  }
  if (!Array.isArray(parsed.seenMints)) parsed.seenMints = [];
  if (!Array.isArray(parsed.discoveries)) parsed.discoveries = [];
  if (!parsed.mcByMint || typeof parsed.mcByMint !== "object") parsed.mcByMint = {};
  parsed.v = 1;

  return parsed;
}

/** One-time read of legacy localStorage ledger (caller should persist to API and remove key). */
export function readLegacyPumpfunExperimentFromLocalStorage(): PumpfunExperimentPersisted | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PUMPFUN_EXPERIMENT_LEGACY_STORAGE_KEY);
    if (!raw) return null;
    return normalizePumpfunLedger(JSON.parse(raw) as unknown);
  } catch {
    return null;
  }
}

export function clearLegacyPumpfunExperimentLocalStorage(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(PUMPFUN_EXPERIMENT_LEGACY_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
