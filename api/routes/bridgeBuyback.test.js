/**
 * Unit tests for Relay bridge buyback fee recipient resolution + fee parsing helpers.
 */
import assert from "node:assert/strict";
import { describe, it, afterEach } from "node:test";
import {
  resolveRelayAppFeeRecipient,
} from "../routes/bridgeBuyback.js";
import { BASE_PAYTO } from "../config/settlement.js";

describe("bridgeBuyback recipient", () => {
  const prev = process.env.RELAY_APP_FEE_RECIPIENT;

  afterEach(() => {
    if (prev === undefined) delete process.env.RELAY_APP_FEE_RECIPIENT;
    else process.env.RELAY_APP_FEE_RECIPIENT = prev;
  });

  it("defaults to BASE_PAYTO when env unset", () => {
    delete process.env.RELAY_APP_FEE_RECIPIENT;
    assert.equal(
      resolveRelayAppFeeRecipient()?.toLowerCase(),
      BASE_PAYTO.toLowerCase(),
    );
  });

  it("prefers RELAY_APP_FEE_RECIPIENT when valid", () => {
    process.env.RELAY_APP_FEE_RECIPIENT =
      "0x1111111111111111111111111111111111111111";
    assert.equal(
      resolveRelayAppFeeRecipient(),
      "0x1111111111111111111111111111111111111111",
    );
  });

  it("ignores invalid env and falls back", () => {
    process.env.RELAY_APP_FEE_RECIPIENT = "not-an-address";
    assert.equal(
      resolveRelayAppFeeRecipient()?.toLowerCase(),
      BASE_PAYTO.toLowerCase(),
    );
  });
});
