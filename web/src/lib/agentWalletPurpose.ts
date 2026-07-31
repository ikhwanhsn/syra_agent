import type { AgentWalletPurpose } from "@/lib/agentWalletCatalog";
import { PILLAR_WALLET_PURPOSES } from "@/lib/agentWalletCatalog";

/** Suffixes stripped when resolving base anonymousId (includes retired :lp). */
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
  if (purpose === "spend") return base;
  return `${base}:${purpose}`;
}

/**
 * AnonymousId of the wallet that signs LP / Meteora DLMM agent txs (earn pillar).
 * Mirrors api/libs/agentWalletPurpose.js `lpAgentAnonymousIdFrom`.
 */
export function lpAgentAnonymousIdFrom(chatOrSiblingAnonymousId: string): string {
  return siblingAnonymousId(chatOrSiblingAnonymousId, "earn");
}

/**
 * @deprecated Dedicated `:lp` wallets are retired. Prefer {@link lpAgentAnonymousIdFrom} (earn).
 * Kept for historical id parsing / migration only.
 */
export function lpAnonymousIdFromChat(chatAnonymousId: string): string {
  const base = baseAnonymousIdFrom(chatAnonymousId);
  return `${base}:lp`;
}

export function isLpAnonymousId(id: string): boolean {
  return id.endsWith(":lp");
}

export function isEarnAnonymousId(id: string): boolean {
  return id.endsWith(":earn");
}
