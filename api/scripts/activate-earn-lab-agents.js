/**
 * Activate Earn Yield lab agents (cbBTC + BTC3) at small capital.
 * Does NOT open public deposits — products stay coming_soon until readiness.ready.
 *
 * Usage:
 *   node api/scripts/activate-earn-lab-agents.js --dry-run
 *   node api/scripts/activate-earn-lab-agents.js --anonymous-id=<chatAid> [--max-usdc=50]
 *
 * Env required for live trading after enable:
 *   BTC_QUANT_REAL_CRON_ENABLED=true
 *   BTC3_REAL_CRON_ENABLED=true
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

function argValue(name) {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : null;
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const anonymousId = argValue("anonymous-id") || process.env.EARN_LAB_ANONYMOUS_ID || "";
  const maxUsdc = Number(argValue("max-usdc") || process.env.EARN_LAB_MAX_USDC || 50);

  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!mongoUri) {
    console.error("MONGODB_URI required");
    process.exit(1);
  }

  console.log(
    JSON.stringify(
      {
        dryRun,
        anonymousId: anonymousId || null,
        maxUsdc,
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
  const BtcQuantRealConfig = (await import("../models/BtcQuantRealConfig.js")).default;
  const Btc3RealConfig = (await import("../models/btc3/Btc3RealConfig.js")).default;
  const { getEarnYieldProductReadiness } = await import("../libs/earnYieldService.js");

  if (dryRun) {
    const [btcState, btc3State, btcReady, btc3Ready] = await Promise.all([
      getBtcQuantRealState({ viewerAnonymousId: anonymousId, lane: "btc1" }),
      getBtc3RealState({ viewerAnonymousId: anonymousId }),
      getEarnYieldProductReadiness("cbbtc_onchain_signal"),
      getEarnYieldProductReadiness("btc3_macro"),
    ]);
    console.log(
      JSON.stringify(
        {
          dryRun: true,
          btcQuant: {
            enabled: btcState.enabled,
            agentAddress: btcState.agentAddress,
            maxNotionalUsd: btcState.maxNotionalUsd,
            cronEnabled: btcState.cronEnabled,
            readiness: { ready: btcReady.ready, blockers: btcReady.blockers },
          },
          btc3: {
            enabled: btc3State.enabled,
            agentAddress: btc3State.agentAddress,
            maxNotionalUsd: btc3State.maxNotionalUsd,
            cronEnabled: btc3State.cronEnabled,
            readiness: { ready: btc3Ready.ready, blockers: btc3Ready.blockers },
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
        // Lab only — do not list for public deposits yet
        publicEarnListed: false,
        depositsPaused: true,
        publicMaxDepositUsdc: maxUsdc,
        maxNotionalUsd: maxUsdc,
        reserveUsdc: Math.min(25, Math.max(5, Math.floor(maxUsdc * 0.1))),
      },
    },
  );

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

  console.log(
    JSON.stringify(
      {
        ok: true,
        btcQuant: {
          enabled: btcState.enabled,
          agentAddress: btcState.agentAddress,
          maxNotionalUsd: maxUsdc,
        },
        btc3: {
          enabled: btc3State.enabled,
          agentAddress: btc3State.agentAddress,
          maxNotionalUsd: maxUsdc,
        },
        next: [
          "Set BTC_QUANT_REAL_CRON_ENABLED=true and BTC3_REAL_CRON_ENABLED=true",
          "Fund invest wallet with USDC (+ SOL for fees)",
          "Run: node scripts/validate-earn-yield-launch.js --product=cbbtc_onchain_signal",
          "Run: node scripts/validate-earn-yield-launch.js --product=btc3_macro",
          "Products auto-graduate to beta on Earn board when readiness.ready === true",
        ],
      },
      null,
      2,
    ),
  );

  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
