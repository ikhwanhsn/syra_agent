import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAgentTreasuryBalances } from "@/hooks/useAgentTreasuryBalances";
import { usePillarAgentWallets } from "@/hooks/usePillarAgentWallets";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useWalletContext } from "@/contexts/WalletContext";
import { useAgentWallet } from "@/contexts/AgentWalletContext";
import { useSyraAuth } from "@/contexts/SyraAuthContext";
import { useToast } from "@/hooks/use-toast";
import { agentWalletApi } from "@/lib/chatApi";
import {
  hasCompletePillarSet,
  isAnonymousIdForWallet,
  linkedWalletAnonymousId,
  provisionLinkedPillarWallets,
  seedPillarWalletSetCache,
} from "@/lib/provisionPillarWallets";
import type { AgentWalletFundTarget, AgentWalletPurpose } from "@/lib/agentWalletCatalog";
import type { ManagedAgentWallet } from "@/components/settings/AgentWalletsManager";

const STALE_MS = 45_000;

type SetupChain = "solana";

interface AgentSetupRecord {
  anonymousId: string;
  agentAddress: string;
  avatarUrl: string | null;
  chain: SetupChain;
  walletAddress: string;
}

async function fetchAgentSetup(
  walletAddress: string,
  queryClient: ReturnType<typeof useQueryClient>,
): Promise<AgentSetupRecord> {
  const res = await agentWalletApi.getOrCreateByWallet(walletAddress, "solana");
  seedPillarWalletSetCache(queryClient, res, walletAddress);
  return {
    anonymousId: res.anonymousId,
    agentAddress: res.agentAddress,
    avatarUrl: res.avatarUrl ?? null,
    chain: "solana",
    walletAddress,
  };
}

