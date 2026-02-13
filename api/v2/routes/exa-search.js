/**
 * v2 x402 API: EXA search – dynamic web search via Exa AI.
 * Uses EXA_API_KEY from env. Search is fully dynamic: query + optional numResults, type, contents, etc.
 */
import express from "express";
import { getV2Payment } from "../utils/getV2Payment.js";
import Exa from "exa-js";
import { X402_API_PRICE_EXA_SEARCH_USD } from "../../config/x402Pricing.js";

const { requirePayment, settlePaymentAndSetResponse } = await getV2Payment();

function getExaClient() {
  const key = (process.env.EXA_API_KEY || "").trim();
  if (!key) {
    throw new Error("EXA_API_KEY is not set. Add it to your .env.");
  }
  return new Exa(key);
}

/**
 * Build EXA search options from request (GET query params or POST body).
 * Fully dynamic: accepts numResults, type, contents, and any other valid EXA options.
 */
function buildSearchOptions(input) {
  const opts = {};
  if (input.numResults != null) {
    const n = parseInt(input.numResults, 10);
    if (!Number.isNaN(n) && n >= 1 && n <= 100) opts.numResults = n;
  }
  if (input.type != null && typeof input.type === "string") {
    const t = input.type.trim().toLowerCase();
    if (["auto", "keyword", "neural", "fast", "deep"].includes(t)) opts.type = t;
  }
  if (input.contents != null) {
    if (typeof input.contents === "object" && input.contents !== null) {
      opts.contents = input.contents;
    } else if (typeof input.contents === "string") {
      try {
        opts.contents = JSON.parse(input.contents);
      } catch (_) {
        // ignore invalid JSON
      }
    }
  }
  // Allow any other EXA search options to be passed through (e.g. includeDomains, startPublishedDate)
  const known = new Set(["query", "numResults", "type", "contents"]);
  for (const [k, v] of Object.entries(input)) {
    if (known.has(k) || v === undefined || v === null) continue;
    opts[k] = v;
  }
  return opts;
}

/** Default options when none provided (matches user example: numResults 10, type auto, highlights) */
const defaultSearchOptions = {
  numResults: 10,
  type: "auto",
  contents: {
    highlights: {
      maxCharacters: 4000,
    },
  },
};

export async function createExaSearchRouter() {
  const router = express.Router();

  const paymentOptions = {
    price: X402_API_PRICE_EXA_SEARCH_USD,
    description: "EXA AI web search – dynamic search with configurable options (numResults, type, contents)",
    method: "GET",
    discoverable: true,
    resource: "/v2/exa-search",
    inputSchema: {
      queryParams: {
        query: {
          type: "string",
          required: true,
          description: "Search query (e.g. latest news on Nvidia, crypto market analysis)",
        },
        numResults: {
          type: "number",
          required: false,
          description: "Number of results (1–100). Default 10.",
        },
        type: {
          type: "string",
          required: false,
          description: "Search type: auto, keyword, neural, fast, or deep",
        },
        contents: {
          type: "string",
          required: false,
          description: "JSON object for content options, e.g. {\"highlights\":{\"maxCharacters\":4000}} or {\"text\":true}",
        },
      },
    },
    outputSchema: {
      query: { type: "string", description: "The search query" },
      results: { type: "array", description: "EXA search results with title, url, score, highlights/text" },
      autopromptString: { type: "string", description: "EXA autoprompt if used" },
    },
  };

  // GET /v2/exa-search?query=...&numResults=10&type=auto&contents={...}
  router.get(
    "/",
    requirePayment(paymentOptions),
    async (req, res) => {
      const query = (req.query.query ?? "").trim();
      if (!query) {
        res.status(400).json({ error: "query is required" });
        return;
      }
      const built = buildSearchOptions(req.query);
      const options = { ...defaultSearchOptions, ...built };

      try {
        const exa = getExaClient();
        const result = await exa.search(query, options);
        await settlePaymentAndSetResponse(res, req);
        res.json({
          query,
          results: result.results ?? [],
          autopromptString: result.autopromptString ?? null,
        });
      } catch (err) {
        const message = err?.message ?? String(err);
        if (message.includes("EXA_API_KEY")) {
          res.status(503).json({ error: "EXA search is not configured", message });
          return;
        }
        res.status(500).json({
          error: "EXA search failed",
          message,
        });
      }
    }
  );

  // POST /v2/exa-search – body: { query, numResults?, type?, contents?, ... } (fully dynamic)
  const postPaymentOptions = {
    ...paymentOptions,
    method: "POST",
    inputSchema: {
      bodyType: "json",
      bodyFields: {
        query: {
          type: "string",
          required: true,
          description: "Search query",
        },
        numResults: {
          type: "number",
          required: false,
          description: "Number of results (1–100)",
        },
        type: {
          type: "string",
          required: false,
          description: "Search type: auto, keyword, neural, fast, deep",
        },
        contents: {
          type: "object",
          required: false,
          description: "Content options, e.g. { highlights: { maxCharacters: 4000 } } or { text: true }",
        },
      },
    },
  };

  router.post(
    "/",
    requirePayment(postPaymentOptions),
    async (req, res) => {
      const body = req.body && typeof req.body === "object" ? req.body : {};
      const query = (body.query ?? "").trim();
      if (!query) {
        res.status(400).json({ error: "query is required" });
        return;
      }
      const built = buildSearchOptions(body);
      const options = { ...defaultSearchOptions, ...built };

      try {
        const exa = getExaClient();
        const result = await exa.search(query, options);
        await settlePaymentAndSetResponse(res, req);
        res.json({
          query,
          results: result.results ?? [],
          autopromptString: result.autopromptString ?? null,
        });
      } catch (err) {
        const message = err?.message ?? String(err);
        if (message.includes("EXA_API_KEY")) {
          res.status(503).json({ error: "EXA search is not configured", message });
          return;
        }
        res.status(500).json({
          error: "EXA search failed",
          message,
        });
      }
    }
  );

  return router;
}
