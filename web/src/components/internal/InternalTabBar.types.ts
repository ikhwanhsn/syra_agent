export type InternalTab = "metrics" | "x402" | "agents" | "tools";

export const INTERNAL_TAB_ORDER: InternalTab[] = ["metrics", "x402", "agents", "tools"];

export function parseInternalTab(param: string | null): InternalTab {
  if (param === "x402") return "x402";
  if (param === "agents") return "agents";
  if (param === "tools") return "tools";
  return "metrics";
}

export function internalTabToParam(tab: InternalTab): string | null {
  if (tab === "metrics") return null;
  return tab;
}
