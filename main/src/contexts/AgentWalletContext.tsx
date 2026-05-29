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
import { PublicKey } from "@solana/web3.js";
import { useWalletContext } from "@/contexts/WalletContext";
import { useSyraAuth } from "@/contexts/SyraAuthContext";
import { agentWalletApi, type AgentWalletLpFields } from "@/lib/chatApi";

const STORAGE_KEY = "syra_agent_anonymous_id";
const AGENT_WALLET_CACHE_KEY = "syra_agent_wallet_cache_v1";

interface AgentWalletCachePayload {
  v: 1;
  anonymousId: string | null;
  linkedWallet: string | null;
  chain: "solana" | null;
  agentAddress: string;
  avatarUrl: string | null;
  agentSolBalance: number | null;
  agentUsdcBalance: number | null;
  updatedAt: number;
}

function walletKeyMatches(stored: string | null | undefined, query: string): boolean {
  if (!stored || !query) return false;
  return stored === query;
}

function readAgentWalletCache(
  query:
    | { kind: "guest"; anonymousId: string }
    | { kind: "wallet"; linkedWallet: string },
): AgentWalletCachePayload | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(AGENT_WALLET_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AgentWalletCachePayload;
    if (parsed?.v !== 1 || typeof parsed.agentAddress !== "string" || !parsed.agentAddress) return null;

    if (query.kind === "guest") {
      if (parsed.anonymousId !== query.anonymousId) return null;
      if (parsed.linkedWallet != null && parsed.linkedWallet !== "") return null;
      if (parsed.chain != null) return null;
      return parsed;
    }
    if (parsed.chain !== "solana") return null;
    if (!walletKeyMatches(parsed.linkedWallet, query.linkedWallet)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeAgentWalletCache(
  payload: Omit<AgentWalletCachePayload, "v" | "updatedAt"> & Partial<Pick<AgentWalletCachePayload, "updatedAt">>,
): void {
  if (typeof localStorage === "undefined") return;
  try {
    const full: AgentWalletCachePayload = {
      v: 1,
      anonymousId: payload.anonymousId,
      linkedWallet: payload.linkedWallet,
      chain: payload.chain,
      agentAddress: payload.agentAddress,
      avatarUrl: payload.avatarUrl,
      agentSolBalance: payload.agentSolBalance,
      agentUsdcBalance: payload.agentUsdcBalance,
      updatedAt: payload.updatedAt ?? Date.now(),
    };
    localStorage.setItem(AGENT_WALLET_CACHE_KEY, JSON.stringify(full));
  } catch {
    /* quota / private mode */
  }
}

function restoreWalletCacheToState(
  cached: AgentWalletCachePayload,
  setters: {
    setAnonymousId: (v: string | null) => void;
    setAgentAddress: (v: string | null) => void;
    setAvatarUrl: (v: string | null) => void;
    setAgentSolBalance: (v: number | null) => void;
    setAgentUsdcBalance: (v: number | null) => void;
  },
): void {
  setters.setAnonymousId(cached.anonymousId);
  setters.setAgentAddress(cached.agentAddress);
  setters.setAvatarUrl(cached.avatarUrl ?? null);
  setters.setAgentSolBalance(cached.agentSolBalance);
  setters.setAgentUsdcBalance(cached.agentUsdcBalance);
}

function mergeCachedBalances(
  agentAddress: string,
  patch: Partial<Pick<AgentWalletCachePayload, "agentSolBalance" | "agentUsdcBalance">>,
): void {
  if (typeof localStorage === "undefined") return;
  try {
    const raw = localStorage.getItem(AGENT_WALLET_CACHE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as AgentWalletCachePayload;
    if (parsed?.v !== 1 || parsed.agentAddress !== agentAddress) return;
    Object.assign(parsed, patch, { updatedAt: Date.now() });
    localStorage.setItem(AGENT_WALLET_CACHE_KEY, JSON.stringify(parsed));
  } catch {
    /* ignore */
  }
}

const LAMPORTS_PER_SOL = 1e9;
const USDC_MINT_MAINNET = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");

async function fetchAgentBalanceFromChain(
  connection: import("@solana/web3.js").Connection,
  agentAddress: string
): Promise<{ solBalance: number; usdcBalance: number }> {
  const pubkey = new PublicKey(agentAddress);
  const [solLamports, tokenAccounts] = await Promise.all([
    connection.getBalance(pubkey, "confirmed"),
    connection.getParsedTokenAccountsByOwner(pubkey, { mint: USDC_MINT_MAINNET }),
  ]);
  const solBalance = solLamports / LAMPORTS_PER_SOL;
  const accounts = tokenAccounts?.value ?? (Array.isArray(tokenAccounts) ? tokenAccounts : []);
  const usdcBalance = accounts.reduce((sum, acc) => {
    const ui = acc?.account?.data?.parsed?.info?.tokenAmount?.uiAmount;
    return sum + (Number(ui) || 0);
  }, 0);
  return { solBalance, usdcBalance };
}

async function hydrateLpWalletFromFields(
  connection: import("@solana/web3.js").Connection,
  lp: AgentWalletLpFields,
  setters: {
    setLpAnonymousId: (v: string | null) => void;
    setLpAgentAddress: (v: string | null) => void;
    setLpAgentSolBalance: (v: number | null) => void;
    setLpAgentUsdcBalance: (v: number | null) => void;
    setLpReady: (v: boolean) => void;
  },
): Promise<boolean> {
  if (!lp.lpAnonymousId?.trim() || !lp.lpAgentAddress?.trim()) return false;
  setters.setLpAnonymousId(lp.lpAnonymousId);
  setters.setLpAgentAddress(lp.lpAgentAddress);
  setters.setLpReady(true);
  try {
    const bal = await fetchAgentBalanceFromChain(connection, lp.lpAgentAddress);
    setters.setLpAgentSolBalance(bal.solBalance);
    setters.setLpAgentUsdcBalance(bal.usdcBalance);
  } catch {
    setters.setLpAgentSolBalance(null);
    setters.setLpAgentUsdcBalance(null);
  }
  return true;
}

export interface AgentWalletState {
  ready: boolean;
  anonymousId: string | null;
  agentAddress: string | null;
  agentShortAddress: string | null;
  agentSolBalance: number | null;
  agentUsdcBalance: number | null;
  avatarUrl: string | null;
  /** LP experiment wallet — separate treasury from chat agent. */
  lpReady: boolean;
  lpAnonymousId: string | null;
  lpAgentAddress: string | null;
  lpAgentShortAddress: string | null;
  lpAgentSolBalance: number | null;
  lpAgentUsdcBalance: number | null;
  connectedWalletAddress: string | null;
  connectedWalletShort: string | null;
  connectedChain: "solana" | null;
  lastDebitUsd: number | null;
  refetchBalance: () => Promise<void>;
  refetchLpBalance: () => Promise<void>;
  getAgentWalletBalances: () => Promise<{ usdcBalance: number; solBalance: number } | null>;
  reportDebit: (amountUsd: number) => void;
  reportNativeDebit: (amountSol: number) => void;
  updateAvatarUrl: (newAvatarUrl: string | null) => void;
}

const AgentWalletContext = createContext<AgentWalletState | null>(null);

function AgentWalletContextInner({ children }: { children: ReactNode }) {
  const { connection, address: solanaAddress } = useWalletContext();
  const { syraAuthReady, syraAuthenticated } = useSyraAuth();

  const connectedWalletAddress = solanaAddress ?? null;
  const connectedChain: "solana" | null = solanaAddress ? "solana" : null;

  const [ready, setReady] = useState(false);
  const [anonymousId, setAnonymousId] = useState<string | null>(null);
  const [agentAddress, setAgentAddress] = useState<string | null>(null);
  const [agentSolBalance, setAgentSolBalance] = useState<number | null>(null);
  const [agentUsdcBalance, setAgentUsdcBalance] = useState<number | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [lpReady, setLpReady] = useState(false);
  const [lpAnonymousId, setLpAnonymousId] = useState<string | null>(null);
  const [lpAgentAddress, setLpAgentAddress] = useState<string | null>(null);
  const [lpAgentSolBalance, setLpAgentSolBalance] = useState<number | null>(null);
  const [lpAgentUsdcBalance, setLpAgentUsdcBalance] = useState<number | null>(null);
  const [lastDebitUsd, setLastDebitUsd] = useState<number | null>(null);
  const initRef = useRef(false);
  const debitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const refetchTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const walletConnectFlightRef = useRef<Promise<void> | null>(null);
  const walletConnectCooldownUntilRef = useRef(0);

  const cacheSetters = {
    setAnonymousId,
    setAgentAddress,
    setAvatarUrl,
    setAgentSolBalance,
    setAgentUsdcBalance,
  };

  const lpSetters = {
    setLpAnonymousId,
    setLpAgentAddress,
    setLpAgentSolBalance,
    setLpAgentUsdcBalance,
    setLpReady,
  };

  useEffect(() => {
    if (!syraAuthReady || !connectedWalletAddress || connectedChain !== "solana") return;

    const cached = readAgentWalletCache({
      kind: "wallet",
      linkedWallet: connectedWalletAddress,
    });
    if (cached) {
      restoreWalletCacheToState(cached, cacheSetters);
      setReady(true);
    } else {
      setReady(false);
      setAgentSolBalance(null);
      setAgentUsdcBalance(null);
    }

    if (!syraAuthenticated) {
      setReady(true);
      return;
    }

    if (Date.now() < walletConnectCooldownUntilRef.current) {
      setReady(true);
      return;
    }

    let cancelled = false;
    const syncWallet = async () => {
      try {
        const res = await agentWalletApi.getOrCreateByWallet(connectedWalletAddress);
        if (cancelled) return;
        const { anonymousId: id, agentAddress: addr, avatarUrl: avatar } = res;
        setAnonymousId(id);
        setAgentAddress(addr);
        setAvatarUrl(avatar || null);
        await hydrateLpWalletFromFields(connection, res, lpSetters);
        if (typeof localStorage !== "undefined") {
          try {
            localStorage.setItem(STORAGE_KEY, id);
          } catch {
            /* ignore */
          }
        }
        let sol: number | null = null;
        let usdc: number | null = null;
        try {
          const bal = await fetchAgentBalanceFromChain(connection, addr);
          sol = bal.solBalance;
          usdc = bal.usdcBalance;
          setAgentSolBalance(sol);
          setAgentUsdcBalance(usdc);
        } catch {
          setAgentSolBalance((prev) => prev);
          setAgentUsdcBalance((prev) => prev);
        }
        writeAgentWalletCache({
          anonymousId: id,
          linkedWallet: connectedWalletAddress,
          chain: "solana",
          agentAddress: addr,
          avatarUrl: avatar ?? null,
          agentSolBalance: sol,
          agentUsdcBalance: usdc,
        });
      } catch (err) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes("429") || /too many requests/i.test(msg)) {
          walletConnectCooldownUntilRef.current = Date.now() + 60_000;
        }
        const cachedFallback = readAgentWalletCache({
          kind: "wallet",
          linkedWallet: connectedWalletAddress,
        });
        if (cachedFallback) {
          setAnonymousId(cachedFallback.anonymousId);
          setAgentAddress(cachedFallback.agentAddress);
          setAvatarUrl(cachedFallback.avatarUrl ?? null);
          setAgentSolBalance(cachedFallback.agentSolBalance);
          setAgentUsdcBalance(cachedFallback.agentUsdcBalance);
          void (async () => {
            try {
              const { solBalance, usdcBalance } = await fetchAgentBalanceFromChain(
                connection,
                cachedFallback.agentAddress,
              );
              setAgentSolBalance(solBalance);
              setAgentUsdcBalance(usdcBalance);
              mergeCachedBalances(cachedFallback.agentAddress, {
                agentSolBalance: solBalance,
                agentUsdcBalance: usdcBalance,
              });
            } catch {
              /* keep restored values */
            }
          })();
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    };

    if (walletConnectFlightRef.current) {
      void walletConnectFlightRef.current.finally(() => {
        if (!cancelled) setReady(true);
      });
      return () => {
        cancelled = true;
      };
    }

    walletConnectFlightRef.current = syncWallet().finally(() => {
      walletConnectFlightRef.current = null;
    });

    return () => {
      cancelled = true;
    };
  }, [syraAuthReady, syraAuthenticated, connectedWalletAddress, connectedChain, connection]);

  useEffect(() => {
    if (connectedWalletAddress) return;
    const stored = typeof localStorage !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    let id = stored?.trim() || null;
    if (!id) {
      id =
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `anon-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
      if (typeof localStorage !== "undefined") {
        try {
          localStorage.setItem(STORAGE_KEY, id);
        } catch {
          // ignore
        }
      }
    }
    if (id) {
      setAnonymousId(id);
      setReady(true);
      initRef.current = true;
      agentWalletApi
        .getOrCreate(id)
        .then(async (res) => {
          const { agentAddress: addr, avatarUrl: avatar } = res;
          setAgentAddress(addr);
          setAvatarUrl(avatar || null);
          await hydrateLpWalletFromFields(connection, res, lpSetters);
          let sol: number | null = null;
          let usdc: number | null = null;
          try {
            const bal = await fetchAgentBalanceFromChain(connection, addr);
            sol = bal.solBalance;
            usdc = bal.usdcBalance;
            setAgentSolBalance(sol);
            setAgentUsdcBalance(usdc);
          } catch {
            setAgentSolBalance(null);
            setAgentUsdcBalance(null);
          }
          writeAgentWalletCache({
            anonymousId: id,
            linkedWallet: null,
            chain: null,
            agentAddress: addr,
            avatarUrl: avatar ?? null,
            agentSolBalance: sol,
            agentUsdcBalance: usdc,
          });
        })
        .catch(() => {
          const cached = readAgentWalletCache({ kind: "guest", anonymousId: id });
          if (cached) {
            setAgentAddress(cached.agentAddress);
            setAvatarUrl(cached.avatarUrl ?? null);
            setAgentSolBalance(cached.agentSolBalance);
            setAgentUsdcBalance(cached.agentUsdcBalance);
            void (async () => {
              try {
                const { solBalance, usdcBalance } = await fetchAgentBalanceFromChain(
                  connection,
                  cached.agentAddress,
                );
                setAgentSolBalance(solBalance);
                setAgentUsdcBalance(usdcBalance);
                mergeCachedBalances(cached.agentAddress, {
                  agentSolBalance: solBalance,
                  agentUsdcBalance: usdcBalance,
                });
              } catch {
                /* keep cached balances */
              }
            })();
          } else {
            setAgentAddress(null);
            setAgentSolBalance(null);
            setAgentUsdcBalance(null);
          }
        });
    } else {
      setReady(false);
      agentWalletApi
        .getOrCreate()
        .then(async (res) => {
          const { anonymousId: newId, agentAddress: addr, avatarUrl: avatar } = res;
          if (typeof localStorage !== "undefined") {
            localStorage.setItem(STORAGE_KEY, newId);
          }
          setAnonymousId(newId);
          setAgentAddress(addr);
          setAvatarUrl(avatar || null);
          await hydrateLpWalletFromFields(connection, res, lpSetters);
          let sol: number | null = null;
          let usdc: number | null = null;
          try {
            const bal = await fetchAgentBalanceFromChain(connection, addr);
            sol = bal.solBalance;
            usdc = bal.usdcBalance;
            setAgentSolBalance(sol);
            setAgentUsdcBalance(usdc);
          } catch {
            setAgentSolBalance(null);
            setAgentUsdcBalance(null);
          }
          writeAgentWalletCache({
            anonymousId: newId,
            linkedWallet: null,
            chain: null,
            agentAddress: addr,
            avatarUrl: avatar ?? null,
            agentSolBalance: sol,
            agentUsdcBalance: usdc,
          });
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
  }, [connectedWalletAddress, connection]);

  const refetchBalance = useCallback(async () => {
    if (!agentAddress) return;
    try {
      const { solBalance: sol, usdcBalance: usdc } = await fetchAgentBalanceFromChain(connection, agentAddress);
      setAgentSolBalance(sol);
      setAgentUsdcBalance(usdc);
      mergeCachedBalances(agentAddress, { agentSolBalance: sol, agentUsdcBalance: usdc });
    } catch {
      setAgentSolBalance((prev) => prev);
      setAgentUsdcBalance((prev) => prev);
    }
  }, [agentAddress, connection]);

  const getAgentWalletBalances = useCallback(async (): Promise<{ usdcBalance: number; solBalance: number } | null> => {
    if (!agentAddress) return null;
    try {
      return await fetchAgentBalanceFromChain(connection, agentAddress);
    } catch {
      return null;
    }
  }, [agentAddress, connection]);

  const refetchLpBalance = useCallback(async () => {
    if (!lpAgentAddress) return;
    try {
      const { solBalance: sol, usdcBalance: usdc } = await fetchAgentBalanceFromChain(connection, lpAgentAddress);
      setLpAgentSolBalance(sol);
      setLpAgentUsdcBalance(usdc);
    } catch {
      setLpAgentSolBalance((prev) => prev);
      setLpAgentUsdcBalance((prev) => prev);
    }
  }, [lpAgentAddress, connection]);

  useEffect(() => {
    if (!anonymousId) {
      setLpReady(false);
      setLpAnonymousId(null);
      setLpAgentAddress(null);
      setLpAgentSolBalance(null);
      setLpAgentUsdcBalance(null);
      return;
    }

    if (lpAnonymousId && lpAgentAddress) {
      setLpReady(true);
      return;
    }

    let cancelled = false;
    const loadLpWallet = async () => {
      try {
        const res =
          connectedWalletAddress && syraAuthenticated
            ? await agentWalletApi.getOrCreateLpByWallet(connectedWalletAddress)
            : await agentWalletApi.getOrCreateLp(anonymousId);
        if (cancelled) return;
        setLpAnonymousId(res.anonymousId);
        setLpAgentAddress(res.agentAddress);
        try {
          const bal = await fetchAgentBalanceFromChain(connection, res.agentAddress);
          if (!cancelled) {
            setLpAgentSolBalance(bal.solBalance);
            setLpAgentUsdcBalance(bal.usdcBalance);
          }
        } catch {
          if (!cancelled) {
            setLpAgentSolBalance(null);
            setLpAgentUsdcBalance(null);
          }
        }
      } catch {
        if (!cancelled) {
          setLpAnonymousId(null);
          setLpAgentAddress(null);
          setLpAgentSolBalance(null);
          setLpAgentUsdcBalance(null);
        }
      } finally {
        if (!cancelled) setLpReady(true);
      }
    };

    setLpReady(false);
    void loadLpWallet();
    return () => {
      cancelled = true;
    };
  }, [anonymousId, connectedWalletAddress, syraAuthenticated, connection, lpAnonymousId, lpAgentAddress]);

  useEffect(() => {
    if (!lpAgentAddress) return;
    let cancelled = false;
    const pollMs = 30000;
    function fetchBalance() {
      fetchAgentBalanceFromChain(connection, lpAgentAddress!)
        .then(({ solBalance: sol, usdcBalance: usdc }) => {
          if (!cancelled) {
            setLpAgentSolBalance(sol);
            setLpAgentUsdcBalance(usdc);
          }
        })
        .catch(() => {
          /* keep prior */
        });
    }
    fetchBalance();
    const interval = setInterval(fetchBalance, pollMs);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [lpAgentAddress, connection]);

  useEffect(() => {
    if (!agentAddress) return;
    let cancelled = false;
    const pollMs = 30000;
    function fetchBalance() {
      fetchAgentBalanceFromChain(connection, agentAddress!)
        .then(({ solBalance: sol, usdcBalance: usdc }) => {
          if (!cancelled) {
            setAgentSolBalance(sol);
            setAgentUsdcBalance(usdc);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setAgentSolBalance((prev) => prev);
            setAgentUsdcBalance((prev) => prev);
          }
        });
    }
    fetchBalance();
    const interval = setInterval(fetchBalance, pollMs);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [agentAddress, connection]);

  const reportDebit = useCallback(
    (amountUsd: number) => {
      if (debitTimeoutRef.current) clearTimeout(debitTimeoutRef.current);
      refetchTimeoutsRef.current.forEach((t) => clearTimeout(t));
      refetchTimeoutsRef.current = [];
      setLastDebitUsd(amountUsd);
      setAgentUsdcBalance((prev) =>
        prev != null ? Math.max(0, prev - amountUsd) : null
      );
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

  const reportNativeDebit = useCallback(
    (amountSol: number) => {
      if (!Number.isFinite(amountSol) || amountSol <= 0) return;
      refetchTimeoutsRef.current.forEach((t) => clearTimeout(t));
      refetchTimeoutsRef.current = [];
      setAgentSolBalance((prev) => (prev != null ? Math.max(0, prev - amountSol) : null));
      void refetchBalance();
      refetchTimeoutsRef.current = [
        setTimeout(refetchBalance, 1500),
        setTimeout(refetchBalance, 4000),
      ];
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

  const lpAgentShortAddress = lpAgentAddress
    ? `${lpAgentAddress.slice(0, 4)}...${lpAgentAddress.slice(-4)}`
    : null;

  const connectedWalletShort = connectedWalletAddress
    ? `${connectedWalletAddress.slice(0, 4)}...${connectedWalletAddress.slice(-4)}`
    : null;

  const updateAvatarUrl = useCallback((newAvatarUrl: string | null) => {
    setAvatarUrl(newAvatarUrl);
    if (typeof localStorage === "undefined" || !agentAddress) return;
    try {
      const raw = localStorage.getItem(AGENT_WALLET_CACHE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as AgentWalletCachePayload;
      if (parsed?.v !== 1 || parsed.agentAddress !== agentAddress) return;
      parsed.avatarUrl = newAvatarUrl;
      parsed.updatedAt = Date.now();
      localStorage.setItem(AGENT_WALLET_CACHE_KEY, JSON.stringify(parsed));
    } catch {
      /* ignore */
    }
  }, [agentAddress]);

  const value = useMemo<AgentWalletState>(
    () => ({
      ready,
      anonymousId,
      agentAddress,
      agentShortAddress,
      agentSolBalance,
      agentUsdcBalance,
      avatarUrl,
      lpReady,
      lpAnonymousId,
      lpAgentAddress,
      lpAgentShortAddress,
      lpAgentSolBalance,
      lpAgentUsdcBalance,
      connectedWalletAddress,
      connectedWalletShort,
      connectedChain,
      lastDebitUsd,
      refetchBalance,
      refetchLpBalance,
      getAgentWalletBalances,
      reportDebit,
      reportNativeDebit,
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
      lpReady,
      lpAnonymousId,
      lpAgentAddress,
      lpAgentShortAddress,
      lpAgentSolBalance,
      lpAgentUsdcBalance,
      connectedWalletAddress,
      connectedWalletShort,
      connectedChain,
      lastDebitUsd,
      refetchBalance,
      refetchLpBalance,
      getAgentWalletBalances,
      reportDebit,
      reportNativeDebit,
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
