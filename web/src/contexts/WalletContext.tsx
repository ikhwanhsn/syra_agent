import {
  type FC,
  type ReactNode,
  createContext,
  useContext,
  useState,
  useCallback,
  lazy,
  Suspense,
} from "react";
import {
  PublicKey,
  Transaction,
  VersionedTransaction,
} from "@solana/web3.js";
import { Connection } from "@solana/web3.js";
import { env } from "@/lib/env";
import { createSolanaConnection, getPrimarySolanaRpcUrl } from "@/lib/solanaRpc";

/** Curated Privy Solana wallet options only. */
export const POPULAR_SOLANA_WALLET_LIST: string[] = [
  "phantom",
  "solflare",
  "backpack",
];

/** Login modal: only email and wallet (no social logins). */
export const MINIMAL_LOGIN_OPTIONS = { loginMethods: ["email", "wallet"] as const };

export const USDC_MINT = new PublicKey(
  "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
);
export const connection = createSolanaConnection(getPrimarySolanaRpcUrl());

export type ConnectOption = "email" | "solana";

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
  /** Sign and send multiple legacy transactions in one wallet approval. */
  sendAllTransactions: (
    transactions: Transaction[],
    options?: { skipPreflight?: boolean; maxRetries?: number }
  ) => Promise<string[]>;
  signMessage: (message: Uint8Array) => Promise<Uint8Array>;
  publicKey: PublicKey | null;
  connectSolana: () => Promise<void>;
  openLoginModal: () => void;
  isPrivyMounted: boolean;
  /** True while Privy chunk is loading / SDK not ready after mount requested. */
  privyBooting: boolean;
  requestConnect: (option: ConnectOption) => void;
  /** Active chain when connected (Solana only). */
  effectiveChain: "solana" | null;
  /** One-shot refresh of linked Solana wallet SOL + USDC. */
  refreshSolanaBalances: () => Promise<void>;
}

export const WalletContext = createContext<WalletContextState | null>(null);

export function useWalletContext(): WalletContextState {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWalletContext must be used within WalletContextProvider");
  }
  return context;
}

export function signatureToBase64(sig: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < sig.length; i++)
    binary += String.fromCharCode(sig[i]);
  return btoa(binary);
}

/** Privy wallets return ed25519 signatures as Uint8Array, ArrayBuffer view, or base64 string. */
export function privySignMessageResultToBytes(result: unknown): Uint8Array {
  if (!result || typeof result !== "object") return new Uint8Array(0);
  const raw =
    "signature" in result
      ? (result as { signature?: unknown }).signature
      : result;
  if (!raw) return new Uint8Array(0);
  if (raw instanceof Uint8Array) return raw;
  if (typeof raw === "string") {
    try {
      const binary = atob(raw);
      return Uint8Array.from(binary, (c) => c.charCodeAt(0));
    } catch {
      return new Uint8Array(0);
    }
  }
  if (ArrayBuffer.isView(raw)) {
    return new Uint8Array(raw.buffer, raw.byteOffset, raw.byteLength);
  }
  if (Array.isArray(raw)) {
    return new Uint8Array(raw);
  }
  return new Uint8Array(0);
}

export const SIWS_403_ORIGIN_KEY = "privy_siws_403_origin";
export function getSiws403Origin(): string | null {
  try {
    return typeof sessionStorage !== "undefined"
      ? sessionStorage.getItem(SIWS_403_ORIGIN_KEY)
      : null;
  } catch {
    return null;
  }
}
export function setSiws403Origin(origin: string): void {
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

export function clearPrivySessionStorage(): void {
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
export function setDisconnectedByUserFlag(): void {
  try {
    if (typeof sessionStorage !== "undefined")
      sessionStorage.setItem(DISCONNECTED_BY_USER_KEY, "1");
  } catch {
    /* sessionStorage unavailable */
  }
}
export function clearDisconnectedByUserFlag(): void {
  try {
    if (typeof sessionStorage !== "undefined")
      sessionStorage.removeItem(DISCONNECTED_BY_USER_KEY);
  } catch {
    /* sessionStorage unavailable */
  }
}
export function getDisconnectedByUserFlag(): boolean {
  try {
    return typeof sessionStorage !== "undefined" && sessionStorage.getItem(DISCONNECTED_BY_USER_KEY) === "1";
  } catch {
    return false;
  }
}

export function hasPrivyTokenInStorage(): boolean {
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

const PRIVY_APP_ID = env.privyAppId ?? "";

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
  sendAllTransactions: async () => {
    throw new Error("Wallet not configured");
  },
  signMessage: async () => {
    throw new Error("Wallet not configured");
  },
  publicKey: null,
  connectSolana: async () => {},
  openLoginModal: () => {},
  isPrivyMounted: false,
  privyBooting: false,
  requestConnect: () => {},
  effectiveChain: null,
  refreshSolanaBalances: async () => {},
};

const PrivyWalletTree = lazy(() => import("./WalletContextPrivy"));

export type PrivyWalletTreeProps = {
  children: ReactNode;
  pendingConnectOption: ConnectOption | null;
  setPendingConnectOption: (v: ConnectOption | null) => void;
  noPrivyTokenOnLoad: boolean;
};

export const WalletContextProvider: FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [noPrivyTokenOnLoad] = useState(
    () => typeof window !== "undefined" && !hasPrivyTokenInStorage()
  );
  const [mountPrivy, setMountPrivy] = useState(() => {
    if (typeof window !== "undefined" && getDisconnectedByUserFlag()) {
      clearPrivySessionStorage();
      clearDisconnectedByUserFlag();
    }
    // Defer SDK until Connect, unless a Privy session already exists.
    return Boolean(PRIVY_APP_ID?.trim()) && hasPrivyTokenInStorage();
  });
  const [pendingConnectOption, setPendingConnectOption] =
    useState<ConnectOption | null>(null);

  const mountAndRequest = useCallback((option: ConnectOption) => {
    setPendingConnectOption(option);
    setMountPrivy(true);
  }, []);

  const requestConnectWhenDeferred = useCallback(
    (option: ConnectOption) => {
      mountAndRequest(option);
    },
    [mountAndRequest]
  );

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
          privyBooting: false,
          requestConnect: requestConnectWhenDeferred,
          openLoginModal: () => mountAndRequest("email"),
          connect: async () => {
            mountAndRequest("solana");
          },
          connectForChain: async () => {
            mountAndRequest("solana");
          },
          connectSolana: async () => {
            mountAndRequest("solana");
          },
        }}
      >
        {children}
      </WalletContext.Provider>
    );
  }

  return (
    <Suspense
      fallback={
        <WalletContext.Provider
          value={{
            ...FALLBACK_WALLET_STATE,
            isPrivyMounted: false,
            privyBooting: true,
            requestConnect: requestConnectWhenDeferred,
            openLoginModal: () => mountAndRequest("email"),
            connect: async () => {
              mountAndRequest("solana");
            },
            connectForChain: async () => {
              mountAndRequest("solana");
            },
            connectSolana: async () => {
              mountAndRequest("solana");
            },
          }}
        >
          {children}
        </WalletContext.Provider>
      }
    >
      <PrivyWalletTree
        pendingConnectOption={pendingConnectOption}
        setPendingConnectOption={setPendingConnectOption}
        noPrivyTokenOnLoad={noPrivyTokenOnLoad}
      >
        {children}
      </PrivyWalletTree>
    </Suspense>
  );
};

export default WalletContextProvider;
