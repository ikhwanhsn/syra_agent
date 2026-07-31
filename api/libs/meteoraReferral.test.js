/**
 * Meteora referral helper unit tests.
 * Run: node --test api/libs/meteoraReferral.test.js
 */
import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_METEORA_REFERRAL_CODE,
  getMeteoraReferralCode,
  meteoraReferralUrl,
  withMeteoraRef,
} from "./meteoraReferral.js";

const originalEnv = { ...process.env };

beforeEach(() => {
  process.env = { ...originalEnv };
});

afterEach(() => {
  process.env = { ...originalEnv };
});

test("getMeteoraReferralCode defaults to VUDCXUSRXA", () => {
  delete process.env.METEORA_REFERRAL_CODE;
  assert.equal(getMeteoraReferralCode(), DEFAULT_METEORA_REFERRAL_CODE);
  assert.equal(getMeteoraReferralCode(), "VUDCXUSRXA");
});

test("getMeteoraReferralCode reads METEORA_REFERRAL_CODE env", () => {
  process.env.METEORA_REFERRAL_CODE = "  CUSTOMCODE  ";
  assert.equal(getMeteoraReferralCode(), "CUSTOMCODE");
});

test("getMeteoraReferralCode falls back when env is empty", () => {
  process.env.METEORA_REFERRAL_CODE = "   ";
  assert.equal(getMeteoraReferralCode(), DEFAULT_METEORA_REFERRAL_CODE);
});

test("meteoraReferralUrl builds canonical ref landing URL", () => {
  delete process.env.METEORA_REFERRAL_CODE;
  assert.equal(
    meteoraReferralUrl(),
    "https://www.meteora.ag/ref/VUDCXUSRXA",
  );
  assert.equal(
    meteoraReferralUrl("ABC123"),
    "https://www.meteora.ag/ref/ABC123",
  );
});

test("withMeteoraRef appends ?ref= without duplicating", () => {
  delete process.env.METEORA_REFERRAL_CODE;
  const once = withMeteoraRef("https://app.meteora.ag/dlmm/PoolAddr");
  assert.ok(once.includes("ref=VUDCXUSRXA"));
  assert.equal((once.match(/ref=/g) || []).length, 1);

  const twice = withMeteoraRef(once);
  assert.equal((twice.match(/ref=/g) || []).length, 1);
  assert.ok(twice.includes("ref=VUDCXUSRXA"));
});

test("withMeteoraRef uses & when query already exists", () => {
  delete process.env.METEORA_REFERRAL_CODE;
  const url = withMeteoraRef("https://app.meteora.ag/dlmm/x?foo=1");
  assert.ok(url.includes("foo=1"));
  assert.ok(url.includes("ref=VUDCXUSRXA"));
  assert.ok(!url.includes("?ref=") || url.includes("&ref=") || url.includes("?foo=1&ref="));
});

test("withMeteoraRef returns referral landing when url empty", () => {
  delete process.env.METEORA_REFERRAL_CODE;
  assert.equal(withMeteoraRef(""), meteoraReferralUrl());
  assert.equal(withMeteoraRef("   "), meteoraReferralUrl());
});
