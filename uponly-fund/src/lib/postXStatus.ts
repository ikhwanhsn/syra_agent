import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "uof-post-x-status";

type PostXStatusMap = Record<string, boolean>;

function readStatusMap(): PostXStatusMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null ? (parsed as PostXStatusMap) : {};
  } catch {
    return {};
  }
}

function writeStatusMap(map: PostXStatusMap): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

export function getPostXStatus(updateNumber: number, defaultPosted = false): boolean {
  const map = readStatusMap();
  const key = String(updateNumber);
  return key in map ? map[key]! : defaultPosted;
}

export function setPostXStatus(updateNumber: number, posted: boolean): void {
  const map = readStatusMap();
  map[String(updateNumber)] = posted;
  writeStatusMap(map);
  window.dispatchEvent(new CustomEvent("uof-post-x-status-change"));
}

export function usePostXStatus(updateNumber: number, defaultPosted = false) {
  const [posted, setPosted] = useState(() => getPostXStatus(updateNumber, defaultPosted));

  const refresh = useCallback(() => {
    setPosted(getPostXStatus(updateNumber, defaultPosted));
  }, [updateNumber, defaultPosted]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) refresh();
    };
    const onCustom = () => refresh();
    window.addEventListener("storage", onStorage);
    window.addEventListener("uof-post-x-status-change", onCustom);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("uof-post-x-status-change", onCustom);
    };
  }, [refresh]);

  const toggle = useCallback(() => {
    const next = !getPostXStatus(updateNumber, defaultPosted);
    setPostXStatus(updateNumber, next);
    setPosted(next);
  }, [updateNumber, defaultPosted]);

  const setStatus = useCallback(
    (value: boolean) => {
      setPostXStatus(updateNumber, value);
      setPosted(value);
    },
    [updateNumber],
  );

  return { posted, toggle, setPosted: setStatus };
}
