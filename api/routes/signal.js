import express from "express";
import { getV2Payment } from "../utils/getV2Payment.js";
import { X402_API_PRICE_USD } from "../config/x402Pricing.js";
import {
  buildCexSignalReport,
  normalizeSignalCexSource,
  SIGNAL_CEX_SOURCES,
} from "../libs/cexSignalAnalysis.js";

const { requirePayment, settlePaymentAndSetResponse } = await getV2Payment();

const CEX_LIST_DOC = `${SIGNAL_CEX_SOURCES.join(", ")} (alias: crypto.com → cryptocom)`;

async function fetchN8nSignal(token) {
  const base = process.env.N8N_WEBHOOK_URL_SIGNAL;
  if (!base) {
    throw new Error("N8N_WEBHOOK_URL_SIGNAL is not configured");
  }
  const url = `${base}?token=${encodeURIComponent(token || "bitcoin")}`;
  return fetch(url).then((r) => r.json());
}

/**
 * When default source is Binance and Binance is throttling, try Coinbase spot candles (same engine).
 * @param {unknown} err
 */
function isBinanceThrottleOrTransient(err) {
  const msg = String(err?.message || err);
  return /429|418|rate limit|too many|way too many|-1003|-1015|Binance klines/i.test(msg);
}

/**
 * @param {{ token?: string; source?: string; instId?: string; bar?: string; limit?: string|number }} input
 */
export async function loadSignal(input) {
  const token = input.token || "bitcoin";
  const limitNum =
    input.limit != null && input.limit !== ""
      ? Number.parseInt(String(input.limit), 10)
      : undefined;
  const limitOpt = Number.isFinite(limitNum) ? limitNum : undefined;

  const raw = input.source == null ? "" : String(input.source).trim();
  const rawLower = raw.toLowerCase();

  if (rawLower === "n8n" || rawLower === "webhook") {
    const signal = await fetchN8nSignal(token);
    return { signal };
  }

  const cexKey = raw === "" ? "binance" : normalizeSignalCexSource(raw);
  if (cexKey) {
    const params = {
      token,
      instId: input.instId,
      bar: input.bar || undefined,
      limit: limitOpt,
    };
    try {
      const { source, meta, report } = await buildCexSignalReport(cexKey, params);
      return { signal: { ...report, source, ...meta } };
    } catch (firstErr) {
      if (raw === "" && cexKey === "binance" && isBinanceThrottleOrTransient(firstErr)) {
        try {
          // Coinbase uses different product ids; only token-based mapping is safe here.
          const { source, meta, report } = await buildCexSignalReport("coinbase", {
            ...params,
            instId: undefined,
          });
          return { signal: { ...report, source, ...meta } };
        } catch {
          throw firstErr;
        }
      }
      throw firstErr;
    }
  }

  const signal = await fetchN8nSignal(token);
  return { signal };
}

const signalQueryInputSchema = {
  queryParams: {
    token: {
      type: "string",
      required: false,
      description: "Token name for the signal (e.g., solana, bitcoin); used for n8n or exchange mapping",
    },
    source: {
      type: "string",
      required: false,
      description: `Default: binance (spot OHLC + engine). Other CEX: ${CEX_LIST_DOC}. Use n8n or webhook for legacy n8n signal.`,
    },
    instId: {
      type: "string",
      required: false,
      description:
        "Override instrument: e.g. BTCUSDT (Binance/Bybit/Bitget), BTC-USDT (OKX/KuCoin), BTC-USD (Coinbase), XBTUSDT (Kraken), KRW-BTC (Upbit), BTC_USDT (Crypto.com)",
    },
    bar: {
      type: "string",
      required: false,
      description: "Candle interval (venue-specific; common: 1m, 15m, 1h, 4h, 1d)",
    },
    limit: {
      type: "string",
      required: false,
      description: "Number of candles (venue-specific max; default 200)",
    },
  },
};

const signalBodyInputSchema = {
  bodyType: "json",
  bodyFields: {
    token: {
      type: "string",
      required: false,
      description: "Token name for the signal (e.g., solana, bitcoin)",
    },
    source: {
      type: "string",
      required: false,
      description: `Default binance. ${CEX_LIST_DOC}. n8n | webhook for n8n.`,
    },
    instId: {
      type: "string",
      required: false,
      description: "Venue-specific symbol / product / market override",
    },
    bar: {
      type: "string",
      required: false,
      description: "Candle interval (default ~1h per venue)",
    },
    limit: {
      type: "number",
      required: false,
      description: "Candle count (venue max varies)",
    },
  },
};

