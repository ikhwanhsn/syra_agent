/**
 * Paid x402 GET /health probe on a fixed interval. Uses the same stack as the tester agent (PAYER_KEYPAIR + getNansenPaymentFetch).
 * Timing and origin: `testerAgentConfig.js` (`SYRA_PROBE_BASE_URL`, `healthX402Monitor*`).
 *
 * Telegram (on failure only, once per outage — no messages while the failure continues until the next success):
 *   SYRA_DEV_BOT_TOKEN — Bot API token
 *   SYRA_DEV_BOT_CHAT_ID — destination chat (user id or group id; get one after /start to your bot)
 *
 * Secret (required to pay x402):
 *   PAYER_KEYPAIR — Solana keypair (base58)
 */
import { getNansenPaymentFetch } from "./sentinelPayer.js";
import { runPaidSchemaProbe } from "./testerAgent/tests.js";
import { SYRA_PROBE_BASE_URL, TESTER_AGENT_CONFIG } from "./testerAgent/testerAgentConfig.js";
import { isDevTelegramConfigured, sendDevTelegram } from "./devTelegramNotifier.js";
import { startupVerbose } from "../utils/startupLog.js";

const HEALTH_PROBE = { id: "health_x402_monitor", method: "GET", path: "/health" };

function formatFailureMessage(baseUrl, result) {
  const parts = [
    "Syra /health (x402 paid) failed",
    `Base: ${baseUrl}`,
    `Probe: ${result.id ?? "paid:health"}`,
  ];
  if (typeof result.status === "number") parts.push(`HTTP: ${result.status}`);
  const detail = [result.detail, result.expect].find((x) => typeof x === "string" && x.trim());
  if (detail) parts.push(detail);
  if (typeof result.bodySnippet === "string" && result.bodySnippet.trim()) {
    parts.push(`Body: ${result.bodySnippet.slice(0, 600)}`);
  }
  return `🚨 ${parts.join("\n")}`;
}

/**
 * Starts setInterval; safe to call once at process startup.
 */
export function startHealthX402Monitor() {
  if (TESTER_AGENT_CONFIG.healthX402MonitorEnabled !== true) {
    startupVerbose("[health-x402-monitor] disabled (testerAgentConfig.healthX402MonitorEnabled)");
    return;
  }
  if (TESTER_AGENT_CONFIG.paidX402ProbesEnabled !== true) {
    startupVerbose("[health-x402-monitor] disabled (testerAgentConfig.paidX402ProbesEnabled)");
    return;
  }
  const baseUrl = SYRA_PROBE_BASE_URL.replace(/\/+$/, "");
  if (!String(process.env.PAYER_KEYPAIR || "").trim()) {
    console.warn("[health-x402-monitor] skipped: set PAYER_KEYPAIR to pay x402 /health");
    return;
  }

  const intervalMs = TESTER_AGENT_CONFIG.healthX402MonitorIntervalMs;
  const timeoutMs = TESTER_AGENT_CONFIG.healthX402MonitorTimeoutMs;
  const runOnStart = TESTER_AGENT_CONFIG.healthX402MonitorRunOnStart === true;

  /** If last tick was success; only Telegram when transitioning from success to failure. */
  let wasHealthy = true;

  const tick = async () => {
    /** @type {AbortSignal|undefined} */
    let signal;
    if (typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function") {
      signal = AbortSignal.timeout(timeoutMs);
    }
    try {
      const paymentFetch = await getNansenPaymentFetch();
      const result = await runPaidSchemaProbe(baseUrl, HEALTH_PROBE, paymentFetch, signal);
      const ok = result.ok === true;
      if (ok) {
        wasHealthy = true;
        return;
      }
      if (wasHealthy) {
        const wantTg = isDevTelegramConfigured();
        const msg = formatFailureMessage(baseUrl, result);
        if (wantTg) {
          const sent = await sendDevTelegram(msg, { disableWebPagePreview: true });
          if (!sent) {
            console.error("[health-x402-monitor]", msg);
          }
        } else {
          console.error("[health-x402-monitor]", msg);
        }
        wasHealthy = false;
      }
    } catch (e) {
      const errText = e instanceof Error ? e.message : String(e);
      if (wasHealthy) {
        const wantTg = isDevTelegramConfigured();
        const msg = `🚨 Syra /health (x402) monitor error\nBase: ${baseUrl}\n${errText.slice(0, 800)}`;
        if (wantTg) {
          const sent = await sendDevTelegram(msg, { disableWebPagePreview: true });
          if (!sent) {
            console.error(msg);
          }
        } else {
          console.error(msg);
        }
        wasHealthy = false;
      }
    }
  };

  if (runOnStart) {
    void tick();
  }
  setInterval(tick, intervalMs);
  startupVerbose(
    `[health-x402-monitor] enabled: every ${intervalMs}ms → ${baseUrl}/health (x402). Telegram: first failure after success only.`,
  );
}
