/**
 * Syra tester-agent: unpaid 402 smoke on every x402 route + optional paid response shape checks
 * (e.g. /news → non-empty news[]) when PAYER_KEYPAIR is set.
 * Tuning: `testerAgentConfig.js` (not `.env`).
 */

import { getNansenPaymentFetch } from "../sentinelPayer.js";
import { getX402SmokeProbes } from "./x402ProbeRegistry.js";
import { assertPaidJsonShape } from "./paidResponseAssert.js";
import { bucketProbesByExampleGroup, getX402SmokeProbeGroup } from "./x402ProbeGroup.js";
import { TESTER_AGENT_CONFIG } from "./testerAgentConfig.js";

/** @typedef {{ id: string; name: string; run: (baseUrl: string, signal?: AbortSignal) => Promise<Record<string, unknown>> }} TesterDefinition */

/**
 * Headers so paid probes skip buyback-and-burn in production (`testerAgentProbe.js`).
 * @returns {Record<string, string>}
 */
export function testerAgentInternalHeaders() {
  const secret = String(
    process.env.TESTER_AGENT_SKIP_BUYBACK_SECRET || process.env.TESTER_AGENT_CRON_SECRET || ""
  ).trim();
  if (!secret) return {};
  return { "x-tester-agent-cron-secret": secret };
}

/**
 * @param {Response} res
 * @param {unknown} body
 */
function isX402PaymentChallenge(res, body) {
  if (res.status !== 402) return false;
  const pr = (res.headers.get("payment-required") || res.headers.get("Payment-Required") || "").trim();
  if (pr) return true;
  if (body && typeof body === "object") {
    const o = /** @type {Record<string, unknown>} */ (body);
    if (Array.isArray(o.accepts)) return true;
    if (o.x402Version != null) return true;
    if (typeof o.error === "string" && /payment|x-payment|402/i.test(o.error)) return true;
  }
  return false;
}

/**
 * @param {{ path: string; query?: string }} probe
 * @param {string} root
 */
function probeUrl(root, probe) {
  const path = probe.path.startsWith("/") ? probe.path : `/${probe.path}`;
  const q = probe.query ? (probe.query.startsWith("?") ? probe.query.slice(1) : probe.query) : "";
  return q ? `${root}${path}?${q}` : `${root}${path}`;
}

/**
 * @param {string} baseUrl
 * @param {{ id: string; method: string; path: string; query?: string; body?: unknown }} probe
 * @param {AbortSignal} [signal]
 */
export async function runX402SmokeProbe(baseUrl, probe, signal) {
  const root = String(baseUrl || "").replace(/\/+$/, "");
  const url = probeUrl(root, probe);
  /** @type {RequestInit} */
  const init = {
    method: probe.method,
    redirect: "manual",
    signal,
    headers: {
      Accept: "application/json",
      "User-Agent": "SyraTesterAgent/1.0",
      ...testerAgentInternalHeaders(),
    },
  };
  if (probe.body != null && probe.method !== "GET" && probe.method !== "HEAD" && probe.method !== "DELETE") {
    init.headers = { ...init.headers, "Content-Type": "application/json" };
    init.body = JSON.stringify(probe.body);
  }
  if (probe.method === "DELETE" && probe.body != null) {
    init.headers = { ...init.headers, "Content-Type": "application/json" };
    init.body = JSON.stringify(probe.body);
  }
  const res = await fetch(url, init);
  let body = null;
  try {
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("json")) body = await res.json();
  } catch {
    /* ignore */
  }
  const ok = isX402PaymentChallenge(res, body);
  return {
    id: `smoke:${probe.id}`,
    ok,
    status: res.status,
    method: probe.method,
    path: probe.path,
    expect: "402 + x402 payment challenge",
    hasPaymentChallenge: ok,
  };
}

/**
 * GET /news with x402 payment — 200 + non-empty `news`.
 * @param {string} baseUrl
 * @param {AbortSignal} [signal]
 */
