/**
 * Single source of truth for main column width + horizontal padding
 * (navbar, page shells, footer) so edges align on every route.
 * max-w-7xl matches institutional marketing sites (allocator / venture landing).
 */
export const SITE_MAX_WIDTH = "max-w-7xl" as const;
export const SITE_H_PADDING =
  "px-4 min-[400px]:px-5 sm:px-8 lg:px-12 xl:px-14" as const;
export const SITE_GUTTER = "mx-auto w-full min-w-0" as const;

export const siteShell = `${SITE_GUTTER} ${SITE_MAX_WIDTH} ${SITE_H_PADDING}` as const;
