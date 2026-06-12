/**
 * Job sources for S3Labs Jobs agent — web3.career HTML + tech RSS feeds.
 */

import { fetchRssSource } from "../newsSources/rssParser.js";
import { S3LABS_JOB_RSS_SOURCES } from "../../config/s3labsAgentsConfig.js";
import {
  buildJobDedupeKey,
  buildJobIdentityKey,
  inferJobCategory,
  isRelevantTechOrCryptoJob,
  parseCompanyFromTitle,
} from "./s3labsJobIdentity.js";
import { parseSalaryFromText, formatSalaryLabel } from "./s3labsJobSalary.js";

/**
 * @typedef {import("./s3labsJobIdentity.js").JobListing} JobListing
 */

const WEB3_CAREER_URL = "https://web3.career/";
const FETCH_TIMEOUT_MS = 20_000;

/**
 * @param {string} url
 * @returns {Promise<string>}
 */
async function fetchHtml(url) {
  const signal =
    typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function"
      ? AbortSignal.timeout(FETCH_TIMEOUT_MS)
      : undefined;
  const res = await fetch(url, {
    headers: {
      Accept: "text/html,application/xhtml+xml",
      "User-Agent": "Mozilla/5.0 (compatible; SyraJobBot/1.0; +https://syra.ai)",
    },
    signal,
  });
  if (!res.ok) throw new Error(`HTML fetch failed ${res.status} for ${url}`);
  return res.text();
}

/**
 * @param {string} html
 * @returns {JobListing[]}
 */
export function parseWeb3CareerJobs(html) {
  const rowRe =
    /onclick="tableTurboRowClick\(event, '(\/[^']+\/(\d+))'\)"[\s\S]*?<h2[^>]*>\s*([^<]+?)\s*<\/h2>[\s\S]*?<h3[^>]*>\s*([^<]+?)\s*<\/h3>/gi;

  /** @type {JobListing[]} */
  const jobs = [];
  const seen = new Set();
  let m;

  while ((m = rowRe.exec(html)) !== null) {
    const externalId = m[2];
    if (seen.has(externalId)) continue;
    seen.add(externalId);

    const block = html.slice(m.index, m.index + 4500);
    const title = m[3].trim();
    const company = m[4].trim();
    const salary = parseSalaryFromText(block);
    const locM = block.match(/<p[^>]*>\s*([^<]{2,80})\s*<\/p>/i);
    const location = locM?.[1]?.trim() || "Remote";
    const remote = /remote/i.test(location);
    const url = `https://web3.career${m[1]}`;
    const timeM = block.match(/datetime="([^"]+)"/);
    const publishedAt = timeM?.[1] ? new Date(timeM[1]).toISOString() : new Date().toISOString();

    const partial = {
      sourceId: "web3career",
      externalId,
      company,
      title,
      url,
    };

    jobs.push({
      jobIdentityKey: buildJobIdentityKey(partial),
      dedupeKey: buildJobDedupeKey(partial),
      externalId,
      title,
      company,
      location,
      remote,
      salaryLabel: formatSalaryLabel(salary),
      salaryScore: salary?.score ?? 0,
      url,
      source: "Web3.Career",
      sourceId: "web3career",
      category: "web3",
      description: `${title} at ${company}. ${location}.`,
      publishedAt,
    });
  }

  return jobs;
}

/**
 * @returns {Promise<JobListing[]>}
 */
export async function fetchWeb3CareerJobs() {
  try {
    const html = await fetchHtml(WEB3_CAREER_URL);
    return parseWeb3CareerJobs(html);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.warn("[s3labs-jobs] web3.career scrape failed:", msg);
    return [];
  }
}

/**
 * @param {import("../newsSources/rssParser.js").RawArticle} article
 * @param {string} feedCategory
 * @returns {JobListing | null}
 */
function rssArticleToJob(article, feedCategory) {
  const text = `${article.title} ${article.description}`;
  if (!isRelevantTechOrCryptoJob(text)) return null;

  const { company: parsedCompany, role } = parseCompanyFromTitle(article.title);
  const company = parsedCompany || article.source;
  const title = role || article.title;
  const salary = parseSalaryFromText(text);
  const locationM = text.match(/\b(Remote|Hybrid|On-?site)[^,.]{0,40}/i);
  const location = locationM?.[0]?.trim() || "Remote";
  const remote = /remote/i.test(`${location} ${text}`);
  const category = inferJobCategory(text);
  const sourceId = article.sourceId || feedCategory;

  const partial = {
    sourceId,
    company,
    title,
    url: article.url,
  };

  return {
    jobIdentityKey: buildJobIdentityKey(partial),
    dedupeKey: buildJobDedupeKey(partial),
    externalId: undefined,
    title,
    company,
    location,
    remote,
    salaryLabel: formatSalaryLabel(salary),
    salaryScore: salary?.score ?? 0,
    url: article.url,
    source: article.source,
    sourceId,
    category: category === "tech" && feedCategory === "tech" ? "tech" : category,
    description: article.description.slice(0, 500) || title,
    publishedAt: article.publishedAt,
  };
}

/**
 * @returns {Promise<JobListing[]>}
 */
async function fetchRssJobs() {
  const results = await Promise.allSettled(
    S3LABS_JOB_RSS_SOURCES.map((source) => fetchRssSource(source)),
  );

  /** @type {JobListing[]} */
  const jobs = [];

  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    const source = S3LABS_JOB_RSS_SOURCES[i];
    if (r.status !== "fulfilled") {
      const msg = r.reason instanceof Error ? r.reason.message : String(r.reason);
      console.warn(`[s3labs-jobs] RSS ${source.id} failed:`, msg);
      continue;
    }
    for (const article of r.value) {
      const job = rssArticleToJob(article, source.category);
      if (job) jobs.push(job);
    }
  }

  return jobs;
}

/**
 * @returns {Promise<JobListing[]>}
 */
export async function fetchAllJobListings() {
  const [web3, rss] = await Promise.all([fetchWeb3CareerJobs(), fetchRssJobs()]);
  return [...web3, ...rss];
}

/**
 * @param {JobListing[]} jobs
 * @returns {JobListing[]}
 */
export function dedupeJobListings(jobs) {
  const seenIdentity = new Set();
  const seenDedupe = new Set();
  /** @type {JobListing[]} */
  const out = [];

  const sorted = [...jobs].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );

  for (const job of sorted) {
    const identity = job.jobIdentityKey;
    const dedupe = job.dedupeKey;
    if (identity && seenIdentity.has(identity)) continue;
    if (dedupe && seenDedupe.has(dedupe)) continue;
    if (identity) seenIdentity.add(identity);
    if (dedupe) seenDedupe.add(dedupe);
    out.push(job);
  }

  return out;
}
