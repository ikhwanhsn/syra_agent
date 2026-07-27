import express from "express";
import { listOutcomeProducts, getOutcomeProduct } from "../config/outcomeProducts.js";
import { computeOutcomeFee } from "../config/outcomePricing.js";
import { OUTCOME_REGULATORY_NOTICE } from "../config/outcomeRegulatory.js";
import {
  createOutcomeMandate,
  getOutcomeMandate,
  listOutcomeMandates,
  revokeOutcomeMandate,
  killOutcomeMandate,
  pauseOutcomeMandate,
  resumeOutcomeMandate,
} from "../libs/outcomeMandateService.js";
import {
  createOutcomeJob,
  runOutcomeJob,
  getOutcomeJob,
  listOutcomeJobs,
} from "../libs/outcomeJobRuntime.js";
import {
  getOutcomeReport,
  listOutcomeReports,
  verifyOutcomeReport,
} from "../libs/outcomeProofService.js";
import {
  getOutcomeBillingEvent,
  listOutcomeBillingEvents,
  markOutcomeBillingPaid,
  prepareOutcomeSettlement,
} from "../libs/outcomeBillingService.js";
import {
  getEvGateDashboard,
  getRobinhoodLpEvGateStatus,
  getSolanaLpEvGateStatus,
  validateRobinhoodPoolUniverse,
} from "../libs/outcomeEvGateService.js";
import {
  disableRobinhoodLpAutopilot,
  enableRobinhoodLpAutopilot,
  getRobinhoodLpAutopilotStatus,
} from "../libs/robinhoodLpRealService.js";
import { evaluateTreasuryPolicy } from "../libs/treasuryAutopilotService.js";
import { evaluateYieldOpportunity, listYieldVenues } from "../libs/yieldAutopilotService.js";
import { runOutcomeSchedulerTick } from "../libs/outcomeJobScheduler.js";

function requireCronSecret(req, res, next) {
  const secret = (process.env.OUTCOME_CRON_SECRET || process.env.ROBINHOOD_LP_EXPERIMENT_CRON_SECRET || "").trim();
  if (!secret) return next();
  const got = (req.get("x-outcome-cron-secret") || req.get("x-lp-robinhood-experiment-secret") || "").trim();
  if (got !== secret) {
    return res.status(403).json({ success: false, error: "Invalid or missing cron secret" });
  }
  return next();
}

function resolveAnonymousId(req) {
  return (
    req.body?.anonymousId ||
    req.query?.anonymousId ||
    req.headers["x-anonymous-id"] ||
    req.session?.anonymousId ||
    null
  );
}

