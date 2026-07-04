/**
 * Helpers to skip no-op MongoDB heartbeat writes in resolve loops.
 * Reduces write IOPS when open positions are re-evaluated but state is unchanged.
 */

/**
 * @param {string} envKey
 * @param {number} defaultMs
 * @returns {number}
 */
export function getHeartbeatMinMs(envKey, defaultMs) {
  const raw = Number(process.env[envKey]);
  return Number.isFinite(raw) && raw >= 0 ? Math.floor(raw) : defaultMs;
}

/**
 * @param {unknown} a
 * @param {unknown} b
 * @param {number} [epsilon]
 * @returns {boolean}
 */
export function numChanged(a, b, epsilon = 0.001) {
  const na = Number(a);
  const nb = Number(b);
  if (!Number.isFinite(na) && !Number.isFinite(nb)) return false;
  if (!Number.isFinite(na) || !Number.isFinite(nb)) return true;
  return Math.abs(na - nb) > epsilon;
}

/**
 * @param {Date | string | number | null | undefined} lastEvaluatedAt
 * @param {number} heartbeatMinMs
 * @returns {boolean}
 */
export function isHeartbeatDue(lastEvaluatedAt, heartbeatMinMs) {
  if (heartbeatMinMs <= 0) return true;
  if (!lastEvaluatedAt) return true;
  const ts = new Date(lastEvaluatedAt).getTime();
  if (!Number.isFinite(ts)) return true;
  return Date.now() - ts >= heartbeatMinMs;
}

/**
 * Whether an LP experiment run resolve should persist to MongoDB.
 * @param {Record<string, unknown>} run
 * @param {{ status: string; peakPnlPct?: number; simPnlPct?: number; simNetPnlSol?: number; simFeesEarnedSol?: number; simPriceDriftPct?: number; feeTvlRatio?: number; tvlUsd?: number; volume24hUsd?: number }} fields
 * @param {{ heartbeatMinMs?: number; epsilon?: number }} [options]
 * @returns {boolean}
 */
export function shouldWriteLpRunResolve(run, fields, options = {}) {
  if (fields.status !== "open") return true;

  const heartbeatMinMs = options.heartbeatMinMs ?? getHeartbeatMinMs("LP_HEARTBEAT_MIN_MS", 5 * 60_000);
  if (isHeartbeatDue(run.lastEvaluatedAt, heartbeatMinMs)) return true;

  const epsilon = options.epsilon ?? 0.001;
  const tracked = [
    "simPnlPct",
    "simNetPnlSol",
    "simFeesEarnedSol",
    "simPriceDriftPct",
    "feeTvlRatio",
    "tvlUsd",
    "volume24hUsd",
  ];
  for (const key of tracked) {
    if (numChanged(fields[key], run[key], epsilon)) return true;
  }

  const existingPeak =
    run.screeningSnapshot != null && typeof run.screeningSnapshot === "object"
      ? /** @type {{ peakPnlPct?: number }} */ (run.screeningSnapshot).peakPnlPct
      : undefined;
  if (numChanged(fields.peakPnlPct, existingPeak, epsilon)) return true;

  return false;
}

/**
 * Whether an LP real open position should be locked and re-evaluated this tick.
 * @param {Record<string, unknown>} position
 * @param {{ forceCloseAll?: boolean; closeAllRequested?: boolean }} [ctx]
 * @param {{ heartbeatMinMs?: number }} [options]
 * @returns {boolean}
 */
export function shouldEvaluateLpRealPosition(position, ctx = {}, options = {}) {
  if (ctx.forceCloseAll || ctx.closeAllRequested) return true;
  if (position.status !== "open") return true;

  const heartbeatMinMs =
    options.heartbeatMinMs ?? getHeartbeatMinMs("LP_REAL_HEARTBEAT_MIN_MS", 5 * 60_000);
  return isHeartbeatDue(position.lastEvaluatedAt, heartbeatMinMs);
}

/**
 * Whether to persist peakPnlPct / processing unlock for an unchanged open LP real position.
 * @param {Record<string, unknown>} position
 * @param {{ peakPnlPct?: number }} exitEval
 * @param {{ epsilon?: number }} [options]
 * @returns {boolean}
 */
export function shouldWriteLpRealOpenEval(position, exitEval, options = {}) {
  const epsilon = options.epsilon ?? 0.001;
  return numChanged(exitEval.peakPnlPct, position.peakPnlPct, epsilon);
}

/**
 * Skip stocks open-run heartbeat writes when status is unchanged.
 * @param {Record<string, unknown>} run
 * @param {{ heartbeatMinMs?: number }} [options]
 * @returns {boolean}
 */
export function shouldWriteStocksRunHeartbeat(run, options = {}) {
  const heartbeatMinMs =
    options.heartbeatMinMs ?? getHeartbeatMinMs("STOCKS_HEARTBEAT_MIN_MS", 10 * 60_000);
  return isHeartbeatDue(run.lastEvaluatedAt, heartbeatMinMs);
}

/**
 * Skip real-agent config meta writes when error is unchanged and heartbeat not due.
 * @param {{ lastError?: string | null; lastSignalAt?: Date | string | null; lastResolveAt?: Date | string | null; lastRebalanceAt?: Date | string | null }} cfg
 * @param {string | null | undefined} nextError
 * @param {"signal" | "resolve" | "rebalance"} [kind]
 * @param {{ heartbeatMinMs?: number }} [options]
 * @returns {boolean}
 */
export function shouldTouchRealConfigMeta(cfg, nextError, kind = "signal", options = {}) {
  const heartbeatMinMs =
    options.heartbeatMinMs ?? getHeartbeatMinMs("REAL_CONFIG_HEARTBEAT_MIN_MS", 10 * 60_000);
  const prevError = cfg?.lastError ?? null;
  const next = nextError ?? null;
  if (prevError !== next) return true;
  const tsField =
    kind === "resolve"
      ? cfg?.lastResolveAt
      : kind === "rebalance"
        ? cfg?.lastRebalanceAt
        : cfg?.lastSignalAt;
  return isHeartbeatDue(tsField, heartbeatMinMs);
}

/**
 * Whether to insert a BTC3 skip rebalance row (throttled — avoids spam docs).
 * @param {Date | string | null | undefined} lastRebalanceAt
 * @param {{ heartbeatMinMs?: number }} [options]
 * @returns {boolean}
 */
export function shouldWriteBtc3SkipRebalance(lastRebalanceAt, options = {}) {
  const heartbeatMinMs =
    options.heartbeatMinMs ?? getHeartbeatMinMs("BTC3_SKIP_REBALANCE_MIN_MS", 30 * 60_000);
  return isHeartbeatDue(lastRebalanceAt, heartbeatMinMs);
}
