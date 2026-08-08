#!/usr/bin/env node
/**
 * BTC quant paper-edge dossier (btc1 Earn lane and/or btc2 desk).
 * Prints decided / PnL / qualified leader / gate pass-fail.
 *
 *   cd api && node scripts/btcQuantPaperEdgeDossier.js
 *   cd api && node scripts/btcQuantPaperEdgeDossier.js --lane=btc2
 *   cd api && node scripts/btcQuantPaperEdgeDossier.js --lane=all
 */
import path from "path";
import { fileURLToPath } from "url";
import dns from "dns";
import dotenv from "dotenv";
import mongoose from "mongoose";
import connectMongoose from "../config/mongoose.js";
import {
  BTC_QUANT_PAPER_EDGE_CURRENT_STAGE,
  BTC_QUANT_PAPER_EDGE_GATES,
  BTC_QUANT_PAPER_EDGE_KILL_CRITERIA,
  BTC_QUANT_PAPER_EDGE_STAGES,
  evaluateBtcQuantPaperEdge,
} from "../config/btcQuantPaperEdge.js";
import { BTC_QUANT_LANE_IDS, getBtcQuantLaneDef } from "../config/btcQuantLanes.js";
import { EXPERIMENT_SUITE_BTC_ONCHAIN } from "../config/tradingExperimentStrategies.js";
import TradingExperimentRun from "../models/TradingExperimentRun.js";
import {
  BTC_QUANT_MIN_DECIDED_FOR_LEADER,
  BTC_QUANT_MIN_WIN_RATE,
  pickBestBtcQuantStrategy,
  rankBtcQuantStrategiesByPnl,
  getBtcQuantEvolutionSnapshot,
} from "../libs/btcQuantExperimentEvolution.js";

dns.setServers(["8.8.8.8", "1.1.1.1"]);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

