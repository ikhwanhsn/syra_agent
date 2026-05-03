/**
 * Batch X Project Analyzer — same scoring as /x-analyzer, no x402.
 * Only dynamic input: **type** (registry in config). X handles are static per type.
 */

import express from 'express';
import pLimit from 'p-limit';
import {
  getProjectAnalyzerType,
  listProjectAnalyzerTypesPublic,
  listProjectAnalyzerTypeIds,
} from '../config/projectAnalyzerTypes.js';
import { runXProjectAnalysis } from './x-project-analyzer.js';

const CACHE_TTL_MS = 60 * 1000;
/** @type {Map<string, { data: unknown; expires: number }>} */
const cache = new Map();

/** Concurrent X API fan-out to reduce rate-limit spikes. */
const CONCURRENCY = 3;

const USERNAME_RE = /^[A-Za-z0-9_]{1,15}$/;

function cacheGet(key) {
  const entry = cache.get(key);
  if (!entry || Date.now() > entry.expires) return null;
  return entry.data;
}

function cacheSet(key, data) {
  cache.set(key, { data, expires: Date.now() + CACHE_TTL_MS });
}

/** @param {import('express').Request} req */
function param(req, name, defaultVal = null) {
  const q =
    req.query && typeof req.query[name] !== 'undefined'
      ? req.query[name]
      : undefined;
  const b =
    req.body && typeof req.body[name] !== 'undefined'
      ? req.body[name]
      : undefined;
  const v = q !== undefined ? q : b;
  if (v === undefined || v === null) return defaultVal;
  return typeof v === 'string' ? v.trim() : v;
}

function parseBool(v, defaultVal) {
  if (v === undefined || v === null || v === '') return defaultVal;
  if (typeof v === 'boolean') return v;
  const s = String(v).toLowerCase();
  if (s === 'true' || s === '1' || s === 'yes') return true;
  if (s === 'false' || s === '0' || s === 'no') return false;
  return defaultVal;
}

/**
 * @param {object} opts
 * @param {string} opts.typeId
 * @param {string[]} opts.handles
 * @param {number} opts.maxResults
 * @param {boolean} opts.includeAiSummary
 */
