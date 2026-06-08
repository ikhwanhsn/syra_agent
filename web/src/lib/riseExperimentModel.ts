import type { PumpfunAlphaTrendToken } from "@/lib/pumpfunAlphaTrendApi";
import type { RiseMarketRow } from "@/lib/riseMarketsTypes";

export const RISE_EXPERIMENT_ENTRY_SOL = 1;
export const RISE_EXPERIMENT_START_SOL = 10;
export const RISE_EXPERIMENT_MAX_BORROW_SOL = 5;
export const RISE_EXPERIMENT_BORROW_APR = 0.14;
/** v4 = multi-strategy matrix (8×8); v3 = two-desk ledger. */
export const RISE_EXPERIMENT_FEED_VERSION = 4;
export const RISE_EXPERIMENT_TAPE_SOURCE = "rise-markets" as const;
export const RISE_EXPERIMENT_PERSONALITY_COUNT = 8;
export const RISE_EXPERIMENT_EXIT_COUNT = 8;

export const RISE_EXPERIMENT_LEGACY_STORAGE_KEY = "syra.riseExperiment.v4";
const RISE_EXPERIMENT_LEGACY_STORAGE_KEYS = [
  "syra.riseExperiment.v1",
  "syra.riseExperiment.v2",
  "syra.riseExperiment.v3",
  RISE_EXPERIMENT_LEGACY_STORAGE_KEY,
] as const;

/** Aggressive buy styles deploy more SOL per token. */
export const RISE_PERSONALITY_ENTRY_SOL: Readonly<Record<number, number>> = {
  0: 2.5,
  1: 2.5,
  2: 2,
  4: 2,
  5: 2.5,
  7: 3,
};

export const SNIPER_PERSONALITY_IDS = new Set([0, 1, 2]);
export const AGGRESSIVE_PERSONALITY_IDS = new Set([0, 1, 2, 5, 7]);
export const AGGRESSIVE_EXIT_IDS = new Set([1, 4, 5, 6, 7]);

export interface RisePersonalityMeta {
  id: number;
  short: string;
  name: string;
  description: string;
}

export interface RiseExitMeta {
  id: number;
  short: string;
  name: string;
  description: string;
}

export const RISE_PERSONALITIES: readonly RisePersonalityMeta[] = [
  {
    id: 0,
    short: "R0",
    name: "Fresh mint sniper",
    description:
      "Snipes brand-new RISE listings on first sight — MC $8k–$300k, launched <12h. Deploys 2.5 SOL.",
  },
  {
    id: 1,
    short: "R1",
    name: "Rise Alpha ready",
    description:
      "Only agent-ready tier tokens — verified, strong alpha score, real volume. Deploys 2.5 SOL.",
  },
  {
    id: 2,
    short: "R2",
    name: "Rise Alpha watch",
    description: "Watch-tier RISE names with solid alpha and liquidity. Deploys 2 SOL.",
  },
  {
    id: 3,
    short: "R3",
    name: "Micro gem",
    description: "Market cap under $50k with minimum $2.5k 24h volume — early upside.",
  },
  {
    id: 4,
    short: "R4",
    name: "Verified momentum",
    description: "Verified tokens with $5k+ volume and positive 24h price action.",
  },
  {
    id: 5,
    short: "R5",
    name: "Hot tape",
    description: "High-activity names — $10k+ 24h volume. Deploys 2.5 SOL.",
  },
  {
    id: 6,
    short: "R6",
    name: "Mid lane",
    description: "Established RISE tokens between $50k and $800k market cap.",
  },
  {
    id: 7,
    short: "R7",
    name: "Full send",
    description: "Enters every new RISE listing with 3 SOL — maximum aggression.",
  },
] as const;

