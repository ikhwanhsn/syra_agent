/**
 * Optional destructive cleanup: drop MongoDB collections for removed experiment desks.
 *
 * Desks removed: LP Robinhood, BTC quant (btc1/btc2), Macro Intelligence (btc3),
 * Scalper, SYRA MM.
 *
 * Usage (dry-run default):
 *   node api/scripts/dropRemovedExperimentCollections.js
 *   node api/scripts/dropRemovedExperimentCollections.js --confirm
 *
 * Requires MONGODB_URI / MONGO_URI.
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
import dns from "dns";
import dnsPromises from "dns/promises";
import { fileURLToPath } from "url";
import path from "path";

dns.setServers(["8.8.8.8", "1.1.1.1"]);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

const COLLECTIONS = Object.freeze([
  // LP Robinhood
  "robinhood_lp_experiment_state",
  "robinhood_lp_experiment_runs",
  "robinhood_lp_experiment_agent_states",
  "robinhood_lp_experiment_strategy_overrides",
  "robinhood_lp_learning_state",
  "robinhood_lp_real_configs",
  "robinhood_lp_real_positions",
  // BTC quant
  "btc_quant_experiment_state",
  "btc_quant_evolution_state",
  "btc_quant_strategy_overrides",
  "btc_quant_real_configs",
  "btc_quant_real_positions",
  "tradingexperimentruns",
  // BTC3 macro
  "btc3_macro_agent_state",
  "btc3_paper_rebalances",
  "btc3_allocation_decisions",
  "btc3_articles",
  "btc3_macro_events",
  "btc3_entities",
  "btc3_predictions",
  "btc3_reasoning",
  "btc3_executions",
  "btc3_portfolio_snapshots",
  "btc3_system_logs",
  "btc3_learning_state",
  "btc3_real_configs",
  "btc3_real_rebalances",
  // Scalper
  "scalper_state",
  "scalper_runs",
  "scalper_learning_state",
  // SYRA MM
  "mm_state",
  "mm_runs",
  "mm_learning_state",
]);

/**
 * Resolve mongodb+srv to a direct mongodb:// URI so Node DNS SRV timeouts
 * (queryTxt ETIMEOUT) do not block ops scripts.
 * @param {string} uri
 */
async function toDirectMongoUri(uri) {
  const trimmed = String(uri || "").trim();
  if (!trimmed.startsWith("mongodb+srv://")) return trimmed;

  const m = trimmed.match(/^mongodb\+srv:\/\/([^@]+)@([^/?]+)(\/[^?]*)?(\?.*)?$/);
  if (!m) return trimmed;

  const [, auth, host, dbPath = "/syra", qs = ""] = m;
  const records = await dnsPromises.resolveSrv(`_mongodb._tcp.${host}`);
  const txt = await dnsPromises.resolveTxt(host).catch(() => []);
  const txtOpts = txt.flat().join("&");
  const hosts = records.map((r) => `${r.name}:${r.port}`).join(",");
  const params = new URLSearchParams(qs.startsWith("?") ? qs.slice(1) : qs);
  for (const part of txtOpts.split("&")) {
    const [k, v] = part.split("=");
    if (k && v && !params.has(k)) params.set(k, v);
  }
  params.set("ssl", "true");
  params.set("tls", "true");
  return `mongodb://${auth}@${hosts}${dbPath || "/syra"}?${params.toString()}`;
}

async function main() {
  const confirm = process.argv.includes("--confirm");
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) {
    console.error("MONGODB_URI required");
    process.exit(1);
  }

  const connectUri = await toDirectMongoUri(uri);
  await mongoose.connect(connectUri, {
    serverSelectionTimeoutMS: 20_000,
    connectTimeoutMS: 15_000,
  });

  const db = mongoose.connection.db;
  const existing = new Set((await db.listCollections().toArray()).map((c) => c.name));

  const report = { dryRun: !confirm, dropped: [], missing: [], skipped: [] };

  for (const name of COLLECTIONS) {
    if (!existing.has(name)) {
      report.missing.push(name);
      continue;
    }
    if (!confirm) {
      report.skipped.push(name);
      continue;
    }
    await db.collection(name).drop();
    report.dropped.push(name);
  }

  console.log(JSON.stringify(report, null, 2));
  if (!confirm) {
    console.error("Dry-run only. Re-run with --confirm to drop collections.");
  }
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
