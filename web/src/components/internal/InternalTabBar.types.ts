export type InternalTab = "metrics" | "agents";

export const INTERNAL_TAB_ORDER: InternalTab[] = ["metrics", "agents"];

export function parseInternalTab(param: string | null): InternalTab {
  if (param === "agents") return "agents";
  return "metrics";
}

export function internalTabToParam(tab: InternalTab): string | null {
  if (tab === "metrics") return null;
  return tab;
}
