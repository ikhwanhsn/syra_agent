import {
  type FC,
  type ReactNode,
  useMemo,
  useCallback,
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";
import { PrivyProvider, usePrivy, useLoginWithSiws, useLogout } from "@privy-io/react-auth";
import {
  useWallets as usePrivySolanaWallets,
  useSignTransaction,
  useSignMessage,
} from "@privy-io/react-auth/solana";
import { toSolanaWalletConnectors } from "@privy-io/react-auth/solana";
import {
  LAMPORTS_PER_SOL,
  PublicKey,
  Transaction,
  VersionedTransaction,
} from "@solana/web3.js";
import { Connection } from "@solana/web3.js";
import { toast } from "@/hooks/use-toast";

/** Curated Privy Solana wallet options only. */
const POPULAR_SOLANA_WALLET_LIST: string[] = [
  "phantom",
  "solflare",
  "backpack",
];

/** Login modal: only email and wallet (no social logins). */
const MINIMAL_LOGIN_OPTIONS = { loginMethods: ["email", "wallet"] as const };

const USDC_MINT = new PublicKey(
  "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
);
const MAINNET_RPC =
  import.meta.env.VITE_SOLANA_RPC_URL || "https://rpc.ankr.com/solana";

export const connection = new Connection(MAINNET_RPC);

export interface WalletContextState {
  connection: Connection;
  connected: boolean;
  connecting: boolean;
  address: string | null;
  shortAddress: string | null;
  solBalance: number | null;
  usdcBalance: number | null;
  network: string;
  connect: () => Promise<void>;
  connectForChain: (chain: "solana") => Promise<void>;
  disconnect: () => Promise<void>;
  signTransaction: (transaction: unknown) => Promise<VersionedTransaction>;
  /** Sign and send a legacy Transaction (e.g. for FuelAgentModal). Returns signature. */
  sendTransaction: (
    transaction: Transaction,
    options?: { skipPreflight?: boolean; maxRetries?: number }
  ) => Promise<string>;
  signMessage: (message: Uint8Array) => Promise<Uint8Array>;
  publicKey: PublicKey | null;
  connectSolana: () => Promise<void>;
  openLoginModal: () => void;
  isPrivyMounted: boolean;
  requestConnect: (option: "email" | "solana") => void;
  /** Active chain when connected (Solana only). */
  effectiveChain: "solana" | null;
  /** One-shot refresh of linked Solana wallet SOL + USDC. */
  refreshSolanaBalances: () => Promise<void>;
}

const WalletContext = createContext<WalletContextState | null>(null);

export function useWalletContext(): WalletContextState {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWalletContext must be used within WalletContextProvider");
  }
  return context;
}

function signatureToBase64(sig: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < sig.length; i++)
    binary += String.fromCharCode(sig[i]);
  return btoa(binary);
}

const SIWS_403_ORIGIN_KEY = "privy_siws_403_origin";
function getSiws403Origin(): string | null {
  try {
    return typeof sessionStorage !== "undefined"
      ? sessionStorage.getItem(SIWS_403_ORIGIN_KEY)
      : null;
  } catch {
    return null;
  }
}
function setSiws403Origin(origin: string): void {
  try {
    if (typeof sessionStorage !== "undefined")
      sessionStorage.setItem(SIWS_403_ORIGIN_KEY, origin);
  } catch {
    /* sessionStorage unavailable */
  }
}

const PRIVY_LOCAL_KEYS = [
  "privy:token",
  "privy:refresh_token",
  "privy:pat",
  "privy:id_token",
  "privy:caid",
  "privy:state_code",
  "privy:code_verifier",
  "privy:headless_oauth",
  "privy:oauth_disable_signup",
  "privy:connections",
  "WALLETCONNECT_DEEPLINK_CHOICE",
];
const PRIVY_COOKIE_NAMES = ["privy-token", "privy-refresh-token", "privy-id-token", "privy-session"];

