#!/usr/bin/env node
/**
 * Stocks News Lab paper-edge dossier.
 * Prints decided / PnL / champion / gate pass-fail. Earn Yield remains blocked.
 *
 *   cd api && node scripts/stocksPaperEdgeDossier.js
 */
import path from "path";
import { fileURLToPath } from "url";
import dns from "dns";
import dotenv from "dotenv";
import mongoose from "mongoose";
import connectMongoose from "../config/mongoose.js";
import {
  STOCKS_EARN_CURRENT_STAGE,
  STOCKS_EARN_KILL_CRITERIA,
  STOCKS_PAPER_EDGE_GATES,
  evaluateStocksPaperEdge,
} from "../config/stocksEarnGraduation.js";
import { getEarnYieldBlockReason } from "../config/earnProducts.js";

dns.setServers(["8.8.8.8", "1.1.1.1"]);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

function toNum(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

async function main() {
  if (!process.env.MONGODB_URI) {
    console.error("Missing MONGODB_URI");
    process.exit(1);
  }
  await connectMongoose();
  const db = mongoose.connection.db;

  const state = await db.collection("stocks_experiment_state").findOne({ _id: "singleton" });
  const experimentId = state?.activeExperimentId ?? null;
  const runMatch = experimentId ? { experimentId } : {};

  const runs = db.collection("stocks_experiment_runs");
  const byStatus = await runs
    .aggregate([
      { $match: runMatch },
      {
        $group: {
          _id: "$status",
          n: { $sum: 1 },
          pnl: { $sum: { $ifNull: ["$simPnlUsd", 0] } },
        },
      },
    ])
    .toArray();
  const statusMap = Object.fromEntries(byStatus.map((r) => [r._id || "null", r]));
  const wins = statusMap.win?.n || 0;
  const losses = statusMap.loss?.n || 0;
  const expired = statusMap.expired?.n || 0;
  const open = statusMap.open?.n || 0;
  const decided = wins + losses + expired;
  const cohortNetPnlUsd = byStatus.reduce((a, r) => a + (r.pnl || 0), 0);

  /** Per-strategy champion by net PnL among agents with decided trades. */
  const byStrategy = await runs
    .aggregate([
      { $match: { ...runMatch, status: { $in: ["win", "loss", "expired"] } } },
      {
        $group: {
          _id: "$strategyId",
          strategyName: { $first: "$strategyName" },
          decided: { $sum: 1 },
          wins: { $sum: { $cond: [{ $eq: ["$status", "win"] }, 1, 0] } },
          losses: { $sum: { $cond: [{ $eq: ["$status", "loss"] }, 1, 0] } },
          expired: { $sum: { $cond: [{ $eq: ["$status", "expired"] }, 1, 0] } },
          sumPnlUsd: { $sum: { $ifNull: ["$simPnlUsd", 0] } },
        },
      },
      { $sort: { sumPnlUsd: -1 } },
    ])
    .toArray();

  const champion = byStrategy[0] || null;
  const championWinRate =
    champion && champion.decided > 0 ? champion.wins / champion.decided : null;

  const evaluation = evaluateStocksPaperEdge({
    decided,
    championNetPnlUsd: champion ? champion.sumPnlUsd : null,
    championWinRate,
    maxDrawdownFrac: null,
  });

  const earnBlock = getEarnYieldBlockReason("stocks");
  const roundTripBps = Number(
    process.env.STOCKS_PAPER_ROUND_TRIP_BPS || STOCKS_PAPER_EDGE_GATES.paperRoundTripBpsDefault,
  );

  const dossier = {
    generatedAt: new Date().toISOString(),
    desk: "stocks_news_lab",
    currentStage: STOCKS_EARN_CURRENT_STAGE,
    earnYieldAllowed: false,
    earnYieldBlock: earnBlock,
    experimentId,
    paperRoundTripBps: roundTripBps,
    cohort: {
      decided,
      wins,
      losses,
      expired,
      open,
      netPnlUsd: Math.round(cohortNetPnlUsd * 10000) / 10000,
      winRate: decided > 0 ? wins / decided : null,
    },
    champion: champion
      ? {
          strategyId: champion._id,
          strategyName: champion.strategyName ?? null,
          decided: champion.decided,
          wins: champion.wins,
          losses: champion.losses,
          expired: champion.expired,
          winRate: championWinRate,
          sumPnlUsd: Math.round(toNum(champion.sumPnlUsd) * 10000) / 10000,
        }
      : null,
    gates: evaluation,
    killCriteria: STOCKS_EARN_KILL_CRITERIA,
    nextSteps: evaluation.pass
      ? [
          "Document max drawdown from equity history if not yet measured",
          "Complete equity-token compliance review",
          "Only then: real Jupiter executor + lab capital (publicEarnListed=false)",
        ]
      : [
          "Keep accruing paper trades until decided ≥ 50 and champion is net-positive",
          "Do not register stocks on Earn Yield",
          "Point real-money users to /equity or /earn?track=skills",
        ],
    references: [
      "docs/STOCKS_NEWS_PAPER_EDGE.md",
      "docs/EARN_YIELD_GRADUATION.md",
      "api/config/stocksEarnGraduation.js",
    ],
  };

  console.log(JSON.stringify(dossier, null, 2));
  console.log(
    evaluation.pass
      ? "\nPAPER EDGE: PASS (Earn Yield still blocked until compliance + real lab)"
      : "\nPAPER EDGE: FAIL (keep paper-only; do not open Earn Yield)",
  );

  await mongoose.disconnect();
  process.exit(evaluation.pass ? 0 : 2);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
