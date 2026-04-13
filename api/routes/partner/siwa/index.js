/**
 * SIWA (Sign-In With Agent) – nonce and verify endpoints for ERC-8004 agent auth.
 * Requires RECEIPT_SECRET (min 32 chars), SIWA_RPC_URL (or ETH_RPC_URL). Optional SIWA_DOMAIN.
 * @see https://siwa.id | https://github.com/BankrBot/skills/tree/main/siwa
 */
import express from "express";
import { createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";
import { getV2Payment } from "../../../utils/getV2Payment.js";
import { X402_API_PRICE_SIWA_USD } from "../../../config/x402Pricing.js";

const { requirePayment, settlePaymentWithFallback, encodePaymentResponseHeader, runBuybackForRequest } =
  await getV2Payment();

const RECEIPT_SECRET = (process.env.RECEIPT_SECRET || "").trim();
const SIWA_RPC_URL = (process.env.SIWA_RPC_URL || process.env.ETH_RPC_URL || "").trim();
const SIWA_DOMAIN = (process.env.SIWA_DOMAIN || "api.syraa.fun").trim();

const nonceStore = new Map();

let siwaModule = null;
try {
  siwaModule = await import("@buildersgarden/siwa");
} catch {
  // optional: SDK not installed
}

function siwaUnavailable(res) {
  return res.status(503).json({
    success: false,
    error: "SIWA not configured. Set RECEIPT_SECRET (min 32 chars) and SIWA_RPC_URL (or ETH_RPC_URL). Install @buildersgarden/siwa.",
  });
}

function getClient() {
  if (!SIWA_RPC_URL) return null;
  return createPublicClient({
    chain: mainnet,
    transport: http(SIWA_RPC_URL),
  });
}

export async function createSiwaRouter() {
  const router = express.Router();
  router.use(express.json());

  if (process.env.NODE_ENV !== "production") {
    router.get("/dev", (_req, res) => {
      res.json({
        configured: !!RECEIPT_SECRET && RECEIPT_SECRET.length >= 32 && !!SIWA_RPC_URL && !!siwaModule,
        domain: SIWA_DOMAIN,
        message: "SIWA routes: POST /siwa/nonce, POST /siwa/verify",
      });
    });
    router.post("/nonce/dev", async (req, res) => {
      if (!siwaModule?.createSIWANonce || !RECEIPT_SECRET || RECEIPT_SECRET.length < 32) return siwaUnavailable(res);
      const client = getClient();
      if (!client) return siwaUnavailable(res);
      const { address, agentId, agentRegistry } = req.body || {};
      if (!address || agentId == null) return res.status(400).json({ success: false, error: "address and agentId required" });
      try {
        const result = await siwaModule.createSIWANonce(
          { address, agentId: Number(agentId), agentRegistry: agentRegistry || undefined },
          client,
        );
        nonceStore.set(result.nonce, Date.now());
        res.json({ nonce: result.nonce, issuedAt: result.issuedAt, expirationTime: result.expirationTime });
      } catch (err) {
        res.status(500).json({ success: false, error: err.message || "SIWA nonce failed" });
      }
    });
    router.post("/verify/dev", async (req, res) => {
      if (!siwaModule?.verifySIWA || !RECEIPT_SECRET || RECEIPT_SECRET.length < 32) return siwaUnavailable(res);
      const client = getClient();
      if (!client) return siwaUnavailable(res);
      const { message, signature } = req.body || {};
      if (!message || !signature) return res.status(400).json({ success: false, error: "message and signature required" });
      const domain = req.get("host") || SIWA_DOMAIN;
      const checkNonce = (nonce) => { if (!nonceStore.has(nonce)) return false; nonceStore.delete(nonce); return true; };
      try {
        const result = await siwaModule.verifySIWA(message, signature, domain, checkNonce, client);
        if (!result.valid) return res.status(401).json({ valid: false, error: result.error });
        let receipt = null;
        try {
          const { createReceipt } = await import("@buildersgarden/siwa/receipt");
          const created = createReceipt(
            { address: result.address, agentId: result.agentId, agentRegistry: result.agentRegistry, chainId: result.chainId, signerType: result.signerType },
            { secret: RECEIPT_SECRET },
          );
          receipt = created?.receipt;
        } catch { /* receipt optional */ }
        res.json({ valid: true, agentId: result.agentId, address: result.address, receipt });
      } catch (err) {
        res.status(500).json({ success: false, error: err.message || "SIWA verify failed" });
      }
    });
  }

  const paymentOpts = {
    price: X402_API_PRICE_SIWA_USD,
    description: "SIWA nonce or verify (Sign-In With Agent)",
    discoverable: true,
    resource: "/siwa",
    method: "POST",
  };

  // POST /siwa/nonce
  router.post(
    "/nonce",
    requirePayment({ ...paymentOpts, resource: "/siwa/nonce", method: "POST" }),
    async (req, res) => {
      if (!siwaModule?.createSIWANonce || !RECEIPT_SECRET || RECEIPT_SECRET.length < 32) return siwaUnavailable(res);
      const client = getClient();
      if (!client) return siwaUnavailable(res);
      const { address, agentId, agentRegistry } = req.body || {};
      if (!address || agentId == null) {
        return res.status(400).json({ success: false, error: "address and agentId required" });
      }
      try {
        const result = await siwaModule.createSIWANonce(
          { address, agentId: Number(agentId), agentRegistry: agentRegistry || undefined },
          client,
        );
        nonceStore.set(result.nonce, Date.now());
        const settle = await settlePaymentWithFallback(req.x402Payment?.payload, req.x402Payment?.accepted, req);
        res.setHeader("Payment-Response", encodePaymentResponseHeader(settle?.success ? settle : { success: true }));
        runBuybackForRequest(req);
        res.json({
          nonce: result.nonce,
          issuedAt: result.issuedAt,
          expirationTime: result.expirationTime,
        });
      } catch (err) {
        res.status(500).json({ success: false, error: err.message || "SIWA nonce failed" });
      }
    },
  );

  // POST /siwa/verify
  router.post(
    "/verify",
    requirePayment({ ...paymentOpts, resource: "/siwa/verify", method: "POST" }),
    async (req, res) => {
      if (!siwaModule?.verifySIWA || !RECEIPT_SECRET || RECEIPT_SECRET.length < 32) return siwaUnavailable(res);
      const client = getClient();
      if (!client) return siwaUnavailable(res);
      const { message, signature } = req.body || {};
      if (!message || !signature) {
        return res.status(400).json({ success: false, error: "message and signature required" });
      }
      const domain = req.get("host") || SIWA_DOMAIN;
      const checkNonce = (nonce) => {
        if (!nonceStore.has(nonce)) return false;
        nonceStore.delete(nonce);
        return true;
      };
      try {
        const result = await siwaModule.verifySIWA(message, signature, domain, checkNonce, client);
        if (!result.valid) {
          return res.status(401).json({ valid: false, error: result.error });
        }
        let receipt = null;
        try {
          const { createReceipt } = await import("@buildersgarden/siwa/receipt");
          const created = createReceipt(
            {
              address: result.address,
              agentId: result.agentId,
              agentRegistry: result.agentRegistry,
              chainId: result.chainId,
              signerType: result.signerType,
            },
            { secret: RECEIPT_SECRET },
          );
          receipt = created?.receipt;
        } catch {
          // receipt optional
        }
        const settle = await settlePaymentWithFallback(req.x402Payment?.payload, req.x402Payment?.accepted, req);
        res.setHeader("Payment-Response", encodePaymentResponseHeader(settle?.success ? settle : { success: true }));
        runBuybackForRequest(req);
        res.json({ valid: true, agentId: result.agentId, address: result.address, receipt });
      } catch (err) {
        res.status(500).json({ success: false, error: err.message || "SIWA verify failed" });
      }
    },
  );

  return router;
}
