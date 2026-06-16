import { useCallback, useEffect, useMemo, useState } from "react";
import { useAgentTreasuryBalances } from "@/hooks/useAgentTreasuryBalances";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useWalletContext } from "@/contexts/WalletContext";
import { useAgentWallet } from "@/contexts/AgentWalletContext";
import { useSyraAuth } from "@/contexts/SyraAuthContext";
import { useToast } from "@/hooks/use-toast";
import { agentWalletApi } from "@/lib/chatApi";
import type { AgentWalletPurpose } from "@/lib/agentWalletCatalog";
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

async function fetchAgentSetup(walletAddress: string): Promise<AgentSetupRecord> {
  const res = await agentWalletApi.getOrCreateByWallet(walletAddress, "solana");
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
  const { syraAuthReady, syraAuthenticated, ensureSyraAuth } = useSyraAuth();

  const hasSolana = Boolean(solanaAddress);
  const walletQueriesEnabled = syraAuthReady && syraAuthenticated;

  const solanaQ = useQuery({
    queryKey: ["agent-setup", "solana", solanaAddress],
    queryFn: () => fetchAgentSetup(solanaAddress!),
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

  const activeAgent = hasSolana ? solanaQ.data ?? contextLinkedAgent : guestAgent;
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
  const [refreshingLpBalances, setRefreshingLpBalances] = useState(false);
  const [fundTab, setFundTab] = useState<"deposit" | "withdraw">("deposit");
  const [fundWallet, setFundWallet] = useState<AgentWalletPurpose>("chat");
  const [creatingChat, setCreatingChat] = useState(false);
  const [creatingLp, setCreatingLp] = useState(false);

  const lpAgent: AgentSetupRecord | undefined = useMemo(() => {
    if (!lpReady || !lpAnonymousId || !lpAgentAddress) return undefined;
    return {
      anonymousId: lpAnonymousId,
      agentAddress: lpAgentAddress,
      avatarUrl: null,
      chain: "solana",
      walletAddress: activeAgent?.walletAddress ?? connectedWalletAddress ?? "",
    };
  }, [lpReady, lpAnonymousId, lpAgentAddress, activeAgent?.walletAddress, connectedWalletAddress]);

  const {
    chatUsdcBalance,
    chatSolBalance,
    lpUsdcBalance: lpUsdcResolved,
    lpSolBalance: lpSolResolved,
    totalUsdc,
    totalSol,
    refreshTreasuryBalances,
    refreshChatBalances,
    refreshLpBalances,
  } = useAgentTreasuryBalances({ chatAnonymousId: activeAgent?.anonymousId });

  const managedChatWallet: ManagedAgentWallet | undefined = activeAgent
    ? {
        anonymousId: activeAgent.anonymousId,
        agentAddress: activeAgent.agentAddress,
        walletAddress: activeAgent.walletAddress,
      }
    : undefined;

  const managedLpWallet: ManagedAgentWallet | undefined = lpAgent
    ? {
        anonymousId: lpAgent.anonymousId,
        agentAddress: lpAgent.agentAddress,
        walletAddress: lpAgent.walletAddress,
      }
    : undefined;

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

  const handleFundChat = useCallback(() => selectFundTarget("deposit", "chat"), [selectFundTarget]);
  const handleFundLp = useCallback(() => selectFundTarget("deposit", "lp"), [selectFundTarget]);
  const handleWithdrawChat = useCallback(() => selectFundTarget("withdraw", "chat"), [selectFundTarget]);
  const handleWithdrawLp = useCallback(() => selectFundTarget("withdraw", "lp"), [selectFundTarget]);

  const handleRefreshChatBalances = useCallback(async () => {
    setRefreshingBalances(true);
    try {
      await refreshChatBalances();
    } finally {
      setRefreshingBalances(false);
    }
  }, [refreshChatBalances]);

  const handleRefreshLpBalances = useCallback(async () => {
    setRefreshingLpBalances(true);
    try {
      await refreshLpBalances();
    } finally {
      setRefreshingLpBalances(false);
    }
  }, [refreshLpBalances]);

  const handleRefreshAll = useCallback(async () => {
    setRefreshingBalances(true);
    setRefreshingLpBalances(true);
    try {
      await refreshTreasuryBalances();
      toast({ title: "Balances updated" });
    } finally {
      setRefreshingBalances(false);
      setRefreshingLpBalances(false);
    }
  }, [refreshTreasuryBalances, toast]);

  const handleCreateChatWallet = useCallback(async () => {
    setCreatingChat(true);
    try {
      if (hasSolana && solanaAddress) {
        const ok = await requestSyraAuth();
        if (!ok) {
          toast({
            title: "Sign in required",
            description: "Approve the wallet sign-in prompt to create your agent wallet.",
            variant: "destructive",
          });
          return;
        }
        await agentWalletApi.getOrCreateByWallet(solanaAddress);
      } else {
        await agentWalletApi.getOrCreate();
      }
      toast({ title: "Chat wallet created", description: "Reloading…" });
      window.setTimeout(() => window.location.reload(), 400);
    } catch (err) {
      toast({
        title: "Could not create wallet",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setCreatingChat(false);
    }
  }, [hasSolana, requestSyraAuth, solanaAddress, toast]);

  const handleCreateLpWallet = useCallback(async () => {
    if (!activeAgent?.anonymousId) {
      toast({ title: "Create chat wallet first", variant: "destructive" });
      return;
    }
    setCreatingLp(true);
    try {
      if (hasSolana && solanaAddress) {
        const ok = await requestSyraAuth();
        if (!ok) {
          toast({
            title: "Sign in required",
            description: "Approve the wallet sign-in prompt to create your LP agent wallet.",
            variant: "destructive",
          });
          return;
        }
        await agentWalletApi.getOrCreateLpByWallet(solanaAddress);
      } else {
        await agentWalletApi.getOrCreateLp(activeAgent.anonymousId);
      }
      toast({ title: "LP wallet created", description: "Reloading…" });
      window.setTimeout(() => window.location.reload(), 400);
    } catch (err) {
      toast({
        title: "Could not create LP wallet",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setCreatingLp(false);
    }
  }, [activeAgent?.anonymousId, hasSolana, requestSyraAuth, solanaAddress, toast]);

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
    managedChatWallet,
    managedLpWallet,
    chatSolBalance,
    chatUsdcBalance,
    lpAgentSolBalance: lpSolResolved,
    lpAgentUsdcBalance: lpUsdcResolved,
    totalUsdc,
    totalSol,
    copiedField,
    refreshingBalances,
    refreshingLpBalances,
    fundTab,
    fundWallet,
    setFundTab,
    setFundWallet,
    selectFundTarget,
    creatingChat,
    creatingLp,
    copyToClipboard,
    handleRetryLoad,
    handleFundChat,
    handleFundLp,
    handleWithdrawChat,
    handleWithdrawLp,
    handleRefreshChatBalances,
    handleRefreshLpBalances,
    handleRefreshAll,
    handleCreateChatWallet,
    handleCreateLpWallet,
  };
}
