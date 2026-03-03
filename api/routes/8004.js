/**
 * 8004 Trustless Agent Registry (Solana) – read-only API (x402) + write (register-agent, x402).
 * Liveness, integrity, discovery, introspection. Uses libs/agentRegistry8004.js.
 * POST /register-agent creates a new agent and optionally attaches to a collection (x402 payment required).
 */
import express from "express";
import { getV2Payment } from "../utils/getV2Payment.js";
import { X402_API_PRICE_8004_USD, X402_API_PRICE_8004_REGISTER_AGENT_USD } from "../config/x402Pricing.js";
import {
  getLiveness,
  getIntegrity,
  getIntegrityDeep,
  getIntegrityFull,
  searchAgents,
  getLeaderboard,
  getGlobalStats,
  getAgentByWallet,
  loadAgent,
  agentExists,
  getAgentOwner,
  getMetadata,
  getAgentsByOwner,
  getChainId,
  getProgramIds,
  getBaseCollection,
} from "../libs/agentRegistry8004.js";
import { registerAgentAndAttachToCollection } from "../libs/register8004Agent.js";

const { requirePayment, settlePaymentAndSetResponse } = await getV2Payment();

const PAYMENT_OPTIONS_BASE = {
  price: X402_API_PRICE_8004_USD,
  description:
    "8004 Trustless Agent Registry: liveness, integrity, discovery, introspection (Solana)",
  discoverable: true,
  resource: "/8004",
  outputSchema: {
    type: "object",
    description: "Response varies by endpoint (liveness report, integrity, agents, stats, etc.)",
  },
};

/** Merge query and body so GET and POST can pass params (POST body overrides for overlapping keys). */
function params(req) {
  const body = req.body && typeof req.body === "object" ? req.body : {};
  return { ...req.query, ...body };
}

function withPayment(handler, method = "GET") {
  const paymentOptions = { ...PAYMENT_OPTIONS_BASE, method };
  return [
    requirePayment(paymentOptions),
    async (req, res, next) => {
      try {
        const data = await handler(req, res);
        if (res.headersSent) return;
        await settlePaymentAndSetResponse(res, req);
        res.json(data);
      } catch (e) {
        if (!res.headersSent) {
          const status = e.status ?? 400;
          res.status(status).json({ error: e.message });
        } else next(e);
      }
    },
  ];
}

function devOnly(handler) {
  return async (req, res) => {
    if (process.env.NODE_ENV === "production") {
      return res.status(404).json({ error: "Not found" });
    }
    try {
      const data = await handler(req, res);
      if (res.headersSent) return;
      res.json(data);
    } catch (e) {
      if (!res.headersSent) {
        const status = e.status ?? 400;
        res.status(status).json({ error: e.message });
      }
    }
  };
}

