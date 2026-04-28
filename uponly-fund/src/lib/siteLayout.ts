/**
 * Single source of truth for main column width + horizontal padding
 * (navbar, page shells, footer) so edges align on every route.
 */
export const SITE_MAX_WIDTH = "max-w-6xl" as const;
export const SITE_H_PADDING = "px-3.5 min-[400px]:px-4 sm:px-6 lg:px-10" as const;
export const SITE_GUTTER = "mx-auto w-full min-w-0" as const;

export const siteShell = `${SITE_GUTTER} ${SITE_MAX_WIDTH} ${SITE_H_PADDING}` as const;
