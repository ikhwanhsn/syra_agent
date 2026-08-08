import { describe, expect, it } from "vitest";
import { getTreasuryBannerView } from "@/lib/labsTreasuryBannerCopy";

describe("getTreasuryBannerView", () => {
  it("never shows ~$0.00 USDC fund copy when paused but canFundAny", () => {
    const view = getTreasuryBannerView(
      {
        canFundAny: true,
        paused: true,
        reason: null,
        recommendedTopUpUsdc: 0,
        recommendedTopUpNative: 0,
        recommendedTopUpAlgo: 0,
        fundableCalls: 76,
        topUp: { instructions: null, usdcUsd: 0, native: 0 },
      },
      "algorand",
    );
    expect(view.tone).toBe("recoverable");
    expect(view.body).not.toMatch(/\$0\.00/);
    expect(view.body.toLowerCase()).toMatch(/resume/);
    expect(view.showUsdcTopUp).toBe(false);
  });

  it("leads with ALGO for payto_native_underfunded", () => {
    const view = getTreasuryBannerView(
      {
        canFundAny: false,
        paused: true,
        reason: "payto_native_underfunded",
        recommendedTopUpUsdc: 0,
        recommendedTopUpNative: 0.008,
        recommendedTopUpAlgo: 0.008,
        fundableCalls: 0,
        topUp: { instructions: null, usdcUsd: 0, native: 0.008 },
      },
      "algorand",
    );
    expect(view.tone).toBe("underfunded");
    expect(view.body).toMatch(/ALGO/);
    expect(view.body).not.toMatch(/~\$0\.00 USDC/);
    expect(view.showNativeTopUp).toBe(true);
  });

  it("healthy when canFundAny and not paused", () => {
    const view = getTreasuryBannerView(
      {
        canFundAny: true,
        paused: false,
        reason: null,
        recommendedTopUpUsdc: 0,
        recommendedTopUpNative: 0,
        recommendedTopUpAlgo: 0,
        fundableCalls: 10,
        topUp: null,
      },
      "algorand",
    );
    expect(view.tone).toBe("healthy");
  });
});
