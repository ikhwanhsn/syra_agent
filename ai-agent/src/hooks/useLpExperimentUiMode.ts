import { useCallback, useEffect, useState } from "react";
import {
  LP_UI_MODE_CHANGED_EVENT,
  readLpExperimentUiMode,
  writeLpExperimentUiMode,
  type LpExperimentUiMode,
} from "@/lib/lpExperimentUiMode";

export function useLpExperimentUiMode() {
  const [mode, setModeState] = useState<LpExperimentUiMode>(() => readLpExperimentUiMode());

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key == null || e.newValue === "simple" || e.newValue === "pro") {
        setModeState(readLpExperimentUiMode());
      }
    };
    const onCustom = () => setModeState(readLpExperimentUiMode());
    window.addEventListener("storage", onStorage);
    window.addEventListener(LP_UI_MODE_CHANGED_EVENT, onCustom);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(LP_UI_MODE_CHANGED_EVENT, onCustom);
    };
  }, []);

  const setMode = useCallback((next: LpExperimentUiMode) => {
    writeLpExperimentUiMode(next);
    setModeState(next);
  }, []);

  return { mode, setMode, isSimple: mode === "simple", isPro: mode === "pro" };
}
