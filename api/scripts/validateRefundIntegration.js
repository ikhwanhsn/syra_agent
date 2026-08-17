/**
 * Validate in-house x402 refund layer config (no on-chain send).
 *
 * Usage:
 *   node scripts/validateRefundIntegration.js
 */
import {
  getRefundResolvedConfig,
  isRefundEnabled,
  isInboundRefundEnabled,
  isOutboundRefundEnabled,
} from "../config/refund.js";
import { hasRefundTreasurySigner, getRefundTreasuryAddress } from "../libs/refund/refundSender.js";
import { classifyCallOutcome } from "../libs/refund/failureClassifier.js";
import { evaluateInboundRefund } from "../libs/refund/inboundRefundGuard.js";

function main() {
  const cfg = getRefundResolvedConfig();
  console.log("=== Syra x402 refund layer ===");
  console.log("Config:", JSON.stringify(cfg, null, 2));

  const chains = /** @type {const} */ (["solana", "base", "xlayer", "algorand"]);
  for (const chain of chains) {
    const has = hasRefundTreasurySigner(chain);
    const addr = getRefundTreasuryAddress(chain);
    console.log(`Treasury ${chain}: signer=${has} address=${addr || "(none)"}`);
  }

  const sample5xx = classifyCallOutcome({ httpStatus: 503, hadPayment: true });
  const sampleOk = classifyCallOutcome({ httpStatus: 200, hadPayment: true });
  console.log("Classifier 503+paid:", sample5xx);
  console.log("Classifier 200+paid:", sampleOk);

  const inbound = evaluateInboundRefund({
    statusCode: 500,
    settle: { success: true, payer: "Payer1111111111111111111111111111111111111" },
    priceUsd: 0.01,
    network: "solana:mainnet",
  });
  console.log("Inbound 500-after-settle:", inbound);

  if (!isRefundEnabled()) {
    console.warn("REFUND_ENABLED is off. Set REFUND_ENABLED=true (or unset) to cover calls.");
  }
  if (!hasRefundTreasurySigner("solana")) {
    console.warn("No Solana refund signer. Set REFUND_SOLANA_PRIVATE_KEY or AGENT_PRIVATE_KEY.");
  }

  console.log("\nAPI: GET /agent/refunds/status");
  console.log("API: GET /agent/refunds?anonymousId=...  (alias GET /agent/pact/refunds)");
  console.log("API: GET /refund/status  GET /refund/claims?wallet=...");
  console.log("API: POST /refund/relay  POST /refund/reprobe  (hosted RaaS, REFUND_HOSTED_ENABLED)");
  console.log(
    `Coverage: inbound=${isInboundRefundEnabled()} outbound=${isOutboundRefundEnabled()} hosted=${cfg.hosted}`,
  );
  process.exit(0);
}

main();
