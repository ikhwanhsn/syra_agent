#!/usr/bin/env node
/**
 * Wipe BTC3 macro paper experiment data and start a fresh cohort.
 *
 *   cd api && node scripts/resetBtc3Lab.js
 *   cd api && node scripts/resetBtc3Lab.js "My reset title"
 */

import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import mongoose from "mongoose";
import connectMongoose from "../config/mongoose.js";
import { resetBtc3FromScratch } from "../libs/btc3/btc3PaperTradingService.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

async function main() {
  if (!process.env.MONGODB_URI) {
    console.error("Missing MONGODB_URI");
    process.exit(1);
  }
  await connectMongoose();
  const title = process.argv[2]?.trim() || undefined;
  const result = await resetBtc3FromScratch({ title });
  console.log("OK:", result);
  await mongoose.connection.close();
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
