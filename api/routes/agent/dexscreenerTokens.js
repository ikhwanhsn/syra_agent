/**
 * Agent UI: DexScreener token pairs via Syra backend (no x402).
 * Proxies public upstream so browser CSP does not need api.dexscreener.com.
 */
import express from "express";

const DEXSCREENER_TOKENS_URL = "https://api.dexscreener.com/latest/dex/tokens";

function isLikelySolanaPubkey(s) {
  const t = String(s || "").trim();
  if (t.length < 32 || t.length > 44) return false;
  return /^[1-9A-HJ-NP-Za-km-z]+$/.test(t);
}

export function createAgentDexscreenerTokensRouter() {
  const router = express.Router();

  /**
   * @param {string} mint
   * @param {import("express").Response} res
   */
  async function sendTokensJson(mint, res) {
    if (!mint || !isLikelySolanaPubkey(mint)) {
      return res.status(400).json({ success: false, error: "invalid_mint" });
    }
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 10_000);
    try {
      const url = `${DEXSCREENER_TOKENS_URL}/${encodeURIComponent(mint)}`;
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
      if (!upstream.ok) {
        return res.status(upstream.status === 404 ? 404 : 502).json({
          success: false,
          error: "upstream_error",
        });
      }
      if (!data || typeof data !== "object") {
        return res.status(502).json({ success: false, error: "invalid_body" });
      }
      res.setHeader("Cache-Control", "public, max-age=30");
      return res.json({ success: true, ...data });
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

  router.get("/tokens/:mint", async (req, res) => {
    try {
      await sendTokensJson(req.params.mint, res);
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

  router.get("/tokens", async (req, res) => {
    const q = typeof req.query.mint === "string" ? req.query.mint.trim() : "";
    try {
      await sendTokensJson(q, res);
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
