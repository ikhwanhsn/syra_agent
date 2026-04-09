/**
 * DevFun Arena worker: arena-v3 — Dexscreener trending (boosts + profiles), meta/name overlap,
 * optional Exa narrative + rug + microstructure tape, online logistic learner (.arena-learner-state.json).
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
 *   ARENA_DISABLE_LEARN=1 — skip submission-history adjustments (threshold/bias/confidence)
 *   ARENA_LEARN_MAX_ROWS — max settled rows to scan (default 160, cap 500)
 *   ARENA_SOLANA_RPC_URL or SOLANA_RPC_URL — Helius/Ankr etc. for getTokenLargestAccounts (holder concentration)
 *   EXA_API_KEY — optional; enables Exa web/news/social narrative blend (see narrativeContext.js)
 *   ARENA_DISABLE_NARRATIVE=1 — skip Exa narrative fetch
 *   ARENA_NARRATIVE_WEIGHT — composite blend 0..0.35 (default 0.15)
 *   ARENA_NARRATIVE_TIMEOUT_MS — default 12000
 *   DEXTOOLS_API_KEY — optional; if set, attempts Dextools trending (URL may need DEXTOOLS_API_BASE_URL)
 *   ARENA_DISABLE_SGD=1 — skip online learner train/save after tick
 *   ARENA_LEARNER_LR — SGD step scale (default 0.06)
 *   ARENA_SUBMIT_CONCURRENCY — process up to N challenges in parallel per tick (default 1; try 2–3 if deadlines slip)
 *
 * Deploy notes:
 *   • 24/7: run `npm run arena-worker` (NO --once). `--once` exits after one tick — common “deployed but never calls again”.
 *   • Set ARENA_API_KEY + ARENA_AGENT_ID on the host if `.arena-credentials` is not in the image.
 *   • Slow ticks (Exa + Dex per coin) can miss windows; use ARENA_DISABLE_NARRATIVE=1 and/or ARENA_DEADLINE_BUFFER_MS=0 if logs show high `insideBuffer`/`late`.
 *
 * Run from repo: `cd api && npm run arena-worker`
 * One shot: `cd api && npm run arena-worker:once`
 */
import {
  loadFeatureLog,
  recordArenaFeatures,
  saveFeatureLog,
} from "./arenaFeatureLog.js";
import {
  loadLearnerState,
  saveLearnerState,
  trainLearnerFromSubmissions,
} from "./arenaLearner.js";
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
import { buildArenaV2Decision } from "./decideArenaV2.js";
import {
  computeLearnedAdjustments,
  fetchSubmissionHistory,
} from "./learnFromSubmissions.js";
import { buildMarketContext } from "./marketContext.js";
import { fetchNarrativeForToken } from "./narrativeContext.js";
import {
  fetchDexscreenerForMint,
  fetchRugcheckReport,
  pickBestPair,
} from "./marketSignals.js";
import { retryAsync } from "./retryAsync.js";
import { fetchTrendingSnapshot, snapshotIsUsable } from "./trendingFeeds.js";
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

/** Serialize `.arena-worker-state.json` writes when ARENA_SUBMIT_CONCURRENCY > 1. */
let workerStateWriteChain = Promise.resolve();

/**
 * @param {() => Promise<void>} fn
 */
