/**
 * Single source of truth for main column width + horizontal padding
 * (navbar, page shells, footer) so edges align on every route.
 * max-w-[88rem] — institutional allocator width (Sequoia / a16z-style breathing room).
 */
export const SITE_MAX_WIDTH = "max-w-[88rem]" as const;
export const SITE_H_PADDING =
  "px-[max(1rem,env(safe-area-inset-left,0px))] min-[400px]:px-5 sm:px-8 lg:px-12 xl:px-14 pr-[max(1rem,env(safe-area-inset-right,0px))]" as const;
export const SITE_GUTTER = "mx-auto w-full min-w-0" as const;

export const siteShell = `${SITE_GUTTER} ${SITE_MAX_WIDTH} ${SITE_H_PADDING}` as const;
