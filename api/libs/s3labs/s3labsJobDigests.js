/**
 * Telegram HTML formatter for S3Labs Jobs topic (t.me/s3labs/513).
 */

import { S3LABS_JOB_AGENT } from "../../config/s3labsAgentsConfig.js";
import { escapeTelegramHtml } from "../telegramFormat.js";

/**
 * @typedef {import("./s3labsJobIdentity.js").JobListing} JobListing
 * @typedef {import("./s3labsJobIdentity.js").JobCategory} JobCategory
 */

/**
 * @returns {string}
 */
function formatWibNow() {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
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
 * @param {JobListing} job
 * @returns {string}
 */
export function formatS3labsJobTelegram(job) {
  const def = S3LABS_JOB_AGENT;
  const title = escapeTelegramHtml(job.title);
  const company = escapeTelegramHtml(job.company || "Perusahaan tidak disebutkan");
  const location = escapeTelegramHtml(job.location || (job.remote ? "Remote" : "Tidak disebutkan"));
  const salary = escapeTelegramHtml(job.salaryLabel);
  const cat = escapeTelegramHtml(categoryLabel(job.category));
  const source = escapeTelegramHtml(job.source);
  const summary = escapeTelegramHtml(job.description.slice(0, 280));
  const identity = escapeTelegramHtml(job.jobIdentityKey);

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
    `🔗 <a href="${job.url}">Lamar / lihat detail</a>`,
    `📰 Sumber: ${source}`,
    `🆔 <code>${identity}</code>`,
    `🕐 ${formatWibNow()} WIB`,
    "",
    `— ${def.agentTag} · t.me/s3labs/${def.threadId}`,
  ];

  return lines.join("\n").trim();
}
