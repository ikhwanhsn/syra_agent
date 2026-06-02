/**
 * S3Labs News Agent — pick the single hottest web3/crypto/developer headline (Bahasa Indonesia).
 * Grounded only on provided article payloads; JSON-validated output.
 */

import { callOpenRouter } from "../libs/openrouter.js";
import { parseJsonObjectFromLlm } from "../libs/llmJsonObjectParse.js";
import {
  resolveInternalPipelineModel,
  INTERNAL_PIPELINE_MAX_COMPLETION_TOKENS,
} from "../config/internalPipelineAgents.js";

/**
 * @typedef {'crypto' | 'web3' | 'developer'} S3labsNewsCategory
 */

/**
 * @typedef {{
 *   category: S3labsNewsCategory;
 *   title: string;
 *   summary: string;
 *   whyItMatters: string;
 *   url: string;
 *   source: string;
 *   heatScore?: number;
 * }} S3labsNewsItem
 */

/**
 * @typedef {{
 *   pick: S3labsNewsItem | null;
 *   generatedAt: string;
 *   sourceStats: { articleCount: number; candidateCount?: number; cryptoCount?: number; devCount?: number };
 * }} S3labsNewsOutput
 */

/**
 * @typedef {{
 *   id: string;
 *   title: string;
 *   description: string;
 *   url: string;
 *   source: string;
 *   publishedAt: string;
 * }} CompactArticle
 */

/**
 * @typedef {{ articles: CompactArticle[]; model?: string | null; sourceStats?: { articleCount: number; candidateCount?: number; cryptoCount?: number; devCount?: number } }} S3labsNewsAgentInput
 */

const VALID_CATEGORIES = new Set(["crypto", "web3", "developer"]);

const CATEGORY_LABEL_ID = {
  crypto: "Crypto",
  web3: "Web3",
  developer: "Developer",
};

/**
 * @param {unknown} category
 * @returns {S3labsNewsCategory}
 */
function coerceCategory(category) {
  const c = String(category || "").trim().toLowerCase();
  if (VALID_CATEGORIES.has(c)) return /** @type {S3labsNewsCategory} */ (c);
  return "web3";
}

/**
 * @param {CompactArticle} article
 * @returns {S3labsNewsItem}
 */
function articleToFallbackPick(article) {
  return {
    category: "web3",
    title: article.title.slice(0, 200),
    summary:
      article.description.slice(0, 220) ||
      "Berita terbaru dari sumber terpercaya di ekosistem web3 dan teknologi.",
    whyItMatters: "Isu ini sedang ramai dibahas dan berpotensi mempengaruhi pasar atau developer.",
    url: article.url,
    source: article.source,
  };
}

/**
 * @param {unknown} obj
 * @param {CompactArticle[]} articles
 * @returns {S3labsNewsItem | null}
 */
function coercePick(obj, articles) {
  const root = obj && typeof obj === "object" ? /** @type {Record<string, unknown>} */ (obj) : {};
  const raw =
    root.pick && typeof root.pick === "object"
      ? root.pick
      : Array.isArray(root.items) && root.items[0] && typeof root.items[0] === "object"
        ? root.items[0]
        : root.item && typeof root.item === "object"
          ? root.item
          : null;

  if (!raw || typeof raw !== "object") return null;

  const x = /** @type {Record<string, unknown>} */ (raw);
  const title = String(x.title || x.judul || "").trim();
  if (!title) return null;

  const url = String(x.url || "").trim();
  const articleByUrl = new Map(articles.map((a) => [a.url.toLowerCase(), a]));
  const sourceArticle = url ? articleByUrl.get(url.toLowerCase()) : undefined;

  return {
    category: coerceCategory(x.category || x.kategori),
    title: title.slice(0, 200),
    summary: String(x.summary || x.ringkasan || "").slice(0, 350),
    whyItMatters: String(x.whyItMatters || x.mengapaPenting || x.kenapaPenting || "").slice(0, 250),
    url: url || sourceArticle?.url || "",
    source: String(x.source || x.sumber || sourceArticle?.source || "unknown").slice(0, 80),
    heatScore: typeof x.heatScore === "number" ? x.heatScore : undefined,
  };
}

