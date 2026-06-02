/**
 * Shared LLM pick-one for S3Labs agents (Bahasa Indonesia).
 */

import { callOpenRouter } from "../openrouter.js";
import { parseJsonObjectFromLlm } from "../llmJsonObjectParse.js";
import {
  resolveInternalPipelineModel,
  INTERNAL_PIPELINE_MAX_COMPLETION_TOKENS,
} from "../../config/internalPipelineAgents.js";
import { getS3labsAgentDefinition } from "../../config/s3labsAgentsConfig.js";

/**
 * @typedef {{
 *   title: string;
 *   summary: string;
 *   whyItMatters: string;
 *   url: string;
 *   source: string;
 *   category?: string;
 *   eventDate?: string;
 *   heatScore?: number;
 * }} S3labsPick
 */

/**
 * @typedef {{
 *   pick: S3labsPick | null;
 *   generatedAt: string;
 *   sourceStats: Record<string, number | undefined>;
 * }} S3labsPickOutput
 */

/**
 * @typedef {import("../../config/s3labsAgentsConfig.js").S3labsAgentKind} S3labsAgentKind
 */

const SYSTEM_PROMPTS = {
  news: `Kamu kurator berita untuk topik News di komunitas S3Labs (agent NEWS).
Pilih SATU berita TERPANAS seputar crypto, web3, pasar aset digital, regulasi, atau ekosistem blockchain.
JANGAN pilih artikel yang URL atau judulnya sudah ada di daftar excluded (sudah dipost agent lain).
Output HANYA JSON:
{ "pick": { "title": string (ID), "summary": string (2 kalimat ID), "whyItMatters": string (1 kalimat ID), "url": string, "source": string, "category": "crypto"|"web3", "heatScore": number } }
Tanpa mengarang fakta. Bahasa Indonesia natural.`,

  developer: `Kamu kurator untuk topik Developer di komunitas S3Labs (agent DEV).
Pilih SATU artikel/tool/riset TERPANAS untuk developer: engineering, open source, AI dev tools, infra, security, programming.
JANGAN pilih artikel yang URL atau judulnya sudah ada di daftar excluded.
Output HANYA JSON:
{ "pick": { "title": string (ID), "summary": string (2 kalimat ID), "whyItMatters": string (1 kalimat: relevansi untuk developer), "url": string, "source": string, "category": "developer", "heatScore": number } }
Tanpa mengarang fakta. Bahasa Indonesia natural.`,

  event: `Kamu kurator untuk topik Event di komunitas S3Labs (agent EVENT).
Pilih SATU event TERPENTING (hackathon, konferensi, TGE, listing, mainnet, meetup, AMA, deadline) yang paling relevan untuk komunitas crypto/web3.
JANGAN pilih event yang URL atau judulnya sudah ada di daftar excluded.
Output HANYA JSON:
{ "pick": { "title": string (ID), "summary": string (2 kalimat ID), "whyItMatters": string (1 kalimat: kenapa wajib dicatat), "url": string, "source": string, "category": "event", "eventDate": "YYYY-MM-DD", "heatScore": number } }
Prioritaskan event mendatang. Tanpa mengarang fakta. Bahasa Indonesia natural.`,
};

/**
 * @param {unknown} obj
 * @param {Array<{ url: string; source: string; eventDate?: string }>} articles
 * @returns {S3labsPick | null}
 */
function coercePick(obj, articles) {
  const root = obj && typeof obj === "object" ? /** @type {Record<string, unknown>} */ (obj) : {};
  const raw =
    root.pick && typeof root.pick === "object"
      ? root.pick
      : Array.isArray(root.items) && root.items[0]
        ? root.items[0]
        : null;
  if (!raw || typeof raw !== "object") return null;

  const x = /** @type {Record<string, unknown>} */ (raw);
  const title = String(x.title || x.judul || "").trim();
  if (!title) return null;

  const url = String(x.url || "").trim();
  const byUrl = new Map(articles.map((a) => [a.url.toLowerCase(), a]));
  const src = url ? byUrl.get(url.toLowerCase()) : undefined;

  return {
    title: title.slice(0, 200),
    summary: String(x.summary || x.ringkasan || "").slice(0, 350),
    whyItMatters: String(x.whyItMatters || x.mengapaPenting || "").slice(0, 250),
    url: url || src?.url || "",
    source: String(x.source || x.sumber || src?.source || "unknown").slice(0, 80),
    category: String(x.category || x.kategori || "").slice(0, 32) || undefined,
    eventDate: String(x.eventDate || x.tanggal || src?.eventDate || "").slice(0, 10) || undefined,
    heatScore: typeof x.heatScore === "number" ? x.heatScore : undefined,
  };
}

/**
 * @param {S3labsAgentKind} kind
 * @param {Array<{ title: string; description: string; url: string; source: string; publishedAt?: string; eventDate?: string }>} articles
 * @param {Record<string, number | undefined>} sourceStats
 * @returns {S3labsPickOutput}
 */
function fallbackOutput(kind, articles, sourceStats) {
  const a = articles[0];
  if (!a) {
    return { pick: null, generatedAt: new Date().toISOString(), sourceStats };
  }
  return {
    pick: {
      title: a.title.slice(0, 200),
      summary: a.description.slice(0, 220) || a.title,
      whyItMatters:
        kind === "event"
          ? "Event ini relevan untuk kalender komunitas S3Labs."
          : kind === "developer"
            ? "Wajib dibaca oleh builder dan engineer di ekosistem."
            : "Berpotensi mempengaruhi pasar dan ekosistem web3.",
      url: a.url,
      source: a.source,
      category: kind === "news" ? "web3" : kind,
      eventDate: a.eventDate,
    },
    generatedAt: new Date().toISOString(),
    sourceStats,
  };
}

/**
 * @param {S3labsAgentKind} kind
 * @param {Array<{ title: string; description: string; url: string; source: string; publishedAt?: string; eventDate?: string }>} articles
 * @param {Record<string, number | undefined>} sourceStats
 * @param {string | null} [model]
 * @param {{ excludedUrls?: string[]; excludedTitles?: string[] }} [dedupeHints]
 * @returns {Promise<S3labsPickOutput>}
 */
export async function runS3labsPickAgent(kind, articles, sourceStats, model = null, dedupeHints = {}) {
  getS3labsAgentDefinition(kind);

  if (articles.length === 0) {
    return { pick: null, generatedAt: new Date().toISOString(), sourceStats };
  }

  if (!process.env.OPENROUTER_API_KEY) {
    console.warn(`[s3labs-${kind}] OPENROUTER_API_KEY missing; fallback pick`);
    return fallbackOutput(kind, articles, sourceStats);
  }

  const modelId = resolveInternalPipelineModel(model);
  const messages = [
    { role: "system", content: SYSTEM_PROMPTS[kind] },
    {
      role: "user",
      content: JSON.stringify({
        articles,
        instruction: "Pilih tepat 1 item terpanas yang BELUM pernah dipost.",
        excludedUrls: dedupeHints.excludedUrls?.slice(0, 40) ?? [],
        excludedTitleSamples: dedupeHints.excludedTitles?.slice(0, 20) ?? [],
      }),
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
    if (!pick) return fallbackOutput(kind, articles, sourceStats);
    return { pick, generatedAt: new Date().toISOString(), sourceStats };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[s3labs-${kind}] LLM failed:`, msg);
    return fallbackOutput(kind, articles, sourceStats);
  }
}