export async function createSignalRouter() {
  const router = express.Router();

  if (process.env.NODE_ENV !== "production") {
    router.get("/dev", async (req, res) => {
      try {
        const { token, source, instId, bar, limit } = req.query;
        const out = await loadSignal({ token, source, instId, bar, limit });
        if (out?.signal) res.json(out);
        else res.status(500).json({ error: "Failed to fetch signal" });
      } catch (error) {
        const msg = error?.message || "Server error";
        res.status(500).json({ error: msg });
      }
    });
  }

  router.get(
    "/",
    (req, res, next) =>
      requirePayment({
        price: X402_API_PRICE_USD,
        description: "Get AI-generated trading signals with entry/exit recommendations",
        method: "GET",
        discoverable: true,
        resource: "/signal",
        inputSchema: signalQueryInputSchema,
        outputSchema: {
          signal: {
            type: "object",
            description: "Trading signal with recommendation, entry price, targets, and analysis",
          },
        },
      })(req, res, next),
    async (req, res) => {
      try {
        const { token, source, instId, bar, limit } = req.query;
        const out = await loadSignal({ token, source, instId, bar, limit });

        if (out?.signal) {
          await settlePaymentAndSetResponse(res, req);
          res.json(out);
        } else {
          res.status(500).json({ error: "Failed to fetch signal" });
        }
      } catch (error) {
        const msg = error?.message || "Server error";
        res.status(500).json({ error: msg });
      }
    }
  );

  router.post(
    "/",
    (req, res, next) =>
      requirePayment({
        price: X402_API_PRICE_USD,
        description: "Get AI-generated trading signals with entry/exit recommendations",
        method: "POST",
        discoverable: true,
        resource: "/signal",
        inputSchema: signalBodyInputSchema,
        outputSchema: {
          signal: {
            type: "object",
            description: "Trading signal with recommendation, entry price, targets, and analysis",
          },
        },
      })(req, res, next),
    async (req, res) => {
      try {
        const { token, source, instId, bar, limit } = req.body || {};
        const out = await loadSignal({ token, source, instId, bar, limit });
        if (!out?.signal) {
          return res.status(500).json({ error: "Failed to fetch signal" });
        }
        await settlePaymentAndSetResponse(res, req);
        res.json(out);
      } catch (error) {
        const msg = error?.message || "Server error";
        res.status(500).json({ error: msg });
      }
    }
  );

  return router;
}

/**
 * Public REST signal API at /api/signal — no x402 (optional API key when server sets API_KEY).
 * Same engine as /signal; distinct path so gateways and OpenAPI stay schema-friendly.
 */
export async function createPublicSignalApiRouter() {
  const router = express.Router();

  router.get("/", async (req, res) => {
    try {
      const { token, source, instId, bar, limit } = req.query;
      const out = await loadSignal({ token, source, instId, bar, limit });
      if (out?.signal) {
        res.json({
          success: true,
          data: { signal: out.signal },
          meta: {
            token: token || "bitcoin",
            ...(source ? { source: String(source) } : {}),
          },
        });
      } else {
        res.status(500).json({ success: false, error: "Failed to fetch signal" });
      }
    } catch (error) {
      const msg = error?.message || "Server error";
      res.status(500).json({ success: false, error: msg });
    }
  });

  router.post("/", async (req, res) => {
    try {
      const { token, source, instId, bar, limit } = req.body || {};
      const out = await loadSignal({ token, source, instId, bar, limit });
      if (!out?.signal) {
        return res.status(500).json({ success: false, error: "Failed to fetch signal" });
      }
      res.json({
        success: true,
        data: { signal: out.signal },
        meta: {
          token: token || "bitcoin",
          ...(source ? { source: String(source) } : {}),
        },
      });
    } catch (error) {
      const msg = error?.message || "Server error";
      res.status(500).json({ success: false, error: msg });
    }
  });

  return router;
}

/** Preview (no x402) signal router for /preview/signal – same data, no payment. */
export async function createSignalRouterRegular() {
  const router = express.Router();

  router.get("/", async (req, res) => {
    try {
      const { token, source, instId, bar, limit } = req.query;
      const out = await loadSignal({
        token: token || "solana",
        source,
        instId,
        bar,
        limit,
      });
      if (out?.signal) {
        res.json({
          signal: out.signal,
          token: token || "solana",
          ...(source ? { source } : {}),
        });
      } else {
        res.status(500).json({ error: "Failed to fetch signal" });
      }
    } catch (error) {
      const msg = error?.message || "Server error";
      res.status(500).json({ error: msg });
    }
  });

  return router;
}
