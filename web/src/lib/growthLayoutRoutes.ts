import { PLAYGROUND_PAGE_CLASS } from "@/components/playground/playgroundStyles";

function matchesPath(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

/** Growth pages that use PLAYGROUND_PAGE_CLASS (not home, marketplace, or playground). */
const GROWTH_CONTENT_EXACT = new Set([
  "/about",
  "/token",
  "/rewards",
  "/privacy",
  "/terms",
  "/cookies",
]);

/**
 * More-menu and related growth routes whose live pages use GROWTH_CONTENT_SHELL.
 * Home is full-bleed. Marketplace and playground already self-pad their skeletons.
 */
export function isGrowthContentRoute(pathname: string): boolean {
  if (GROWTH_CONTENT_EXACT.has(pathname)) return true;
  return matchesPath(pathname, "/articles");
}

/** Same measure as About, Token, and Articles live pages. */
export function growthFallbackShellClass(): string {
  return PLAYGROUND_PAGE_CLASS;
}
