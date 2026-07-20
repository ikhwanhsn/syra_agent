/**
 * Pure helpers for KOL payout idempotency / ambiguous-confirm handling.
 * Kept separate so fund-safety regressions can be unit-tested without Mongo/RPC.
 */

/**
 * True when an error means the tx may already be on-chain (do not blind-retry).
 * @param {unknown} e
 */
export function isAmbiguousPayoutError(e) {
  if (!e || typeof e !== "object") return false;
  const err = /** @type {{ code?: string; ambiguous?: boolean; message?: string }} */ (e);
  if (err.ambiguous) return true;
  const code = err.code || "";
  const message = String(err.message || "");
  return (
    code === "tx_confirm_timeout" ||
    code === "tx_blockhash_expired" ||
    message.includes("tx_confirm_timeout") ||
    message.includes("tx_blockhash_expired")
  );
}

/**
 * Whether a campaign status may be claimed for finalize.
 * @param {string} status
 * @param {Date | string | null | undefined} finalizeStartedAt
 * @param {number} stuckMs
 * @param {number} [nowMs]
 */
export function canClaimCampaignForFinalize(
  status,
  finalizeStartedAt,
  stuckMs,
  nowMs = Date.now(),
) {
  if (status === "active") return true;
  if (status !== "finalizing") return false;
  if (!finalizeStartedAt) return true;
  const started = new Date(finalizeStartedAt).getTime();
  if (!Number.isFinite(started)) return true;
  return nowMs - started >= stuckMs;
}

/**
 * Simulate atomic claim semantics for a payout row (one winner).
 * @param {{ status?: string | null } | null} existing
 * @returns {{ claimed: boolean; reason?: string }}
 */
export function tryClaimPayoutSendSlot(existing) {
  if (!existing) return { claimed: true };
  if (existing.status === "confirmed") {
    return { claimed: false, reason: "already_claimed" };
  }
  if (existing.status === "sending") {
    return { claimed: false, reason: "send_in_progress" };
  }
  return { claimed: true };
}

/**
 * Concurrent claim race: only the first successful claim sends.
 * @param {number} n
 * @returns {{ winners: number; losers: number }}
 */
export function simulateConcurrentPayoutClaims(n) {
  /** @type {{ status: string } | null} */
  let row = null;
  let winners = 0;
  let losers = 0;
  for (let i = 0; i < n; i++) {
    const result = tryClaimPayoutSendSlot(row);
    if (result.claimed) {
      row = { status: "sending" };
      winners += 1;
    } else {
      losers += 1;
    }
  }
  return { winners, losers };
}

/**
 * Concurrent finalize claim race on campaign status.
 * @param {number} n
 * @returns {{ winners: number; losers: number }}
 */
export function simulateConcurrentFinalizeClaims(n) {
  let status = "active";
  let winners = 0;
  let losers = 0;
  for (let i = 0; i < n; i++) {
    if (status === "active") {
      status = "finalizing";
      winners += 1;
    } else {
      losers += 1;
    }
  }
  return { winners, losers };
}

/**
 * After ambiguous confirm, next tick must resolve via chain — never mark failed.
 * @param {{ status: string; txSignature?: string | null }} payout
 * @param {"confirmed" | "pending" | "missing"} chainStatus
 * @returns {{ status: string; resend: boolean }}
 */
export function resolveSendingPayoutOnReentry(payout, chainStatus) {
  if (payout.status !== "sending") {
    return { status: payout.status, resend: false };
  }
  if (!payout.txSignature) {
    return { status: "sending", resend: false };
  }
  if (chainStatus === "confirmed") {
    return { status: "confirmed", resend: false };
  }
  if (chainStatus === "missing") {
    // Only missing (no sig on any RPC after expiry) may allow retry by caller
    return { status: "failed", resend: true };
  }
  return { status: "sending", resend: false };
}
