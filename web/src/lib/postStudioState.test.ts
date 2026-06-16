import { beforeEach, describe, expect, it } from "vitest";
import {
  applyPostStudioState,
  getPostXStatus,
  isPostDeleted,
  resetPostStudioCacheForTests,
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
});
