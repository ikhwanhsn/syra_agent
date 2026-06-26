/**
 * Telegram HTML formatter for S3Labs Jobs topic (t.me/s3labs/513).
 */

import { S3LABS_JOB_AGENT } from "../../config/s3labsAgentsConfig.js";
import { escapeTelegramHtml } from "../telegramFormat.js";
import { normalizeSalaryLabel } from "./s3labsJobSalary.js";

/**
 * @typedef {import("./s3labsJobIdentity.js").JobListing} JobListing
 * @typedef {import("./s3labsJobIdentity.js").JobCategory} JobCategory
 */

/**
 * @returns {string}
 */
function formatUtcNow() {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date());
}

/**
 * @param {JobCategory} category
 * @returns {string}
 */
function categoryLabel(category) {
  if (category === "web3") return "Web3";
  if (category === "crypto") return "Crypto";
  return "Tech";
}

/**
 * @param {string} raw
 * @returns {string}
 */
function plainJobSummary(raw) {
  return String(raw || "")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&nbsp;/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * @param {JobListing} job
 * @returns {string}
 */
export function formatS3labsJobTelegram(job) {
  const def = S3LABS_JOB_AGENT;
  const title = escapeTelegramHtml(job.title);
  const company = escapeTelegramHtml(job.company || "Company not listed");
  const location = escapeTelegramHtml(job.location || (job.remote ? "Remote" : "Not specified"));
  const salary = escapeTelegramHtml(normalizeSalaryLabel(job.salaryLabel) || "Salary not listed");
  const cat = escapeTelegramHtml(categoryLabel(job.category));
  const source = escapeTelegramHtml(job.source);
  const summary = escapeTelegramHtml(plainJobSummary(job.description).slice(0, 280));
  const identity = escapeTelegramHtml(job.dedupeKey || job.jobIdentityKey);

  const lines = [
    `${def.headerEmoji} <b>${escapeTelegramHtml(def.topicLabel)}</b> · S3Labs`,
    `🤖 ${escapeTelegramHtml(def.agentName)}`,
    "",
    `<b>${title}</b>`,
    `🏢 ${company}`,
    `📍 ${location}`,
    `💰 ${salary}`,
    `🏷 ${cat}`,
    "",
    summary,
    "",
    `🔗 <a href="${job.url}">Apply / view details</a>`,
    `📰 Source: ${source}`,
    `🆔 <code>${identity}</code>`,
    `🕐 ${formatUtcNow()} UTC`,
    "",
    `— ${def.agentTag} · t.me/s3labs/${def.threadId}`,
  ];

  return lines.join("\n").trim();
}