export async function testNewsPaidE2E(baseUrl, signal) {
  const root = String(baseUrl || "").replace(/\/+$/, "");
  const url = `${root}/news?ticker=general`;
  const paymentFetch = wrapPaymentFetchWithFacilitator429Backoff(await getNansenPaymentFetch());
  const res = await paymentFetch(url, {
    method: "GET",
    signal,
    headers: {
      Accept: "application/json",
      "User-Agent": "SyraTesterAgent/1.0",
      ...testerAgentInternalHeaders(),
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    const stopped429 =
      shouldStopSuiteOn429() &&
      (res.status === 429 ||
        (/\b429\b/i.test(text) && /too many requests/i.test(text)) ||
        text.includes("HTTP error (429)"));
    return {
      id: "news_paid_e2e",
      ok: false,
      status: res.status,
      expect: "200 + JSON { news: [...] }",
      error: `HTTP ${res.status}`,
      bodySnippet: text.slice(0, 600),
      ...(stopped429 ? { stoppedDueTo429: true } : {}),
    };
  }
  const data = await res.json().catch(() => null);
  const news = data && typeof data === "object" ? data.news : null;
  const ok = Array.isArray(news) && news.length > 0;
  return {
    id: "news_paid_e2e",
    ok,
    status: res.status,
    expect: "200 + non-empty news[]",
    articleCount: Array.isArray(news) ? news.length : 0,
    sampleTitle: ok ? String(news[0]?.title ?? "").slice(0, 120) : undefined,
  };
}

function getSmokeConcurrency() {
  const n = TESTER_AGENT_CONFIG.smokeConcurrency;
  return Number.isFinite(n) && n > 0 && n <= 32 ? n : 8;
}

function getPaidDelayMs() {
  const n = TESTER_AGENT_CONFIG.paidDelayBetweenProbesMs;
  return Number.isFinite(n) && n >= 0 && n <= 10_000 ? n : 500;
}

/** Pause **between** consecutive probes (smoke + paid); see `TESTER_AGENT_CONFIG.interProbeDelayMs`. */
export function getInterProbeDelayMs() {
  const n = TESTER_AGENT_CONFIG.interProbeDelayMs;
  return Number.isFinite(n) && n >= 0 && n <= 86_400_000 ? n : 0;
}

/** Delay after each probe except the last (paid/smoke when not using flat inter-probe). */
function getBetweenProbeDelayMs() {
  const inter = getInterProbeDelayMs();
  if (inter > 0) return inter;
  return getPaidDelayMs();
}

/** When true, smoke + paid catalogs run one Example-flow group at a time with an inter-group pause. */
export function isTesterAgentGroupedRun() {
  if (getInterProbeDelayMs() > 0) return false;
  return TESTER_AGENT_CONFIG.runByExampleGroup === true;
}

/** Pause between finishing one group and starting the next; see `TESTER_AGENT_CONFIG.interGroupDelayMsWhenGrouped`. */
export function getInterGroupDelayMs() {
  if (!isTesterAgentGroupedRun()) return 0;
  const n = TESTER_AGENT_CONFIG.interGroupDelayMsWhenGrouped;
  return Number.isFinite(n) && n >= 0 && n <= 86_400_000 ? n : 0;
}

/**
 * AbortSignal timeout for `/internal/tester-agent/run` — base from `testerAgentConfig.js`, raised when
 * inter-probe or inter-group sleeps need more time.
 */
export function computeTesterAgentSuiteTimeoutMs() {
  const base = TESTER_AGENT_CONFIG.defaultSuiteTimeoutMs;
  const interProbe = getInterProbeDelayMs();
  const n = getX402SmokeProbes().length;
  const gapsPerCatalog = Math.max(0, n - 1);
  const payer = Boolean(String(process.env.PAYER_KEYPAIR || "").trim());
  const paidCatalog = payer && shouldRunPaidResponseChecks();
  const catalogCount = 1 + (paidCatalog ? 1 : 0);
  if (interProbe > 0) {
    const fromProbePauses = interProbe * gapsPerCatalog * catalogCount;
    const probePad = 600_000;
    return Math.max(base, fromProbePauses + probePad);
  }
  if (!isTesterAgentGroupedRun()) return base;
  const inter = getInterGroupDelayMs();
  const buckets = bucketProbesByExampleGroup(getX402SmokeProbes(), getX402SmokeProbeGroup);
  const gaps = Math.max(0, buckets.length - 1);
  const fromPauses = gaps * inter;
  /** Extra headroom for batched smoke + sequential paid across all probes (ms). */
  const probePad = 3_600_000;
  return Math.max(base, fromPauses + probePad);
}

/**
 * @param {number} ms
 * @param {AbortSignal} [signal]
 */
function shouldStopSuiteOn429() {
  return TESTER_AGENT_CONFIG.stopSuiteOnRateLimit429 === true;
}

/**
 * @param {Record<string, unknown>} row
 */
function probeRowIsRateLimited429(row) {
  if (!row || typeof row !== "object") return false;
  if (row.status === 429) return true;
  const detail = typeof row.detail === "string" ? row.detail : "";
  if (!detail) return false;
  if (detail.includes("HTTP error (429)") || detail.includes("(429):")) return true;
  if (/\b429\b/.test(detail) && /too many requests/i.test(detail)) return true;
  return false;
}

function facilitatorErrorLooks429(e) {
  const msg = e instanceof Error ? e.message : String(e);
  return (
    /\b429\b/i.test(msg) &&
    (/too many requests/i.test(msg) || /rate limit/i.test(msg) || /HTTP error \(429\)/i.test(msg))
  );
}

/**
 * Corbits facilitator (and peers) may return 429 under burst; docs describe flow, not numeric RPS
 * (https://docs.corbits.dev/facilitator/how-it-works.md). Retries one probe’s payment fetch only.
 * @param {(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>} inner
 */
function wrapPaymentFetchWithFacilitator429Backoff(inner) {
  const maxAttempts = Math.max(1, TESTER_AGENT_CONFIG.facilitatorRetryMaxAttempts);
  const baseMs = TESTER_AGENT_CONFIG.facilitatorRetryBaseDelayMs;
  return async (url, init) => {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        return await inner(url, init);
      } catch (e) {
        if (!facilitatorErrorLooks429(e) || attempt === maxAttempts - 1) {
          throw e;
        }
        const delay = Math.round(baseMs * 2 ** attempt + Math.random() * 400);
        await sleepMs(delay, init?.signal);
      }
    }
  };
}

