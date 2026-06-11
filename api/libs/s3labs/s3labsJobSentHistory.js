/**
 * Per-job sent history — longer TTL than news (same role must not repost).
 */

import { S3LABS_JOB_SENT_HISTORY_HOURS } from "../../config/s3labsAgentsConfig.js";
import { normalizeArticleUrl } from "./s3labsScoring.js";

/**
 * @typedef {{
 *   jobIdentityKey: string;
 *   url: string;
 *   title?: string;
 *   company?: string;
 *   sentAt: string;
 * }} JobSentRecord
 */

/**
 * @param {unknown} payload
 * @returns {Set<string>}
 */
export function loadRecentSentJobKeys(payload) {
  const cutoff = Date.now() - S3LABS_JOB_SENT_HISTORY_HOURS * 60 * 60 * 1000;
  /** @type {Set<string>} */
  const keys = new Set();

  const history = Array.isArray(payload?.jobSentHistory) ? payload.jobSentHistory : [];
  for (const entry of history) {
    if (!entry || typeof entry !== "object") continue;
    const x = /** @type {JobSentRecord} */ (entry);
    const sentAt = new Date(x.sentAt).getTime();
    if (Number.isNaN(sentAt) || sentAt < cutoff) continue;
    if (x.jobIdentityKey) keys.add(x.jobIdentityKey);
  }

  const last = payload?.lastJob;
  if (last?.jobIdentityKey) keys.add(last.jobIdentityKey);

  return keys;
}

/**
 * @param {unknown} payload
 * @returns {Set<string>}
 */
export function loadRecentSentJobUrls(payload) {
  const cutoff = Date.now() - S3LABS_JOB_SENT_HISTORY_HOURS * 60 * 60 * 1000;
  /** @type {Set<string>} */
  const urls = new Set();

  const history = Array.isArray(payload?.jobSentHistory) ? payload.jobSentHistory : [];
  for (const entry of history) {
    if (!entry || typeof entry !== "object") continue;
    const x = /** @type {JobSentRecord} */ (entry);
    const sentAt = new Date(x.sentAt).getTime();
    if (Number.isNaN(sentAt) || sentAt < cutoff) continue;
    const urlKey = normalizeArticleUrl(x.url);
    if (urlKey) urls.add(urlKey);
  }

  if (payload?.lastJob?.url) {
    const urlKey = normalizeArticleUrl(payload.lastJob.url);
    if (urlKey) urls.add(urlKey);
  }

  return urls;
}

/**
 * @param {import("./s3labsJobIdentity.js").JobListing} job
 * @param {{ jobIdentityKeys?: Set<string>; urls?: Set<string> }} excludes
 * @returns {boolean}
 */
export function isJobExcluded(job, excludes) {
  const keys = excludes.jobIdentityKeys ?? new Set();
  const urls = excludes.urls ?? new Set();
  if (job.jobIdentityKey && keys.has(job.jobIdentityKey)) return true;
  const urlKey = normalizeArticleUrl(job.url);
  if (urlKey && urls.has(urlKey)) return true;
  return false;
}

/**
 * @param {unknown} payload
 * @param {import("./s3labsJobIdentity.js").JobListing} job
 * @returns {JobSentRecord[]}
 */
export function appendJobSentHistory(payload, job) {
  const prev = Array.isArray(payload?.jobSentHistory) ? payload.jobSentHistory : [];
  const now = new Date().toISOString();
  const next = [
    {
      jobIdentityKey: job.jobIdentityKey,
      url: job.url,
      title: job.title,
      company: job.company,
      sentAt: now,
    },
    ...prev.filter((e) => e?.jobIdentityKey !== job.jobIdentityKey),
  ];
  const cutoff = Date.now() - S3LABS_JOB_SENT_HISTORY_HOURS * 60 * 60 * 1000;
  return next.filter((e) => new Date(e.sentAt).getTime() >= cutoff).slice(0, 200);
}