export const RISE_EXIT_STRATEGIES: readonly RiseExitMeta[] = [
  { id: 0, short: "E0", name: "Quick 2×", description: "Full exit at 2× — lock gains fast." },
  { id: 1, short: "E1", name: "5× take", description: "Full exit when market cap hits 5× vs entry." },
  { id: 2, short: "E2", name: "Scale 50 / 50", description: "Sells half at 1.5×, remainder at 3×." },
  { id: 3, short: "E3", name: "Skim + swing", description: "Sells 10% at 1.2×, remainder at 2.5×." },
  { id: 4, short: "E4", name: "Trailing 25%", description: "Tracks peak MC ratio, exits on 25% drawdown from peak." },
  {
    id: 5,
    short: "E5",
    name: "Rocket scale",
    description: "20% at 3×, 30% at 10×, remainder at 50×.",
  },
  {
    id: 6,
    short: "E6",
    name: "Super moon",
    description: "70% off at 10×, remainder rides to 100× or −65%.",
  },
  {
    id: 7,
    short: "E7",
    name: "Moon runner",
    description: "After 5 days, exits at 20× or −45% — patience for parabolic moves.",
  },
] as const;

export function cellKey(personalityId: number, exitStrategyId: number): string {
  return `p${personalityId}_e${exitStrategyId}`;
}

export function isSniperPersonality(personalityId: number): boolean {
  return SNIPER_PERSONALITY_IDS.has(personalityId);
}

export function entrySolForPersonality(personalityId: number): number {
  const v = RISE_PERSONALITY_ENTRY_SOL[personalityId];
  const size = v != null && v > 0 ? v : RISE_EXPERIMENT_ENTRY_SOL;
  return Math.min(size, RISE_EXPERIMENT_START_SOL);
}

export function isAggressiveStrategy(personalityId: number, exitStrategyId: number): boolean {
  return AGGRESSIVE_PERSONALITY_IDS.has(personalityId) || AGGRESSIVE_EXIT_IDS.has(exitStrategyId);
}

export interface RiseOpenPosition {
  mint: string;
  symbol: string;
  entryMc: number;
  entryAtMs: number;
  personalityId: number;
  exitStrategyId: number;
  solNotional: number;
  borrowedForLegSol: number;
  peakRatio: number;
  prevRatio: number | null;
  exitScratch: Record<string, number>;
}

export interface RiseClosedTrade {
  closedAtMs: number;
  mint: string;
  symbol: string;
  personalityId: number;
  exitStrategyId: number;
  reason: string;
  solIn: number;
  solOut: number;
  pnlSol: number;
  interestPaidSol: number;
  principalRepaidSol: number;
}

export interface RiseCellState {
  balanceSol: number;
  borrowedPrincipalSol: number;
  interestOwedSol: number;
  interestPaidAllTimeSol: number;
  open: RiseOpenPosition[];
  closed: RiseClosedTrade[];
  boughtMints: Record<string, true>;
}

export interface RiseExperimentPersisted {
  v: 1;
  feedVersion: number;
  tapeSource: typeof RISE_EXPERIMENT_TAPE_SOURCE;
  feedBootstrapped: boolean;
  seenMints: string[];
  cells: Record<string, RiseCellState>;
  discoveries: Array<{ atMs: number; mint: string; symbol: string; marketCapUsd: number | null }>;
  mcByMint: Record<string, number | null>;
  lastTickMs: number | null;
}

/** @deprecated v3 agent id — kept for type migration references only. */
export type RiseExperimentAgentId = "universal" | "riseAlpha";

function safeMc(mc: number | null | undefined): number {
  if (mc == null || !Number.isFinite(mc) || mc <= 0) return 1;
  return mc;
}

function safeVol(v: number | null | undefined): number {
  if (v == null || !Number.isFinite(v)) return 0;
  return v;
}

export function positionMarkValueSol(pos: RiseOpenPosition, currentMc: number | null): number {
  const ratio = safeMc(currentMc) / pos.entryMc;
  return pos.solNotional * ratio;
}

export function cellEquitySol(cell: RiseCellState, mcByMint: Record<string, number | null>): number {
  let open = 0;
  for (const pos of cell.open) {
    const mc = mcByMint[pos.mint] ?? pos.entryMc;
    open += positionMarkValueSol(pos, mc);
  }
  return cell.balanceSol + open - cell.borrowedPrincipalSol - cell.interestOwedSol;
}