function sleepMs(ms, signal) {
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const onAbort = () => {
      clearTimeout(t);
      reject(signal?.reason instanceof Error ? signal.reason : new Error("aborted"));
    };
    const t = setTimeout(() => {
      if (signal) signal.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    if (signal) {
      if (signal.aborted) {
        clearTimeout(t);
        onAbort();
        return;
      }
      signal.addEventListener("abort", onAbort, { once: true });
    }
  });
}

/** Probes that cannot be validated with our minimal bodies (or would burn paid calls for guaranteed 4xx). */
const SKIP_PAID_RESPONSE_IDS = new Set([
  "siwa_verify",
  "neynar_cast",
  "bankr_job",
  "bankr_cancel",
  "giza_activate",
  "giza_withdraw",
  "giza_top_up",
  "giza_update_protocols",
  "giza_run",
]);

/**
 * When PAYER_KEYPAIR is set: run paid JSON assertions on (almost) all routes if
 * `TESTER_AGENT_CONFIG.paidResponseChecksWhenPayerSet` is true.
 */
export function shouldRunPaidResponseChecks() {
  if (!String(process.env.PAYER_KEYPAIR || "").trim()) return false;
  return TESTER_AGENT_CONFIG.paidResponseChecksWhenPayerSet === true;
}

/**
 * @param {string} baseUrl
 * @param {{ id: string; method: string; path: string; query?: string; body?: unknown }} probe
 * @param {(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>} paymentFetch
 * @param {AbortSignal} [signal]
 */
