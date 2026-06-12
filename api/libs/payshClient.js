/**
 * pay.sh / pay-skills adapter: catalog discovery, per-provider OpenAPI endpoints, and x402 gateway calls.
 * Catalog: https://pay.sh/api/catalog — skills: https://storage.googleapis.com/pay-skills/v1/providers/{fqn}.json
 */
import { callX402V2WithAgent } from './agentX402Client.js';
import { startupVerbose } from '../utils/startupLog.js';

/** @typedef {{ fqn: string; title: string; description: string; use_case: string; category: string; service_url: string; endpoint_count: number; has_metering: boolean; has_free_tier: boolean; min_price_usd: number; max_price_usd: number; sha?: string }} PayshCatalogProvider */

/** @typedef {{ method: string; path: string; summary?: string; operationId?: string; accepts?: unknown[] }} PayshEndpointMeta */

/** @typedef {{ success: true; data: unknown } | { success: false; error: string; status?: number; budgetExceeded?: boolean }} PayshToolResult */

const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'];

const FORBIDDEN_PARAM_KEYS = new Set([
  'headers',
  'header',
  'authorization',
  'cookie',
  'host',
  'x-payment',
  'x-payment-signature',
]);

/** @type {{ at: number; body: Record<string, unknown> & { providers: PayshCatalogProvider[] } | null }} */
let _catalogCache = { at: 0, body: null };

/** @type {Map<string, { at: number; skill: Record<string, unknown> }>} */
const _skillCache = new Map();

/** Last catalog fqn → sha (from pay.sh); used to evict stale OpenAPI skill cache when a provider updates. */
/** @type {Map<string, string>} */
let _catalogProviderShas = new Map();

/** @type {ReturnType<typeof setInterval> | null} */
let _catalogAutoRefreshTimer = null;

function catalogTtlMs() {
  const n = Number.parseInt(process.env.PAYSH_CATALOG_TTL_MS || '3600000', 10);
  return Number.isFinite(n) && n > 0 ? n : 3600000;
}

function skillsTtlMs() {
  const raw = process.env.PAYSH_SKILLS_TTL_MS;
  if (raw != null && String(raw).trim() !== '') {
    const n = Number.parseInt(String(raw).trim(), 10);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return catalogTtlMs();
}

/**
 * @param {Record<string, string>} params
 * @returns {boolean}
 */
export function parsePayshForceRefresh(params) {
  const v =
    params.forceRefresh ??
    params.force_refresh ??
    params.refresh ??
    params.noCache ??
    params.no_cache ??
    '';
  const s = String(v).trim().toLowerCase();
  return s === 'true' || s === '1' || s === 'yes';
}

/**
 * After a successful catalog fetch, drop cached skills for removed or updated providers (sha changed).
 * @param {PayshCatalogProvider[]} providers
 */
function evictStaleSkillsAfterCatalogFetch(providers) {
  const next = new Map();
  for (const p of providers) {
    if (p && typeof p.fqn === 'string' && p.fqn) {
      next.set(p.fqn, String(p.sha ?? ''));
    }
  }
  for (const fqn of _skillCache.keys()) {
    if (!next.has(fqn)) {
      _skillCache.delete(fqn);
    }
  }
  for (const [fqn, newSha] of next) {
    const oldSha = _catalogProviderShas.get(fqn);
    if (oldSha !== undefined && oldSha !== newSha) {
      _skillCache.delete(fqn);
    }
  }
  _catalogProviderShas = next;
}

function skillsBaseUrl() {
  return (process.env.PAYSH_SKILLS_BASE_URL || 'https://storage.googleapis.com/pay-skills/v1/providers').replace(
    /\/$/,
    ''
  );
}

function catalogUrl() {
  return (process.env.PAYSH_CATALOG_URL || 'https://pay.sh/api/catalog').trim();
}

/**
 * @param {{ forceRefresh?: boolean }} [opts]
 * @returns {Promise<{ version?: number; generated_at?: string; provider_count?: number; providers: PayshCatalogProvider[] }>}
 */
export async function fetchCatalog(opts = {}) {
  const force = opts.forceRefresh === true;
  const now = Date.now();
  if (!force && _catalogCache.body && now - _catalogCache.at < catalogTtlMs()) {
    return /** @type {{ providers: PayshCatalogProvider[] } & Record<string, unknown>} */ (_catalogCache.body);
  }
  const url = catalogUrl();
  const started = Date.now();
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  const durationMs = Date.now() - started;
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    console.error(`[paysh] catalog fetch failed HTTP ${res.status} (${durationMs}ms)`, text.slice(0, 200));
    throw new Error(`pay.sh catalog HTTP ${res.status}`);
  }
  const body = await res.json();
  const providers = Array.isArray(body?.providers) ? body.providers : [];
  evictStaleSkillsAfterCatalogFetch(providers);
  _catalogCache = { at: now, body: /** @type {Record<string, unknown> & { providers: PayshCatalogProvider[] }} */ ({ ...body, providers }) };
  startupVerbose(
    JSON.stringify({
      paysh: 'catalog_fetched',
      providerCount: providers.length,
      durationMs,
      forceRefresh: force,
      generated_at: body?.generated_at ?? null,
    })
  );
  return /** @type {{ providers: PayshCatalogProvider[] } & Record<string, unknown>} */ (_catalogCache.body);
}

