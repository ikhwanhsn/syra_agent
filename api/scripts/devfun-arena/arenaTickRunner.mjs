/**
 * Single-flight arena tick: shared by POST /internal/arena-worker/tick and API in-process schedule.
 */
import { isArenaPaused } from "./arenaPause.mjs";
import { loadArenaCredentials } from "./credentials.js";
import { runArenaWorkerTick } from "./arenaWorkerTick.mjs";

let tickRunning = false;

/**
 * @returns {Promise<
 *   | { ok: true; data: Awaited<ReturnType<typeof runArenaWorkerTick>> }
 *   | { ok: false; skipped: true; reason: "already_running" }
 *   | { ok: false; skipped: false; error: string }
 * >}
 */
export async function tryRunArenaWorkerTick() {
  if (isArenaPaused()) {
    return { ok: true, data: { idle: true, reason: "arena_paused" } };
  }
  if (tickRunning) {
    return { ok: false, skipped: true, reason: "already_running" };
  }
  tickRunning = true;
  try {
    const creds = await loadArenaCredentials();
    const data = await runArenaWorkerTick(creds.apiKey);
    return { ok: true, data };
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    return { ok: false, skipped: false, error };
  } finally {
    tickRunning = false;
  }
}

/**
 * @param {{ intervalMs: number; runImmediately?: boolean }} opts
 * @returns {ReturnType<typeof setInterval>}
 */
export function startArenaWorkerInterval(opts) {
  const { intervalMs, runImmediately = false } = opts;
  const run = () => {
    void tryRunArenaWorkerTick()
      .then((out) => {
        if (out.ok) {
          void out.data?.challengesProcessed;
        } else if (out.skipped) {
          console.warn("[arena-schedule] tick skipped:", out.reason);
        } else {
          console.warn("[arena-schedule] tick failed:", out.error);
        }
      })
      .catch((err) => console.warn("[arena-schedule] tick unexpected:", err?.message || err));
  };
  if (runImmediately) run();
  return setInterval(run, intervalMs);
}
