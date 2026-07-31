import { describe, expect, it } from "vitest";
import {
  DEFAULT_METEORA_REFERRAL_CODE,
  getMeteoraReferralCode,
  meteoraReferralUrl,
  withMeteoraRef,
} from "./meteoraReferral";

describe("meteoraReferral", () => {
  it("defaults referral code to VUDCXUSRXA", () => {
    expect(getMeteoraReferralCode()).toBe(DEFAULT_METEORA_REFERRAL_CODE);
    expect(DEFAULT_METEORA_REFERRAL_CODE).toBe("VUDCXUSRXA");
  });

  it("builds canonical referral landing URL", () => {
    expect(meteoraReferralUrl()).toBe("https://www.meteora.ag/ref/VUDCXUSRXA");
    expect(meteoraReferralUrl("ABC123")).toBe("https://www.meteora.ag/ref/ABC123");
  });

  it("appends ?ref= without duplicating", () => {
    const once = withMeteoraRef("https://app.meteora.ag/dlmm/PoolAddr");
    expect(once).toContain("ref=VUDCXUSRXA");
    expect((once.match(/ref=/g) || []).length).toBe(1);

    const twice = withMeteoraRef(once);
    expect((twice.match(/ref=/g) || []).length).toBe(1);
  });

  it("uses & when query already exists", () => {
    const url = withMeteoraRef("https://app.meteora.ag/dlmm/x?foo=1");
    expect(url).toContain("foo=1");
    expect(url).toContain("ref=VUDCXUSRXA");
  });

  it("returns referral landing when url empty", () => {
    expect(withMeteoraRef("")).toBe(meteoraReferralUrl());
  });
});
