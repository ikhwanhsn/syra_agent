/**
 * Live context for S3Labs Telegram Q&A — fetch RSS/news/jobs/events to ground answers.
 */

import { getArticlesWithinHours } from "../newsAggregator.js";
import { dedupeArticles, scoreArticlesByHotness } from "./s3labsScoring.js";
import { fetchS3labsEventCandidates } from "./s3labsEventAggregator.js";
import { fetchS3labsDeveloperCandidates } from "./s3labsDeveloperAggregator.js";
import { fetchS3labsJobCandidates } from "./s3labsJobAggregator.js";

/** @typedef {'crypto_news' | 'tech_news' | 'events' | 'jobs' | 'developer' | 'crypto_general' | 'general'} S3labsQaIntent */

const QA_CONTEXT_TIMEOUT_MS = 12_000;

/**
 * @param {string} question
 * @returns {S3labsQaIntent}
 */
export function classifyS3labsQaIntent(question) {
  const q = String(question || "").toLowerCase();

  const hasCrypto =
    /\b(crypto|kripto|bitcoin|btc|eth|ethereum|solana|sol|defi|web3|blockchain|altcoin|token|nft|memecoin|airdrop)\b/.test(
      q,
    );
  const hasNews =
    /\b(berita|news|headline|headlines|update|terbaru|terpanas|panas|hot|trending|breaking|viral|kabar|what(?:'s| is) happening|latest|happening now)\b/.test(
      q,
    );
  const hasEvents =
    /\b(event|events|hackathon|konferensi|conference|meetup|workshop|webinar|summit|expo)\b/.test(q);
  const hasJobs =
    /\b(job|jobs|loker|lowongan|karir|career|hiring|recruit|gaji|salary|remote work|freelance)\b/.test(q);
  const hasDev =
    /\b(code|coding|programming|developer|dev|framework|library|open source|github|api|typescript|javascript|rust|python|devops|infra)\b/.test(
      q,
    );

  if (hasNews && hasCrypto) return "crypto_news";
  if (hasNews) return hasDev ? "developer" : "crypto_news";
  if (hasEvents) return "events";
  if (hasJobs) return "jobs";
  if (hasDev) return "developer";
  if (hasCrypto) return "crypto_general";
  return "general";
}

/**
 * @param {string} iso
 * @returns {string}
 */
function formatRelativeTime(iso) {
  const ms = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(ms)) return "baru saja";
  const h = Math.floor(ms / (60 * 60 * 1000));
  if (h < 1) return "< 1 jam lalu";
  if (h < 24) return `${h} jam lalu`;
  const d = Math.floor(h / 24);
  return `${d} hari lalu`;
}

/**
 * @param {import("../newsSources/rssParser.js").RawArticle[]} articles
 * @param {number} limit
 * @returns {string}
 */
function formatNewsContextBlock(articles, limit = 8) {
  if (articles.length === 0) {
    return "## Live context\nTidak ada headline RSS fresh dalam 24 jam terakhir — jelaskan tren umum dari pengetahuanmu, jangan arahkan ke website sebagai jawaban utama.";
  }

  const lines = articles.slice(0, limit).map((a, i) => {
    const desc = String(a.description || "").slice(0, 180).trim();
    return `${i + 1}. **${a.title}** — ${a.source}, ${formatRelativeTime(a.publishedAt)}${desc ? `\n   ${desc}` : ""}\n   ${a.url}`;
  });

  return `## Live context — berita crypto/web3/tech (RSS komunitas, di-fetch ${new Date().toISOString()})\nGunakan data ini sebagai sumber utama jawaban. Ringkas 3–6 headline paling relevan untuk user.\n\n${lines.join("\n\n")}`;
}

/**
 * @returns {Promise<string>}
 */
async function buildNewsContext() {
  const raw = await getArticlesWithinHours(24);
  const deduped = dedupeArticles(raw);
  const scored = scoreArticlesByHotness(deduped, { recencyHalfLifeHours: 8 });
  const top = scored.map((s) => s.article);
  return formatNewsContextBlock(top);
}

