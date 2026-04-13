/**
 * Giza Agent SDK x402 routes — DeFi yield optimization (Base, Arbitrum).
 * GET /giza/protocols, /giza/agent, /giza/portfolio, /giza/apr, /giza/performance
 * POST /giza/activate, /giza/withdraw, /giza/top-up, /giza/update-protocols, /giza/run
 * Requires GIZA_API_KEY, GIZA_API_URL, GIZA_PARTNER_NAME.
 */
import express from "express";
import { getV2Payment } from "../../../utils/getV2Payment.js";
import { X402_API_PRICE_GIZA_USD } from "../../../config/x402Pricing.js";
import { getGiza, getAgentByOwner, hasGizaCredentials } from "../../../libs/gizaClient.js";

const { requirePayment, settlePaymentAndSetResponse } = await getV2Payment();

const GIZA_PAYMENT_BASE = {
  price: X402_API_PRICE_GIZA_USD,
  discoverable: true,
};

function params(req) {
  return { ...req.query, ...(req.body && typeof req.body === "object" ? req.body : {}) };
}

function ensureGiza(res) {
  if (!hasGizaCredentials()) {
    res.status(503).json({
      success: false,
      error: "Giza is not configured",
      message: "Set GIZA_API_KEY, GIZA_API_URL, and GIZA_PARTNER_NAME to enable Giza yield optimization.",
    });
    return false;
  }
  return true;
}

async function maybeSettle(res, req) {
  if (req.x402Payment) await settlePaymentAndSetResponse(res, req);
}

