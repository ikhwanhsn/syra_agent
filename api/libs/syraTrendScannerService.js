import crypto from "crypto";
import mongoose from "mongoose";
import { callOpenRouter } from "./openrouter.js";
import { OPENROUTER_DEFAULT_MODEL } from "../config/openrouterModels.js";
import { isMongooseConnected } from "../config/mongoose.js";
import InternalTrendScanPost from "../models/InternalTrendScanPost.js";
import { SYRA_NARRATIVE_THEMES } from "../config/syraNarrativeConfig.js";
import {
  SYRA_TREND_SCANNER_BRAND_CONTEXT,
  SYRA_TREND_SCANNER_DEFAULT_WOEID,
  SYRA_TREND_SCANNER_EXISTING_SAMPLE,
  SYRA_TREND_SCANNER_MAX_RETRIES,
  SYRA_TREND_SCANNER_MAX_TRENDS,
  SYRA_TREND_SCANNER_SYSTEM_RULES,
  SYRA_TREND_SCANNER_WOEIDS,
} from "../config/syraTrendScannerConfig.js";
import { trimInternalToolHistory, INTERNAL_TOOLS_HISTORY_MAX } from "./internalToolsHistory.js";
import { advancedSearch, getTrends, isTwitterApiIoConfigured } from "./twitterApiIoClient.js";

function normalizeText(text) {
  return String(text || "").toLowerCase().replace(/\s+/g, " ").trim();
}

function contentHash(text) {
  return crypto.createHash("sha256").update(normalizeText(text)).digest("hex");
}

function assertMongo() {
  if (!isMongooseConnected()) {
    const err = new Error("mongodb_not_connected");
    err.code = "mongodb_not_connected";
    throw err;
  }
}

function isValidId(id) {
  return typeof id === "string" && mongoose.Types.ObjectId.isValid(id.trim());
}

function assertTwitter() {
  if (!isTwitterApiIoConfigured()) {
    const err = new Error("TWITTER_API_KEY is not configured");
    err.code = "twitterapi_unavailable";
    throw err;
  }
}

function resolveWoeid(woeidId) {
  if (woeidId == null) return SYRA_TREND_SCANNER_DEFAULT_WOEID;
  const row = SYRA_TREND_SCANNER_WOEIDS.find((w) => w.id === String(woeidId));
  if (row) return row.woeid;
  const n = Number(woeidId);
  return Number.isFinite(n) ? Math.floor(n) : SYRA_TREND_SCANNER_DEFAULT_WOEID;
}

function heuristicRelevance(trendName) {
  const lower = trendName.toLowerCase();
  const keywords = [
    "ai", "agent", "crypto", "solana", "sol", "defi", "bitcoin", "btc", "eth",
    "token", "pump", "web3", "blockchain", "x402", "machine",
  ];
  let score = 0;
  for (const kw of keywords) {
    if (lower.includes(kw)) score += 15;
  }
  for (const theme of SYRA_NARRATIVE_THEMES) {
    const words = theme.label.toLowerCase().split(/\s+/);
    for (const w of words) {
      if (w.length > 3 && lower.includes(w)) score += 8;
    }
  }
  return Math.min(100, score);
}

async function scoreTrendsWithLlm(trends) {
  if (trends.length === 0) return [];

  const trendList = trends.map((t, i) => `${i + 1}. ${t.name}`).join("\n");
  const themes = SYRA_NARRATIVE_THEMES.map((t) => `- ${t.label}: ${t.angle}`).join("\n");

  try {
    const result = await callOpenRouter(
      [
        {
          role: "system",
          content: `You score X trends for relevance to Syra (agent economy, x402, machine money on Solana, $SYRA).
Return ONLY valid JSON array: [{"index":1,"score":0-100,"angle":"short suggested post angle","syraFit":"high|medium|low"}]
No markdown, no explanation.`,
        },
        {
          role: "user",
          content: `SYRA THEMES:\n${themes}\n\nTRENDS:\n${trendList}\n\nScore each trend:`,
        },
      ],
      { max_tokens: 1200, temperature: 0.4, model: OPENROUTER_DEFAULT_MODEL },
    );

    const raw = String(result.response || "").trim();
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error("no json array");
    const parsed = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(parsed)) throw new Error("not array");

    return trends.map((t, idx) => {
      const row = parsed.find((p) => Number(p.index) === idx + 1) ?? parsed[idx];
      const score = Number(row?.score);
      const heuristic = heuristicRelevance(t.name);
      const combined = Number.isFinite(score) ? Math.round(score * 0.7 + heuristic * 0.3) : heuristic;
      return {
        name: t.name,
        rank: t.rank,
        relevanceScore: combined,
        angle: String(row?.angle || "Connect trend to agent economy infrastructure on Solana").trim(),
        syraFit: ["high", "medium", "low"].includes(row?.syraFit) ? row.syraFit : combined >= 60 ? "high" : combined >= 35 ? "medium" : "low",
        sampleTweet: null,
      };
    });
  } catch (e) {
    console.warn("[trend-scanner] LLM scoring fallback:", e?.message || e);
    return trends.map((t) => ({
      name: t.name,
      rank: t.rank,
      relevanceScore: heuristicRelevance(t.name),
      angle: "Bridge this trend to Syra's agent economy thesis",
      syraFit: heuristicRelevance(t.name) >= 50 ? "medium" : "low",
      sampleTweet: null,
    }));
  }
}

