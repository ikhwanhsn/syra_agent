/**
 * Tester agent API — smoke / cron checks against Syra’s own HTTP surface.
 *
 * Probe origin: `SYRA_PROBE_BASE_URL` in `testerAgentConfig.js`.
 *
 * Environment (secrets):
 *   PAYER_KEYPAIR — Solana base58 secret key; when set, paid Solana x402 checks run (see `testerAgentConfig.js`).
 *   CMC_PAYER_PRIVATE_KEY — Base/EVM wallet (32-byte hex, optional 0x); when set and `includeBasePaidNewsE2E`, adds GET /news paid E2E on eip155 (Base USDC).
 *   TESTER_AGENT_CRON_SECRET — optional; if set, requests may use header `x-tester-agent-cron-secret`
 *     instead of API key (see requireApiKey skip in api/index.js). Same header is sent on paid probes
 *     so production can skip SYRA buyback for those checks only.
 *   TESTER_AGENT_SKIP_BUYBACK_SECRET — optional; if set without CRON_SECRET for probes, paid probes send
 *     this value as `x-tester-agent-cron-secret` to skip buyback. Otherwise CRON_SECRET is used.
 *
 * All other timing, grouping, concurrency, and schedule flags live in `api/libs/testerAgent/testerAgentConfig.js`.
 *
 * Cron (every 24h) — external:
 *   0 0 * * * curl -sS -f -X POST "$ORIGIN/internal/tester-agent/run" -H "x-tester-agent-cron-secret: $TESTER_AGENT_CRON_SECRET"
 *
 * In-process schedule: `inProcessScheduleEnabled` in testerAgentConfig.js.
 */
import express from "express";
import { SYRA_PROBE_BASE_URL } from "../libs/testerAgent/testerAgentConfig.js";
import {
  computeTesterAgentSuiteTimeoutMs,
  runTesterAgentSuite,
  TEST_REGISTRY,
} from "../libs/testerAgent/tests.js";

function getProbeBaseUrl() {
  return SYRA_PROBE_BASE_URL.replace(/\/+$/, "");
}

export function createInternalTesterAgentRouter() {
  const router = express.Router();

  router.get("/", (_req, res) => {
    res.json({
      service: "tester-agent",
      description:
        "x402 health: unpaid 402 smoke on every route; with PAYER_KEYPAIR, paid JSON checks unless disabled in testerAgentConfig.js.",
      run: "POST or GET /internal/tester-agent/run",
      probeBaseUrl: "SYRA_PROBE_BASE_URL in testerAgentConfig.js",
      configModule: "api/libs/testerAgent/testerAgentConfig.js",
      tests: TEST_REGISTRY.map((t) => ({ id: t.id, name: t.name })),
    });
  });

  async function handleRun(_req, res) {
    const baseUrl = getProbeBaseUrl();
    if (!baseUrl) {
      return res.status(503).json({
        success: false,
        error: "Probe base URL missing (SYRA_PROBE_BASE_URL in testerAgentConfig.js).",
      });
    }
    const ms = computeTesterAgentSuiteTimeoutMs();
    let signal;
    if (typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function") {
      signal = AbortSignal.timeout(ms);
    }
    try {
      const report = await runTesterAgentSuite(baseUrl, { signal });
      const status = report.success ? 200 : 502;
      return res.status(status).json({ success: report.success, ...report });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return res.status(500).json({
        success: false,
        error: "tester_agent_run_failed",
        message: msg,
      });
    }
  }

  router.post("/run", handleRun);
  router.get("/run", handleRun);

  return router;
}
