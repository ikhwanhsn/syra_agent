/** Shared resizable panel sizes for AI agent chat and marketplace (sidebar + main). */
export const SIDEBAR_PANEL = {
  defaultSize: 18,
  minSize: 12,
  maxSize: 45,
} as const;

export const MAIN_PANEL = {
  defaultSize: 82,
  minSize: 50,
} as const;

/** Single storage key so sidebar width is consistent when switching between chat and marketplace. */
export const SIDEBAR_AUTO_SAVE_ID = "syra-sidebar";
