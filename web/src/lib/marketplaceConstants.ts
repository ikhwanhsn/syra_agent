/** Primary route for the x402 API marketplace surface. */
export const MARKETPLACE_ROUTE = "/marketplace";

/** Legacy playground path — redirects to marketplace. */
export const LEGACY_PLAYGROUND_ROUTE = "/playground";

export function isMarketplacePath(pathname: string): boolean {
  return (
    pathname === MARKETPLACE_ROUTE ||
    pathname.startsWith(`${MARKETPLACE_ROUTE}/`) ||
    pathname === LEGACY_PLAYGROUND_ROUTE ||
    pathname.startsWith(`${LEGACY_PLAYGROUND_ROUTE}/`)
  );
}

export function marketplaceSharePath(slug: string): string {
  return `${MARKETPLACE_ROUTE}/s/${slug}`;
}

export function marketplaceApiDetailPath(flowId: string): string {
  return `${MARKETPLACE_ROUTE}/api/${encodeURIComponent(flowId)}`;
}

export function isMarketplaceApiDetailPath(pathname: string): boolean {
  return (
    pathname.startsWith(`${MARKETPLACE_ROUTE}/api/`) ||
    pathname.startsWith(`${LEGACY_PLAYGROUND_ROUTE}/api/`)
  );
}

export function isMarketplaceSharePath(pathname: string): boolean {
  return (
    pathname.startsWith(`${MARKETPLACE_ROUTE}/s/`) ||
    pathname.startsWith(`${LEGACY_PLAYGROUND_ROUTE}/s/`)
  );
}
