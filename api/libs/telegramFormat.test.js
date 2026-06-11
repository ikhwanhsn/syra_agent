/**
 * Run: node --test api/libs/telegramFormat.test.js
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { escapeTelegramHtml, markdownToTelegramHtml } from "./telegramFormat.js";

test("escapeTelegramHtml escapes reserved characters", () => {
  assert.equal(escapeTelegramHtml("a < b & c > d"), "a &lt; b &amp; c &gt; d");
});

test("markdownToTelegramHtml converts bold, italic, code, and bullets", () => {
  const input = [
    "**Konteks:** model terbaru",
    "",
    "* **Output:** hingga 128k token",
    "* **Harga:** ~$10/MTok",
    "",
    "API id `claude-fable-5`",
  ].join("\n");

  const out = markdownToTelegramHtml(input);

  assert.match(out, /<b>Konteks:<\/b>/);
  assert.match(out, /<b>Output:<\/b>/);
  assert.match(out, /<b>Harga:<\/b>/);
  assert.match(out, /<code>claude-fable-5<\/code>/);
  assert.match(out, /• <b>Output:<\/b>/);
  assert.doesNotMatch(out, /\*\*/);
});