function enqueueWorkerStateWrite(fn) {
  const run = workerStateWriteChain.then(fn);
  workerStateWriteChain = run.catch(() => {});
  return run;
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
 * @param {import('./learnFromSubmissions.js').LearnedAdjustments | null} learned
 * @param {import('./trendingFeeds.js').TrendingSnapshot} trendingSnapshot
 * @param {import('./arenaLearner.js').LearnerWeights} learnerW
 * @param {import('./arenaFeatureLog.js').FeatureLogFile} featureLog
 * @param {boolean} dry
 */
async function processOneChallenge(
  apiKey,
  challenge,
  state,
  learned,
  trendingSnapshot,
  learnerW,
  featureLog,
  dry
) {
  const mint = resolveMint(challenge);
  if (!mint) {
    log("skip challenge (no mint/contract)", challenge.id);
    return;
  }

  const t0 = Date.now();
  const [dexJson, rugReport, narrativeContext] = await Promise.all([
    retryAsync(() => fetchDexscreenerForMint(mint), { tries: 3, baseDelayMs: 400 }),
    retryAsync(() => fetchRugcheckReport(mint), { tries: 3, baseDelayMs: 400 }),
    fetchNarrativeForToken({
      tokenName: challenge.data?.tokenName,
      tokenSymbol: challenge.data?.tokenSymbol,
      mint,
    }),
  ]);
  const pair = pickBestPair(dexJson);
  const marketContext = await buildMarketContext({
    mint,
    priceAtRelease: challenge.data?.priceAtRelease ?? null,
    pair,
  });
  const decisionTimeMs = Math.max(1, Date.now() - t0);

  const { payload, features } = buildArenaV2Decision({
    pair,
    rugReport,
    tokenSymbol: challenge.data?.tokenSymbol,
    tokenName: challenge.data?.tokenName,
    contractAddress: mint,
    decisionTimeMs,
    challengeId: challenge.id,
    marketContext,
    priceAtRelease: challenge.data?.priceAtRelease ?? null,
    learnedAdjustments: learned,
    narrativeContext,
    trendingSnapshot,
    learnerWeights: learnerW,
  });

  if (dry) {
    log("[dry-run]", challenge.id, mint, payload.prediction, payload.confidence, payload.reasoning.slice(0, 72));
    return;
  }

  const result = await submitPumpOrDump(apiKey, challenge.id, payload);
  log("submitted", challenge.id, payload.prediction, result?.submissionId ?? result);

  recordArenaFeatures(challenge.id, mint, features, featureLog);

  if (state) {
    await enqueueWorkerStateWrite(async () => {
      recordSuccessfulSubmission(challenge.id, payload.chatMessage, state);
      await saveWorkerState(state);
    });
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
    const cname = competition.name || competition.id;
    if (rawList.length === 0) {
      log(
        "no eligible challenges — arena returned 0 open rows for challenge/current (waiting for new drops, or API empty)."
      );
    } else {
      log(
        "no eligible challenges — all filtered:",
        "raw=",
        rawList.length,
        "closed=",
        closed,
        "alreadySubmitted=",
        already,
        "pastDeadline=",
        late,
        "insideDeadlineBuffer=",
        soon,
        `(buffer ${deadlineBuffer}ms).`,
        "Game:",
        cname
      );
      if (soon > 0 && late === 0 && already < rawList.length) {
        log(
          "hint: many rows in `insideDeadlineBuffer` — worker may be too slow (narrative/Dex per coin). Try ARENA_SUBMIT_CONCURRENCY=2, ARENA_DISABLE_NARRATIVE=1, or ARENA_DEADLINE_BUFFER_MS=0"
        );
      }
    }
    return;
  }

  log("competition", competition.name, "| pending challenges:", open.length);

  const trendingSnapshot = await fetchTrendingSnapshot();
  if (debug) {
    log(
      "trending",
      "mints",
      trendingSnapshot.solMintsAll.size,
      "terms",
      trendingSnapshot.termWeights.size,
      "boost",
      trendingSnapshot.boostRows,
      "prof",
      trendingSnapshot.profileRows,
      trendingSnapshot.error || "ok"
    );
  }
  if (!snapshotIsUsable(trendingSnapshot) && debug) {
    log("trending weak — meta signal may be thin");
  }

  /** @type {import('./arenaFeatureLog.js').FeatureLogFile} */
  const featureLog = await loadFeatureLog();
  const learnerW = await loadLearnerState();

  /** @type {import('./learnFromSubmissions.js').LearnedAdjustments | null} */
  let learned = null;
  if (process.env.ARENA_DISABLE_LEARN !== "1") {
    try {
      const maxRows = Math.min(
        500,
        Math.max(40, Number.parseInt(process.env.ARENA_LEARN_MAX_ROWS || "160", 10) || 160)
      );
      const hist = await fetchSubmissionHistory(apiKey, competition.id, maxRows);
      learned = computeLearnedAdjustments(hist);
      if (debug && learned.sampleSize >= 4) {
        log(
          "learn",
          "n=",
          learned.sampleSize,
          "pump",
          `${learned.directionalPump.wins}/${learned.directionalPump.n}`,
          "dump",
          `${learned.directionalDump.wins}/${learned.directionalDump.n}`,
          "bias",
          learned.compositeBias.toFixed(4),
          "dP",
          learned.thPumpDelta.toFixed(4),
          "dD",
          learned.thDumpDelta.toFixed(4),
          "cs",
          learned.confidenceScale.toFixed(2)
        );
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      log("learn skipped", msg);
    }
  }

  const conc = Math.min(
    4,
    Math.max(1, Number.parseInt(process.env.ARENA_SUBMIT_CONCURRENCY || "1", 10) || 1)
  );
  const batch = open.slice(0, maxPer);
  let n = 0;

  if (conc <= 1) {
    for (const ch of batch) {
      try {
        await processOneChallenge(apiKey, ch, state, learned, trendingSnapshot, learnerW, featureLog, dry);
        n += 1;
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        log("error", ch.id, msg);
      }
    }
  } else {
    log("submit concurrency", conc);
    for (let i = 0; i < batch.length; i += conc) {
      const slice = batch.slice(i, i + conc);
      const results = await Promise.allSettled(
        slice.map((ch) =>
          processOneChallenge(apiKey, ch, state, learned, trendingSnapshot, learnerW, featureLog, dry)
        )
      );
      for (let j = 0; j < results.length; j++) {
        const r = results[j];
        if (r.status === "fulfilled") n += 1;
        else log("error", slice[j]?.id, r.reason instanceof Error ? r.reason.message : String(r.reason));
      }
    }
  }

  if (!dry && n === 0 && open.length > 0) {
    log("no submission this tick (errors above?)");
  }

  if (!dry && process.env.ARENA_DISABLE_SGD !== "1") {
    try {
      await saveFeatureLog(featureLog);
      const trainRows = Math.min(200, Math.max(40, Number.parseInt(process.env.ARENA_LEARN_MAX_ROWS || "160", 10) || 160));
      const hist = await fetchSubmissionHistory(apiKey, competition.id, trainRows);
      trainLearnerFromSubmissions(hist, featureLog, learnerW, 100);
      await saveLearnerState(learnerW);
      if (debug) log("sgd", "learner_updates", learnerW.updates);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      log("learner train skipped", msg);
    }
  }
}

async function main() {
  const creds = await loadArenaCredentials();
  const once = process.argv.includes("--once");
  const pollMs = Math.max(8_000, Number.parseInt(process.env.ARENA_POLL_MS || "15000", 10) || 15_000);
  const jitterMax = Math.max(0, Number.parseInt(process.env.ARENA_POLL_JITTER_MS || "2000", 10) || 2000);

  log("starting", once ? "single run" : `poll ~${pollMs}ms + jitter 0-${jitterMax}ms`, "| agent", creds.agentId);
  if (once) {
    log(
      "NOTE: --once performs one tick then exits. For production use `npm run arena-worker` without --once (systemd, Docker restart:unless-stopped, Railway always-on, etc.)."
    );
  }
  if (process.env.ARENA_DRY_RUN === "1") {
    log("WARNING: ARENA_DRY_RUN=1 — no POST to arena; remove for live submissions.");
  }

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
