/**
 * Wrap an async cron handler so overlapping interval ticks are skipped.
 * @param {(...args: unknown[]) => Promise<unknown> | unknown} fn
 * @returns {(...args: unknown[]) => Promise<unknown> | undefined}
 */
export function withSingleFlight(fn) {
  let inFlight = false;
  return (...args) => {
    if (inFlight) return undefined;
    inFlight = true;
    return Promise.resolve(fn(...args)).finally(() => {
      inFlight = false;
    });
  };
}
