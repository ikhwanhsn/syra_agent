/**
 * Discovery relation filter — missing inReplyToId/quotedTweetId must not drop posts.
 * Run: node --test api/libs/kolDiscoveryRelation.test.js
 */
import { test } from "node:test";
import assert from "node:assert/strict";

/**
 * Mirrors kolDiscoveryService collectEngagements relation gate.
 * @param {"reply" | "quote"} mode
 * @param {{ inReplyToId?: string | null; quotedTweetId?: string | null }} tweet
 * @param {string} sourceTweetId
 */
function shouldSkipByRelation(mode, tweet, sourceTweetId) {
  if (
    mode === "reply" &&
    tweet.inReplyToId != null &&
    String(tweet.inReplyToId) !== sourceTweetId
  ) {
    return true;
  }
  if (
    mode === "quote" &&
    tweet.quotedTweetId != null &&
    String(tweet.quotedTweetId) !== sourceTweetId
  ) {
    return true;
  }
  return false;
}

const SOURCE = "111";

test("accepts reply when inReplyToId matches source", () => {
  assert.equal(
    shouldSkipByRelation("reply", { inReplyToId: SOURCE }, SOURCE),
    false,
  );
});

test("accepts reply when inReplyToId is missing (API quirk)", () => {
  assert.equal(
    shouldSkipByRelation("reply", { inReplyToId: null }, SOURCE),
    false,
  );
  assert.equal(shouldSkipByRelation("reply", {}, SOURCE), false);
});

test("rejects nested reply that points at a different parent", () => {
  assert.equal(
    shouldSkipByRelation("reply", { inReplyToId: "999" }, SOURCE),
    true,
  );
});

test("accepts quote when quotedTweetId is missing (API quirk)", () => {
  assert.equal(
    shouldSkipByRelation("quote", { quotedTweetId: null }, SOURCE),
    false,
  );
});

test("accepts quote when quotedTweetId matches source", () => {
  assert.equal(
    shouldSkipByRelation("quote", { quotedTweetId: SOURCE }, SOURCE),
    false,
  );
});

test("rejects quote of a different tweet", () => {
  assert.equal(
    shouldSkipByRelation("quote", { quotedTweetId: "222" }, SOURCE),
    true,
  );
});
