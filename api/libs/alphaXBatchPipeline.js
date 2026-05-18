/**
 * Alpha X batch pipeline — score curated X handles, persist to Mongo for public dashboard reads.
 */

import pLimit from "p-limit";
import DashboardResearch from "../models/DashboardResearch.js";
import {
  getProjectAnalyzerType,
  listProjectAnalyzerTypeIds,
} from "../config/projectAnalyzerTypes.js";
import {
  ALPHA_X_DEFAULT_INCLUDE_AI_SUMMARY,
  ALPHA_X_DEFAULT_MAX_RESULTS,
  ALPHA_X_DEFAULT_TYPE,
} from "../config/alphaXBatchConfig.js";
import { runXProjectAnalysis } from "../agents/x-project-analyzer.js";

function parseConcurrency() {
  const raw = process.env.X_BATCH_ANALYZER_CONCURRENCY;
  const n = raw != null && raw !== "" ? Number.parseInt(String(raw).trim(), 10) : NaN;
  if (Number.isFinite(n) && n >= 1) return Math.min(5, n);
  return 2;
}

const CONCURRENCY = parseConcurrency();

/**
 * @param {string} typeId
 * @param {number} maxResults
 * @param {boolean} includeAiSummary
 */
export function alphaXBatchDbId(typeId, maxResults, includeAiSummary) {
  return `alpha-x-batch:${String(typeId).trim().toLowerCase()}:${maxResults}:${includeAiSummary ? "1" : "0"}`;
}

export const ALPHA_X_BATCH_CANONICAL_DB_ID = alphaXBatchDbId(
  ALPHA_X_DEFAULT_TYPE,
  ALPHA_X_DEFAULT_MAX_RESULTS,
  ALPHA_X_DEFAULT_INCLUDE_AI_SUMMARY,
);

/**
 * @param {object} opts
 * @param {string} opts.typeId
 * @param {string[]} opts.handles
 * @param {number} opts.maxResults
 * @param {boolean} opts.includeAiSummary
 */
export async function runBatchAnalysis({ typeId, handles, maxResults, includeAiSummary }) {
  const limit = pLimit(CONCURRENCY);
  const tasks = handles.map((username) =>
    limit(async () => {
      const out = await runXProjectAnalysis({
        username,
        maxResults,
        includeAiSummary,
      });
      if (out.success) {
        return {
          username,
          ok: true,
          analysis: out.data,
        };
      }
      return {
        username,
        ok: false,
        error: out.error || "Analysis failed",
        code: out.code,
      };
    }),
  );

  const items = await Promise.all(tasks);
  const succeeded = items.filter((i) => i.ok);
  const scores = succeeded
    .map((i) =>
      i.ok && i.analysis && typeof i.analysis.score === "number"
        ? i.analysis.score
        : NaN,
    )
    .filter((n) => Number.isFinite(n));
  const averageScore =
    scores.length > 0
      ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
      : null;

  const typeMeta = getProjectAnalyzerType(typeId);

  return {
    type: typeMeta?.id ?? typeId,
    label: typeMeta?.label ?? typeId,
    provider: typeMeta?.provider ?? "x",
    updatedAt: new Date().toISOString(),
    items,
    summary: {
      total: items.length,
      succeeded: succeeded.length,
      failed: items.length - succeeded.length,
      averageScore,
    },
  };
}

/**
 * @param {string} dbId
 * @returns {Promise<{ data: object; savedAt: string } | null>}
 */
export async function loadAlphaXBatchSnapshot(dbId) {
  const doc = await DashboardResearch.findOne({ id: dbId }).lean();
  if (!doc?.payload || typeof doc.payload !== "object") return null;
  const savedAt = doc.savedAt ? new Date(doc.savedAt).toISOString() : undefined;
  return {
    data: doc.payload,
    savedAt: savedAt ?? (doc.payload.updatedAt && String(doc.payload.updatedAt)) ?? new Date(0).toISOString(),
  };
}

/**
 * @param {string} dbId
 * @param {object} data
 */
export async function saveAlphaXBatchSnapshot(dbId, data) {
  const savedAt = new Date();
  await DashboardResearch.findOneAndUpdate(
    { id: dbId },
    { id: dbId, payload: data, savedAt },
    { upsert: true, new: true },
  );
  return { savedAt: savedAt.toISOString() };
}

/**
 * Score all handles for a feed type and persist the canonical dashboard snapshot.
 * @param {object} [opts]
 * @param {string} [opts.typeId]
 * @param {number} [opts.maxResults]
 * @param {boolean} [opts.includeAiSummary]
 */
export async function runAlphaXBatchPipeline(opts = {}) {
  const typeId = String(opts.typeId ?? ALPHA_X_DEFAULT_TYPE)
    .trim()
    .toLowerCase();
  const typeDef = getProjectAnalyzerType(typeId);
  if (!typeDef) {
    throw new Error(
      `Unknown type "${typeId}". Valid: ${listProjectAnalyzerTypeIds().join(", ")}`,
    );
  }

  const maxResults = Math.min(
    50,
    Math.max(
      5,
      Number.isFinite(opts.maxResults)
        ? Math.floor(opts.maxResults)
        : ALPHA_X_DEFAULT_MAX_RESULTS,
    ),
  );
  const includeAiSummary =
    opts.includeAiSummary === true
      ? true
      : opts.includeAiSummary === false
        ? false
        : ALPHA_X_DEFAULT_INCLUDE_AI_SUMMARY;

  const handles = [...typeDef.handles];
  if (handles.length === 0) {
    throw new Error(`No accounts configured for type "${typeId}"`);
  }

  const data = await runBatchAnalysis({
    typeId: typeDef.id,
    handles,
    maxResults,
    includeAiSummary,
  });

  const dbId = alphaXBatchDbId(typeId, maxResults, includeAiSummary);
  const { savedAt } = await saveAlphaXBatchSnapshot(dbId, data);

  return { success: true, dbId, savedAt, data };
}

/**
 * Read persisted batch for dashboard GET. Only exact canonical params are stored for the default tab.
 * @param {object} opts
 * @param {string} opts.typeId
 * @param {number} opts.maxResults
 * @param {boolean} opts.includeAiSummary
 */
export async function getAlphaXBatchForPublicRead({ typeId, maxResults, includeAiSummary }) {
  const dbId = alphaXBatchDbId(typeId, maxResults, includeAiSummary);
  const hit = await loadAlphaXBatchSnapshot(dbId);
  if (hit) return { ...hit, dbId, source: "database" };

  if (
    typeId === ALPHA_X_DEFAULT_TYPE &&
    maxResults === ALPHA_X_DEFAULT_MAX_RESULTS &&
    includeAiSummary === ALPHA_X_DEFAULT_INCLUDE_AI_SUMMARY
  ) {
    return null;
  }

  const fallbackId = ALPHA_X_BATCH_CANONICAL_DB_ID;
  const fallback = await loadAlphaXBatchSnapshot(fallbackId);
  if (!fallback) return null;
  return { ...fallback, dbId: fallbackId, source: "database" };
}
