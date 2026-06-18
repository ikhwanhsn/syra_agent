import { describe, expect, it } from "vitest";
import { isPublicSyraX402Path } from "./publicX402Routes";
import { X402_DISCOVERY_RESOURCE_PATHS } from "./x402DiscoveryResourcePaths";

describe("isPublicSyraX402Path", () => {
  it("allows advertised discovery resources", () => {
    for (const segment of X402_DISCOVERY_RESOURCE_PATHS) {
      expect(isPublicSyraX402Path(`/${segment}`)).toBe(true);
    }
    expect(isPublicSyraX402Path("/jupiter/quote")).toBe(true);
    expect(isPublicSyraX402Path("/pumpfun/trending")).toBe(true);
    expect(isPublicSyraX402Path("/pumpfun/movers")).toBe(true);
    expect(isPublicSyraX402Path("/pumpfun/analyzer")).toBe(true);
    expect(isPublicSyraX402Path("/assets")).toBe(true);
    expect(isPublicSyraX402Path("/assets/detail")).toBe(true);
  });

  it("rejects routes removed from discovery", () => {
    expect(isPublicSyraX402Path("/analytics/summary")).toBe(false);
    expect(isPublicSyraX402Path("/x/feed")).toBe(false);
    expect(isPublicSyraX402Path("/x-analyzer")).toBe(false);
    expect(isPublicSyraX402Path("/nansen/smart-money/netflow")).toBe(false);
    expect(isPublicSyraX402Path("/mpp/v1/health")).toBe(false);
    expect(isPublicSyraX402Path("/binance/correlation")).toBe(false);
    expect(isPublicSyraX402Path("/8004/register-agent")).toBe(false);
  });
});
