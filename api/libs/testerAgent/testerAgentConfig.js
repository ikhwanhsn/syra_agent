/**
 * Tester agent defaults — change here instead of growing `.env`.
 *
 * Still read from environment (not duplicated here):
 * - `BASE_URL` — probe target origin for `/internal/tester-agent/run` and in-process schedule.
 * - `PAYER_KEYPAIR` — enables paid x402 JSON checks when set.
 * - `TESTER_AGENT_CRON_SECRET` / `TESTER_AGENT_SKIP_BUYBACK_SECRET` — auth + buyback skip for probes.
 *
 * **Corbits facilitator** (default Syra x402 stack) runs `/accepts` then `/settle` per paid request; see
 * https://docs.corbits.dev/facilitator/how-it-works.md — Mintlify index: https://docs.corbits.dev/llms.txt .
 * Published Corbits docs do **not** give numeric RPS; bursts of sequential paid probes still trigger HTTP 429
 * from `facilitator.corbits.dev`, so the tester uses spacing + retries below.
 */

/** @type {Readonly<{ smokeConcurrency: number; paidDelayBetweenProbesMs: number; interProbeDelayMs: number; runByExampleGroup: boolean; interGroupDelayMsWhenGrouped: number; defaultSuiteTimeoutMs: number; paidResponseChecksWhenPayerSet: boolean; inProcessScheduleEnabled: boolean; scheduleIntervalMs: number; scheduleRunOnStart: boolean; stopSuiteOnRateLimit429: boolean; facilitatorRetryMaxAttempts: number; facilitatorRetryBaseDelayMs: number }>} */
export const TESTER_AGENT_CONFIG = Object.freeze({
  /** Parallel unpaid smoke fetches per batch when not using inter-probe throttling or grouped smoke batches. */
  smokeConcurrency: 8,
  /**
   * Pause between paid probes when `interProbeDelayMs` is 0 (ms). Increase if Corbits still returns 429
   * after retries (each probe opens a new payment / facilitator round-trip).
   */
  paidDelayBetweenProbesMs: 2200,
  /**
   * Pause between each smoke and each paid probe when greater than 0 (flat sequential run; ignores `runByExampleGroup`).
   * Example: `3 * 60_000` for long soak cadence against the facilitator.
   */
  interProbeDelayMs: 0,
  /** When true (and interProbeDelayMs is 0), smoke/paid run per Example-flow group with inter-group pause. */
  runByExampleGroup: false,
  /** Pause between groups when `runByExampleGroup` is true (milliseconds). */
  interGroupDelayMsWhenGrouped: 15 * 60_000,
  /** Base AbortSignal timeout before `computeTesterAgentSuiteTimeoutMs` raises the floor for long runs. */
  defaultSuiteTimeoutMs: 15 * 60_000,
  /** If `PAYER_KEYPAIR` is set, run the full paid JSON catalog (not only GET /news). */
  paidResponseChecksWhenPayerSet: true,
  /** In-process 24h-style runner in `api/index.js`. */
  inProcessScheduleEnabled: false,
  scheduleIntervalMs: 24 * 60 * 60 * 1000,
  scheduleRunOnStart: false,
  /** End the tester run on HTTP 429 / facilitator “Too Many Requests” (skip remaining probes and later suite steps). */
  stopSuiteOnRateLimit429: true,
  /**
   * When `@x402/fetch` throws during payment construction (e.g. facilitator HTTP 429), retry that probe only.
   * Exponential backoff: base × 2^attempt + small jitter (Corbits docs do not specify caps).
   */
  facilitatorRetryMaxAttempts: 6,
  facilitatorRetryBaseDelayMs: 2000,
});