/**
 * @param {CompactArticle[]} articles
 * @param {{ articleCount: number; candidateCount?: number; cryptoCount?: number; devCount?: number }} sourceStats
 * @returns {S3labsNewsOutput}
 */
function buildFallbackOutput(articles, sourceStats) {
  const pick = articles.length > 0 ? articleToFallbackPick(articles[0]) : null;
  return {
    pick,
    generatedAt: new Date().toISOString(),
    sourceStats: {
      articleCount: sourceStats.articleCount,
      candidateCount: sourceStats.candidateCount,
      cryptoCount: sourceStats.cryptoCount,
      devCount: sourceStats.devCount,
    },
  };
}

/**
 * Pick the single hottest headline for S3Labs Telegram (Bahasa Indonesia).
 * @param {S3labsNewsAgentInput} input
 * @returns {Promise<S3labsNewsOutput>}
 */
export async function runS3labsNewsAgent(input) {
  const articles = input.articles || [];
  const sourceStats = input.sourceStats || { articleCount: articles.length };

  if (articles.length === 0) {
    return {
      pick: null,
      generatedAt: new Date().toISOString(),
      sourceStats: {
        articleCount: 0,
        candidateCount: sourceStats.candidateCount,
        cryptoCount: sourceStats.cryptoCount,
        devCount: sourceStats.devCount,
      },
    };
  }

  if (!process.env.OPENROUTER_API_KEY) {
    console.warn("[s3labs-news-agent] OPENROUTER_API_KEY missing; using deterministic fallback");
    return buildFallbackOutput(articles, sourceStats);
  }

  const modelId = resolveInternalPipelineModel(input.model ?? null);

  const messages = [
    {
      role: "system",
      content: `Kamu adalah kurator berita untuk komunitas S3Labs (web3, crypto, developer).
Dari daftar artikel yang diberikan, pilih SATU berita TERPANAS (paling viral, dampak pasar/ekosistem besar, atau sangat relevan untuk builder).

Output HANYA JSON:
{
  "pick": {
    "category": "crypto" | "web3" | "developer",
    "title": string (judul dalam Bahasa Indonesia, natural),
    "summary": string (2 kalimat ringkas dalam Bahasa Indonesia),
    "whyItMatters": string (1 kalimat: mengapa komunitas harus tahu),
    "url": string (harus persis dari artikel sumber),
    "source": string,
    "heatScore": number (0-1, estimasi seberapa panas beritanya)
  }
}

Aturan:
- Hanya SATU pick. Jangan kirim daftar.
- Semua teks (title, summary, whyItMatters) dalam Bahasa Indonesia yang natural.
- Jangan mengarang fakta di luar judul/deskripsi artikel.
- Prioritaskan berita terbaru dan berdampak tinggi.
- Tanpa markdown fence.`,
    },
    {
      role: "user",
      content: JSON.stringify({ articles, instruction: "Pilih 1 berita terpanas saja." }),
    },
  ];

  try {
    const { response } = await callOpenRouter(messages, {
      model: modelId,
      max_tokens: INTERNAL_PIPELINE_MAX_COMPLETION_TOKENS.internalResearch,
      temperature: 0.2,
      response_format: { type: "json_object" },
    });

    const parsed = parseJsonObjectFromLlm(response);
    const pick = coercePick(parsed, articles);

    if (!pick) {
      console.warn("[s3labs-news-agent] LLM returned no pick; using fallback");
      return buildFallbackOutput(articles, sourceStats);
    }

    return {
      pick,
      generatedAt: new Date().toISOString(),
      sourceStats: {
        articleCount: sourceStats.articleCount,
        candidateCount: sourceStats.candidateCount,
        cryptoCount: sourceStats.cryptoCount,
        devCount: sourceStats.devCount,
      },
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn("[s3labs-news-agent] LLM failed, using fallback:", msg);
    return buildFallbackOutput(articles, sourceStats);
  }
}

/** @type {Record<S3labsNewsCategory, string>} */
export { CATEGORY_LABEL_ID };