export async function scanNarrativeTrends(opts = {}) {
  assertTwitter();
  const woeid = resolveWoeid(opts.woeid);

  const { trends: rawTrends } = await getTrends(woeid);
  const limited = rawTrends.slice(0, SYRA_TREND_SCANNER_MAX_TRENDS);
  let scored = await scoreTrendsWithLlm(limited);

  const topTrend = scored.sort((a, b) => b.relevanceScore - a.relevanceScore)[0];
  if (topTrend?.name) {
    try {
      const search = await advancedSearch({
        query: `"${topTrend.name.replace(/"/g, "")}" lang:en -is:retweet min_faves:5 within_time:24h`,
        queryType: "Latest",
      });
      const sample = search.tweets[0];
      if (sample) {
        topTrend.sampleTweet = {
          id: sample.id,
          text: sample.text.slice(0, 280),
          url: sample.url,
          author: sample.author.userName,
        };
      }
    } catch {
      // optional enrichment
    }
  }

  scored = scored.sort((a, b) => b.relevanceScore - a.relevanceScore);

  return {
    success: true,
    data: {
      trends: scored,
      meta: { woeid, rawCount: rawTrends.length, returnedCount: scored.length, updatedAt: new Date().toISOString() },
    },
  };
}

function mapDoc(d) {
  return {
    id: String(d._id),
    text: d.text,
    trendText: d.trendText,
    angle: d.angle || "",
    relevanceScore: d.relevanceScore ?? 0,
    createdAt: d.createdAt ? new Date(d.createdAt).toISOString() : undefined,
    createdByWallet: d.createdByWallet ?? null,
  };
}

async function fetchExistingTexts(limit = SYRA_TREND_SCANNER_EXISTING_SAMPLE) {
  assertMongo();
  const docs = await InternalTrendScanPost.find({}).sort({ createdAt: -1 }).limit(limit).select("text").lean();
  return docs.map((d) => String(d.text || "").trim()).filter(Boolean);
}

export async function generateTrendPost({ trendText, angle, relevanceScore, wallet }) {
  assertMongo();
  const trimmedTrend = String(trendText || "").trim();
  const trimmedAngle = String(angle || "").trim();
  if (trimmedTrend.length < 2) {
    const err = new Error("Trend text is required");
    err.code = "invalid_source";
    throw err;
  }

  const existingTexts = await fetchExistingTexts();

  for (let attempt = 1; attempt <= SYRA_TREND_SCANNER_MAX_RETRIES; attempt++) {
    const result = await callOpenRouter(
      [
        { role: "system", content: `${SYRA_TREND_SCANNER_SYSTEM_RULES}\n\n${SYRA_TREND_SCANNER_BRAND_CONTEXT}\nAttempt ${attempt}.` },
        {
          role: "user",
          content: `Write one trend-hijack X post.\n\nTRENDING TOPIC: ${trimmedTrend}\nSUGGESTED ANGLE: ${trimmedAngle || "Connect to Syra agent economy"}\n${existingTexts.length ? `\nAVOID REPEATING:\n${existingTexts.slice(0, 15).join("\n")}` : ""}\n\nPost:`,
        },
      ],
      { max_tokens: 500, temperature: 0.9, model: OPENROUTER_DEFAULT_MODEL },
    );

    const text = String(result.response || "").trim().replace(/^["'`]+|["'`]+$/g, "").replace(/^Post:\s*/i, "").trim();
    if (!text || text.length < 40) continue;

    const hash = contentHash(text);
    if (await InternalTrendScanPost.exists({ contentHash: hash })) {
      existingTexts.unshift(text);
      continue;
    }

    try {
      const doc = await InternalTrendScanPost.create({
        contentHash: hash,
        text,
        trendText: trimmedTrend.slice(0, 500),
        angle: trimmedAngle.slice(0, 500),
        relevanceScore: Number(relevanceScore) || 0,
        createdByWallet: wallet ? String(wallet).trim() : null,
      });
      await trimInternalToolHistory(InternalTrendScanPost);
      return { success: true, data: mapDoc(doc) };
    } catch (e) {
      if (e?.code === 11000) {
        existingTexts.unshift(text);
        continue;
      }
      throw e;
    }
  }

  const err = new Error("Could not generate a unique trend post. Try again.");
  err.code = "unique_generation_failed";
  throw err;
}

export async function listRecentTrendScanPosts(opts = {}) {
  assertMongo();
  const limit = Math.min(Math.max(opts.limit ?? INTERNAL_TOOLS_HISTORY_MAX, 1), INTERNAL_TOOLS_HISTORY_MAX);
  const docs = await InternalTrendScanPost.find({}).sort({ createdAt: -1 }).limit(limit).lean();
  return { success: true, data: docs.map(mapDoc), total: docs.length };
}

export async function deleteTrendScanPost(id) {
  assertMongo();
  if (!isValidId(id)) {
    const err = new Error("Trend scan post not found");
    err.code = "not_found";
    throw err;
  }
  const doc = await InternalTrendScanPost.findByIdAndDelete(id).select("_id").lean();
  if (!doc) {
    const err = new Error("Trend scan post not found");
    err.code = "not_found";
    throw err;
  }
  return { success: true, deletedId: String(doc._id) };
}