function clearPrivyIndexedDB(): void {
  try {
    if (typeof indexedDB === "undefined" || !indexedDB.databases) return;
    indexedDB.databases?.().then((dbs) => {
      dbs.forEach((db) => {
        if (db.name && (db.name.toLowerCase().includes("privy") || db.name.toLowerCase().includes("walletconnect"))) {
          indexedDB.deleteDatabase(db.name);
        }
      });
    }).catch(() => undefined);
  } catch {
    /* indexedDB unavailable */
  }
}

function clearPrivySessionStorage(): void {
  try {
    if (typeof localStorage !== "undefined") {
      PRIVY_LOCAL_KEYS.forEach((k) => localStorage.removeItem(k));
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.toLowerCase().includes("privy")) localStorage.removeItem(key);
      });
    }
    if (typeof sessionStorage !== "undefined") {
      const keys = Object.keys(sessionStorage);
      keys.forEach((key) => {
        if (key.toLowerCase().includes("privy")) sessionStorage.removeItem(key);
      });
    }
    if (typeof document !== "undefined" && document.cookie) {
      const hostname = window.location.hostname;
      const path = "/";
      const expire = "expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0";
      PRIVY_COOKIE_NAMES.forEach((name) => {
        document.cookie = `${name}=; path=${path}; ${expire}`;
        document.cookie = `${name}=; path=${path}; domain=${hostname}; ${expire}`;
        if (hostname.indexOf(".") > 0)
          document.cookie = `${name}=; path=${path}; domain=.${hostname}; ${expire}`;
      });
    }
    clearPrivyIndexedDB();
  } catch {
    // ignore
  }
}

const DISCONNECTED_BY_USER_KEY = "syra_wallet_disconnected_by_user";
function setDisconnectedByUserFlag(): void {
  try {
    if (typeof sessionStorage !== "undefined")
      sessionStorage.setItem(DISCONNECTED_BY_USER_KEY, "1");
  } catch {
    /* sessionStorage unavailable */
  }
}
function clearDisconnectedByUserFlag(): void {
  try {
    if (typeof sessionStorage !== "undefined")
      sessionStorage.removeItem(DISCONNECTED_BY_USER_KEY);
  } catch {
    /* sessionStorage unavailable */
  }
}
function getDisconnectedByUserFlag(): boolean {
  try {
    return typeof sessionStorage !== "undefined" && sessionStorage.getItem(DISCONNECTED_BY_USER_KEY) === "1";
  } catch {
    return false;
  }
}

function hasPrivyTokenInStorage(): boolean {
  try {
    if (typeof localStorage === "undefined") return false;
    if (localStorage.getItem("privy:token")) return true;
    const keys = Object.keys(localStorage);
    for (const k of keys) {
      if (k.toLowerCase().includes("privy") && localStorage.getItem(k)) return true;
    }
    return false;
  } catch {
    return false;
  }
}

type ConnectOption = "email" | "solana";

