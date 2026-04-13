/**
 * Global pause for arena worker ticks (between seasons, maintenance).
 * Set ARENA_PAUSED=1 or true on the API host / worker process.
 */
export function isArenaPaused() {
  const v = process.env.ARENA_PAUSED;
  return v === "1" || v === "true";
}
