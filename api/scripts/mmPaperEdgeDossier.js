#!/usr/bin/env node
/**
 * SYRA MM paper-edge dossier.
 * Prints honest sample / PnL / mid_fallback / promotion stability / gate pass-fail.
 * Earn Yield remains blocked.
 *
 *   cd api && node scripts/mmPaperEdgeDossier.js
 */
import path from "path";
import { fileURLToPath } from "url";
import dns from "dns";
import dotenv from "dotenv";
import mongoose from "mongoose";
import connectMongoose from "../config/mongoose.js";
import {
  MM_EARN_CURRENT_STAGE,
  MM_EARN_KILL_CRITERIA,
  MM_PAPER_EDGE_GATES,
} from "../config/mmPaperEdge.js";
import { getEarnYieldBlockReason } from "../config/earnProducts.js";
import { MM_DEFAULTS } from "../config/mmAgentConfig.js";
import { buildMmPaperEdgeMetrics } from "../libs/mm/mmLearningService.js";
import MmLearningState from "../models/MmLearningState.js";
import MmState from "../models/MmState.js";

dns.setServers(["8.8.8.8", "1.1.1.1"]);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

async function main() {
  if (!process.env.MONGODB_URI) {
    console.error("Missing MONGODB_URI");
    process.exit(1);
  }
  await connectMongoose();

  const state = await MmState.findById("singleton").lean();
  const learning = await MmLearningState.findById("singleton").lean();
  const baseCfg = {
    ...MM_DEFAULTS,
    ...(state?.simConfig ?? {}),
  };

  const paperEdge = await buildMmPaperEdgeMetrics(baseCfg, learning);
  const evaluation = paperEdge.evaluation;
  const earnBlock = getEarnYieldBlockReason("mm") || getEarnYieldBlockReason("syra_mm");

  const dossier = {
    generatedAt: new Date().toISOString(),
    desk: "syra_mm",
    mode: "paper",
    currentStage: MM_EARN_CURRENT_STAGE,
    earnYieldAllowed: false,
    earnYieldBlock: earnBlock,
    ledger: state
      ? {
          equityUsd: state.cashUsd ?? null,
          realizedPnlUsd: state.realizedPnlUsd ?? null,
          cumulativeVolumeUsd: state.cumulativeVolumeUsd ?? null,
          roundTripsCompleted: state.roundTripsCompleted ?? null,
          lastQuoteAt: state.lastQuoteAt?.toISOString?.() ?? null,
          lastResolveAt: state.lastResolveAt?.toISOString?.() ?? null,
        }
      : null,
    learning: {
      lastEvolutionAt: learning?.lastEvolutionAt?.toISOString?.() ?? null,
      lastEvolutionSummary: learning?.lastEvolutionSummary ?? null,
      runsAnalyzed: learning?.runsAnalyzed ?? 0,
      promotedStrategyId: learning?.promotedStrategyId ?? null,
      thresholdOverrides: learning?.thresholdOverrides ?? {},
    },
    paperEdge: {
      honestRoundTrips: paperEdge.honestRoundTrips,
      closedSample: paperEdge.closedSample,
      midFallbackCount: paperEdge.midFallbackCount,
      midFallbackFrac: paperEdge.midFallbackFrac,
      promotedStrategyId: paperEdge.promotedStrategyId,
      promotedNetPnlUsd: paperEdge.promotedNetPnlUsd,
      winRate: paperEdge.winRate,
      inventoryDriftFrac: paperEdge.inventoryDriftFrac,
      promotionStability: paperEdge.promotionStability,
    },
    gates: evaluation,
    gateConstants: MM_PAPER_EDGE_GATES,
    killCriteria: MM_EARN_KILL_CRITERIA,
    nextSteps: evaluation.pass
      ? [
          "Wire real two-sided inventory + risk limits (executeRealMmFill)",
          "Keep publicEarnListed=false until kill monitor is live",
          "Do not register mm / syra_mm in earnProducts.js yet",
        ]
      : [
          "Keep accruing honest Jupiter-quote round trips (no mid_fallback)",
          "Confirm inventory skew learning is applied in quote cycle",
          "Do not open Earn Yield for MM",
        ],
    references: [
      "docs/MM_PAPER_EDGE.md",
      "docs/EARN_YIELD_GRADUATION.md",
      "api/config/mmPaperEdge.js",
    ],
  };

  console.log(JSON.stringify(dossier, null, 2));
  console.log(
    evaluation.pass
      ? "\nPAPER EDGE: PASS (Earn Yield still blocked until real MM executor)"
      : "\nPAPER EDGE: FAIL (keep paper-only; do not open Earn Yield)",
  );

  await mongoose.disconnect();
  process.exit(evaluation.pass ? 0 : 2);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
