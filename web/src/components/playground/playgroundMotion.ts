import type { CSSProperties } from "react";

/** Stagger delay for card grid entrance (capped so large grids stay snappy). */
export function playgroundStaggerStyle(index: number, stepMs = 28, cap = 14): CSSProperties {
  return { animationDelay: `${Math.min(index, cap) * stepMs}ms` };
}

export const playgroundSectionEnter =
  "playground-section-enter animate-in fade-in slide-in-from-bottom-1 fill-mode-both duration-500 ease-out";

export const playgroundTabPanelEnter =
  "playground-tab-panel animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-300 ease-out";

export const playgroundResponseEnter =
  "animate-slide-up fill-mode-both";
