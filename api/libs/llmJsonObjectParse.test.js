import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { closeTruncatedJson, parseJsonObjectFromLlm } from "./llmJsonObjectParse.js";

describe("parseJsonObjectFromLlm", () => {
  it("parses plain JSON objects", () => {
    const out = parseJsonObjectFromLlm('{"a":1,"b":[2,3]}');
    assert.deepEqual(out, { a: 1, b: [2, 3] });
  });

  it("strips openrouter truncation note and closes truncated arrays", () => {
    const raw = `{
  "growthSummary": "ok",
  "metricHighlights": [
    {"label": "Users", "value": "10"}
  ],
  "userAcquisitionActions": [
    {"title": "Ship referral", "why": "thin funnel", "channel": "product", "effort": "medium", "priority": "high", "expectedImpact": "more users"}
  ],
  "tvlGrowthActions": [
    {"title": "Boost LP", "why": "TVL flat", "channel": "product", "effort": "high", "priority": "high", "expectedImpact": "more TVL"}
  ],
  "productPriorities": [
    {"title": "Onboard agents", "why": "chat sticky", "channel": "product", "effort": "medium", "priority": "medium", "expectedImpact": "retention"}
  ],
  "risksOrCaveats": ["sample size small"
}

[Response was cut off due to length limit. You can ask for more or rephrase.]`;

    const out = /** @type {Record<string, unknown>} */ (parseJsonObjectFromLlm(raw));
    assert.equal(out.growthSummary, "ok");
    assert.ok(Array.isArray(out.risksOrCaveats));
    assert.equal(/** @type {string[]} */ (out.risksOrCaveats)[0], "sample size small");
  });

  it("removes trailing commas", () => {
    const out = parseJsonObjectFromLlm('{"a":1,"b":[1,2,],}');
    assert.deepEqual(out, { a: 1, b: [1, 2] });
  });

  it("parses fenced JSON", () => {
    const out = parseJsonObjectFromLlm('```json\n{"ok":true}\n```');
    assert.deepEqual(out, { ok: true });
  });
});

describe("closeTruncatedJson", () => {
  it("closes unfinished nested structures", () => {
    const closed = closeTruncatedJson('{"items":[{"title":"A"},{"title":"B"');
    assert.deepEqual(JSON.parse(closed), { items: [{ title: "A" }, { title: "B" }] });
  });
});
