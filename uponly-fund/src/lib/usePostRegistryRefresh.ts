import { useEffect, useState } from "react";
import { POST_STUDIO_CHANGE_EVENT } from "@/lib/postStudioState";

/** Re-render when fund brief posted status or deletions change. */
export function usePostRegistryRefresh(): number {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const refresh = () => setTick((value) => value + 1);
    window.addEventListener(POST_STUDIO_CHANGE_EVENT, refresh);
    return () => {
      window.removeEventListener(POST_STUDIO_CHANGE_EVENT, refresh);
    };
  }, []);

  return tick;
}
