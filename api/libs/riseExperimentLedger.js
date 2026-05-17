export const RISE_EXPERIMENT_START_SOL = 10;
export const RISE_EXPERIMENT_FEED_VERSION = 3;
export const RISE_EXPERIMENT_TAPE_SOURCE = "rise-markets";

function createEmptyAgent() {
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

function isValidRiseLedger(parsed) {
  if (!parsed || parsed.v !== 1) return false;
  if (parsed.feedVersion !== RISE_EXPERIMENT_FEED_VERSION) return false;
  if (parsed.tapeSource !== RISE_EXPERIMENT_TAPE_SOURCE) return false;
  if (!parsed.agents?.universal || !parsed.agents?.riseAlpha) return false;
  return true;
}

function normalizeAgent(a, fallback) {
  const agent = a && typeof a === "object" ? { ...a } : { ...fallback };
  if (typeof agent.balanceSol !== "number" || !Number.isFinite(agent.balanceSol)) {
    agent.balanceSol = fallback.balanceSol;
  }
  if (!Array.isArray(agent.open)) agent.open = [];
  if (!Array.isArray(agent.closed)) agent.closed = [];
  if (!agent.boughtMints || typeof agent.boughtMints !== "object") agent.boughtMints = {};
  if (typeof agent.borrowedPrincipalSol !== "number") agent.borrowedPrincipalSol = 0;
  if (typeof agent.interestOwedSol !== "number") agent.interestOwedSol = 0;
  if (typeof agent.interestPaidAllTimeSol !== "number") agent.interestPaidAllTimeSol = 0;
  for (const o of agent.open) {
    if (o?.mint) agent.boughtMints[o.mint] = true;
  }
  for (const c of agent.closed) {
    if (c?.mint) agent.boughtMints[c.mint] = true;
  }
  return agent;
}

/** Normalize persisted ledger from DB or API body. */
export function normalizeRiseLedger(raw) {
  const fresh = createInitialRiseLedger();
  if (!isValidRiseLedger(raw)) {
    return fresh;
  }

  const parsed = { ...raw, agents: { ...raw.agents } };
  for (const id of ["universal", "riseAlpha"]) {
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
