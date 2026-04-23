/**
 * Paid x402 GET /health probe on a fixed interval. Uses the same stack as the tester agent (PAYER_KEYPAIR + getNansenPaymentFetch).
 *
 * Telegram (on failure only, once per outage — no messages while the failure continues until the next success):
 *   SYRA_DEV_BOT_TOKEN — Bot API token
 *   SYRA_DEV_BOT_CHAT_ID — destination chat (user id or group id; get one after /start to your bot)
 *
 * Other env:
 *   HEALTH_X402_MONITOR_ENABLED — "1" / "true" to start
 *   BASE_URL — API origin (no trailing slash)
 *   PAYER_KEYPAIR — Solana keypair (base58) to pay x402
 *   HEALTH_X402_MONITOR_INTERVAL_MS — default 60000
 *   HEALTH_X402_MONITOR_TIMEOUT_MS — per-request cap, default 120000
 *   HEALTH_X402_MONITOR_RUN_ON_START — set "0" to skip the first tick (only use interval)
 */
import { getNansenPaymentFetch } from "./sentinelPayer.js";
import { runPaidSchemaProbe } from "./testerAgent/tests.js";

const HEALTH_PROBE = { id: "health_x402_monitor", method: "GET", path: "/health" };

function healthMonitorEnvEnabled() {
  const v = String(process.env.HEALTH_X402_MONITOR_ENABLED || "").trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

/**
 * @param {string} text
 */
async function sendTelegramAlert(text) {
  const token = String(process.env.SYRA_DEV_BOT_TOKEN || "").trim();
  const chatId = String(process.env.SYRA_DEV_BOT_CHAT_ID || "").trim();
  if (!token || !chatId) {
    return false;
  }
  const url = `https://api.telegram.org/bot${encodeURIComponent(token)}/sendMessage`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: text.slice(0, 4000),
      disable_web_page_preview: true,
    }),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    console.warn("[health-x402-monitor] Telegram send failed", res.status, t.slice(0, 200));
    return false;
  }
  return true;
}

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
  if (!healthMonitorEnvEnabled()) return;

  const baseUrl = String(process.env.BASE_URL || "").trim().replace(/\/+$/, "");
  if (!baseUrl) {
    console.warn("[health-x402-monitor] skipped: set BASE_URL");
    return;
  }
  if (!String(process.env.PAYER_KEYPAIR || "").trim()) {
    console.warn("[health-x402-monitor] skipped: set PAYER_KEYPAIR to pay x402 /health");
    return;
  }

  const rawInterval = Number(process.env.HEALTH_X402_MONITOR_INTERVAL_MS);
  const intervalMs = Number.isFinite(rawInterval) && rawInterval >= 10_000 ? rawInterval : 60_000;
  const rawTimeout = Number(process.env.HEALTH_X402_MONITOR_TIMEOUT_MS);
  const timeoutMs = Number.isFinite(rawTimeout) && rawTimeout >= 15_000 ? rawTimeout : 120_000;
  const runOnStart = String(process.env.HEALTH_X402_MONITOR_RUN_ON_START || "").trim() !== "0";

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
        const wantTg = Boolean(String(process.env.SYRA_DEV_BOT_TOKEN || "").trim()) &&
          Boolean(String(process.env.SYRA_DEV_BOT_CHAT_ID || "").trim());
        const msg = formatFailureMessage(baseUrl, result);
        if (wantTg) {
          const sent = await sendTelegramAlert(msg);
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
        const wantTg = Boolean(String(process.env.SYRA_DEV_BOT_TOKEN || "").trim()) &&
          Boolean(String(process.env.SYRA_DEV_BOT_CHAT_ID || "").trim());
        const msg = `🚨 Syra /health (x402) monitor error\nBase: ${baseUrl}\n${errText.slice(0, 800)}`;
        if (wantTg) {
          const sent = await sendTelegramAlert(msg);
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
  console.log(
    `[health-x402-monitor] enabled: every ${intervalMs}ms → ${baseUrl}/health (x402). Telegram: first failure after success only.`
  );
}
