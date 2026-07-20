export type PlaygroundTab = "syra" | "build" | "custom";

/** Integrate first — Catalog (`syra`) and Custom are secondary. */
export const PLAYGROUND_TAB_ORDER: PlaygroundTab[] = ["build", "syra", "custom"];

export function parsePlaygroundTab(param: string | null): PlaygroundTab {
  if (param === "custom") return "custom";
  if (param === "syra") return "syra";
  // bare `/marketplace`, `?tab=build`, or unknown → Integrate
  return "build";
}

export function playgroundTabToParam(tab: PlaygroundTab): string | null {
  if (tab === "build") return null;
  return tab;
}
