/**
 * Outcome mandate pure-function tests.
 * Run: node --test api/libs/outcomeMandateService.test.js
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  isMandateExecutable,
  mandateToWalletConfigOverlay,
} from "./outcomeMandateService.js";

test("active mandate is executable", () => {
  const r = isMandateExecutable({
    status: "active",
    killSwitch: false,
    expiresAt: null,
  });
  assert.equal(r.allowed, true);
});

test("killed mandate denied", () => {
  const r = isMandateExecutable({ status: "killed", killSwitch: true });
  assert.equal(r.allowed, false);
  assert.ok(r.reasons.includes("kill_switch_active") || r.reasons.some((x) => x.includes("killed")));
});

test("expired mandate denied", () => {
  const r = isMandateExecutable({
    status: "active",
    killSwitch: false,
    expiresAt: new Date(Date.now() - 1000),
  });
  assert.equal(r.allowed, false);
  assert.ok(r.reasons.includes("expired"));
});

test("mandate overlay tightens caps", () => {
  const overlay = mandateToWalletConfigOverlay(
    {
      mandateId: "m1",
      perTxCapUsd: 10,
      dailySpendCapUsd: 50,
      hourlySpendCapUsd: 20,
      allowedTools: ["outcome_lp_open"],
      destinationAllowlist: ["0xabc"],
      maxManagedCapitalUsd: 25,
    },
    {
      perTxCapUsd: 50,
      dailySpendCapUsd: 250,
      hourlySpendCapUsd: 100,
      allowedTools: ["news"],
      destinationAllowlist: [],
    },
  );
  assert.equal(overlay.perTxCapUsd, 10);
  assert.equal(overlay.dailySpendCapUsd, 50);
  assert.deepEqual(overlay.allowedTools, ["outcome_lp_open"]);
  assert.ok(overlay.destinationAllowlist.includes("0xabc"));
});
