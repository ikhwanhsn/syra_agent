import {
  DASHBOARD_CONTENT_SHELL,
  PAGE_PADDING_TOP_MEDIUM,
  PAGE_PADDING_TOP_STANDARD,
  PAGE_SAFE_AREA_BOTTOM,
  PAGE_SAFE_AREA_BOTTOM_COMPACT,
} from "@/lib/layoutConstants";
import { cn } from "@/lib/utils";

function matchesPath(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

/** Routes nested under `DashboardLayoutRoute` in App.tsx. */
const DASHBOARD_LAYOUT_PREFIXES = [
  "/overview",
  "/multiwallet",
  "/earn",
  "/treasury",
  "/invest",
  "/spend",
  "/grow",
  "/agent-setup",
  "/agents",
  "/assets",
  "/analyzer",
  "/pumpfun",
  "/lp-experiment",
  "/stocks",
  "/momentum-rotator",
  "/lst-loop",
  "/alpha-sniper",
  "/meridian",
  "/btc",
  "/labs",
  "/llm",
  "/organize",
] as const;

export function isDashboardLayoutRoute(pathname: string): boolean {
  return DASHBOARD_LAYOUT_PREFIXES.some((prefix) => matchesPath(pathname, prefix));
}

const PILLAR_PREFIXES = ["/earn", "/treasury", "/invest", "/spend", "/grow"] as const;

const MEDIUM_PADDING_PREFIXES = [
  "/overview",
  "/agent-setup",
  "/labs",
  "/llm",
  "/organize",
  "/analyzer",
  "/pumpfun",
  "/multiwallet",
] as const;

const STANDARD_SAFE_PREFIXES = ["/assets", "/btc"] as const;

function matchesAny(pathname: string, prefixes: readonly string[]): boolean {
  return prefixes.some((prefix) => matchesPath(pathname, prefix));
}

/**
 * Content measure + padding for dashboard Suspense fallbacks.
 * Matches live page shells so skeletons stay aligned when the sidebar is open or collapsed.
 */
export function dashboardFallbackShellClass(pathname: string): string {
  if (matchesAny(pathname, PILLAR_PREFIXES)) {
    return cn(DASHBOARD_CONTENT_SHELL, "space-y-6 py-4 pb-8 sm:py-6");
  }

  if (matchesAny(pathname, MEDIUM_PADDING_PREFIXES)) {
    return cn(DASHBOARD_CONTENT_SHELL, PAGE_PADDING_TOP_MEDIUM, PAGE_SAFE_AREA_BOTTOM);
  }

  if (matchesAny(pathname, STANDARD_SAFE_PREFIXES)) {
    return cn(DASHBOARD_CONTENT_SHELL, PAGE_PADDING_TOP_STANDARD, PAGE_SAFE_AREA_BOTTOM);
  }

  return cn(DASHBOARD_CONTENT_SHELL, PAGE_PADDING_TOP_STANDARD, PAGE_SAFE_AREA_BOTTOM_COMPACT);
}
