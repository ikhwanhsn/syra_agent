/**
 * Fund-safety regressions for KOL campaign payouts (double-send prevention).
 * Run: node --test api/libs/kolPayoutSafety.test.js
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  isAmbiguousPayoutError,
  canClaimCampaignForFinalize,
  tryClaimPayoutSendSlot,
  simulateConcurrentPayoutClaims,
  simulateConcurrentFinalizeClaims,
  resolveSendingPayoutOnReentry,
} from "./kolPayoutSafety.js";

const STUCK_MS = 30 * 60 * 1000;

test("isAmbiguousPayoutError detects confirm timeout and blockhash expiry", () => {
  assert.equal(isAmbiguousPayoutError({ code: "tx_confirm_timeout" }), true);
  assert.equal(isAmbiguousPayoutError({ code: "tx_blockhash_expired" }), true);
  assert.equal(isAmbiguousPayoutError({ ambiguous: true }), true);
  assert.equal(
    isAmbiguousPayoutError({ message: "tx_confirm_timeout" }),
    true,
  );
  assert.equal(isAmbiguousPayoutError({ message: "pool_insufficient_balance" }), false);
  assert.equal(isAmbiguousPayoutError(null), false);
});

test("canClaimCampaignForFinalize allows active and stuck finalizing only", () => {
  const now = 1_000_000_000_000;
  assert.equal(canClaimCampaignForFinalize("active", null, STUCK_MS, now), true);
  assert.equal(
    canClaimCampaignForFinalize("finalizing", new Date(now - 1000), STUCK_MS, now),
    false,
  );
  assert.equal(
    canClaimCampaignForFinalize(
      "finalizing",
      new Date(now - STUCK_MS - 1),
      STUCK_MS,
      now,
    ),
    true,
  );
  assert.equal(canClaimCampaignForFinalize("completed", null, STUCK_MS, now), false);
  assert.equal(canClaimCampaignForFinalize("finalizing", null, STUCK_MS, now), true);
});

test("tryClaimPayoutSendSlot blocks sending and confirmed", () => {
  assert.deepEqual(tryClaimPayoutSendSlot(null), { claimed: true });
  assert.deepEqual(tryClaimPayoutSendSlot({ status: "pending" }), { claimed: true });
  assert.deepEqual(tryClaimPayoutSendSlot({ status: "failed" }), { claimed: true });
  assert.deepEqual(tryClaimPayoutSendSlot({ status: "sending" }), {
    claimed: false,
    reason: "send_in_progress",
  });
  assert.deepEqual(tryClaimPayoutSendSlot({ status: "confirmed" }), {
    claimed: false,
    reason: "already_claimed",
  });
});

test("concurrent finalize claims: exactly one winner", () => {
  const { winners, losers } = simulateConcurrentFinalizeClaims(8);
  assert.equal(winners, 1);
  assert.equal(losers, 7);
});

test("concurrent payout claims: exactly one winner", () => {
  const { winners, losers } = simulateConcurrentPayoutClaims(5);
  assert.equal(winners, 1);
  assert.equal(losers, 4);
});

test("sending payout with confirmed chain does not resend", () => {
  const result = resolveSendingPayoutOnReentry(
    { status: "sending", txSignature: "sig1" },
    "confirmed",
  );
  assert.equal(result.status, "confirmed");
  assert.equal(result.resend, false);
});

test("sending payout with pending chain does not resend", () => {
  const result = resolveSendingPayoutOnReentry(
    { status: "sending", txSignature: "sig1" },
    "pending",
  );
  assert.equal(result.status, "sending");
  assert.equal(result.resend, false);
});

test("tx_confirm_timeout must not be treated as definitive failure for retry", () => {
  // The old bug: mark failed on timeout → sweep re-sends.
  // Ambiguous errors must keep status sending / no resend while pending.
  assert.equal(isAmbiguousPayoutError({ code: "tx_confirm_timeout" }), true);
  const afterTimeout = resolveSendingPayoutOnReentry(
    { status: "sending", txSignature: "sig-timeout" },
    "pending",
  );
  assert.equal(afterTimeout.resend, false);
});

test("pending-minimum rollover claim: only one concurrent claim gets the balance", () => {
  // Simulate atomic claimPendingPayoutBalanceLamports
  let pending = 5_000_000;
  const claim = () => {
    const prev = pending;
    if (prev <= 0) return 0;
    pending = 0;
    return prev;
  };
  const a = claim();
  const b = claim();
  assert.equal(a, 5_000_000);
  assert.equal(b, 0);
  assert.equal(pending, 0);
});
