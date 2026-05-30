import type { PumpfunAlphaTrendToken } from "@/lib/pumpfunAlphaTrendApi";

export const RISE_EXPERIMENT_ENTRY_SOL = 1;
export const RISE_EXPERIMENT_START_SOL = 10;
/** Max principal borrowed per desk (SOL) — Rise-style lever cap for the paper sim. */
export const RISE_EXPERIMENT_MAX_BORROW_SOL = 5;
/** Variable borrow APR used for interest accrual (simple linear rate). */
export const RISE_EXPERIMENT_BORROW_APR = 0.14;
/** Bump when the experiment tape source changes (v3 = RISE markets; v2/v1 included Pumpfun). */
export const RISE_EXPERIMENT_FEED_VERSION = 3;
export const RISE_EXPERIMENT_TAPE_SOURCE = "rise-markets" as const;
/** Legacy browser keys — migrated once to MongoDB on first API load. */
export const RISE_EXPERIMENT_LEGACY_STORAGE_KEY = "syra.riseExperiment.v3";
const RISE_EXPERIMENT_LEGACY_STORAGE_KEYS = [
  "syra.riseExperiment.v1",
  "syra.riseExperiment.v2",
  RISE_EXPERIMENT_LEGACY_STORAGE_KEY,
] as const;

export type RiseExperimentAgentId = "universal" | "riseAlpha";

export interface RiseOpenPosition {
  mint: string;
  symbol: string;
  entryMc: number;
  entryAtMs: number;
  solNotional: number;
  /** SOL borrowed from Rise vault specifically to fund this clip (principal tagged per leg). */
  borrowedForLegSol: number;
  peakRatio: number;
  prevRatio: number | null;
}

export interface RiseClosedTrade {
  closedAtMs: number;
  mint: string;
  symbol: string;
  agentId: RiseExperimentAgentId;
  reason: string;
  solIn: number;
  solOut: number;
  pnlSol: number;
  /** Interest paid from this exit’s proceeds (SOL). */
  interestPaidSol: number;
  /** Principal repaid to Rise from this exit (SOL). */
  principalRepaidSol: number;
}

export interface RiseAgentState {
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
  /** Tape schema version — mismatch triggers a full reset on load. */
  feedVersion: number;
  /** Origin of price/discovery tape (`rise-markets` only after v3). */
  tapeSource: typeof RISE_EXPERIMENT_TAPE_SOURCE;
  feedBootstrapped: boolean;
  seenMints: string[];
  agents: Record<RiseExperimentAgentId, RiseAgentState>;
  discoveries: Array<{ atMs: number; mint: string; symbol: string; marketCapUsd: number | null }>;
  mcByMint: Record<string, number | null>;
  lastTickMs: number | null;
}

function safeMc(mc: number | null | undefined): number {
  if (mc == null || !Number.isFinite(mc) || mc <= 0) return 1;
  return mc;
}

export function positionMarkValueSol(pos: RiseOpenPosition, currentMc: number | null): number {
  const ratio = safeMc(currentMc) / pos.entryMc;
  return pos.solNotional * ratio;
}

export function agentEquitySol(agent: RiseAgentState, mcByMint: Record<string, number | null>): number {
  let open = 0;
  for (const pos of agent.open) {
    const mc = mcByMint[pos.mint] ?? pos.entryMc;
    open += positionMarkValueSol(pos, mc);
  }
  return agent.balanceSol + open - agent.borrowedPrincipalSol - agent.interestOwedSol;
}

