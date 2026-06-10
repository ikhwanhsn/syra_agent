export type PlaygroundTab = "syra" | "build" | "custom";

export const PLAYGROUND_TAB_ORDER: PlaygroundTab[] = ["syra", "build", "custom"];

export function parsePlaygroundTab(param: string | null): PlaygroundTab {
  if (param === "custom") return "custom";
  if (param === "build") return "build";
  return "syra";
}

export function playgroundTabToParam(tab: PlaygroundTab): string | null {
  if (tab === "syra") return null;
  return tab;
}
