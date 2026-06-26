import { useCallback, useEffect, useState } from "react";

export type DiscoverySaveFlag = "saved" | "hidden";

export interface DiscoverySaveState {
  saved: boolean;
  hidden: boolean;
}

const EMPTY_STATE: DiscoverySaveState = {
  saved: false,
  hidden: false,
};

function readSaves(storageKey: string): Record<string, DiscoverySaveState> {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, Partial<DiscoverySaveState>>;
    if (!parsed || typeof parsed !== "object") return {};

    const out: Record<string, DiscoverySaveState> = {};
    for (const [key, value] of Object.entries(parsed)) {
      out[key] = {
        saved: Boolean(value?.saved),
        hidden: Boolean(value?.hidden),
      };
    }
    return out;
  } catch {
    return {};
  }
}

function writeSaves(storageKey: string, saves: Record<string, DiscoverySaveState>): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(storageKey, JSON.stringify(saves));
}

export function useDiscoverySaves(storageKey: string) {
  const [saves, setSaves] = useState<Record<string, DiscoverySaveState>>(() =>
    readSaves(storageKey),
  );

  useEffect(() => {
    writeSaves(storageKey, saves);
  }, [storageKey, saves]);

  const toggleFlag = useCallback((itemId: string, flag: DiscoverySaveFlag) => {
    setSaves((prev) => {
      const current = prev[itemId] ?? { ...EMPTY_STATE };
      const nextEntry: DiscoverySaveState = { ...current, [flag]: !current[flag] };

      const hasAny = nextEntry.saved || nextEntry.hidden;
      if (!hasAny) {
        const { [itemId]: _, ...rest } = prev;
        return rest;
      }

      return { ...prev, [itemId]: nextEntry };
    });
  }, []);

  const getFlags = useCallback(
    (itemId: string): DiscoverySaveState => saves[itemId] ?? EMPTY_STATE,
    [saves],
  );

  const isSaved = useCallback(
    (itemId: string): boolean => Boolean(saves[itemId]?.saved),
    [saves],
  );

  return { saves, toggleFlag, getFlags, isSaved };
}

export const EVENT_SAVES_STORAGE_KEY = "s3labs:event-saves";
export const HACKATHON_SAVES_STORAGE_KEY = "s3labs:hackathon-saves";

export function useEventSaves() {
  return useDiscoverySaves(EVENT_SAVES_STORAGE_KEY);
}

export function useHackathonSaves() {
  return useDiscoverySaves(HACKATHON_SAVES_STORAGE_KEY);
}
