/**
 * 8004 Trustless Agent Registry (Solana) – API key protected (no x402).
 * Liveness, integrity, discovery, introspection. Uses libs/agentRegistry8004.js.
 * All /8004 routes require X-API-Key (or Authorization: Bearer) when API_KEY/API_KEYS is set in env.
 */
import express from "express";
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
  getAgentRegistrationMetadata,
  getRegistrationMetadataFromUri,
} from "../libs/agentRegistry8004.js";
import { registerAgentAndAttachToCollection } from "../libs/register8004Agent.js";
import { getSolanaAgentKeypair, getAgentBalances } from "../libs/agentWallet.js";
import User8004Agent, { MAX_AGENTS_PER_USER } from "../models/agent/User8004Agent.js";
import pLimit from "p-limit";

/**
 * Perform 8004 agent registration (same logic as POST /8004/register-agent).
 * Used by the marketplace route so it can call in-process and avoid BASE_URL/self-fetch issues.
 * @param {object} body - Request body (name, description, image, services, skills, domains, anonymousId, etc.)
 * @returns {Promise<{ asset: string; registerSignature?: string; tokenUri: string; ... }>}
 * @throws Error with .status (400, etc.)
 */
const MIN_SOL_FOR_REGISTRATION = 0.01;

export async function performRegisterAgent(body) {
  const anonymousId = body?.anonymousId && String(body.anonymousId).trim() ? body.anonymousId.trim() : null;
  if (!anonymousId) {
    const err = new Error("anonymousId is required to create an agent (max 3 per user).");
    err.status = 400;
    throw err;
  }
  const signerKeypair = await getSolanaAgentKeypair(anonymousId);
  if (!signerKeypair) {
    const err = new Error(
      "Solana agent wallet required. Create or connect your agent wallet on Solana first (e.g. in chat)."
    );
    err.status = 400;
    throw err;
  }
  const balances = await getAgentBalances(anonymousId);
  const solBalance = balances?.solBalance ?? 0;
  if (solBalance < MIN_SOL_FOR_REGISTRATION) {
    const err = new Error(
      `Top up your agent wallet first. Registration requires at least ${MIN_SOL_FOR_REGISTRATION} SOL; your balance is ${solBalance.toFixed(4)} SOL. Send SOL to: ${balances?.agentAddress ?? "your agent wallet"}.`
    );
    err.status = 400;
    err.code = "INSUFFICIENT_SOL";
    throw err;
  }
  const count = await User8004Agent.countDocuments({ anonymousId });
  if (count >= MAX_AGENTS_PER_USER) {
    const err = new Error(`Maximum ${MAX_AGENTS_PER_USER} agents per user. You have ${count}.`);
    err.status = 400;
    throw err;
  }
  const result = await registerAgentAndAttachToCollection({
    name: body.name,
    description: body.description,
    image: body.image,
    services: body.services,
    skills: body.skills,
    domains: body.domains,
    x402Support: body.x402Support,
    collectionPointer: body.collectionPointer,
    feePayer: body.feePayer,
    agentAssetPubkey: body.agentAssetPubkey,
    signerKeypair,
  });
  if (result && result.asset) {
    const name = (body.name && String(body.name).trim()) || "8004 Agent";
    const description = (body.description && String(body.description).trim()) || "";
    const image =
      (body.image && String(body.image).trim()) ||
      process.env.SYRA_AGENT_IMAGE_URI ||
      "https://syraa.fun/images/logo.jpg";
    await User8004Agent.create({
      anonymousId,
      asset: result.asset,
      name,
      description,
      image,
    });
  }
  return result;
}

/** Concurrency limit when enriching agent list with registration metadata (name). */
const REGISTRATION_METADATA_LIMIT = pLimit(6);

/** Merge query and body so GET and POST can pass params (POST body overrides for overlapping keys). */
function params(req) {
  const body = req.body && typeof req.body === "object" ? req.body : {};
  return { ...req.query, ...body };
}