/**
 * @param {string} fqn
 * @param {{ forceRefresh?: boolean }} [opts]
 * @returns {Promise<Record<string, unknown>>}
 */
export async function fetchProviderSkill(fqn, opts = {}) {
  const force = opts.forceRefresh === true;
  const safe = sanitizeFqn(fqn);
  const now = Date.now();
  const cached = _skillCache.get(safe);
  if (!force && cached && now - cached.at < skillsTtlMs()) {
    return cached.skill;
  }
  const url = `${skillsBaseUrl()}/${safe}.json`;
  const started = Date.now();
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  const durationMs = Date.now() - started;
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    console.error(`[paysh] skill fetch failed ${safe} HTTP ${res.status} (${durationMs}ms)`, text.slice(0, 200));
    throw new Error(`pay.sh skill HTTP ${res.status} for ${safe}`);
  }
  const skill = await res.json();
  _skillCache.set(safe, { at: now, skill });
  return skill;
}

/**
 * @param {string} fqn
 * @returns {string}
 */
export function sanitizeFqn(fqn) {
  const t = String(fqn || '').trim();
  if (!t || t.includes('..')) {
    throw new Error('Invalid fqn');
  }
  if (!/^[a-zA-Z0-9._\-/]+$/.test(t)) {
    throw new Error('Invalid fqn characters');
  }
  return t;
}

/**
 * @param {string} templatePath e.g. /x402/onchain/networks/{network}/tokens/{address}
 * @param {string} actualPath e.g. /x402/onchain/networks/solana/tokens/So111...
 */
export function matchOpenApiPath(templatePath, actualPath) {
  const norm = (p) =>
    p
      .split('/')
      .filter((s) => s.length > 0)
      .map((s) => decodeURIComponent(s));
  const ta = norm(templatePath.startsWith('/') ? templatePath : `/${templatePath}`);
  const aa = norm(actualPath.startsWith('/') ? actualPath : `/${actualPath}`);
  if (ta.length !== aa.length) return false;
  for (let i = 0; i < ta.length; i++) {
    const seg = ta[i];
    if (seg.startsWith('{') && seg.endsWith('}')) continue;
    if (seg !== aa[i]) return false;
  }
  return true;
}

/**
 * @param {string} templatePath
 */
function templateSpecificity(templatePath) {
  const parts = templatePath.split('/').filter(Boolean);
  let literals = 0;
  for (const p of parts) {
    if (!(p.startsWith('{') && p.endsWith('}'))) literals += 1;
  }
  return literals;
}

/**
 * @param {Record<string, unknown>} pathsObj openapi_doc.paths
 * @returns {PayshEndpointMeta[]}
 */
export function flattenOpenApiPaths(pathsObj) {
  if (!pathsObj || typeof pathsObj !== 'object') return [];
  /** @type {PayshEndpointMeta[]} */
  const out = [];
  for (const [pathTemplate, pathItem] of Object.entries(pathsObj)) {
    if (!pathItem || typeof pathItem !== 'object') continue;
    const item = /** @type {Record<string, unknown>} */ (pathItem);
    for (const m of HTTP_METHODS) {
      const op = item[m];
      if (!op || typeof op !== 'object') continue;
      const operation = /** @type {Record<string, unknown>} */ (op);
      const accepts = operation.accepts;
      out.push({
        method: m.toUpperCase(),
        path: pathTemplate,
        summary: typeof operation.summary === 'string' ? operation.summary : undefined,
        operationId: typeof operation.operationId === 'string' ? operation.operationId : undefined,
        accepts: Array.isArray(accepts) ? accepts : undefined,
      });
    }
  }
  return out;
}