/**
 * @returns {Promise<string>}
 */
async function buildEventsContext() {
  const { hotCandidates } = await fetchS3labsEventCandidates({ excludes: { urls: new Set(), titleKeys: new Set() } });
  if (hotCandidates.length === 0) {
    return "## Live context\nTidak ada event fresh di feed — jawab dari pengetahuan umum tentang hackathon/konferensi tech-crypto.";
  }
  const lines = hotCandidates.slice(0, 6).map((a, i) => {
    const desc = String(a.description || "").slice(0, 160).trim();
    return `${i + 1}. **${a.title}** — ${a.source}${desc ? `\n   ${desc}` : ""}\n   ${a.url}`;
  });
  return `## Live context — event tech/crypto terdekat\n${lines.join("\n\n")}`;
}

/**
 * @returns {Promise<string>}
 */
async function buildJobsContext() {
  const { candidates } = await fetchS3labsJobCandidates({
    excludes: { jobIdentityKeys: new Set(), dedupeKeys: new Set(), urls: new Set() },
  });
  if (candidates.length === 0) {
    return "## Live context\nTidak ada lowongan fresh di feed — arahkan ke topik Lowongan Kerja (thread 513).";
  }
  const lines = candidates.slice(0, 5).map((j, i) => {
    return `${i + 1}. **${j.title}** @ ${j.company} — ${j.location}, ${j.salaryLabel}\n   ${j.url}`;
  });
  return `## Live context — lowongan remote tech/web3\n${lines.join("\n\n")}`;
}

/**
 * @returns {Promise<string>}
 */
async function buildDeveloperContext() {
  const { hotCandidates } = await fetchS3labsDeveloperCandidates({
    excludes: { urls: new Set(), titleKeys: new Set() },
  });
  if (hotCandidates.length === 0) {
    return "## Live context\nTidak ada artikel dev fresh — jawab langsung dari pengetahuan programming/dev tools.";
  }
  const lines = hotCandidates.slice(0, 6).map((a, i) => {
    const desc = String(a.description || "").slice(0, 160).trim();
    return `${i + 1}. **${a.title}** — ${a.source}${desc ? `\n   ${desc}` : ""}\n   ${a.url}`;
  });
  return `## Live context — highlight developer/engineering\n${lines.join("\n\n")}`;
}

/**
 * @param {S3labsQaIntent} intent
 * @returns {Promise<string>}
 */
async function fetchContextForIntent(intent) {
  switch (intent) {
    case "crypto_news":
    case "tech_news":
      return buildNewsContext();
    case "events":
      return buildEventsContext();
    case "jobs":
      return buildJobsContext();
    case "developer":
      return buildDeveloperContext();
    default:
      return "";
  }
}

/**
 * @template T
 * @param {Promise<T>} promise
 * @param {number} ms
 * @returns {Promise<T>}
 */
function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error("context fetch timeout")), ms);
    }),
  ]);
}

/**
 * @param {string} question
 * @returns {Promise<{ intent: S3labsQaIntent; contextBlock: string }>}
 */
export async function buildS3labsQaContext(question) {
  const intent = classifyS3labsQaIntent(question);

  const needsFetch = ["crypto_news", "tech_news", "events", "jobs", "developer"].includes(intent);
  if (!needsFetch) {
    return { intent, contextBlock: "" };
  }

  try {
    const contextBlock = await withTimeout(fetchContextForIntent(intent), QA_CONTEXT_TIMEOUT_MS);
    return { intent, contextBlock };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.warn("[s3labs-telegram-qa] context fetch failed:", msg);
    return {
      intent,
      contextBlock:
        "## Live context\nFetch RSS gagal — jawab langsung dari pengetahuan umum tech/crypto, jangan pakai disclaimer off-topic.",
    };
  }
}
