import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  capJsonPayload,
  isBinaryContentType,
  isDiscoveryBandwidthPath,
  slimImageGenerationResult,
} from "./bandwidthGuards.js";

describe("bandwidthGuards", () => {
  it("detects binary content types", () => {
    assert.equal(isBinaryContentType("image/png"), true);
    assert.equal(isBinaryContentType("video/mp4; charset=binary"), true);
    assert.equal(isBinaryContentType("application/json"), false);
  });

  it("detects discovery paths", () => {
    assert.equal(isDiscoveryBandwidthPath("/openapi.json"), true);
    assert.equal(isDiscoveryBandwidthPath("/.well-known/x402"), true);
    assert.equal(isDiscoveryBandwidthPath("/news"), false);
  });

  it("strips b64_json from image results", () => {
    const { result, stripped } = slimImageGenerationResult({
      data: [{ b64_json: "aaaa", url: "https://example.com/a.png" }],
    });
    assert.equal(stripped, true);
    assert.equal(/** @type {any} */ (result).data[0].b64_json, undefined);
    assert.equal(/** @type {any} */ (result).data[0].url, "https://example.com/a.png");
  });

  it("caps large list payloads", () => {
    const rows = Array.from({ length: 100 }, (_, i) => ({ i, pad: "x".repeat(2000) }));
    const capped = /** @type {any} */ (capJsonPayload({ data: rows }, 8_000));
    assert.equal(capped.truncated, true);
    assert.ok(Array.isArray(capped.data));
    assert.ok(capped.data.length < 100);
    assert.ok(Buffer.byteLength(JSON.stringify(capped), "utf8") <= 8_000);
  });
});
