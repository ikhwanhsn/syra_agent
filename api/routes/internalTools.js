/**
 * Internal dashboard tools — narrative generator, etc.
 * API key auth (trusted origin inject), no x402.
 */
import express from "express";
import {
  createUniqueNarrativePost,
  deleteNarrativePost,
  listRecentNarrativePosts,
  rewriteNarrativePost,
} from "../libs/syraNarrativeGenerator.js";
import { getTrendingNarrativePreview } from "../libs/syraNarrativeTrendContext.js";
import {
  createUniqueQuoteResponse,
  deleteQuoteResponse,
  listRecentQuoteResponses,
} from "../libs/syraQuoteResponseGenerator.js";
import {
  createUniqueThreadExpand,
  deleteThreadExpand,
  listRecentThreadExpands,
} from "../libs/syraThreadExpanderGenerator.js";
import {
  createUniqueProofDrop,
  deleteProofDrop,
  getProofDropMetricsPreview,
  listRecentProofDrops,
} from "../libs/syraProofDropGenerator.js";
import {
  createUniqueCopyPolish,
  deleteCopyPolish,
  listRecentCopyPolishes,
} from "../libs/syraCopyPolisherGenerator.js";
import {
  createUniqueImagePrompt,
  deleteImagePrompt,
  listRecentImagePrompts,
} from "../libs/syraImagePromptGenerator.js";
import { INTERNAL_TOOLS_HISTORY_MAX } from "../libs/internalToolsHistory.js";

function toolsErrorResponse(res, error) {
  const code = error?.code;
  if (code === "mongodb_not_connected") {
    return res.status(503).json({
      success: false,
      error: "Database unavailable",
      message: "MongoDB is not connected. Narrative posts require database storage.",
    });
  }
  if (code === "not_found") {
    return res.status(404).json({
      success: false,
      error: "not_found",
      message: error instanceof Error ? error.message : String(error),
    });
  }
  if (
    code === "duplicate_text" ||
    code === "invalid_text" ||
    code === "invalid_instruction" ||
    code === "rewrite_failed" ||
    code === "trending_unavailable" ||
    code === "invalid_source" ||
    code === "unique_generation_failed"
  ) {
    const status =
      code === "rewrite_failed" ||
      code === "trending_unavailable" ||
      code === "unique_generation_failed"
        ? 409
        : 400;
    return res.status(status).json({
      success: false,
      error: code,
      message: error instanceof Error ? error.message : String(error),
    });
  }
  return res.status(500).json({
    success: false,
    error: "Internal server error",
    message: error instanceof Error ? error.message : String(error),
  });
}

