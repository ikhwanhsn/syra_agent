/**
 * Shared layout tokens for navbar, page shells, and content columns.
 * Keeps horizontal padding and max-width aligned on every route.
 */
export const SITE_MAX_WIDTH = "max-w-[88rem]" as const;

export const SITE_H_PADDING =
  "pl-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))] min-[400px]:px-5 sm:px-8 lg:px-12 xl:px-14" as const;

export const SITE_GUTTER = "mx-auto w-full min-w-0 max-w-full" as const;

/** Main content column — use instead of bare `container` on page routes. */
export const siteShell =
  `${SITE_GUTTER} ${SITE_MAX_WIDTH} ${SITE_H_PADDING}` as const;

/** Top offset below fixed glass navbar + safe area. */
export const pageTopOffset =
  "pt-[max(7rem,calc(env(safe-area-inset-top,0px)+5.5rem))]" as const;

/** Standard page content wrapper used across marketing + app routes. */
export const pageContent =
  `relative z-[1] ${siteShell} ${pageTopOffset}` as const;

/** Navbar shell — same horizontal bounds as page content. */
export const siteNavShell = siteShell;

/** Root shell applied to every page via SitePageShell. */
export const siteRoot =
  "relative min-h-dvh w-full min-w-0 max-w-full overflow-x-clip" as const;

export const siteMain =
  "w-full min-w-0 max-w-full overflow-x-clip pb-[max(1rem,env(safe-area-inset-bottom,0px))]" as const;

/** Fixed navbar — keep dropdowns/portals above this layer. */
export const siteNavZ = "z-[250]" as const;
export const siteNavDropdownZ = "z-[280]" as const;
export const siteMobileNavOverlayZ = "z-[260]" as const;
export const siteMobileNavDrawerZ = "z-[270]" as const;