/**
 * @param {string} fqn
 * @param {{ forceRefresh?: boolean }} [opts]
 * @returns {Promise<PayshEndpointMeta[]>}
 */
export async function listEndpointsForFqn(fqn, opts = {}) {
  const skill = await fetchProviderSkill(fqn, opts);
  const doc = skill.openapi_doc;
  const paths = doc && typeof doc === 'object' ? /** @type {Record<string, unknown>} */ (doc).paths : null;
  return flattenOpenApiPaths(paths && typeof paths === 'object' ? /** @type {Record<string, unknown>} */ (paths) : {});
}

/**
 * @param {PayshEndpointMeta[]} endpoints
 * @param {string} actualPath
 * @param {string} methodUpper
 * @returns {PayshEndpointMeta | null}
 */
export function resolveMatchingEndpoint(endpoints, actualPath, methodUpper) {
  const method = methodUpper.toUpperCase();
  const candidates = endpoints.filter((e) => e.method === method && matchOpenApiPath(e.path, actualPath));
  if (candidates.length === 0) return null;
  candidates.sort((a, b) => templateSpecificity(b.path) - templateSpecificity(a.path));
  return candidates[0];
}

/**
 * @param {string} serviceUrl
 * @param {string} pathname starts with /
 */
export function buildGatewayUrl(serviceUrl, pathname) {
  let base = String(serviceUrl || '').replace(/\/$/, '');
  const p = pathname.startsWith('/') ? pathname : `/${pathname}`;
  // CoinGecko x402: catalog service_url is .../x402/onchain but OpenAPI paths are /x402/... — avoid .../onchain/x402/...
  if (/\/x402\/onchain$/i.test(base) && /^\/x402\//i.test(p)) {
    base = base.replace(/\/x402\/onchain$/i, '');
  }
  return `${base}${p}`;
}

/**
 * Normalize agent-supplied path: allow full gateway URLs (paste from pay.sh docs) → pathname only.
 * @param {string} raw
 * @returns {string}
 */
export function normalizePayshCallPath(raw) {
  let path = String(raw || '').trim();
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) {
    try {
      const u = new URL(path);
      path = u.pathname + u.search;
    } catch {
      /* keep path */
    }
  }
  if (!path.startsWith('/')) {
    path = `/${path}`;
  }
  return path;
}

/**
 * Resolve HTTP method for paysh-call. QuickNode and many RPC gateways are POST-only; defaulting to GET breaks matching.
 * @param {Record<string, string>} params
 * @returns {{ method: string; explicit: boolean }}
 */
export function resolvePayshCallHttpMethod(params) {
  const raw = params.method;
  const explicit = raw != null && String(raw).trim() !== '';
  const bodyNonEmpty = params.body != null && String(params.body).trim() !== '';
  const method = explicit
    ? String(raw).trim().toUpperCase()
    : bodyNonEmpty
      ? 'POST'
      : 'GET';
  return { method, explicit };
}

/**
 * @param {PayshCatalogProvider[]} providers
 * @param {string} fqn
 */
export function findProvider(providers, fqn) {
  const safe = sanitizeFqn(fqn);
  return providers.find((p) => p.fqn === safe) ?? null;
}

/**
 * @param {Record<string, string>} params
 */
function assertNoForbiddenKeys(params) {
  for (const k of Object.keys(params)) {
    const lower = k.toLowerCase();
    if (FORBIDDEN_PARAM_KEYS.has(lower)) {
      throw new Error(`Forbidden parameter: ${k}`);
    }
    if (lower.startsWith('header.')) {
      throw new Error('Header injection is not allowed');
    }
  }
}

/**
 * @param {string | undefined} raw
 * @returns {Record<string, string>}
 */
