#!/usr/bin/env node
/**
 * One-time cleanup: remove trading experiment runs that recorded non-BUY (spot-short) signals.
 * Deletes by status `skipped_non_buy` and any row with clearSignal SELL (case-insensitive).
 *
 * Run after deploying code that no longer inserts these rows:
 *   cd api && node scripts/deleteTradingExperimentNonBuyRuns.js
 *
 * Requires MONGODB_URI (and optional DB name via same config as the API).
 */

import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import mongoose from "mongoose";
import connectMongoose from "../config/mongoose.js";
import TradingExperimentRun from "../models/TradingExperimentRun.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

async function main() {
  if (!process.env.MONGODB_URI) {
    console.error("Missing MONGODB_URI");
    process.exit(1);
  }
  await connectMongoose();

  const filter = {
    $or: [{ status: "skipped_non_buy" }, { clearSignal: /^sell$/i }],
  };

  await TradingExperimentRun.deleteMany(filter);

  await mongoose.connection.close();
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
