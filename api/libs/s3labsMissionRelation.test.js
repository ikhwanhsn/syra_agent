/**
 * Mission reply/quote relation filter.
 * Run: node --test api/libs/s3labsMissionRelation.test.js
 */
import { test } from "node:test";
import assert from "node:assert/strict";

/**
 * Mirrors s3labsMissionService isRelatedToMission.
 * @param {{ inReplyToId?: string | null; quotedTweetId?: string | null; conversationId?: string | null }} tweet
 * @param {string} sourceTweetId
 */
function isRelatedToMission(tweet, sourceTweetId) {
  const source = String(sourceTweetId || "").trim();
  if (!source) return false;

  const replyId =
    tweet.inReplyToId != null ? String(tweet.inReplyToId).trim() : null;
  const quoteId =
    tweet.quotedTweetId != null ? String(tweet.quotedTweetId).trim() : null;
  const conversationId =
    tweet.conversationId != null ? String(tweet.conversationId).trim() : null;

  if (replyId === source || quoteId === source || conversationId === source) {
    return true;
  }

  if (replyId != null && replyId !== source) return false;
  if (quoteId != null && quoteId !== source) return false;

  return replyId == null && quoteId == null;
}

const SOURCE = "111";

test("accepts reply when inReplyToId matches source", () => {
  assert.equal(isRelatedToMission({ inReplyToId: SOURCE }, SOURCE), true);
});

test("accepts quote when quotedTweetId matches source", () => {
  assert.equal(isRelatedToMission({ quotedTweetId: SOURCE }, SOURCE), true);
});

test("accepts when conversationId matches source", () => {
  assert.equal(isRelatedToMission({ conversationId: SOURCE }, SOURCE), true);
});

test("accepts when parent ids are missing (API quirk)", () => {
  assert.equal(
    isRelatedToMission({ inReplyToId: null, quotedTweetId: null }, SOURCE),
    true,
  );
});

test("rejects reply to a different tweet", () => {
  assert.equal(isRelatedToMission({ inReplyToId: "999" }, SOURCE), false);
});

test("rejects quote of a different tweet", () => {
  assert.equal(isRelatedToMission({ quotedTweetId: "222" }, SOURCE), false);
});