function createEmptyCell(): RiseCellState {
  return {
    balanceSol: RISE_EXPERIMENT_START_SOL,
    borrowedPrincipalSol: 0,
    interestOwedSol: 0,
    interestPaidAllTimeSol: 0,
    open: [],
    closed: [],
    boughtMints: {},
  };
}

export function createInitialRiseExperiment(): RiseExperimentPersisted {
  const cells: Record<string, RiseCellState> = {};
  for (let p = 0; p < RISE_EXPERIMENT_PERSONALITY_COUNT; p++) {
    for (let e = 0; e < RISE_EXPERIMENT_EXIT_COUNT; e++) {
      cells[cellKey(p, e)] = createEmptyCell();
    }
  }
  return {
    v: 1,
    feedVersion: RISE_EXPERIMENT_FEED_VERSION,
    tapeSource: RISE_EXPERIMENT_TAPE_SOURCE,
    feedBootstrapped: false,
    seenMints: [],
    cells,
    discoveries: [],
    mcByMint: {},
    lastTickMs: null,
  };
}

function isValidRiseExperimentPersisted(parsed: RiseExperimentPersisted | null | undefined): parsed is RiseExperimentPersisted {
  if (!parsed || parsed.v !== 1) return false;
  if (parsed.feedVersion !== RISE_EXPERIMENT_FEED_VERSION) return false;
  if (parsed.tapeSource !== RISE_EXPERIMENT_TAPE_SOURCE) return false;
  if (!parsed.cells || typeof parsed.cells !== "object") return false;
  const expected = RISE_EXPERIMENT_PERSONALITY_COUNT * RISE_EXPERIMENT_EXIT_COUNT;
  if (Object.keys(parsed.cells).length < expected) return false;
  return true;
}

function deskHasEverTradedMint(cell: RiseCellState, mint: string): boolean {
  if (cell.boughtMints[mint]) return true;
  if (cell.open.some((o) => o.mint === mint)) return true;
  if (cell.closed.some((c) => c.mint === mint)) return true;
  return false;
}

function pushClosed(cell: RiseCellState, trade: RiseClosedTrade, maxClosed = 300): void {
  cell.closed.push(trade);
  if (cell.closed.length > maxClosed) {
    cell.closed.splice(0, cell.closed.length - maxClosed);
  }
}

function accrueInterest(cell: RiseCellState, nowMs: number, lastTickMs: number | null): void {
  if (cell.borrowedPrincipalSol <= 0) return;
  if (lastTickMs == null || !Number.isFinite(lastTickMs)) return;
  const dt = Math.max(0, nowMs - lastTickMs);
  if (dt <= 0) return;
  const year = 365 * 24 * 60 * 60 * 1000;
  cell.interestOwedSol += cell.borrowedPrincipalSol * RISE_EXPERIMENT_BORROW_APR * (dt / year);
}

function settleDebtFromProceeds(
  cell: RiseCellState,
  grossProceeds: number,
): { netToBalance: number; interestPaid: number; principalRepaid: number } {
  let pool = grossProceeds;
  const interestPaid = Math.min(pool, cell.interestOwedSol);
  pool -= interestPaid;
  cell.interestOwedSol -= interestPaid;
  cell.interestPaidAllTimeSol += interestPaid;

  const principalRepaid = Math.min(pool, cell.borrowedPrincipalSol);
  pool -= principalRepaid;
  cell.borrowedPrincipalSol -= principalRepaid;

  return { netToBalance: pool, interestPaid, principalRepaid };
}

export interface RiseEntryContext {
  nowMs: number;
  newDiscoveryMints: ReadonlySet<string>;
  riseReadyMints: ReadonlySet<string>;
  riseWatchMints: ReadonlySet<string>;
  marketByMint: ReadonlyMap<string, RiseMarketRow>;
}

const FRESH_MINT_MAX_AGE_MS = 12 * 60 * 60 * 1000;

function hasRecentLaunch(createdMs: number | null, nowMs: number, maxAgeMs: number): boolean {
  return createdMs != null && nowMs - createdMs <= maxAgeMs;
}

function parseCreatedMs(row: RiseMarketRow | undefined, token: PumpfunAlphaTrendToken): number | null {
  if (row?.createdAt) {
    const ms = Date.parse(row.createdAt);
    if (Number.isFinite(ms)) return ms;
  }
  return token.anchorTsMs ?? null;
}

