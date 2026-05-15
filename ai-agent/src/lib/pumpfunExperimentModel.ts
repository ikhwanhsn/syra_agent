import type { PumpfunAlphaTrendToken } from "@/lib/pumpfunAlphaTrendApi";

export const PUMPFUN_EXPERIMENT_ENTRY_SOL = 1;
export const PUMPFUN_EXPERIMENT_START_SOL = 10;
export const PUMPFUN_EXPERIMENT_PERSONALITY_COUNT = 15;
export const PUMPFUN_EXPERIMENT_EXIT_COUNT = 15;
export const PUMPFUN_EXPERIMENT_STORAGE_KEY = "syra.pumpfunExperiment.v1";

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
  { id: 0, short: "P0", name: "Baseline", description: "Enters every eligible new graduate while capital allows." },
  { id: 1, short: "P1", name: "Big cap", description: "Only tokens with live market cap ≥ $300k." },
  { id: 2, short: "P2", name: "Micro gem", description: "Only when market cap is under $120k." },
  { id: 3, short: "P3", name: "ATH stretch", description: "Requires ATH at least 25% above spot market cap." },
  { id: 4, short: "P4", name: "Tight ATH", description: "ATH exists and is within ~8% of spot (already near highs)." },
  { id: 5, short: "P5", name: "Fresh anchor", description: "Anchor time within the last 36 hours." },
  { id: 6, short: "P6", name: "Seasoned", description: "Anchor older than 5 days — skips ultra-fresh noise." },
  { id: 7, short: "P7", name: "Anti blow-off", description: "Skips names already above $5M market cap." },
  { id: 8, short: "P8", name: "Ticker sniper", description: "Symbol length ≤ 5 characters." },
  { id: 9, short: "P9", name: "Long ticker", description: "Symbol length ≥ 7 characters." },
  { id: 10, short: "P10", name: "Mid lane", description: "Market cap between $150k and $1.5M." },
  { id: 11, short: "P11", name: "Watchlist", description: "Only tokens the Alpha model highlights in its watchlist." },
  { id: 12, short: "P12", name: "Contrarian", description: "Explicitly avoids watchlist names." },
  { id: 13, short: "P13", name: "Hot tape", description: "Last trade timestamp within 2 hours of snapshot time." },
  { id: 14, short: "P14", name: "Calm band", description: "Market cap between $80k and $400k." },
] as const;