export function createInternalToolsRouter() {
  const router = express.Router();

  router.post("/tools/narrative/generate", async (req, res) => {
    try {
      const wallet =
        typeof req.body?.wallet === "string" && req.body.wallet.trim()
          ? req.body.wallet.trim()
          : null;
      const mode = req.body?.mode === "trending" ? "trending" : "syra";

      const result = await createUniqueNarrativePost({ wallet, mode });
      return res.json(result);
    } catch (error) {
      if (error?.code === "unique_generation_failed") {
        return res.status(409).json({
          success: false,
          error: "unique_generation_failed",
          message: error instanceof Error ? error.message : String(error),
        });
      }
      return toolsErrorResponse(res, error);
    }
  });

  router.get("/tools/narrative/trending-preview", async (_req, res) => {
    try {
      const result = await getTrendingNarrativePreview();
      return res.json(result);
    } catch (error) {
      return toolsErrorResponse(res, error);
    }
  });

  router.get("/tools/narrative/recent", async (req, res) => {
    try {
      const limit = Number.parseInt(String(req.query.limit ?? String(INTERNAL_TOOLS_HISTORY_MAX)), 10);
      const result = await listRecentNarrativePosts({ limit });
      return res.json(result);
    } catch (error) {
      return toolsErrorResponse(res, error);
    }
  });

  router.patch("/tools/narrative/:id", async (req, res) => {
    try {
      const instruction = typeof req.body?.instruction === "string" ? req.body.instruction : "";
      const result = await rewriteNarrativePost(req.params.id, instruction);
      return res.json(result);
    } catch (error) {
      return toolsErrorResponse(res, error);
    }
  });

  router.delete("/tools/narrative/:id", async (req, res) => {
    try {
      const result = await deleteNarrativePost(req.params.id);
      return res.json(result);
    } catch (error) {
      return toolsErrorResponse(res, error);
    }
  });

  router.post("/tools/quote-response/generate", async (req, res) => {
    try {
      const sourcePost = typeof req.body?.sourcePost === "string" ? req.body.sourcePost : "";
      const toneId = typeof req.body?.tone === "string" ? req.body.tone.trim() : null;
      const wallet =
        typeof req.body?.wallet === "string" && req.body.wallet.trim()
          ? req.body.wallet.trim()
          : null;

      const result = await createUniqueQuoteResponse({ sourcePost, wallet, toneId });
      return res.json(result);
    } catch (error) {
      return toolsErrorResponse(res, error);
    }
  });

  router.get("/tools/quote-response/recent", async (req, res) => {
    try {
      const limit = Number.parseInt(String(req.query.limit ?? String(INTERNAL_TOOLS_HISTORY_MAX)), 10);
      const result = await listRecentQuoteResponses({ limit });
      return res.json(result);
    } catch (error) {
      return toolsErrorResponse(res, error);
    }
  });

  router.delete("/tools/quote-response/:id", async (req, res) => {
    try {
      const result = await deleteQuoteResponse(req.params.id);
      return res.json(result);
    } catch (error) {
      return toolsErrorResponse(res, error);
    }
  });

  router.post("/tools/thread-expander/generate", async (req, res) => {
    try {
      const sourceText = typeof req.body?.sourceText === "string" ? req.body.sourceText : "";
      const tweetCount = Number(req.body?.tweetCount);
      const wallet =
        typeof req.body?.wallet === "string" && req.body.wallet.trim()
          ? req.body.wallet.trim()
          : null;
      const result = await createUniqueThreadExpand({
        sourceText,
        wallet,
        tweetCount: Number.isFinite(tweetCount) ? tweetCount : null,
      });
      return res.json(result);
    } catch (error) {
      return toolsErrorResponse(res, error);
    }
  });

  router.get("/tools/thread-expander/recent", async (req, res) => {
    try {
      const limit = Number.parseInt(String(req.query.limit ?? String(INTERNAL_TOOLS_HISTORY_MAX)), 10);
      const result = await listRecentThreadExpands({ limit });
      return res.json(result);
    } catch (error) {
      return toolsErrorResponse(res, error);
    }
  });

  router.delete("/tools/thread-expander/:id", async (req, res) => {
    try {
      const result = await deleteThreadExpand(req.params.id);
      return res.json(result);
    } catch (error) {
      return toolsErrorResponse(res, error);
    }
  });

  router.get("/tools/proof-drop/metrics-preview", async (_req, res) => {
    try {
      const result = await getProofDropMetricsPreview();
      return res.json(result);
    } catch (error) {
      return toolsErrorResponse(res, error);
    }
  });

  router.post("/tools/proof-drop/generate", async (req, res) => {
    try {
      const angle = typeof req.body?.angle === "string" ? req.body.angle.trim() : null;
      const wallet =
        typeof req.body?.wallet === "string" && req.body.wallet.trim()
          ? req.body.wallet.trim()
          : null;
      const result = await createUniqueProofDrop({ wallet, angleId: angle });
      return res.json(result);
    } catch (error) {
      return toolsErrorResponse(res, error);
    }
  });

  router.get("/tools/proof-drop/recent", async (req, res) => {
    try {
      const limit = Number.parseInt(String(req.query.limit ?? String(INTERNAL_TOOLS_HISTORY_MAX)), 10);
      const result = await listRecentProofDrops({ limit });
      return res.json(result);
    } catch (error) {
      return toolsErrorResponse(res, error);
    }
  });

  router.delete("/tools/proof-drop/:id", async (req, res) => {
    try {
      const result = await deleteProofDrop(req.params.id);
      return res.json(result);
    } catch (error) {
      return toolsErrorResponse(res, error);
    }
  });

  router.post("/tools/copy-polisher/generate", async (req, res) => {
    try {
      const originalText = typeof req.body?.originalText === "string" ? req.body.originalText : "";
      const tone = typeof req.body?.tone === "string" ? req.body.tone.trim() : null;
      const direction = typeof req.body?.direction === "string" ? req.body.direction : "";
      const wallet =
        typeof req.body?.wallet === "string" && req.body.wallet.trim()
          ? req.body.wallet.trim()
          : null;
      const result = await createUniqueCopyPolish({
        originalText,
        wallet,
        toneId: tone,
        direction,
      });
      return res.json(result);
    } catch (error) {
      return toolsErrorResponse(res, error);
    }
  });

  router.get("/tools/copy-polisher/recent", async (req, res) => {
    try {
      const limit = Number.parseInt(String(req.query.limit ?? String(INTERNAL_TOOLS_HISTORY_MAX)), 10);
      const result = await listRecentCopyPolishes({ limit });
      return res.json(result);
    } catch (error) {
      return toolsErrorResponse(res, error);
    }
  });

  router.delete("/tools/copy-polisher/:id", async (req, res) => {
    try {
      const result = await deleteCopyPolish(req.params.id);
      return res.json(result);
    } catch (error) {
      return toolsErrorResponse(res, error);
    }
  });

  router.post("/tools/image-prompt/generate", async (req, res) => {
    try {
      const sourcePrompt = typeof req.body?.sourcePrompt === "string" ? req.body.sourcePrompt : "";
      const style = typeof req.body?.style === "string" ? req.body.style.trim() : null;
      const direction = typeof req.body?.direction === "string" ? req.body.direction : "";
      const wallet =
        typeof req.body?.wallet === "string" && req.body.wallet.trim()
          ? req.body.wallet.trim()
          : null;
      const result = await createUniqueImagePrompt({
        sourcePrompt,
        wallet,
        styleId: style,
        direction,
      });
      return res.json(result);
    } catch (error) {
      return toolsErrorResponse(res, error);
    }
  });

  router.get("/tools/image-prompt/recent", async (req, res) => {
    try {
      const limit = Number.parseInt(String(req.query.limit ?? String(INTERNAL_TOOLS_HISTORY_MAX)), 10);
      const result = await listRecentImagePrompts({ limit });
      return res.json(result);
    } catch (error) {
      return toolsErrorResponse(res, error);
    }
  });

  router.delete("/tools/image-prompt/:id", async (req, res) => {
    try {
      const result = await deleteImagePrompt(req.params.id);
      return res.json(result);
    } catch (error) {
      return toolsErrorResponse(res, error);
    }
  });

  return router;
}
