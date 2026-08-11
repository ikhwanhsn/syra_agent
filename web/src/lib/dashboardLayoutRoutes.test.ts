import { describe, expect, it } from "vitest";
import {
  dashboardFallbackShellClass,
  isDashboardLayoutRoute,
} from "./dashboardLayoutRoutes";
import {
  DASHBOARD_CONTENT_SHELL,
  PAGE_PADDING_TOP_MEDIUM,
  PAGE_PADDING_TOP_STANDARD,
  PAGE_SAFE_AREA_BOTTOM,
  PAGE_SAFE_AREA_BOTTOM_COMPACT,
} from "./layoutConstants";

describe("isDashboardLayoutRoute", () => {
  it("covers dashboard layout pages and nested paths", () => {
    expect(isDashboardLayoutRoute("/overview")).toBe(true);
    expect(isDashboardLayoutRoute("/earn/token/abc")).toBe(true);
    expect(isDashboardLayoutRoute("/assets/sol")).toBe(true);
    expect(isDashboardLayoutRoute("/organize")).toBe(true);
    expect(isDashboardLayoutRoute("/btc-experiment")).toBe(true);
    expect(isDashboardLayoutRoute("/btc")).toBe(true);
  });

  it("does not treat marketing or agent routes as dashboard layout", () => {
    expect(isDashboardLayoutRoute("/")).toBe(false);
    expect(isDashboardLayoutRoute("/articles")).toBe(false);
    expect(isDashboardLayoutRoute("/about")).toBe(false);
    expect(isDashboardLayoutRoute("/token")).toBe(false);
    expect(isDashboardLayoutRoute("/post")).toBe(false);
    expect(isDashboardLayoutRoute("/marketplace")).toBe(false);
    expect(isDashboardLayoutRoute("/agent")).toBe(false);
  });
});

describe("dashboardFallbackShellClass", () => {
  it("uses pillar padding for Machine Money pages", () => {
    const shell = dashboardFallbackShellClass("/earn");
    expect(shell).toContain(DASHBOARD_CONTENT_SHELL);
    expect(shell).toContain("py-4");
    expect(shell).toContain("pb-8");
  });

  it("uses medium padding for overview and analyzer", () => {
    const shell = dashboardFallbackShellClass("/overview");
    expect(shell).toContain(PAGE_PADDING_TOP_MEDIUM);
    expect(shell).toContain(PAGE_SAFE_AREA_BOTTOM);
  });

  it("does not treat BTC experiment as the Bitcoin page", () => {
    const btc = dashboardFallbackShellClass("/btc");
    const experiment = dashboardFallbackShellClass("/btc-experiment");
    expect(btc).toContain(PAGE_PADDING_TOP_STANDARD);
    expect(btc).toContain(PAGE_SAFE_AREA_BOTTOM);
    expect(experiment).toContain(PAGE_SAFE_AREA_BOTTOM_COMPACT);
  });
});
