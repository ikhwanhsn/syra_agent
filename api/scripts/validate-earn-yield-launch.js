/**
 * Validate Earn Yield launch readiness for one or all products.
 * Read-only by default. Pass --apply-pause to enforce kill switches.
 *
 * Usage:
 *   node api/scripts/validate-earn-yield-launch.js
 *   node api/scripts/validate-earn-yield-launch.js --product=lp_meteora_dlmm
 *   node api/scripts/validate-earn-yield-launch.js --product=cbbtc_onchain_signal
 *   node api/scripts/validate-earn-yield-launch.js --product=btc3_macro
 *   node api/scripts/validate-earn-yield-launch.js --product=momentum_rotator
 *   node api/scripts/validate-earn-yield-launch.js --product=lst_loop
 *   node api/scripts/validate-earn-yield-launch.js --product=alpha_sniper
 *   node api/scripts/validate-earn-yield-launch.js --all [--apply-pause]
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

function argValue(name) {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : null;
}

async function main() {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('MONGODB_URI required');
    process.exit(1);
  }
  await mongoose.connect(mongoUri);

  const {
    getEarnYieldLaunchReadiness,
    getEarnYieldProductReadiness,
    enforceEarnYieldKillSwitch,
  } = await import('../libs/earnYieldService.js');
  const {
    listEarnProducts,
    EARN_PRODUCT_LP,
    EARN_PRODUCT_MOMENTUM,
    EARN_PRODUCT_LST_LOOP,
    EARN_PRODUCT_SNIPER,
  } = await import('../config/earnProducts.js');

  const all = process.argv.includes('--all');
  const productArg = argValue('product');
  const applyPause = process.argv.includes('--apply-pause');

  const productIds = all
    ? listEarnProducts().map((p) => p.id)
    : [productArg || EARN_PRODUCT_LP];

  let anyNotReady = false;
  for (const productId of productIds) {
    const readiness =
      productId === EARN_PRODUCT_LP && !all && !productArg
        ? await getEarnYieldLaunchReadiness()
        : await getEarnYieldProductReadiness(productId);

    console.log(`\n=== ${productId} ===`);
    console.log(JSON.stringify(readiness, null, 2));

    // Paper graduation gates for new onchain experiments
    if (
      [EARN_PRODUCT_MOMENTUM, EARN_PRODUCT_LST_LOOP, EARN_PRODUCT_SNIPER].includes(productId)
    ) {
      try {
        let grad = null;
        if (productId === EARN_PRODUCT_MOMENTUM) {
          grad = await import('../libs/momentumRotatorRealService.js').then((m) =>
            m.checkMomentumPaperGraduation(),
          );
        } else if (productId === EARN_PRODUCT_LST_LOOP) {
          grad = await import('../libs/lstLoopRealService.js').then((m) =>
            m.checkLstLoopPaperGraduation(),
          );
        } else {
          grad = await import('../libs/sniperRealService.js').then((m) =>
            m.checkSniperPaperGraduation(),
          );
        }
        console.log('paper_graduation:', JSON.stringify(grad, null, 2));
        if (!grad?.pass) {
          anyNotReady = true;
          console.log(`PAPER GATE FAIL (${productId}): need ≥50 decided + positive expectancy`);
        }
      } catch (e) {
        console.warn('paper_graduation_check_failed:', e instanceof Error ? e.message : e);
      }
    }

    if (applyPause) {
      const result = await enforceEarnYieldKillSwitch(productId);
      console.log('kill_switch:', JSON.stringify(result, null, 2));
    }

    if (readiness.ready) {
      console.log(`READY: ${productId} passes launch guards (may auto-graduate to beta on board).`);
    } else {
      anyNotReady = true;
      console.log(`NOT READY (${productId}). Blockers:`, (readiness.blockers || []).join(', '));
    }
  }

  if (!anyNotReady && productIds.includes(EARN_PRODUCT_LP)) {
    console.log('\nLP ops reminders:');
    console.log('  1. Set LP_AGENT_REAL_ENABLED=true');
    console.log('  2. POST /experiment/lp-agent-real/enable with operator session');
    console.log('  3. Or POST /earn/yield/enable for public beta (capped deposits)');
  }

  console.log('\nNew experiment ops:');
  console.log('  Flip realEnabled in api/config/onchainEarnExperiments.js');
  console.log('  Paper labs: /momentum-rotator /lst-loop /alpha-sniper (admin)');
  console.log('  API: /experiment/momentum-rotator|/lst-loop|/sniper (+ -real)');

  if (anyNotReady) process.exitCode = 2;
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
