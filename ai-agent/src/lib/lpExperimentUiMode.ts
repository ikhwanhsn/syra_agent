export const LS_PREF_LP_UI_MODE = "syra.settings.pref.lpExperimentUiMode";

export type LpExperimentUiMode = "simple" | "pro";

export const LP_UI_MODE_CHANGED_EVENT = "syra:lp-ui-mode-changed";

export function readLpExperimentUiMode(): LpExperimentUiMode {
  try {
    const v = localStorage.getItem(LS_PREF_LP_UI_MODE);
    if (v === "pro" || v === "simple") return v;
  } catch {
    /* private mode */
  }
  return "simple";
}

export function writeLpExperimentUiMode(mode: LpExperimentUiMode): void {
  try {
    localStorage.setItem(LS_PREF_LP_UI_MODE, mode);
    window.dispatchEvent(new CustomEvent(LP_UI_MODE_CHANGED_EVENT, { detail: mode }));
  } catch {
    /* quota / private mode */
  }
}
