/**
 * Agent UI: pump.fun coin metadata via Syra backend (no x402).
 * Same upstream as GET /pumpfun/coin/:mint — server-side fetch only.
 */
import express from "express";

const FRONTEND_API_BASE = (process.env.PUMP_FUN_FRONTEND_API_URL || "https://frontend-api-v3.pump.fun").replace(
  /\/$/,
  ""
);

function isLikelySolanaPubkey(s) {
  const t = String(s || "").trim();
  if (t.length < 32 || t.length > 44) return false;
  return /^[1-9A-HJ-NP-Za-km-z]+$/.test(t);
}

function shortenMint(mint) {
  const t = String(mint || "").trim();
  if (t.length <= 14) return t;
  return `${t.slice(0, 4)}…${t.slice(-4)}`;
}

export function createAgentPumpfunCoinRouter() {
  const router = express.Router();

  /**
   * @param {string} mint
   * @param {import("express").Response} res
   */
  async function sendCoinJson(mint, res) {
    if (!mint || !isLikelySolanaPubkey(mint)) {
      return res.status(400).json({ success: false, error: "invalid_mint" });
    }
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    try {
      const url = `${FRONTEND_API_BASE}/coins-v2/${encodeURIComponent(mint)}`;
      const upstream = await fetch(url, {
        method: "GET",
        headers: { Accept: "application/json" },
        signal: ctrl.signal,
      });
      const text = await upstream.text();
      let data = null;
      if (text) {
        try {
          data = JSON.parse(text);
        } catch {
          data = null;
        }
      }
      if (!upstream.ok || !data || typeof data !== "object") {
        return res.status(upstream.status === 404 ? 404 : 502).json({
          success: false,
          error: upstream.ok ? "invalid_body" : "upstream_error",
        });
      }
      const symbol = typeof data.symbol === "string" ? data.symbol.trim() : "";
      const name = typeof data.name === "string" ? data.name.trim() : "";
      const imageUri = typeof data.image_uri === "string" ? data.image_uri.trim() : "";
      const m = typeof data.mint === "string" ? data.mint.trim() : mint;
      /** Bonding curve finished → liquidity on Raydium; pumpfun-agents-swap curve path fails for these. */
      const complete = typeof data.complete === "boolean" ? data.complete : undefined;
      if (!symbol && !name) {
        return res.status(404).json({ success: false, error: "no_metadata" });
      }
      return res.json({
        success: true,
        mint: m,
        symbol: (symbol || shortenMint(m)).toUpperCase(),
        name: name || symbol || "Token",
        ...(imageUri ? { imageUri } : {}),
        ...(complete !== undefined ? { complete } : {}),
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "unknown";
      if (msg === "The operation was aborted." || msg.includes("abort")) {
        return res.status(504).json({ success: false, error: "timeout" });
      }
      return res.status(500).json({ success: false, error: "fetch_failed", message: msg });
    } finally {
      clearTimeout(t);
    }
  }

  router.get("/coin/:mint", async (req, res) => {
    try {
      await sendCoinJson(req.params.mint, res);
    } catch (e) {
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: "internal",
          message: e instanceof Error ? e.message : "unknown",
        });
      }
    }
  });
  router.get("/coin", async (req, res) => {
    const q = typeof req.query.mint === "string" ? req.query.mint.trim() : "";
    try {
      await sendCoinJson(q, res);
    } catch (e) {
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: "internal",
          message: e instanceof Error ? e.message : "unknown",
        });
      }
    }
  });

  return router;
}
