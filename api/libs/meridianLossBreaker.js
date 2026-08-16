/**
 * Meridian real circuit breaker: pause the live engine after daily loss,
 * consecutive losses, or session drawdown. Reuses lpRealLossBreaker math.
 *
 * Wired from runMeridianEngineTick after engine state sync so dailyMaxLossSol
 * is actually enforced (it was previously a stored field only).
 */
import MeridianRealConfig from "../models/MeridianRealConfig.js";
import MeridianRealPosition from "../models/MeridianRealPosition.js";
import {
  countConsecutiveLosses,
  evaluateLossBreaker,
  sumRealizedNetPnlSol,
} from "./lpRealLossBreaker.js";
import { MERIDIAN_ENGINE } from "../config/onchainEarnExperiments.js";

const CLOSED_STATUSES = Object.freeze(["closed_win", "closed_loss", "expired"]);
const DAY_MS = 24 * 60 * 60_000;

/** Conservative vs LP real (4): trip sooner on a smaller Meridian book. */
export const MERIDIAN_MAX_CONSECUTIVE_LOSSES = 3;
export const MERIDIAN_MAX_SESSION_DRAWDOWN_PCT = 20;
export const MERIDIAN_ABSOLUTE_KILL_PCT = 15;
export const MERIDIAN_DEFAULT_DAILY_MAX_LOSS_SOL = 0.5;

function toNum(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * Daily-loss gate (calendar-independent rolling 24h).
 * @param {{ todayPnlSol: number; dailyMaxLossSol: number }} input
 * @returns {{ shouldPause: boolean; forceClose: boolean; reason: 'daily_loss_cap' | null }}
 */
export function evaluateMeridianDailyLoss(input = {}) {
  const todayPnlSol = toNum(input.todayPnlSol);
  const dailyMaxLossSol = Math.max(0, toNum(input.dailyMaxLossSol, MERIDIAN_DEFAULT_DAILY_MAX_LOSS_SOL));
  if (dailyMaxLossSol > 0 && todayPnlSol <= -dailyMaxLossSol + 1e-12) {
    return { shouldPause: true, forceClose: true, reason: "daily_loss_cap" };
  }
  return { shouldPause: false, forceClose: false, reason: null };
}

/**
 * Combined Meridian decision: daily loss first, then LP-style consecutive / drawdown / kill.
 *
 * @param {{
 *   consecutiveLosses: number;
 *   realizedNetPnlSol: number;
 *   capitalBaselineSol: number;
 *   todayPnlSol: number;
 *   dailyMaxLossSol?: number;
 *   maxConsecutiveLosses?: number;
 *   maxDrawdownPct?: number;
 *   absoluteKillPct?: number;
 * }} input
 */
export function evaluateMeridianLossDecision(input = {}) {
  const daily = evaluateMeridianDailyLoss({
    todayPnlSol: input.todayPnlSol,
    dailyMaxLossSol: input.dailyMaxLossSol,
  });
  if (daily.shouldPause) {
    return {
      shouldPause: true,
      forceClose: true,
      reason: daily.reason,
      consecutiveLosses: Math.max(0, Math.floor(Number(input.consecutiveLosses) || 0)),
      drawdownPct: 0,
      todayPnlSol: toNum(input.todayPnlSol),
    };
  }
  const d = evaluateLossBreaker({
    consecutiveLosses: input.consecutiveLosses,
    realizedNetPnlSol: input.realizedNetPnlSol,
    capitalBaselineSol: input.capitalBaselineSol,
    maxConsecutiveLosses: input.maxConsecutiveLosses ?? MERIDIAN_MAX_CONSECUTIVE_LOSSES,
    maxDrawdownPct: input.maxDrawdownPct ?? MERIDIAN_MAX_SESSION_DRAWDOWN_PCT,
    absoluteKillPct: input.absoluteKillPct ?? MERIDIAN_ABSOLUTE_KILL_PCT,
  });
  return { ...d, todayPnlSol: toNum(input.todayPnlSol) };
}

/**
 * Enforce breaker for one agent (or every enabled config). On trip: pause, force-close, stop engine.
 * @param {{ agentAddress?: string | null }} [opts]
 */
export async function enforceMeridianLossBreaker({ agentAddress } = {}) {
  const filter = { enabled: true };
  if (agentAddress) filter.agentAddress = String(agentAddress);
  const configs = await MeridianRealConfig.find(filter).lean();
  if (!configs.length) return { skipped: true, reason: "no_enabled_config", tripped: [] };

  const tripped = [];
  for (const cfg of configs) {
    if (cfg.lossPausedAt) continue;
    const addr = cfg.agentAddress;
    if (!addr) continue;

    const closedNewestFirst = await MeridianRealPosition.find({
      agentAddress: addr,
      status: { $in: [...CLOSED_STATUSES] },
    })
      .sort({ resolvedAt: -1, openedAt: -1 })
      .limit(64)
      .select({ status: 1, realNetPnlSol: 1, resolvedAt: 1 })
      .lean();

    const consecutiveLosses = countConsecutiveLosses(closedNewestFirst);
    const realizedNetPnlSol = sumRealizedNetPnlSol(closedNewestFirst);
    const since = Date.now() - DAY_MS;
    const todayRows = closedNewestFirst.filter((row) => {
      const t = row?.resolvedAt ? new Date(row.resolvedAt).getTime() : 0;
      return t >= since;
    });
    const todayPnlSol = sumRealizedNetPnlSol(todayRows);
    const capitalBaselineSol = Math.max(
      0,
      toNum(cfg.capitalBaselineSol, 0) || toNum(MERIDIAN_ENGINE.capSol, 1),
    );
    const dailyMaxLossSol = toNum(cfg.dailyMaxLossSol, MERIDIAN_DEFAULT_DAILY_MAX_LOSS_SOL);

    const decision = evaluateMeridianLossDecision({
      consecutiveLosses,
      realizedNetPnlSol,
      capitalBaselineSol,
      todayPnlSol,
      dailyMaxLossSol,
    });

    if (!decision.shouldPause || !decision.reason) continue;

    const pauseAt = new Date();
    await MeridianRealConfig.updateOne(
      { agentAddress: addr },
      {
        $set: {
          enabled: false,
          lossPausedAt: pauseAt,
          lastError: decision.reason,
          depositsPaused: true,
          closeAllRequested: Boolean(decision.forceClose),
        },
      },
    );

    let closeResult = null;
    let engineStop = null;
    if (decision.forceClose) {
      const { closeAllEnginePositions } = await import("./meridianEngineSync.js");
      const { stopEngine } = await import("./meridianEngineSupervisor.js");
      closeResult = await closeAllEnginePositions({ agentAddress: addr }).catch((e) => ({
        error: e instanceof Error ? e.message : String(e),
      }));
      engineStop = await stopEngine().catch((e) => ({
        error: e instanceof Error ? e.message : String(e),
      }));
    }

    console.warn(
      `[Meridian] loss breaker for ${addr}: ${decision.reason}` +
        ` (consecutiveLosses=${decision.consecutiveLosses}, todayPnlSol=${todayPnlSol.toFixed(4)},` +
        ` drawdownPct=${Number(decision.drawdownPct || 0).toFixed(1)}, forceClose=${Boolean(decision.forceClose)})`,
    );

    tripped.push({
      agentAddress: addr,
      reason: decision.reason,
      consecutiveLosses: decision.consecutiveLosses,
      todayPnlSol,
      realizedNetPnlSol,
      drawdownPct: decision.drawdownPct,
      closeResult,
      engineStop,
    });
  }

  return { ok: true, checked: configs.length, tripped };
}
