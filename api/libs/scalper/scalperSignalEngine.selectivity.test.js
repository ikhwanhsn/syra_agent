import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { passesSelectivityGate } from "./scalperSignalEngine.js";

describe("passesSelectivityGate", () => {
  it("rejects scores below the min opportunity score", () => {
    assert.equal(passesSelectivityGate(0.5, "momentum", 2, 0.55), false);
  });

  it("always rejects solo stocks", () => {
    assert.equal(passesSelectivityGate(0.95, "stocks", 1, 0.55), false);
  });

  it("allows confluence stocks", () => {
    assert.equal(passesSelectivityGate(0.7, "stocks", 2, 0.55), true);
  });
});
