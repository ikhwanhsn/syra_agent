/**
 * Reconcile modeled LP PnL vs real wallet-delta PnL for closed positions.
 *
 * Usage (from api/):
 *   node scripts/reconcileLpRealVsModel.js
 *   node scripts/reconcileLpRealVsModel.js --agent p6AkUCvR5CXoQJVgkSffLNNXNdV8xpP7x3EzMApnxTZ
 *
 * Prints per-strategy and per-pool error factors so paper "profit" is never
 * confused with expected live returns.
 */
import dns from "node:dns";
dns.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);

import dotenv from "dotenv";
dotenv.config({ quiet: true });

import mongoose from "mongoose";
import LpRealPosition from "../models/LpRealPosition.js";
import {
  applyRiskAdjustedFeeMultiplier,
  computeDlmmFeeShareMultiplier,
  computeFeeYieldPct,
  computeLpNetPnlPct,
  computePoolRiskScore,
  computeSimTransactionCostsSol,
  strategyLikelyNeedsSidecarSwap,
} from "../libs/lpEconomicsModel.js";

function toNum(v, fb = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fb;
}

function hoursBetween(a, b) {
  const ms = new Date(b).getTime() - new Date(a).getTime();
  return Math.max(0, ms / 3_600_000);
}

function modelNetPnlSol(pos) {
  const depositSol = toNum(pos.depositSol);
  const hours = hoursBetween(pos.openedAt, pos.resolvedAt || pos.updatedAt || pos.openedAt);
  const snap = pos.screeningSnapshot || {};
  const tvlUsd = toNum(snap.tvlUsd);
  const volume24hUsd = toNum(snap.volume24hUsd);
  const feeTvlRatio = toNum(snap.feeTvlRatio);
  const volTvl = tvlUsd > 0 ? volume24hUsd / tvlUsd : 0;
  const riskScore = toNum(
    snap.riskScore,
    computePoolRiskScore({
      tvlUsd,
      volume24hUsd,
      feeTvlRatio,
      binsBelow: pos.binsBelow,
      binsAbove: pos.binsAbove,
    }),
  );
  const feeShareMult = applyRiskAdjustedFeeMultiplier(
    computeDlmmFeeShareMultiplier({
      volTvlRatio: volTvl,
      tvlUsd,
      binsBelow: pos.binsBelow,
      binsAbove: pos.binsAbove,
      inRange: true,
    }),
    riskScore,
  );
  const feeYieldPct = computeFeeYieldPct(feeTvlRatio, hours) * feeShareMult;
  const priceDriftPct = toNum(pos.simPriceDriftPct, 0);
  const netPnlPct = computeLpNetPnlPct(priceDriftPct, feeYieldPct, true, riskScore);
  const needsSidecar = strategyLikelyNeedsSidecarSwap(pos.binsBelow, pos.binsAbove);
  const tx = computeSimTransactionCostsSol(depositSol, { needsSidecarSwap: needsSidecar });
  const gross = depositSol * (netPnlPct / 100);
  return gross - tx.openFeeSol - tx.closeFeeSol;
}

function bucketKey(map, key) {
  if (!map.has(key)) {
    map.set(key, {
      n: 0,
      sumReal: 0,
      sumModel: 0,
      winsReal: 0,
      winsModel: 0,
    });
  }
  return map.get(key);
}

