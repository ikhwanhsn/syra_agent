export type InternalTab = "metrics" | "agents" | "tools";

export const INTERNAL_TAB_ORDER: InternalTab[] = ["metrics", "agents", "tools"];

export function parseInternalTab(param: string | null): InternalTab {
  if (param === "agents") return "agents";
  if (param === "tools") return "tools";
  return "metrics";
}

export function internalTabToParam(tab: InternalTab): string | null {
  if (tab === "metrics") return null;
  return tab;
}
