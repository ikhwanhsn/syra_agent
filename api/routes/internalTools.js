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
import {
  deleteEngagementReply,
  draftEngagementReply,
  findOpportunities,
  listRecentEngagementReplies,
} from "../libs/syraEngagementRadarService.js";
import {
  gatherHolderPulseSnapshot,
  generateHolderPulsePost,
  listRecentHolderPulsePosts,
  deleteHolderPulsePost,
} from "../libs/syraHolderPulseService.js";
import {
  scanNarrativeTrends,
  generateTrendPost,
  listRecentTrendScanPosts,
  deleteTrendScanPost,
} from "../libs/syraTrendScannerService.js";
import {
  getFounderPulse,
  listRecentFounderPulseSnapshots,
} from "../libs/syraFounderPulseService.js";
import {
  triageMentions,
  draftMentionReply,
  listRecentMentionReplies,
  deleteMentionReply,
} from "../libs/syraMentionTriageService.js";
import {
  trackKols,
  draftKolEngagement,
  listRecentKolEngagements,
  deleteKolEngagement,
} from "../libs/syraKolTrackerService.js";
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
  if (code === "twitterapi_unavailable" || code === "twitterapi_error") {
    return res.status(503).json({
      success: false,
      error: code,
      message: error instanceof Error ? error.message : String(error),
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
    code === "invalid_query" ||
    code === "invalid_handle" ||
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

  router.post("/tools/engagement-radar/search", async (req, res) => {
    try {
      const topics = Array.isArray(req.body?.topics) ? req.body.topics : undefined;
      const keyword = typeof req.body?.keyword === "string" ? req.body.keyword : "";
      const minFaves = req.body?.minFaves;
      const window = typeof req.body?.window === "string" ? req.body.window.trim() : undefined;
      const queryType = req.body?.queryType === "Top" ? "Top" : "Latest";

      const result = await findOpportunities({ topics, keyword, minFaves, window, queryType });
      return res.json(result);
    } catch (error) {
      return toolsErrorResponse(res, error);
    }
  });

  router.post("/tools/engagement-radar/draft-reply", async (req, res) => {
    try {
      const tweetId = typeof req.body?.tweetId === "string" ? req.body.tweetId : "";
      const tweetText = typeof req.body?.tweetText === "string" ? req.body.tweetText : "";
      const authorHandle = typeof req.body?.authorHandle === "string" ? req.body.authorHandle : "";
      const toneId = typeof req.body?.tone === "string" ? req.body.tone.trim() : null;
      const wallet =
        typeof req.body?.wallet === "string" && req.body.wallet.trim()
          ? req.body.wallet.trim()
          : null;

      const result = await draftEngagementReply({
        tweetId,
        tweetText,
        authorHandle,
        wallet,
        toneId,
      });
      return res.json(result);
    } catch (error) {
      return toolsErrorResponse(res, error);
    }
  });

  router.get("/tools/engagement-radar/recent", async (req, res) => {
    try {
      const limit = Number.parseInt(String(req.query.limit ?? String(INTERNAL_TOOLS_HISTORY_MAX)), 10);
      const result = await listRecentEngagementReplies({ limit });
      return res.json(result);
    } catch (error) {
      return toolsErrorResponse(res, error);
    }
  });

  router.delete("/tools/engagement-radar/:id", async (req, res) => {
    try {
      const result = await deleteEngagementReply(req.params.id);
      return res.json(result);
    } catch (error) {
      return toolsErrorResponse(res, error);
    }
  });

  router.get("/tools/holder-pulse/snapshot", async (_req, res) => {
    try {
      const result = await gatherHolderPulseSnapshot();
      return res.json(result);
    } catch (error) {
      return toolsErrorResponse(res, error);
    }
  });

  router.post("/tools/holder-pulse/generate", async (req, res) => {
    try {
      const angle = typeof req.body?.angle === "string" ? req.body.angle.trim() : null;
      const wallet =
        typeof req.body?.wallet === "string" && req.body.wallet.trim()
          ? req.body.wallet.trim()
          : null;
      const result = await generateHolderPulsePost({ angleId: angle, wallet });
      return res.json(result);
    } catch (error) {
      return toolsErrorResponse(res, error);
    }
  });

  router.get("/tools/holder-pulse/recent", async (req, res) => {
    try {
      const limit = Number.parseInt(String(req.query.limit ?? String(INTERNAL_TOOLS_HISTORY_MAX)), 10);
      const result = await listRecentHolderPulsePosts({ limit });
      return res.json(result);
    } catch (error) {
      return toolsErrorResponse(res, error);
    }
  });

  router.delete("/tools/holder-pulse/:id", async (req, res) => {
    try {
      const result = await deleteHolderPulsePost(req.params.id);
      return res.json(result);
    } catch (error) {
      return toolsErrorResponse(res, error);
    }
  });

  router.post("/tools/trend-scanner/scan", async (req, res) => {
    try {
      const woeid = req.body?.woeid;
      const result = await scanNarrativeTrends({ woeid });
      return res.json(result);
    } catch (error) {
      return toolsErrorResponse(res, error);
    }
  });

  router.post("/tools/trend-scanner/generate", async (req, res) => {
    try {
      const trendText = typeof req.body?.trendText === "string" ? req.body.trendText : "";
      const angle = typeof req.body?.angle === "string" ? req.body.angle : "";
      const relevanceScore = Number(req.body?.relevanceScore);
      const wallet =
        typeof req.body?.wallet === "string" && req.body.wallet.trim()
          ? req.body.wallet.trim()
          : null;
      const result = await generateTrendPost({
        trendText,
        angle,
        relevanceScore: Number.isFinite(relevanceScore) ? relevanceScore : 0,
        wallet,
      });
      return res.json(result);
    } catch (error) {
      return toolsErrorResponse(res, error);
    }
  });

  router.get("/tools/trend-scanner/recent", async (req, res) => {
    try {
      const limit = Number.parseInt(String(req.query.limit ?? String(INTERNAL_TOOLS_HISTORY_MAX)), 10);
      const result = await listRecentTrendScanPosts({ limit });
      return res.json(result);
    } catch (error) {
      return toolsErrorResponse(res, error);
    }
  });

  router.delete("/tools/trend-scanner/:id", async (req, res) => {
    try {
      const result = await deleteTrendScanPost(req.params.id);
      return res.json(result);
    } catch (error) {
      return toolsErrorResponse(res, error);
    }
  });

  router.post("/tools/founder-pulse/analyze", async (req, res) => {
    try {
      const handle = typeof req.body?.handle === "string" ? req.body.handle.trim() : "";
      const wallet =
        typeof req.body?.wallet === "string" && req.body.wallet.trim()
          ? req.body.wallet.trim()
          : null;
      const result = await getFounderPulse({ handle: handle || undefined, wallet });
      return res.json(result);
    } catch (error) {
      return toolsErrorResponse(res, error);
    }
  });

  router.get("/tools/founder-pulse/recent", async (req, res) => {
    try {
      const limit = Number.parseInt(String(req.query.limit ?? String(INTERNAL_TOOLS_HISTORY_MAX)), 10);
      const handle = typeof req.query.handle === "string" ? req.query.handle.trim() : undefined;
      const result = await listRecentFounderPulseSnapshots({ limit, handle });
      return res.json(result);
    } catch (error) {
      return toolsErrorResponse(res, error);
    }
  });

  router.post("/tools/mention-triage/scan", async (req, res) => {
    try {
      const handle = typeof req.body?.handle === "string" ? req.body.handle.trim() : "";
      const result = await triageMentions({ handle: handle || undefined });
      return res.json(result);
    } catch (error) {
      return toolsErrorResponse(res, error);
    }
  });

  router.post("/tools/mention-triage/draft-reply", async (req, res) => {
    try {
      const tweetId = typeof req.body?.tweetId === "string" ? req.body.tweetId : "";
      const tweetText = typeof req.body?.tweetText === "string" ? req.body.tweetText : "";
      const authorHandle = typeof req.body?.authorHandle === "string" ? req.body.authorHandle : "";
      const category = typeof req.body?.category === "string" ? req.body.category.trim() : "question";
      const toneId = typeof req.body?.tone === "string" ? req.body.tone.trim() : null;
      const wallet =
        typeof req.body?.wallet === "string" && req.body.wallet.trim()
          ? req.body.wallet.trim()
          : null;
      const result = await draftMentionReply({
        tweetId,
        tweetText,
        authorHandle,
        category,
        toneId,
        wallet,
      });
      return res.json(result);
    } catch (error) {
      return toolsErrorResponse(res, error);
    }
  });

  router.get("/tools/mention-triage/recent", async (req, res) => {
    try {
      const limit = Number.parseInt(String(req.query.limit ?? String(INTERNAL_TOOLS_HISTORY_MAX)), 10);
      const result = await listRecentMentionReplies({ limit });
      return res.json(result);
    } catch (error) {
      return toolsErrorResponse(res, error);
    }
  });

  router.delete("/tools/mention-triage/:id", async (req, res) => {
    try {
      const result = await deleteMentionReply(req.params.id);
      return res.json(result);
    } catch (error) {
      return toolsErrorResponse(res, error);
    }
  });

  router.post("/tools/kol-tracker/track", async (req, res) => {
    try {
      const handles = Array.isArray(req.body?.handles) ? req.body.handles : undefined;
      const result = await trackKols({ handles });
      return res.json(result);
    } catch (error) {
      return toolsErrorResponse(res, error);
    }
  });

  router.post("/tools/kol-tracker/draft", async (req, res) => {
    try {
      const tweetId = typeof req.body?.tweetId === "string" ? req.body.tweetId : "";
      const tweetText = typeof req.body?.tweetText === "string" ? req.body.tweetText : "";
      const authorHandle = typeof req.body?.authorHandle === "string" ? req.body.authorHandle : "";
      const modeId = typeof req.body?.mode === "string" ? req.body.mode.trim() : null;
      const wallet =
        typeof req.body?.wallet === "string" && req.body.wallet.trim()
          ? req.body.wallet.trim()
          : null;
      const result = await draftKolEngagement({
        tweetId,
        tweetText,
        authorHandle,
        modeId,
        wallet,
      });
      return res.json(result);
    } catch (error) {
      return toolsErrorResponse(res, error);
    }
  });

  router.get("/tools/kol-tracker/recent", async (req, res) => {
    try {
      const limit = Number.parseInt(String(req.query.limit ?? String(INTERNAL_TOOLS_HISTORY_MAX)), 10);
      const result = await listRecentKolEngagements({ limit });
      return res.json(result);
    } catch (error) {
      return toolsErrorResponse(res, error);
    }
  });

  router.delete("/tools/kol-tracker/:id", async (req, res) => {
    try {
      const result = await deleteKolEngagement(req.params.id);
      return res.json(result);
    } catch (error) {
      return toolsErrorResponse(res, error);
    }
  });

  return router;
}