export function createOutcomesRouter() {
  const router = express.Router();

  router.get("/catalog", (_req, res) => {
    res.json({
      success: true,
      data: {
        products: listOutcomeProducts(),
        positioning: "Machine money for agents: buy completed financial outcomes, not copilot data.",
        regulatory: OUTCOME_REGULATORY_NOTICE,
      },
    });
  });

  router.get("/catalog/:productId", (req, res) => {
    const product = getOutcomeProduct(req.params.productId);
    if (!product) {
      return res.status(404).json({ success: false, error: "Product not found" });
    }
    const pricing = computeOutcomeFee(product.id, { realizedPnlUsd: 100, managedCapitalUsd: 1000 });
    res.json({ success: true, data: { product, samplePricing: pricing } });
  });

  router.get("/ev-gate", async (_req, res) => {
    try {
      const data = await getEvGateDashboard();
      res.json({ success: true, data });
    } catch (e) {
      res.status(500).json({ success: false, error: e instanceof Error ? e.message : String(e) });
    }
  });

  router.get("/ev-gate/robinhood-lp", async (_req, res) => {
    try {
      const data = await getRobinhoodLpEvGateStatus();
      res.json({ success: true, data });
    } catch (e) {
      res.status(500).json({ success: false, error: e instanceof Error ? e.message : String(e) });
    }
  });

  router.get("/ev-gate/solana-lp", async (_req, res) => {
    try {
      const data = await getSolanaLpEvGateStatus();
      res.json({ success: true, data });
    } catch (e) {
      res.status(500).json({ success: false, error: e instanceof Error ? e.message : String(e) });
    }
  });

  router.get("/ev-gate/pool-universe", async (_req, res) => {
    try {
      const data = await validateRobinhoodPoolUniverse();
      res.json({ success: true, data });
    } catch (e) {
      res.status(500).json({ success: false, error: e instanceof Error ? e.message : String(e) });
    }
  });

  router.post("/mandates", async (req, res) => {
    try {
      const anonymousId = resolveAnonymousId(req);
      if (!anonymousId) {
        return res.status(400).json({ success: false, error: "anonymousId required" });
      }
      const { productId, chain, agentAddress, policy, expiresAt, perTxCapUsd, dailySpendCapUsd, maxManagedCapitalUsd } =
        req.body ?? {};
      if (!productId || !chain || !agentAddress) {
        return res.status(400).json({ success: false, error: "productId, chain, agentAddress required" });
      }
      const mandate = await createOutcomeMandate({
        anonymousId,
        productId,
        chain,
        agentAddress,
        policy,
        expiresAt,
        perTxCapUsd,
        dailySpendCapUsd,
        maxManagedCapitalUsd,
      });
      res.status(201).json({ success: true, data: mandate });
    } catch (e) {
      res.status(400).json({ success: false, error: e instanceof Error ? e.message : String(e) });
    }
  });

  router.get("/mandates", async (req, res) => {
    try {
      const anonymousId = resolveAnonymousId(req);
      if (!anonymousId) {
        return res.status(400).json({ success: false, error: "anonymousId required" });
      }
      const mandates = await listOutcomeMandates(anonymousId, {
        productId: req.query.productId,
        status: req.query.status,
      });
      res.json({ success: true, data: { mandates } });
    } catch (e) {
      res.status(500).json({ success: false, error: e instanceof Error ? e.message : String(e) });
    }
  });

  router.get("/mandates/:mandateId", async (req, res) => {
    try {
      const mandate = await getOutcomeMandate(req.params.mandateId);
      if (!mandate) return res.status(404).json({ success: false, error: "Not found" });
      res.json({ success: true, data: mandate });
    } catch (e) {
      res.status(500).json({ success: false, error: e instanceof Error ? e.message : String(e) });
    }
  });

  router.post("/mandates/:mandateId/revoke", async (req, res) => {
    try {
      const mandate = await revokeOutcomeMandate(req.params.mandateId, req.body?.revokedBy);
      res.json({ success: true, data: mandate });
    } catch (e) {
      res.status(400).json({ success: false, error: e instanceof Error ? e.message : String(e) });
    }
  });

  router.post("/mandates/:mandateId/kill", async (req, res) => {
    try {
      const mandate = await killOutcomeMandate(req.params.mandateId, req.body?.reason);
      res.json({ success: true, data: mandate });
    } catch (e) {
      res.status(400).json({ success: false, error: e instanceof Error ? e.message : String(e) });
    }
  });

  router.post("/mandates/:mandateId/pause", async (req, res) => {
    try {
      const mandate = await pauseOutcomeMandate(req.params.mandateId);
      res.json({ success: true, data: mandate });
    } catch (e) {
      res.status(400).json({ success: false, error: e instanceof Error ? e.message : String(e) });
    }
  });

  router.post("/mandates/:mandateId/resume", async (req, res) => {
    try {
      const mandate = await resumeOutcomeMandate(req.params.mandateId);
      res.json({ success: true, data: mandate });
    } catch (e) {
      res.status(400).json({ success: false, error: e instanceof Error ? e.message : String(e) });
    }
  });

  router.post("/mandates/:mandateId/enable", async (req, res) => {
    try {
      const mandate = await getOutcomeMandate(req.params.mandateId);
      if (!mandate) return res.status(404).json({ success: false, error: "Not found" });
      if (mandate.productId === "robinhood_lp_autopilot") {
        const config = await enableRobinhoodLpAutopilot(req.params.mandateId);
        return res.json({ success: true, data: { mandate, config } });
      }
      res.json({
        success: true,
        data: {
          mandate,
          message: "Mandate active. Run POST /outcomes/jobs to start a completed-work cycle.",
        },
      });
    } catch (e) {
      res.status(400).json({ success: false, error: e instanceof Error ? e.message : String(e) });
    }
  });

  router.post("/mandates/:mandateId/disable", async (req, res) => {
    try {
      const mandate = await getOutcomeMandate(req.params.mandateId);
      if (!mandate) return res.status(404).json({ success: false, error: "Not found" });
      if (mandate.productId === "robinhood_lp_autopilot") {
        const config = await disableRobinhoodLpAutopilot(req.params.mandateId);
        return res.json({ success: true, data: { mandate, config } });
      }
      res.json({
        success: true,
        data: {
          mandate,
          message: "Use pause/revoke for non-LP products.",
        },
      });
    } catch (e) {
      res.status(400).json({ success: false, error: e instanceof Error ? e.message : String(e) });
    }
  });

  router.get("/mandates/:mandateId/status", async (req, res) => {
    try {
      const mandate = await getOutcomeMandate(req.params.mandateId);
      if (!mandate) return res.status(404).json({ success: false, error: "Not found" });
      let productStatus = null;
      if (mandate.productId === "robinhood_lp_autopilot") {
        productStatus = await getRobinhoodLpAutopilotStatus(req.params.mandateId);
      }
      res.json({ success: true, data: { mandate, productStatus } });
    } catch (e) {
      res.status(500).json({ success: false, error: e instanceof Error ? e.message : String(e) });
    }
  });

  router.post("/jobs", async (req, res) => {
    try {
      const { mandateId, input } = req.body ?? {};
      if (!mandateId) return res.status(400).json({ success: false, error: "mandateId required" });
      const job = await createOutcomeJob(mandateId, input ?? {});
      const completed = await runOutcomeJob(job.jobId);
      res.status(201).json({ success: true, data: completed });
    } catch (e) {
      res.status(400).json({ success: false, error: e instanceof Error ? e.message : String(e) });
    }
  });

  router.get("/jobs/:jobId", async (req, res) => {
    try {
      const job = await getOutcomeJob(req.params.jobId);
      if (!job) return res.status(404).json({ success: false, error: "Not found" });
      res.json({ success: true, data: job });
    } catch (e) {
      res.status(500).json({ success: false, error: e instanceof Error ? e.message : String(e) });
    }
  });

  router.get("/jobs", async (req, res) => {
    try {
      const anonymousId = resolveAnonymousId(req);
      if (!anonymousId) return res.status(400).json({ success: false, error: "anonymousId required" });
      const jobs = await listOutcomeJobs(anonymousId, {
        mandateId: req.query.mandateId,
        limit: req.query.limit,
      });
      res.json({ success: true, data: { jobs } });
    } catch (e) {
      res.status(500).json({ success: false, error: e instanceof Error ? e.message : String(e) });
    }
  });

  router.get("/reports/:reportId", async (req, res) => {
    try {
      const report = await getOutcomeReport(req.params.reportId);
      if (!report) return res.status(404).json({ success: false, error: "Not found" });
      res.json({ success: true, data: report });
    } catch (e) {
      res.status(500).json({ success: false, error: e instanceof Error ? e.message : String(e) });
    }
  });

  router.get("/reports/:reportId/verify", async (req, res) => {
    try {
      const verification = await verifyOutcomeReport(req.params.reportId);
      res.json({ success: true, data: verification });
    } catch (e) {
      res.status(500).json({ success: false, error: e instanceof Error ? e.message : String(e) });
    }
  });

  router.get("/reports", async (req, res) => {
    try {
      const anonymousId = resolveAnonymousId(req);
      if (!anonymousId) return res.status(400).json({ success: false, error: "anonymousId required" });
      const reports = await listOutcomeReports(anonymousId, {
        mandateId: req.query.mandateId,
        limit: req.query.limit,
      });
      res.json({ success: true, data: { reports } });
    } catch (e) {
      res.status(500).json({ success: false, error: e instanceof Error ? e.message : String(e) });
    }
  });

  router.get("/billing/:billingEventId", async (req, res) => {
    try {
      const billing = await getOutcomeBillingEvent(req.params.billingEventId);
      if (!billing) return res.status(404).json({ success: false, error: "Not found" });
      res.json({ success: true, data: billing });
    } catch (e) {
      res.status(500).json({ success: false, error: e instanceof Error ? e.message : String(e) });
    }
  });

  router.post("/billing/:billingEventId/settle", async (req, res) => {
    try {
      const { txSignature, network, payer } = req.body ?? {};
      if (!txSignature) {
        return res.status(400).json({ success: false, error: "txSignature required" });
      }
      const billing = await markOutcomeBillingPaid(req.params.billingEventId, {
        txSignature,
        network,
        payer,
      });
      res.json({ success: true, data: billing });
    } catch (e) {
      res.status(400).json({ success: false, error: e instanceof Error ? e.message : String(e) });
    }
  });

  router.get("/billing", async (req, res) => {
    try {
      const anonymousId = resolveAnonymousId(req);
      if (!anonymousId) return res.status(400).json({ success: false, error: "anonymousId required" });
      const events = await listOutcomeBillingEvents(anonymousId, Number(req.query.limit) || 20);
      res.json({ success: true, data: { events } });
    } catch (e) {
      res.status(500).json({ success: false, error: e instanceof Error ? e.message : String(e) });
    }
  });

  router.post("/treasury/evaluate", async (req, res) => {
    try {
      const { mandateId, portfolio } = req.body ?? {};
      if (!mandateId) return res.status(400).json({ success: false, error: "mandateId required" });
      const result = await evaluateTreasuryPolicy(mandateId, portfolio ?? {});
      res.json({ success: true, data: result });
    } catch (e) {
      res.status(400).json({ success: false, error: e instanceof Error ? e.message : String(e) });
    }
  });

  router.get("/yield/venues", (_req, res) => {
    res.json({ success: true, data: { venues: listYieldVenues() } });
  });

  router.post("/yield/evaluate", async (req, res) => {
    try {
      const { mandateId, idleCapitalUsd } = req.body ?? {};
      if (!mandateId) return res.status(400).json({ success: false, error: "mandateId required" });
      const result = await evaluateYieldOpportunity(mandateId, Number(idleCapitalUsd) || 0);
      res.json({ success: true, data: result });
    } catch (e) {
      res.status(400).json({ success: false, error: e instanceof Error ? e.message : String(e) });
    }
  });

  router.post("/cron/tick", requireCronSecret, async (_req, res) => {
    try {
      const data = await runOutcomeSchedulerTick();
      res.json({ success: true, data });
    } catch (e) {
      res.status(500).json({ success: false, error: e instanceof Error ? e.message : String(e) });
    }
  });

  return router;
}
