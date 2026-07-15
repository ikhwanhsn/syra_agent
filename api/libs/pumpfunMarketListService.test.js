/**
 * pump.fun market list query parsing + upstream fallback.
 * Run: node --test api/libs/pumpfunMarketListService.test.js
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { fetchPumpfunMarketList, parseListQuery } from "./pumpfunMarketListService.js";

test("parseListQuery defaults", () => {
  const q = parseListQuery({});
  assert.equal(q.limit, 20);
  assert.equal(q.offset, 0);
  assert.equal(q.includeNsfw, false);
});

test("parseListQuery clamps limit", () => {
  const q = parseListQuery({ limit: "99", offset: "5", includeNsfw: "true" });
  assert.equal(q.limit, 50);
  assert.equal(q.offset, 5);
  assert.equal(q.includeNsfw, true);
});

test("parseListQuery rejects invalid limit", () => {
  assert.throws(() => parseListQuery({ limit: "0" }), /positive integer/);
});

test("fetchPumpfunMarketList falls back when primary returns HTTP error", async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  /** @type {string[]} */
  const paths = [];
  globalThis.fetch = async (input) => {
    const url = String(input);
    paths.push(url);
    if (url.includes("/coins/top-runners")) {
      return new Response(
        JSON.stringify({ message: "Coin not found for mint: trending" }),
        { status: 404, headers: { "Content-Type": "application/json" } },
      );
    }
    return new Response(
      JSON.stringify([{ mint: "So11111111111111111111111111111111111111112", name: "SOL" }]),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  };

  const data = await fetchPumpfunMarketList("trending", { query: { limit: 5 } });
  assert.equal(data.count, 1);
  assert.equal(data.upstream.fallbackUsed, true);
  assert.equal(data.upstream.path, "/coins/currently-live");
  assert.ok(paths.some((p) => p.includes("/coins/top-runners")));
  assert.ok(paths.some((p) => p.includes("/coins/currently-live")));
});
