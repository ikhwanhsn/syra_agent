/**
 * EVM cross-facilitator verify failover: when Dexter /verify times out,
 * re-verify via GoPlausible → PayAI with injectable fake resource servers.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  isEvmNetwork,
  evmVerifyFailoverOrder,
  tryEvmVerifyFailover,
} from "./x402PaymentV2.js";

const baseAcc = {
  network: "eip155:8453",
  payTo: "0x1111111111111111111111111111111111111111",
  asset: "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",
  amount: "20000",
};

const payload = { x402Version: 2, accepted: baseAcc };

function fakeBundle(profile, verifyImpl) {
  return {
    resourceServer: {
      profile,
      verifyPayment: verifyImpl,
    },
  };
}

describe("isEvmNetwork", () => {
  it("matches eip155 CAIP-2", () => {
    assert.equal(isEvmNetwork({ network: "eip155:8453" }), true);
    assert.equal(isEvmNetwork({ network: "EIP155:1" }), true);
  });

  it("rejects Solana and empty", () => {
    assert.equal(isEvmNetwork({ network: "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp" }), false);
    assert.equal(isEvmNetwork({ network: "base" }), false);
    assert.equal(isEvmNetwork({}), false);
    assert.equal(isEvmNetwork(null), false);
  });
});

describe("evmVerifyFailoverOrder", () => {
  it("from dexter → goplausible, payai", () => {
    assert.deepEqual(evmVerifyFailoverOrder("dexter"), ["goplausible", "payai"]);
  });

  it("from goplausible → payai, dexter", () => {
    assert.deepEqual(evmVerifyFailoverOrder("goplausible"), ["payai", "dexter"]);
  });

  it("from payai → goplausible, dexter", () => {
    assert.deepEqual(evmVerifyFailoverOrder("payai"), ["goplausible", "dexter"]);
  });

  it("unknown defaults like dexter", () => {
    assert.deepEqual(evmVerifyFailoverOrder(""), ["goplausible", "payai"]);
  });
});

describe("tryEvmVerifyFailover", () => {
  it("picks GoPlausible when Dexter failed and GoPlausible verifies", async () => {
    /** @type {string[]} */
    const tried = [];
    const result = await tryEvmVerifyFailover(payload, baseAcc, "dexter", {
      verifyTimeoutMs: 500,
      ensureProfile: async (p) => {
        tried.push(`ensure:${p}`);
      },
      getBundle: (p) => {
        tried.push(`get:${p}`);
        if (p === "goplausible") {
          return fakeBundle(p, async () => ({ isValid: true, payer: "0xabc" }));
        }
        return fakeBundle(p, async () => {
          throw new Error("verify_timeout");
        });
      },
    });

    assert.ok(result);
    assert.equal(result.profile, "goplausible");
    assert.equal(result.verify?.isValid, true);
    assert.deepEqual(tried, ["ensure:goplausible", "get:goplausible"]);
  });

  it("falls through to PayAI when GoPlausible also flakes", async () => {
    /** @type {string[]} */
    const tried = [];
    const result = await tryEvmVerifyFailover(payload, baseAcc, "dexter", {
      verifyTimeoutMs: 500,
      ensureProfile: async (p) => {
        tried.push(p);
      },
      getBundle: (p) => {
        if (p === "goplausible") {
          return fakeBundle(p, async () => {
            throw new Error("Facilitator Internal server error");
          });
        }
        if (p === "payai") {
          return fakeBundle(p, async () => ({ isValid: true }));
        }
        return fakeBundle(p, async () => ({ isValid: false }));
      },
    });

    assert.ok(result);
    assert.equal(result.profile, "payai");
    assert.deepEqual(tried, ["goplausible", "payai"]);
  });

  it("returns null when all candidates fail", async () => {
    const result = await tryEvmVerifyFailover(payload, baseAcc, "dexter", {
      verifyTimeoutMs: 200,
      ensureProfile: async () => {},
      getBundle: () =>
        fakeBundle("x", async () => {
          throw new Error("verify_timeout");
        }),
    });
    assert.equal(result, null);
  });

  it("skips invalid verify and tries next candidate", async () => {
    const result = await tryEvmVerifyFailover(payload, baseAcc, "dexter", {
      verifyTimeoutMs: 500,
      ensureProfile: async () => {},
      getBundle: (p) => {
        if (p === "goplausible") {
          return fakeBundle(p, async () => ({ isValid: false, invalidReason: "bad sig" }));
        }
        return fakeBundle(p, async () => ({ isValid: true }));
      },
    });
    assert.ok(result);
    assert.equal(result.profile, "payai");
  });

  it("from goplausible order prefers payai first", async () => {
    /** @type {string[]} */
    const order = [];
    await tryEvmVerifyFailover(payload, baseAcc, "goplausible", {
      verifyTimeoutMs: 200,
      ensureProfile: async (p) => {
        order.push(p);
      },
      getBundle: () =>
        fakeBundle("x", async () => {
          throw new Error("verify_timeout");
        }),
    });
    assert.deepEqual(order, ["payai", "dexter"]);
  });
});