export async function runPaidSchemaProbe(baseUrl, probe, paymentFetch, signal) {
  if (SKIP_PAID_RESPONSE_IDS.has(probe.id)) {
    return {
      id: `paid:${probe.id}`,
      ok: true,
      skipped: true,
      path: probe.path,
      method: probe.method,
      reason: "skipped (needs real credentials/payload or avoids side effects)",
    };
  }
  const root = String(baseUrl || "").replace(/\/+$/, "");
  const url = probeUrl(root, probe);
  /** @type {RequestInit} */
  const init = {
    method: probe.method,
    redirect: "manual",
    signal,
    headers: {
      Accept: "application/json",
      "User-Agent": "SyraTesterAgent/1.0",
      ...testerAgentInternalHeaders(),
    },
  };
  if (probe.body != null && probe.method !== "GET" && probe.method !== "HEAD" && probe.method !== "DELETE") {
    init.headers = { ...init.headers, "Content-Type": "application/json" };
    init.body = JSON.stringify(probe.body);
  }
  if (probe.method === "DELETE" && probe.body != null) {
    init.headers = { ...init.headers, "Content-Type": "application/json" };
    init.body = JSON.stringify(probe.body);
  }
  let res;
  try {
    res = await paymentFetch(url, init);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return {
      id: `paid:${probe.id}`,
      ok: false,
      path: probe.path,
      method: probe.method,
      detail: msg.slice(0, 400),
    };
  }
  const text = await res.text().catch(() => "");
  let data = null;
  try {
    data = JSON.parse(text);
  } catch {
    data = null;
  }
  if (!res.ok) {
    return {
      id: `paid:${probe.id}`,
      ok: false,
      status: res.status,
      path: probe.path,
      method: probe.method,
      detail: `HTTP ${res.status}`,
      bodySnippet: text.slice(0, 400),
    };
  }
  const v = assertPaidJsonShape(probe.path, probe.method, data);
  return {
    id: `paid:${probe.id}`,
    ok: v.ok,
    status: res.status,
    path: probe.path,
    method: probe.method,
    expect: v.detail,
    summary: v.summary,
    ...(v.ok ? {} : { detail: v.detail }),
  };
}

/**
 * @param {string} baseUrl
 * @param {readonly { id: string; method: string; path: string; query?: string; body?: unknown }[]} probes
 * @param {AbortSignal} [signal]
 */
async function runSmokeProbesBatched(baseUrl, probes, signal) {
  const conc = getSmokeConcurrency();
  /** @type {Record<string, unknown>[]} */
  const sub = [];
  const started = Date.now();
  let stoppedDueTo429 = false;
  for (let i = 0; i < probes.length; i += conc) {
    const batch = probes.slice(i, i + conc);
    const part = await Promise.all(batch.map((p) => runX402SmokeProbe(baseUrl, p, signal)));
    sub.push(...part);
    if (shouldStopSuiteOn429() && part.some((r) => probeRowIsRateLimited429(r))) {
      stoppedDueTo429 = true;
      const hit = part.find((r) => probeRowIsRateLimited429(r));
      if (hit) Object.assign(hit, { suiteAbortedRateLimit: true });
      break;
    }
  }
  return { probes: sub, ms: Date.now() - started, stoppedDueTo429 };
}

/**
 * @param {string} baseUrl
 * @param {readonly { id: string; method: string; path: string; query?: string; body?: unknown }[]} probes
 * @param {(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>} paymentFetch
 * @param {AbortSignal} [signal]
 */
/**
 * @returns {{ rows: Record<string, unknown>[]; stoppedDueTo429: boolean }}
 */
async function runPaidProbesSequential(baseUrl, probes, paymentFetch, signal) {
  const delayMs = getBetweenProbeDelayMs();
  /** @type {Record<string, unknown>[]} */
  const sub = [];
  let stoppedDueTo429 = false;
  for (let i = 0; i < probes.length; i++) {
    const r = await runPaidSchemaProbe(baseUrl, probes[i], paymentFetch, signal);
    sub.push(r);
    if (shouldStopSuiteOn429() && probeRowIsRateLimited429(r)) {
      Object.assign(r, { suiteAbortedRateLimit: true });
      stoppedDueTo429 = true;
      break;
    }
    if (i < probes.length - 1 && delayMs > 0) {
      await sleepMs(delayMs, signal);
    }
  }
  return { rows: sub, stoppedDueTo429 };
}

/**
 * @param {string} baseUrl
 * @param {readonly { id: string; method: string; path: string; query?: string; body?: unknown }[]} probes
 * @param {AbortSignal} [signal]
 */
async function runSmokeProbesSequential(baseUrl, probes, signal) {
  const delayMs = getInterProbeDelayMs();
  /** @type {Record<string, unknown>[]} */
  const sub = [];
  const started = Date.now();
  let stoppedDueTo429 = false;
  for (let i = 0; i < probes.length; i++) {
    const r = await runX402SmokeProbe(baseUrl, probes[i], signal);
    sub.push(r);
    if (shouldStopSuiteOn429() && probeRowIsRateLimited429(r)) {
      Object.assign(r, { suiteAbortedRateLimit: true });
      stoppedDueTo429 = true;
      break;
    }
    if (i < probes.length - 1 && delayMs > 0) {
      await sleepMs(delayMs, signal);
    }
  }
  return { probes: sub, ms: Date.now() - started, stoppedDueTo429 };
}