export function personalityAllowsEntry(
  personalityId: number,
  token: PumpfunAlphaTrendToken,
  ctx: RiseEntryContext,
): boolean {
  const row = ctx.marketByMint.get(token.mint);
  const mc = token.marketCapUsd;
  const vol = safeVol(row?.volume24hUsd);
  const createdMs = parseCreatedMs(row, token);

  switch (personalityId) {
    case 0:
      return (
        ctx.newDiscoveryMints.has(token.mint) &&
        hasRecentLaunch(createdMs, ctx.nowMs, FRESH_MINT_MAX_AGE_MS) &&
        mc != null &&
        mc >= 8_000 &&
        mc <= 300_000 &&
        vol >= 1_500
      );
    case 1:
      return ctx.riseReadyMints.has(token.mint);
    case 2:
      return ctx.riseWatchMints.has(token.mint);
    case 3:
      return mc != null && mc < 50_000 && vol >= 2_500;
    case 4:
      return (
        row?.isVerified === true &&
        vol >= 5_000 &&
        (row.priceChange24hPct ?? 0) > 0
      );
    case 5:
      return vol >= 10_000;
    case 6:
      return mc != null && mc >= 50_000 && mc <= 800_000;
    case 7:
      return ctx.newDiscoveryMints.has(token.mint);
    default:
      return false;
  }
}

function applyExitStrategy(args: {
  pos: RiseOpenPosition;
  ratio: number;
  nowMs: number;
  onFullClose: (reason: string) => void;
  onPartial: (fraction: number, reason: string) => void;
}): RiseOpenPosition {
  const { pos, ratio, nowMs, onFullClose, onPartial } = args;
  const s = pos.exitScratch;
  const heldMs = nowMs - pos.entryAtMs;

  const sellFrac = (fraction: number, reason: string) => {
    if (fraction <= 0 || pos.solNotional <= 0) return;
    onPartial(Math.min(1, fraction), reason);
  };

  switch (pos.exitStrategyId) {
    case 0:
      if (ratio >= 2) onFullClose("Quick 2× take profit");
      else if (ratio <= 0.75) onFullClose("Quick 2× stop −25%");
      break;
    case 1:
      if (ratio >= 5) onFullClose("Take profit 5×");
      else if (ratio <= 0.65) onFullClose("Stop −35%");
      break;
    case 2: {
      const leg1 = s.l1 ?? 0;
      if (leg1 < 1 && ratio >= 1.5) {
        s.l1 = 1;
        sellFrac(0.5, "Partial 1.5× (50%)");
      }
      if ((s.l1 ?? 0) >= 1 && ratio >= 3) onFullClose("Final 3×");
      else if (ratio <= 0.7) onFullClose("Scale stop −30%");
      break;
    }
    case 3: {
      const skim = s.skim ?? 0;
      if (skim < 1 && ratio >= 1.2) {
        s.skim = 1;
        sellFrac(0.1, "Skim 10% @1.2×");
      }
      if ((s.skim ?? 0) >= 1 && ratio >= 2.5) onFullClose("Swing 2.5×");
      else if (ratio <= 0.72) onFullClose("Skim stop −28%");
      break;
    }
    case 4: {
      if (ratio > pos.peakRatio) pos.peakRatio = ratio;
      if (pos.peakRatio >= 1.08 && ratio <= pos.peakRatio * 0.75) onFullClose("Trailing 25% off peak");
      else if (ratio <= 0.68) onFullClose("Trailing stop −32%");
      break;
    }
    case 5: {
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
      else if (ratio <= 0.55) onFullClose("Rocket stop −45%");
      break;
    }
    case 6: {
      const moon = s.moon ?? 0;
      if (moon < 1 && ratio >= 10) {
        s.moon = 1;
        sellFrac(0.7, "Super moon 70% @10×");
      }
      if ((s.moon ?? 0) >= 1) {
        if (ratio >= 100) onFullClose("Super moon 100×");
        if (ratio <= 0.35) onFullClose("Super moon stop −65%");
      } else if (ratio <= 0.6) {
        onFullClose("Super moon stop −40%");
      }
      break;
    }
    case 7:
      if (heldMs >= 5 * 24 * 60 * 60 * 1000) {
        if (ratio >= 20) onFullClose("Moon runner 20×");
        else if (ratio <= 0.55) onFullClose("Moon runner −45%");
      } else if (ratio <= 0.6) {
        onFullClose("Moon runner early stop −40%");
      }
      break;
    default:
      break;
  }

  pos.prevRatio = ratio;
  return pos;
}

