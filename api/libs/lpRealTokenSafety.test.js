/**
 * Run: node --test api/libs/lpRealTokenSafety.test.js
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { passesRealTokenSafety, isBlockedTokenMint } from "./lpRealTokenSafety.js";

test("passesRealTokenSafety rejects high top-10 concentration", () => {
  const result = passesRealTokenSafety(
    {
      available: true,
      topHoldersPct: 72,
      botHoldersPct: 10,
      holderCount: 1200,
      mcapUsd: 500_000,
      mintAuthorityRenounced: true,
      freezeAuthorityRenounced: true,
    },
    { requireRealSignals: true },
  );
  assert.equal(result.pass, false);
  assert.ok(result.reasons.some((r) => r.startsWith("top10_concentration")));
});

test("passesRealTokenSafety rejects unavailable real signals when required", () => {
  const result = passesRealTokenSafety({ available: false }, { requireRealSignals: true });
  assert.equal(result.pass, false);
  assert.ok(result.reasons.includes("real_signals_unavailable"));
});

test("passesRealTokenSafety accepts healthy token profile", () => {
  const result = passesRealTokenSafety(
    {
      available: true,
      topHoldersPct: 38,
      botHoldersPct: 12,
      holderCount: 2400,
      mcapUsd: 900_000,
      mintAuthorityRenounced: true,
      freezeAuthorityRenounced: true,
    },
    { requireRealSignals: true },
  );
  assert.equal(result.pass, true);
});

test("isBlockedTokenMint returns false for unknown mint", () => {
  assert.equal(isBlockedTokenMint("So11111111111111111111111111111111111111112"), false);
});
