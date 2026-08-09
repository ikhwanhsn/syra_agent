/**
 * Earn pump.fun launch limit + SAID verify wiring checks.
 * Run: node --test libs/earnPumpfunService.said.test.js
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const serviceSrc = readFileSync(join(here, "earnPumpfunService.js"), "utf8");
const routeSrc = readFileSync(join(here, "../routes/earn.js"), "utf8");

test("launchEarnPumpfunToken no longer enforces one-token-per-wallet limit", () => {
  assert.equal(serviceSrc.includes("earn_token_limit_reached"), false);
  assert.equal(serviceSrc.includes("limitReached"), false);
  assert.match(serviceSrc, /\.limit\(200\)/);
  assert.equal(routeSrc.includes("earn_token_limit_reached"), false);
  assert.equal(routeSrc.includes("limitReached"), false);
});

test("verifyEarnTokenOnSaid syncs SAID across earnAnonymousId and hard-fails signer mismatch", () => {
  assert.match(serviceSrc, /updateMany\s*\(\s*\{\s*earnAnonymousId\s*\}/);
  assert.match(serviceSrc, /earn_wallet_signer_mismatch/);
  assert.match(serviceSrc, /lookupOnChainAgent/);
  assert.match(serviceSrc, /checkVerified/);
  assert.match(serviceSrc, /persistSaidForEarnWallet/);
});
