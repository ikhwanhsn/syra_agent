import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  applyPostStudioState,
  getPostXStatus,
  isPostDeleted,
  readLegacyLocalStorageState,
  resetPostStudioCacheForTests,
  writeLegacyLocalStorageState,
} from "@/lib/postStudioState";

describe("postStudioState", () => {
  beforeEach(() => {
    resetPostStudioCacheForTests();
  });

  it("tracks posted and deleted state in memory cache", () => {
    applyPostStudioState({
      postedOnX: { "1": true, "2": false },
      deleted: [3],
    });

    expect(getPostXStatus(1, false)).toBe(true);
    expect(getPostXStatus(2, true)).toBe(false);
    expect(getPostXStatus(4, true)).toBe(true);
    expect(isPostDeleted(3)).toBe(true);
    expect(isPostDeleted(1)).toBe(false);
  });

  it("persists deleted updates to legacy localStorage keys", () => {
    const store = new Map<string, string>();
    vi.stubGlobal("window", {
      localStorage: {
        setItem: (key: string, value: string) => {
          store.set(key, value);
        },
        getItem: (key: string) => store.get(key) ?? null,
        removeItem: (key: string) => {
          store.delete(key);
        },
      },
    });

    writeLegacyLocalStorageState({
      postedOnX: { "2": true },
      deleted: [4, 7],
    });

    expect(readLegacyLocalStorageState()).toEqual({
      postedOnX: { "2": true },
      deleted: [4, 7],
    });
  });
});
