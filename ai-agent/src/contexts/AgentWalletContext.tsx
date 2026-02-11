import {
  createContext,
  useContext,
  useMemo,
  useState,
  useEffect,
  useRef,
  useCallback,
  type ReactNode,
} from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { agentWalletApi } from "@/lib/chatApi";

const STORAGE_KEY = "syra_agent_anonymous_id";

export interface AgentWalletState {
  ready: boolean;
  anonymousId: string | null;
  agentAddress: string | null;
  agentShortAddress: string | null;
  agentSolBalance: number | null;
  agentUsdcBalance: number | null;
  /** User avatar URL generated when wallet was created */
  avatarUrl: string | null;
  /** Connected user wallet address (Solana), if wallet is connected */
  connectedWalletAddress: string | null;
  connectedWalletShort: string | null;
  /** Transient: amount just debited (for -$X.XX effect); cleared after animation */
  lastDebitUsd: number | null;
  /** Refetch SOL/USDC balance (e.g. after a tool call). */
  refetchBalance: () => Promise<void>;
  /** Show debit effect (e.g. -0.01) then clear after a short delay. */
  reportDebit: (amountUsd: number) => void;
  /** Update avatar URL in real-time (e.g. after generating new avatar). */
  updateAvatarUrl: (newAvatarUrl: string | null) => void;
}

const AgentWalletContext = createContext<AgentWalletState | null>(null);

