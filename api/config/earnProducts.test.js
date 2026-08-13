import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  EARN_PRODUCT_LP,
  EARN_PRODUCTS,
  EARN_YIELD_BLOCKED_EXPERIMENTS,
  assertNoBlockedEarnProducts,
  getEarnProduct,
  getEarnYieldBlockReason,
  listEarnProducts,
} from "./earnProducts.js";

describe("earnProducts blocked paper desks", () => {
  it("keeps Stocks out of the Earn Yield registry", () => {
    assert.equal(getEarnYieldBlockReason("stocks")?.blocked, true);
    assert.equal(getEarnYieldBlockReason("stocks_xstocks_news")?.blocked, true);
    // Must not false-positive live products
    assert.equal(getEarnYieldBlockReason("lp_meteora_dlmm"), null);
    assert.equal(getEarnYieldBlockReason("momentum_rotator"), null);
    assert.equal(getEarnYieldBlockReason("lst_loop"), null);
  });

  it("current registry passes the blocked-experiment assert", () => {
    assert.doesNotThrow(() => assertNoBlockedEarnProducts(EARN_PRODUCTS));
    assert.doesNotThrow(() => assertNoBlockedEarnProducts(listEarnProducts()));
  });

  it("throws when a stocks product is registered", () => {
    assert.throws(
      () =>
        assertNoBlockedEarnProducts([
          {
            id: "stocks_xstocks_news",
            label: "Stocks News",
            status: "coming_soon",
          },
        ]),
      /blocked paper-only experiment/,
    );
  });

  it("documents blocked desks including Stocks", () => {
    assert.ok(EARN_YIELD_BLOCKED_EXPERIMENTS.some((b) => b.id === "stocks"));
  });
});

describe("LP Earn product copy honesty", () => {
  it("does not promise sim-qualified opens or paper cohort expectancy", () => {
    const lp = getEarnProduct(EARN_PRODUCT_LP);
    assert.ok(lp);
    const how = (lp.howItWorks || []).join(" ");
    const disclosures = (lp.disclosures || []).join(" ");
    assert.match(how, /real on-chain track-record gate/i);
    assert.doesNotMatch(how, /sim-qualified/i);
    assert.match(disclosures, /Paper cohort sim PnL/i);
    assert.match(disclosures, /not comparable/i);
    assert.match(String(lp.evidence?.paperSample || ""), /research-only/i);
  });
});
