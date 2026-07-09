/**
 * Probe x402 discovery endpoints after boot so registries (zauth Provider Hub SDK,
 * x402scan crawlers) see valid HTTP 402 challenges on new routes.
 *
 * Uses the public BASE_URL so registered URLs match production (not localhost).
 * Disable with X402_DISCOVERY_BOOTSTRAP=false.
 */
import { X402_DISCOVERY_RESOURCE_PATHS } from '../config/x402DiscoveryResourcePaths.js';
import { startupVerbose, startupWarn } from '../utils/startupLog.js';

const DEFAULT_PUBLIC_BASE = 'https://api.syraa.fun';
const BOOTSTRAP_DELAY_MS = 8_000;
const PROBE_TIMEOUT_MS = 15_000;

/**
 * @param {string} [segmentPrefix] e.g. "insights/" — only probe matching discovery segments
 * @returns {string[]}
 */
export function listDiscoverySegmentsForBootstrap(segmentPrefix = 'insights/') {
  const prefix = String(segmentPrefix || '').trim();
  return X402_DISCOVERY_RESOURCE_PATHS.filter((seg) =>
    prefix ? seg.startsWith(prefix) : true,
  );
}

/**
 * @param {string} baseUrl
 * @param {string} segment
 */
async function probeDiscoverySegment(baseUrl, segment) {
  const url = `${baseUrl}/${segment.replace(/^\/+/, '')}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    return { segment, url, status: res.status, ok: res.status === 402 };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { segment, url, status: 0, ok: false, error: msg };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Fire-and-forget GET probes against public discovery URLs (402 expected).
 * @param {{ segmentPrefix?: string; delayMs?: number }} [options]
 */
export function scheduleX402DiscoveryBootstrap(options = {}) {
  const envFlag = String(process.env.X402_DISCOVERY_BOOTSTRAP || '').toLowerCase();
  if (envFlag === 'false') return;
  const force = envFlag === 'true' || envFlag === 'force';
  if (!force && process.env.NODE_ENV !== 'production') return;

  const segmentPrefix = options.segmentPrefix ?? 'insights/';
  const segments = listDiscoverySegmentsForBootstrap(segmentPrefix);
  if (segments.length === 0) return;

  const baseUrl = String(
    process.env.BASE_URL || process.env.SYRA_PUBLIC_API_URL || DEFAULT_PUBLIC_BASE,
  ).replace(/\/+$/, '');

  const delayMs =
    typeof options.delayMs === 'number' && Number.isFinite(options.delayMs)
      ? options.delayMs
      : BOOTSTRAP_DELAY_MS;

  setTimeout(() => {
    void (async () => {
      startupVerbose(
        `[x402-discovery-bootstrap] probing ${segments.length} segment(s) at ${baseUrl}`,
      );
      const results = await Promise.all(
        segments.map((segment) => probeDiscoverySegment(baseUrl, segment)),
      );
      const ok = results.filter((r) => r.ok);
      const bad = results.filter((r) => !r.ok);
      if (ok.length) {
        startupVerbose(
          `[x402-discovery-bootstrap] ${ok.length}/${results.length} returned 402 (zauth/x402scan-ready)`,
        );
      }
      if (bad.length) {
        startupWarn(
          `[x402-discovery-bootstrap] ${bad.length} probe(s) did not return 402: ${bad
            .map((r) => `${r.segment}→${r.status || r.error}`)
            .join(', ')}`,
        );
      }
    })().catch((e) => {
      startupWarn(
        '[x402-discovery-bootstrap] failed:',
        e instanceof Error ? e.message : e,
      );
    });
  }, delayMs);
}
