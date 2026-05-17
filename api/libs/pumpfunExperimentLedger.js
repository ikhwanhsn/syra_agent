export const PUMPFUN_EXPERIMENT_START_SOL = 10;
export const PUMPFUN_EXPERIMENT_PERSONALITY_COUNT = 15;
export const PUMPFUN_EXPERIMENT_EXIT_COUNT = 15;

export function cellKey(personalityId, exitStrategyId) {
  return `p${personalityId}_e${exitStrategyId}`;
}

export function createInitialPumpfunLedger() {
  const cells = {};
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

function normalizeCell(cell, fallback) {
  const out = cell && typeof cell === "object" ? { ...cell } : { ...fallback };
  if (!Array.isArray(out.open)) out.open = [];
  if (!Array.isArray(out.closed)) out.closed = [];
  if (!out.boughtMints || typeof out.boughtMints !== "object") out.boughtMints = {};
  if (typeof out.balanceSol !== "number" || !Number.isFinite(out.balanceSol)) {
    out.balanceSol = fallback.balanceSol;
  }
  for (const o of out.open) {
    if (o?.mint) out.boughtMints[o.mint] = true;
  }
  for (const c of out.closed) {
    if (c?.mint) out.boughtMints[c.mint] = true;
  }
  return out;
}

/** Normalize persisted ledger from DB or API body. */
export function normalizePumpfunLedger(raw) {
  const fresh = createInitialPumpfunLedger();
  if (!raw || raw.v !== 1 || typeof raw.cells !== "object") {
    return fresh;
  }

  const parsed = { ...raw, cells: { ...raw.cells } };
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