export function useManagedAgentWallets() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { address: solanaAddress, shortAddress, connectForChain, connected } = useWalletContext();
  const {
    ready: contextReady,
    anonymousId: contextAnonymousId,
    agentAddress: contextAgentAddress,
    avatarUrl: contextAvatarUrl,
    connectedChain,
    connectedWalletAddress,
    lpReady,
    lpAnonymousId,
    lpAgentAddress,
  } = useAgentWallet();
  const { syraAuthReady, syraAuthenticated, ensureSyraAuth, requestSyraAuth } = useSyraAuth();

  const hasSolana = Boolean(solanaAddress);
  const walletQueriesEnabled = syraAuthReady && syraAuthenticated;

  const solanaQ = useQuery({
    queryKey: ["agent-setup", "solana", solanaAddress],
    queryFn: () => fetchAgentSetup(solanaAddress!, queryClient),
    enabled: hasSolana && walletQueriesEnabled,
    staleTime: STALE_MS,
    retry: 1,
  });

  const contextLinkedAgent: AgentSetupRecord | undefined = useMemo(() => {
    if (!contextReady || !contextAnonymousId || !contextAgentAddress) return undefined;
    if (hasSolana && connectedChain === "solana" && solanaAddress) {
      return {
        anonymousId: contextAnonymousId,
        agentAddress: contextAgentAddress,
        avatarUrl: contextAvatarUrl,
        chain: "solana",
        walletAddress: solanaAddress,
      };
    }
    return undefined;
  }, [
    hasSolana,
    contextReady,
    contextAnonymousId,
    contextAgentAddress,
    contextAvatarUrl,
    connectedChain,
    solanaAddress,
  ]);

  const guestAgent: AgentSetupRecord | undefined = useMemo(() => {
    if (hasSolana || !contextReady || !contextAnonymousId || !contextAgentAddress) return undefined;
    return {
      anonymousId: contextAnonymousId,
      agentAddress: contextAgentAddress,
      avatarUrl: contextAvatarUrl,
      chain: "solana",
      walletAddress: connectedWalletAddress ?? "",
    };
  }, [
    hasSolana,
    contextReady,
    contextAnonymousId,
    contextAgentAddress,
    contextAvatarUrl,
    connectedWalletAddress,
  ]);

  const contextMatchesLinkedWallet = Boolean(
    contextLinkedAgent &&
      solanaAddress &&
      isAnonymousIdForWallet(contextLinkedAgent.anonymousId, solanaAddress),
  );

  const activeAgent = hasSolana
    ? solanaQ.data ??
      (syraAuthenticated && (solanaQ.isLoading || solanaQ.isFetching)
        ? undefined
        : contextMatchesLinkedWallet
          ? contextLinkedAgent
          : undefined)
    : guestAgent;
  const activeQ = hasSolana ? solanaQ : { isLoading: !contextReady, isFetching: false, isError: false };
  const authPending = hasSolana && syraAuthReady && !syraAuthenticated;

  useEffect(() => {
    if (!hasSolana || !syraAuthReady || syraAuthenticated) return;
    void ensureSyraAuth();
  }, [hasSolana, syraAuthReady, syraAuthenticated, ensureSyraAuth]);

  const setupLoading =
    hasSolana
      ? !activeAgent && (!syraAuthReady || authPending || activeQ.isLoading || activeQ.isFetching)
      : !contextReady;
  const setupLoadError =
    hasSolana && syraAuthReady && syraAuthenticated && activeQ.isError && !activeAgent;

  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [refreshingBalances, setRefreshingBalances] = useState(false);
  const [fundTab, setFundTab] = useState<"deposit" | "withdraw">("deposit");
  const [fundWallet, setFundWallet] = useState<AgentWalletPurpose>("spend");
  const [creatingSpend, setCreatingSpend] = useState(false);
  const autoProvisionKeyRef = useRef<string | null>(null);

  const pillarBaseAnonymousId = useMemo(() => {
    if (hasSolana && solanaAddress && syraAuthenticated) {
      if (activeAgent?.anonymousId && isAnonymousIdForWallet(activeAgent.anonymousId, solanaAddress)) {
        return activeAgent.anonymousId;
      }
      return linkedWalletAnonymousId(solanaAddress);
    }
    return activeAgent?.anonymousId;
  }, [activeAgent?.anonymousId, hasSolana, solanaAddress, syraAuthenticated]);

  const pillarQueryEnabled = Boolean(pillarBaseAnonymousId) && (!hasSolana || syraAuthenticated);

  const pillar = usePillarAgentWallets(
    pillarBaseAnonymousId,
    activeAgent?.walletAddress ?? solanaAddress ?? connectedWalletAddress ?? "",
    { enabled: pillarQueryEnabled, canProvision: hasSolana && syraAuthenticated },
  );

  const {
    spendBalances,
    lpWallet: pillarLpWallet,
    lpBalances: pillarLpBalances,
    pillarEntries,
    visibleSlots,
    refreshSet,
    totalUsdc: pillarTotalUsdc,
    totalSol: pillarTotalSol,
    isInternal,
    isFetched: pillarSetFetched,
    walletSet,
  } = pillar;

  const pillarSetComplete = hasCompletePillarSet(walletSet);

  const legacyTreasury = useAgentTreasuryBalances({ chatAnonymousId: pillarBaseAnonymousId ?? activeAgent?.anonymousId });

  const spendSolBalance = spendBalances.solBalance ?? legacyTreasury.chatSolBalance;
  const spendUsdcBalance = spendBalances.usdcBalance ?? legacyTreasury.chatUsdcBalance;
  const lpSolResolved = pillarLpBalances.solBalance ?? legacyTreasury.lpSolBalance;
  const lpUsdcResolved = pillarLpBalances.usdcBalance ?? legacyTreasury.lpUsdcBalance;

  const managedSpendWallet: ManagedAgentWallet | undefined =
    pillar.spendWallet ??
    (activeAgent
      ? {
          anonymousId: activeAgent.anonymousId,
          agentAddress: activeAgent.agentAddress,
          walletAddress: activeAgent.walletAddress,
        }
      : undefined);

  const managedLpWallet: ManagedAgentWallet | undefined =
    pillarLpWallet ??
    (lpAnonymousId && lpAgentAddress
      ? {
          anonymousId: lpAnonymousId,
          agentAddress: lpAgentAddress,
          walletAddress: activeAgent?.walletAddress ?? connectedWalletAddress ?? "",
        }
      : undefined);

  const copyToClipboard = useCallback(
    (text: string, label: string) => {
      void navigator.clipboard?.writeText(text).then(
        () => {
          toast({ title: "Copied", description: `${label} copied.` });
          setCopiedField(label);
          window.setTimeout(() => setCopiedField(null), 2000);
        },
        () => toast({ title: "Could not copy", variant: "destructive" }),
      );
    },
    [toast],
  );

  const handleRetryLoad = useCallback(async () => {
    const ok = await requestSyraAuth();
    if (!ok) {
      toast({
        title: "Sign in required",
        description: "Approve the wallet sign-in prompt to load your agent wallets.",
        variant: "destructive",
      });
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["agent-setup", "solana", solanaAddress] });
    await solanaQ.refetch();
  }, [queryClient, requestSyraAuth, solanaAddress, solanaQ, toast]);

  const selectFundTarget = useCallback(
    (tab: "deposit" | "withdraw", wallet: AgentWalletPurpose) => {
      if (connectedChain !== "solana") {
        toast({
          title: "Connect Solana wallet",
          description: "Connect your Solana wallet to move funds.",
        });
        void connectForChain("solana");
        return false;
      }
      setFundTab(tab);
      setFundWallet(wallet);
      return true;
    },
    [connectedChain, connectForChain, toast],
  );

  const handleFundSpend = useCallback(() => selectFundTarget("deposit", "spend"), [selectFundTarget]);
  const handleFundLp = useCallback(() => selectFundTarget("deposit", "lp"), [selectFundTarget]);
  const handleWithdrawSpend = useCallback(() => selectFundTarget("withdraw", "spend"), [selectFundTarget]);
  const handleWithdrawLp = useCallback(() => selectFundTarget("withdraw", "lp"), [selectFundTarget]);

  const handleFundPillar = useCallback(
    (purpose: AgentWalletPurpose) => selectFundTarget("deposit", purpose),
    [selectFundTarget],
  );

  const handleWithdrawPillar = useCallback(
    (purpose: AgentWalletPurpose) => selectFundTarget("withdraw", purpose),
    [selectFundTarget],
  );

  const handleRefreshAll = useCallback(async () => {
    setRefreshingBalances(true);
    try {
      await Promise.all([refreshSet(), legacyTreasury.refreshTreasuryBalances()]);
      toast({ title: "Balances updated" });
    } finally {
      setRefreshingBalances(false);
    }
  }, [refreshSet, legacyTreasury, toast]);

  const provisionAgentWallets = useCallback(async (): Promise<boolean> => {
    if (hasSolana && solanaAddress) {
      const ok = await requestSyraAuth();
      if (!ok) return false;
      const res = await provisionLinkedPillarWallets(solanaAddress);
      seedPillarWalletSetCache(queryClient, res, solanaAddress);
      await queryClient.invalidateQueries({ queryKey: ["agent-setup", "solana", solanaAddress] });
      await queryClient.invalidateQueries({ queryKey: ["agent-wallet-set", res.anonymousId] });
      if (activeAgent?.anonymousId && activeAgent.anonymousId !== res.anonymousId) {
        await queryClient.invalidateQueries({ queryKey: ["agent-wallet-set", activeAgent.anonymousId] });
      }
      await solanaQ.refetch();
      await refreshSet();
      return true;
    }

    await agentWalletApi.getOrCreate();
    await refreshSet();
    return true;
  }, [
    activeAgent?.anonymousId,
    hasSolana,
    queryClient,
    refreshSet,
    requestSyraAuth,
    solanaAddress,
    solanaQ,
  ]);

  useEffect(() => {
    if (!hasSolana || !solanaAddress || !syraAuthReady || !syraAuthenticated) return;
    if (creatingSpend || pillar.loading) return;
    if (pillarSetComplete) return;
    if (!pillarSetFetched && activeAgent?.anonymousId) return;

    const provisionKey = `${solanaAddress}:${activeAgent?.anonymousId ?? "none"}`;
    if (autoProvisionKeyRef.current === provisionKey) return;
    autoProvisionKeyRef.current = provisionKey;

    let cancelled = false;
    void (async () => {
      setCreatingSpend(true);
      try {
        const ok = await provisionAgentWallets();
        if (cancelled || !ok) {
          autoProvisionKeyRef.current = null;
        }
      } catch {
        if (!cancelled) autoProvisionKeyRef.current = null;
      } finally {
        if (!cancelled) setCreatingSpend(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    activeAgent?.anonymousId,
    creatingSpend,
    hasSolana,
    pillar.loading,
    pillarSetComplete,
    pillarSetFetched,
    provisionAgentWallets,
    solanaAddress,
    syraAuthenticated,
    syraAuthReady,
  ]);

  const handleCreateSpendWallet = useCallback(async () => {
    autoProvisionKeyRef.current = null;
    setCreatingSpend(true);
    try {
      const ok = await provisionAgentWallets();
      if (!ok) {
        toast({
          title: "Sign in required",
          description: "Approve the wallet sign-in prompt to create your agent wallets.",
          variant: "destructive",
        });
        return;
      }
      toast({ title: "Agent wallets ready", description: "Your five-pillar treasuries are set up." });
    } catch (err) {
      toast({
        title: "Could not create wallets",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setCreatingSpend(false);
    }
  }, [provisionAgentWallets, toast]);

  const totalUsdc = pillarTotalUsdc ?? legacyTreasury.totalUsdc;
  const totalSol = pillarTotalSol ?? legacyTreasury.totalSol;

  const agentWalletTargets = useMemo((): Partial<Record<AgentWalletPurpose, AgentWalletFundTarget>> => {
    const out: Partial<Record<AgentWalletPurpose, AgentWalletFundTarget>> = {};
    for (const entry of pillarEntries) {
      out[entry.purpose] = {
        agentAddress: entry.wallet.agentAddress,
        anonymousId: entry.wallet.anonymousId,
        solBalance: entry.balances.solBalance,
        usdcBalance: entry.balances.usdcBalance,
      };
    }
    if (managedLpWallet?.agentAddress && managedLpWallet.anonymousId) {
      out.lp = {
        agentAddress: managedLpWallet.agentAddress,
        anonymousId: managedLpWallet.anonymousId,
        solBalance: lpSolResolved,
        usdcBalance: lpUsdcResolved,
      };
    }
    return out;
  }, [pillarEntries, managedLpWallet, lpSolResolved, lpUsdcResolved]);

  return {
    connected,
    hasSolana,
    shortAddress,
    setupLoading,
    setupLoadError,
    authPending,
    syraAuthenticated,
    syraAuthReady,
    activeAgent,
    managedSpendWallet,
    managedChatWallet: managedSpendWallet,
    managedLpWallet,
    lpWalletReady: lpReady || Boolean(managedLpWallet),
    pillarEntries,
    agentWalletTargets,
    pillarSetComplete,
    visibleSlots,
    isInternal,
    spendSolBalance,
    spendUsdcBalance,
    chatSolBalance: spendSolBalance,
    chatUsdcBalance: spendUsdcBalance,
    lpAgentSolBalance: lpSolResolved,
    lpAgentUsdcBalance: lpUsdcResolved,
    totalUsdc,
    totalSol,
    solPriceUsd: legacyTreasury.solPriceUsd,
    estimatedTreasuryUsd: legacyTreasury.estimatedTreasuryUsd,
    loading: pillar.loading,
    pillarLoading: (pillar.loading || creatingSpend) && !pillarSetComplete,
    pillarProvisionError:
      (pillar.isError || (hasSolana && syraAuthenticated && solanaQ.isError)) && !pillarSetComplete,
    provisioningWallets: creatingSpend,
    copiedField,
    refreshingBalances,
    fundTab,
    fundWallet,
    setFundTab,
    setFundWallet,
    selectFundTarget,
    creatingSpend,
    creatingChat: creatingSpend,
    copyToClipboard,
    handleRetryLoad,
    handleFundSpend,
    handleFundChat: handleFundSpend,
    handleFundLp,
    handleWithdrawSpend,
    handleWithdrawChat: handleWithdrawSpend,
    handleWithdrawLp,
    handleFundPillar,
    handleWithdrawPillar,
    handleRefreshAll,
    handleCreateSpendWallet,
    handleCreateChatWallet: handleCreateSpendWallet,
    handleRetryProvision: handleCreateSpendWallet,
    getBalanceForPurpose: pillar.getBalanceForPurpose,
    getWalletForPurpose: pillar.getWalletForPurpose,
    refreshPillarSet: refreshSet,
  };
}
