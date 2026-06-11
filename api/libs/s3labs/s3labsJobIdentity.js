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
 * @param {{ sourceId: string; externalId?: string; company: string; title: string; url: string }} job
 * @returns {string}
 */
export function buildJobIdentityKey(job) {
  if (job.externalId) {
    return `${job.sourceId}:${String(job.externalId).trim()}`;
  }
  const company = normalizeCompanyKey(job.company);
  const title = normalizeTitleKey(job.title);
  if (company && title) return `${company}|${title}`;
  const urlKey = normalizeArticleUrl(job.url);
  if (urlKey) return `url:${urlKey}`;
  return `title:${title || "unknown"}`;
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
