import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DEFAULT_BUYBACK_TOTALS_WALLETS,
  resolveBuybackTotalsWallets,
} from "./buybackTotalsWallets.js";

const PRIMARY = "53JhuF8bgxvUQ59nDG6kWs4awUQYCS3wswQmUsV5uC7t";
const SILENT_A = "2uF4W95fKCQEhg64H6voKmZfTpVcCbo7SUUiaovoDaos";
const SILENT_B = "7hfqDiKUAvKMXtucWbG4GctzKDKM7g7pSECBgDZCapBF";

describe("resolveBuybackTotalsWallets", () => {
  it("returns the six default wallets when env is unset", () => {
    const out = resolveBuybackTotalsWallets({
      envValue: null,
      primaryWallet: PRIMARY,
    });
    assert.equal(out.length, DEFAULT_BUYBACK_TOTALS_WALLETS.length);
    assert.deepEqual(out, [...DEFAULT_BUYBACK_TOTALS_WALLETS]);
  });

  it("excludes the primary treasury when it appears in the list", () => {
    const out = resolveBuybackTotalsWallets({
      envValue: null,
      primaryWallet: SILENT_A,
      defaults: [SILENT_A, SILENT_B],
    });
    assert.deepEqual(out, [SILENT_B]);
  });

  it("replaces defaults when BUYBACK_TOTALS_WALLETS is set", () => {
    const out = resolveBuybackTotalsWallets({
      envValue: `${SILENT_B}, ${SILENT_A}, not-a-key`,
      primaryWallet: PRIMARY,
    });
    assert.deepEqual(out, [SILENT_B, SILENT_A]);
  });

  it("dedupes and drops invalid pubkeys", () => {
    const out = resolveBuybackTotalsWallets({
      envValue: `${SILENT_A},${SILENT_A},bogus,${SILENT_B}`,
      primaryWallet: PRIMARY,
    });
    assert.deepEqual(out, [SILENT_A, SILENT_B]);
  });

  it("treats empty env string as use-defaults", () => {
    const out = resolveBuybackTotalsWallets({
      envValue: "   ",
      primaryWallet: PRIMARY,
      defaults: [SILENT_A],
    });
    assert.deepEqual(out, [SILENT_A]);
  });
});
