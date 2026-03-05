/**
 * 8004scan.io Public API proxy – x402 protected.
 * Exposes 8004scan.io endpoints (agents, stats, search, feedbacks, chains) behind x402 payment.
 * Uses libs/8004scanClient.js with EIGHTYFOUR_SCAN_API_KEY from env.
 */
import express from "express";
import { getV2Payment } from "../../../utils/getV2Payment.js";
import { X402_API_PRICE_8004SCAN_USD } from "../../../config/x402Pricing.js";
import {
  listAgents,
  getAgent,
  searchAgents,
  getAgentsByOwner,
  getStats,
  listFeedbacks,
  listChains,
} from "../../../libs/8004scanClient.js";

const { requirePayment, settlePaymentWithFallback, encodePaymentResponseHeader, runBuybackForRequest } =
  await getV2Payment();

const paymentOptions = {
  price: X402_API_PRICE_8004SCAN_USD,
  description: "8004scan.io Public API – ERC-8004 agent discovery and stats",
  discoverable: true,
  resource: "/8004scan",
  outputSchema: {
    success: { type: "boolean" },
    data: { type: "object", description: "8004scan API response data" },
    meta: { type: "object", description: "Optional meta (pagination, etc.)" },
  },
};

function params(req) {
  const q = req.query || {};
  const b = req.body && typeof req.body === "object" ? req.body : {};
  return { ...q, ...b };
}

export async function create8004scanRouter() {
  const router = express.Router();

  const withPayment = (handler) => [
    requirePayment({ ...paymentOptions, method: "GET" }),
    async (req, res) => {
      const { payload, accepted } = req.x402Payment;
      const settle = await settlePaymentWithFallback(payload, accepted);
      res.setHeader("Payment-Response", encodePaymentResponseHeader(settle?.success ? settle : { success: true }));
      runBuybackForRequest(req);
      try {
        const data = await handler(req);
        res.status(200).json(data);
      } catch (e) {
        const status = e.status ?? 500;
        res.status(status).json({
          success: false,
          error: e?.message ?? String(e),
          ...(e.body && typeof e.body === "object" ? { details: e.body } : {}),
        });
      }
    },
  ];

  // GET /stats – platform statistics
  router.get("/stats", ...withPayment(async () => getStats()));

  // GET /chains – supported chains
  router.get("/chains", ...withPayment(async () => listChains()));

  // GET /agents – list agents (paginated)
  router.get("/agents", ...withPayment(async (req) => {
    const p = params(req);
    return listAgents({
      page: p.page != null ? Number(p.page) : undefined,
      limit: p.limit != null ? Number(p.limit) : undefined,
      chainId: p.chainId != null ? Number(p.chainId) : undefined,
      ownerAddress: p.ownerAddress || undefined,
      search: p.search || undefined,
      protocol: p.protocol || undefined,
      sortBy: p.sortBy || undefined,
      sortOrder: p.sortOrder || undefined,
      isTestnet: p.isTestnet === "true" || p.isTestnet === true ? true : p.isTestnet === "false" || p.isTestnet === false ? false : undefined,
    });
  }));

  // GET /agents/search – semantic search (q required)
  router.get("/agents/search", ...withPayment(async (req) => {
    const p = params(req);
    const q = p.q ?? p.query;
    if (!q) throw Object.assign(new Error("Query parameter q is required"), { status: 400 });
    return searchAgents({
      q: String(q).trim(),
      limit: p.limit != null ? Number(p.limit) : undefined,
      chainId: p.chainId != null ? Number(p.chainId) : undefined,
      semanticWeight: p.semanticWeight != null ? Number(p.semanticWeight) : undefined,
    });
  }));

  // GET /agents/:chainId/:tokenId – get agent by ID
  router.get("/agents/:chainId/:tokenId", ...withPayment(async (req) => {
    const chainId = Number(req.params.chainId);
    const tokenId = Number(req.params.tokenId);
    if (Number.isNaN(chainId) || Number.isNaN(tokenId)) {
      throw Object.assign(new Error("chainId and tokenId must be numbers"), { status: 400 });
    }
    return getAgent(chainId, tokenId);
  }));

  // GET /agent – get agent by ID (query params for agent website / tools call)
  router.get("/agent", ...withPayment(async (req) => {
    const p = params(req);
    const chainId = p.chainId != null ? Number(p.chainId) : NaN;
    const tokenId = p.tokenId != null ? Number(p.tokenId) : NaN;
    if (Number.isNaN(chainId) || Number.isNaN(tokenId)) {
      throw Object.assign(new Error("Query parameters chainId and tokenId are required"), { status: 400 });
    }
    return getAgent(chainId, tokenId);
  }));

  // GET /accounts/:address/agents – agents by owner address
  router.get("/accounts/:address/agents", ...withPayment(async (req) => {
    const address = req.params.address?.trim();
    if (!address) throw Object.assign(new Error("address is required"), { status: 400 });
    const p = params(req);
    return getAgentsByOwner(address, {
      page: p.page != null ? Number(p.page) : undefined,
      limit: p.limit != null ? Number(p.limit) : undefined,
      sortBy: p.sortBy || undefined,
      sortOrder: p.sortOrder || undefined,
    });
  }));

  // GET /account-agents – agents by owner (query param for agent website / tools call)
  router.get("/account-agents", ...withPayment(async (req) => {
    const p = params(req);
    const address = (p.address || p.ownerAddress || "").trim();
    if (!address) throw Object.assign(new Error("Query parameter address is required"), { status: 400 });
    return getAgentsByOwner(address, {
      page: p.page != null ? Number(p.page) : undefined,
      limit: p.limit != null ? Number(p.limit) : undefined,
      sortBy: p.sortBy || undefined,
      sortOrder: p.sortOrder || undefined,
    });
  }));

  // GET /feedbacks – list feedbacks
  router.get("/feedbacks", ...withPayment(async (req) => {
    const p = params(req);
    return listFeedbacks({
      page: p.page != null ? Number(p.page) : undefined,
      limit: p.limit != null ? Number(p.limit) : undefined,
      chainId: p.chainId != null ? Number(p.chainId) : undefined,
      tokenId: p.tokenId != null ? Number(p.tokenId) : undefined,
      minScore: p.minScore != null ? Number(p.minScore) : undefined,
      maxScore: p.maxScore != null ? Number(p.maxScore) : undefined,
    });
  }));

  return router;
}
