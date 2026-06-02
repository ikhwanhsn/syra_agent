/**
 * Seed Syra Alpha Arena demo agents (hackathon leaderboard).
 * Usage: node scripts/seed-arena-agents.js
 * Requires: MONGODB_URI, OPENROUTER_API_KEY
 */
import "../config/mongoose.js";
import mongoose from "mongoose";
import { seedArenaAgents } from "../libs/arenaService.js";

async function main() {
  const out = await seedArenaAgents();
  console.log(JSON.stringify(out, null, 2));
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
