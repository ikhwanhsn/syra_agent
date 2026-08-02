#!/usr/bin/env node
/**
 * Dry-run reconciliation for LP real positions stuck in "closing" / "error".
 * Does NOT broadcast closes unless --execute is passed (requires explicit approval).
 *
 *   cd api && node scripts/reconcileLpRealStuckPositions.js
 *   cd api && node scripts/reconcileLpRealStuckPositions.js --execute
 */
import path from "path";
import { fileURLToPath } from "url";
import dns from "dns";
import dotenv from "dotenv";
import mongoose from "mongoose";
import connectMongoose from "../config/mongoose.js";

dns.setServers(["8.8.8.8", "1.1.1.1"]);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

async function main() {
  const execute = process.argv.includes("--execute");
  if (!process.env.MONGODB_URI) {
    console.error("Missing MONGODB_URI");
    process.exit(1);
  }
  await connectMongoose();

  const LpRealPosition = (await import("../models/LpRealPosition.js")).default;
  const stuck = await LpRealPosition.find({
    status: { $in: ["closing", "open", "error"] },
  })
    .select({
      status: 1,
      poolName: 1,
      poolAddress: 1,
      depositSol: 1,
      openedAt: 1,
      updatedAt: 1,
      lastError: 1,
      positionAddress: 1,
      realNetPnlSol: 1,
      closeAttempts: 1,
    })
    .lean();

  const staleMs = 7 * 24 * 60 * 60_000;
  const now = Date.now();
  const report = stuck.map((p) => {
    const ageMs = p.updatedAt ? now - new Date(p.updatedAt).getTime() : Infinity;
    const stale = ageMs >= staleMs;
    return {
      id: String(p._id),
      status: p.status,
      poolName: p.poolName,
      depositSol: p.depositSol,
      openedAt: p.openedAt,
      updatedAt: p.updatedAt,
      lastError: p.lastError ?? null,
      stale,
      suggestedAction:
        p.status === "error"
          ? "mark_error_terminal"
          : p.status === "closing" && stale
            ? "retry_close_or_mark_abandoned"
            : p.status === "open" && stale
              ? "inspect_onchain_then_close"
              : "monitor",
    };
  });

  console.log(JSON.stringify({ execute, count: report.length, positions: report }, null, 2));

  if (!execute) {
    console.log(
      "\nDry-run only. Re-run with --execute after reviewing to mark stale error rows terminal.",
    );
    console.log(
      "Close retries for 'closing'/'open' still require on-chain executor approval — not auto-run here.",
    );
    await mongoose.connection.close();
    process.exit(0);
  }

  // Safe execute path: only mark ancient error rows as closed_error with 0 PnL if missing.
  // Does NOT retry on-chain closes.
  let marked = 0;
  for (const row of report) {
    if (row.status === "error" && row.stale) {
      await LpRealPosition.updateOne(
        { _id: row.id, status: "error" },
        {
          $set: {
            status: "closed_error",
            resolution: "reconcile_stale_error",
            resolvedAt: new Date(),
            lastError: row.lastError || "reconciled_stale_error",
          },
        },
      );
      marked += 1;
    }
  }
  console.log(`Marked ${marked} stale error positions as closed_error.`);
  console.log(
    "Stuck closing/open positions were NOT auto-closed — run lp real close with ops approval.",
  );

  await mongoose.connection.close();
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
