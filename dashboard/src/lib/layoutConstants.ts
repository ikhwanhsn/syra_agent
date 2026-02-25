/** Resizable panel sizes for dashboard (sidebar + main). */
export const SIDEBAR_PANEL = {
  defaultSize: 18,
  minSize: 12,
  maxSize: 45,
} as const;

export const MAIN_PANEL = {
  defaultSize: 82,
  minSize: 50,
} as const;

/** Storage key so sidebar width is persisted across reloads. */
export const SIDEBAR_AUTO_SAVE_ID = "syra-dashboard-sidebar";
