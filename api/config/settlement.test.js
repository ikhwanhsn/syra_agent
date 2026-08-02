import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getPayToAddresses,
  getFacilitatorUrls,
  SOLANA_PAYTO,
  EVM_PAYTO,
  SOLANA_USDC_MINT,
  FACILITATOR_URL_PAYAI,
  ALGORAND_PAYTO,
  B402_PAY_TO,
  TEMPO_AGENT_PAYOUT,
  CROSSMINT_ONRAMP,
  LP_AGENT_REAL,
} from "./settlement.js";
import { getPayaiPayToAddresses } from "./payaiX402Networks.js";

describe("settlement.js", () => {
  it("pay-tos and facilitators are non-empty", () => {
    const pay = getPayToAddresses();
    assert.equal(pay.solanaPayTo, SOLANA_PAYTO);
    assert.equal(pay.evmPayTo, EVM_PAYTO);
    assert.ok(SOLANA_PAYTO.length > 20);
    assert.match(EVM_PAYTO, /^0x[a-fA-F0-9]{40}$/);
    assert.match(SOLANA_USDC_MINT, /^[1-9A-HJ-NP-Za-km-z]{32,44}$/);
    assert.match(ALGORAND_PAYTO, /^[A-Z2-7]{58}$/);
    assert.match(B402_PAY_TO, /^0x[a-fA-F0-9]{40}$/);

    const urls = getFacilitatorUrls();
    assert.equal(urls.payai, FACILITATOR_URL_PAYAI);
    assert.match(urls.payai, /^https:\/\//);
    assert.match(urls.corbits, /^https:\/\//);
    assert.match(urls.goplausible, /^https:\/\//);
  });

  it("payai module shares settlement payTo", () => {
    assert.deepEqual(getPayaiPayToAddresses(), getPayToAddresses());
  });

  it("product flags are defined", () => {
    assert.equal(typeof TEMPO_AGENT_PAYOUT.enabled, "boolean");
    assert.ok(TEMPO_AGENT_PAYOUT.maxUsd > 0);
    assert.equal(typeof CROSSMINT_ONRAMP.enabled, "boolean");
    assert.equal(typeof LP_AGENT_REAL.enabled, "boolean");
  });

  it("LP real open-signal cron is enabled by default (Earn LP Auto)", () => {
    assert.equal(LP_AGENT_REAL.enabled, true);
    assert.equal(LP_AGENT_REAL.useRealSignals, true);
  });
});
