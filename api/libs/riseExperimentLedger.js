export const RISE_EXPERIMENT_START_SOL = 10;
export const RISE_EXPERIMENT_FEED_VERSION = 4;
export const RISE_EXPERIMENT_TAPE_SOURCE = "rise-markets";
export const RISE_EXPERIMENT_PERSONALITY_COUNT = 8;
export const RISE_EXPERIMENT_EXIT_COUNT = 8;

function cellKey(personalityId, exitStrategyId) {
  return `p${personalityId}_e${exitStrategyId}`;
}

function createEmptyCell() {
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

export function createInitialRiseLedger() {
  const cells = {};
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

function isValidRiseLedger(parsed) {
  if (!parsed || parsed.v !== 1) return false;
  if (parsed.feedVersion !== RISE_EXPERIMENT_FEED_VERSION) return false;
  if (parsed.tapeSource !== RISE_EXPERIMENT_TAPE_SOURCE) return false;
  if (!parsed.cells || typeof parsed.cells !== "object") return false;
  const expected = RISE_EXPERIMENT_PERSONALITY_COUNT * RISE_EXPERIMENT_EXIT_COUNT;
  if (Object.keys(parsed.cells).length < expected) return false;
  return true;
}

function normalizeCell(a, fallback) {
  const cell = a && typeof a === "object" ? { ...a } : { ...fallback };
  if (typeof cell.balanceSol !== "number" || !Number.isFinite(cell.balanceSol)) {
    cell.balanceSol = fallback.balanceSol;
  }
  if (!Array.isArray(cell.open)) cell.open = [];
  if (!Array.isArray(cell.closed)) cell.closed = [];
  if (!cell.boughtMints || typeof cell.boughtMints !== "object") cell.boughtMints = {};
  if (typeof cell.borrowedPrincipalSol !== "number") cell.borrowedPrincipalSol = 0;
  if (typeof cell.interestOwedSol !== "number") cell.interestOwedSol = 0;
  if (typeof cell.interestPaidAllTimeSol !== "number") cell.interestPaidAllTimeSol = 0;
  for (const o of cell.open) {
    if (o?.mint) cell.boughtMints[o.mint] = true;
    if (o && (!o.exitScratch || typeof o.exitScratch !== "object")) o.exitScratch = {};
  }
  for (const c of cell.closed) {
    if (c?.mint) cell.boughtMints[c.mint] = true;
  }
  return cell;
}

/** Normalize persisted ledger from DB or API body. */
export function normalizeRiseLedger(raw) {
  const fresh = createInitialRiseLedger();
  if (!isValidRiseLedger(raw)) {
    return fresh;
  }

  const parsed = { ...raw, cells: { ...raw.cells } };
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
