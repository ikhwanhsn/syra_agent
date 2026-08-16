import { afterEach, describe, expect, it, vi } from "vitest";
import {
  canAttemptStaleChunkReload,
  clearStaleChunkReloadFlag,
  isStaleChunkError,
  reloadOnceForStaleChunk,
} from "./staleChunk";

function memorySessionStorage() {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => store.clear(),
  };
}

describe("isStaleChunkError", () => {
  it("detects Vite dynamic import fetch failures", () => {
    expect(
      isStaleChunkError(
        new Error(
          "Failed to fetch dynamically imported module: https://www.syraa.fun/assets/PostVideoPage-DMM4E9yO.js",
        ),
      ),
    ).toBe(true);
  });

  it("detects webpack ChunkLoadError", () => {
    const error = new Error("Loading chunk 12 failed");
    error.name = "ChunkLoadError";
    expect(isStaleChunkError(error)).toBe(true);
  });

  it("ignores ordinary render errors", () => {
    expect(isStaleChunkError(new Error("Cannot read properties of null"))).toBe(false);
    expect(isStaleChunkError(null)).toBe(false);
  });
});

describe("reloadOnceForStaleChunk", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  function stubBrowser() {
    const reload = vi.fn();
    const storage = memorySessionStorage();
    vi.stubGlobal("sessionStorage", storage);
    vi.stubGlobal("window", { location: { reload } });
    return { reload, storage };
  }

  it("reloads once, then refuses a second attempt in the same session", () => {
    const { reload } = stubBrowser();

    expect(reloadOnceForStaleChunk()).toBe(true);
    expect(reload).toHaveBeenCalledTimes(1);
    expect(canAttemptStaleChunkReload()).toBe(false);

    expect(reloadOnceForStaleChunk()).toBe(false);
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("allows another reload after the flag is cleared", () => {
    const { reload } = stubBrowser();

    expect(reloadOnceForStaleChunk()).toBe(true);
    clearStaleChunkReloadFlag();
    expect(reloadOnceForStaleChunk()).toBe(true);
    expect(reload).toHaveBeenCalledTimes(2);
  });
});
