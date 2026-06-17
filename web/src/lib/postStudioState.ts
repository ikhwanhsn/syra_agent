import type { PostStudioState } from "@/lib/postStudioApi";

export const POST_STUDIO_CHANGE_EVENT = "syra-post-studio-change";

const EMPTY_STATE: PostStudioState = { postedOnX: {}, deleted: [] };

let cachedState: PostStudioState = { ...EMPTY_STATE, postedOnX: {} };
let loaded = false;

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
    updatedAt: next.updatedAt ?? null,
  };
  loaded = true;
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

const LEGACY_POSTED_KEY = "syra-post-x-status";
const LEGACY_DELETED_KEY = "syra-post-deleted";

export function readLegacyLocalStorageState(): {
  postedOnX: Record<string, boolean>;
  deleted: number[];
} {
  if (typeof window === "undefined") {
    return { postedOnX: {}, deleted: [] };
  }

  let postedOnX: Record<string, boolean> = {};
  let deleted: number[] = [];

  try {
    const rawPosted = window.localStorage.getItem(LEGACY_POSTED_KEY);
    if (rawPosted) {
      const parsed: unknown = JSON.parse(rawPosted);
      if (parsed && typeof parsed === "object") {
        postedOnX = parsed as Record<string, boolean>;
      }
    }
  } catch {
    postedOnX = {};
  }

  try {
    const rawDeleted = window.localStorage.getItem(LEGACY_DELETED_KEY);
    if (rawDeleted) {
      const parsed: unknown = JSON.parse(rawDeleted);
      if (Array.isArray(parsed)) {
        deleted = parsed.filter((n): n is number => typeof n === "number" && Number.isFinite(n) && n > 0);
      }
    }
  } catch {
    deleted = [];
  }

  return { postedOnX, deleted };
}

export function writeLegacyLocalStorageState(state: {
  postedOnX: Record<string, boolean>;
  deleted: number[];
}): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LEGACY_POSTED_KEY, JSON.stringify(state.postedOnX));
  window.localStorage.setItem(LEGACY_DELETED_KEY, JSON.stringify(state.deleted));
}

export function clearLegacyLocalStorageState(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(LEGACY_POSTED_KEY);
  window.localStorage.removeItem(LEGACY_DELETED_KEY);
}

export function resetPostStudioCacheForTests(): void {
  cachedState = { postedOnX: {}, deleted: [] };
  loaded = false;
}
