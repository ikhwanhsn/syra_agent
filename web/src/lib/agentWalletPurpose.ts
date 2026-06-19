import type { AgentWalletPurpose } from "@/lib/agentWalletCatalog";
import { PILLAR_WALLET_PURPOSES } from "@/lib/agentWalletCatalog";

const SIBLING_SUFFIXES = [...PILLAR_WALLET_PURPOSES.filter((p) => p !== "spend"), "lp", "chat"] as const;

export function baseAnonymousIdFrom(id: string): string {
  let base = id.trim();
  let changed = true;
  while (changed) {
    changed = false;
    for (const suffix of SIBLING_SUFFIXES) {
      const token = `:${suffix}`;
      if (base.endsWith(token)) {
        base = base.slice(0, -token.length);
        changed = true;
        break;
      }
    }
  }
  return base;
}

export function siblingAnonymousId(baseAnonymousId: string, purpose: AgentWalletPurpose): string {
  const base = baseAnonymousIdFrom(baseAnonymousId);
  if (purpose === "spend" || purpose === "chat") return base;
  return `${base}:${purpose}`;
}

export function lpAnonymousIdFromChat(chatAnonymousId: string): string {
  return siblingAnonymousId(chatAnonymousId, "lp");
}

export function isLpAnonymousId(id: string): boolean {
  return id.endsWith(":lp");
}
