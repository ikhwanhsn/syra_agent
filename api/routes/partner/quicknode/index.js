/**
 * Quicknode RPC proxy – balance, transaction status, and raw JSON-RPC.
 * Requires QUICKNODE_SOLANA_RPC_URL and/or QUICKNODE_BASE_RPC_URL in .env.
 * x402 per request.
 */
import express from "express";
import { getV2Payment } from "../../../utils/getV2Payment.js";
import { X402_API_PRICE_QUICKNODE_USD } from "../../../config/x402Pricing.js";
import {
  getSolanaBalance,
  getSolanaTransactionStatus,
  getEvmBalance,
  getEvmTransactionStatus,
  rawRpc,
  quicknodeConfig,
} from "../../../libs/quicknodeClient.js";

const { requirePayment, settlePaymentWithFallback, encodePaymentResponseHeader, runBuybackForRequest } =
  await getV2Payment();

const paymentOptions = {
  price: X402_API_PRICE_QUICKNODE_USD,
  description: "Quicknode RPC: blockchain data (balance, transaction status, raw RPC)",
  discoverable: true,
  resource: "/quicknode",
  method: "GET",
};

function quicknodeUnavailable(res) {
  return res.status(503).json({
    success: false,
    error: "Quicknode not configured. Set QUICKNODE_SOLANA_RPC_URL and/or QUICKNODE_BASE_RPC_URL in API .env.",
    config: quicknodeConfig,
  });
}