async function runBatchAnalysis({ typeId, handles, maxResults, includeAiSummary }) {
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
        error: out.error || 'Analysis failed',
        code: out.code,
      };
    }),
  );

  const items = await Promise.all(tasks);
  const succeeded = items.filter((i) => i.ok);
  const scores = succeeded
    .map((i) =>
      i.ok && i.analysis && typeof i.analysis.score === 'number'
        ? i.analysis.score
        : NaN,
    )
    .filter((n) => Number.isFinite(n));
  const averageScore =
    scores.length > 0
      ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) /
        10
      : null;

  const typeMeta = getProjectAnalyzerType(typeId);

  return {
    type: typeMeta?.id ?? typeId,
    label: typeMeta?.label ?? typeId,
    provider: typeMeta?.provider ?? 'x',
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

export function createXProjectsBatchAnalyzerRouter() {
  const router = express.Router();

  async function handleAccount(req, res) {
    try {
      const typeParam = String(param(req, 'type') ?? 'x402')
        .trim()
        .toLowerCase();
      const typeDef = getProjectAnalyzerType(typeParam);
      if (!typeDef) {
        return res.status(400).json({
          success: false,
          error: `Unknown type "${typeParam}". Valid: ${listProjectAnalyzerTypeIds().join(', ')}`,
        });
      }

      const usernameRaw = param(req, 'username');
      if (!usernameRaw) {
        return res.status(400).json({
          success: false,
          error: 'Missing username',
        });
      }
      const username = String(usernameRaw).trim().replace(/^@/, '');
      if (!USERNAME_RE.test(username)) {
        return res.status(400).json({
          success: false,
          error:
            'Invalid username (1–15 chars: letters, numbers, underscore)',
        });
      }

      const allowed = typeDef.handles.some(
        (h) => h.toLowerCase() === username.toLowerCase(),
      );
      if (!allowed) {
        return res.status(403).json({
          success: false,
          error: 'Account is not in this Alpha feed type',
        });
      }

      const max_results = Math.min(
        50,
        Math.max(
          10,
          parseInt(String(param(req, 'max_results') ?? '35'), 10) || 35,
        ),
      );
      const includeAiSummary = parseBool(param(req, 'includeAiSummary'), true);

      const cacheKey = `account:${typeParam}:${username.toLowerCase()}:${max_results}:${includeAiSummary}`;
      const hit = cacheGet(cacheKey);
      if (hit) {
        res.setHeader('Cache-Control', 'public, max-age=60');
        return res.json({ success: true, data: hit });
      }

      const out = await runXProjectAnalysis({
        username,
        maxResults: max_results,
        includeAiSummary,
        includeRecentTweets: true,
      });

      if (!out.success) {
        const code = out.code;
        let status = 400;
        if (code === 'USER_NOT_FOUND') status = 404;
        else if (code === 'X_NOT_CONFIGURED') status = 503;
        else if (
          code === 'X_API_USER_ERROR' ||
          code === 'X_API_TWEETS_ERROR'
        )
          status = 502;
        else if (code === 'INVALID_USERNAME') status = 400;
        return res.status(status).json({
          success: false,
          error: out.error || 'Analysis failed',
        });
      }

      const payload = {
        feedType: typeDef.id,
        feedLabel: typeDef.label,
        ...out.data,
      };

      cacheSet(cacheKey, payload);
      res.setHeader('Cache-Control', 'public, max-age=60');
      return res.json({ success: true, data: payload });
    } catch (err) {
      console.warn(
        '[x-projects-batch-analyzer account]',
        err instanceof Error ? err.message : err,
      );
      return res.status(500).json({
        success: false,
        error: err instanceof Error ? err.message : 'Internal server error',
      });
    }
  }

  router.get('/types', (_req, res) => {
    res.setHeader('Cache-Control', 'public, max-age=300');
    return res.json({
      success: true,
      data: { types: listProjectAnalyzerTypesPublic() },
    });
  });

  async function handleBatch(req, res) {
    try {
      const typeParam = String(param(req, 'type') ?? 'x402')
        .trim()
        .toLowerCase();
      const typeDef = getProjectAnalyzerType(typeParam);
      if (!typeDef) {
        return res.status(400).json({
          success: false,
          error: `Unknown type "${typeParam}". Valid: ${listProjectAnalyzerTypeIds().join(', ')}`,
        });
      }

      const handles = [...typeDef.handles];

      if (handles.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No accounts configured for this type',
        });
      }

      const max_results = Math.min(
        50,
        Math.max(5, parseInt(String(param(req, 'max_results') ?? '20'), 10) || 20),
      );
      const includeAiSummary = parseBool(
        param(req, 'includeAiSummary'),
        false,
      );

      const cacheKey = `${typeParam}:${max_results}:${includeAiSummary}`;
      const hit = cacheGet(cacheKey);
      if (hit) {
        res.setHeader('Cache-Control', 'public, max-age=60');
        return res.json({ success: true, data: hit });
      }

      const data = await runBatchAnalysis({
        typeId: typeDef.id,
        handles,
        maxResults: max_results,
        includeAiSummary,
      });

      cacheSet(cacheKey, data);
      res.setHeader('Cache-Control', 'public, max-age=60');
      return res.json({ success: true, data });
    } catch (err) {
      console.warn(
        '[x-projects-batch-analyzer]',
        err instanceof Error ? err.message : err,
      );
      return res.status(500).json({
        success: false,
        error: err instanceof Error ? err.message : 'Internal server error',
      });
    }
  }

  router.get('/account', handleAccount);
  router.post('/account', handleAccount);

  router.get('/', handleBatch);
  router.post('/', handleBatch);

  return router;
}