/** Run handler and send JSON; 8004 uses API key auth at app level, no x402. */
function withHandler(handler) {
  return async (req, res, next) => {
    try {
      const data = await handler(req, res);
      if (res.headersSent) return;
      res.json(data);
    } catch (e) {
      if (!res.headersSent) {
        const status = e.status ?? 400;
        res.status(status).json({ error: e.message });
      } else next(e);
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
  router.get("/agent/:asset/liveness", withHandler(livenessHandler));
  router.post("/agent/:asset/liveness", withHandler(livenessHandler));

  const integrityHandler = async (req) => getIntegrity(req.params.asset);
  router.get("/agent/:asset/integrity", withHandler(integrityHandler));
  router.post("/agent/:asset/integrity", withHandler(integrityHandler));

  const integrityDeepHandler = async (req) => {
    const q = params(req);
    const spotChecks = q.spotChecks ? Number(q.spotChecks) : 5;
    return getIntegrityDeep(req.params.asset, { spotChecks });
  };
  router.get("/agent/:asset/integrity/deep", withHandler(integrityDeepHandler));
  router.post("/agent/:asset/integrity/deep", withHandler(integrityDeepHandler));

  const integrityFullHandler = async (req) => getIntegrityFull(req.params.asset);
  router.get("/agent/:asset/integrity/full", withHandler(integrityFullHandler));
  router.post("/agent/:asset/integrity/full", withHandler(integrityFullHandler));

  // --- Discovery & search ---
  /** Enrich agent list with name from registration metadata. Prefer indexer agent_uri + IPFS (no RPC) so names show even when RPC returns 403; fall back to getAgentRegistrationMetadata (RPC) when agent_uri is missing. See 8004-solana skill §11 Search. */
  async function enrichAgentsWithRegistrationNames(agents) {
    if (!Array.isArray(agents) || agents.length === 0) return agents;
    const results = await Promise.all(
      agents.map((a) => {
        const asset = typeof a?.asset === "string" ? a.asset.trim() : "";
        const agentUri = typeof a?.agent_uri === "string" ? a.agent_uri.trim() : null;
        if (!asset) return { ...a };
        return REGISTRATION_METADATA_LIMIT(async () => {
          try {
            const meta = agentUri
              ? await getRegistrationMetadataFromUri(agentUri)
              : await getAgentRegistrationMetadata(asset);
            const name =
              meta?.name?.trim() ||
              (typeof a?.nft_name === "string" ? a.nft_name.trim() : null) ||
              (typeof a?.name === "string" ? a.name.trim() : null) ||
              null;
            const description = meta?.description?.trim() || null;
            const image = meta?.image?.trim() || null;
            if (name || description || image) {
              return { ...a, nft_name: name || a.nft_name, description: description ?? a.description, image: image ?? a.image };
            }
            return { ...a };
          } catch {
            return { ...a };
          }
        });
      })
    );
    return results;
  }

  const searchHandler = async (req) => {
    const q = params(req);
    const collectionParam = q.collection && String(q.collection).trim();
    const isPointer = collectionParam && collectionParam.startsWith("c1:");
    const searchParams = {
      owner: q.owner || undefined,
      creator: q.creator || undefined,
      limit: q.limit ? Number(q.limit) : 20,
      offset: q.offset ? Number(q.offset) : 0,
    };
    if (collectionParam) {
      if (isPointer) searchParams.collectionPointer = collectionParam;
      else searchParams.collection = collectionParam;
    }
    const list = await searchAgents(searchParams);
    const raw = Array.isArray(list) ? list : [];
    const agents = await enrichAgentsWithRegistrationNames(raw);
    return { agents, total: agents.length };
  };
  // Agents search is free so the Syra marketplace can load "All Agents" without 402
  router.get("/agents/search", async (req, res, next) => {
    try {
      const data = await searchHandler(req);
      if (!res.headersSent) res.json(data);
    } catch (e) {
      if (!res.headersSent) res.status(e.status ?? 400).json({ error: e.message });
      else next(e);
    }
  });
  router.post("/agents/search", async (req, res, next) => {
    try {
      const data = await searchHandler(req);
      if (!res.headersSent) res.json(data);
    } catch (e) {
      if (!res.headersSent) res.status(e.status ?? 400).json({ error: e.message });
      else next(e);
    }
  });
  const leaderboardHandler = async (req) => {
    const q = params(req);
    return getLeaderboard({
      minTier: q.minTier ? Number(q.minTier) : undefined,
      limit: q.limit ? Number(q.limit) : 50,
      collection: q.collection || undefined,
    });
  };
  router.get("/leaderboard", withHandler(leaderboardHandler));
  router.post("/leaderboard", withHandler(leaderboardHandler));

  const statsHandler = async () => getGlobalStats();
  router.get("/stats", withHandler(statsHandler));
  router.post("/stats", withHandler(statsHandler));

  const agentByWalletHandler = async (req) => getAgentByWallet(req.params.wallet);
  router.get("/agent-by-wallet/:wallet", withHandler(agentByWalletHandler));
  router.post("/agent-by-wallet/:wallet", withHandler(agentByWalletHandler));

  // --- Read-only / introspection ---
  const loadAgentHandler = async (req) => {
    try {
      const agent = await loadAgent(req.params.asset);
      if (agent == null) {
        const err = new Error("Agent not found");
        err.status = 404;
        throw err;
      }
      return agent;
    } catch (e) {
      // When RPC blocks getAccountInfo (e.g. 403), return partial data so the UI does not show an error toast
      const msg = e?.message || String(e);
      const isRpcRestricted =
        msg.includes("403") ||
        /not allowed to access blockchain|get info about account|getAccountInfo/i.test(msg);
      if (isRpcRestricted) {
        return {
          asset: req.params.asset,
          owner: null,
          agentWallet: null,
          agent_uri: null,
          col_locked: null,
          parent_locked: null,
          _rpcUnavailable: true,
        };
      }
      throw e;
    }
  };
  /** Resolve 8004market token ID for an asset (so frontend can build .../agent/solana/mainnet-beta/{tokenId}). */
  const eight004MarketUrlHandler = async (req) => {
    const asset = req.params.asset && String(req.params.asset).trim();
    if (!asset) {
      const err = new Error("asset is required");
      err.status = 400;
      throw err;
    }
    const collectionPointer =
      process.env.SYRA_COLLECTION_POINTER?.trim() ||
      "c1:bafkreid3g6kogo55n5iob7pi36xppcycynn7m64pds7wshnankxjo52mfm";
    const list = await searchAgents({ collectionPointer, limit: 500 });
    const agents = Array.isArray(list) ? list : [];
    const found = agents.find((a) => (a?.asset && String(a.asset).trim()) === asset);
    if (!found || !found.agent_id) {
      const err = new Error("Agent not found in 8004 index or no token ID");
      err.status = 404;
      throw err;
    }
    const tokenId = String(found.agent_id).trim();
    const url = `https://8004market.io/agent/solana/mainnet-beta/${encodeURIComponent(tokenId)}`;
    return { tokenId, url };
  };
  router.get("/agent/:asset/8004market-url", withHandler(eight004MarketUrlHandler));
  router.post("/agent/:asset/8004market-url", withHandler(eight004MarketUrlHandler));

  router.get("/agent/:asset", withHandler(loadAgentHandler));
  router.post("/agent/:asset", withHandler(loadAgentHandler));

  const existsHandler = async (req) => ({ exists: await agentExists(req.params.asset) });
  router.get("/agent/:asset/exists", withHandler(existsHandler));
  router.post("/agent/:asset/exists", withHandler(existsHandler));

  const ownerHandler = async (req) => {
    const owner = await getAgentOwner(req.params.asset);
    if (owner == null) {
      const err = new Error("Agent not found");
      err.status = 404;
      throw err;
    }
    return { owner };
  };
  router.get("/agent/:asset/owner", withHandler(ownerHandler));
  router.post("/agent/:asset/owner", withHandler(ownerHandler));

  const metadataHandler = async (req) => {
    const value = await getMetadata(req.params.asset, req.params.key);
    if (value == null) {
      const err = new Error("Metadata key not found");
      err.status = 404;
      throw err;
    }
    return { key: req.params.key, value };
  };
  router.get("/agent/:asset/metadata/:key", withHandler(metadataHandler));
  router.post("/agent/:asset/metadata/:key", withHandler(metadataHandler));

  /** Always returns { name, description, image } (nulls when unavailable). Same shape in local and production so success/failure behavior is identical. */
  const registrationMetadataHandler = async (req) => {
    const meta = await getAgentRegistrationMetadata(req.params.asset);
    return meta ?? { name: null, description: null, image: null };
  };
  // Registration metadata (name, description, image) is free so marketplace agent cards can display without 402
  router.get("/agent/:asset/registration-metadata", async (req, res, next) => {
    try {
      const data = await registrationMetadataHandler(req);
      if (!res.headersSent) res.json(data);
    } catch (e) {
      if (!res.headersSent) res.status(e.status ?? 404).json({ error: e.message });
      else next(e);
    }
  });

  const byOwnerHandler = async (req) => getAgentsByOwner(req.params.owner);
  router.get("/agents/by-owner/:owner", withHandler(byOwnerHandler));
  router.post("/agents/by-owner/:owner", withHandler(byOwnerHandler));

  // --- SDK introspection ---
  const chainIdHandler = async () => ({ chainId: await getChainId() });
  router.get("/chain-id", withHandler(chainIdHandler));
  router.post("/chain-id", withHandler(chainIdHandler));

  const programIdsHandler = async () => getProgramIds();
  router.get("/program-ids", withHandler(programIdsHandler));
  router.post("/program-ids", withHandler(programIdsHandler));

  const baseCollectionHandler = async () => ({ baseCollection: await getBaseCollection() });
  router.get("/base-collection", withHandler(baseCollectionHandler));
  router.post("/base-collection", withHandler(baseCollectionHandler));

  // Syra collection pointer (for marketplace UI: list agents in same collection as script; create uses backend env).
  const syraCollectionHandler = async () => ({
    syraCollectionPointer: process.env.SYRA_COLLECTION_POINTER?.trim() || null,
  });
  // Production: return pointer so website uses same as script (no payment; public collection id).
  router.get("/syra-collection", async (req, res, next) => {
    try {
      const data = await syraCollectionHandler();
      res.json(data);
    } catch (e) {
      if (!res.headersSent) res.status(e.status ?? 400).json({ error: e.message });
      else       next(e);
    }
  });
  router.post("/syra-collection", async (req, res, next) => {
    try {
      const data = await syraCollectionHandler();
      res.json(data);
    } catch (e) {
      if (!res.headersSent) res.status(e.status ?? 400).json({ error: e.message });
      else next(e);
    }
  });

  // --- My agents (from MongoDB; used by "Your Agents" tab) ---
  const myAgentsHandler = async (req) => {
    const anonymousId = (req.query?.anonymousId ?? req.body?.anonymousId) && String(req.query?.anonymousId ?? req.body?.anonymousId).trim();
    if (!anonymousId) {
      const err = new Error("anonymousId is required");
      err.status = 400;
      throw err;
    }
    const list = await User8004Agent.find({ anonymousId })
      .sort({ createdAt: -1 })
      .select("asset name description image createdAt")
      .lean();
    return { agents: list, total: list.length };
  };
  router.get("/my-agents", async (req, res, next) => {
    try {
      const data = await myAgentsHandler(req);
      res.json(data);
    } catch (e) {
      if (!res.headersSent) res.status(e.status ?? 400).json({ error: e.message });
      else next(e);
    }
  });

  // --- Write: register new agent and optionally attach to collection (x402 payment required) ---
  const registerAgentHandler = async (req) => {
    const body = req.body && typeof req.body === "object" ? req.body : {};
    return performRegisterAgent(body);
  };
  router.post("/register-agent", async (req, res, next) => {
    try {
      const data = await registerAgentHandler(req);
      if (res.headersSent) return;
      res.status(201).json(data);
    } catch (e) {
      if (!res.headersSent) {
        let msg = e.message ?? String(e);
        if (/Root config not initialized|Registry not initialized|initialize the registry first/i.test(msg)) {
          msg =
            "Solana RPC cannot read the 8004 registry (getAccountInfo is blocked). In API .env set SOLANA_RPC_URL to an RPC that allows blockchain access (e.g. https://rpc.ankr.com/solana or Helius).";
        }
        res.status(e.status ?? 400).json({ error: msg });
      } else next(e);
    }
  });

  return router;
}
