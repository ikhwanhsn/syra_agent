/**
 * Stable job identity keys — prevent duplicate Telegram posts for the same role.
 */

import { normalizeArticleUrl, normalizeTitleKey } from "./s3labsScoring.js";

/**
 * @typedef {'web3' | 'crypto' | 'tech'} JobCategory
 */

/**
 * @typedef {{
 *   jobIdentityKey: string;
 *   dedupeKey: string;
 *   externalId?: string;
 *   title: string;
 *   company: string;
 *   location: string;
 *   remote: boolean;
 *   salaryLabel: string;
 *   salaryScore: number;
 *   url: string;
 *   source: string;
 *   sourceId: string;
 *   category: JobCategory;
 *   description: string;
 *   publishedAt: string;
 * }} JobListing
 */

/**
 * @param {string} s
 * @returns {string}
 */
export function normalizeCompanyKey(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .slice(0, 80);
}

/**
 * Strip hiring noise so minor title edits still match the same role.
 * @param {string} s
 * @returns {string}
 */
export function normalizeJobTitleKey(s) {
  return normalizeTitleKey(s)
    .replace(/\b(m w d|m f d|remote|hybrid|onsite|on site|full time|part time|contract|internship)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Canonical slug from listing URL — stable across RSS feeds for the same role.
 * @param {string} url
 * @returns {string}
 */
export function extractCanonicalJobSlug(url) {
  try {
    const u = new URL(String(url || "").trim());
    const host = u.hostname.replace(/^www\./, "").toLowerCase();
    const path = u.pathname.replace(/\/+$/, "");
    const parts = path.split("/").filter(Boolean);
    const last = parts[parts.length - 1] || "";

    if (host.includes("weworkremotely.com") && last.length > 5) {
      return `wwr:${last}`;
    }

    if (host.includes("web3.career")) {
      const m = path.match(/\/([^/]+)\/(\d+)$/);
      if (m) return `web3career:${m[2]}`;
    }

    if (host.includes("ycombinator.com") || host.includes("hnrss.org")) {
      const id = u.searchParams.get("id") || last;
      if (id) return `hn:${id}`;
    }

    if (last.length > 8) return `slug:${host}:${last}`;
    return "";
  } catch {
    return "";
  }
}

/**
 * Cross-source dedupe key — same company + role even if URL or feed differs.
 * @param {{ company: string; title: string; url?: string }} job
 * @returns {string}
 */
export function buildJobDedupeKey(job) {
  const company = normalizeCompanyKey(job.company);
  const title = normalizeJobTitleKey(job.title);
  if (company && title) return `${company}|${title}`;

  const slug = extractCanonicalJobSlug(job.url || "");
  if (slug) return slug;

  const urlKey = normalizeArticleUrl(job.url || "");
  if (urlKey) return `url:${urlKey}`;
  return `title:${title || "unknown"}`;
}

/**
 * @param {{ sourceId: string; externalId?: string; company: string; title: string; url: string }} job
 * @returns {string}
 */
export function buildJobIdentityKey(job) {
  const slug = extractCanonicalJobSlug(job.url);
  if (slug) return slug;

  if (job.sourceId === "web3career" && job.externalId) {
    return `web3career:${String(job.externalId).trim()}`;
  }

  const dedupe = buildJobDedupeKey(job);
  if (dedupe && !dedupe.startsWith("title:")) return dedupe;

  const urlKey = normalizeArticleUrl(job.url);
  if (urlKey) return `url:${urlKey}`;
  return dedupe;
}

/**
 * @param {string} title
 * @returns {{ company: string; role: string }}
 */
export function parseCompanyFromTitle(title) {
  const raw = String(title || "").trim();
  const colon = raw.match(/^([^:]{2,60}):\s*(.+)$/);
  if (colon) {
    return { company: colon[1].trim(), role: colon[2].trim() };
  }
  const at = raw.match(/^(.+?)\s+at\s+(.+)$/i);
  if (at) {
    return { company: at[2].trim(), role: at[1].trim() };
  }
  return { company: "", role: raw };
}

/**
 * @param {string} text
 * @returns {JobCategory}
 */
export function inferJobCategory(text) {
  const t = String(text || "").toLowerCase();
  if (/web3|blockchain|solidity|smart contract|defi|nft|on-?chain|solana|ethereum|crypto/.test(t)) {
    return /crypto|bitcoin|defi|trading|exchange/.test(t) ? "crypto" : "web3";
  }
  return "tech";
}

/**
 * @param {string} text
 * @returns {boolean}
 */
export function isRelevantTechOrCryptoJob(text) {
  const t = String(text || "").toLowerCase();
  if (/web3|crypto|blockchain|defi|solidity|smart contract|nft|solana|ethereum|bitcoin|fintech/.test(t)) {
    return true;
  }
  return /engineer|developer|devops|software|frontend|backend|full[\s-]?stack|sre|programmer|data/.test(t);
}
