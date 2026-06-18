/**
 * pump.fun market list query parsing.
 * Run: node --test api/libs/pumpfunMarketListService.test.js
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { parseListQuery } from "./pumpfunMarketListService.js";

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
