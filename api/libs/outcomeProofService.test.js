/**
 * Outcome proof hashing tests.
 * Run: node --test api/libs/outcomeProofService.test.js
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { hashPayload, canonicalStringify } from "./outcomeProofService.js";

test("canonical stringify sorts keys", () => {
  const a = canonicalStringify({ b: 1, a: 2 });
  const b = canonicalStringify({ a: 2, b: 1 });
  assert.equal(a, b);
});

test("hash is stable", () => {
  const payload = { reportId: "r1", metrics: { realizedPnlUsd: 1.5 }, txProofs: [] };
  assert.equal(hashPayload(payload), hashPayload({ ...payload }));
});

test("hash changes when content changes", () => {
  const h1 = hashPayload({ a: 1 });
  const h2 = hashPayload({ a: 2 });
  assert.notEqual(h1, h2);
});
