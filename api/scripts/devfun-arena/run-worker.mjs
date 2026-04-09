/**
 * DevFun Arena worker CLI — loops forever or runs one tick (--once).
 * Shared tick logic: ./arenaWorkerTick.mjs (also used by POST /internal/arena-worker/tick).
 *
 * See header in arenaWorkerTick / previous run-worker docs for env vars.
 */
import { loadArenaCredentials } from "./credentials.js";
import { runArenaWorkerTick } from "./arenaWorkerTick.mjs";

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function log(...args) {
  const t = new Date().toISOString();
  console.log(`[arena-worker ${t}]`, ...args);
}

async function main() {
  const creds = await loadArenaCredentials();
  const once = process.argv.includes("--once");
  const pollMs = Math.max(8_000, Number.parseInt(process.env.ARENA_POLL_MS || "15000", 10) || 15_000);
  const jitterMax = Math.max(0, Number.parseInt(process.env.ARENA_POLL_JITTER_MS || "2000", 10) || 2000);

  log("starting", once ? "single run" : `poll ~${pollMs}ms + jitter 0-${jitterMax}ms`, "| agent", creds.agentId);
  if (once) {
    log(
      "NOTE: --once performs one tick then exits. For production use `npm run arena-worker` without --once, API `ARENA_SCHEDULE_TICKS=1`, or POST /internal/arena-worker/tick."
    );
  }
  if (process.env.ARENA_DRY_RUN === "1") {
    log("WARNING: ARENA_DRY_RUN=1 — no POST to arena; remove for live submissions.");
  }

  if (once) {
    await runArenaWorkerTick(creds.apiKey);
    return;
  }

  for (;;) {
    try {
      await runArenaWorkerTick(creds.apiKey);
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