export async function create8004Router() {
  const router = express.Router();

  // --- Liveness & integrity ---
  const livenessHandler = async (req) => {
    const q = params(req);
    return getLiveness(req.params.asset, {
      timeoutMs: q.timeoutMs ? Number(q.timeoutMs) : undefined,
    });
  };
  router.get("/agent/:asset/liveness", ...withPayment(livenessHandler, "GET"));
  router.post("/agent/:asset/liveness", ...withPayment(livenessHandler, "POST"));
  router.get("/dev/agent/:asset/liveness", devOnly(async (req) => getLiveness(req.params.asset, {})));
  router.post("/dev/agent/:asset/liveness", devOnly(async (req) => getLiveness(req.params.asset, {})));

  const integrityHandler = async (req) => getIntegrity(req.params.asset);
  router.get("/agent/:asset/integrity", ...withPayment(integrityHandler, "GET"));
  router.post("/agent/:asset/integrity", ...withPayment(integrityHandler, "POST"));
  router.get("/dev/agent/:asset/integrity", devOnly(integrityHandler));
  router.post("/dev/agent/:asset/integrity", devOnly(integrityHandler));

  const integrityDeepHandler = async (req) => {
    const q = params(req);
    const spotChecks = q.spotChecks ? Number(q.spotChecks) : 5;
    return getIntegrityDeep(req.params.asset, { spotChecks });
  };
  router.get("/agent/:asset/integrity/deep", ...withPayment(integrityDeepHandler, "GET"));
  router.post("/agent/:asset/integrity/deep", ...withPayment(integrityDeepHandler, "POST"));
  router.get("/dev/agent/:asset/integrity/deep", devOnly(integrityDeepHandler));
  router.post("/dev/agent/:asset/integrity/deep", devOnly(integrityDeepHandler));

  const integrityFullHandler = async (req) => getIntegrityFull(req.params.asset);
  router.get("/agent/:asset/integrity/full", ...withPayment(integrityFullHandler, "GET"));
  router.post("/agent/:asset/integrity/full", ...withPayment(integrityFullHandler, "POST"));
  router.get("/dev/agent/:asset/integrity/full", devOnly(integrityFullHandler));
  router.post("/dev/agent/:asset/integrity/full", devOnly(integrityFullHandler));

  // --- Discovery & search ---
  const searchHandler = async (req) => {
    const q = params(req);
    return searchAgents({
      owner: q.owner || undefined,
      creator: q.creator || undefined,
      collection: q.collection || undefined,
      limit: q.limit ? Number(q.limit) : 20,
      offset: q.offset ? Number(q.offset) : 0,
    });
  };
  router.get("/agents/search", ...withPayment(searchHandler, "GET"));
  router.post("/agents/search", ...withPayment(searchHandler, "POST"));
  router.get("/dev/agents/search", devOnly(searchHandler));
  router.post("/dev/agents/search", devOnly(searchHandler));

  const leaderboardHandler = async (req) => {
    const q = params(req);
    return getLeaderboard({
      minTier: q.minTier ? Number(q.minTier) : undefined,
      limit: q.limit ? Number(q.limit) : 50,
      collection: q.collection || undefined,
    });
  };
  router.get("/leaderboard", ...withPayment(leaderboardHandler, "GET"));
  router.post("/leaderboard", ...withPayment(leaderboardHandler, "POST"));
  router.get("/dev/leaderboard", devOnly(leaderboardHandler));
  router.post("/dev/leaderboard", devOnly(leaderboardHandler));

  const statsHandler = async () => getGlobalStats();
  router.get("/stats", ...withPayment(statsHandler, "GET"));
  router.post("/stats", ...withPayment(statsHandler, "POST"));
  router.get("/dev/stats", devOnly(statsHandler));
  router.post("/dev/stats", devOnly(statsHandler));

  const agentByWalletHandler = async (req) => getAgentByWallet(req.params.wallet);
  router.get("/agent-by-wallet/:wallet", ...withPayment(agentByWalletHandler, "GET"));
  router.post("/agent-by-wallet/:wallet", ...withPayment(agentByWalletHandler, "POST"));
  router.get("/dev/agent-by-wallet/:wallet", devOnly(agentByWalletHandler));
  router.post("/dev/agent-by-wallet/:wallet", devOnly(agentByWalletHandler));

  // --- Read-only / introspection ---
  const loadAgentHandler = async (req) => {
    const agent = await loadAgent(req.params.asset);
    if (agent == null) {
      const err = new Error("Agent not found");
      err.status = 404;
      throw err;
    }
    return agent;
  };
  router.get("/agent/:asset", ...withPayment(loadAgentHandler, "GET"));
  router.post("/agent/:asset", ...withPayment(loadAgentHandler, "POST"));
  router.get("/dev/agent/:asset", devOnly(loadAgentHandler));
  router.post("/dev/agent/:asset", devOnly(loadAgentHandler));

  const existsHandler = async (req) => ({ exists: await agentExists(req.params.asset) });
  router.get("/agent/:asset/exists", ...withPayment(existsHandler, "GET"));
  router.post("/agent/:asset/exists", ...withPayment(existsHandler, "POST"));
  router.get("/dev/agent/:asset/exists", devOnly(existsHandler));
  router.post("/dev/agent/:asset/exists", devOnly(existsHandler));

  const ownerHandler = async (req) => {
    const owner = await getAgentOwner(req.params.asset);
    if (owner == null) {
      const err = new Error("Agent not found");
      err.status = 404;
      throw err;
    }
    return { owner };
  };
  router.get("/agent/:asset/owner", ...withPayment(ownerHandler, "GET"));
  router.post("/agent/:asset/owner", ...withPayment(ownerHandler, "POST"));
  router.get("/dev/agent/:asset/owner", devOnly(ownerHandler));
  router.post("/dev/agent/:asset/owner", devOnly(ownerHandler));

  const metadataHandler = async (req) => {
    const value = await getMetadata(req.params.asset, req.params.key);
    if (value == null) {
      const err = new Error("Metadata key not found");
      err.status = 404;
      throw err;
    }
    return { key: req.params.key, value };
  };
  router.get("/agent/:asset/metadata/:key", ...withPayment(metadataHandler, "GET"));
  router.post("/agent/:asset/metadata/:key", ...withPayment(metadataHandler, "POST"));
  router.get("/dev/agent/:asset/metadata/:key", devOnly(metadataHandler));
  router.post("/dev/agent/:asset/metadata/:key", devOnly(metadataHandler));

  const byOwnerHandler = async (req) => getAgentsByOwner(req.params.owner);
  router.get("/agents/by-owner/:owner", ...withPayment(byOwnerHandler, "GET"));
  router.post("/agents/by-owner/:owner", ...withPayment(byOwnerHandler, "POST"));
  router.get("/dev/agents/by-owner/:owner", devOnly(byOwnerHandler));
  router.post("/dev/agents/by-owner/:owner", devOnly(byOwnerHandler));

  // --- SDK introspection ---
  const chainIdHandler = async () => ({ chainId: await getChainId() });
  router.get("/chain-id", ...withPayment(chainIdHandler, "GET"));
  router.post("/chain-id", ...withPayment(chainIdHandler, "POST"));
  router.get("/dev/chain-id", devOnly(chainIdHandler));
  router.post("/dev/chain-id", devOnly(chainIdHandler));

  const programIdsHandler = async () => getProgramIds();
  router.get("/program-ids", ...withPayment(programIdsHandler, "GET"));
  router.post("/program-ids", ...withPayment(programIdsHandler, "POST"));
  router.get("/dev/program-ids", devOnly(programIdsHandler));
  router.post("/dev/program-ids", devOnly(programIdsHandler));

  const baseCollectionHandler = async () => ({ baseCollection: await getBaseCollection() });
  router.get("/base-collection", ...withPayment(baseCollectionHandler, "GET"));
  router.post("/base-collection", ...withPayment(baseCollectionHandler, "POST"));
  router.get("/dev/base-collection", devOnly(baseCollectionHandler));
  router.post("/dev/base-collection", devOnly(baseCollectionHandler));

  // --- Write: register new agent and optionally attach to collection (x402 payment required) ---
  const registerAgentHandler = async (req) => {
    const body = req.body && typeof req.body === "object" ? req.body : {};
    return registerAgentAndAttachToCollection({
      name: body.name,
      description: body.description,
      image: body.image,
      services: body.services,
      skills: body.skills,
      domains: body.domains,
      x402Support: body.x402Support,
      collectionPointer: body.collectionPointer,
    });
  };
  const registerAgentPaymentOptions = {
    price: X402_API_PRICE_8004_REGISTER_AGENT_USD,
    description: "8004 register-agent: create a new agent and optionally attach to a collection (Solana)",
    discoverable: true,
    resource: "/8004/register-agent",
    method: "POST",
    outputSchema: {
      type: "object",
      description: "Created agent asset, register tx signature, tokenUri, and optional setCollectionSignature",
      properties: {
        asset: { type: "string", description: "Agent NFT address (base58)" },
        registerSignature: { type: "string", description: "Registration transaction signature" },
        tokenUri: { type: "string", description: "Agent metadata URI (ipfs://...)" },
        setCollectionSignature: { type: "string", description: "Set collection pointer tx (if collectionPointer was provided)" },
      },
    },
  };
  router.post(
    "/register-agent",
    requirePayment(registerAgentPaymentOptions),
    async (req, res, next) => {
      try {
        const data = await registerAgentHandler(req);
        if (res.headersSent) return;
        await settlePaymentAndSetResponse(res, req);
        res.status(201).json(data);
      } catch (e) {
        if (!res.headersSent) {
          res.status(e.status ?? 400).json({ error: e.message ?? String(e) });
        } else next(e);
      }
    }
  );
  router.post("/dev/register-agent", devOnly(registerAgentHandler));

  return router;
}
