/**
 * Activate Earn Yield lab agents at small capital.
 * Does NOT open public deposits — products stay coming_soon until readiness.ready.
 *
 * Usage:
 *   node api/scripts/activate-earn-lab-agents.js --dry-run --anonymous-id=<aid>
 *   node api/scripts/activate-earn-lab-agents.js --anonymous-id=<aid> --product=lst [--max-position-sol=0.5]
 *   node api/scripts/activate-earn-lab-agents.js --anonymous-id=<aid> --product=cbbtc [--max-usdc=50]
 *   node api/scripts/activate-earn-lab-agents.js --anonymous-id=<aid> --product=btc3 [--max-usdc=50]
 *   node api/scripts/activate-earn-lab-agents.js --anonymous-id=<aid> --product=all
 *
 * cbBTC requires paper-edge pass (dossier ≥50 decided + qualified leader) unless --force-lab.
 *
 * Env for in-process BTC crons after enable:
 *   BTC_QUANT_REAL_CRON_ENABLED=true
 *   BTC3_REAL_CRON_ENABLED=true
 * LST real cron is gated by LST_LOOP_CRON.realEnabled in onchainEarnExperiments.js.
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
import dns from "dns";
import { fileURLToPath } from "url";
import path from "path";

dns.setServers(["8.8.8.8", "1.1.1.1"]);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

function argValue(name) {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : null;
}

function parseProducts() {
  const raw = (argValue("product") || "cbbtc,btc3").toLowerCase().trim();
  if (raw === "all") return ["cbbtc", "btc3", "lst"];
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const forceLab = process.argv.includes("--force-lab");
  const anonymousId = argValue("anonymous-id") || process.env.EARN_LAB_ANONYMOUS_ID || "";
  const maxUsdc = Number(argValue("max-usdc") || process.env.EARN_LAB_MAX_USDC || 50);
  const maxPositionSol = Number(argValue("max-position-sol") || process.env.EARN_LAB_MAX_POSITION_SOL || 0.5);
  const products = parseProducts();

  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!mongoUri) {
    console.error("MONGODB_URI required");
    process.exit(1);
  }

  console.log(
    JSON.stringify(
      {
        dryRun,
        forceLab,
        anonymousId: anonymousId ? `${anonymousId.slice(0, 18)}…` : null,
        maxUsdc,
        maxPositionSol,
        products,
        env: {
          BTC_QUANT_REAL_CRON_ENABLED: process.env.BTC_QUANT_REAL_CRON_ENABLED || null,
          BTC3_REAL_CRON_ENABLED: process.env.BTC3_REAL_CRON_ENABLED || null,
        },
      },
      null,
      2,
    ),
  );

  if (!anonymousId) {
    console.error(
      "Provide --anonymous-id=<chat session anonymousId> (invest wallet sibling will be resolved).",
    );
    process.exit(1);
  }

  await mongoose.connect(mongoUri);

  const { enableBtcQuantReal, getBtcQuantRealState } = await import(
    "../libs/btcQuantRealService.js"
  );
  const { enableBtc3Real, getBtc3RealState } = await import("../libs/btc3/btc3RealService.js");
  const { enableLstLoopReal, getLstLoopRealState, checkLstLoopPaperGraduation } = await import(
    "../libs/lstLoopRealService.js"
  );
  const BtcQuantRealConfig = (await import("../models/BtcQuantRealConfig.js")).default;
  const Btc3RealConfig = (await import("../models/btc3/Btc3RealConfig.js")).default;
  const LstLoopRealConfig = (await import("../models/LstLoopRealConfig.js")).default;
  const { getEarnYieldProductReadiness } = await import("../libs/earnYieldService.js");
  const { LST_LOOP_CRON } = await import("../config/onchainEarnExperiments.js");

  async function paperEdgeBtc1() {
    const {
      evaluateBtcQuantPaperEdge,
      BTC_QUANT_PAPER_EDGE_GATES,
    } = await import("../config/btcQuantPaperEdge.js");
    const { getBtcQuantLaneDef } = await import("../config/btcQuantLanes.js");
    const { EXPERIMENT_SUITE_BTC_ONCHAIN } = await import("../config/tradingExperimentStrategies.js");
    const TradingExperimentRun = (await import("../models/TradingExperimentRun.js")).default;
    const {
      pickBestBtcQuantStrategy,
      BTC_QUANT_MIN_DECIDED_FOR_LEADER,
      BTC_QUANT_MIN_WIN_RATE,
    } = await import("../libs/btcQuantExperimentEvolution.js");

    const laneDef = getBtcQuantLaneDef("btc1");
    const state = await mongoose.connection.db
      .collection("btc_quant_experiment_state")
      .findOne({ _id: laneDef.stateId });
    const experimentId = state?.activeExperimentId ?? null;
    if (!experimentId) {
      return { pass: false, reason: "no_active_experiment", decided: 0 };
    }

    const match = {
      suite: EXPERIMENT_SUITE_BTC_ONCHAIN,
      "summary.experimentId": experimentId,
      "summary.evolutionArchived": { $ne: true },
      $or: [
        { "summary.lane": "btc1" },
        { "summary.lane": { $exists: false } },
        { "summary.lane": null },
      ],
    };
    const byStatus = await TradingExperimentRun.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$status",
          n: { $sum: 1 },
          pnl: { $sum: { $ifNull: ["$simPnlUsd", 0] } },
        },
      },
    ]);
    const statusMap = Object.fromEntries(byStatus.map((r) => [r._id || "null", r]));
    const decided =
      (statusMap.win?.n || 0) + (statusMap.loss?.n || 0) + (statusMap.expired?.n || 0);
    const best = await pickBestBtcQuantStrategy(experimentId);
    const evaled = evaluateBtcQuantPaperEdge({
      decided,
      leaderNetPnlUsd: best?.sumDecidedPnlUsd ?? null,
      leaderWinRate: best?.winRate ?? null,
      leaderDecided: best?.decided ?? null,
      hasQualifiedLeader: Boolean(
        best &&
          (best.decided || 0) >= BTC_QUANT_MIN_DECIDED_FOR_LEADER &&
          (best.winRate || 0) >= BTC_QUANT_MIN_WIN_RATE &&
          (best.sumDecidedPnlUsd || 0) > 0,
      ),
    });
    return {
      pass: evaled.pass,
      decided,
      gates: BTC_QUANT_PAPER_EDGE_GATES,
      checks: evaled.checks,
      leader: best
        ? {
            strategyId: best.strategyId,
            decided: best.decided,
            winRate: best.winRate,
            sumDecidedPnlUsd: best.sumDecidedPnlUsd,
          }
        : null,
      reason: evaled.pass ? null : "btc_quant_paper_edge",
    };
  }

  if (dryRun) {
    const wantBtc = products.includes("cbbtc");
    const wantBtc3 = products.includes("btc3");
    const wantLst = products.includes("lst");
    const [btcState, btc3State, lstState, btcReady, btc3Ready, lstReady, paper, lstGrad] =
      await Promise.all([
        wantBtc
          ? getBtcQuantRealState({ viewerAnonymousId: anonymousId, lane: "btc1" })
          : null,
        wantBtc3 ? getBtc3RealState({ viewerAnonymousId: anonymousId }) : null,
        wantLst ? getLstLoopRealState({ viewerAnonymousId: anonymousId }) : null,
        wantBtc ? getEarnYieldProductReadiness("cbbtc_onchain_signal") : null,
        wantBtc3 ? getEarnYieldProductReadiness("btc3_macro") : null,
        wantLst ? getEarnYieldProductReadiness("lst_loop") : null,
        wantBtc ? paperEdgeBtc1() : null,
        wantLst ? checkLstLoopPaperGraduation() : null,
      ]);
    console.log(
      JSON.stringify(
        {
          dryRun: true,
          lstRealEnabled: LST_LOOP_CRON.realEnabled,
          btcQuant: btcState && {
            enabled: btcState.enabled,
            agentAddress: btcState.agentAddress,
            maxNotionalUsd: btcState.maxNotionalUsd,
            cronEnabled: btcState.cronEnabled,
            paperEdge: paper,
            readiness: btcReady && { ready: btcReady.ready, blockers: btcReady.blockers },
          },
          btc3: btc3State && {
            enabled: btc3State.enabled,
            agentAddress: btc3State.agentAddress,
            maxNotionalUsd: btc3State.maxNotionalUsd,
            cronEnabled: btc3State.cronEnabled,
            readiness: btc3Ready && { ready: btc3Ready.ready, blockers: btc3Ready.blockers },
          },
          lst: lstState && {
            enabled: lstState.enabled,
            agentAddress: lstState.agentAddress,
            paperGraduation: lstGrad,
            readiness: lstReady && { ready: lstReady.ready, blockers: lstReady.blockers },
          },
          note: "Re-run without --dry-run to enable lab agents. Public deposits stay gated until readiness.ready.",
        },
        null,
        2,
      ),
    );
    await mongoose.disconnect();
    return;
  }

  const out = { ok: true, enabled: {}, skipped: {}, next: [] };

  if (products.includes("cbbtc")) {
    const paper = await paperEdgeBtc1();
    if (!paper.pass && !forceLab) {
      out.skipped.cbbtc = {
        reason: "paper_edge_blocked",
        decided: paper.decided,
        checks: paper.checks,
        hint: "Accrue paper to ≥50 decided with qualified leader, or pass --force-lab (not recommended).",
      };
    } else {
      if (!paper.pass && forceLab) {
        console.warn("[activate] --force-lab: enabling cbBTC despite paper edge FAIL");
      }
      const btcState = await enableBtcQuantReal({
        anonymousId,
        enabledBy: "activate-earn-lab-agents",
        maxNotionalUsd: maxUsdc,
        lane: "btc1",
      });
      await BtcQuantRealConfig.updateOne(
        { _id: "singleton" },
        {
          $set: {
            publicEarnListed: false,
            depositsPaused: true,
            publicMaxDepositUsdc: maxUsdc,
            maxNotionalUsd: maxUsdc,
            reserveUsdc: Math.min(25, Math.max(5, Math.floor(maxUsdc * 0.1))),
          },
        },
      );
      out.enabled.cbbtc = {
        enabled: btcState.enabled,
        agentAddress: btcState.agentAddress,
        maxNotionalUsd: maxUsdc,
        publicEarnListed: false,
        depositsPaused: true,
        paperEdgePass: paper.pass,
      };
      out.next.push("Set BTC_QUANT_REAL_CRON_ENABLED=true and restart API (or rely on GHA btc-quant-real-cron)");
      out.next.push("Fund invest wallet ~50 USDC + SOL fees, then set depositsPaused=false for lab accrual");
      out.next.push("node scripts/validate-earn-yield-launch.js --product=cbbtc_onchain_signal");
    }
  }

  if (products.includes("btc3")) {
    // BTC3 has no paper-edge dossier gate equivalent to btc1; keep lab-only flags.
    const btc3State = await enableBtc3Real({
      anonymousId,
      enabledBy: "activate-earn-lab-agents",
      maxNotionalUsd: maxUsdc,
    });
    await Btc3RealConfig.updateOne(
      { _id: "singleton" },
      {
        $set: {
          publicEarnListed: false,
          depositsPaused: true,
          publicMaxDepositUsdc: maxUsdc,
          maxNotionalUsd: maxUsdc,
          reserveUsdc: Math.min(25, Math.max(5, Math.floor(maxUsdc * 0.1))),
        },
      },
    );
    out.enabled.btc3 = {
      enabled: btc3State.enabled,
      agentAddress: btc3State.agentAddress,
      maxNotionalUsd: maxUsdc,
      publicEarnListed: false,
      depositsPaused: true,
    };
    out.next.push("Set BTC3_REAL_CRON_ENABLED=true and restart API");
    out.next.push("node scripts/validate-earn-yield-launch.js --product=btc3_macro");
  }

  if (products.includes("lst")) {
    if (!LST_LOOP_CRON.realEnabled) {
      out.skipped.lst = {
        reason: "realEnabled_false",
        hint: "Set LST_LOOP_CRON.realEnabled=true in api/config/onchainEarnExperiments.js",
      };
    } else {
      const lstState = await enableLstLoopReal({
        anonymousId,
        enabledBy: "activate-earn-lab-agents",
        maxPositionSol,
        requireGraduation: true,
      });
      await LstLoopRealConfig.updateOne(
        { _id: lstState.agentAddress },
        {
          $set: {
            publicEarnListed: false,
            // Lab accrual: allow signals; public Earn still blocked by readiness + publicEarnListed
            depositsPaused: false,
            maxPositionSol: Math.max(0.5, maxPositionSol),
            publicMaxDepositSol: Math.max(0.5, maxPositionSol),
          },
        },
      );
      out.enabled.lst = {
        enabled: lstState.enabled,
        agentAddress: lstState.agentAddress,
        maxPositionSol: Math.max(0.5, maxPositionSol),
        publicEarnListed: false,
        depositsPaused: false,
      };
      out.next.push("Fund invest wallet with ≥0.5 SOL (+ fees) for LST lab ticks");
      out.next.push("node scripts/validate-earn-yield-launch.js --product=lst_loop");
      out.next.push("GHA: lst-loop-real-cron.yml posts /experiment/lst-loop-real/cron/{signal,resolve}");
    }
  }

  out.next.push("Products auto-graduate to beta on Earn board when readiness.ready === true");
  console.log(JSON.stringify(out, null, 2));

  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
