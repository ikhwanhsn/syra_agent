/**
 * SAID Protocol identity routes — read Syra and third-party agent status from SAID.
 * API key protected (no x402), same as /8004 identity routes.
 *
 * GET /said/status
 * GET /said/verify/:wallet
 * GET /said/trust/:wallet
 * GET /said/agent/:wallet
 */
import express from "express";
import {
  checkVerified,
  getAgentDetails,
  getSyraSaidWallet,
  getTrust,
  getVerification,
  hasSaidConfigured,
  lookupOnChainAgent,
} from "../../libs/saidClient.js";

function isValidWallet(wallet) {
  return typeof wallet === "string" && wallet.trim().length >= 32 && wallet.trim().length <= 64;
}

function ensureSaidStatusConfigured(res) {
  if (!hasSaidConfigured()) {
    res.status(503).json({
      success: false,
      error: "SAID is not configured",
      message: "Set SAID_AGENT_WALLET in env after running npm run register-said.",
    });
    return false;
  }
  return true;
}

export async function createSaidRouter() {
  const router = express.Router();

  router.get("/status", async (_req, res) => {
    if (!ensureSaidStatusConfigured(res)) return;

    const wallet = getSyraSaidWallet();
    try {
      const [verification, verified, onChain] = await Promise.all([
        getVerification(wallet),
        checkVerified(wallet),
        lookupOnChainAgent(wallet),
      ]);

      if (!verification.success && !onChain) {
        res.status(verification.status && verification.status >= 400 ? verification.status : 502).json({
          success: false,
          error: verification.error || "SAID verification lookup failed",
        });
        return;
      }

      res.json({
        success: true,
        data: {
          wallet,
          verified,
          onChain: onChain
            ? {
                agentPDA: onChain.pubkey,
                metadataUri: onChain.metadataUri,
                isVerified: onChain.isVerified,
                registeredAt: onChain.registeredAt,
                verifiedAt: onChain.verifiedAt,
              }
            : null,
          ...(verification.success &&
          verification.data &&
          typeof verification.data === "object"
            ? verification.data
            : {}),
        },
      });
    } catch (err) {
      res.status(502).json({
        success: false,
        error: err instanceof Error ? err.message : "SAID status lookup failed",
      });
    }
  });

  router.get("/verify/:wallet", async (req, res) => {
    const wallet = req.params.wallet?.trim();
    if (!isValidWallet(wallet)) {
      res.status(400).json({ success: false, error: "Invalid wallet address" });
      return;
    }

    try {
      const result = await getVerification(wallet);
      if (!result.success) {
        res.status(result.status && result.status >= 400 ? result.status : 502).json({
          success: false,
          error: result.error || "SAID verify lookup failed",
        });
        return;
      }
      res.json({ success: true, data: result.data });
    } catch (err) {
      res.status(502).json({
        success: false,
        error: err instanceof Error ? err.message : "SAID verify lookup failed",
      });
    }
  });

  router.get("/trust/:wallet", async (req, res) => {
    const wallet = req.params.wallet?.trim();
    if (!isValidWallet(wallet)) {
      res.status(400).json({ success: false, error: "Invalid wallet address" });
      return;
    }

    try {
      const result = await getTrust(wallet);
      if (!result.success) {
        res.status(result.status && result.status >= 400 ? result.status : 502).json({
          success: false,
          error: result.error || "SAID trust lookup failed",
        });
        return;
      }
      res.json({ success: true, data: result.data });
    } catch (err) {
      res.status(502).json({
        success: false,
        error: err instanceof Error ? err.message : "SAID trust lookup failed",
      });
    }
  });

  router.get("/agent/:wallet", async (req, res) => {
    const wallet = req.params.wallet?.trim();
    if (!isValidWallet(wallet)) {
      res.status(400).json({ success: false, error: "Invalid wallet address" });
      return;
    }

    try {
      const result = await getAgentDetails(wallet);
      if (!result.success) {
        res.status(result.status && result.status >= 400 ? result.status : 502).json({
          success: false,
          error: result.error || "SAID agent lookup failed",
        });
        return;
      }
      res.json({ success: true, data: result.data });
    } catch (err) {
      res.status(502).json({
        success: false,
        error: err instanceof Error ? err.message : "SAID agent lookup failed",
      });
    }
  });

  return router;
}