export async function createGizaRouter() {
  const router = express.Router();

  router.get(
    "/protocols",
    requirePayment({
      method: "GET",
      ...GIZA_PAYMENT_BASE,
      resource: "/giza/protocols",
      inputSchema: {
        queryParams: {
          token: { type: "string", required: true, description: "Token contract address (e.g. USDC on Base)" },
        },
      },
    }),
    async (req, res) => {
      if (!ensureGiza(res)) return;
      const { token } = params(req);
      if (!token || !String(token).trim().startsWith("0x")) {
        res.status(400).json({ success: false, error: "Query parameter token (0x...) is required" });
        return;
      }
      try {
        const giza = await getGiza();
        const { protocols } = await giza.protocols(String(token).trim());
        await maybeSettle(res, req);
        res.json({ success: true, protocols });
      } catch (err) {
        res.status(502).json({
          success: false,
          error: err?.message || "Giza protocols request failed",
        });
      }
    }
  );

  router.get(
    "/agent",
    requirePayment({
      method: "GET",
      ...GIZA_PAYMENT_BASE,
      resource: "/giza/agent",
      inputSchema: {
        queryParams: {
          owner: { type: "string", required: true, description: "Owner EOA address (0x...)" },
        },
      },
    }),
    async (req, res) => {
      if (!ensureGiza(res)) return;
      const { owner } = params(req);
      if (!owner || !String(owner).trim().startsWith("0x")) {
        res.status(400).json({ success: false, error: "Query parameter owner (0x...) is required" });
        return;
      }
      try {
        const agent = await getAgentByOwner(String(owner).trim());
        if (!agent) {
          res.status(502).json({ success: false, error: "Failed to get or create Giza agent" });
          return;
        }
        await maybeSettle(res, req);
        res.json({ success: true, wallet: agent.wallet });
      } catch (err) {
        res.status(502).json({
          success: false,
          error: err?.message || "Giza agent request failed",
        });
      }
    }
  );

  router.get(
    "/portfolio",
    requirePayment({
      method: "GET",
      ...GIZA_PAYMENT_BASE,
      resource: "/giza/portfolio",
      inputSchema: {
        queryParams: {
          owner: { type: "string", required: true, description: "Owner EOA address (0x...)" },
        },
      },
    }),
    async (req, res) => {
      if (!ensureGiza(res)) return;
      const { owner } = params(req);
      if (!owner || !String(owner).trim().startsWith("0x")) {
        res.status(400).json({ success: false, error: "Query parameter owner (0x...) is required" });
        return;
      }
      try {
        const agent = await getAgentByOwner(String(owner).trim());
        if (!agent) {
          res.status(502).json({ success: false, error: "Failed to get Giza agent" });
          return;
        }
        const info = await agent.portfolio();
        await maybeSettle(res, req);
        res.json({ success: true, ...info });
      } catch (err) {
        res.status(502).json({
          success: false,
          error: err?.message || "Giza portfolio request failed",
        });
      }
    }
  );

  router.get(
    "/apr",
    requirePayment({
      method: "GET",
      ...GIZA_PAYMENT_BASE,
      resource: "/giza/apr",
      inputSchema: {
        queryParams: {
          owner: { type: "string", required: true, description: "Owner EOA address (0x...)" },
        },
      },
    }),
    async (req, res) => {
      if (!ensureGiza(res)) return;
      const { owner } = params(req);
      if (!owner || !String(owner).trim().startsWith("0x")) {
        res.status(400).json({ success: false, error: "Query parameter owner (0x...) is required" });
        return;
      }
      try {
        const agent = await getAgentByOwner(String(owner).trim());
        if (!agent) {
          res.status(502).json({ success: false, error: "Failed to get Giza agent" });
          return;
        }
        const data = await agent.apr();
        await maybeSettle(res, req);
        res.json({ success: true, ...data });
      } catch (err) {
        res.status(502).json({
          success: false,
          error: err?.message || "Giza APR request failed",
        });
      }
    }
  );

  router.get(
    "/performance",
    requirePayment({
      method: "GET",
      ...GIZA_PAYMENT_BASE,
      resource: "/giza/performance",
      inputSchema: {
        queryParams: {
          owner: { type: "string", required: true, description: "Owner EOA address (0x...)" },
        },
      },
    }),
    async (req, res) => {
      if (!ensureGiza(res)) return;
      const { owner } = params(req);
      if (!owner || !String(owner).trim().startsWith("0x")) {
        res.status(400).json({ success: false, error: "Query parameter owner (0x...) is required" });
        return;
      }
      try {
        const agent = await getAgentByOwner(String(owner).trim());
        if (!agent) {
          res.status(502).json({ success: false, error: "Failed to get Giza agent" });
          return;
        }
        const data = await agent.performance();
        await maybeSettle(res, req);
        res.json({ success: true, ...data });
      } catch (err) {
        res.status(502).json({
          success: false,
          error: err?.message || "Giza performance request failed",
        });
      }
    }
  );

  router.post(
    "/activate",
    requirePayment({
      method: "POST",
      ...GIZA_PAYMENT_BASE,
      resource: "/giza/activate",
      inputSchema: {
        bodyType: "json",
        bodyFields: {
          owner: { type: "string", required: true },
          token: { type: "string", required: true },
          protocols: { type: "string", required: true, description: "Array or JSON string of protocol ids" },
          txHash: { type: "string", required: true },
          constraints: { type: "string", required: false },
        },
      },
    }),
    async (req, res) => {
      if (!ensureGiza(res)) return;
      const { owner, token, protocols, txHash, constraints } = params(req);
      if (!owner || !token || !protocols || !txHash) {
        res.status(400).json({
          success: false,
          error: "Body must include owner, token, protocols (array), and txHash",
        });
        return;
      }
      let protocolList = Array.isArray(protocols) ? protocols : [].concat(protocols || []).filter(Boolean);
      if (protocolList.length === 1 && typeof protocolList[0] === "string" && protocolList[0].includes(",")) {
        protocolList = protocolList[0].split(",").map((p) => p.trim()).filter(Boolean);
      }
      if (protocolList.length === 0) {
        res.status(400).json({ success: false, error: "protocols must be a non-empty array" });
        return;
      }
      try {
        const agent = await getAgentByOwner(String(owner).trim());
        if (!agent) {
          res.status(502).json({ success: false, error: "Failed to get Giza agent" });
          return;
        }
        await agent.activate({
          owner: String(owner).trim(),
          token: String(token).trim(),
          protocols: protocolList.map((p) => String(p)),
          txHash: String(txHash).trim(),
          constraints: Array.isArray(constraints) ? constraints : undefined,
        });
        await maybeSettle(res, req);
        res.json({ success: true, message: "Agent activated" });
      } catch (err) {
        res.status(502).json({
          success: false,
          error: err?.message || "Giza activate failed",
        });
      }
    }
  );

  router.post(
    "/withdraw",
    requirePayment({
      method: "POST",
      ...GIZA_PAYMENT_BASE,
      resource: "/giza/withdraw",
      inputSchema: {
        bodyType: "json",
        bodyFields: {
          owner: { type: "string", required: true },
          amount: { type: "string", required: false, description: "Optional; omit for full withdrawal" },
        },
      },
    }),
    async (req, res) => {
      if (!ensureGiza(res)) return;
      const { owner, amount } = params(req);
      if (!owner || !String(owner).trim().startsWith("0x")) {
        res.status(400).json({ success: false, error: "Body must include owner (0x...)" });
        return;
      }
      try {
        const agent = await getAgentByOwner(String(owner).trim());
        if (!agent) {
          res.status(502).json({ success: false, error: "Failed to get Giza agent" });
          return;
        }
        await agent.withdraw(amount != null && String(amount).trim() !== "" ? String(amount).trim() : undefined);
        await maybeSettle(res, req);
        res.json({
          success: true,
          message: amount ? "Partial withdrawal initiated" : "Full withdrawal (deactivation) initiated",
        });
      } catch (err) {
        res.status(502).json({
          success: false,
          error: err?.message || "Giza withdraw failed",
        });
      }
    }
  );

  router.post(
    "/top-up",
    requirePayment({
      method: "POST",
      ...GIZA_PAYMENT_BASE,
      resource: "/giza/top-up",
      inputSchema: {
        bodyType: "json",
        bodyFields: {
          owner: { type: "string", required: true },
          txHash: { type: "string", required: true },
        },
      },
    }),
    async (req, res) => {
      if (!ensureGiza(res)) return;
      const { owner, txHash } = params(req);
      if (!owner || !txHash) {
        res.status(400).json({ success: false, error: "Body must include owner and txHash" });
        return;
      }
      try {
        const agent = await getAgentByOwner(String(owner).trim());
        if (!agent) {
          res.status(502).json({ success: false, error: "Failed to get Giza agent" });
          return;
        }
        await agent.topUp(String(txHash).trim());
        await maybeSettle(res, req);
        res.json({ success: true, message: "Top-up recorded" });
      } catch (err) {
        res.status(502).json({
          success: false,
          error: err?.message || "Giza top-up failed",
        });
      }
    }
  );

  router.post(
    "/update-protocols",
    requirePayment({
      method: "POST",
      ...GIZA_PAYMENT_BASE,
      resource: "/giza/update-protocols",
      inputSchema: {
        bodyType: "json",
        bodyFields: {
          owner: { type: "string", required: true },
          protocols: { type: "string", required: true, description: "Array or comma-separated protocol ids" },
        },
      },
    }),
    async (req, res) => {
      if (!ensureGiza(res)) return;
      const { owner, protocols } = params(req);
      if (!owner) {
        res.status(400).json({ success: false, error: "Body must include owner" });
        return;
      }
      let protocolList = Array.isArray(protocols)
        ? protocols
        : typeof protocols === "string"
          ? protocols.split(",").map((p) => p.trim()).filter(Boolean)
          : [].concat(protocols || []).filter(Boolean);
      if (protocolList.length === 0) {
        res.status(400).json({
          success: false,
          error: "Body must include protocols (array or comma-separated string)",
        });
        return;
      }
      try {
        const agent = await getAgentByOwner(String(owner).trim());
        if (!agent) {
          res.status(502).json({ success: false, error: "Failed to get Giza agent" });
          return;
        }
        await agent.updateProtocols(protocolList.map((p) => String(p)));
        await maybeSettle(res, req);
        res.json({ success: true, message: "Protocols updated" });
      } catch (err) {
        res.status(502).json({
          success: false,
          error: err?.message || "Giza update-protocols failed",
        });
      }
    }
  );

  router.post(
    "/run",
    requirePayment({
      method: "POST",
      ...GIZA_PAYMENT_BASE,
      resource: "/giza/run",
      inputSchema: {
        bodyType: "json",
        bodyFields: {
          owner: { type: "string", required: true },
        },
      },
    }),
    async (req, res) => {
      if (!ensureGiza(res)) return;
      const { owner } = params(req);
      if (!owner || !String(owner).trim().startsWith("0x")) {
        res.status(400).json({ success: false, error: "Body must include owner (0x...)" });
        return;
      }
      try {
        const agent = await getAgentByOwner(String(owner).trim());
        if (!agent) {
          res.status(502).json({ success: false, error: "Failed to get Giza agent" });
          return;
        }
        await agent.run();
        await maybeSettle(res, req);
        res.json({ success: true, message: "Optimization run triggered" });
      } catch (err) {
        res.status(502).json({
          success: false,
          error: err?.message || "Giza run failed",
        });
      }
    }
  );

  return router;
}
