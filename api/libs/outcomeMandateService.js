/**
 * Standing mandate service: create, revoke, and enforce scoped delegation for outcome products.
 */
import crypto from "node:crypto";
import OutcomeMandate from "../models/OutcomeMandate.js";
import { getOutcomeProduct } from "../config/outcomeProducts.js";
import { isRealExecutionUnlocked } from "./outcomeEvGateService.js";

function newMandateId() {
  return `mandate_${crypto.randomBytes(12).toString("hex")}`;
}

/**
 * @typedef {Object} CreateMandateInput
 * @property {string} anonymousId
 * @property {string} productId
 * @property {string} chain
 * @property {string} agentAddress
 * @property {string[]} [allowedTools]
 * @property {string[]} [destinationAllowlist]
 * @property {number} [perTxCapUsd]
 * @property {number} [dailySpendCapUsd]
 * @property {number} [hourlySpendCapUsd]
 * @property {number} [maxManagedCapitalUsd]
 * @property {Date | string} [expiresAt]
 * @property {Object} [policy]
 */

/**
 * Create a new standing mandate for an outcome product.
 * @param {CreateMandateInput} input
 */
export async function createOutcomeMandate(input) {
  const product = getOutcomeProduct(input.productId);
  if (!product) {
    throw new Error(`Unknown outcome product: ${input.productId}`);
  }
  if (!product.allowedChains.includes(input.chain)) {
    throw new Error(`Chain ${input.chain} not allowed for product ${input.productId}`);
  }

  if (product.requiresEvGate) {
    const unlocked = await isRealExecutionUnlocked(product.id);
    if (!unlocked) {
      throw new Error(
        `EV gate not passed for ${product.id}. Paper sim must prove positive EV before real mandates.`,
      );
    }
  }

  const allowedTools =
    Array.isArray(input.allowedTools) && input.allowedTools.length > 0
      ? input.allowedTools.filter((t) => product.mandateToolIds.includes(t))
      : [...product.mandateToolIds];

  const maxCap = input.maxManagedCapitalUsd ?? 200;
  const perTx = input.perTxCapUsd ?? 25;

  const mandateId = newMandateId();
  const doc = await OutcomeMandate.create({
    mandateId,
    anonymousId: input.anonymousId,
    productId: input.productId,
    chain: input.chain,
    agentAddress: input.agentAddress,
    allowedTools,
    destinationAllowlist: input.destinationAllowlist ?? [],
    perTxCapUsd: perTx,
    dailySpendCapUsd: input.dailySpendCapUsd ?? 100,
    hourlySpendCapUsd: input.hourlySpendCapUsd ?? 50,
    maxManagedCapitalUsd: maxCap,
    expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
    policy: input.policy ?? {},
    status: "active",
  });

  return doc.toObject();
}

/**
 * @param {string} mandateId
 */
export async function getOutcomeMandate(mandateId) {
  return OutcomeMandate.findOne({ mandateId }).lean();
}

/**
 * @param {string} anonymousId
 * @param {{ productId?: string; status?: string }} [filter]
 */
export async function listOutcomeMandates(anonymousId, filter = {}) {
  const q = { anonymousId };
  if (filter.productId) q.productId = filter.productId;
  if (filter.status) q.status = filter.status;
  return OutcomeMandate.find(q).sort({ createdAt: -1 }).lean();
}

/**
 * Revoke a mandate (agent or operator initiated).
 * @param {string} mandateId
 * @param {string} [revokedBy]
 */
export async function revokeOutcomeMandate(mandateId, revokedBy = "agent") {
  const doc = await OutcomeMandate.findOneAndUpdate(
    { mandateId, status: { $in: ["active", "paused"] } },
    { $set: { status: "revoked", revokedAt: new Date(), revokedBy } },
    { new: true },
  ).lean();
  if (!doc) throw new Error(`Mandate not found or already revoked: ${mandateId}`);
  return doc;
}

