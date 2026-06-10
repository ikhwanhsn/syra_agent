/**
 * S3Labs Telegram Q&A mention parsing tests.
 * Run: node --test api/libs/s3labs/s3labsTelegramQa.test.js
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  extractQuestion,
  isBotMentionedInMessage,
  stripBotMentionFromText,
} from "./s3labsTelegramQa.js";

const BOT = { username: "s3labs_bot", id: 9001 };

test("detects @username mention entity", () => {
  const message = {
    text: "@s3labs_bot apa itu fable 5 claude",
    entities: [{ type: "mention", offset: 0, length: 11 }],
  };
  assert.equal(isBotMentionedInMessage(message, BOT.username, BOT.id), true);
  assert.equal(extractQuestion(message, BOT.username, BOT.id), "apa itu fable 5 claude");
});

test("detects text_mention when Telegram omits @username in plain text", () => {
  const message = {
    text: "S3Labs Bot apa itu fable 5 claude",
    entities: [
      {
        type: "text_mention",
        offset: 0,
        length: 11,
        user: { id: BOT.id, is_bot: true, username: BOT.username },
      },
    ],
  };
  assert.equal(isBotMentionedInMessage(message, BOT.username, BOT.id), true);
  assert.equal(extractQuestion(message, BOT.username, BOT.id), "apa itu fable 5 claude");
});

test("falls back to substring match for typed @username", () => {
  const message = {
    text: "@s3labs_bot apa itu hermes agent",
    entities: [],
  };
  assert.equal(isBotMentionedInMessage(message, BOT.username, BOT.id), true);
});

test("stripBotMentionFromText removes multiple bot spans", () => {
  const text = "S3Labs Bot hey @s3labs_bot apa itu DeFi";
  const entities = [
    { type: "text_mention", offset: 0, length: 11, user: { id: BOT.id } },
    { type: "mention", offset: 15, length: 11 },
  ];
  assert.equal(
    stripBotMentionFromText(text, entities, BOT.username, BOT.id),
    "hey apa itu DeFi",
  );
});
