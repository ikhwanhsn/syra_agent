/**
 * Persist and query S3Labs scraped job listings.
 */

import S3labsJob from "../../models/S3labsJob.js";
import { normalizeSalaryLabel } from "./s3labsJobSalary.js";
import { applyJobFreshness } from "../discoveryFreshness.js";
import { JOB_SORT_SPECS, resolveDiscoverySort } from "../discoverySort.js";

/**
 * @typedef {import("./s3labsJobIdentity.js").JobListing} JobListing
 */

/**
 * @param {JobListing} job
 * @returns {Record<string, unknown>}
 */
function jobToDocFields(job) {
  const publishedAt = job.publishedAt ? new Date(job.publishedAt) : null;
  return {
    jobIdentityKey: job.jobIdentityKey,
    dedupeKey: job.dedupeKey,
    externalId: job.externalId ?? "",
    title: job.title,
    company: job.company ?? "",
    location: job.location ?? "",
    remote: Boolean(job.remote),
    salaryLabel: normalizeSalaryLabel(job.salaryLabel ?? ""),
    salaryScore: Number(job.salaryScore) || 0,
    url: job.url,
    source: job.source ?? "",
    sourceId: job.sourceId ?? "",
    category: job.category ?? "tech",
    description: job.description ?? "",
    publishedAt:
      publishedAt && !Number.isNaN(publishedAt.getTime()) ? publishedAt : null,
    lastSeenAt: new Date(),
  };
}

/**
 * @param {JobListing[]} jobs
 * @returns {Promise<{ upserted: number }>}
 */
export async function upsertScrapedJobs(jobs) {
  if (!Array.isArray(jobs) || jobs.length === 0) {
    return { upserted: 0 };
  }

  const now = new Date();
  let upserted = 0;

  for (const job of jobs) {
    if (!job?.jobIdentityKey) continue;

    const fields = jobToDocFields(job);
    await S3labsJob.findOneAndUpdate(
      { jobIdentityKey: job.jobIdentityKey },
      {
        $set: fields,
        $setOnInsert: { firstSeenAt: now, postedToTelegram: false },
      },
      { upsert: true, new: true },
    );
    upserted += 1;
  }

  return { upserted };
}

/**
 * @param {string} jobIdentityKey
 * @returns {Promise<void>}
 */
export async function markJobPosted(jobIdentityKey) {
  if (!jobIdentityKey) return;

  await S3labsJob.findOneAndUpdate(
    { jobIdentityKey },
    {
      $set: {
        postedToTelegram: true,
        postedAt: new Date(),
        lastSeenAt: new Date(),
      },
    },
    { upsert: false },
  );
}

/**
 * @param {import("mongoose").Document} doc
 * @returns {Record<string, unknown>}
 */
function serializeJob(doc) {
  const o = doc.toObject ? doc.toObject() : doc;
  return {
    jobIdentityKey: o.jobIdentityKey,
    dedupeKey: o.dedupeKey,
    externalId: o.externalId || undefined,
    title: o.title,
    company: o.company,
    location: o.location,
    remote: o.remote,
    salaryLabel: normalizeSalaryLabel(o.salaryLabel),
    salaryScore: o.salaryScore,
    url: o.url,
    source: o.source,
    sourceId: o.sourceId,
    category: o.category,
    description: o.description,
    publishedAt: o.publishedAt ? new Date(o.publishedAt).toISOString() : null,
    postedToTelegram: Boolean(o.postedToTelegram),
    postedAt: o.postedAt ? new Date(o.postedAt).toISOString() : null,
    firstSeenAt: o.firstSeenAt ? new Date(o.firstSeenAt).toISOString() : null,
    lastSeenAt: o.lastSeenAt ? new Date(o.lastSeenAt).toISOString() : null,
  };
}

/**
 * @param {{
 *   category?: string;
 *   remote?: boolean;
 *   search?: string;
 *   sort?: string;
 *   limit?: number;
 *   skip?: number;
 *   freshOnly?: boolean;
 * }} [opts]
 * @returns {Promise<{ jobs: Record<string, unknown>[]; total: number }>}
 */
export async function listJobs(opts = {}) {
  const limit = Math.min(Math.max(Number(opts.limit) || 20, 1), 50);
  const skip = Math.max(Number(opts.skip) || 0, 0);
  let filter = {};

  if (opts.category && ["web3", "crypto", "tech"].includes(opts.category)) {
    filter.category = opts.category;
  }

  if (opts.remote === true || opts.remote === "true") {
    filter.remote = true;
  }

  if (opts.search && String(opts.search).trim()) {
    const q = String(opts.search).trim();
    const re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [
      { title: re },
      { company: re },
      { description: re },
      { location: re },
    ];
  }

  filter = applyJobFreshness(filter, { freshOnly: opts.freshOnly !== false });

  const sortSpec = resolveDiscoverySort(JOB_SORT_SPECS, opts.sort, "newest");
  const query = S3labsJob.find(filter).sort(sortSpec);

  const [docs, total] = await Promise.all([
    query.skip(skip).limit(limit).lean(),
    S3labsJob.countDocuments(filter),
  ]);

  return { jobs: docs.map(serializeJob), total };
}
