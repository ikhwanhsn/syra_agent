import {
  createContext,
  useContext,
  useMemo,
  useState,
  useEffect,
  useRef,
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
  /** Connected user wallet address (Solana), if wallet is connected */
  connectedWalletAddress: string | null;
  connectedWalletShort: string | null;
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
  const initRef = useRef(false);

  // When user connects wallet: get or create agent wallet by wallet address (check database)
  useEffect(() => {
    if (connectedWalletAddress) {
      setReady(false);
      agentWalletApi
        .getOrCreateByWallet(connectedWalletAddress)
        .then(({ anonymousId: id, agentAddress: addr }) => {
          setAnonymousId(id);
          setAgentAddress(addr);
        })
        .catch(() => {
          setAnonymousId(null);
          setAgentAddress(null);
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
        .then(({ agentAddress: addr }) => {
          setAnonymousId(id);
          setAgentAddress(addr);
        })
        .catch(() => {
          setAnonymousId(null);
          setAgentAddress(null);
        })
        .finally(() => {
          initRef.current = true;
          setReady(true);
        });
    } else {
      setReady(false);
      agentWalletApi
        .getOrCreate()
        .then(({ anonymousId: newId, agentAddress: addr }) => {
          if (typeof localStorage !== "undefined") {
            localStorage.setItem(STORAGE_KEY, newId);
          }
          setAnonymousId(newId);
          setAgentAddress(addr);
        })
        .catch(() => {
          setAnonymousId(null);
          setAgentAddress(null);
        })
        .finally(() => {
          initRef.current = true;
          setReady(true);
        });
    }
  }, [connectedWalletAddress]);

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

  const agentShortAddress = agentAddress
    ? `${agentAddress.slice(0, 4)}...${agentAddress.slice(-4)}`
    : null;

  const connectedWalletShort = connectedWalletAddress
    ? `${connectedWalletAddress.slice(0, 4)}...${connectedWalletAddress.slice(-4)}`
    : null;

  const value = useMemo<AgentWalletState>(
    () => ({
      ready,
      anonymousId,
      agentAddress,
      agentShortAddress,
      agentSolBalance,
      agentUsdcBalance,
      connectedWalletAddress,
      connectedWalletShort,
    }),
    [
      ready,
      anonymousId,
      agentAddress,
      agentShortAddress,
      agentSolBalance,
      agentUsdcBalance,
      connectedWalletAddress,
      connectedWalletShort,
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
