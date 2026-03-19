/**
 * Tempo payout rail API: POST /payouts/tempo
 * Sends a stablecoin (TIP-20) payout on Tempo with optional memo for reconciliation.
 * Protected by API key (same as other internal/partner routes).
 *
 * Body: { to: string, amountUsd: number, memo?: string }
 * - to: recipient address (0x...)
 * - amountUsd: amount in USD (e.g. 10.50)
 * - memo: optional 32-byte reconciliation reference (invoice id, customer id, etc.)
 */
import express from "express";
import { sendTempoPayout } from "../../libs/tempoPayout.js";

export function createTempoPayoutRouter() {
  const router = express.Router();

  router.post("/tempo", async (req, res) => {
    try {
      const { to, amountUsd, memo } = req.body || {};

      if (!to || typeof to !== "string" || !to.trim()) {
        return res.status(400).json({
          success: false,
          error: "Missing or invalid 'to' (recipient address)",
        });
      }

      const amount = Number(amountUsd);
      if (!Number.isFinite(amount) || amount <= 0) {
        return res.status(400).json({
          success: false,
          error: "Missing or invalid 'amountUsd' (positive number)",
        });
      }

      const result = await sendTempoPayout({
        to: to.trim(),
        amountUsd: amount,
        memo: memo != null ? String(memo).trim() : undefined,
      });

      if (result.success) {
        return res.status(200).json({
          success: true,
          transactionHash: result.transactionHash,
        });
      }

      return res.status(500).json({
        success: false,
        error: result.error ?? "Payout failed",
      });
    } catch (err) {
      const message = err?.message ?? String(err);
      return res.status(500).json({
        success: false,
        error: message,
      });
    }
  });

  return router;
}
