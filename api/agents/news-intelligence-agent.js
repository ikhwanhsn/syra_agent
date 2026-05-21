/**
 * News intelligence agent — LLM classification for sentiment, trending, sundown digest.
 * Grounded only on provided article payloads; JSON-validated outputs.
 */

import { callOpenRouter } from "../libs/openrouter.js";
import { parseJsonObjectFromLlm } from "../libs/llmJsonObjectParse.js";
import {
  resolveInternalPipelineModel,
  INTERNAL_PIPELINE_MAX_COMPLETION_TOKENS,
} from "../config/internalPipelineAgents.js";

/**
 * @typedef {import("../libs/newsSources/rssParser.js").RawArticle} RawArticle
 */

/**
 * @typedef {'Positive' | 'Negative' | 'Neutral'} SentimentLabel
 */

/**
 * @typedef {{ sentiment: SentimentLabel; score: number }} SentimentResult
 */

/**
 * @typedef {{ headline: string; importance: number; articleId: string }} TrendingScore
 */

/**
 * @typedef {{ title: string; body: string; tickers?: string[] }} SundownItem
 */

const SENTIMENT_LABELS = new Set(["Positive", "Negative", "Neutral"]);

/**
 * @param {RawArticle[]} articles
 * @returns {Array<{ id: string; title: string; description: string }>}
 */
function compactArticlesForLlm(articles) {
  return articles.map((a) => ({
    id: a.id,
    title: a.title.slice(0, 200),
    description: a.description.slice(0, 400),
  }));
}

/**
 * @param {unknown} obj
 * @returns {Record<string, SentimentResult>}
 */
function coerceSentimentMap(obj) {
  if (!obj || typeof obj !== "object") {
    throw new Error("Invalid sentiment JSON shape");
  }
  const root = /** @type {Record<string, unknown>} */ (obj);
  const items = Array.isArray(root.classifications)
    ? root.classifications
    : Array.isArray(root.items)
      ? root.items
      : null;

  /** @type {Record<string, SentimentResult>} */
  const out = {};

  if (items) {
    for (const item of items) {
      if (!item || typeof item !== "object") continue;
      const x = /** @type {Record<string, unknown>} */ (item);
      const id = String(x.id || x.articleId || "").trim();
      if (!id) continue;
      const label = String(x.sentiment || x.label || "Neutral");
      const sentiment = SENTIMENT_LABELS.has(label) ? /** @type {SentimentLabel} */ (label) : "Neutral";
      const score = typeof x.score === "number" ? Math.max(-1, Math.min(1, x.score)) : sentiment === "Positive" ? 0.5 : sentiment === "Negative" ? -0.5 : 0;
      out[id] = { sentiment, score };
    }
    return out;
  }

  for (const [key, val] of Object.entries(root)) {
    if (key === "classifications" || key === "items") continue;
    if (!val || typeof val !== "object") continue;
    const x = /** @type {Record<string, unknown>} */ (val);
    const label = String(x.sentiment || x.label || "Neutral");
    const sentiment = SENTIMENT_LABELS.has(label) ? /** @type {SentimentLabel} */ (label) : "Neutral";
    const score = typeof x.score === "number" ? Math.max(-1, Math.min(1, x.score)) : 0;
    out[key] = { sentiment, score };
  }
  return out;
}

/**
 * Classify article sentiments via LLM (batched).
 * @param {RawArticle[]} articles
 * @param {{ model?: string | null }} [opts]
 * @returns {Promise<Record<string, SentimentResult>>}
 */
export async function classifyArticleSentiments(articles, opts = {}) {
  if (!process.env.OPENROUTER_API_KEY) {
    /** @type {Record<string, SentimentResult>} */
    const fallback = {};
    for (const a of articles) {
      fallback[a.id] = { sentiment: "Neutral", score: 0 };
    }
    return fallback;
  }

  if (articles.length === 0) return {};

  const modelId = resolveInternalPipelineModel(opts.model ?? null);
  const compact = compactArticlesForLlm(articles);

  const messages = [
    {
      role: "system",
      content: `You classify crypto news article sentiment for trading context. Output ONLY JSON:
{ "classifications": [ { "id": string, "sentiment": "Positive"|"Negative"|"Neutral", "score": number (-1 to 1) } ] }
Base judgments ONLY on the provided titles/descriptions. No markdown fences.`,
    },
    {
      role: "user",
      content: JSON.stringify({ articles: compact }),
    },
  ];

  try {
    const { response } = await callOpenRouter(messages, {
      model: modelId,
      max_tokens: INTERNAL_PIPELINE_MAX_COMPLETION_TOKENS.internalResearch,
      temperature: 0.15,
    });

    const parsed = parseJsonObjectFromLlm(response);
    const map = coerceSentimentMap(parsed);

    for (const a of articles) {
      if (!map[a.id]) map[a.id] = { sentiment: "Neutral", score: 0 };
    }
    return map;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn("[news-intelligence] sentiment LLM failed, using neutral fallback:", msg);
    /** @type {Record<string, SentimentResult>} */
    const fallback = {};
    for (const a of articles) {
      fallback[a.id] = { sentiment: "Neutral", score: 0 };
    }
    return fallback;
  }
}

/**
 * Score trending headlines (deterministic + optional LLM boost).
 * @param {RawArticle[]} articles
 * @param {{ limit?: number; model?: string | null }} [opts]
 * @returns {Promise<Array<{ headline: string; text: string; news_url: string; source_name: string; date: string; tickers: string[]; importance: number }>>}
 */
