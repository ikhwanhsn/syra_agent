export type InternalTab = "agents" | "tools";

export const INTERNAL_TAB_ORDER: InternalTab[] = ["agents", "tools"];

export function parseInternalTab(param: string | null): InternalTab {
  if (param === "tools") return "tools";
  return "agents";
}

export function internalTabToParam(tab: InternalTab): string | null {
  if (tab === "agents") return null;
  return tab;
}
