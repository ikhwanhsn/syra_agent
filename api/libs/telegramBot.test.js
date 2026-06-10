/**
 * Telegram send helpers — forum thread normalization.
 * Run: node --test api/libs/telegramBot.test.js
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  normalizeTelegramForumThreadId,
  resolveTelegramTypingThreadId,
  TELEGRAM_GENERAL_FORUM_TOPIC_ID,
} from "./telegramBot.js";

test("normalizeTelegramForumThreadId omits General topic (1)", () => {
  assert.equal(TELEGRAM_GENERAL_FORUM_TOPIC_ID, 1);
  assert.equal(normalizeTelegramForumThreadId(1), undefined);
  assert.equal(normalizeTelegramForumThreadId(undefined), undefined);
  assert.equal(normalizeTelegramForumThreadId(null), undefined);
  assert.equal(normalizeTelegramForumThreadId(0), undefined);
});

test("normalizeTelegramForumThreadId keeps real forum topics", () => {
  assert.equal(normalizeTelegramForumThreadId(402), 402);
  assert.equal(normalizeTelegramForumThreadId(4.9), 4);
});

test("resolveTelegramTypingThreadId keeps General topic for sendChatAction", () => {
  assert.equal(resolveTelegramTypingThreadId(1), 1);
  assert.equal(resolveTelegramTypingThreadId(402), 402);
  assert.equal(resolveTelegramTypingThreadId(undefined), undefined);
});
