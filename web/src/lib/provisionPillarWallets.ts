import type { QueryClient } from "@tanstack/react-query";
import { PILLAR_WALLET_PURPOSES } from "@/lib/agentWalletCatalog";
import {
  agentWalletApi,
  type AgentWalletLpFields,
  type AgentWalletSetResponse,
} from "@/lib/chatApi";

/** Canonical spend anonymousId for a linked Solana wallet. */
export function linkedWalletAnonymousId(walletAddress: string): string {
  return `wallet:${walletAddress.trim()}`;
}

/** Whether an anonymousId belongs to the given linked Solana wallet (base or sibling). */
export function isAnonymousIdForWallet(anonymousId: string, walletAddress: string): boolean {
  const base = linkedWalletAnonymousId(walletAddress);
  return anonymousId === base || anonymousId.startsWith(`${base}:`);
}

let provisionFlight: Promise<ProvisionedWalletFields> | null = null;
let provisionFlightAddress: string | null = null;

/** Provision (or load) all five pillar agent wallets for a linked Solana wallet. Dedupes concurrent calls. */
export async function provisionLinkedPillarWallets(walletAddress: string): Promise<ProvisionedWalletFields> {
  const address = walletAddress.trim();
  if (!address) throw new Error("wallet_address_required");
  if (provisionFlight && provisionFlightAddress === address) {
    return provisionFlight;
  }
  provisionFlightAddress = address;
  provisionFlight = agentWalletApi
    .getOrCreateByWallet(address, "solana")
    .finally(() => {
      provisionFlight = null;
      provisionFlightAddress = null;
    });
  return provisionFlight;
}

/** True when earn, treasury, invest, spend, and grow wallets all exist. */
export function hasCompletePillarSet(set: AgentWalletSetResponse | undefined): boolean {
  if (!set?.wallets) return false;
  return PILLAR_WALLET_PURPOSES.every(
    (purpose) =>
      Boolean(set.wallets?.[purpose]?.anonymousId && set.wallets?.[purpose]?.agentAddress),
  );
}

/** Seed react-query with wallet set returned from connect / sign-in provisioning. */
export function seedPillarWalletSetCache(
  queryClient: QueryClient,
  res: {
    anonymousId: string;
    agentAddress: string;
    avatarUrl?: string | null;
    wallets?: AgentWalletSetResponse["wallets"];
  },
  walletAddress?: string | null,
): void {
  if (!res.wallets || !res.anonymousId) return;
  const payload: AgentWalletSetResponse = {
    anonymousId: res.anonymousId,
    agentAddress: res.agentAddress,
    avatarUrl: res.avatarUrl ?? null,
    purpose: "spend",
    wallets: res.wallets,
    balances: null,
  };
  // Always seed the anonymousId-only key (legacy callers / invalidations).
  queryClient.setQueryData<AgentWalletSetResponse>(["agent-wallet-set", res.anonymousId], payload);
  // Match usePillarAgentWallets key that includes walletAddress — required for live cards.
  const wallet = walletAddress?.trim();
  if (wallet) {
    queryClient.setQueryData<AgentWalletSetResponse>(
      ["agent-wallet-set", res.anonymousId, wallet],
      payload,
    );
  }
}

export type ProvisionedWalletFields = AgentWalletLpFields & {
  anonymousId: string;
  agentAddress: string;
  avatarUrl?: string | null;
};
