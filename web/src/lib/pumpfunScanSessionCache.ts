import type { MemecoinAnalysisQueryData } from "@/hooks/useMemecoinAnalysis";

const STORAGE_PREFIX = "syra_pumpfun_scan_v1:";
/** Keep analyzed tokens in session for the browser tab lifetime (30 min freshness). */
const SESSION_TTL_MS = 30 * 60_000;

type StoredScanEntry = {
  savedAt: number;
  payload: MemecoinAnalysisQueryData;
};

function storageKey(mint: string): string {
  return `${STORAGE_PREFIX}${mint.trim()}`;
}

export function readPumpfunScanSessionCache(mint: string): MemecoinAnalysisQueryData | null {
  const entry = readPumpfunScanSessionEntry(mint);
  return entry?.payload ?? null;
}

export function readPumpfunScanSessionEntry(mint: string): StoredScanEntry | null {
  if (typeof sessionStorage === "undefined") return null;
  const trimmed = mint.trim();
  if (!trimmed) return null;
  try {
    const raw = sessionStorage.getItem(storageKey(trimmed));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredScanEntry;
    if (!parsed?.payload?.data?.mint) return null;
    if (Date.now() - parsed.savedAt > SESSION_TTL_MS) {
      sessionStorage.removeItem(storageKey(trimmed));
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function writePumpfunScanSessionCache(
  mint: string,
  payload: MemecoinAnalysisQueryData,
): void {
  if (typeof sessionStorage === "undefined") return;
  const trimmed = mint.trim();
  if (!trimmed) return;
  try {
    const entry: StoredScanEntry = { savedAt: Date.now(), payload };
    sessionStorage.setItem(storageKey(trimmed), JSON.stringify(entry));
  } catch {
    /* quota / private mode */
  }
}

export function removePumpfunScanSessionCache(mint: string): void {
  if (typeof sessionStorage === "undefined") return;
  const trimmed = mint.trim();
  if (!trimmed) return;
  try {
    sessionStorage.removeItem(storageKey(trimmed));
  } catch {
    /* ignore */
  }
}

export function clearAllPumpfunScanSessionCaches(): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    const keys: string[] = [];
    for (let i = 0; i < sessionStorage.length; i += 1) {
      const key = sessionStorage.key(i);
      if (key?.startsWith(STORAGE_PREFIX)) keys.push(key);
    }
    for (const key of keys) sessionStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}
