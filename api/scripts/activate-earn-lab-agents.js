/**
 * Activate Earn Yield lab agents at small capital.
 * Does NOT open public deposits — products stay coming_soon until readiness.ready.
 *
 * Usage:
 *   node api/scripts/activate-earn-lab-agents.js --dry-run --anonymous-id=<aid>
 *   node api/scripts/activate-earn-lab-agents.js --anonymous-id=<aid> --product=lst [--max-position-sol=0.5]
 *   node api/scripts/activate-earn-lab-agents.js --anonymous-id=<aid> --product=all
 *
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
  const raw = (argValue("product") || "lst").toLowerCase().trim();
  if (raw === "all") return ["lst"];
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const anonymousId = argValue("anonymous-id") || process.env.EARN_LAB_ANONYMOUS_ID || "";
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
        anonymousId: anonymousId ? `${anonymousId.slice(0, 18)}…` : null,
        maxPositionSol,
        products,
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

  const { enableLstLoopReal, getLstLoopRealState, checkLstLoopPaperGraduation } = await import(
    "../libs/lstLoopRealService.js"
  );
  const LstLoopRealConfig = (await import("../models/LstLoopRealConfig.js")).default;
  const { getEarnYieldProductReadiness } = await import("../libs/earnYieldService.js");
  const { LST_LOOP_CRON } = await import("../config/onchainEarnExperiments.js");

  if (dryRun) {
    const wantLst = products.includes("lst");
    const [lstState, lstReady, lstGrad] = await Promise.all([
      wantLst ? getLstLoopRealState({ viewerAnonymousId: anonymousId }) : null,
      wantLst ? getEarnYieldProductReadiness("lst_loop") : null,
      wantLst ? checkLstLoopPaperGraduation() : null,
    ]);
    console.log(
      JSON.stringify(
        {
          dryRun: true,
          lstRealEnabled: LST_LOOP_CRON.realEnabled,
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
