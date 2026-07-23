/**
 * Portfolio Optimizer — deterministic target allocation (never BUY/SELL).
 */

import { decisionRepo, portfolioRepo } from "../../repositories/btc3/index.js";
import { hashHeadline, hashReasoning } from "./reasoningAgent.js";

/**
 * @param {{
 *   currentPortfolio: { btcPct: number; usdcPct: number; totalUsd?: number };
 *   riskProfile?: string;
 *   macroProbability?: number;
 *   reasoning?: { confidence?: number; recommendedAllocation?: { btcPct: number; usdcPct: number } };
 *   prediction?: { horizons?: { d7?: { expectedReturn?: number; confidence?: number } } };
 *   macroEvent?: { _id?: import('mongoose').Types.ObjectId; headline?: string };
 *   reasoningDoc?: { _id?: import('mongoose').Types.ObjectId; summary?: string; confidence?: number; recommendedAllocation?: { btcPct: number; usdcPct: number } };
 *   predictionDoc?: { _id?: import('mongoose').Types.ObjectId };
 * }} input
 */
export async function optimizePortfolio(input) {
  const {
    currentPortfolio,
    riskProfile = "moderate",
    reasoningDoc,
    predictionDoc,
    macroEvent,
  } = input;

  const currentBtc = currentPortfolio.btcPct ?? 40;
  const currentUsdc = currentPortfolio.usdcPct ?? 60;

  let targetBtc = reasoningDoc?.recommendedAllocation?.btcPct ?? currentBtc;
  const confidence = reasoningDoc?.confidence ?? 0;
  let expectedReturn7d = Number(predictionDoc?.horizons?.d7?.expectedReturn ?? 0);
  if (!Number.isFinite(expectedReturn7d)) expectedReturn7d = 0;
  // LLM sometimes returns percent (e.g. 5) instead of fraction (0.05) — normalize.
  if (Math.abs(expectedReturn7d) > 0.3) {
    expectedReturn7d = expectedReturn7d / 100;
  }
  // Cap tilt contribution so a single forecast cannot force 85% BTC.
  expectedReturn7d = Math.max(-0.15, Math.min(0.15, expectedReturn7d));

  const riskMultiplier =
    riskProfile === "conservative" ? 0.7 : riskProfile === "aggressive" ? 1.2 : 1.0;

  targetBtc = targetBtc + expectedReturn7d * 100 * riskMultiplier * confidence;
  targetBtc = Math.min(85, Math.max(15, targetBtc));
  const targetUsdc = 100 - targetBtc;

  await portfolioRepo.createSnapshot({
    btcPct: currentBtc,
    usdcPct: currentUsdc,
    totalUsd: currentPortfolio.totalUsd ?? 10_000,
    source: "optimizer_input",
  });

  const headline = macroEvent?.headline ?? "";
  const decision = await decisionRepo.create({
    macroEventId: macroEvent?._id ?? null,
    reasoningId: reasoningDoc?._id ?? null,
    predictionId: predictionDoc?._id ?? null,
    currentAllocation: { btcPct: currentBtc, usdcPct: currentUsdc },
    targetAllocation: { btcPct: Math.round(targetBtc * 10) / 10, usdcPct: Math.round(targetUsdc * 10) / 10 },
    confidence,
    headline,
    headlineHash: hashHeadline(headline),
    reasonHash: reasoningDoc ? hashReasoning(reasoningDoc) : null,
    status: "pending",
  });

  return {
    currentAllocation: { btcPct: currentBtc, usdcPct: currentUsdc },
    targetAllocation: decision.targetAllocation,
    confidence,
    decision,
  };
}
