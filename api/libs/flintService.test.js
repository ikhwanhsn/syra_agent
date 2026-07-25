/**
 * Flint service parse helpers — unit tests (no live network).
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  parseFlintBookRequest,
  parseFlintCandlesRequest,
  parseFlintExternalTapeRequest,
  resolveFlintPair,
} from "./flintService.js";

describe("flintService parsers", () => {
  it("resolveFlintPair accepts base/quote and pair label", () => {
    assert.equal(resolveFlintPair({ base: "pump", quote: "usdc" }).base, "PUMP");
    assert.equal(resolveFlintPair({ pair: "SOL/USDC" }).base, "SOL");
    assert.equal(resolveFlintPair({ pair: "SOL/USDC" }).quote, "USDC");
  });

  it("parseFlintBookRequest defaults level to L2", () => {
    const p = parseFlintBookRequest({ method: "GET", query: { base: "PUMP" } });
    assert.equal(p.level, "L2");
    assert.equal(p.pair.base, "PUMP");
  });

  it("parseFlintCandlesRequest supports fills kind and default start", () => {
    const c = parseFlintCandlesRequest({
      method: "GET",
      query: { base: "PUMP", kind: "fills", limit: "10" },
    });
    assert.equal(c.kind, "fills");
    assert.equal(c.limit, 10);

    const candles = parseFlintCandlesRequest({
      method: "GET",
      query: { base: "PUMP" },
    });
    assert.equal(candles.kind, "candles");
    assert.ok(candles.startMicros);
  });

  it("parseFlintExternalTapeRequest clamps timeout", () => {
    const t = parseFlintExternalTapeRequest({
      method: "GET",
      query: { base: "PUMP", timeoutMs: "99999", maxEvents: "100" },
    });
    assert.equal(t.timeoutMs, 8000);
    assert.equal(t.maxEvents, 50);
  });
});
