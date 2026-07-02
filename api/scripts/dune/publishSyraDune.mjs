#!/usr/bin/env node
/**
 * Publish Syra Dune Analytics queries via the Dune API.
 *
 * Usage:
 *   node -r dotenv/config scripts/dune/publishSyraDune.mjs
 *   node -r dotenv/config scripts/dune/publishSyraDune.mjs --dry-run
 *   node -r dotenv/config scripts/dune/publishSyraDune.mjs --no-validate
 *
 * Requires DUNE_API_KEY (Read/Write scope) and Analyst plan or higher on Dune.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  DUNE_DASHBOARD_TITLE,
  DUNE_QUERIES,
  DUNE_QUERY_PREFIX,
  applySqlSubstitutions,
  getSqlSubstitutions,
  resolveTreasuryWallet,
  SYRA_MINT,
} from './config.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const QUERIES_DIR = path.join(__dirname, 'queries');
const MANIFEST_PATH = path.join(__dirname, 'queries.manifest.json');
const DUNE_API_BASE = 'https://api.dune.com/api/v1';

const DRY_RUN = process.argv.includes('--dry-run');
const SKIP_VALIDATE = process.argv.includes('--no-validate');
const VALIDATE_TIMEOUT_MS = Number(process.env.DUNE_VALIDATE_TIMEOUT_MS || 180_000);
const VALIDATE_POLL_MS = Number(process.env.DUNE_VALIDATE_POLL_MS || 3_000);
const EXECUTION_PERFORMANCE = process.env.DUNE_EXECUTION_PERFORMANCE || 'medium';

/** @typedef {{ version: number; updatedAt: string; queries: Record<string, { queryId: number; name: string; url: string }> }} QueryManifest */

/**
 * @param {string} msg
 */
function log(msg) {
  console.log(`[publish-dune] ${msg}`);
}

/**
 * @param {string} msg
 */
function fail(msg) {
  console.error(`[publish-dune] FAIL: ${msg}`);
  process.exitCode = 1;
}

/**
 * @param {string} msg
 */
function warn(msg) {
  console.warn(`[publish-dune] WARN: ${msg}`);
}

/**
 * @returns {Promise<QueryManifest>}
 */
async function readManifest() {
  try {
    const raw = await fs.readFile(MANIFEST_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && parsed.queries) {
      return /** @type {QueryManifest} */ (parsed);
    }
  } catch (err) {
    if (/** @type {NodeJS.ErrnoException} */ (err).code !== 'ENOENT') {
      throw err;
    }
  }
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    queries: {},
  };
}

/**
 * @param {QueryManifest} manifest
 */
async function writeManifest(manifest) {
  manifest.updatedAt = new Date().toISOString();
  await fs.writeFile(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
}

/**
 * @param {string} apiKey
 * @param {string} route
 * @param {RequestInit} [init]
 */
async function duneFetch(apiKey, route, init = {}) {
  const url = `${DUNE_API_BASE}${route}`;
  const headers = {
    'X-DUNE-API-KEY': apiKey,
    ...(init.body ? { 'Content-Type': 'application/json' } : {}),
    ...(init.headers || {}),
  };

  const res = await fetch(url, { ...init, headers });
  const text = await res.text();
  /** @type {Record<string, unknown>} */
  let body = {};
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = { raw: text };
    }
  }

  if (!res.ok) {
    const errMsg =
      (typeof body.error === 'string' && body.error) ||
      (typeof body.message === 'string' && body.message) ||
      `HTTP ${res.status}`;
    const err = new Error(errMsg);
    err.status = res.status;
    err.body = body;
    throw err;
  }

  return body;
}

/**
 * @param {string} apiKey
 * @param {{ name: string; description: string; querySql: string }} payload
 */
async function createQuery(apiKey, payload) {
  return duneFetch(apiKey, '/query', {
    method: 'POST',
    body: JSON.stringify({
      name: payload.name,
      description: payload.description,
      query_sql: payload.querySql,
      is_private: true,
    }),
  });
}

/**
 * @param {string} apiKey
 * @param {number} queryId
 * @param {{ name: string; description: string; querySql: string }} payload
 */