function createEmptyAgent(): RiseAgentState {
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

function isValidRiseExperimentPersisted(parsed: RiseExperimentPersisted | null | undefined): parsed is RiseExperimentPersisted {
  if (!parsed || parsed.v !== 1) return false;
  if (parsed.feedVersion !== RISE_EXPERIMENT_FEED_VERSION) return false;
  if (parsed.tapeSource !== RISE_EXPERIMENT_TAPE_SOURCE) return false;
  if (!parsed.agents?.universal || !parsed.agents?.riseAlpha) return false;
  return true;
}

export function createInitialRiseExperiment(): RiseExperimentPersisted {
  return {
    v: 1,
    feedVersion: RISE_EXPERIMENT_FEED_VERSION,
    tapeSource: RISE_EXPERIMENT_TAPE_SOURCE,
    feedBootstrapped: false,
    seenMints: [],
    agents: {
      universal: createEmptyAgent(),
      riseAlpha: createEmptyAgent(),
    },
    discoveries: [],
    mcByMint: {},
    lastTickMs: null,
  };
}

function deskHasEverTradedMint(agent: RiseAgentState, mint: string): boolean {
  if (agent.boughtMints[mint]) return true;
  if (agent.open.some((o) => o.mint === mint)) return true;
  if (agent.closed.some((c) => c.mint === mint)) return true;
  return false;
}

function pushClosed(agent: RiseAgentState, trade: RiseClosedTrade, maxClosed = 300): void {
  agent.closed.push(trade);
  if (agent.closed.length > maxClosed) {
    agent.closed.splice(0, agent.closed.length - maxClosed);
  }
}

function accrueInterest(agent: RiseAgentState, nowMs: number, lastTickMs: number | null): void {
  if (agent.borrowedPrincipalSol <= 0) return;
  if (lastTickMs == null || !Number.isFinite(lastTickMs)) return;
  const dt = Math.max(0, nowMs - lastTickMs);
  if (dt <= 0) return;
  const year = 365 * 24 * 60 * 60 * 1000;
  agent.interestOwedSol += agent.borrowedPrincipalSol * RISE_EXPERIMENT_BORROW_APR * (dt / year);
}

function settleDebtFromProceeds(agent: RiseAgentState, grossProceeds: number): { netToBalance: number; interestPaid: number; principalRepaid: number } {
  let pool = grossProceeds;
  const interestPaid = Math.min(pool, agent.interestOwedSol);
  pool -= interestPaid;
  agent.interestOwedSol -= interestPaid;
  agent.interestPaidAllTimeSol += interestPaid;

  const principalRepaid = Math.min(pool, agent.borrowedPrincipalSol);
  pool -= principalRepaid;
  agent.borrowedPrincipalSol -= principalRepaid;

  return { netToBalance: pool, interestPaid, principalRepaid };
}

/** Sniper exits: +100% take profit, −28% hard stop (paper). */
function applySniperExit(pos: RiseOpenPosition, ratio: number, nowMs: number): "hold" | "close" {
  if (ratio >= 2) return "close";
  if (ratio <= 0.72) return "close";
  if (pos.prevRatio != null && ratio < pos.prevRatio * 0.985 && ratio > 1.08) return "close";
  void nowMs;
  return "hold";
}

function runExitPass(
  agent: RiseAgentState,
  tokenByMint: Map<string, PumpfunAlphaTrendToken>,
  mcByMint: Record<string, number | null>,
  nowMs: number,
  agentId: RiseExperimentAgentId,
): void {
  const nextOpen: RiseOpenPosition[] = [];

  for (let pos of agent.open) {
    const live = tokenByMint.get(pos.mint);
    const currentMc = live?.marketCapUsd ?? mcByMint[pos.mint] ?? pos.entryMc;
    const ratio = safeMc(currentMc) / pos.entryMc;
    if (ratio > pos.peakRatio) pos.peakRatio = ratio;

    const decision = applySniperExit(pos, ratio, nowMs);
    pos.prevRatio = ratio;

    if (decision === "close") {
      const gross = pos.solNotional * ratio;
      const { netToBalance, interestPaid, principalRepaid } = settleDebtFromProceeds(agent, gross);
      agent.balanceSol += netToBalance;
      const pnl = gross - pos.solNotional;
      let reason = "Sniper exit";
      if (ratio >= 2) reason = "Take profit 2×";
      else if (ratio <= 0.72) reason = "Stop −28%";
      else reason = "Momentum fade";

      pushClosed(agent, {
        closedAtMs: nowMs,
        mint: pos.mint,
        symbol: pos.symbol,
        agentId,
        reason,
        solIn: pos.solNotional,
        solOut: gross,
        pnlSol: pnl,
        interestPaidSol: interestPaid,
        principalRepaidSol: principalRepaid,
      });
      continue;
    }

    nextOpen.push(pos);
  }

  agent.open = nextOpen;
}

function maybeBorrowForEntry(agent: RiseAgentState, entrySol: number): { borrowed: number } {
  if (agent.balanceSol >= entrySol) return { borrowed: 0 };
  const shortfall = entrySol - agent.balanceSol;
  const room = Math.max(0, RISE_EXPERIMENT_MAX_BORROW_SOL - agent.borrowedPrincipalSol);
  const borrowed = Math.min(shortfall, room);
  if (borrowed <= 0) return { borrowed: 0 };
  agent.borrowedPrincipalSol += borrowed;
  agent.balanceSol += borrowed;
  return { borrowed };
}

function tryOpenOnToken(args: {
  agent: RiseAgentState;
  token: PumpfunAlphaTrendToken;
  nowMs: number;
  allow: boolean;
  mcByMint: Record<string, number | null>;
}): void {
  const { agent, token, nowMs, allow, mcByMint } = args;
  if (!allow) return;
  if (deskHasEverTradedMint(agent, token.mint)) return;
  if (agent.balanceSol < RISE_EXPERIMENT_ENTRY_SOL) {
    const eq = agentEquitySol(agent, mcByMint);
    if (eq < RISE_EXPERIMENT_ENTRY_SOL * 1.2) return;
  }

  const borrowedBefore = maybeBorrowForEntry(agent, RISE_EXPERIMENT_ENTRY_SOL);
  if (agent.balanceSol < RISE_EXPERIMENT_ENTRY_SOL) return;

  agent.boughtMints = { ...agent.boughtMints, [token.mint]: true };
  agent.balanceSol -= RISE_EXPERIMENT_ENTRY_SOL;
  const entryMc = safeMc(token.marketCapUsd);
  const borrowedForLegSol = borrowedBefore.borrowed;
  agent.open.push({
    mint: token.mint,
    symbol: token.symbol,
    entryMc,
    entryAtMs: nowMs,
    solNotional: RISE_EXPERIMENT_ENTRY_SOL,
    borrowedForLegSol,
    peakRatio: 1,
    prevRatio: null,
  });
}

export interface ProcessRiseTickInput {
  persisted: RiseExperimentPersisted;
  tokens: readonly PumpfunAlphaTrendToken[];
  nowMs: number;
  riseAlphaMintTargets: ReadonlySet<string>;
}

export function processRiseExperimentTick(input: ProcessRiseTickInput): RiseExperimentPersisted {
  const { tokens, nowMs, riseAlphaMintTargets } = input;
  const persisted: RiseExperimentPersisted = {
    v: 1,
    feedVersion: RISE_EXPERIMENT_FEED_VERSION,
    tapeSource: RISE_EXPERIMENT_TAPE_SOURCE,
    feedBootstrapped: input.persisted.feedBootstrapped,
    seenMints: [...input.persisted.seenMints],
    agents: {
      universal: {
        balanceSol: input.persisted.agents.universal.balanceSol,
        borrowedPrincipalSol: input.persisted.agents.universal.borrowedPrincipalSol,
        interestOwedSol: input.persisted.agents.universal.interestOwedSol,
        interestPaidAllTimeSol: input.persisted.agents.universal.interestPaidAllTimeSol,
        open: input.persisted.agents.universal.open.map((o) => ({ ...o })),
        closed: [...input.persisted.agents.universal.closed],
        boughtMints: { ...input.persisted.agents.universal.boughtMints },
      },
      riseAlpha: {
        balanceSol: input.persisted.agents.riseAlpha.balanceSol,
        borrowedPrincipalSol: input.persisted.agents.riseAlpha.borrowedPrincipalSol,
        interestOwedSol: input.persisted.agents.riseAlpha.interestOwedSol,
        interestPaidAllTimeSol: input.persisted.agents.riseAlpha.interestPaidAllTimeSol,
        open: input.persisted.agents.riseAlpha.open.map((o) => ({ ...o })),
        closed: [...input.persisted.agents.riseAlpha.closed],
        boughtMints: { ...input.persisted.agents.riseAlpha.boughtMints },
      },
    },
    discoveries: [...input.persisted.discoveries],
    mcByMint: { ...input.persisted.mcByMint },
    lastTickMs: nowMs,
  };

  const lastTick = input.persisted.lastTickMs;
  accrueInterest(persisted.agents.universal, nowMs, lastTick);
  accrueInterest(persisted.agents.riseAlpha, nowMs, lastTick);

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
    runExitPass(persisted.agents.universal, tokenByMint, persisted.mcByMint, nowMs, "universal");
    runExitPass(persisted.agents.riseAlpha, tokenByMint, persisted.mcByMint, nowMs, "riseAlpha");
    return persisted;
  }

  if (persisted.feedBootstrapped && persisted.discoveries.length === 0 && tokens.length > 0) {
    seedDiscoveriesFromTape(tokens);
  }

  runExitPass(persisted.agents.universal, tokenByMint, persisted.mcByMint, nowMs, "universal");
  runExitPass(persisted.agents.riseAlpha, tokenByMint, persisted.mcByMint, nowMs, "riseAlpha");

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
    tryOpenOnToken({
      agent: persisted.agents.universal,
      token: t,
      nowMs,
      allow: true,
      mcByMint: persisted.mcByMint,
    });
    tryOpenOnToken({
      agent: persisted.agents.riseAlpha,
      token: t,
      nowMs,
      allow: riseAlphaMintTargets.has(t.mint),
      mcByMint: persisted.mcByMint,
    });
  }

  runExitPass(persisted.agents.universal, tokenByMint, persisted.mcByMint, nowMs, "universal");
  runExitPass(persisted.agents.riseAlpha, tokenByMint, persisted.mcByMint, nowMs, "riseAlpha");

  return persisted;
}

