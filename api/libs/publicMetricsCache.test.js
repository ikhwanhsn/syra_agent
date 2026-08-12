/**
 * In-process cache + soft-timeout helpers for public /api/metrics.
 * Run: node --test api/libs/publicMetricsCache.test.js
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";

/**
 * @template T
 * @param {Promise<T>} promise
 * @param {number} ms
 * @param {T} fallback
 * @returns {Promise<T>}
 */
function withBudget(promise, ms, fallback) {
  let timer;
  return Promise.race([
    Promise.resolve(promise).catch(() => fallback),
    new Promise((resolve) => {
      timer = setTimeout(() => resolve(fallback), ms);
      timer.unref?.();
    }),
  ]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

describe("public metrics soft budget", () => {
  it("returns fallback when the promise exceeds the budget", async () => {
    const slow = new Promise((resolve) => {
      setTimeout(() => resolve("late"), 200);
    });
    const result = await withBudget(slow, 30, "fallback");
    assert.equal(result, "fallback");
  });

  it("returns the value when it settles inside the budget", async () => {
    const fast = Promise.resolve("ok");
    const result = await withBudget(fast, 100, "fallback");
    assert.equal(result, "ok");
  });

  it("returns fallback on rejection", async () => {
    const bad = Promise.reject(new Error("boom"));
    const result = await withBudget(bad, 100, null);
    assert.equal(result, null);
  });
});

describe("public metrics SWR cache shape", () => {
  it("coalesces concurrent cold misses onto one rebuild", async () => {
    let builds = 0;
    /** @type {{ data: object; freshUntil: number; staleUntil: number } | null} */
    let cache = null;
    /** @type {Promise<object> | null} */
    let inflight = null;
    const freshTtl = 60_000;
    const staleTtl = 600_000;

    async function rebuild() {
      builds += 1;
      await new Promise((r) => setTimeout(r, 20));
      const data = { n: builds };
      const now = Date.now();
      cache = {
        data,
        freshUntil: now + freshTtl,
        staleUntil: now + staleTtl,
      };
      return data;
    }

    async function get() {
      const now = Date.now();
      if (cache && now < cache.freshUntil) return cache.data;
      if (cache && now < cache.staleUntil) {
        if (!inflight) {
          inflight = rebuild().finally(() => {
            inflight = null;
          });
        }
        return cache.data;
      }
      if (inflight) return inflight;
      inflight = rebuild().finally(() => {
        inflight = null;
      });
      return inflight;
    }

    const [a, b] = await Promise.all([get(), get()]);
    assert.equal(a.n, 1);
    assert.equal(b.n, 1);
    assert.equal(builds, 1);

    const c = await get();
    assert.equal(c.n, 1);
    assert.equal(builds, 1);
  });
});
