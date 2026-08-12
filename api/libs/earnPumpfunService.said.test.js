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
const saidSrc = readFileSync(join(here, "saidClient.js"), "utf8");
const routeSrc = readFileSync(join(here, "../routes/earn.js"), "utf8");
const apiSrc = readFileSync(
  join(here, "../../web/src/lib/earnPumpfunApi.ts"),
  "utf8",
);

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
  assert.match(serviceSrc, /ensureSaidDirectoryProfile/);
  assert.match(serviceSrc, /registerOffChain/);
});

test("saidClient registerOffChain uses pending directory endpoint", () => {
  assert.match(saidSrc, /\/api\/register\/pending/);
  assert.match(saidSrc, /SAID_PLATFORM_KEY/);
  assert.match(saidSrc, /X-Platform-Key/);
  assert.match(saidSrc, /getAgentDetails/);
  assert.match(saidSrc, /toSaidMetadataUri/);
  assert.match(saidSrc, /forceMetadataRefresh/);
  assert.match(saidSrc, /saidDirectoryNeedsMetadataHeal/);
  assert.match(saidSrc, /https:\/\/ipfs\.io\/ipfs/);
});

test("verifyEarnTokenOnSaid heals Unnamed SAID directory profiles", () => {
  assert.match(serviceSrc, /saidDirectoryNeedsMetadataHeal/);
  assert.match(serviceSrc, /forceMetadataRefresh/);
  assert.match(serviceSrc, /needsMetadataHeal/);
  assert.match(serviceSrc, /profile refresh/);
});

test("verifyEarnTokenOnSaid uses Privy/WalletBroker when legacy keypair is unavailable", () => {
  assert.match(serviceSrc, /getAgentPrivyWalletForX402/);
  assert.match(serviceSrc, /signAndSubmitSerializedTransaction/);
  assert.match(serviceSrc, /signAndSendTransaction/);
  assert.match(serviceSrc, /earn_wallet_signer_unavailable/);
  assert.match(serviceSrc, /EARN_WALLET_SIGNER_UNAVAILABLE_MESSAGE|custody signing is not available/);
  assert.match(serviceSrc, /registerAndVerifyAgentCard\(\{[\s\S]*signAndSendTransaction/);
});

test("saidClient registerAndVerifyAgentCard accepts broker callback signing", () => {
  assert.match(saidSrc, /signAndSendTransaction/);
  assert.match(saidSrc, /signerKeypair is required \(or wallet \+ signAndSendTransaction\)/);
  assert.match(saidSrc, /getWalletSolBalance/);
  assert.match(saidSrc, /requireAllSignatures:\s*false/);
});

test("frontend surfaces human message for earn_wallet_signer_unavailable", () => {
  assert.match(apiSrc, /earn_wallet_signer_unavailable/);
  assert.match(apiSrc, /json\.message/);
  assert.match(apiSrc, /custody signing is not available/);
});
