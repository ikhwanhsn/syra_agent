import { DEFAULT_SYSTEM_PROMPT } from "@/lib/systemPrompt";

export const LS_AGENT_DISPLAY_NAME = "syra.agent.displayName";
export const LS_AGENT_SYSTEM_PROMPT = "syra.agent.customSystemPrompt";
export const LS_PREF_PRODUCT_UPDATES = "syra.settings.pref.productUpdates";
export const LS_PREF_USAGE_INSIGHTS = "syra.settings.pref.usageInsights";
export const LS_PREF_COMPACT = "syra.settings.pref.compactDensity";

export function readAgentSetupString(key: string, fallback = ""): string {
  try {
    const v = localStorage.getItem(key);
    if (v != null) return v;
    if (key === LS_AGENT_DISPLAY_NAME) {
      return localStorage.getItem("syra.settings.displayName") ?? fallback;
    }
    return fallback;
  } catch {
    return fallback;
  }
}

export function writeAgentSetupString(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* quota / private mode */
  }
}

export function readAgentSetupBool(key: string, fallback: boolean): boolean {
  try {
    const v = localStorage.getItem(key);
    if (v === null) return fallback;
    return v === "1" || v === "true";
  } catch {
    return fallback;
  }
}

export function writeAgentSetupBool(key: string, value: boolean): void {
  try {
    localStorage.setItem(key, value ? "1" : "0");
  } catch {
    /* quota / private mode */
  }
}

/** Custom agent instructions for chat, or Syra default when empty. */
export function getAgentSystemPrompt(): string {
  const custom = readAgentSetupString(LS_AGENT_SYSTEM_PROMPT, "").trim();
  return custom.length > 0 ? custom : DEFAULT_SYSTEM_PROMPT;
}