function AgentWalletContextInner({ children }: { children: ReactNode }) {
  const { publicKey: connectedPublicKey } = useWallet();
  const connectedWalletAddress = connectedPublicKey?.toBase58() ?? null;
  const [ready, setReady] = useState(false);
  const [anonymousId, setAnonymousId] = useState<string | null>(null);
  const [agentAddress, setAgentAddress] = useState<string | null>(null);
  const [agentSolBalance, setAgentSolBalance] = useState<number | null>(null);
  const [agentUsdcBalance, setAgentUsdcBalance] = useState<number | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [lastDebitUsd, setLastDebitUsd] = useState<number | null>(null);
  const initRef = useRef(false);
  const debitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const refetchTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // When user connects wallet: get or create agent wallet by wallet address (check database)
  useEffect(() => {
    if (connectedWalletAddress) {
      setReady(false);
      agentWalletApi
        .getOrCreateByWallet(connectedWalletAddress)
        .then(({ anonymousId: id, agentAddress: addr, avatarUrl: avatar }) => {
          setAnonymousId(id);
          setAgentAddress(addr);
          setAvatarUrl(avatar || null);
        })
        .catch(() => {
          setAnonymousId(null);
          setAgentAddress(null);
          setAvatarUrl(null);
        })
        .finally(() => setReady(true));
      return;
    }

    // No wallet connected: use anonymous id from localStorage
    const stored = typeof localStorage !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    const id = stored?.trim() || null;

    if (id) {
      setReady(false);
      agentWalletApi
        .getOrCreate(id)
        .then(({ agentAddress: addr, avatarUrl: avatar }) => {
          setAnonymousId(id);
          setAgentAddress(addr);
          setAvatarUrl(avatar || null);
        })
        .catch(() => {
          setAnonymousId(null);
          setAgentAddress(null);
          setAvatarUrl(null);
        })
        .finally(() => {
          initRef.current = true;
          setReady(true);
        });
    } else {
      setReady(false);
      agentWalletApi
        .getOrCreate()
        .then(({ anonymousId: newId, agentAddress: addr, avatarUrl: avatar }) => {
          if (typeof localStorage !== "undefined") {
            localStorage.setItem(STORAGE_KEY, newId);
          }
          setAnonymousId(newId);
          setAgentAddress(addr);
          setAvatarUrl(avatar || null);
        })
        .catch(() => {
          setAnonymousId(null);
          setAgentAddress(null);
          setAvatarUrl(null);
        })
        .finally(() => {
          initRef.current = true;
          setReady(true);
        });
    }
  }, [connectedWalletAddress]);

  const refetchBalance = useCallback(async () => {
    if (!anonymousId) return;
    try {
      const { solBalance: sol, usdcBalance: usdc } = await agentWalletApi.getBalance(anonymousId);
      setAgentSolBalance(sol);
      setAgentUsdcBalance(usdc);
    } catch {
      setAgentSolBalance(null);
      setAgentUsdcBalance(null);
    }
  }, [anonymousId]);

  useEffect(() => {
    if (!anonymousId || !agentAddress) return;
    let cancelled = false;
    function fetchBalance() {
      agentWalletApi
        .getBalance(anonymousId)
        .then(({ solBalance: sol, usdcBalance: usdc }) => {
          if (!cancelled) {
            setAgentSolBalance(sol);
            setAgentUsdcBalance(usdc);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setAgentSolBalance(null);
            setAgentUsdcBalance(null);
          }
        });
    }
    fetchBalance();
    const interval = setInterval(fetchBalance, 30000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [anonymousId, agentAddress]);

  const reportDebit = useCallback(
    (amountUsd: number) => {
      if (debitTimeoutRef.current) clearTimeout(debitTimeoutRef.current);
      refetchTimeoutsRef.current.forEach((t) => clearTimeout(t));
      refetchTimeoutsRef.current = [];
      setLastDebitUsd(amountUsd);
      // Optimistic update: subtract from balance immediately so UI updates in real time
      setAgentUsdcBalance((prev) =>
        prev != null ? Math.max(0, prev - amountUsd) : null
      );
      // Sync with chain: refetch now and after delays (chain may confirm later)
      refetchBalance();
      refetchTimeoutsRef.current = [
        setTimeout(refetchBalance, 2000),
        setTimeout(refetchBalance, 5000),
      ];
      debitTimeoutRef.current = setTimeout(() => {
        setLastDebitUsd(null);
        debitTimeoutRef.current = null;
      }, 2800);
    },
    [refetchBalance]
  );

  useEffect(
    () => () => {
      if (debitTimeoutRef.current) clearTimeout(debitTimeoutRef.current);
      refetchTimeoutsRef.current.forEach((t) => clearTimeout(t));
      refetchTimeoutsRef.current = [];
    },
    []
  );

  const agentShortAddress = agentAddress
    ? `${agentAddress.slice(0, 4)}...${agentAddress.slice(-4)}`
    : null;

  const connectedWalletShort = connectedWalletAddress
    ? `${connectedWalletAddress.slice(0, 4)}...${connectedWalletAddress.slice(-4)}`
    : null;

  const updateAvatarUrl = useCallback((newAvatarUrl: string | null) => {
    setAvatarUrl(newAvatarUrl);
  }, []);

  const value = useMemo<AgentWalletState>(
    () => ({
      ready,
      anonymousId,
      agentAddress,
      agentShortAddress,
      agentSolBalance,
      agentUsdcBalance,
      avatarUrl,
      connectedWalletAddress,
      connectedWalletShort,
      lastDebitUsd,
      refetchBalance,
      reportDebit,
      updateAvatarUrl,
    }),
    [
      ready,
      anonymousId,
      agentAddress,
      agentShortAddress,
      agentSolBalance,
      agentUsdcBalance,
      avatarUrl,
      connectedWalletAddress,
      connectedWalletShort,
      lastDebitUsd,
      refetchBalance,
      reportDebit,
      updateAvatarUrl,
    ]
  );

  return (
    <AgentWalletContext.Provider value={value}>{children}</AgentWalletContext.Provider>
  );
}

export function useAgentWallet(): AgentWalletState {
  const ctx = useContext(AgentWalletContext);
  if (!ctx) throw new Error("useAgentWallet must be used within AgentWalletProvider");
  return ctx;
}

export function AgentWalletProvider({ children }: { children: ReactNode }) {
  return <AgentWalletContextInner>{children}</AgentWalletContextInner>;
}