function maybeBorrowForEntry(cell: RiseCellState, entrySol: number): { borrowed: number } {
  if (cell.balanceSol >= entrySol) return { borrowed: 0 };
  const shortfall = entrySol - cell.balanceSol;
  const room = Math.max(0, RISE_EXPERIMENT_MAX_BORROW_SOL - cell.borrowedPrincipalSol);
  const borrowed = Math.min(shortfall, room);
  if (borrowed <= 0) return { borrowed: 0 };
  cell.borrowedPrincipalSol += borrowed;
  cell.balanceSol += borrowed;
  return { borrowed };
}

function runExitPassOnCells(
  cells: Record<string, RiseCellState>,
  tokenByMint: Map<string, PumpfunAlphaTrendToken>,
  mcByMint: Record<string, number | null>,
  nowMs: number,
): void {
  for (const cell of Object.values(cells)) {
    const nextOpen: RiseOpenPosition[] = [];

    for (let pos of cell.open) {
      const live = tokenByMint.get(pos.mint);
      const currentMc = live?.marketCapUsd ?? mcByMint[pos.mint] ?? pos.entryMc;
      const ratio = safeMc(currentMc) / pos.entryMc;
      if (ratio > pos.peakRatio) pos.peakRatio = ratio;

      let alive = true;

      const closeFull = (reason: string) => {
        const gross = pos.solNotional * ratio;
        const { netToBalance, interestPaid, principalRepaid } = settleDebtFromProceeds(cell, gross);
        cell.balanceSol += netToBalance;
        pushClosed(cell, {
          closedAtMs: nowMs,
          mint: pos.mint,
          symbol: pos.symbol,
          personalityId: pos.personalityId,
          exitStrategyId: pos.exitStrategyId,
          reason,
          solIn: pos.solNotional,
          solOut: gross,
          pnlSol: gross - pos.solNotional,
          interestPaidSol: interestPaid,
          principalRepaidSol: principalRepaid,
        });
        alive = false;
      };

      const partial = (fraction: number, reason: string) => {
        const f = Math.min(1, Math.max(0, fraction));
        if (f <= 0 || pos.solNotional <= 0) return;
        const chunk = pos.solNotional * f;
        const gross = chunk * ratio;
        const { netToBalance, interestPaid, principalRepaid } = settleDebtFromProceeds(cell, gross);
        cell.balanceSol += netToBalance;
        pos.solNotional -= chunk;
        pushClosed(cell, {
          closedAtMs: nowMs,
          mint: pos.mint,
          symbol: pos.symbol,
          personalityId: pos.personalityId,
          exitStrategyId: pos.exitStrategyId,
          reason,
          solIn: chunk,
          solOut: gross,
          pnlSol: gross - chunk,
          interestPaidSol: interestPaid,
          principalRepaidSol: principalRepaid,
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

function tryOpenOnCell(args: {
  cell: RiseCellState;
  token: PumpfunAlphaTrendToken;
  nowMs: number;
  personalityId: number;
  exitStrategyId: number;
  mcByMint: Record<string, number | null>;
}): void {
  const { cell, token, nowMs, personalityId, exitStrategyId, mcByMint } = args;
  if (deskHasEverTradedMint(cell, token.mint)) return;

  const entrySol = entrySolForPersonality(personalityId);
  if (cell.balanceSol < entrySol) {
    const eq = cellEquitySol(cell, mcByMint);
    if (eq < entrySol * 1.15) return;
  }

  const borrowedBefore = maybeBorrowForEntry(cell, entrySol);
  if (cell.balanceSol < entrySol) return;

  cell.boughtMints = { ...cell.boughtMints, [token.mint]: true };
  cell.balanceSol -= entrySol;
  cell.open.push({
    mint: token.mint,
    symbol: token.symbol,
    entryMc: safeMc(token.marketCapUsd),
    entryAtMs: nowMs,
    personalityId,
    exitStrategyId,
    solNotional: entrySol,
    borrowedForLegSol: borrowedBefore.borrowed,
    peakRatio: 1,
    prevRatio: null,
    exitScratch: {},
  });
}

export interface ProcessRiseTickInput {
  persisted: RiseExperimentPersisted;
  tokens: readonly PumpfunAlphaTrendToken[];
  nowMs: number;
  entryCtx: RiseEntryContext;
}

export function processRiseExperimentTick(input: ProcessRiseTickInput): RiseExperimentPersisted {
  const { tokens, nowMs, entryCtx } = input;
  const persisted: RiseExperimentPersisted = {
    v: 1,
    feedVersion: RISE_EXPERIMENT_FEED_VERSION,
    tapeSource: RISE_EXPERIMENT_TAPE_SOURCE,
    feedBootstrapped: input.persisted.feedBootstrapped,
    seenMints: [...input.persisted.seenMints],
    cells: {},
    discoveries: [...input.persisted.discoveries],
    mcByMint: { ...input.persisted.mcByMint },
    lastTickMs: nowMs,
  };

  for (const [k, cell] of Object.entries(input.persisted.cells)) {
    persisted.cells[k] = {
      balanceSol: cell.balanceSol,
      borrowedPrincipalSol: cell.borrowedPrincipalSol,
      interestOwedSol: cell.interestOwedSol,
      interestPaidAllTimeSol: cell.interestPaidAllTimeSol,
      open: cell.open.map((o) => ({ ...o, exitScratch: { ...o.exitScratch } })),
      closed: [...cell.closed],
      boughtMints: { ...(cell.boughtMints ?? {}) },
    };
  }

  const lastTick = input.persisted.lastTickMs;
  for (const cell of Object.values(persisted.cells)) {
    accrueInterest(cell, nowMs, lastTick);
  }

  const tokenByMint = new Map(tokens.map((t) => [t.mint, t] as const));
  for (const t of tokens) {
    persisted.mcByMint[t.mint] = t.marketCapUsd;
  }

  const seen = new Set(persisted.seenMints);
  const newTokens: PumpfunAlphaTrendToken[] = [];
  for (const t of tokens) {
    if (!seen.has(t.mint)) {
      newTokens.push(t);
      seen.add(t.mint);
    }
  }
  newTokens.sort((a, b) => (b.anchorTsMs ?? 0) - (a.anchorTsMs ?? 0));

  const seedDiscoveriesFromTape = (tape: readonly PumpfunAlphaTrendToken[]): void => {
    const sorted = [...tape].sort((a, b) => (b.anchorTsMs ?? 0) - (a.anchorTsMs ?? 0));
    persisted.discoveries = sorted.slice(0, 120).map((t) => ({
      atMs: nowMs,
      mint: t.mint,
      symbol: t.symbol,
      marketCapUsd: t.marketCapUsd,
    }));
  };

  if (!persisted.feedBootstrapped && tokens.length > 0) {
    persisted.feedBootstrapped = true;
    persisted.seenMints = Array.from(seen);
    seedDiscoveriesFromTape(tokens);
    runExitPassOnCells(persisted.cells, tokenByMint, persisted.mcByMint, nowMs);
    return persisted;
  }

  if (persisted.feedBootstrapped && persisted.discoveries.length === 0 && tokens.length > 0) {
    seedDiscoveriesFromTape(tokens);
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
    for (let p = 0; p < RISE_EXPERIMENT_PERSONALITY_COUNT; p++) {
      if (!personalityAllowsEntry(p, t, entryCtx)) continue;
      for (let e = 0; e < RISE_EXPERIMENT_EXIT_COUNT; e++) {
        const key = cellKey(p, e);
        const cell = persisted.cells[key];
        if (!cell) continue;
        tryOpenOnCell({
          cell,
          token: t,
          nowMs,
          personalityId: p,
          exitStrategyId: e,
          mcByMint: persisted.mcByMint,
        });
      }
    }
  }

  runExitPassOnCells(persisted.cells, tokenByMint, persisted.mcByMint, nowMs);
  return persisted;
}

function normalizeCell(cell: RiseCellState, fallback: RiseCellState): RiseCellState {
  if (!Array.isArray(cell.open)) cell.open = [];
  if (!Array.isArray(cell.closed)) cell.closed = [];
  if (!cell.boughtMints || typeof cell.boughtMints !== "object") cell.boughtMints = {};
  if (typeof cell.borrowedPrincipalSol !== "number") cell.borrowedPrincipalSol = 0;
  if (typeof cell.interestOwedSol !== "number") cell.interestOwedSol = 0;
  if (typeof cell.interestPaidAllTimeSol !== "number") cell.interestPaidAllTimeSol = 0;
  if (typeof cell.balanceSol !== "number" || !Number.isFinite(cell.balanceSol)) {
    cell.balanceSol = fallback.balanceSol;
  }
  for (const o of cell.open) {
    if (!o.exitScratch || typeof o.exitScratch !== "object") o.exitScratch = {};
    cell.boughtMints[o.mint] = true;
  }
  for (const c of cell.closed) {
    cell.boughtMints[c.mint] = true;
  }
  return cell;
}

export function normalizeRiseLedger(raw: unknown): RiseExperimentPersisted {
  const fresh = createInitialRiseExperiment();
  const parsed = raw as RiseExperimentPersisted | null | undefined;
  if (!isValidRiseExperimentPersisted(parsed)) {
    return fresh;
  }

  for (const [k, cell] of Object.entries(parsed.cells)) {
    parsed.cells[k] = normalizeCell(cell, fresh.cells[k] ?? createEmptyCell());
  }

  for (let p = 0; p < RISE_EXPERIMENT_PERSONALITY_COUNT; p++) {
    for (let e = 0; e < RISE_EXPERIMENT_EXIT_COUNT; e++) {
      const k = cellKey(p, e);
      if (!parsed.cells[k]) parsed.cells[k] = createEmptyCell();
    }
  }

  if (typeof parsed.feedBootstrapped !== "boolean") parsed.feedBootstrapped = false;
  if (!Array.isArray(parsed.seenMints)) parsed.seenMints = [];
  if (!Array.isArray(parsed.discoveries)) parsed.discoveries = [];
  if (!parsed.mcByMint || typeof parsed.mcByMint !== "object") parsed.mcByMint = {};
  if (parsed.lastTickMs != null && typeof parsed.lastTickMs !== "number") parsed.lastTickMs = null;
  parsed.tapeSource = RISE_EXPERIMENT_TAPE_SOURCE;
  parsed.feedVersion = RISE_EXPERIMENT_FEED_VERSION;
  parsed.v = 1;

  return parsed;
}

/** @deprecated Use cellEquitySol — kept for dashboard migration. */
export function agentEquitySol(cell: RiseCellState, mcByMint: Record<string, number | null>): number {
  return cellEquitySol(cell, mcByMint);
}

export function readLegacyRiseExperimentFromLocalStorage(): RiseExperimentPersisted | null {
  if (typeof window === "undefined") return null;
  for (const key of RISE_EXPERIMENT_LEGACY_STORAGE_KEYS) {
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) continue;
      const normalized = normalizeRiseLedger(JSON.parse(raw) as unknown);
      if (isValidRiseExperimentPersisted(normalized)) {
        return normalized;
      }
    } catch {
      /* try next key */
    }
  }
  return null;
}

export function clearLegacyRiseExperimentLocalStorage(): void {
  if (typeof window === "undefined") return;
  for (const key of RISE_EXPERIMENT_LEGACY_STORAGE_KEYS) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  }
  try {
    for (let i = localStorage.length - 1; i >= 0; i -= 1) {
      const key = localStorage.key(i);
      if (key?.startsWith("syra.riseExperiment.")) {
        localStorage.removeItem(key);
      }
    }
  } catch {
    /* ignore */
  }
}