/**
 * @param {Record<string, unknown>[]} sub
 */
function summarizePaidRows(sub) {
  const actionable = sub.filter((r) => !r.skipped);
  const failed = actionable.filter((r) => !r.ok);
  const skipped = sub.filter((r) => r.skipped);
  return {
    actionable,
    failed,
    skipped,
    skippedCount: skipped.length,
    failedCount: failed.length,
    failedIds: failed.map((r) => String(r.id)),
    workCount: actionable.filter((r) => r.ok).length,
    lossCount: failed.length,
  };
}

/**
 * Paid x402 calls + JSON shape checks (tracks /news → news[], /event → event[], etc.).
 * Runs **sequentially** with a short delay to avoid facilitator 429 when opening many payments.
 * Throttling / grouping: see `testerAgentConfig.js` (`interProbeDelayMs`, `runByExampleGroup`, etc.).
 * @param {string} baseUrl
 * @param {AbortSignal} [signal]
 */
export async function testAllPaidResponseProbes(baseUrl, signal) {
  const started = Date.now();
  /** @type {Record<string, unknown>[]} */
  const sub = [];
  try {
    const paymentFetch = wrapPaymentFetchWithFacilitator429Backoff(await getNansenPaymentFetch());
    const allProbes = getX402SmokeProbes();
    const interProbe = getInterProbeDelayMs();

    if (!isTesterAgentGroupedRun()) {
      const { rows, stoppedDueTo429 } = await runPaidProbesSequential(baseUrl, allProbes, paymentFetch, signal);
      sub.push(...rows);
      const s = summarizePaidRows(sub);
      return {
        id: "x402_paid_responses_all",
        ok: s.failed.length === 0 && !stoppedDueTo429,
        expect: "200 + route-specific JSON (e.g. news[], event[])",
        probeCount: allProbes.length,
        completedProbeCount: sub.length,
        stoppedDueTo429,
        skippedCount: s.skippedCount,
        failedCount: s.failedCount,
        failedIds: s.failedIds,
        workCount: s.workCount,
        lossCount: s.lossCount,
        ...(interProbe > 0 ? { sequentialThrottled: true, interProbeDelayMs: interProbe } : {}),
        ms: Date.now() - started,
        probes: sub,
      };
    }

    const inter = getInterGroupDelayMs();
    const buckets = bucketProbesByExampleGroup(allProbes, getX402SmokeProbeGroup);
    /** @type {Record<string, unknown>[]} */
    const groups = [];
    let stoppedDueTo429 = false;
    for (let gi = 0; gi < buckets.length; gi++) {
      const b = buckets[gi];
      const gStarted = Date.now();
      const { rows, stoppedDueTo429: group429 } = await runPaidProbesSequential(
        baseUrl,
        b.probes,
        paymentFetch,
        signal
      );
      sub.push(...rows);
      const s = summarizePaidRows(rows);
      groups.push({
        slug: b.slug,
        name: b.name,
        probeCount: b.probes.length,
        skippedCount: s.skippedCount,
        failedCount: s.failedCount,
        failedIds: s.failedIds,
        workCount: s.workCount,
        lossCount: s.lossCount,
        stoppedDueTo429: group429,
        ms: Date.now() - gStarted,
        probes: rows,
      });
      if (group429) {
        stoppedDueTo429 = true;
        break;
      }
      if (gi < buckets.length - 1 && inter > 0) {
        await sleepMs(inter, signal);
      }
    }

    const tot = summarizePaidRows(sub);
    return {
      id: "x402_paid_responses_all",
      grouped: true,
      interGroupDelayMs: inter,
      ok: tot.failed.length === 0 && !stoppedDueTo429,
      expect: "200 + route-specific JSON (e.g. news[], event[])",
      probeCount: allProbes.length,
      completedProbeCount: sub.length,
      stoppedDueTo429,
      skippedCount: tot.skippedCount,
      failedCount: tot.failedCount,
      failedIds: tot.failedIds,
      workCount: tot.workCount,
      lossCount: tot.lossCount,
      ms: Date.now() - started,
      groups,
      probes: sub,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const s = summarizePaidRows(sub);
    return {
      id: "x402_paid_responses_all",
      ok: false,
      grouped: isTesterAgentGroupedRun(),
      interGroupDelayMs: isTesterAgentGroupedRun() ? getInterGroupDelayMs() : 0,
      ...(getInterProbeDelayMs() > 0
        ? { sequentialThrottled: true, interProbeDelayMs: getInterProbeDelayMs() }
        : {}),
      expect: "200 + route-specific JSON (e.g. news[], event[])",
      error: msg,
      probeCount: getX402SmokeProbes().length,
      completedCount: sub.length,
      skippedCount: s.skippedCount,
      failedCount: s.failedCount,
      failedIds: s.failedIds,
      workCount: s.workCount,
      lossCount: s.lossCount,
      ms: Date.now() - started,
      probes: sub,
    };
  }
}

/**
 * Run all smoke probes (batched, sequential with inter-probe delay, or by Example-flow group — see `testerAgentConfig.js`).
 * @param {string} baseUrl
 * @param {AbortSignal} [signal]
 */
export async function testAllX402SmokeProbes(baseUrl, signal) {
  const probes = getX402SmokeProbes();
  const started = Date.now();
  const interProbe = getInterProbeDelayMs();

  if (interProbe > 0) {
    const { probes: sub, ms, stoppedDueTo429 } = await runSmokeProbesSequential(baseUrl, probes, signal);
    const failed = sub.filter((r) => !r.ok);
    const workCount = sub.length - failed.length;
    return {
      id: "x402_smoke_all",
      ok: failed.length === 0 && !stoppedDueTo429,
      expect: "402 + payment challenge on every x402 route",
      probeCount: probes.length,
      completedProbeCount: sub.length,
      stoppedDueTo429,
      failedCount: failed.length,
      failedIds: failed.map((r) => r.id),
      workCount,
      lossCount: failed.length,
      sequentialThrottled: true,
      interProbeDelayMs: interProbe,
      ms,
      probes: sub,
    };
  }

  if (!isTesterAgentGroupedRun()) {
    const { probes: sub, ms, stoppedDueTo429 } = await runSmokeProbesBatched(baseUrl, probes, signal);
    const failed = sub.filter((r) => !r.ok);
    const workCount = sub.length - failed.length;
    return {
      id: "x402_smoke_all",
      ok: failed.length === 0 && !stoppedDueTo429,
      expect: "402 + payment challenge on every x402 route",
      probeCount: probes.length,
      completedProbeCount: sub.length,
      stoppedDueTo429,
      failedCount: failed.length,
      failedIds: failed.map((r) => r.id),
      workCount,
      lossCount: failed.length,
      ms,
      probes: sub,
    };
  }

  const inter = getInterGroupDelayMs();
  const buckets = bucketProbesByExampleGroup(probes, getX402SmokeProbeGroup);
  /** @type {Record<string, unknown>[]} */
  const sub = [];
  /** @type {Record<string, unknown>[]} */
  const groups = [];
  let stoppedDueTo429 = false;
  for (let gi = 0; gi < buckets.length; gi++) {
    const b = buckets[gi];
    const gStarted = Date.now();
    const { probes: part, ms, stoppedDueTo429: g429 } = await runSmokeProbesBatched(baseUrl, b.probes, signal);
    sub.push(...part);
    const failed = part.filter((r) => !r.ok);
    groups.push({
      slug: b.slug,
      name: b.name,
      probeCount: b.probes.length,
      workCount: part.length - failed.length,
      lossCount: failed.length,
      failedIds: failed.map((r) => r.id),
      stoppedDueTo429: g429,
      ms,
      probes: part,
    });
    if (g429) {
      stoppedDueTo429 = true;
      break;
    }
    if (gi < buckets.length - 1 && inter > 0) {
      await sleepMs(inter, signal);
    }
  }
  const failed = sub.filter((r) => !r.ok);
  const workCount = sub.length - failed.length;
  return {
    id: "x402_smoke_all",
    grouped: true,
    interGroupDelayMs: inter,
    ok: failed.length === 0 && !stoppedDueTo429,
    expect: "402 + payment challenge on every x402 route",
    probeCount: probes.length,
    completedProbeCount: sub.length,
    stoppedDueTo429,
    failedCount: failed.length,
    failedIds: failed.map((r) => r.id),
    workCount,
    lossCount: failed.length,
    ms: Date.now() - started,
    groups,
    probes: sub,
  };
}

const includePaidNews = Boolean(String(process.env.PAYER_KEYPAIR || "").trim());
const runPaidSchema = includePaidNews && shouldRunPaidResponseChecks();

/** @type {TesterDefinition[]} */
export const TEST_REGISTRY = [
  {
    id: "x402_smoke_all",
    name: "All x402 routes — unpaid 402 smoke (full catalog)",
    run: testAllX402SmokeProbes,
  },
  ...(runPaidSchema
    ? [
        {
          id: "x402_paid_responses_all",
          name: "All x402 routes — paid 200 + JSON shape (news/event/signal/…); toggle `paidResponseChecksWhenPayerSet` in testerAgentConfig.js",
          run: testAllPaidResponseProbes,
        },
      ]
    : includePaidNews
      ? [
          {
            id: "news_paid_e2e",
            name: "GET /news paid E2E only (enable full paid catalog via `paidResponseChecksWhenPayerSet` in testerAgentConfig.js)",
            run: testNewsPaidE2E,
          },
        ]
      : []),
];

/**
 * @param {string} baseUrl - e.g. https://api.syraa.fun
 * @param {{ signal?: AbortSignal }} [opts]
 */
export async function runTesterAgentSuite(baseUrl, opts = {}) {
  const { signal } = opts;
  const results = [];
  let skipDueTo429 = false;
  for (const t of TEST_REGISTRY) {
    const started = Date.now();
    if (skipDueTo429) {
      results.push({
        id: t.id,
        ok: false,
        skippedDueToPriorRateLimit429: true,
        expect: "skipped: a prior suite step hit HTTP 429 (see testerAgentConfig.stopSuiteOnRateLimit429)",
        ms: 0,
      });
      continue;
    }
    try {
      const out = await t.run(baseUrl, signal);
      results.push({ ...out, ms: out.ms ?? Date.now() - started });
      if (out && out.stoppedDueTo429 === true) skipDueTo429 = true;
    } catch (e) {
      results.push({
        id: t.id,
        ok: false,
        error: e instanceof Error ? e.message : String(e),
        ms: Date.now() - started,
      });
    }
  }
  const smoke = results.find((r) => r.id === "x402_smoke_all");
  const paidNews = results.find((r) => r.id === "news_paid_e2e");
  const paidAll = results.find((r) => r.id === "x402_paid_responses_all");
  const stopped429 =
    smoke?.stoppedDueTo429 === true ||
    paidAll?.stoppedDueTo429 === true ||
    paidNews?.stoppedDueTo429 === true;
  return {
    success: results.every((r) => r.ok === true),
    ranAt: new Date().toISOString(),
    baseUrl,
    results,
    summary: {
      smokeAllOk: smoke?.ok === true,
      smokeProbeCount: typeof smoke?.probeCount === "number" ? smoke.probeCount : undefined,
      smokeFailedCount: typeof smoke?.failedCount === "number" ? smoke.failedCount : undefined,
      smokeWorkCount: typeof smoke?.workCount === "number" ? smoke.workCount : undefined,
      smokeLossCount: typeof smoke?.lossCount === "number" ? smoke.lossCount : undefined,
      stoppedDueTo429: stopped429,
      paidResponseChecksEnabled: shouldRunPaidResponseChecks(),
      paidResponsesAllOk: paidAll ? paidAll.ok === true : undefined,
      paidResponseProbeCount: typeof paidAll?.probeCount === "number" ? paidAll.probeCount : undefined,
      paidResponseCompletedCount:
        typeof paidAll?.completedProbeCount === "number" ? paidAll.completedProbeCount : undefined,
      paidResponseFailedCount: typeof paidAll?.failedCount === "number" ? paidAll.failedCount : undefined,
      paidResponseSkippedCount: typeof paidAll?.skippedCount === "number" ? paidAll.skippedCount : undefined,
      paidResponseWorkCount: typeof paidAll?.workCount === "number" ? paidAll.workCount : undefined,
      paidResponseLossCount: typeof paidAll?.lossCount === "number" ? paidAll.lossCount : undefined,
      paidNewsOk: paidNews ? paidNews.ok === true : undefined,
    },
  };
}
