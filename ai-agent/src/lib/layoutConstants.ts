/** Shared resizable panel sizes for AI agent chat, marketplace, and dashboard (sidebar + main). */
export const SIDEBAR_PANEL = {
  defaultSize: 18,
  minSize: 12,
  maxSize: 45,
} as const;

export const MAIN_PANEL = {
  defaultSize: 82,
  minSize: 50,
} as const;

/** Single storage key so sidebar width is consistent across chat, marketplace, and dashboard. */
export const SIDEBAR_AUTO_SAVE_ID = "syra-sidebar";

/**
 * Max width for dashboard main column (leaderboard, trading lab, arbitrage, marketplace routes).
 * Keeps wide tables and the arbitrage grid aligned on the same measure.
 */
export const DASHBOARD_CONTENT_MAX_WIDTH = "max-w-[1600px]";

/** `w-full` + max width + horizontal padding — use as the inner shell for dashboard page bodies. */
export const DASHBOARD_CONTENT_SHELL =
  "w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8";
