/**
 * Generalized managed-job runtime: perceive -> decide -> execute -> settle -> report.
 * Handlers are registered per outcome product (LP Autopilot, Treasury, Yield).
 */
import crypto from "node:crypto";
import OutcomeJob from "../models/OutcomeJob.js";
import { getOutcomeProduct } from "../config/outcomeProducts.js";
import { getOutcomeMandate, isMandateExecutable, recordMandateSpend } from "./outcomeMandateService.js";
import { generateOutcomeReport } from "./outcomeProofService.js";
import { prepareOutcomeSettlement } from "./outcomeBillingService.js";
import { runTreasuryAutopilotTick } from "./treasuryAutopilotService.js";
import { runYieldAutopilotTick } from "./yieldAutopilotService.js";

/** @typedef {'perceive' | 'decide' | 'execute' | 'settle' | 'report'} JobPhase */

/**
 * @typedef {Object} RuntimeHandlerResult
 * @property {Object} [decision]
 * @property {Object} [execution]
 * @property {number} [realizedPnlUsd]
 * @property {string} [summary]
 * @property {Object} [metrics]
 * @property {Array} [txProofs]
 * @property {string} [error]
 */

/** @type {Record<string, (ctx: RuntimeContext) => Promise<RuntimeHandlerResult>>} */
const HANDLERS = {
  solanaLpAutopilot: async (ctx) => ({
    decision: { action: "delegate_solana_lp_real", mandateId: ctx.mandate.mandateId },
    summary: "Solana LP Autopilot delegates to existing lp-agent-real cron infrastructure.",
    metrics: { managedCapitalUsd: 0, realizedPnlUsd: 0 },
    execution: { delegated: true, handler: "lpRealService" },
  }),
  treasuryAutopilot: runTreasuryAutopilotTick,
  yieldAutopilot: runYieldAutopilotTick,
};

function newJobId() {
  return `job_${crypto.randomBytes(12).toString("hex")}`;
}

/**
 * @typedef {Object} RuntimeContext
 * @property {object} job
 * @property {object} mandate
 * @property {import('../config/outcomeProducts.js').OutcomeProductDef} product
 * @property {Object} input
 */

/**
 * Create and enqueue a new outcome job for a mandate.
 * @param {string} mandateId
 * @param {Object} [input]
 */
export async function createOutcomeJob(mandateId, input = {}) {
  const mandate = await getOutcomeMandate(mandateId);
  if (!mandate) throw new Error(`Mandate not found: ${mandateId}`);

  const execCheck = isMandateExecutable(mandate);
  if (!execCheck.allowed) {
    throw new Error(`Mandate not executable: ${execCheck.reasons.join(", ")}`);
  }

  const product = getOutcomeProduct(mandate.productId);
  if (!product) throw new Error(`Unknown product: ${mandate.productId}`);

  const jobId = newJobId();
  const job = await OutcomeJob.create({
    jobId,
    mandateId,
    productId: mandate.productId,
    anonymousId: mandate.anonymousId,
    chain: mandate.chain,
    status: "pending",
    phase: "perceive",
    input,
    dryRun: input.dryRun ?? false,
    startedAt: new Date(),
  });

  return job.toObject();
}

/**
 * Advance a job through the full runtime pipeline.
 * @param {string} jobId
 */
export async function runOutcomeJob(jobId) {
  const job = await OutcomeJob.findOne({ jobId });
  if (!job) throw new Error(`Job not found: ${jobId}`);

  const mandate = await getOutcomeMandate(job.mandateId);
  const execCheck = isMandateExecutable(mandate);
  if (!execCheck.allowed) {
    job.status = "failed";
    job.error = `Mandate not executable: ${execCheck.reasons.join(", ")}`;
    await job.save();
    return job.toObject();
  }

  const product = getOutcomeProduct(job.productId);
  const handler = HANDLERS[product?.runtimeHandler];
  if (!handler) {
    job.status = "failed";
    job.error = `No runtime handler for ${product?.runtimeHandler}`;
    await job.save();
    return job.toObject();
  }

  const ctx = { job: job.toObject(), mandate, product, input: job.input ?? {} };

  try {
    job.status = "perceiving";
    job.phase = "perceive";
    await job.save();

    job.status = "deciding";
    job.phase = "decide";
    await job.save();

    const result = await handler(ctx);

    job.decision = result.decision ?? null;
    job.status = "executing";
    job.phase = "execute";
    await job.save();

    job.execution = result.execution ?? null;
    job.realizedPnlUsd = result.realizedPnlUsd ?? 0;
    job.status = "settling";
    job.phase = "settle";
    await job.save();

    const report = await generateOutcomeReport({
      jobId: job.jobId,
      summary: result.summary ?? `Completed ${product.label}`,
      metrics: result.metrics ?? { realizedPnlUsd: job.realizedPnlUsd },
      txProofs: result.txProofs ?? [],
    });

    const settlement = await prepareOutcomeSettlement(report.reportId);
    job.settlement = settlement;
    job.feeUsd = settlement.amountUsd ?? 0;
    job.reportId = report.reportId;
    job.status = "completed";
    job.phase = "report";
    job.completedAt = new Date();
    await job.save();

    await recordMandateSpend(mandate.mandateId, job.feeUsd, job.realizedPnlUsd);

    return job.toObject();
  } catch (err) {
    job.status = "failed";
    job.error = err instanceof Error ? err.message : String(err);
    job.completedAt = new Date();
    await job.save();
    return job.toObject();
  }
}

/**
 * Run outcome jobs for all active mandates of a product.
 * @param {string} productId
 */
export async function runOutcomeJobsForProduct(productId) {
  const OutcomeMandate = (await import("../models/OutcomeMandate.js")).default;
  const mandates = await OutcomeMandate.find({
    productId,
    status: "active",
    killSwitch: { $ne: true },
  }).lean();

  const results = [];
  for (const mandate of mandates) {
    try {
      const job = await createOutcomeJob(mandate.mandateId, { tick: true });
      const completed = await runOutcomeJob(job.jobId);
      results.push({ mandateId: mandate.mandateId, jobId: completed.jobId, status: completed.status });
    } catch (err) {
      results.push({
        mandateId: mandate.mandateId,
        status: "error",
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
  return results;
}

/**
 * @param {string} jobId
 */
export async function getOutcomeJob(jobId) {
  return OutcomeJob.findOne({ jobId }).lean();
}

/**
 * @param {string} anonymousId
 * @param {{ mandateId?: string; limit?: number }} [opts]
 */
export async function listOutcomeJobs(anonymousId, opts = {}) {
  const q = { anonymousId };
  if (opts.mandateId) q.mandateId = opts.mandateId;
  const limit = Math.min(100, Math.max(1, Number(opts.limit) || 20));
  return OutcomeJob.find(q).sort({ createdAt: -1 }).limit(limit).lean();
}

export { HANDLERS };