function toNum(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function parseLanes() {
  const arg = process.argv.find((a) => a.startsWith("--lane="));
  const raw = arg ? arg.slice("--lane=".length).trim().toLowerCase() : "btc2";
  if (raw === "all") return [...BTC_QUANT_LANE_IDS];
  if (BTC_QUANT_LANE_IDS.includes(raw)) return [raw];
  console.error(`Unknown lane "${raw}". Use btc1, btc2, or all.`);
  process.exit(1);
}

/**
 * @param {string} lane
 */
async function buildLaneDossier(lane) {
  const laneDef = getBtcQuantLaneDef(lane);
  const db = mongoose.connection.db;
  const state = await db.collection("btc_quant_experiment_state").findOne({ _id: laneDef.stateId });
  const experimentId = state?.activeExperimentId ?? null;

  /** @type {Record<string, unknown>} */
  const match = experimentId
    ? {
        suite: EXPERIMENT_SUITE_BTC_ONCHAIN,
        "summary.experimentId": experimentId,
        "summary.evolutionArchived": { $ne: true },
      }
    : { suite: EXPERIMENT_SUITE_BTC_ONCHAIN, "summary.evolutionArchived": { $ne: true } };

  if (lane === "btc2") {
    match["summary.lane"] = "btc2";
  } else if (lane === "btc1") {
    match.$or = [
      { "summary.lane": "btc1" },
      { "summary.lane": { $exists: false } },
      { "summary.lane": null },
    ];
  }

  const byStatus = await TradingExperimentRun.aggregate([
    { $match: match },
    {
      $group: {
        _id: "$status",
        n: { $sum: 1 },
        pnl: { $sum: { $ifNull: ["$simPnlUsd", 0] } },
      },
    },
  ]);

  const statusMap = Object.fromEntries(byStatus.map((r) => [r._id || "null", r]));
  const wins = statusMap.win?.n || 0;
  const losses = statusMap.loss?.n || 0;
  const expired = statusMap.expired?.n || 0;
  const open = statusMap.open?.n || 0;
  const decided = wins + losses + expired;
  const cohortNetPnlUsd = byStatus.reduce((a, r) => a + (r.pnl || 0), 0);

  const ranked = experimentId ? await rankBtcQuantStrategiesByPnl(experimentId) : [];
  const best = experimentId ? await pickBestBtcQuantStrategy(experimentId) : null;
  const learning = await getBtcQuantEvolutionSnapshot(laneDef.lane);

  const leader = best || ranked[0] || null;
  const leaderWinRate = leader?.winRate ?? null;
  const leaderDecided = leader?.decided ?? null;
  const leaderNetPnlUsd =
    leader?.sumDecidedPnlUsd != null ? leader.sumDecidedPnlUsd : (leader?.sumPnlUsd ?? null);

  const evaluation = evaluateBtcQuantPaperEdge({
    decided,
    leaderNetPnlUsd,
    leaderWinRate,
    leaderDecided,
    hasQualifiedLeader: Boolean(best),
  });

  const roundTripBps = Number(
    process.env.BTC_QUANT_PAPER_ROUND_TRIP_BPS || BTC_QUANT_PAPER_EDGE_GATES.paperRoundTripBpsDefault,
  );

  return {
    lane: laneDef.lane,
    title: laneDef.title,
    stateId: laneDef.stateId,
    experimentId,
    paperRoundTripBps: roundTripBps,
    leaderGates: {
      minDecided: BTC_QUANT_MIN_DECIDED_FOR_LEADER,
      minWinRate: BTC_QUANT_MIN_WIN_RATE,
    },
    cohort: {
      decided,
      wins,
      losses,
      expired,
      open,
      netPnlUsd: Math.round(cohortNetPnlUsd * 10000) / 10000,
      winRate: decided > 0 ? wins / decided : null,
    },
    qualifiedLeader: best
      ? {
          strategyId: best.strategyId,
          decided: best.decided,
          winRate: best.winRate,
          sumDecidedPnlUsd: Math.round(toNum(best.sumDecidedPnlUsd) * 10000) / 10000,
          leaderScore: best.leaderScore,
        }
      : null,
    topRanked: ranked.slice(0, 5).map((r) => ({
      strategyId: r.strategyId,
      decided: r.decided,
      winRate: r.winRate,
      sumDecidedPnlUsd: Math.round(toNum(r.sumDecidedPnlUsd) * 10000) / 10000,
      leaderScore: r.leaderScore,
      openPositions: r.openPositions,
    })),
    learning: {
      lastEvolutionAt: learning?.lastEvolutionAt ?? null,
      lastEvolutionSummary: learning?.lastEvolutionSummary ?? null,
      decidedRunsAnalyzed: learning?.decidedRunsAnalyzed ?? 0,
      closedPositionsAnalyzed: learning?.closedPositionsAnalyzed ?? 0,
      overrideCount: learning?.overrideCount ?? 0,
      cooldownCount: learning?.strategyCooldowns?.length ?? 0,
      thresholdOverrides: learning?.thresholdOverrides ?? {},
      lessons: (learning?.lessons ?? []).slice(0, 5),
    },
    gates: evaluation,
    killCriteria: BTC_QUANT_PAPER_EDGE_KILL_CRITERIA,
  };
}

async function main() {
  if (!process.env.MONGODB_URI) {
    console.error("Missing MONGODB_URI");
    process.exit(1);
  }
  await connectMongoose();

  const lanes = parseLanes();
  /** @type {Record<string, unknown>} */
  const byLane = {};
  let anyPass = false;
  for (const lane of lanes) {
    const d = await buildLaneDossier(lane);
    byLane[lane] = d;
    if (d.gates?.pass) anyPass = true;
  }

  const dossier = {
    generatedAt: new Date().toISOString(),
    desk: "btc_quant",
    mode: "paper",
    currentStage: BTC_QUANT_PAPER_EDGE_CURRENT_STAGE,
    stages: BTC_QUANT_PAPER_EDGE_STAGES,
    earnYieldNote:
      "Earn Yield uses btc1 adapter readiness only. Paper edge pass never opens deposits alone. btc2 is an experimental desk.",
    lanes: byLane,
    nextSteps: anyPass
      ? [
          "btc1: confirm real adapter readiness (error/settle/sample) before Earn beta",
          "btc2: keep as desk; do not wire Earn to btc2",
        ]
      : [
          "Keep accruing paper trades until decided ≥ 50 and a qualified leader clears WR/PnL gates",
          "Do not add fake per-trade ML — prove base BUY expectancy after ~110 bps first",
          "If btc2 fails kill criteria (endless almost), redesign signal rather than more mutations",
        ],
    references: [
      "docs/BTC_QUANT_PAPER_EDGE.md",
      "docs/EARN_YIELD_CBBTC_EVAL.md",
      "docs/EARN_YIELD_GRADUATION.md",
      "api/config/btcQuantPaperEdge.js",
    ],
  };

  console.log(JSON.stringify(dossier, null, 2));
  const fails = lanes.filter((l) => !byLane[l]?.gates?.pass);
  console.log(
    fails.length === 0
      ? "\nPAPER EDGE: PASS (Earn Yield still requires real adapter readiness on btc1)"
      : `\nPAPER EDGE: FAIL on ${fails.join(", ")} (keep measuring; do not loosen no_qualified_leader)`,
  );

  await mongoose.disconnect();
  process.exit(fails.length === 0 ? 0 : 2);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
