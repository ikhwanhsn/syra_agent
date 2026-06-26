import { useCallback, useEffect, useState } from "react";

export type JobFlag = "interesting" | "applied" | "hidden";

export interface JobFlagState {
  interesting: boolean;
  applied: boolean;
  hidden: boolean;
}

const STORAGE_KEY = "s3labs:job-flags";

const EMPTY_FLAGS: JobFlagState = {
  interesting: false,
  applied: false,
  hidden: false,
};

function readFlags(): Record<string, JobFlagState> {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, Partial<JobFlagState>>;
    if (!parsed || typeof parsed !== "object") return {};

    const out: Record<string, JobFlagState> = {};
    for (const [key, value] of Object.entries(parsed)) {
      out[key] = {
        interesting: Boolean(value?.interesting),
        applied: Boolean(value?.applied),
        hidden: Boolean(value?.hidden),
      };
    }
    return out;
  } catch {
    return {};
  }
}

function writeFlags(flags: Record<string, JobFlagState>): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(flags));
}

export function useJobFlags() {
  const [flags, setFlags] = useState<Record<string, JobFlagState>>(() => readFlags());

  useEffect(() => {
    writeFlags(flags);
  }, [flags]);

  const toggleFlag = useCallback((jobIdentityKey: string, flag: JobFlag) => {
    setFlags((prev) => {
      const current = prev[jobIdentityKey] ?? { ...EMPTY_FLAGS };
      const nextValue = !current[flag];
      const nextEntry: JobFlagState = { ...current, [flag]: nextValue };

      const hasAny = nextEntry.interesting || nextEntry.applied || nextEntry.hidden;
      if (!hasAny) {
        const { [jobIdentityKey]: _, ...rest } = prev;
        return rest;
      }

      return { ...prev, [jobIdentityKey]: nextEntry };
    });
  }, []);

  const getFlags = useCallback(
    (jobIdentityKey: string): JobFlagState => flags[jobIdentityKey] ?? EMPTY_FLAGS,
    [flags],
  );

  const hasFlag = useCallback(
    (jobIdentityKey: string, flag: JobFlag): boolean => Boolean(flags[jobIdentityKey]?.[flag]),
    [flags],
  );

  return { flags, toggleFlag, getFlags, hasFlag };
}
