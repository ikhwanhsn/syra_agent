/**
 * Job sources for S3Labs Jobs agent — web3.career HTML + tech RSS feeds.
 */

import { fetchWithRetry } from "../../utils/resilientFetch.js";
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

/** Homepage + high-signal listing pages (more coverage than a single scrape). */
const WEB3_CAREER_URLS = Object.freeze([
  "https://web3.career/",
  "https://web3.career/remote-jobs",
  "https://web3.career/?page=2",
]);

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
  const res = await fetchWithRetry(url, {
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
 * @param {string} block
 * @param {string} path
 * @param {string} externalId
 * @param {string} title
 * @param {string} company
 * @returns {JobListing}
 */
function buildWeb3CareerJob(block, path, externalId, title, company) {
  const salary = parseSalaryFromText(block);
  const locM =
    block.match(
      /job-location-mobile[^>]*>\s*(?:<span[^>]*>[\s\S]*?<\/span>\s*)?([^<]{2,80})/i,
    ) || block.match(/<p[^>]*>\s*([^<]{2,80})\s*<\/p>/i);
  const location = locM?.[1]?.trim() || "Remote";
  const remote = /remote/i.test(location) || /remote/i.test(block);
  const url = path.startsWith("http") ? path : `https://web3.career${path}`;
  const timeM = block.match(/datetime="([^"]+)"/);
  const publishedAt = timeM?.[1] ? new Date(timeM[1]).toISOString() : new Date().toISOString();

  const partial = {
    sourceId: "web3career",
    externalId,
    company,
    title,
    url,
  };

  return {
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
  };
}

/**
 * Primary parser — turbo table row click handlers.
 * @param {string} html
 * @returns {JobListing[]}
 */
function parseWeb3CareerJobsViaOnclick(html) {
  const rowRe =
    /onclick="tableTurboRowClick\(event,\s*'(\/[^']+\/(\d+))'\)"[\s\S]*?<h2[^>]*>\s*([^<]+?)\s*<\/h2>[\s\S]*?<h3[^>]*>\s*([^<]+?)\s*<\/h3>/gi;

  /** @type {JobListing[]} */
  const jobs = [];
  const seen = new Set();
  let m;

  while ((m = rowRe.exec(html)) !== null) {
    const externalId = m[2];
    if (seen.has(externalId)) continue;
    seen.add(externalId);

    const block = html.slice(m.index, m.index + 4500);
    jobs.push(buildWeb3CareerJob(block, m[1], externalId, m[3].trim(), m[4].trim()));
  }

  return jobs;
}

/**
 * Fallback when onclick markup changes — use data-jobid + title/company anchors.
 * @param {string} html
 * @returns {JobListing[]}
 */
function parseWeb3CareerJobsViaDataJobId(html) {
  const rowRe =
    /data-jobid=(\d+)[^>]*onclick="tableTurboRowClick\(event,\s*'(\/[^']+\/\d+)'\)"[\s\S]{0,3500}?<h2[^>]*>\s*([^<]+?)\s*<\/h2>[\s\S]{0,800}?<h3[^>]*>\s*([^<]+?)\s*<\/h3>/gi;

  /** @type {JobListing[]} */
  const jobs = [];
  const seen = new Set();
  let m;

  while ((m = rowRe.exec(html)) !== null) {
    const externalId = m[1];
    if (seen.has(externalId)) continue;
    seen.add(externalId);

    const block = html.slice(m.index, m.index + 4500);
    jobs.push(buildWeb3CareerJob(block, m[2], externalId, m[3].trim(), m[4].trim()));
  }

  return jobs;
}

/**
 * @param {string} html
 * @returns {JobListing[]}
 */
export function parseWeb3CareerJobs(html) {
  const primary = parseWeb3CareerJobsViaOnclick(html);
  if (primary.length > 0) return primary;
  return parseWeb3CareerJobsViaDataJobId(html);
}

/**
 * @returns {Promise<JobListing[]>}
 */
export async function fetchWeb3CareerJobs() {
  const results = await Promise.allSettled(WEB3_CAREER_URLS.map((url) => fetchHtml(url)));

  /** @type {JobListing[]} */
  const jobs = [];

  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    const url = WEB3_CAREER_URLS[i];
    if (r.status !== "fulfilled") {
      const msg = r.reason instanceof Error ? r.reason.message : String(r.reason);
      console.warn(`[s3labs-jobs] web3.career scrape failed (${url}):`, msg);
      continue;
    }
    const parsed = parseWeb3CareerJobs(r.value);
    if (parsed.length === 0) {
      console.warn(`[s3labs-jobs] web3.career parse returned 0 jobs (${url})`);
    }
    jobs.push(...parsed);
  }

  return jobs;
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