export const PUMPFUN_EXIT_STRATEGIES: readonly PumpfunExitMeta[] = [
  { id: 0, short: "E0", name: "Diamond hold", description: "No automated exit — marks unrealized PnL only." },
  { id: 1, short: "E1", name: "2× take", description: "Full exit when market cap doubles vs entry snapshot." },
  { id: 2, short: "E2", name: "3× take", description: "Full exit at 3× multiple vs entry." },
  { id: 3, short: "E3", name: "Tight stop", description: "Cuts at −25% vs entry MC." },
  { id: 4, short: "E4", name: "Deep stop", description: "Cuts at −40% vs entry MC." },
  { id: 5, short: "E5", name: "Scale 50 / 50", description: "Sells half at 1.5×, remainder at 3×." },
  { id: 6, short: "E6", name: "Skim + swing", description: "Sells 10% at 1.2×, remainder at 2.5×." },
  { id: 7, short: "E7", name: "Time box", description: "If still under +8% after 72h, exits entire bag." },
  { id: 8, short: "E8", name: "Trailing 25%", description: "Tracks peak MC ratio, exits if drawdown ≥25% from peak." },
  { id: 9, short: "E9", name: "Quick scalp", description: "Full exit at +15%." },
  { id: 10, short: "E10", name: "Profit lock", description: "After +30% seen, exits if round-trips below flat." },
  { id: 11, short: "E11", name: "Triple scale", description: "33% at 1.4×, 33% at 2×, remainder at 4×." },
  { id: 12, short: "E12", name: "Moonbag", description: "90% off at 2×, remainder at 8× or −50%." },
  { id: 13, short: "E13", name: "First red", description: "Exits on the first MC down-tick vs prior poll." },
  { id: 14, short: "E14", name: "Rotate", description: "Exits at +80% or after 48h, whichever comes first." },
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

  switch (personalityId) {
    case 0:
      return true;
    case 1:
      return mc != null && mc >= 300_000;
    case 2:
      return mc != null && mc < 120_000;
    case 3:
      return mc != null && ath != null && ath > mc * 1.25;
    case 4:
      return (
        mc != null &&
        ath != null &&
        ath >= mc * 0.94 &&
        ath <= mc * 1.08
      );
    case 5:
      return anchor != null && ctx.nowMs - anchor <= 36 * 60 * 60 * 1000;
    case 6:
      return anchor != null && ctx.nowMs - anchor > 5 * 24 * 60 * 60 * 1000;
    case 7:
      return mc == null || mc < 5_000_000;
    case 8:
      return token.symbol.trim().length <= 5;
    case 9:
      return token.symbol.trim().length >= 7;
    case 10:
      return mc != null && mc >= 150_000 && mc <= 1_500_000;
    case 11:
      return ctx.watchlistMints.has(token.mint);
    case 12:
      return !ctx.watchlistMints.has(token.mint);
    case 13:
      return lastTrade != null && ctx.nowMs - lastTrade <= 2 * 60 * 60 * 1000;
    case 14:
      return mc != null && mc >= 80_000 && mc <= 400_000;
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
      break;
    case 1:
      if (ratio >= 2) onFullClose("Take profit 2×");
      break;
    case 2:
      if (ratio >= 3) onFullClose("Take profit 3×");
      break;
    case 3:
      if (ratio <= 0.75) onFullClose("Stop −25%");
      break;
    case 4:
      if (ratio <= 0.6) onFullClose("Stop −40%");
      break;
    case 5: {
      const leg1 = s.l1 ?? 0;
      if (leg1 < 1 && ratio >= 1.5) {
        s.l1 = 1;
        sellFrac(0.5, "Partial 1.5× (50%)");
      }
      if ((s.l1 ?? 0) >= 1 && ratio >= 3) onFullClose("Final 3×");
      break;
    }
    case 6: {
      const skim = s.skim ?? 0;
      if (skim < 1 && ratio >= 1.2) {
        s.skim = 1;
        sellFrac(0.1, "Skim 10% @1.2×");
      }
      if ((s.skim ?? 0) >= 1 && ratio >= 2.5) onFullClose("Swing 2.5×");
      break;
    }
    case 7:
      if (heldMs >= 72 * 60 * 60 * 1000 && ratio < 1.08) onFullClose("Time box 72h < +8%");
      break;
    case 8: {
      if (ratio > pos.peakRatio) {
        pos.peakRatio = ratio;
      }
      if (pos.peakRatio >= 1.05 && ratio <= pos.peakRatio * 0.75) onFullClose("Trailing 25% off peak");
      break;
    }
    case 9:
      if (ratio >= 1.15) onFullClose("Quick +15%");
      break;
    case 10: {
      if (ratio >= 1.3) s.seenWin = 1;
      if ((s.seenWin ?? 0) >= 1 && ratio < 1) onFullClose("Round trip below flat after +30%");
      break;
    }
    case 11: {
      const a = s.a ?? 0;
      const b = s.b ?? 0;
      if (a < 1 && ratio >= 1.4) {
        s.a = 1;
        sellFrac(1 / 3, "Scale 1.4× (33%)");
      }
      if (a >= 1 && b < 1 && ratio >= 2) {
        s.b = 1;
        sellFrac(0.5, "Scale 2× (half of remainder)");
      }
      if (a >= 1 && b >= 1 && ratio >= 4) onFullClose("Scale 4× (rest)");
      break;
    }
    case 12: {
      const moon = s.moon ?? 0;
      if (moon < 1 && ratio >= 2) {
        s.moon = 1;
        sellFrac(0.9, "Moonbag 90% @2×");
      }
      if ((s.moon ?? 0) >= 1) {
        if (ratio >= 8) onFullClose("Moonbag 8×");
        if (ratio <= 0.5) onFullClose("Moonbag stop −50%");
      }
      break;
    }
    case 13:
      if (pos.prevRatio != null && ratio < pos.prevRatio) onFullClose("First red tick");
      break;
    case 14:
      if (ratio >= 1.8) onFullClose("Rotate +80%");
      else if (heldMs >= 48 * 60 * 60 * 1000) onFullClose("Rotate 48h");
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

  const entryCtx: EntryContext = { nowMs, watchlistMints };
  const newTokens: PumpfunAlphaTrendToken[] = [];

  for (const t of tokens) {
    if (!seen.has(t.mint)) {
      newTokens.push(t);
      seen.add(t.mint);
    }
  }

  newTokens.sort((a, b) => (b.anchorTsMs ?? 0) - (a.anchorTsMs ?? 0));

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
        if (cell.balanceSol < PUMPFUN_EXPERIMENT_ENTRY_SOL) continue;
        if (deskHasEverTradedMint(cell, t.mint)) continue;

        cell.boughtMints = { ...cell.boughtMints, [t.mint]: true };
        cell.balanceSol -= PUMPFUN_EXPERIMENT_ENTRY_SOL;
        const entryMc = safeMc(t.marketCapUsd);
        cell.open.push({
          mint: t.mint,
          symbol: t.symbol,
          entryMc,
          entryAtMs: nowMs,
          personalityId: p,
          exitStrategyId: e,
          solNotional: PUMPFUN_EXPERIMENT_ENTRY_SOL,
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

export function loadPumpfunExperiment(): PumpfunExperimentPersisted {
  if (typeof window === "undefined") return createInitialPersisted();
  try {
    const raw = window.localStorage.getItem(PUMPFUN_EXPERIMENT_STORAGE_KEY);
    if (!raw) return createInitialPersisted();
    const parsed = JSON.parse(raw) as PumpfunExperimentPersisted;
    if (parsed?.v !== 1 || typeof parsed.cells !== "object") return createInitialPersisted();
    const fresh = createInitialPersisted();
    for (const k of Object.keys(fresh.cells)) {
      if (!parsed.cells[k]) parsed.cells[k] = fresh.cells[k];
    }
    for (const cell of Object.values(parsed.cells)) {
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
    }
    if (typeof parsed.feedBootstrapped !== "boolean") {
      parsed.feedBootstrapped = Array.isArray(parsed.seenMints) && parsed.seenMints.length > 0;
    }
    if (!Array.isArray(parsed.seenMints)) parsed.seenMints = [];
    if (!Array.isArray(parsed.discoveries)) parsed.discoveries = [];
    if (!parsed.mcByMint || typeof parsed.mcByMint !== "object") parsed.mcByMint = {};
    return parsed;
  } catch {
    return createInitialPersisted();
  }
}

export function savePumpfunExperiment(state: PumpfunExperimentPersisted): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PUMPFUN_EXPERIMENT_STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore quota */
  }
}
