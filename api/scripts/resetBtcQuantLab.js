#!/usr/bin/env node
/**
 * Wipe BTC quant experiment data (btc1 and/or btc2) and start a fresh cohort.
 *
 *   cd api && node scripts/resetBtcQuantLab.js
 *   cd api && node scripts/resetBtcQuantLab.js btc2
 *   cd api && node scripts/resetBtcQuantLab.js all "My reset title"
 */

import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import mongoose from "mongoose";
import connectMongoose from "../config/mongoose.js";
import {
  resetAllBtcQuantFromScratch,
  resetBtcQuantFromScratch,
} from "../libs/btcQuantExperimentService.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

async function main() {
  if (!process.env.MONGODB_URI) {
    console.error("Missing MONGODB_URI");
    process.exit(1);
  }
  await connectMongoose();

  const arg0 = (process.argv[2] || "all").trim().toLowerCase();
  const title = process.argv[3]?.trim() || undefined;

  let result;
  if (arg0 === "all" || arg0 === "both") {
    result = await resetAllBtcQuantFromScratch({ title });
  } else {
    const lane = arg0 === "2" || arg0 === "btc2" ? "btc2" : "btc1";
    result = await resetBtcQuantFromScratch({ lane, title });
  }

  console.log("OK:", JSON.stringify(result, null, 2));
  await mongoose.connection.close();
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
