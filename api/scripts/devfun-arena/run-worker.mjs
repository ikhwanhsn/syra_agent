/**
 * DevFun Arena worker: polls open Pump/Dump challenges, scores with Dexscreener + Rugcheck,
 * paginated submission history, retries, optional local state dedup, deadline buffer, poll jitter.
 *
 * Env:
 *   ARENA_CREDENTIALS_PATH — optional path to JSON { apiKey, agentId }; default: repo root `.arena-credentials`
 *   ARENA_API_KEY / ARENA_AGENT_ID — optional instead of file
 *   ARENA_STATE_PATH — optional JSON state file; default: repo root `.arena-worker-state.json`
 *   ARENA_SKIP_LOCAL_STATE=1 — dedup from Arena API only (ignore .arena-worker-state.json IDs; fixes poisoned state)
 *   ARENA_POLL_MS — poll interval (default 15000)
 *   ARENA_POLL_JITTER_MS — extra random 0..n ms each loop (default 2000)
 *   ARENA_DEADLINE_BUFFER_MS — skip if less than this ms to deadline (default 800; set 0 to disable)
 *   ARENA_DRY_RUN=1 — log payload, do not POST
 *   ARENA_MAX_PER_TICK — max submissions per wake (default 10)
 *   ARENA_DEBUG=1 — log why challenges were filtered out
 *   ARENA_SOLANA_RPC_URL or SOLANA_RPC_URL — Helius/Ankr etc. for getTokenLargestAccounts (holder concentration)
 *
 * Run from repo: `cd api && npm run arena-worker`
 * One shot: `cd api && npm run arena-worker:once`
 */
import { loadArenaCredentials } from "./credentials.js";
import {
  fetchAllSubmittedChallengeIds,
  isExplicitlyClosedStatus,
  listActiveCompetitions,
  listCurrentChallenges,
  normalizeChallenges,
  pickFirstActiveCompetition,
  submitPumpOrDump,
  toEpochMs,
} from "./arenaApi.js";
import { buildPumpDumpDecision } from "./decideSubmission.js";
import { buildMarketContext } from "./marketContext.js";
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

function resolveMint(challenge) {
  const data = challenge?.data && typeof challenge.data === "object" ? challenge.data : {};
  const d = /** @type {Record<string, unknown>} */ (data);
  const a =
    typeof d.contractAddress === "string"
      ? d.contractAddress.trim()
      : typeof d.mint === "string"
        ? d.mint.trim()
        : "";
  if (a) return a;
  const u = challenge?.uniqueId;
  return typeof u === "string" ? u.trim() : "";
}

/**
 * @param {import('./workerState.js').ArenaWorkerState | null} state
 */
async function processOneChallenge(apiKey, challenge, state) {
  const mint = resolveMint(challenge);
  if (!mint) {
    log("skip challenge (no mint/contract)", challenge.id);
    return;
  }

  const t0 = Date.now();
  const [dexJson, rugReport] = await retryAsync(
    () =>
      Promise.all([fetchDexscreenerForMint(mint), fetchRugcheckReport(mint)]),
    { tries: 3, baseDelayMs: 400 }
  );
  const pair = pickBestPair(dexJson);
  const marketContext = await buildMarketContext({
    mint,
    priceAtRelease: challenge.data?.priceAtRelease ?? null,
    pair,
  });
  const decisionTimeMs = Math.max(1, Date.now() - t0);

  const payload = buildPumpDumpDecision({
    pair,
    rugReport,
    tokenSymbol: challenge.data?.tokenSymbol,
    tokenName: challenge.data?.tokenName,
    contractAddress: mint,
    decisionTimeMs,
    challengeId: challenge.id,
    marketContext,
    priceAtRelease: challenge.data?.priceAtRelease ?? null,
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
  const debug = process.env.ARENA_DEBUG === "1";
  const skipLocalState = process.env.ARENA_SKIP_LOCAL_STATE === "1";
  const maxPer = Math.max(
    1,
    Math.min(10, Number.parseInt(process.env.ARENA_MAX_PER_TICK || "10", 10) || 10)
  );
  const rawBuf = Number.parseInt(process.env.ARENA_DEADLINE_BUFFER_MS ?? "800", 10);
  const deadlineBuffer = Number.isFinite(rawBuf) ? Math.max(0, rawBuf) : 800;

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
  if (!skipLocalState && state?.submittedChallengeIds?.length) {
    for (const id of state.submittedChallengeIds) done.add(id);
  } else if (skipLocalState && debug) {
    log("ARENA_SKIP_LOCAL_STATE=1 — using API submission list only for dedup");
  }

  const now = Date.now();
  const rawList = normalizeChallenges(currentRaw);
  let closed = 0;
  let already = 0;
  let late = 0;
  let soon = 0;

  const open = rawList.filter((c) => {
    if (isExplicitlyClosedStatus(c.status)) {
      closed += 1;
      return false;
    }
    if (done.has(c.id)) {
      already += 1;
      return false;
    }
    const dl = toEpochMs(c.submissionDeadline);
    if (dl !== null) {
      if (dl <= now) {
        late += 1;
        return false;
      }
      if (deadlineBuffer > 0 && dl - now < deadlineBuffer) {
        soon += 1;
        return false;
      }
    }
    return true;
  });

  open.sort((a, b) => {
    const da = toEpochMs(a.submissionDeadline) ?? Number.MAX_SAFE_INTEGER;
    const db = toEpochMs(b.submissionDeadline) ?? Number.MAX_SAFE_INTEGER;
    return da - db;
  });

  if (debug) {
    log(
      "debug filter",
      "raw=",
      rawList.length,
      "closed=",
      closed,
      "alreadyDone=",
      already,
      "pastDeadline=",
      late,
      "insideBuffer=",
      soon,
      "eligible=",
      open.length
    );
  }

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
  const pollMs = Math.max(8_000, Number.parseInt(process.env.ARENA_POLL_MS || "15000", 10) || 15_000);
  const jitterMax = Math.max(0, Number.parseInt(process.env.ARENA_POLL_JITTER_MS || "2000", 10) || 2000);

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
