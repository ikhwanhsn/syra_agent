#!/usr/bin/env node
/**
 * Nightly profitability audit across experiment desks.
 * Flags idle desks, fake 100% win rates, wins with negative PnL, underwater cohorts.
 *
 *   cd api && node scripts/auditExperimentProfitability.js
 */
import path from "path";
import { fileURLToPath } from "url";
import dns from "dns";
import dotenv from "dotenv";
import mongoose from "mongoose";
import connectMongoose from "../config/mongoose.js";

// Some Windows DNS resolvers time out on MongoDB SRV TXT lookups.
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const IDLE_MS = 48 * 60 * 60_000;

async function aggRuns(col, pnlField, match = {}) {
  const byStatus = await col
    .aggregate([
      { $match: match },
      {
        $group: {
          _id: "$status",
          n: { $sum: 1 },
          pnl: { $sum: { $ifNull: [`$${pnlField}`, 0] } },
        },
      },
    ])
    .toArray();
  const latest = await col.find(match).sort({ _id: -1 }).limit(1).project({ createdAt: 1, updatedAt: 1 }).toArray();
  const winsNeg = await col.countDocuments({
    ...match,
    status: "win",
    [pnlField]: { $lt: 0 },
  });
  const map = Object.fromEntries(byStatus.map((r) => [r._id || "null", r]));
  const wins = map.win?.n || 0;
  const losses = map.loss?.n || 0;
  const expired = map.expired?.n || 0;
  const decided = wins + losses + expired;
  const netPnl = byStatus.reduce((a, r) => a + (r.pnl || 0), 0);
  const lastAt = latest[0]?.updatedAt || latest[0]?.createdAt || null;
  return {
    byStatus: map,
    decided,
    wins,
    losses,
    expired,
    winRate: decided > 0 ? wins / decided : null,
    netPnl: Math.round(netPnl * 10000) / 10000,
    winsWithNegativePnl: winsNeg,
    lastActivityAt: lastAt ? new Date(lastAt).toISOString() : null,
    open: map.open?.n || 0,
  };
}

function flagsFor(desk, stats) {
  const flags = [];
  if (!stats.lastActivityAt) flags.push("never_active");
  else if (Date.now() - new Date(stats.lastActivityAt).getTime() > IDLE_MS) {
    flags.push("idle_over_48h");
  }
  if (stats.decided >= 10 && stats.winRate === 1) flags.push("win_rate_100_suspicious");
  if (stats.winsWithNegativePnl > 0) flags.push("wins_with_negative_pnl");
  if (stats.decided >= 10 && stats.netPnl < 0) flags.push("net_negative");
  if (stats.decided === 0 && stats.open === 0) flags.push("no_trades");
  return flags;
}

async function main() {
  if (!process.env.MONGODB_URI) {
    console.error("Missing MONGODB_URI");
    process.exit(1);
  }
  await connectMongoose();
  const db = mongoose.connection.db;

  const desks = [
    { id: "lp_meteora", col: "lpexperimentruns", pnl: "simNetPnlSol" },
    { id: "stocks", col: "stocks_experiment_runs", pnl: "simPnlUsd" },
    { id: "momentum", col: "momentum_rotator_runs", pnl: "simPnlUsd" },
    { id: "lst_loop", col: "lst_loop_runs", pnl: "simPnlUsd" },
    { id: "sniper", col: "sniper_runs", pnl: "simPnlUsd" },
    { id: "meridian", col: "meridian_runs", pnl: "simNetPnlSol" },
  ];

  const report = { generatedAt: new Date().toISOString(), desks: {}, redFlags: [] };

  for (const d of desks) {
    const col = db.collection(d.col);
    const stats = await aggRuns(col, d.pnl, d.match || {});
    const flags = flagsFor(d.id, stats);
    report.desks[d.id] = { ...stats, flags };
    for (const f of flags) report.redFlags.push({ desk: d.id, flag: f });
  }

  // LP real stuck
  const stuck = await db.collection("lp_real_positions").countDocuments({
    status: { $in: ["closing", "error"] },
  });
  if (stuck > 0) {
    report.redFlags.push({ desk: "lp_real", flag: `stuck_positions:${stuck}` });
  }

  console.log(JSON.stringify(report, null, 2));
  const critical = report.redFlags.filter((f) =>
    ["wins_with_negative_pnl", "win_rate_100_suspicious", "idle_over_48h", "no_trades"].includes(
      f.flag,
    ) || String(f.flag).startsWith("stuck_"),
  );
  await mongoose.connection.close();
  process.exit(critical.length > 0 ? 2 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
