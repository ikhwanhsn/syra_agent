/**
 * Trusted-origin API key injection allowlist.
 * Run: node --test api/utils/trustedOriginAuth.test.js
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { isBrowserCallablePath } from "./trustedOriginAuth.js";

test("isBrowserCallablePath allows ship log post studio routes", () => {
  assert.equal(isBrowserCallablePath("/post/studio/state"), true);
  assert.equal(isBrowserCallablePath("/post/studio/state/migrate"), true);
  assert.equal(isBrowserCallablePath("/post/studio/updates/12/posted"), true);
  assert.equal(isBrowserCallablePath("/post/studio/updates/delete"), true);
});

test("isBrowserCallablePath allows BTC intelligence routes", () => {
  assert.equal(isBrowserCallablePath("/btc/overview"), true);
  assert.equal(isBrowserCallablePath("/btc/dashboard"), true);
  assert.equal(isBrowserCallablePath("/btc/bubblemap"), true);
});

test("isBrowserCallablePath allows Jupiter swap UI routes", () => {
  assert.equal(isBrowserCallablePath("/jupiter/ui/tokens"), true);
  assert.equal(isBrowserCallablePath("/jupiter/ui/quote"), true);
  assert.equal(isBrowserCallablePath("/jupiter/ui/swap"), true);
});

test("isBrowserCallablePath rejects unrelated paths", () => {
  assert.equal(isBrowserCallablePath("/post/other"), false);
  assert.equal(isBrowserCallablePath("/"), false);
});
