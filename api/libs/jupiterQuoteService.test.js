/**
 * Jupiter quote request parsing.
 * Run: node --test api/libs/jupiterQuoteService.test.js
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { parseJupiterQuoteRequest } from "./jupiterQuoteService.js";

const WSOL = "So11111111111111111111111111111111111111112";
const USDC = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

test("parseJupiterQuoteRequest accepts GET query params", () => {
  const parsed = parseJupiterQuoteRequest({
    method: "GET",
    query: {
      inputMint: WSOL,
      outputMint: USDC,
      amount: "1000000",
      slippageBps: "100",
    },
  });
  assert.equal(parsed.inputMint, WSOL);
  assert.equal(parsed.outputMint, USDC);
  assert.equal(parsed.amount, "1000000");
  assert.equal(parsed.slippageBps, 100);
});

test("parseJupiterQuoteRequest accepts POST JSON body", () => {
  const parsed = parseJupiterQuoteRequest({
    method: "POST",
    body: {
      inputMint: WSOL,
      outputMint: USDC,
      amount: "5000000",
    },
  });
  assert.equal(parsed.amount, "5000000");
  assert.equal(parsed.slippageBps, 50);
});

test("parseJupiterQuoteRequest rejects missing fields", () => {
  assert.throws(
    () =>
      parseJupiterQuoteRequest({
        method: "GET",
        query: { inputMint: WSOL, outputMint: USDC },
      }),
    /amount are required/,
  );
});

test("parseJupiterQuoteRequest rejects invalid amount", () => {
  assert.throws(
    () =>
      parseJupiterQuoteRequest({
        method: "GET",
        query: { inputMint: WSOL, outputMint: USDC, amount: "0" },
      }),
    /positive integer/,
  );
});