const WalletContextInner: FC<{
  children: ReactNode;
  pendingConnectOption: ConnectOption | null;
  setPendingConnectOption: (v: ConnectOption | null) => void;
  noPrivyTokenOnLoad: boolean;
}> = ({
  children,
  pendingConnectOption,
  setPendingConnectOption,
  noPrivyTokenOnLoad,
}) => {
  const { ready: privyReady, authenticated, login, connectWallet } =
    usePrivy();
  const { logout } = useLogout({
    onSuccess: () => {
      clearPrivySessionStorage();
      setTimeout(clearPrivySessionStorage, 50);
      setTimeout(clearPrivySessionStorage, 200);
    },
  });
  const { generateSiwsMessage, loginWithSiws } = useLoginWithSiws();
  const { wallets: solanaWallets, ready: solanaWalletsReady } =
    usePrivySolanaWallets();
  const { signTransaction: privySignTransaction } = useSignTransaction();
  const { signMessage: privySignMessage } = useSignMessage();

  const siwsAttemptedForRef = useRef<string | null>(null);
  const userRequestedWalletConnectRef = useRef(false);
  const justDisconnectedRef = useRef(false);
  const loginModalJustOpenedRef = useRef(false);

  const markUserInitiatedConnect = useCallback(() => {
    userRequestedWalletConnectRef.current = true;
    siwsAttemptedForRef.current = null;
  }, []);

  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [usdcBalance, setUsdcBalance] = useState<number | null>(null);
  const [forceDisconnected, setForceDisconnected] = useState(false);
  const [noTokenOverriddenByConnect, setNoTokenOverriddenByConnect] = useState(false);

  const solanaWallet = solanaWallets?.[0] ?? null;
  const address = solanaWallet?.address ?? null;
  const publicKey = address ? new PublicKey(address) : null;
  const connected = !!(authenticated && solanaWallet);
  const connecting =
    !privyReady || (authenticated && !solanaWalletsReady);

  const shortAddress = address
    ? `${address.slice(0, 4)}...${address.slice(-4)}`
    : null;

  const didApplyDisconnectOnMountRef = useRef(false);
  useEffect(() => {
    if (!privyReady || didApplyDisconnectOnMountRef.current) return;
    const shouldForceLogout = getDisconnectedByUserFlag() || noPrivyTokenOnLoad;
    if (!shouldForceLogout) return;
    didApplyDisconnectOnMountRef.current = true;
    setForceDisconnected(true);
    if (getDisconnectedByUserFlag()) clearDisconnectedByUserFlag();
    logout()
      .then(() => {
        clearPrivySessionStorage();
        setTimeout(clearPrivySessionStorage, 50);
        setTimeout(clearPrivySessionStorage, 200);
      })
      .catch(() => {});
  }, [privyReady, logout, noPrivyTokenOnLoad]);

  useEffect(() => {
    const noWallets = !solanaWallets || solanaWallets.length === 0;
    if (!authenticated && noWallets) {
      setForceDisconnected(false);
    } else if (authenticated && !noWallets) {
      setForceDisconnected(false);
      setNoTokenOverriddenByConnect(true);
      clearDisconnectedByUserFlag();
    }
  }, [authenticated, solanaWallets]);

  const refreshSolanaBalances = useCallback(async () => {
    if (!publicKey || !connected) {
      setSolBalance(null);
      setUsdcBalance(null);
      return;
    }
    try {
      const balance = await connection.getBalance(publicKey, "confirmed");
      setSolBalance(balance / LAMPORTS_PER_SOL);
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKey, {
        mint: USDC_MINT,
      });
      if (tokenAccounts.value.length > 0) {
        const total = tokenAccounts.value.reduce(
          (sum, acc) =>
            sum + (Number(acc.account.data.parsed.info.tokenAmount.uiAmount) || 0),
          0,
        );
        setUsdcBalance(total);
      } else setUsdcBalance(0);
    } catch {
      setUsdcBalance(0);
    }
  }, [publicKey, connected]);

  useEffect(() => {
    void refreshSolanaBalances();
    if (!publicKey || !connected) return;
    const interval = setInterval(() => {
      void refreshSolanaBalances();
    }, 30000);
    return () => clearInterval(interval);
  }, [publicKey, connected, refreshSolanaBalances]);

  /** After explicit Connect wallet, notify Syra auth (one session sign-in if needed). */
  useEffect(() => {
    if (!authenticated || !address) return;
    if (!userRequestedWalletConnectRef.current) return;
    userRequestedWalletConnectRef.current = false;
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("syra-wallet-connected"));
    }
  }, [authenticated, address]);

  useEffect(() => {
    const wallet = solanaWallets?.[0];
    if (!privyReady || authenticated || !wallet?.address) return;
    // Never auto-prompt wallet signature on page load — only after Connect wallet.
    if (!userRequestedWalletConnectRef.current) return;
    if (justDisconnectedRef.current) return;
    if (loginModalJustOpenedRef.current) return;
    if (siwsAttemptedForRef.current === wallet.address) return;
    if (forceDisconnected || noPrivyTokenOnLoad || didApplyDisconnectOnMountRef.current) return;
    if (!hasPrivyTokenInStorage()) return;
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    if (origin && getSiws403Origin() === origin) return;
    siwsAttemptedForRef.current = wallet.address;

    let cancelled = false;
    (async () => {
      try {
        const message = await generateSiwsMessage({ address: wallet.address });
        const encodedMessage = new TextEncoder().encode(message);
        const result = await privySignMessage({
          message: encodedMessage,
          wallet,
        });
        const rawSig = result?.signature;
        const signatureBase64 =
          typeof rawSig === "string"
            ? rawSig
            : rawSig instanceof Uint8Array
              ? signatureToBase64(rawSig)
              : ArrayBuffer.isView(rawSig)
                ? signatureToBase64(
                    new Uint8Array(
                      (rawSig as ArrayBufferView).buffer,
                      (rawSig as ArrayBufferView).byteOffset,
                      (rawSig as ArrayBufferView).byteLength
                    )
                  )
                : Array.isArray(rawSig)
                  ? signatureToBase64(new Uint8Array(rawSig))
                  : "";
        if (cancelled || !signatureBase64) return;
        await loginWithSiws({ message, signature: signatureBase64 });
      } catch (e: unknown) {
        if (!cancelled) {
          siwsAttemptedForRef.current = null;
          const msg =
            e &&
            typeof e === "object" &&
            "message" in e
              ? String((e as { message: unknown }).message)
              : String(e);
          const is403 =
            msg.includes("403") ||
            msg.includes("not allowed") ||
            (e &&
              typeof e === "object" &&
              "status" in e &&
              (e as { status: number }).status === 403);
          if (is403 && typeof window !== "undefined") {
            const currentOrigin = window.location.origin;
            setSiws403Origin(currentOrigin);
            toast({
              title: "Solana login blocked (403)",
              description: `Add "${currentOrigin}" in Privy Dashboard → Configuration → Clients → your client → Allowed origins. Or sign in with email first, then connect your Solana wallet.`,
              variant: "destructive",
            });
          } else {
            toast({
              title: "Solana sign-in failed",
              description:
                msg ||
                "Try logging in with email first, then connect your Solana wallet.",
              variant: "destructive",
            });
          }
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    privyReady,
    authenticated,
    solanaWallets,
    forceDisconnected,
    noPrivyTokenOnLoad,
    generateSiwsMessage,
    loginWithSiws,
    privySignMessage,
  ]);

  const connect = useCallback(async () => {
    if (!privyReady) return;
    markUserInitiatedConnect();
    if (!authenticated) {
      login(MINIMAL_LOGIN_OPTIONS);
      return;
    }
    connectWallet();
  }, [privyReady, authenticated, login, connectWallet, markUserInitiatedConnect]);

  const openLoginModal = useCallback(() => {
    if (privyReady) {
      markUserInitiatedConnect();
      loginModalJustOpenedRef.current = true;
      login(MINIMAL_LOGIN_OPTIONS);
      setTimeout(() => {
        loginModalJustOpenedRef.current = false;
      }, 25000);
    }
  }, [privyReady, login, markUserInitiatedConnect]);

  const connectForChain = useCallback(
    async (_chain: "solana") => {
      if (!privyReady) return;
      markUserInitiatedConnect();
      if (!authenticated) {
        loginModalJustOpenedRef.current = true;
        login(MINIMAL_LOGIN_OPTIONS);
        setTimeout(() => {
          loginModalJustOpenedRef.current = false;
        }, 25000);
        return;
      }
      if (solanaWallets?.[0]) return;
      connectWallet({
        walletList: [...POPULAR_SOLANA_WALLET_LIST],
        walletChainType: "solana-only",
      });
    },
    [privyReady, authenticated, solanaWallets, login, connectWallet, markUserInitiatedConnect]
  );

  useEffect(() => {
    if (!pendingConnectOption || !privyReady) return;
    const option = pendingConnectOption;
    setPendingConnectOption(null);
    markUserInitiatedConnect();
    if (option === "email") {
      login(MINIMAL_LOGIN_OPTIONS);
      return;
    }
    connectForChain("solana");
  }, [pendingConnectOption, privyReady, login, connectForChain, setPendingConnectOption, markUserInitiatedConnect]);

  const disconnect = useCallback(async () => {
    justDisconnectedRef.current = true;
    userRequestedWalletConnectRef.current = false;
    siwsAttemptedForRef.current = null;
    setSolBalance(null);
    setUsdcBalance(null);
    setForceDisconnected(true);
    setDisconnectedByUserFlag();
    try {
      await logout();
      clearPrivySessionStorage();
      setTimeout(clearPrivySessionStorage, 100);
    } catch (e) {
      setForceDisconnected(false);
      throw e;
    } finally {
      setTimeout(() => {
        justDisconnectedRef.current = false;
      }, 3000);
    }
  }, [logout]);

  const connectSolana = useCallback(async () => {
    markUserInitiatedConnect();
    if (!authenticated) {
      login(MINIMAL_LOGIN_OPTIONS);
      return;
    }
    connectWallet({
      walletList: [...POPULAR_SOLANA_WALLET_LIST],
      walletChainType: "solana-only",
    });
  }, [authenticated, login, connectWallet, markUserInitiatedConnect]);

  const signTransaction = useCallback(
    async (transaction: unknown) => {
      if (!solanaWallet) throw new Error("No Solana wallet connected");
      const tx =
        transaction &&
        typeof (transaction as { serialize: () => Uint8Array }).serialize ===
          "function"
          ? (transaction as { serialize: () => Uint8Array }).serialize()
          : new Uint8Array(transaction as ArrayBuffer);
      const { signedTransaction } = await privySignTransaction({
        transaction: tx,
        wallet: solanaWallet,
      });
      return VersionedTransaction.deserialize(signedTransaction);
    },
    [solanaWallet, privySignTransaction]
  );

  const sendTransaction = useCallback(
    async (
      transaction: Transaction,
      options?: { skipPreflight?: boolean; maxRetries?: number }
    ) => {
      if (!solanaWallet || !publicKey) throw new Error("No Solana wallet connected");
      const { blockhash } = await connection.getLatestBlockhash("finalized");
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;
      const serialized = transaction.serialize({
        requireAllSignatures: false,
        verifySignatures: false,
      });
      const { signedTransaction } = await privySignTransaction({
        transaction: serialized,
        wallet: solanaWallet,
      });
      const sig = await connection.sendRawTransaction(
        new Uint8Array(signedTransaction),
        {
          skipPreflight: options?.skipPreflight ?? false,
          maxRetries: options?.maxRetries ?? 3,
          preflightCommitment: "finalized",
        }
      );
      return sig;
    },
    [solanaWallet, publicKey, privySignTransaction, connection]
  );

  const signMessage = useCallback(
    async (message: Uint8Array) => {
      if (!solanaWallet) throw new Error("No Solana wallet connected");
      const result = await privySignMessage({ message, wallet: solanaWallet });
      return typeof result === "object" && result?.signature
        ? new Uint8Array(result.signature as ArrayBuffer)
        : new Uint8Array(0);
    },
    [solanaWallet, privySignMessage]
  );

  const effectivelyDisconnected = forceDisconnected || (noPrivyTokenOnLoad && !noTokenOverriddenByConnect);
  const effectiveChain: "solana" | null =
    effectivelyDisconnected || !(authenticated && solanaWallets?.[0]) ? null : "solana";

  const contextValue: WalletContextState = useMemo(
    () => ({
      connection,
      connected: effectivelyDisconnected ? false : connected,
      connecting: effectivelyDisconnected ? false : connecting,
      address: effectivelyDisconnected ? null : address,
      shortAddress: effectivelyDisconnected ? null : shortAddress,
      solBalance,
      usdcBalance,
      network: "Solana Mainnet",
      connect,
      connectForChain,
      disconnect,
      signTransaction,
      sendTransaction,
      signMessage,
      publicKey: effectivelyDisconnected ? null : publicKey,
      connectSolana,
      openLoginModal,
      isPrivyMounted: true,
      requestConnect: () => {},
      effectiveChain,
      refreshSolanaBalances,
    }),
    [
      forceDisconnected,
      noPrivyTokenOnLoad,
      noTokenOverriddenByConnect,
      effectivelyDisconnected,
      connection,
      connected,
      connecting,
      address,
      shortAddress,
      solBalance,
      usdcBalance,
      connect,
      connectForChain,
      disconnect,
      signTransaction,
      sendTransaction,
      signMessage,
      publicKey,
      connectSolana,
      openLoginModal,
      refreshSolanaBalances,
      effectiveChain,
    ]
  );

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  );
};

const PRIVY_APP_ID = import.meta.env.VITE_PRIVY_APP_ID || "";
const PRIVY_CLIENT_ID = import.meta.env.VITE_PRIVY_CLIENT_ID || "";

const FALLBACK_WALLET_STATE: WalletContextState = {
  connection,
  connected: false,
  connecting: false,
  address: null,
  shortAddress: null,
  solBalance: null,
  usdcBalance: null,
  network: "Solana Mainnet",
  connect: async () => {},
  connectForChain: async () => {},
  disconnect: async () => {},
  signTransaction: async () => {
    throw new Error("Wallet not configured");
  },
  sendTransaction: async () => {
    throw new Error("Wallet not configured");
  },
  signMessage: async () => {
    throw new Error("Wallet not configured");
  },
  publicKey: null,
  connectSolana: async () => {},
  openLoginModal: () => {},
  isPrivyMounted: false,
  requestConnect: () => {},
  effectiveChain: null,
  refreshSolanaBalances: async () => {},
};

export const WalletContextProvider: FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [noPrivyTokenOnLoad] = useState(
    () => typeof window !== "undefined" && !hasPrivyTokenInStorage()
  );
  const [mountPrivy] = useState(() => {
    if (typeof window !== "undefined" && getDisconnectedByUserFlag()) {
      clearPrivySessionStorage();
      clearDisconnectedByUserFlag();
    }
    return !!PRIVY_APP_ID?.trim();
  });
  const [pendingConnectOption, setPendingConnectOption] =
    useState<ConnectOption | null>(null);

  const requestConnectWhenDeferred = useCallback((option: ConnectOption) => {
    setPendingConnectOption(option);
  }, []);

  if (!PRIVY_APP_ID?.trim()) {
    return (
      <WalletContext.Provider value={FALLBACK_WALLET_STATE}>
        {children}
      </WalletContext.Provider>
    );
  }

  if (!mountPrivy) {
    return (
      <WalletContext.Provider
        value={{
          ...FALLBACK_WALLET_STATE,
          isPrivyMounted: false,
          requestConnect: requestConnectWhenDeferred,
        }}
      >
        {children}
      </WalletContext.Provider>
    );
  }

  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      {...(PRIVY_CLIENT_ID ? { clientId: PRIVY_CLIENT_ID } : {})}
      config={{
        appearance: {
          walletChainType: "solana-only",
          walletList: [...POPULAR_SOLANA_WALLET_LIST],
        },
        embeddedWallets: {
          solana: { createOnLogin: "users-without-wallets" },
        },
        externalWallets: {
          solana: {
            connectors: toSolanaWalletConnectors({ shouldAutoConnect: false }),
          },
        },
      }}
    >
      <WalletContextInner
        pendingConnectOption={pendingConnectOption}
        setPendingConnectOption={setPendingConnectOption}
        noPrivyTokenOnLoad={noPrivyTokenOnLoad}
      >
        {children}
      </WalletContextInner>
    </PrivyProvider>
  );
};

export default WalletContextProvider;
