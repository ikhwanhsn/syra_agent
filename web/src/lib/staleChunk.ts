const STORAGE_KEY = "syra:stale-chunk-reload";

/** Vite/webpack errors after a deploy replaces hashed lazy chunks. */
export function isStaleChunkError(error: unknown): boolean {
  if (error == null) return false;
  const name =
    typeof error === "object" && error !== null && "name" in error
      ? String((error as { name?: unknown }).name ?? "")
      : "";
  const message = error instanceof Error ? error.message : String(error);
  if (name === "ChunkLoadError") return true;
  return (
    /Failed to fetch dynamically imported module/i.test(message) ||
    /error loading dynamically imported module/i.test(message) ||
    /Importing a module script failed/i.test(message) ||
    /Unable to preload CSS/i.test(message) ||
    /Loading chunk [\w.-]+ failed/i.test(message)
  );
}

export function clearStaleChunkReloadFlag(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // private mode / blocked storage
  }
}

export function canAttemptStaleChunkReload(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(STORAGE_KEY) !== "1";
  } catch {
    return false;
  }
}

/**
 * Hard-reload once per tab session so a stale SPA picks up the new index.html.
 * Returns true if a reload was triggered.
 */
export function reloadOnceForStaleChunk(): boolean {
  if (!canAttemptStaleChunkReload()) return false;
  try {
    sessionStorage.setItem(STORAGE_KEY, "1");
  } catch {
    return false;
  }
  window.location.reload();
  return true;
}
