/** Shared resizable panel sizes for AI agent chat, marketplace, and dashboard (sidebar + main). */
export const SIDEBAR_PANEL = {
  defaultSize: 18,
  minSize: 12,
  maxSize: 45,
  /** Percent width when collapsed — icon rail (logo + nav icons). */
  collapsedSize: 4,
} as const;

export const MAIN_PANEL = {
  defaultSize: 82,
  minSize: 50,
} as const;

/** Sidebar width persistence for dashboard / marketplace layouts. */
export const SIDEBAR_AUTO_SAVE_ID = "syra-sidebar";

/** Chat agent page only — defaults to collapsed; separate from dashboard sidebar state. */
export const CHAT_SIDEBAR_AUTO_SAVE_ID = "syra-sidebar-chat";

/** Shared easing for chat sidebar open/close (desktop width + mobile slide). */
export const CHAT_SIDEBAR_TRANSITION =
  "duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none";

/** Desktop chat sidebar width when expanded. */
export const CHAT_SIDEBAR_WIDTH = "min(300px,22vw)";

/**
 * Max width for dashboard main column (leaderboard, trading lab, arbitrage, marketplace routes).
 * Keeps wide tables and the arbitrage grid aligned on the same measure.
 */
export const DASHBOARD_CONTENT_MAX_WIDTH = "max-w-[1600px]";

/** `w-full` + max width + horizontal padding — use as the inner shell for dashboard page bodies. */
export const DASHBOARD_CONTENT_SHELL =
  "w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8";

/**
 * Bottom padding for scrollable page bodies so content clears taskbars and the iOS home indicator.
 * Pair with an explicit `pt-*` (not `py-*`) so the bottom is never undersized vs the top.
 */
export const PAGE_SAFE_AREA_BOTTOM =
  "pb-[max(3.5rem,calc(env(safe-area-inset-bottom,0px)+3rem))] sm:pb-[max(4.5rem,calc(env(safe-area-inset-bottom,0px)+3.5rem))] lg:pb-[max(5.5rem,calc(env(safe-area-inset-bottom,0px)+4rem))]";

/**
 * Tighter bottom padding for dense experiment UIs (e.g. arbitrage) — still clears home indicator / taskbar.
 */
export const PAGE_SAFE_AREA_BOTTOM_COMPACT =
  "pb-[max(1.25rem,calc(env(safe-area-inset-bottom,0px)+0.75rem))] sm:pb-[max(1.75rem,calc(env(safe-area-inset-bottom,0px)+1rem))] lg:pb-[max(2rem,calc(env(safe-area-inset-bottom,0px)+1.125rem))]";

/** Default top rhythm for dashboard experiment / leaderboard / marketplace list pages. */
export const PAGE_PADDING_TOP_STANDARD = "pt-4 sm:pt-5 lg:pt-6";

/** Roomier top for overview-style pages. */
export const PAGE_PADDING_TOP_MEDIUM = "pt-6 sm:pt-8 lg:pt-8";
