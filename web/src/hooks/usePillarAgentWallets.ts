import { useCallback, useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { agentWalletApi, type AgentWalletSetResponse } from "@/lib/chatApi";
import { hasCompletePillarSet, linkedWalletAnonymousId, provisionLinkedPillarWallets, seedPillarWalletSetCache } from "@/lib/provisionPillarWallets";
import {
  AGENT_WALLET_SLOTS,
  PILLAR_WALLET_PURPOSES,
  type AgentWalletPurpose,
  type PillarWalletPurpose,
} from "@/lib/agentWalletCatalog";
import { isAdminWallet } from "@/constants/adminWallet";
import { useWalletContext } from "@/contexts/WalletContext";
import type { ManagedAgentWallet } from "@/components/settings/AgentWalletsManager";

const STALE_MS = 45_000;

export type PillarWalletBalance = {
  solBalance: number | null;
  usdcBalance: number | null;
};

export type PillarWalletEntry = {
  purpose: PillarWalletPurpose;
  wallet: ManagedAgentWallet;
  balances: PillarWalletBalance;
};

function toManagedWallet(
  row: { anonymousId: string; agentAddress: string },
  walletAddress: string,
): ManagedAgentWallet {
  return {
    anonymousId: row.anonymousId,
    agentAddress: row.agentAddress,
    walletAddress,
  };
}

export function usePillarAgentWallets(
  baseAnonymousId: string | null | undefined,
  walletAddress: string,
  options?: { enabled?: boolean; canProvision?: boolean },
) {
  const queryClient = useQueryClient();
  const { connected, address } = useWalletContext();
  const isInternal = isAdminWallet(connected, address);
  const queryEnabled = options?.enabled !== false && Boolean(baseAnonymousId);
  const canProvision = options?.canProvision !== false && Boolean(walletAddress.trim());

  const setQ = useQuery({
    queryKey: ["agent-wallet-set", baseAnonymousId, walletAddress],
    queryFn: async () => {
      try {
        return await agentWalletApi.getWalletSet(baseAnonymousId!, { includeBalances: true });
      } catch (err) {
        if (!canProvision) throw err;
        const res = await provisionLinkedPillarWallets(walletAddress);
        if (!res.wallets) throw err;
        const payload = {
          anonymousId: res.anonymousId,
          agentAddress: res.agentAddress,
          avatarUrl: res.avatarUrl ?? null,
          purpose: "spend" as const,
          wallets: res.wallets,
          balances: null,
        };
        seedPillarWalletSetCache(queryClient, res, walletAddress);
        return payload;
      }
    },
    enabled: queryEnabled,
    staleTime: STALE_MS,
    retry: 1,
  });

  const visibleSlots = useMemo(
    () => AGENT_WALLET_SLOTS.filter((slot) => !slot.internalOnly || isInternal),
    [isInternal],
  );

  const pillarEntries = useMemo((): PillarWalletEntry[] => {
    const data = setQ.data;
    if (!data?.wallets) return [];
    return PILLAR_WALLET_PURPOSES.flatMap((purpose) => {
      const row = data.wallets?.[purpose];
      if (!row?.anonymousId || !row.agentAddress) return [];
      const bal = data.balances?.[purpose];
      return [
        {
          purpose,
          wallet: toManagedWallet(row, walletAddress),
          balances: {
            solBalance: bal?.solBalance ?? null,
            usdcBalance: bal?.usdcBalance ?? null,
          },
        },
      ];
    });
  }, [setQ.data, walletAddress]);

  useEffect(() => {
    if (!queryEnabled || !baseAnonymousId) return;
    if (!hasCompletePillarSet(setQ.data)) return;
    if (setQ.data?.balances) return;
    if (setQ.isFetching) return;
    void setQ.refetch();
  }, [baseAnonymousId, queryEnabled, setQ, setQ.data, setQ.isFetching]);

  const spendEntry = pillarEntries.find((e) => e.purpose === "spend");
  const lpRow = setQ.data?.wallets?.lp;
  const lpBalances = setQ.data?.balances?.lp;

  const lpWallet: ManagedAgentWallet | undefined =
    isInternal && lpRow?.anonymousId && lpRow.agentAddress
      ? toManagedWallet(lpRow, walletAddress)
      : undefined;

  const totals = useMemo(() => {
    let usdc = 0;
    let sol = 0;
    let hasUsdc = false;
    let hasSol = false;
    for (const entry of pillarEntries) {
      if (entry.balances.usdcBalance != null) {
        usdc += entry.balances.usdcBalance;
        hasUsdc = true;
      }
      if (entry.balances.solBalance != null) {
        sol += entry.balances.solBalance;
        hasSol = true;
      }
    }
    if (lpWallet && lpBalances) {
      if (lpBalances.usdcBalance != null) {
        usdc += lpBalances.usdcBalance;
        hasUsdc = true;
      }
      if (lpBalances.solBalance != null) {
        sol += lpBalances.solBalance;
        hasSol = true;
      }
    }
    return {
      totalUsdc: hasUsdc ? usdc : null,
      totalSol: hasSol ? sol : null,
    };
  }, [pillarEntries, lpWallet, lpBalances]);

  const refreshSet = useCallback(async () => {
    if (!baseAnonymousId) return;
    await queryClient.invalidateQueries({ queryKey: ["agent-wallet-set", baseAnonymousId] });
    await setQ.refetch();
  }, [baseAnonymousId, queryClient, setQ]);

  const getBalanceForPurpose = useCallback(
    (purpose: AgentWalletPurpose): PillarWalletBalance => {
      if (purpose === "lp") {
        return {
          solBalance: lpBalances?.solBalance ?? null,
          usdcBalance: lpBalances?.usdcBalance ?? null,
        };
      }
      const entry = pillarEntries.find((e) => e.purpose === purpose);
      return entry?.balances ?? { solBalance: null, usdcBalance: null };
    },
    [pillarEntries, lpBalances],
  );

  const getWalletForPurpose = useCallback(
    (purpose: AgentWalletPurpose): ManagedAgentWallet | undefined => {
      if (purpose === "lp") return lpWallet;
      return pillarEntries.find((e) => e.purpose === purpose)?.wallet;
    },
    [pillarEntries, lpWallet],
  );

  return {
    walletSet: setQ.data as AgentWalletSetResponse | undefined,
    pillarSetComplete: hasCompletePillarSet(setQ.data),
    visibleSlots,
    pillarEntries,
    spendWallet: spendEntry?.wallet,
    spendBalances: spendEntry?.balances ?? { solBalance: null, usdcBalance: null },
    lpWallet,
    lpBalances: {
      solBalance: lpBalances?.solBalance ?? null,
      usdcBalance: lpBalances?.usdcBalance ?? null,
    },
    isInternal,
    loading: queryEnabled && setQ.isLoading && !setQ.data,
    isFetched: setQ.isFetched,
    isError: setQ.isError,
    isFetchingBalances: queryEnabled && setQ.isFetching && Boolean(setQ.data),
    refreshSet,
    getBalanceForPurpose,
    getWalletForPurpose,
    totalUsdc: totals.totalUsdc,
    totalSol: totals.totalSol,
  };
}