async function updateQuery(apiKey, queryId, payload) {
  return duneFetch(apiKey, `/query/${queryId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      name: payload.name,
      description: payload.description,
      query_sql: payload.querySql,
    }),
  });
}

/**
 * @param {string} apiKey
 * @param {number} queryId
 */
async function executeQuery(apiKey, queryId) {
  return duneFetch(apiKey, `/query/${queryId}/execute`, {
    method: 'POST',
    body: JSON.stringify({ performance: EXECUTION_PERFORMANCE }),
  });
}

/**
 * @param {string} apiKey
 * @param {string} executionId
 */
async function getExecutionStatus(apiKey, executionId) {
  return duneFetch(apiKey, `/execution/${executionId}/status`, { method: 'GET' });
}

/**
 * @param {() => Promise<{ is_execution_finished?: boolean; state?: string; error?: { message?: string } }>} pollFn
 */
async function waitForExecution(pollFn) {
  const started = Date.now();
  while (Date.now() - started < VALIDATE_TIMEOUT_MS) {
    const status = await pollFn();
    if (status.is_execution_finished) {
      return status;
    }
    await new Promise((r) => setTimeout(r, VALIDATE_POLL_MS));
  }
  throw new Error(`Execution timed out after ${VALIDATE_TIMEOUT_MS}ms`);
}

/**
 * @param {unknown} err
 */
function formatDuneError(err) {
  if (!(err instanceof Error)) return String(err);
  const status = /** @type {{ status?: number }} */ (err).status;
  const body = /** @type {{ body?: Record<string, unknown> }} */ (err).body;
  const parts = [err.message];
  if (status) parts.push(`status=${status}`);
  if (body?.error) parts.push(String(body.error));
  if (status === 402) {
    parts.push('Dune plan may not include API query creation (Analyst+ required).');
  }
  if (status === 403) {
    parts.push('Check DUNE_API_KEY has Read/Write scope.');
  }
  return parts.join(' | ');
}

async function main() {
  const apiKey = process.env.DUNE_API_KEY?.trim();
  if (!apiKey && !DRY_RUN) {
    fail('DUNE_API_KEY is not set in api/.env');
    return;
  }

  const treasuryWallet = resolveTreasuryWallet();
  if (treasuryWallet === 'REPLACE_WITH_TREASURY_WALLET') {
    warn(
      'Treasury wallet not configured — set SYRA_TREASURY_WALLET or AGENT_PRIVATE_KEY. Buybacks query will return empty.',
    );
  } else {
    log(`Treasury wallet: ${treasuryWallet}`);
  }

  log(`SYRA mint: ${SYRA_MINT}`);
  log(`Dashboard title (manual UI): ${DUNE_DASHBOARD_TITLE}`);

  const subs = getSqlSubstitutions();
  const manifest = await readManifest();
  /** @type {Array<{ slug: string; queryId: number; name: string; url: string; validated: boolean; error?: string }>} */
  const results = [];

  for (const def of DUNE_QUERIES) {
    const sqlPath = path.join(QUERIES_DIR, def.file);
    const template = await fs.readFile(sqlPath, 'utf8');
    const querySql = applySqlSubstitutions(template, subs);
    const fullName = `${DUNE_QUERY_PREFIX}${def.name}`;
    const description = `[${def.section}] ${def.description} | Chart: ${def.chartType}`;

    log(`Processing ${def.slug} → "${fullName}"`);

    if (DRY_RUN) {
      log(`  dry-run: would publish ${def.file} (${querySql.length} chars SQL)`);
      continue;
    }

    let queryId = manifest.queries[def.slug]?.queryId;

    try {
      if (queryId) {
        await updateQuery(apiKey, queryId, {
          name: fullName,
          description,
          querySql,
        });
        log(`  updated query ${queryId}`);
      } else {
        const created = await createQuery(apiKey, {
          name: fullName,
          description,
          querySql,
        });
        queryId = Number(created.query_id);
        if (!Number.isInteger(queryId) || queryId <= 0) {
          throw new Error(`Unexpected create response: ${JSON.stringify(created)}`);
        }
        log(`  created query ${queryId}`);
      }

      const url = `https://dune.com/queries/${queryId}`;
      manifest.queries[def.slug] = { queryId, name: fullName, url };

      let validated = false;
      let validationError;

      if (!SKIP_VALIDATE) {
        log(`  validating execution…`);
        const exec = await executeQuery(apiKey, queryId);
        const executionId = String(exec.execution_id || '');
        if (!executionId) {
          throw new Error(`Missing execution_id: ${JSON.stringify(exec)}`);
        }

        const finalStatus = await waitForExecution(() => getExecutionStatus(apiKey, executionId));
        if (finalStatus.state === 'QUERY_STATE_COMPLETED') {
          validated = true;
          log(`  validated OK (${finalStatus.state})`);
        } else {
          validationError =
            finalStatus.error?.message || `Execution ended with state ${finalStatus.state}`;
          warn(`  validation failed for ${def.slug}: ${validationError}`);
        }
      } else {
        validated = true;
        log('  skipped validation (--no-validate)');
      }

      results.push({
        slug: def.slug,
        queryId,
        name: fullName,
        url,
        validated,
        error: validationError,
      });
    } catch (err) {
      const message = formatDuneError(err);
      fail(`${def.slug}: ${message}`);
      results.push({
        slug: def.slug,
        queryId: queryId || 0,
        name: fullName,
        url: queryId ? `https://dune.com/queries/${queryId}` : '',
        validated: false,
        error: message,
      });
    }
  }

  if (!DRY_RUN) {
    await writeManifest(manifest);
    log(`Manifest written: ${MANIFEST_PATH}`);
  }

  log('\n--- Summary ---');
  for (const row of results) {
    const status = row.validated ? 'OK' : 'FAIL';
    log(`${status}  ${row.slug.padEnd(18)} ${row.url || row.error || ''}`);
  }

  const failed = results.filter((r) => !r.validated);
  if (failed.length > 0) {
    fail(`${failed.length}/${results.length} queries failed validation or publish`);
  } else if (results.length > 0) {
    log(`All ${results.length} queries published successfully.`);
    log('Next: open Dune → New Dashboard → add visualizations from query URLs above.');
  }
}

main().catch((err) => {
  fail(formatDuneError(err));
});
