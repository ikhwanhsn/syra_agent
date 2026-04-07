/**
 * @param {() => Promise<T>} fn
 * @param {{ tries?: number; baseDelayMs?: number; retriable?: (e: unknown) => boolean }} [opts]
 * @returns {Promise<T>}
 * @template T
 */
export async function retryAsync(fn, opts = {}) {
  const tries = Math.max(1, opts.tries ?? 3);
  const baseDelayMs = opts.baseDelayMs ?? 450;
  const retriable = opts.retriable ?? defaultRetriable;
  let last = /** @type {unknown} */ (undefined);
  for (let i = 0; i < tries; i++) {
    try {
      return await fn();
    } catch (e) {
      last = e;
      if (i === tries - 1 || !retriable(e)) throw e;
      const delay = baseDelayMs * (i + 1) + Math.floor(Math.random() * 200);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw last;
}

/** @param {unknown} e */
function defaultRetriable(e) {
  const m = e instanceof Error ? e.message : String(e);
  return (
    /: (408|429|502|503|504)\b/.test(m) ||
    /ECONNRESET|ETIMEDOUT|EAI_AGAIN|fetch failed|network/i.test(m)
  );
}