export async function createQuicknodeRouter() {
  const router = express.Router();

  if (process.env.NODE_ENV !== "production") {
    router.get("/dev", (_req, res) => {
      res.json({
        config: quicknodeConfig,
        message: "Quicknode routes available at GET /quicknode/balance, /quicknode/transaction, POST /quicknode/rpc",
      });
    });
    // Dev routes (no payment) for MCP when SYRA_USE_DEV_ROUTES=true
    router.get("/balance/dev", async (req, res) => {
      const { chain, address } = req.query;
      if (!chain || !address) return res.status(400).json({ success: false, error: "Missing chain or address" });
      const c = String(chain).toLowerCase();
      if (c !== "solana" && c !== "base") return res.status(400).json({ success: false, error: "chain must be solana or base" });
      if (!quicknodeConfig.solana && c === "solana") return quicknodeUnavailable(res);
      if (!quicknodeConfig.base && c === "base") return quicknodeUnavailable(res);
      try {
        const result = c === "solana" ? await getSolanaBalance(String(address)) : await getEvmBalance(String(address));
        if (result.error) return res.status(502).json({ success: false, error: result.error });
        res.json({ chain: c, address, ...result });
      } catch (err) {
        res.status(500).json({ success: false, error: err.message || "Balance fetch failed" });
      }
    });
    router.get("/transaction/dev", async (req, res) => {
      const { chain, signature, txHash } = req.query;
      if (!chain) return res.status(400).json({ success: false, error: "Missing chain" });
      const c = String(chain).toLowerCase();
      if (c !== "solana" && c !== "base") return res.status(400).json({ success: false, error: "chain must be solana or base" });
      if (c === "solana" && !signature) return res.status(400).json({ success: false, error: "Missing signature for chain=solana" });
      if (c === "base" && !txHash) return res.status(400).json({ success: false, error: "Missing txHash for chain=base" });
      if (!quicknodeConfig.solana && c === "solana") return quicknodeUnavailable(res);
      if (!quicknodeConfig.base && c === "base") return quicknodeUnavailable(res);
      try {
        const result = c === "solana" ? await getSolanaTransactionStatus(String(signature)) : await getEvmTransactionStatus(String(txHash));
        if (result.error) return res.status(502).json({ success: false, error: result.error });
        res.json({ chain: c, ...(c === "solana" ? { signature } : { txHash }), ...result });
      } catch (err) {
        res.status(500).json({ success: false, error: err.message || "Transaction status fetch failed" });
      }
    });
    router.post("/rpc/dev", async (req, res) => {
      const { chain, method, params, id } = req.body || {};
      if (!chain || !method) return res.status(400).json({ success: false, error: "Missing chain or method" });
      const c = String(chain).toLowerCase();
      if (c !== "solana" && c !== "base") return res.status(400).json({ success: false, error: "chain must be solana or base" });
      if (!quicknodeConfig.solana && c === "solana") return quicknodeUnavailable(res);
      if (!quicknodeConfig.base && c === "base") return quicknodeUnavailable(res);
      const body = { jsonrpc: "2.0", id: id ?? 1, method, params: Array.isArray(params) ? params : [] };
      try {
        const data = await rawRpc(c, body);
        res.json(data);
      } catch (err) {
        res.status(500).json({ success: false, error: err.message || "RPC forward failed" });
      }
    });
  }

  // GET /quicknode/balance?chain=solana|base&address=...
  router.get(
    "/balance",
    requirePayment({
      ...paymentOptions,
      resource: "/quicknode/balance",
      inputSchema: {
        queryParams: {
          chain: { type: "string", required: true, description: "Chain: solana or base" },
          address: { type: "string", required: true, description: "Wallet address (base58 for Solana, 0x for Base)" },
        },
      },
    }),
    async (req, res) => {
      const { chain, address } = req.query;
      if (!chain || !address) {
        return res.status(400).json({ success: false, error: "Missing chain or address" });
      }
      const c = String(chain).toLowerCase();
      if (c !== "solana" && c !== "base") {
        return res.status(400).json({ success: false, error: "chain must be solana or base" });
      }
      if (!quicknodeConfig.solana && c === "solana") return quicknodeUnavailable(res);
      if (!quicknodeConfig.base && c === "base") return quicknodeUnavailable(res);

      try {
        const result = c === "solana" ? await getSolanaBalance(String(address)) : await getEvmBalance(String(address));
        if (result.error) {
          return res.status(502).json({ success: false, error: result.error });
        }
        const settle = await settlePaymentWithFallback(req.x402Payment?.payload, req.x402Payment?.accepted, req);
        res.setHeader("Payment-Response", encodePaymentResponseHeader(settle?.success ? settle : { success: true }));
        runBuybackForRequest(req);
        res.json({ chain: c, address, ...result });
      } catch (err) {
        res.status(500).json({ success: false, error: err.message || "Balance fetch failed" });
      }
    },
  );

  // GET /quicknode/transaction?chain=solana&signature=... or chain=base&txHash=...
  router.get(
    "/transaction",
    requirePayment({
      ...paymentOptions,
      resource: "/quicknode/transaction",
      inputSchema: {
        queryParams: {
          chain: { type: "string", required: true, description: "Chain: solana or base" },
          signature: { type: "string", required: false, description: "Solana transaction signature" },
          txHash: { type: "string", required: false, description: "EVM transaction hash (0x)" },
        },
      },
    }),
    async (req, res) => {
      const { chain, signature, txHash } = req.query;
      if (!chain) {
        return res.status(400).json({ success: false, error: "Missing chain" });
      }
      const c = String(chain).toLowerCase();
      if (c !== "solana" && c !== "base") {
        return res.status(400).json({ success: false, error: "chain must be solana or base" });
      }
      if (c === "solana" && !signature) {
        return res.status(400).json({ success: false, error: "Missing signature for chain=solana" });
      }
      if (c === "base" && !txHash) {
        return res.status(400).json({ success: false, error: "Missing txHash for chain=base" });
      }
      if (!quicknodeConfig.solana && c === "solana") return quicknodeUnavailable(res);
      if (!quicknodeConfig.base && c === "base") return quicknodeUnavailable(res);

      try {
        const result =
          c === "solana"
            ? await getSolanaTransactionStatus(String(signature))
            : await getEvmTransactionStatus(String(txHash));
        if (result.error) {
          return res.status(502).json({ success: false, error: result.error });
        }
        const settle = await settlePaymentWithFallback(req.x402Payment?.payload, req.x402Payment?.accepted, req);
        res.setHeader("Payment-Response", encodePaymentResponseHeader(settle?.success ? settle : { success: true }));
        runBuybackForRequest(req);
        res.json({ chain: c, ...(c === "solana" ? { signature } : { txHash }), ...result });
      } catch (err) {
        res.status(500).json({ success: false, error: err.message || "Transaction status fetch failed" });
      }
    },
  );

  // POST /quicknode/rpc – raw JSON-RPC (body: { chain, method, params, id? })
  router.post(
    "/rpc",
    requirePayment({
      ...paymentOptions,
      method: "POST",
      resource: "/quicknode/rpc",
      inputSchema: {
        bodyType: "json",
        bodyFields: {
          chain: { type: "string", required: true, description: "solana or base" },
          method: { type: "string", required: true, description: "JSON-RPC method" },
          params: { type: "array", required: false, description: "JSON-RPC params" },
          id: { type: "number", required: false, description: "JSON-RPC id" },
        },
      },
    }),
    async (req, res) => {
      const { chain, method, params, id } = req.body || {};
      if (!chain || !method) {
        return res.status(400).json({ success: false, error: "Missing chain or method" });
      }
      const c = String(chain).toLowerCase();
      if (c !== "solana" && c !== "base") {
        return res.status(400).json({ success: false, error: "chain must be solana or base" });
      }
      if (!quicknodeConfig.solana && c === "solana") return quicknodeUnavailable(res);
      if (!quicknodeConfig.base && c === "base") return quicknodeUnavailable(res);

      const body = { jsonrpc: "2.0", id: id ?? 1, method, params: Array.isArray(params) ? params : [] };
      try {
        const data = await rawRpc(c, body);
        if (data.error && !data.result) {
          return res.status(502).json({ success: false, error: data.error.message || "RPC error", rpcError: data.error });
        }
        const settle = await settlePaymentWithFallback(req.x402Payment?.payload, req.x402Payment?.accepted, req);
        res.setHeader("Payment-Response", encodePaymentResponseHeader(settle?.success ? settle : { success: true }));
        runBuybackForRequest(req);
        res.json(data);
      } catch (err) {
        res.status(500).json({ success: false, error: err.message || "RPC forward failed" });
      }
    },
  );

  return router;
}
