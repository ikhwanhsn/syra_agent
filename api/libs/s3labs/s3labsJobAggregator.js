/**
 * S3Labs Jobs agent — scrape web3/crypto/tech listings, rank by pay.
 */

import { getS3labsAgentDefinition } from "../../config/s3labsAgentsConfig.js";
import { dedupeJobListings, fetchAllJobListings } from "./s3labsJobSources.js";
import { isJobExcluded } from "./s3labsJobSentHistory.js";

/**
 * @typedef {import("./s3labsJobIdentity.js").JobListing} JobListing
 */

/**
 * @param {JobListing[]} jobs
 * @returns {JobListing[]}
 */
export function rankJobsByPay(jobs) {
  return [...jobs].sort((a, b) => {
    if (b.salaryScore !== a.salaryScore) return b.salaryScore - a.salaryScore;
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });
}

/**
 * @param {{ excludes?: { jobIdentityKeys?: Set<string>; dedupeKeys?: Set<string>; urls?: Set<string> } }} [opts]
 */
export async function fetchS3labsJobCandidates(opts = {}) {
  const def = getS3labsAgentDefinition("job");
  const excludes = opts.excludes ?? { jobIdentityKeys: new Set(), dedupeKeys: new Set(), urls: new Set() };

  const raw = await fetchAllJobListings();
  const deduped = dedupeJobListings(raw);
  const fresh = deduped.filter((j) => !isJobExcluded(j, excludes));

  const ranked = rankJobsByPay(fresh);
  const candidates = ranked.slice(0, def.candidateLimit);

  return {
    candidates,
    stats: {
      scrapedCount: raw.length,
      dedupedCount: deduped.length,
      freshCount: fresh.length,
      candidateCount: candidates.length,
      topSalary: candidates[0]?.salaryScore ?? 0,
    },
  };
}
