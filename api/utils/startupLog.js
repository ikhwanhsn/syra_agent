/**
 * Concise API boot logging. Routine scheduler/status lines are suppressed unless
 * API_STARTUP_VERBOSE=true (or 1/yes).
 */

function isStartupVerbose() {
  const v = String(process.env.API_STARTUP_VERBOSE || "").toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

/** Always shown — server ready, DB connected, config failures. */
export function startupInfo(...args) {
  console.log(...args);
}

/** Scheduler registration, next-run timing, disabled notices — opt-in only. */
export function startupVerbose(...args) {
  if (isStartupVerbose()) {
    console.log(...args);
  }
}

/** Warnings that affect behavior (missing secrets, load failures). */
export function startupWarn(...args) {
  console.warn(...args);
}

export function isApiStartupVerbose() {
  return isStartupVerbose();
}