/**
 * Kill switch: immediately halt all execution under mandate.
 * @param {string} mandateId
 * @param {string} reason
 */
export async function killOutcomeMandate(mandateId, reason = "operator_kill_switch") {
  const doc = await OutcomeMandate.findOneAndUpdate(
    { mandateId },
    {
      $set: {
        killSwitch: true,
        killSwitchReason: reason,
        killedAt: new Date(),
        status: "killed",
      },
    },
    { new: true },
  ).lean();
  if (!doc) throw new Error(`Mandate not found: ${mandateId}`);
  return doc;
}

/**
 * Pause mandate (reversible).
 */
export async function pauseOutcomeMandate(mandateId) {
  return OutcomeMandate.findOneAndUpdate(
    { mandateId, status: "active" },
    { $set: { status: "paused" } },
    { new: true },
  ).lean();
}

/**
 * Resume paused mandate.
 */
export async function resumeOutcomeMandate(mandateId) {
  const m = await OutcomeMandate.findOne({ mandateId }).lean();
  if (!m) throw new Error(`Mandate not found: ${mandateId}`);
  if (m.killSwitch) throw new Error("Cannot resume killed mandate");
  if (m.expiresAt && new Date(m.expiresAt) < new Date()) {
    throw new Error("Mandate expired");
  }
  return OutcomeMandate.findOneAndUpdate(
    { mandateId, status: "paused" },
    { $set: { status: "active" } },
    { new: true },
  ).lean();
}

/**
 * Check if mandate is executable right now.
 * @param {import('../models/OutcomeMandate.js').default | object} mandate
 * @returns {{ allowed: boolean; reasons: string[] }}
 */
export function isMandateExecutable(mandate) {
  const reasons = [];
  if (!mandate) return { allowed: false, reasons: ["mandate_missing"] };
  if (mandate.status !== "active") reasons.push(`status_${mandate.status}`);
  if (mandate.killSwitch) reasons.push("kill_switch_active");
  if (mandate.expiresAt && new Date(mandate.expiresAt) < new Date()) reasons.push("expired");
  return { allowed: reasons.length === 0, reasons };
}

/**
 * Build wallet config overlay from mandate for policyEngine / walletBroker.
 * @param {object} mandate
 * @param {object} baseWalletConfig
 */
export function mandateToWalletConfigOverlay(mandate, baseWalletConfig = {}) {
  return {
    ...baseWalletConfig,
    perTxCapUsd: Math.min(
      Number(baseWalletConfig.perTxCapUsd) || Infinity,
      Number(mandate.perTxCapUsd) || 25,
    ),
    dailySpendCapUsd: Math.min(
      Number(baseWalletConfig.dailySpendCapUsd) || Infinity,
      Number(mandate.dailySpendCapUsd) || 100,
    ),
    hourlySpendCapUsd: Math.min(
      Number(baseWalletConfig.hourlySpendCapUsd) || Infinity,
      Number(mandate.hourlySpendCapUsd) || 50,
    ),
    allowedTools: mandate.allowedTools?.length
      ? mandate.allowedTools
      : baseWalletConfig.allowedTools,
    destinationAllowlist: [
      ...(baseWalletConfig.destinationAllowlist ?? []),
      ...(mandate.destinationAllowlist ?? []),
    ],
    mandateId: mandate.mandateId,
    maxManagedCapitalUsd: mandate.maxManagedCapitalUsd,
  };
}

/**
 * Record spend against mandate cumulative counter.
 */
export async function recordMandateSpend(mandateId, amountUsd, realizedPnlUsd = 0) {
  await OutcomeMandate.updateOne(
    { mandateId },
    {
      $inc: {
        cumulativeSpendUsd: Math.max(0, amountUsd),
        cumulativeRealizedPnlUsd: realizedPnlUsd,
      },
      $set: { lastJobAt: new Date() },
    },
  );
}
