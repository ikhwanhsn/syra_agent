import type { PostStudioState } from "@/lib/postStudioApi";

export const POST_STUDIO_CHANGE_EVENT = "s3-post-studio-change";

const STORAGE_KEY = "s3-post-studio-state";

const EMPTY_STATE: PostStudioState = { postedOnX: {}, deleted: [] };

let cachedState: PostStudioState = { ...EMPTY_STATE, postedOnX: {} };
let loaded = false;

function readFromStorage(): PostStudioState {
  if (typeof window === "undefined") return { postedOnX: {}, deleted: [] };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { postedOnX: {}, deleted: [] };
    const parsed = JSON.parse(raw) as PostStudioState;
    return {
      postedOnX: parsed.postedOnX ?? {},
      deleted: Array.isArray(parsed.deleted) ? parsed.deleted : [],
      updatedAt: parsed.updatedAt ?? null,
    };
  } catch {
    return { postedOnX: {}, deleted: [] };
  }
}

function writeToStorage(state: PostStudioState): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function isPostStudioLoaded(): boolean {
  return loaded;
}

export function getPostStudioState(): PostStudioState {
  return cachedState;
}

export function applyPostStudioState(next: PostStudioState): void {
  cachedState = {
    postedOnX: { ...next.postedOnX },
    deleted: [...next.deleted],
    updatedAt: next.updatedAt ?? new Date().toISOString(),
  };
  loaded = true;
  writeToStorage(cachedState);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(POST_STUDIO_CHANGE_EVENT));
  }
}

export function getPostXStatus(updateNumber: number, defaultPosted = false): boolean {
  const key = String(updateNumber);
  return key in cachedState.postedOnX ? cachedState.postedOnX[key]! : defaultPosted;
}

export function isPostDeleted(updateNumber: number): boolean {
  return cachedState.deleted.includes(updateNumber);
}

export function getDeletedPostNumbers(): number[] {
  return [...cachedState.deleted].sort((a, b) => a - b);
}

export function readLegacyLocalStorageState(): {
  postedOnX: Record<string, boolean>;
  deleted: number[];
} {
  return readFromStorage();
}

export function clearLegacyLocalStorageState(): void {
  /* single-key storage — no legacy keys */
}

export function resetPostStudioCacheForTests(): void {
  cachedState = { postedOnX: {}, deleted: [] };
  loaded = false;
}
