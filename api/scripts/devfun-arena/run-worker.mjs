/**
 * DevFun Arena worker: polls open Pump/Dump challenges, scores with Dexscreener + Rugcheck,
 * paginated submission history, retries, local state for dedup, deadline buffer, poll jitter.
 *
 * Env:
 *   ARENA_CREDENTIALS_PATH — optional path to JSON { apiKey, agentId }; default: repo root `.arena-credentials`
 *   ARENA_API_KEY / ARENA_AGENT_ID — optional instead of file
 *   ARENA_STATE_PATH — optional JSON state file; default: repo root `.arena-worker-state.json`
 *   ARENA_POLL_MS — poll interval (default 45000)
 *   ARENA_POLL_JITTER_MS — extra random 0..n ms each loop (default 5000)
 *   ARENA_DEADLINE_BUFFER_MS — skip challenge if less than this ms to deadline (default 20000)
 *   ARENA_DRY_RUN=1 — log payload, do not POST
 *   ARENA_MAX_PER_TICK — max submissions per wake (default 1)
 *
 * Run from repo: `cd api && npm run arena-worker`
 * One shot: `cd api && npm run arena-worker:once`
 */
import { loadArenaCredentials } from "./credentials.js";
import {
  fetchAllSubmittedChallengeIds,
  listActiveCompetitions,
  listCurrentChallenges,
  normalizeChallenges,
  pickFirstActiveCompetition,
  submitPumpOrDump,
} from "./arenaApi.js";
import { buildPumpDumpDecision } from "./decideSubmission.js";
import {
  fetchDexscreenerForMint,
  fetchRugcheckReport,
  pickBestPair,
} from "./marketSignals.js";
import { retryAsync } from "./retryAsync.js";
import {
  loadWorkerState,
  recordSuccessfulSubmission,
  saveWorkerState,
} from "./workerState.js";

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function log(...args) {
  const t = new Date().toISOString();
  console.log(`[arena-worker ${t}]`, ...args);
}

/**
 * @param {import('./workerState.js').ArenaWorkerState | null} state
 */
async function processOneChallenge(apiKey, challenge, state) {
  const mint = challenge.data?.contractAddress;
  if (!mint || typeof mint !== "string") {
    log("skip challenge (no contract)", challenge.id);
    return;
  }

  const t0 = Date.now();
  const [dexJson, rugReport] = await retryAsync(
    () =>
      Promise.all([fetchDexscreenerForMint(mint), fetchRugcheckReport(mint)]),
    { tries: 3, baseDelayMs: 500 }
  );
  const pair = pickBestPair(dexJson);
  const decisionTimeMs = Math.max(1, Date.now() - t0);

  const payload = buildPumpDumpDecision({
    pair,
    rugReport,
    tokenSymbol: challenge.data?.tokenSymbol,
    tokenName: challenge.data?.tokenName,
    contractAddress: mint,
    decisionTimeMs,
    challengeId: challenge.id,
  });

  if (process.env.ARENA_DRY_RUN === "1") {
    log("[dry-run]", challenge.id, mint, payload.prediction, payload.confidence);
    return;
  }

  const result = await submitPumpOrDump(apiKey, challenge.id, payload);
  log("submitted", challenge.id, payload.prediction, result?.submissionId ?? result);

  if (state) {
    recordSuccessfulSubmission(challenge.id, payload.chatMessage, state);
    await saveWorkerState(state);
  }
}

async function tick(apiKey) {
  const dry = process.env.ARENA_DRY_RUN === "1";
  const maxPer = Math.max(
    1,
    Math.min(10, Number.parseInt(process.env.ARENA_MAX_PER_TICK || "1", 10) || 1)
  );
  const deadlineBuffer =
    Math.max(0, Number.parseInt(process.env.ARENA_DEADLINE_BUFFER_MS || "20000", 10)) || 20000;

  const state = dry ? null : await loadWorkerState();

  const active = await retryAsync(() => listActiveCompetitions(apiKey), { tries: 3 });
  const competition = pickFirstActiveCompetition(active);
  if (!competition) {
    log("no active competition (between seasons?)");
    return;
  }

  if (competition.gameType && competition.gameType !== "PumpfunPumpOrDumpPrediction") {
    log("skip: game type", competition.gameType);
    return;
  }

  const [currentRaw, apiIds] = await Promise.all([
    retryAsync(() => listCurrentChallenges(apiKey, competition.id), { tries: 3 }),
    retryAsync(() => fetchAllSubmittedChallengeIds(apiKey, competition.id), { tries: 3 }),
  ]);

  const done = new Set(apiIds);
  if (state?.submittedChallengeIds?.length) {
    for (const id of state.submittedChallengeIds) done.add(id);
  }

  const now = Date.now();
  let open = normalizeChallenges(currentRaw).filter((c) => {
    if (String(c.status).toLowerCase() !== "open") return false;
    if (done.has(c.id)) return false;
    if (typeof c.submissionDeadline === "number") {
      if (c.submissionDeadline <= now) return false;
      if (c.submissionDeadline - now < deadlineBuffer) return false;
    }
    return true;
  });

  open.sort((a, b) => (a.submissionDeadline ?? 0) - (b.submissionDeadline ?? 0));

  if (open.length === 0) {
    log("no open challenges to submit", competition.name || competition.id);
    return;
  }

  log("competition", competition.name, "| pending challenges:", open.length);

  let n = 0;
  for (const ch of open) {
    if (n >= maxPer) break;
    try {
      await processOneChallenge(apiKey, ch, state);
      n += 1;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      log("error", ch.id, msg);
    }
  }

  if (!dry && n === 0 && open.length > 0) {
    log("no submission this tick (errors above?)");
  }
}

async function main() {
  const creds = await loadArenaCredentials();
  const once = process.argv.includes("--once");
  const pollMs = Math.max(15_000, Number.parseInt(process.env.ARENA_POLL_MS || "45000", 10) || 45_000);
  const jitterMax = Math.max(0, Number.parseInt(process.env.ARENA_POLL_JITTER_MS || "5000", 10) || 5000);

  log("starting", once ? "single run" : `poll ~${pollMs}ms + jitter 0-${jitterMax}ms`, "| agent", creds.agentId);

  if (once) {
    await tick(creds.apiKey);
    return;
  }

  for (;;) {
    try {
      await tick(creds.apiKey);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      log("tick failed", msg);
    }
    const jitter = jitterMax > 0 ? Math.floor(Math.random() * (jitterMax + 1)) : 0;
    await sleep(pollMs + jitter);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
