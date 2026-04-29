import { useCallback, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "uof-rise-watchlist-v1";

function parseStored(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
  } catch {
    return [];
  }
}

export function useWatchlist() {
  const [items, setItems] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    return parseStored(window.localStorage.getItem(STORAGE_KEY));
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) return;
      setItems(parseStored(event.newValue));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const has = useCallback((mint: string) => items.includes(mint), [items]);
  const add = useCallback((mint: string) => {
    setItems((prev) => (prev.includes(mint) ? prev : [...prev, mint]));
  }, []);
  const remove = useCallback((mint: string) => {
    setItems((prev) => prev.filter((item) => item !== mint));
  }, []);
  const toggle = useCallback(
    (mint: string) => {
      setItems((prev) => (prev.includes(mint) ? prev.filter((item) => item !== mint) : [...prev, mint]));
    },
    [],
  );
  const clear = useCallback(() => setItems([]), []);

  return useMemo(
    () => ({ items, has, add, remove, toggle, clear }),
    [items, has, add, remove, toggle, clear],
  );
}