function parseQueryJson(raw) {
  if (raw == null || raw === '') return {};
  let parsed;
  try {
    parsed = JSON.parse(String(raw));
  } catch {
    throw new Error('query must be valid JSON object with string values');
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('query must be a JSON object');
  }
  /** @type {Record<string, string>} */
  const out = {};
  for (const [k, v] of Object.entries(parsed)) {
    if (v == null) continue;
    out[String(k)] = typeof v === 'string' ? v : JSON.stringify(v);
  }
  return out;
}

/**
 * @param {string | undefined} raw
 * @returns {Record<string, unknown> | undefined}
 */
function parseBodyJson(raw) {
  if (raw == null || raw === '') return undefined;
  try {
    const parsed = JSON.parse(String(raw));
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('body must be a JSON object');
    }
    return /** @type {Record<string, unknown>} */ (parsed);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`body JSON: ${msg}`);
  }
}

/**
 * @param {'discover' | 'endpoints' | 'call'} kind
 * @param {Record<string, string>} params
 * @param {{ anonymousId: string; connectedWalletAddress?: string }} ctx
 * @returns {Promise<PayshToolResult>}
 */
export async function runPayshToolForAgent(kind, params, ctx) {
  const started = Date.now();
  const forceRefresh = parsePayshForceRefresh(params);
  try {
    if (kind === 'discover') {
      const catalog = await fetchCatalog({ forceRefresh });
      const q = (params.q || params.query || '').toLowerCase().trim();
      const category = (params.category || '').trim().toLowerCase();
      const freeOnly =
        params.freeOnly === 'true' ||
        params.free_only === 'true' ||
        params.free === 'true';
      const limitRaw = params.limit != null ? Number(params.limit) : 50;
      const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 200) : 50;

      let list = [...catalog.providers];
      if (freeOnly) {
        list = list.filter((p) => p.has_free_tier === true);
      }
      if (category) {
        list = list.filter((p) => String(p.category || '').toLowerCase() === category);
      }
      if (q) {
        list = list.filter((p) => {
          const hay = `${p.fqn} ${p.title} ${p.description} ${p.use_case}`.toLowerCase();
          return hay.includes(q);
        });
      }
      const slice = list.slice(0, limit);
      const durationMs = Date.now() - started;
      console.log(JSON.stringify({ paysh: 'discover', q, category, freeOnly, returned: slice.length, durationMs }));
      return {
        success: true,
        data: {
          generated_at: catalog.generated_at ?? null,
          provider_count: catalog.provider_count ?? catalog.providers.length,
          totalMatched: list.length,
          providers: slice.map((p) => ({
            fqn: p.fqn,
            title: p.title,
            category: p.category,
            service_url: p.service_url,
            endpoint_count: p.endpoint_count,
            has_free_tier: p.has_free_tier,
            min_price_usd: p.min_price_usd,
            max_price_usd: p.max_price_usd,
          })),
        },
      };
    }

    if (kind === 'endpoints') {
      const fqn = sanitizeFqn(params.fqn || '');
      const limitRaw = params.limit != null ? Number(params.limit) : 500;
      const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 2000) : 500;
      const catalog = await fetchCatalog({ forceRefresh });
      const prov = findProvider(catalog.providers, fqn);
      if (!prov) {
        return { success: false, error: `Unknown provider fqn: ${fqn}`, status: 404 };
      }
      const endpoints = await listEndpointsForFqn(fqn, { forceRefresh });
      const durationMs = Date.now() - started;
      console.log(JSON.stringify({ paysh: 'endpoints', fqn, count: endpoints.length, durationMs }));
      return {
        success: true,
        data: {
          fqn: prov.fqn,
          title: prov.title,
          service_url: prov.service_url,
          endpoint_count: endpoints.length,
          endpoints: endpoints.slice(0, limit),
        },
      };
    }

    if (kind === 'call') {
      assertNoForbiddenKeys(params);
      const fqn = sanitizeFqn(params.fqn || '');
      let path = normalizePayshCallPath(params.path || '');
      if (!path) {
        return { success: false, error: 'path is required', status: 400 };
      }
      if (path.includes('..')) {
        return { success: false, error: 'Invalid path', status: 400 };
      }

      let { method } = resolvePayshCallHttpMethod(params);
      if (!/^GET|POST|PUT|PATCH|DELETE|HEAD$/i.test(method)) {
        return { success: false, error: 'Unsupported method', status: 400 };
      }

      const catalog = await fetchCatalog({ forceRefresh });
      const prov = findProvider(catalog.providers, fqn);
      if (!prov) {
        return { success: false, error: `Unknown provider fqn: ${fqn}`, status: 404 };
      }

      const endpoints = await listEndpointsForFqn(fqn, { forceRefresh });
      let match = resolveMatchingEndpoint(endpoints, path, method);
      if (!match && method === 'GET') {
        match = resolveMatchingEndpoint(endpoints, path, 'POST');
        if (match) {
          method = 'POST';
        }
      }
      if (!match) {
        return {
          success: false,
          error: `No OpenAPI route matches ${method} ${path} for provider ${fqn}. For QuickNode JSON-RPC use method=POST, path=/solana-mainnet/ (or /ethereum-mainnet/), body={"jsonrpc":"2.0","id":1,"method":"getHealth","params":[]}.`,
          status: 400,
        };
      }

      const query = parseQueryJson(params.query);
      const body = method === 'GET' || method === 'HEAD' ? undefined : parseBodyJson(params.body);

      const url = buildGatewayUrl(prov.service_url, path);
      const durationMs = Date.now() - started;
      console.log(
        JSON.stringify({
          paysh: 'call',
          fqn,
          method,
          path,
          urlOrigin: (() => {
            try {
              return new URL(url).origin;
            } catch {
              return '(bad-url)';
            }
          })(),
          prepMs: durationMs,
        })
      );

      const x402Started = Date.now();
      const result = await callX402V2WithAgent({
        anonymousId: ctx.anonymousId,
        url,
        method,
        query,
        body,
        connectedWalletAddress: ctx.connectedWalletAddress,
      });
      const x402Ms = Date.now() - x402Started;
      console.log(
        JSON.stringify({
          paysh: 'call_done',
          fqn,
          method,
          path,
          ok: result.success,
          x402Ms,
        })
      );

      if (!result.success) {
        return {
          success: false,
          error: result.error || 'x402 call failed',
          status: result.budgetExceeded ? 402 : 502,
          ...(result.budgetExceeded ? { budgetExceeded: true } : {}),
        };
      }
      return {
        success: true,
        data: {
          fqn,
          matched_spec_path: match.path,
          service_url: prov.service_url,
          response: result.data,
        },
      };
    }

    return { success: false, error: `Unknown paysh kind: ${kind}`, status: 400 };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[paysh] runPayshToolForAgent error:`, msg);
    return { success: false, error: msg, status: 400 };
  }
}

const PAYSH_AUTO_REFRESH_DEFAULT_MS = 86_400_000; // 24h — no env required

/**
 * Background pull of pay.sh catalog so new providers and sha bumps appear without redeploy.
 * Default: every 24h. Opt-out: PAYSH_AUTO_REFRESH_ENABLED=false. Optional: PAYSH_AUTO_REFRESH_INTERVAL_MS (min 60s).
 */
export function startPayshCatalogAutoRefresh() {
  if (String(process.env.PAYSH_AUTO_REFRESH_ENABLED || 'true').trim().toLowerCase() === 'false') {
    return;
  }
  if (_catalogAutoRefreshTimer) {
    return;
  }
  const interval = Number.parseInt(
    process.env.PAYSH_AUTO_REFRESH_INTERVAL_MS || String(PAYSH_AUTO_REFRESH_DEFAULT_MS),
    10
  );
  const ms = Number.isFinite(interval) && interval >= 60_000 ? interval : PAYSH_AUTO_REFRESH_DEFAULT_MS;
  _catalogAutoRefreshTimer = setInterval(() => {
    fetchCatalog({ forceRefresh: true }).catch((e) => {
      const msg = e instanceof Error ? e.message : String(e);
      console.warn('[paysh] auto-refresh catalog failed:', msg);
    });
  }, ms);
  startupVerbose(`[paysh] catalog auto-refresh enabled (every ${ms}ms)`);
  fetchCatalog({ forceRefresh: true }).catch((e) => {
    const msg = e instanceof Error ? e.message : String(e);
    console.warn('[paysh] initial catalog refresh failed:', msg);
  });
}

/**
 * Stop background catalog refresh (e.g. tests).
 */
export function stopPayshCatalogAutoRefresh() {
  if (_catalogAutoRefreshTimer) {
    clearInterval(_catalogAutoRefreshTimer);
    _catalogAutoRefreshTimer = null;
  }
}
