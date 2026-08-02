#!/usr/bin/env node
/**
 * Wipe Robinhood LP paper lab (degen herd / -$19k week) and restart cohort.
 *
 *   cd api && node scripts/resetRobinhoodLpLab.js
 */
import path from "path";
import { fileURLToPath } from "url";
import dns from "dns";
import dotenv from "dotenv";
import mongoose from "mongoose";
import connectMongoose from "../config/mongoose.js";
import { resetRobinhoodLpFromScratch } from "../libs/robinhoodLpExperimentService.js";

dns.setServers(["8.8.8.8", "1.1.1.1"]);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

async function main() {
  if (!process.env.MONGODB_URI) {
    console.error("Missing MONGODB_URI");
    process.exit(1);
  }
  await connectMongoose();
  const result = await resetRobinhoodLpFromScratch({
    title: "Robinhood LP paper lab — post-degen-herd reset",
  });
  console.log("OK:", result);
  await mongoose.connection.close();
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
