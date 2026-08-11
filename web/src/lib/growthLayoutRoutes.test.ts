import { describe, expect, it } from "vitest";
import { PLAYGROUND_PAGE_CLASS } from "@/components/playground/playgroundStyles";
import { DASHBOARD_CONTENT_SHELL, GROWTH_CONTENT_SHELL } from "./layoutConstants";
import { growthFallbackShellClass, isGrowthContentRoute } from "./growthLayoutRoutes";
import { isDashboardLayoutRoute } from "./dashboardLayoutRoutes";

describe("isGrowthContentRoute", () => {
  it("covers More-menu growth pages and nested articles", () => {
    expect(isGrowthContentRoute("/about")).toBe(true);
    expect(isGrowthContentRoute("/token")).toBe(true);
    expect(isGrowthContentRoute("/articles")).toBe(true);
    expect(isGrowthContentRoute("/articles/machine-money")).toBe(true);
    expect(isGrowthContentRoute("/rewards")).toBe(true);
    expect(isGrowthContentRoute("/privacy")).toBe(true);
  });

  it("excludes home, marketplace, playground, and dashboard", () => {
    expect(isGrowthContentRoute("/")).toBe(false);
    expect(isGrowthContentRoute("/marketplace")).toBe(false);
    expect(isGrowthContentRoute("/playground")).toBe(false);
    expect(isGrowthContentRoute("/overview")).toBe(false);
    expect(isDashboardLayoutRoute("/about")).toBe(false);
    expect(isDashboardLayoutRoute("/token")).toBe(false);
    expect(isDashboardLayoutRoute("/articles")).toBe(false);
  });
});

describe("growthFallbackShellClass", () => {
  it("uses the playground/growth measure, not the dashboard shell", () => {
    const shell = growthFallbackShellClass();
    expect(shell).toBe(PLAYGROUND_PAGE_CLASS);
    expect(shell).toContain(GROWTH_CONTENT_SHELL);
    expect(shell).not.toContain(DASHBOARD_CONTENT_SHELL);
  });
});
