/**
 * Run: node --test api/config/algorandX402Networks.test.js
 */
import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  X402_GLOBAL_CHALLENGE_TAG,
  getAlgorandChallengeTag,
  withAlgorandChallengeExtra,
} from "./algorandX402Networks.js";

describe("x402 Global Challenge tag helpers", () => {
  const prev = process.env.X402_ALGORAND_CHALLENGE_TAG;

  beforeEach(() => {
    delete process.env.X402_ALGORAND_CHALLENGE_TAG;
  });

  afterEach(() => {
    if (prev === undefined) delete process.env.X402_ALGORAND_CHALLENGE_TAG;
    else process.env.X402_ALGORAND_CHALLENGE_TAG = prev;
  });

  test("default tag is x402-global-challenge", () => {
    assert.equal(X402_GLOBAL_CHALLENGE_TAG, "x402-global-challenge");
    assert.equal(getAlgorandChallengeTag(), "x402-global-challenge");
  });

  test("withAlgorandChallengeExtra merges tag onto empty extra", () => {
    assert.deepEqual(withAlgorandChallengeExtra(undefined), {
      tag: "x402-global-challenge",
    });
    assert.deepEqual(withAlgorandChallengeExtra(null), {
      tag: "x402-global-challenge",
    });
  });

  test("withAlgorandChallengeExtra preserves decimals and feePayer", () => {
    assert.deepEqual(
      withAlgorandChallengeExtra({ decimals: 6, feePayer: "ABC" }),
      { decimals: 6, feePayer: "ABC", tag: "x402-global-challenge" },
    );
  });

  test("X402_ALGORAND_CHALLENGE_TAG=false disables tag", () => {
    process.env.X402_ALGORAND_CHALLENGE_TAG = "false";
    assert.equal(getAlgorandChallengeTag(), null);
    assert.deepEqual(withAlgorandChallengeExtra({ decimals: 6 }), { decimals: 6 });
  });

  test("X402_ALGORAND_CHALLENGE_TAG override replaces default", () => {
    process.env.X402_ALGORAND_CHALLENGE_TAG = "custom-challenge-tag";
    assert.equal(getAlgorandChallengeTag(), "custom-challenge-tag");
    assert.equal(withAlgorandChallengeExtra({}).tag, "custom-challenge-tag");
  });
});
