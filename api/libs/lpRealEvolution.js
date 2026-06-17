/**
 * Real-position learning loop — evolves screening thresholds from closed live trades.
 */
import LpRealPosition from "../models/LpRealPosition.js";
import LpRealEvolutionState from "../models/LpRealEvolutionState.js";
import {
  getLpRealEvolutionMinClosed,
  getLpRealMaxBotHoldersPct,
  getLpRealMaxTop10Pct,
  getLpRealMinHolders,
  getLpRealSafetyThresholds,
} from "../config/lpRealAgentAccess.js";
import { appendLpRealDecision } from "./lpRealDecisionLog.js";

const GLOBAL_ID = "global";

function toNum(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

async function getEvolutionDoc() {
  let doc = await LpRealEvolutionState.findById(GLOBAL_ID).lean();
  if (!doc) {
    await LpRealEvolutionState.create({ _id: GLOBAL_ID, lessons: [], thresholdOverrides: {} });
    doc = await LpRealEvolutionState.findById(GLOBAL_ID).lean();
  }
  return doc;
}

/**
 * @param {string} poolAddress
 */
export async function isPoolOnEvolutionCooldown(poolAddress) {
  const doc = await getEvolutionDoc();
  const addr = String(poolAddress || "").trim();
  if (!addr) return false;
  const now = Date.now();
  const hit = (doc?.poolCooldowns || []).find(
    (row) => row.poolAddress === addr && new Date(row.until).getTime() > now,
  );
  return Boolean(hit);
}

export async function getLpRealEvolutionSnapshot() {
  const doc = await getEvolutionDoc();
  return {
    lessons: doc?.lessons ?? [],
    thresholdOverrides: doc?.thresholdOverrides ?? {},
    lastEvolutionAt: doc?.lastEvolutionAt ?? null,
    lastEvolutionSummary: doc?.lastEvolutionSummary ?? null,
    closedPositionsAnalyzed: doc?.closedPositionsAnalyzed ?? 0,
    safetyThresholds: getLpRealSafetyThresholds(),
  };
}

/**
 * Analyze closed real positions and nudge safety thresholds + lessons.
 */
export async function runLpRealEvolution() {
  const minClosed = getLpRealEvolutionMinClosed();
  const closed = await LpRealPosition.find({
    status: { $in: ["closed_win", "closed_loss", "expired"] },
    realNetPnlSol: { $ne: null },
  })
    .sort({ resolvedAt: -1 })
    .limit(200)
    .lean();

  if (closed.length < minClosed) {
    return {
      skipped: true,
      reason: "insufficient_closed_positions",
      closedCount: closed.length,
      minClosed,
    };
  }

  const wins = closed.filter((p) => toNum(p.realNetPnlSol) > 0);
  const losses = closed.filter((p) => toNum(p.realNetPnlSol) <= 0);
  const winRate = wins.length / closed.length;
  const avgWin = wins.length
    ? wins.reduce((s, p) => s + toNum(p.realNetPnlSol), 0) / wins.length
    : 0;
  const avgLoss = losses.length
    ? losses.reduce((s, p) => s + toNum(p.realNetPnlSol), 0) / losses.length
    : 0;

  const lessons = [];
  const thresholdOverrides = {};

  if (winRate < 0.45) {
    lessons.push(
      `Real win rate ${(winRate * 100).toFixed(0)}% is below target — tighten holder and concentration gates.`,
    );
    thresholdOverrides.minHolders = Math.min(
      getLpRealMinHolders() + 100,
      getLpRealMinHolders() * 1.15,
    );
    thresholdOverrides.maxTop10Pct = Math.max(45, getLpRealMaxTop10Pct() - 5);
    thresholdOverrides.maxBotHoldersPct = Math.max(20, getLpRealMaxBotHoldersPct() - 3);
  } else if (winRate > 0.58 && avgWin > Math.abs(avgLoss)) {
    lessons.push(
      `Real win rate ${(winRate * 100).toFixed(0)}% with positive avg win — current gates are working.`,
    );
  }

  const losingPools = new Map();
  for (const row of losses.slice(0, 40)) {
    const key = row.poolAddress;
    if (!key) continue;
    losingPools.set(key, (losingPools.get(key) || 0) + 1);
  }

  const poolCooldowns = [];
  const cooldownUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  for (const [poolAddress, count] of losingPools) {
    if (count >= 2) {
      poolCooldowns.push({
        poolAddress,
        reason: `repeated_real_losses:${count}`,
        until: cooldownUntil,
      });
      lessons.push(`Pool ${poolAddress.slice(0, 8)}… demoted after ${count} real losses.`);
    }
  }

  const summary = `Analyzed ${closed.length} closed positions — win rate ${(winRate * 100).toFixed(1)}%, avg win ${avgWin.toFixed(4)} SOL, avg loss ${avgLoss.toFixed(4)} SOL.`;

  await LpRealEvolutionState.updateOne(
    { _id: GLOBAL_ID },
    {
      $set: {
        lessons: lessons.slice(0, 30),
        poolCooldowns,
        thresholdOverrides,
        lastEvolutionAt: new Date(),
        lastEvolutionSummary: summary,
        closedPositionsAnalyzed: closed.length,
      },
    },
    { upsert: true },
  );

  await appendLpRealDecision({
    experimentId: closed[0]?.experimentId || "global",
    action: "evolve",
    summary,
    reason: "real_position_evolution",
    metrics: { winRate, avgWin, avgLoss, closedCount: closed.length, thresholdOverrides },
  });

  return {
    skipped: false,
    closedCount: closed.length,
    winRate,
    avgWin,
    avgLoss,
    lessons,
    thresholdOverrides,
    poolCooldowns,
    summary,
  };
}

export const LP_REAL_EVOLUTION_SCHEDULE = Object.freeze({
  enabled: true,
  intervalMs: 86_400_000,
});

export function lpRealEvolutionConfigFromEnv() {
  const enabledRaw = (process.env.LP_AGENT_REAL_EVOLUTION_ENABLED || "").trim().toLowerCase();
  const enabled =
    enabledRaw === "0" || enabledRaw === "false" || enabledRaw === "off"
      ? false
      : LP_REAL_EVOLUTION_SCHEDULE.enabled;
  const ms = Number(process.env.LP_AGENT_REAL_EVOLUTION_MS || LP_REAL_EVOLUTION_SCHEDULE.intervalMs);
  return {
    enabled,
    ms: Number.isFinite(ms) && ms >= 60_000 ? ms : LP_REAL_EVOLUTION_SCHEDULE.intervalMs,
  };
}
