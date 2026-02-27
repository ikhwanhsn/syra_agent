/**
 * v2 x402 API: EXA search – dynamic web search via Exa AI.
 * Uses EXA_API_KEY from env. Only the search query is dynamic; options (numResults, type, contents) are fixed.
 */
import express from "express";
import { getV2Payment } from "../utils/getV2Payment.js";
import Exa from "exa-js";
import { X402_API_PRICE_EXA_SEARCH_USD } from "../config/x402Pricing.js";

const { requirePayment, settlePaymentAndSetResponse } = await getV2Payment();

function getExaClient() {
  const key = (process.env.EXA_API_KEY || "").trim();
  if (!key) {
    throw new Error("EXA_API_KEY is not set. Add it to your .env.");
  }
  return new Exa(key);
}

/** Fixed EXA search options (only query is dynamic). */
const searchOptions = {
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
    description: "EXA AI web search – dynamic query only (e.g. latest news on Nvidia, crypto market analysis)",
    method: "GET",
    discoverable: true,
    resource: "/exa-search",
    inputSchema: {
      queryParams: {
        query: {
          type: "string",
          required: true,
          description: "Search query (e.g. latest news on Nvidia, crypto market analysis)",
        },
      },
    },
    outputSchema: {
      query: { type: "string", description: "The search query" },
      results: { type: "array", description: "EXA search results with title, url, score, highlights/text" },
      autopromptString: { type: "string", description: "EXA autoprompt if used" },
    },
  };

  // GET /exa-search?query=...
  router.get(
    "/",
    requirePayment(paymentOptions),
    async (req, res) => {
      const query = (req.query.query ?? "").trim();
      if (!query) {
        res.status(400).json({ error: "query is required" });
        return;
      }

      try {
        const exa = getExaClient();
        const result = await exa.search(query, searchOptions);
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

  // POST /exa-search – body: { query } (only query is dynamic)
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
      },
    },
  };

  router.post(
    "/",
    requirePayment(postPaymentOptions),
    async (req, res) => {
      const body = req.body && typeof req.body === "object" ? req.body : {};
      // Accept query from body (POST JSON) or from URL query string (e.g. playground sends params in URL)
      const query = (body.query ?? req.query?.query ?? "").trim();
      if (!query) {
        res.status(400).json({ error: "query is required" });
        return;
      }

      try {
        const exa = getExaClient();
        const result = await exa.search(query, searchOptions);
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
