#!/usr/bin/env node
/**
 * Validate Robinhood Chain LP paper sim against live Uniswap pool data.
 * Runs signal + resolve cycles with accelerated clocks until a positive-EV leader emerges.
 *
 *   cd api && node scripts/validateRobinhoodLpProfitability.js
 */
import path from "path";
import { fileURLToPath } from "url";
import dns from "dns";
import dotenv from "dotenv";
import mongoose from "mongoose";
import connectMongoose from "../config/mongoose.js";
import RobinhoodLpExperimentRun from "../models/RobinhoodLpExperimentRun.js";
import RobinhoodLpExperimentState from "../models/RobinhoodLpExperimentState.js";
import { OUTCOME_EV_GATE } from "../config/outcomeEvGate.js";
import {
  fetchRobinhoodUniswapPoolPages,
  deriveFeeTvlRatio,
} from "../libs/robinhoodUniswapClient.js";
import {
  passesRobinhoodSimPoolScreen,
  ensureRobinhoodLpExperimentBootstrapped,
  getRobinhoodLpExperimentStats,
  rankRobinhoodLpStrategiesByNetPnl,
  resolveOpenRobinhoodLpRuns,
  runRobinhoodLpSignalCycle,
} from "../libs/robinhoodLpExperimentService.js";
import { getRobinhoodLpEvGateStatus } from "../libs/outcomeEvGateService.js";

dns.setServers(["8.8.8.8", "1.1.1.1"]);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const GATE = OUTCOME_EV_GATE.robinhood_lp_autopilot;
const MAX_ROUNDS = GATE.maxValidationRounds;
const HOURS_ADVANCE = GATE.hoursAdvancePerRound;
const MIN_DECIDED = GATE.minDecided;
const MIN_WIN_RATE = GATE.minWinRate;

async function advanceSimClocks(experimentId, hours) {
  const ms = hours * 3_600_000;
  const now = Date.now();
  const openRuns = await RobinhoodLpExperimentRun.find({ experimentId, status: "open" }).lean();
  for (const run of openRuns) {
    const openedAt = new Date(run.openedAt || run.createdAt);
    await RobinhoodLpExperimentRun.updateOne(
      { _id: run._id },
      { $set: { openedAt: new Date(openedAt.getTime() - ms) } },
    );
  }
  const cooldownCutoff = new Date(now - ms);
  await RobinhoodLpExperimentRun.updateMany(
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

async function validatePoolUniverse() {
  const pools = await fetchRobinhoodUniswapPoolPages({ pages: 2, limit: 60, sortKey: "volume" });
  const eligible = pools.filter((p) => passesRobinhoodSimPoolScreen(p));
  const top = [...eligible].sort((a, b) => b.feeTvlRatio - a.feeTvlRatio).slice(0, 5);
  console.log(`Pool scan: ${pools.length} Uniswap pools, ${eligible.length} pass sim screen`);
  if (top.length === 0) {
    console.error("Kill criterion: no pools pass sim screen on live Robinhood Chain data.");
    return false;
  }
  console.log("Top fee/TVL pools:");
  for (const p of top) {
    console.log(
      `  ${p.poolName} TVL=${p.tvlUsd.toFixed(0)} vol=${p.volume24hUsd.toFixed(0)} fee/TVL=${(p.feeTvlRatio * 100).toFixed(3)}%`,
    );
  }
  const sample = top[0];
  const derived = deriveFeeTvlRatio({
    volume24hUsd: sample.volume24hUsd,
    tvlUsd: sample.tvlUsd,
    feeTier: sample.feeTier,
  });
  if (derived <= 0 || !Number.isFinite(derived)) {
    console.error(`Kill criterion: derived fee/TVL looks invalid (${derived})`);
    return false;
  }
  if (derived > 3) {
    console.warn(
      `Note: top pool fee/TVL is very high (${(derived * 100).toFixed(1)}%) — typical for thin memecoin pools on Robinhood Chain.`,
    );
  }
  return true;
}

async function main() {
  const poolsOk = await validatePoolUniverse();
  if (!poolsOk) {
    process.exit(1);
  }

  if (!process.env.MONGODB_URI) {
    console.log("No MONGODB_URI: pool universe validation passed (sim ticks skipped).");
    process.exit(0);
  }

  await connectMongoose();
  await ensureRobinhoodLpExperimentBootstrapped();
  const state = await RobinhoodLpExperimentState.findById("singleton").lean();
  const experimentId = state?.activeExperimentId;
  if (!experimentId) {
    console.error("No active Robinhood LP cohort — bootstrap via GET /experiment/lp-robinhood/state first");
    process.exit(1);
  }

  console.log(
    `\nValidating cohort ${experimentId} (gate: decided>=${MIN_DECIDED}, winRate>=${MIN_WIN_RATE}, sumNetPnlUsd>0)`,
  );

  for (let round = 1; round <= MAX_ROUNDS; round += 1) {
    const signal = await runRobinhoodLpSignalCycle();
    const advanced = await advanceSimClocks(experimentId, HOURS_ADVANCE);
    const resolve = await resolveOpenRobinhoodLpRuns();
    const ranked = await rankRobinhoodLpStrategiesByNetPnl(experimentId);
    const top = ranked[0];

    console.log(
      `[round ${round}] opened=${signal.opened} resolved=${resolve.resolved} advanced=${advanced} ` +
        `top=${top ? `#${top.strategyId} decided=${top.decided} wr=${((top.winRate ?? 0) * 100).toFixed(1)}% net=${top.sumNetPnlUsd.toFixed(2)}` : "n/a"}`,
    );

    if (
      top &&
      top.decided >= MIN_DECIDED &&
      (top.winRate ?? 0) >= MIN_WIN_RATE &&
      top.sumNetPnlUsd > 0
    ) {
      const stats = await getRobinhoodLpExperimentStats();
      const leader = stats.agents.find((a) => a.strategyId === top.strategyId);
      console.log("\nQualified leader found:");
      console.log(JSON.stringify({ top, leaderStats: leader }, null, 2));
      const gateStatus = await getRobinhoodLpEvGateStatus();
      console.log("\nEV gate status:", JSON.stringify(gateStatus, null, 2));
      await mongoose.connection.close();
      process.exit(0);
    }
  }

  const stats = await getRobinhoodLpExperimentStats();
  const positive = stats.agents
    .filter((a) => (a.sumNetPnlUsd ?? 0) > 0)
    .slice(0, 5)
    .map((a) => ({
      strategyId: a.strategyId,
      name: a.strategyName,
      decided: a.decided,
      winRatePct: a.winRatePct,
      sumNetPnlUsd: a.sumNetPnlUsd,
    }));

  console.error("\nKill criterion: no qualified leader after max rounds. Top positive agents:");
  console.error(JSON.stringify(positive, null, 2));
  await mongoose.connection.close();
  process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
