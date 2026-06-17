/**
 * S3Labs Telegram digest format — English-only labels.
 * Run: node --test api/libs/s3labs/s3labsDigests.test.js
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { formatS3labsAgentTelegram } from "./s3labsDigests.js";

const SAMPLE_PICK = {
  pick: {
    title: "How to Build a Personal AI Assistant Using Open Source Tools",
    summary: "This guide walks through building a customizable personal AI assistant from scratch.",
    whyItMatters: "Relevant for developers experimenting with AI without paid platforms.",
    url: "https://dev.to/example",
    source: "dev.to",
    category: "developer",
  },
  agentId: "s3labs-agent-developer",
  agentName: "S3Labs Developer Bot",
  agentTag: "DEV",
};

const INDONESIAN_LABELS = [
  "Kenapa penting",
  "Info lengkap",
  "Sumber:",
  "topik t.me",
  " WIB",
  "Tanggal event",
  "Kalender Event",
];

test("developer digest uses English labels only", () => {
  const message = formatS3labsAgentTelegram("developer", SAMPLE_PICK);
  assert.ok(message);
  assert.match(message, /Why it matters:/);
  assert.match(message, /Full details:/);
  assert.match(message, /Source: dev\.to/);
  assert.match(message, /UTC/);
  assert.match(message, /topic t\.me\/s3labs\/4/);
  for (const label of INDONESIAN_LABELS) {
    assert.doesNotMatch(message, new RegExp(label, "i"));
  }
});
