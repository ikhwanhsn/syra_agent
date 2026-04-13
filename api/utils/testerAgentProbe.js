/**
 * Recognize Syra internal tester-agent HTTP probes (cron / paid E2E).
 * Used to skip buyback-and-burn on settled revenue from health checks.
 */

/**
 * @returns {string}
 */
export function getTesterAgentInternalProbeSecret() {
  return String(
    process.env.TESTER_AGENT_SKIP_BUYBACK_SECRET || process.env.TESTER_AGENT_CRON_SECRET || ""
  ).trim();
}

/**
 * @param {import('express').Request} req
 */
export function isTesterAgentInternalProbeRequest(req) {
  const secret = getTesterAgentInternalProbeSecret();
  if (!secret) return false;
  const sent = String(req.get("x-tester-agent-cron-secret") || "").trim();
  return sent === secret;
}
