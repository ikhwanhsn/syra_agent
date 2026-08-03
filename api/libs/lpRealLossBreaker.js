/**
 * Per-agent LP Real circuit breaker: pause new opens after repeated losses
 * or a large session drawdown. Pure helpers — easy to unit test.
 *
 * Also exposes an absolute capital-kill threshold (default -20% of baseline)
 * that is independent of consecutive-loss counting.
 */
import {
  getLpRealMaxConsecutiveLosses,
  getLpRealMaxSessionDrawdownPct,
  getLpRealAbsoluteKillPct,
} from "../config/lpRealAgentAccess.js";

/**
 * Count trailing closed_loss rows from newest to oldest.
 * Stops at the first non-loss decided status (closed_win / expired).
 * @param {Array<{ status?: string }>} closedNewestFirst
 * @returns {number}
 */
export function countConsecutiveLosses(closedNewestFirst) {
  let n = 0;
  for (const row of closedNewestFirst || []) {
    const status = String(row?.status || "");
    if (status === "closed_loss") {
      n += 1;
      continue;
    }
    if (status === "closed_win" || status === "expired") break;
    // Skip error / claim_only / unknown without breaking the streak.
  }
  return n;
}

/**
 * Session drawdown as % of capital baseline (realized losses only).
 * Positive number means money lost (e.g. 30 = 30% drawdown).
 * @param {number} realizedNetPnlSol
 * @param {number} capitalBaselineSol
 * @returns {number}
 */
export function computeSessionDrawdownPct(realizedNetPnlSol, capitalBaselineSol) {
  const baseline = Number(capitalBaselineSol);
  const pnl = Number(realizedNetPnlSol);
  if (!Number.isFinite(baseline) || baseline <= 0 || !Number.isFinite(pnl)) return 0;
  if (pnl >= 0) return 0;
  return Math.min(100, ((-pnl) / baseline) * 100);
}

/**
 * Decide whether to trip the loss circuit breaker.
 * Priority: absolute_kill → drawdown_stop → stopped_after_losses.
 *
 * @param {{
 *   consecutiveLosses: number;
 *   realizedNetPnlSol: number;
 *   capitalBaselineSol: number;
 *   maxConsecutiveLosses?: number;
 *   maxDrawdownPct?: number;
 *   absoluteKillPct?: number;
 * }} input
 * @returns {{
 *   shouldPause: boolean;
 *   forceClose: boolean;
 *   reason: 'absolute_kill' | 'drawdown_stop' | 'stopped_after_losses' | null;
 *   consecutiveLosses: number;
 *   drawdownPct: number;
 * }}
 */
export function evaluateLossBreaker(input = {}) {
  const consecutiveLosses = Math.max(0, Math.floor(Number(input.consecutiveLosses) || 0));
  const maxConsecutive =
    input.maxConsecutiveLosses != null
      ? Math.max(1, Math.floor(Number(input.maxConsecutiveLosses)))
      : getLpRealMaxConsecutiveLosses();
  const maxDrawdownPct =
    input.maxDrawdownPct != null
      ? Number(input.maxDrawdownPct)
      : getLpRealMaxSessionDrawdownPct();
  const absoluteKillPct =
    input.absoluteKillPct != null
      ? Number(input.absoluteKillPct)
      : getLpRealAbsoluteKillPct();
  const drawdownPct = computeSessionDrawdownPct(
    input.realizedNetPnlSol,
    input.capitalBaselineSol,
  );

  // Absolute kill: hard floor independent of consecutive counting (e.g. -20%).
  if (
    Number.isFinite(absoluteKillPct) &&
    absoluteKillPct > 0 &&
    drawdownPct >= absoluteKillPct - 1e-9
  ) {
    return {
      shouldPause: true,
      forceClose: true,
      reason: "absolute_kill",
      consecutiveLosses,
      drawdownPct,
    };
  }

  if (Number.isFinite(maxDrawdownPct) && maxDrawdownPct > 0 && drawdownPct >= maxDrawdownPct - 1e-9) {
    return {
      shouldPause: true,
      forceClose: true,
      reason: "drawdown_stop",
      consecutiveLosses,
      drawdownPct,
    };
  }
  if (consecutiveLosses >= maxConsecutive) {
    return {
      shouldPause: true,
      forceClose: true,
      reason: "stopped_after_losses",
      consecutiveLosses,
      drawdownPct,
    };
  }
  return {
    shouldPause: false,
    forceClose: false,
    reason: null,
    consecutiveLosses,
    drawdownPct,
  };
}

/**
 * Sum realized net PnL from closed position rows (ground truth for breaker).
 * Prefer this over getLpRealSummary which can diverge via session/epoch filters.
 * @param {Array<{ realNetPnlSol?: number|null }>} closedRows
 * @returns {number}
 */
export function sumRealizedNetPnlSol(closedRows) {
  let sum = 0;
  for (const row of closedRows || []) {
    const n = Number(row?.realNetPnlSol);
    if (Number.isFinite(n)) sum += n;
  }
  return sum;
}
