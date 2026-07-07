import { parsePlaygroundTab } from "@/components/playground/PlaygroundTabBar.types";
import {
  isMarketplacePath,
  LEGACY_PLAYGROUND_ROUTE,
  MARKETPLACE_ROUTE,
} from "@/lib/marketplaceConstants";

/** True when the route should use the marketplace shell layout in AppShell. */
export function isPlaygroundPath(pathname: string): boolean {
  return isMarketplacePath(pathname);
}

export const MARKETPLACE_NAV_BROWSE = MARKETPLACE_ROUTE;
export const MARKETPLACE_NAV_BUILD = `${MARKETPLACE_ROUTE}?tab=build`;
export const MARKETPLACE_NAV_CUSTOM = `${MARKETPLACE_ROUTE}?tab=custom`;

function parseMarketplaceTabFromHref(href: string): ReturnType<typeof parsePlaygroundTab> {
  const queryIndex = href.indexOf("?");
  if (queryIndex < 0) return "syra";
  const params = new URLSearchParams(href.slice(queryIndex + 1));
  return parsePlaygroundTab(params.get("tab"));
}

function parseMarketplaceTabFromSearch(search: string): ReturnType<typeof parsePlaygroundTab> {
  const normalized = search.startsWith("?") ? search.slice(1) : search;
  return parsePlaygroundTab(new URLSearchParams(normalized).get("tab"));
}

/** Active state for marketplace nav links (Browse / Integrate / Custom). */
export function isMarketplaceNavItemActive(
  pathname: string,
  search: string,
  href: string,
): boolean {
  if (!isMarketplacePath(pathname)) return false;
  return parseMarketplaceTabFromHref(href) === parseMarketplaceTabFromSearch(search);
}

/** Active state for the Marketplace nav link. */
export function isPlaygroundNavItemActive(pathname: string, href: string): boolean {
  if (href === MARKETPLACE_ROUTE || href === LEGACY_PLAYGROUND_ROUTE) {
    return isMarketplacePath(pathname);
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
