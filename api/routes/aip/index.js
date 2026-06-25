/**
 * AIP identity routes — did:aip status and counterparty verification.
 * API key protected (same pattern as /said).
 */
import express from "express";
import {
  getSyraAipStatus,
  getSyraDidAip,
  isAipConfigured,
  resolveDidAip,
  verifyAipCounterparty,
} from "../../libs/aipDidClient.js";
import { buildSyraAipAgentCardDocument } from "../../libs/aipAgentCard.js";
import { getSyraAipWallet } from "../../config/aipConfig.js";

function isValidDid(did) {
  return /^did:aip:[1-9A-HJ-NP-Za-km-z]{32,44}:[A-Za-z0-9_-]{1,32}$/.test(String(did || "").trim());
}

/** Express 5 wildcard params may be string or string[]. */
function didFromParams(raw) {
  const joined = Array.isArray(raw) ? raw.join("/") : String(raw || "");
  return decodeURIComponent(joined.trim());
}

export async function createAipRouter() {
  const router = express.Router();

  router.get("/status", async (_req, res) => {
    try {
      const status = await getSyraAipStatus();
      res.json({ success: true, data: status });
    } catch (err) {
      res.status(500).json({
        success: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  });

  router.get("/card", (_req, res) => {
    const wallet =
      getSyraAipWallet() ||
      process.env.SOLANA_PAYTO?.trim() ||
      process.env.PAYTO?.trim();
    if (!wallet) {
      return res.status(503).json({
        success: false,
        error: "AIP wallet not configured",
        message: "Set SYRA_AIP_WALLET or run npm run register-aip",
      });
    }
    res.json(buildSyraAipAgentCardDocument(wallet));
  });

  router.get("/resolve/*did", async (req, res) => {
    const did = didFromParams(req.params.did);
    if (!isValidDid(did)) {
      return res.status(400).json({ success: false, error: "Invalid did:aip format" });
    }
    try {
      const result = await resolveDidAip(did);
      if ("error" in result.didResolutionMetadata) {
        return res.status(404).json({
          success: false,
          error: result.didResolutionMetadata.error,
          did,
        });
      }
      res.json({
        success: true,
        data: {
          did,
          didDocument: result.didDocument,
          agentRecord: result.agentRecord,
          metadata: result.didDocumentMetadata,
          resolution: result.didResolutionMetadata,
        },
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  });

  router.get("/verify/*did", async (req, res) => {
    const did = didFromParams(req.params.did);
    if (!isValidDid(did)) {
      return res.status(400).json({ success: false, error: "Invalid did:aip format" });
    }
    const verified = await verifyAipCounterparty(did);
    if (!verified.ok) {
      return res.status(403).json({
        success: false,
        error: verified.error,
        code: verified.code,
      });
    }
    res.json({
      success: true,
      data: {
        did,
        trusted: true,
        agentRecord: verified.record,
        endpoint: verified.record.endpoint,
      },
    });
  });

  router.get("/identity", (_req, res) => {
    if (!isAipConfigured()) {
      return res.status(503).json({
        success: false,
        error: "AIP not configured",
        message: "Set SYRA_AIP_WALLET after npm run register-aip",
      });
    }
    res.json({
      success: true,
      data: {
        did: getSyraDidAip(),
        wallet: getSyraAipWallet(),
        agentCard: "/.well-known/agent.json",
        a2a: "/a2a",
      },
    });
  });

  return router;
}

export default createAipRouter;
