#!/usr/bin/env node
/**
 * Drive LP sim signal + resolve cycles until a strategy clears the real-agent profit gate.
 * Advances open-run clocks between resolve passes so positions can mature without waiting days.
 *
 *   cd api && node scripts/validateLpSimProfitability.js
 */
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import mongoose from "mongoose";
import connectMongoose from "../config/mongoose.js";
import LpExperimentRun from "../models/LpExperimentRun.js";
import LpExperimentState from "../models/LpExperimentState.js";
import {
  LP_REAL_MIN_DECIDED_FOR_PROFIT_GATE,
  LP_REAL_MIN_WIN_RATE,
  getLpExperimentStats,
  pickBestNetPnlStrategy,
  resolveOpenLpRuns,
  runLpExperimentSignalCycle,
} from "../libs/lpExperimentService.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const MAX_ROUNDS = 40;
const HOURS_ADVANCE = 40;

async function advanceSimClocks(experimentId, hours) {
  const ms = hours * 3_600_000;
  const now = Date.now();
  const openRuns = await LpExperimentRun.find({ experimentId, status: "open" }).lean();
  for (const run of openRuns) {
    const openedAt = new Date(run.openedAt || run.createdAt);
    await LpExperimentRun.updateOne(
      { _id: run._id },
      { $set: { openedAt: new Date(openedAt.getTime() - ms) } },
    );
  }

  const cooldownCutoff = new Date(now - ms);
  await LpExperimentRun.updateMany(
    {
      experimentId,
      status: { $in: ["win", "loss", "expired"] },
      $or: [{ resolvedAt: { $gte: cooldownCutoff } }, { createdAt: { $gte: cooldownCutoff } }],
    },
    [
      {
        $set: {
          createdAt: { $subtract: ["$createdAt", ms] },
          resolvedAt: {
            $cond: [{ $ifNull: ["$resolvedAt", false] }, { $subtract: ["$resolvedAt", ms] }, "$resolvedAt"],
          },
        },
      },
    ],
  );

  return openRuns.length;
}

async function main() {
  if (!process.env.MONGODB_URI) {
    console.error("Missing MONGODB_URI");
    process.exit(1);
  }
  await connectMongoose();

  const state = await LpExperimentState.findById("singleton").lean();
  const experimentId = state?.activeExperimentId;
  if (!experimentId) {
    console.error("No active experiment cohort — run resetLpExperimentLab.js first");
    process.exit(1);
  }

  console.log(`Validating cohort ${experimentId} (gate: decided>=${LP_REAL_MIN_DECIDED_FOR_PROFIT_GATE}, winRate>=${LP_REAL_MIN_WIN_RATE}, sumNetPnlSol>0)`);

  for (let round = 1; round <= MAX_ROUNDS; round += 1) {
    const signal = await runLpExperimentSignalCycle();
    const advanced = await advanceSimClocks(experimentId, HOURS_ADVANCE);
    const resolve = await resolveOpenLpRuns();
    const pick = await pickBestNetPnlStrategy();
    const top = pick.ranked?.[0];

    console.log(
      `[round ${round}] opened=${signal.opened} resolved=${resolve.resolved} advanced=${advanced} ` +
        `leader=${pick.strategy?.strategyId ?? "none"} failure=${pick.failureReason ?? "ok"} ` +
        `top=${top ? `#${top.strategyId} decided=${top.decided} wr=${((top.winRate ?? 0) * 100).toFixed(1)}% net=${top.sumNetPnlSol.toFixed(4)}` : "n/a"}`,
    );

    if (
      pick.strategy &&
      !pick.failureReason &&
      pick.stats?.decided >= LP_REAL_MIN_DECIDED_FOR_PROFIT_GATE &&
      (pick.stats?.winRate ?? 0) >= LP_REAL_MIN_WIN_RATE &&
      (pick.stats?.sumNetPnlSol ?? 0) > 0
    ) {
      const stats = await getLpExperimentStats();
      const leader = stats.agents.find((a) => a.strategyId === pick.strategy.strategyId);
      console.log("\nQualified leader found:");
      console.log(JSON.stringify({ pick: pick.strategy, leaderStats: leader }, null, 2));
      await mongoose.connection.close();
      process.exit(0);
    }
  }

  const stats = await getLpExperimentStats();
  const positive = stats.agents
    .filter((a) => a.sumNetPnlSol > 0)
    .slice(0, 5)
    .map((a) => ({
      strategyId: a.strategyId,
      name: a.strategyName,
      decided: a.decided,
      winRatePct: a.winRatePct,
      sumNetPnlSol: a.sumNetPnlSol,
    }));

  console.error("\nNo qualified leader after max rounds. Top positive agents:");
  console.error(JSON.stringify(positive, null, 2));
  await mongoose.connection.close();
  process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