function normalizeAgent(agent: RiseAgentState, fallback: RiseAgentState): RiseAgentState {
  if (!Array.isArray(agent.open)) agent.open = [];
  if (!Array.isArray(agent.closed)) agent.closed = [];
  if (!agent.boughtMints || typeof agent.boughtMints !== "object") agent.boughtMints = {};
  if (typeof agent.borrowedPrincipalSol !== "number") agent.borrowedPrincipalSol = 0;
  if (typeof agent.interestOwedSol !== "number") agent.interestOwedSol = 0;
  if (typeof agent.interestPaidAllTimeSol !== "number") agent.interestPaidAllTimeSol = 0;
  if (typeof agent.balanceSol !== "number" || !Number.isFinite(agent.balanceSol)) {
    agent.balanceSol = fallback.balanceSol;
  }
  for (const o of agent.open) {
    agent.boughtMints[o.mint] = true;
  }
  for (const c of agent.closed) {
    agent.boughtMints[c.mint] = true;
  }
  return agent;
}

/** Normalize ledger from API / migration payload. */
export function normalizeRiseLedger(raw: unknown): RiseExperimentPersisted {
  const fresh = createInitialRiseExperiment();
  const parsed = raw as RiseExperimentPersisted | null | undefined;
  if (!isValidRiseExperimentPersisted(parsed)) {
    return fresh;
  }

  for (const id of ["universal", "riseAlpha"] as const) {
    parsed.agents[id] = normalizeAgent(parsed.agents[id], fresh.agents[id]);
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

/** One-time read of legacy localStorage ledger (caller should persist to API and remove keys). */
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
