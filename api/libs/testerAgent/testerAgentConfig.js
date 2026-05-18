/**
 * Tester agent defaults — change here instead of growing `.env`.
 *
 * Probe origin: `SYRA_PROBE_BASE_URL` below (in-process schedule, health monitor, `/internal/tester-agent/run`).
 *
 * Paid probes (Solana + Base): gated by `paidX402ProbesEnabled` below (off by default while facilitator load is high).
 *
 * Still read from environment (secrets only, when paid probes are enabled):
 * - `PAYER_KEYPAIR` — enables paid Solana x402 JSON checks when set.
 * - `CMC_PAYER_PRIVATE_KEY` — required for Base GET /news E2E when `includeBasePaidNewsE2E` is true.
 * - `TESTER_AGENT_CRON_SECRET` / `TESTER_AGENT_SKIP_BUYBACK_SECRET` — auth + buyback skip for probes.
 *
 * **Corbits facilitator** (default Syra x402 stack) runs `/accepts` then `/settle` per paid request; see
 * https://docs.corbits.dev/facilitator/how-it-works.md — Mintlify index: https://docs.corbits.dev/llms.txt .
 * Published Corbits docs do **not** give numeric RPS; bursts of sequential paid probes still trigger HTTP 429
 * from `facilitator.corbits.dev`, so the tester uses spacing + retries below.
 */

/** Public API origin for scheduled probes and health x402 monitor (no trailing slash). */
export const SYRA_PROBE_BASE_URL = "https://api.syraa.fun";

/** @type {Readonly<{ paidX402ProbesEnabled: boolean; smokeConcurrency: number; paidDelayBetweenProbesMs: number; interProbeDelayMs: number; runByExampleGroup: boolean; interGroupDelayMsWhenGrouped: number; defaultSuiteTimeoutMs: number; paidResponseChecksWhenPayerSet: boolean; includeBasePaidNewsE2E: boolean; inProcessScheduleEnabled: boolean; scheduleIntervalMs: number; scheduleRunOnStart: boolean; stopSuiteOnRateLimit429: boolean; facilitatorRetryMaxAttempts: number; facilitatorRetryBaseDelayMs: number; healthX402MonitorEnabled: boolean; healthX402MonitorIntervalMs: number; healthX402MonitorTimeoutMs: number; healthX402MonitorRunOnStart: boolean }>} */
export const TESTER_AGENT_CONFIG = Object.freeze({
  /**
   * Master switch for all x402 payment/settlement probes (Solana + Base).
   * When false: no paid catalog, no GET /news E2E, no health x402 monitor — only unpaid 402 smoke if invoked manually.
   */
  paidX402ProbesEnabled: false,
  /**
   * Parallel unpaid smoke fetches per batch when not using inter-probe throttling or grouped smoke batches.
   * 3× baseline (was 8): higher fan-out against the API smoke catalog.
   */
  smokeConcurrency: 24,
  /**
   * Pause between paid probes when `interProbeDelayMs` is 0 (ms). Increase if Corbits still returns 429
   * after retries (each probe opens a new payment / facilitator round-trip).
   * 3× baseline (was 2200 ms): faster Solana paid catalog cadence.
   */
  paidDelayBetweenProbesMs: 733,
  /**
   * Pause between each smoke and each paid probe when greater than 0 (flat sequential run; ignores `runByExampleGroup`).
   * Example: `3 * 60_000` for long soak cadence against the facilitator.
   */
  interProbeDelayMs: 0,
  /** When true (and interProbeDelayMs is 0), smoke/paid run per Example-flow group with inter-group pause. */
  runByExampleGroup: false,
  /** Pause between groups when `runByExampleGroup` is true (milliseconds). 3× baseline (was 15 min). */
  interGroupDelayMsWhenGrouped: 5 * 60_000,
  /** Base AbortSignal timeout before `computeTesterAgentSuiteTimeoutMs` raises the floor for long runs. */
  defaultSuiteTimeoutMs: 15 * 60_000,
  /** If `PAYER_KEYPAIR` is set, run the full paid JSON catalog (not only GET /news). */
  paidResponseChecksWhenPayerSet: true,
  /**
   * When true and `CMC_PAYER_PRIVATE_KEY` is set, register GET /news paid E2E on Base (eip155 USDC).
   * Off by default — Solana-only tester runs until Base E2E is needed again.
   */
  includeBasePaidNewsE2E: false,
  /** In-process scheduled runner in `api/index.js`. Paused while paid probes are off. */
  inProcessScheduleEnabled: false,
  scheduleIntervalMs: 8 * 60 * 60 * 1000,
  scheduleRunOnStart: false,
  /** End the tester run on HTTP 429 / facilitator “Too Many Requests” (skip remaining probes and later suite steps). */
  stopSuiteOnRateLimit429: true,
  /**
   * When `@x402/fetch` throws during payment construction (e.g. facilitator HTTP 429), retry that probe only.
   * Exponential backoff: base × 2^attempt + small jitter (Corbits docs do not specify caps).
   */
  facilitatorRetryMaxAttempts: 6,
  facilitatorRetryBaseDelayMs: 2000,
  /** Paid GET /health x402 monitor (`healthX402Monitor.js`). Paused while facilitator load is high. */
  healthX402MonitorEnabled: false,
  healthX402MonitorIntervalMs: 20_000,
  healthX402MonitorTimeoutMs: 120_000,
  healthX402MonitorRunOnStart: false,
});