export async function scoreTrendingHeadlines(articles, opts = {}) {
  const limit = Math.min(50, Math.max(5, Number(opts.limit) || 20));

  if (articles.length === 0) return [];

  const titleCounts = new Map();
  for (const a of articles) {
    const key = a.title.toLowerCase().slice(0, 80);
    titleCounts.set(key, (titleCounts.get(key) || 0) + 1);
  }

  const now = Date.now();
  const scored = articles.map((a) => {
    const ageH = (now - new Date(a.publishedAt).getTime()) / (60 * 60 * 1000);
    const recency = Math.max(0, 1 - ageH / 48);
    const crossSource = titleCounts.get(a.title.toLowerCase().slice(0, 80)) || 1;
    const base = recency * 0.5 + Math.min(crossSource, 5) * 0.1 + (a.tickers.length > 0 ? 0.1 : 0);
    return { article: a, base };
  });

  scored.sort((x, y) => y.base - x.base);
  const top = scored.slice(0, Math.min(30, scored.length));

  let llmBoost = /** @type {Record<string, number>} */ ({});
  if (process.env.OPENROUTER_API_KEY && top.length > 0) {
    try {
      const modelId = resolveInternalPipelineModel(opts.model ?? null);
      const compact = top.map((t) => ({ id: t.article.id, title: t.article.title }));
      const messages = [
        {
          role: "system",
          content: `Rate crypto headline market importance 0-1. Output ONLY JSON: { "scores": [ { "id": string, "importance": number } ] }`,
        },
        { role: "user", content: JSON.stringify({ headlines: compact }) },
      ];
      const { response } = await callOpenRouter(messages, {
        model: modelId,
        max_tokens: 800,
        temperature: 0.2,
      });
      const parsed = parseJsonObjectFromLlm(response);
      const list = Array.isArray(parsed?.scores) ? parsed.scores : [];
      for (const s of list) {
        if (!s || typeof s !== "object") continue;
        const x = /** @type {Record<string, unknown>} */ (s);
        const id = String(x.id || "");
        if (id && typeof x.importance === "number") {
          llmBoost[id] = Math.max(0, Math.min(1, x.importance));
        }
      }
    } catch (err) {
      console.warn("[internal-news] trending LLM boost skipped:", err instanceof Error ? err.message : err);
    }
  }

  return top
    .map(({ article, base }) => {
      const boost = llmBoost[article.id] ?? 0.3;
      const importance = base * 0.6 + boost * 0.4;
      return {
        headline: article.title,
        text: article.description,
        news_url: article.url,
        source_name: article.source,
        date: article.publishedAt.slice(0, 10),
        tickers: article.tickers,
        importance,
      };
    })
    .sort((a, b) => b.importance - a.importance)
    .slice(0, limit);
}

/**
 * @param {RawArticle[]} articles
 * @param {{ model?: string | null }} [opts]
 * @returns {Promise<SundownItem[]>}
 */
export async function composeSundownDigest(articles, opts = {}) {
  const recent = articles
    .filter((a) => Date.now() - new Date(a.publishedAt).getTime() < 24 * 60 * 60 * 1000)
    .slice(0, 40);

  if (recent.length === 0 && articles.length > 0) {
    recent.push(...articles.slice(0, 20));
  }

  if (!process.env.OPENROUTER_API_KEY || recent.length === 0) {
    return recent.slice(0, 5).map((a) => ({
      title: a.title,
      body: a.description.slice(0, 300) || a.title,
      tickers: a.tickers,
    }));
  }

  const modelId = resolveInternalPipelineModel(opts.model ?? null);
  const compact = compactArticlesForLlm(recent);

  const messages = [
    {
      role: "system",
      content: `Write an end-of-day crypto market digest from ONLY the provided articles. Output ONLY JSON:
{ "digest": [ { "title": string, "body": string (1-3 sentences), "tickers": string[] } ] }
Exactly 5 items, highest market impact first. No invented facts. English.`,
    },
    { role: "user", content: JSON.stringify({ articles: compact }) },
  ];

  try {
    const { response } = await callOpenRouter(messages, {
      model: modelId,
      max_tokens: 1200,
      temperature: 0.25,
    });
    const parsed = parseJsonObjectFromLlm(response);
    const list = Array.isArray(parsed?.digest) ? parsed.digest : [];
    /** @type {SundownItem[]} */
    const out = [];
    for (const item of list) {
      if (!item || typeof item !== "object") continue;
      const x = /** @type {Record<string, unknown>} */ (item);
      const title = String(x.title || "").trim();
      if (!title) continue;
      out.push({
        title: title.slice(0, 200),
        body: String(x.body || x.text || "").slice(0, 600),
        tickers: Array.isArray(x.tickers) ? x.tickers.map(String).slice(0, 8) : [],
      });
    }
    if (out.length > 0) return out.slice(0, 8);
  } catch (err) {
    console.warn("[internal-news] sundown LLM failed:", err instanceof Error ? err.message : err);
  }

  return recent.slice(0, 5).map((a) => ({
    title: a.title,
    body: a.description.slice(0, 300) || a.title,
    tickers: a.tickers,
  }));
}

/**
 * Aggregate sentiment counts for a section from classifications.
 * @param {Record<string, SentimentResult>} classifications
 * @returns {{ Positive: number; Negative: number; Neutral: number; Total: number; sentiment_score: number; Sentiment_Score: number }}
 */
export function aggregateSentimentStats(classifications) {
  let Positive = 0;
  let Negative = 0;
  let Neutral = 0;
  const scores = [];

  for (const r of Object.values(classifications)) {
    if (r.sentiment === "Positive") Positive += 1;
    else if (r.sentiment === "Negative") Negative += 1;
    else Neutral += 1;
    scores.push(r.score);
  }

  const Total = Positive + Negative + Neutral;
  const sentiment_score =
    scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

  return {
    Positive,
    Negative,
    Neutral,
    Total,
    sentiment_score,
    Sentiment_Score: sentiment_score,
  };
}