async function main() {
  const uri = process.env.MONGODB_URI?.trim();
  if (!uri) {
    console.error("Missing MONGODB_URI");
    process.exit(1);
  }

  const args = process.argv.slice(2);
  const agentIdx = args.indexOf("--agent");
  const agentAddress = agentIdx >= 0 ? args[agentIdx + 1] : null;
  const limitIdx = args.indexOf("--limit");
  const limit = limitIdx >= 0 ? Math.max(1, Number(args[limitIdx + 1]) || 500) : 500;

  await mongoose.connect(uri);
  const match = {
    status: { $in: ["closed_win", "closed_loss", "expired"] },
    realNetPnlSol: { $ne: null },
  };
  if (agentAddress) match.agentAddress = agentAddress;

  const positions = await LpRealPosition.find(match)
    .sort({ resolvedAt: -1 })
    .limit(limit)
    .select({
      agentAddress: 1,
      strategyId: 1,
      strategyName: 1,
      poolAddress: 1,
      poolName: 1,
      depositSol: 1,
      realNetPnlSol: 1,
      realFeesClaimedSol: 1,
      resolution: 1,
      status: 1,
      peakPnlPct: 1,
      binsBelow: 1,
      binsAbove: 1,
      openedAt: 1,
      resolvedAt: 1,
      screeningSnapshot: 1,
    })
    .lean();

  console.log(`Loaded ${positions.length} closed real positions${agentAddress ? ` for ${agentAddress}` : ""}`);

  const byStrategy = new Map();
  const byPool = new Map();
  let sumReal = 0;
  let sumModel = 0;
  let absurdPeaks = 0;

  for (const pos of positions) {
    const real = toNum(pos.realNetPnlSol);
    const model = modelNetPnlSol(pos);
    sumReal += real;
    sumModel += model;
    if (toNum(pos.peakPnlPct) > 200) absurdPeaks += 1;

    const sk = `${pos.strategyId}:${pos.strategyName || "?"}`;
    const s = bucketKey(byStrategy, sk);
    s.n += 1;
    s.sumReal += real;
    s.sumModel += model;
    if (real > 0) s.winsReal += 1;
    if (model > 0) s.winsModel += 1;

    const pk = pos.poolName || pos.poolAddress || "?";
    const p = bucketKey(byPool, pk);
    p.n += 1;
    p.sumReal += real;
    p.sumModel += model;
    if (real > 0) p.winsReal += 1;
    if (model > 0) p.winsModel += 1;
  }

  const errorFactor =
    Math.abs(sumReal) > 1e-9 ? sumModel / sumReal : sumModel === 0 ? 1 : Infinity;

  console.log("\n=== GLOBAL ===");
  console.log({
    n: positions.length,
    sumRealNetPnlSol: Number(sumReal.toFixed(5)),
    sumModeledNetPnlSol: Number(sumModel.toFixed(5)),
    modelOverRealFactor: Number.isFinite(errorFactor) ? Number(errorFactor.toFixed(2)) : "inf",
    absurdPeakPnlPctCount: absurdPeaks,
    note:
      "modelOverRealFactor > 1 means the model is more optimistic than wallet deltas. Negative real + positive model ⇒ factor negative.",
  });

  console.log("\n=== BY STRATEGY (error factor = model/real) ===");
  for (const [key, b] of [...byStrategy.entries()].sort((a, b) => a[1].sumReal - b[1].sumReal)) {
    const factor = Math.abs(b.sumReal) > 1e-9 ? b.sumModel / b.sumReal : null;
    console.log(
      JSON.stringify({
        strategy: key,
        n: b.n,
        sumReal: Number(b.sumReal.toFixed(5)),
        sumModel: Number(b.sumModel.toFixed(5)),
        realWinRate: Number((b.winsReal / b.n).toFixed(3)),
        modelWinRate: Number((b.winsModel / b.n).toFixed(3)),
        modelOverRealFactor: factor != null && Number.isFinite(factor) ? Number(factor.toFixed(2)) : null,
      }),
    );
  }

  console.log("\n=== BY POOL ===");
  for (const [key, b] of [...byPool.entries()].sort((a, b) => a[1].sumReal - b[1].sumReal).slice(0, 25)) {
    const factor = Math.abs(b.sumReal) > 1e-9 ? b.sumModel / b.sumReal : null;
    console.log(
      JSON.stringify({
        pool: key,
        n: b.n,
        sumReal: Number(b.sumReal.toFixed(5)),
        sumModel: Number(b.sumModel.toFixed(5)),
        modelOverRealFactor: factor != null && Number.isFinite(factor) ? Number(factor.toFixed(2)) : null,
      }),
    );
  }

  await mongoose.connection.close();
  console.log("\nDONE");
}

main().catch(async (err) => {
  console.error(err);
  try {
    await mongoose.connection.close();
  } catch {
    /* ignore */
  }
  process.exit(1);
});
