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
import { useWallets as usePrivyEvmWallets } from "@privy-io/react-auth";
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
import { createWalletClient, custom, getAddress } from "viem";
import { base } from "viem/chains";
import { toast } from "@/hooks/use-toast";

/** Minimal EVM signer type for Base (e.g. x402). Not used by agent wallet; kept for API parity. */
export interface EvmSigner {
  address: string;
  signTypedData: (args: {
    domain: unknown;
    types: unknown;
    primaryType: string;
    message: unknown;
  }) => Promise<string>;
}

/** Detect installed wallet extensions (for showing only installed wallets vs. minimal list for new users). */
function detectInstalledWallets(): { hasEthereum: boolean; hasSolana: boolean } {
  if (typeof window === "undefined")
    return { hasEthereum: false, hasSolana: false };
  const w = window as Window & {
    ethereum?: unknown;
    phantom?: { solana?: unknown };
    solflare?: unknown;
    backpack?: unknown;
  };
  const hasEthereum = !!w.ethereum;
  const hasSolana = !!(
    w.phantom?.solana ||
    w.solflare ||
    w.backpack
  );
  return { hasEthereum, hasSolana };
}

/** Wallet list for Privy: only installed wallets, or for new users (none installed) just MetaMask + Phantom. */
function getWalletListForChain(
  chain: "solana" | "base",
  detected: { hasEthereum: boolean; hasSolana: boolean }
): string[] {
  const useDetected =
    (chain === "base" && detected.hasEthereum) ||
    (chain === "solana" && detected.hasSolana);
  if (chain === "base") {
    return useDetected ? ["detected_ethereum_wallets"] : ["metamask", "phantom"];
  }
  return useDetected ? ["detected_solana_wallets"] : ["metamask", "phantom"];
}

/** Default wallet list for login modal: only installed, or email + MetaMask + Phantom for new users. */
function getDefaultWalletList(detected: {
  hasEthereum: boolean;
  hasSolana: boolean;
}): string[] {
  if (detected.hasEthereum || detected.hasSolana) {
    return ["detected_ethereum_wallets", "detected_solana_wallets"];
  }
  return ["metamask", "phantom"];
}

/** Login modal: only email and wallet (no social logins); wallet list is controlled by getDefaultWalletList / getWalletListForChain. */
const MINIMAL_LOGIN_OPTIONS = { loginMethods: ["email", "wallet"] as const };

const USDC_MINT = new PublicKey(
  "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
);
const MAINNET_RPC =
  import.meta.env.VITE_SOLANA_RPC_URL || "https://rpc.ankr.com/solana";
const BASE_USDC = "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913" as const;

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
  connectForChain: (chain: "solana" | "base") => Promise<void>;
  disconnect: () => Promise<void>;
  signTransaction: (transaction: unknown) => Promise<VersionedTransaction>;
  /** Sign and send a legacy Transaction (e.g. for FuelAgentModal). Returns signature. */
  sendTransaction: (
    transaction: Transaction,
    options?: { skipPreflight?: boolean; maxRetries?: number }
  ) => Promise<string>;
  signMessage: (message: Uint8Array) => Promise<Uint8Array>;
  publicKey: PublicKey | null;
  baseConnected: boolean;
  baseConnecting: boolean;
  baseAddress: string | null;
  baseShortAddress: string | null;
  baseUsdcBalance: number | null;
  /** Base native token (ETH) balance */
  baseEthBalance: number | null;
  connectBase: () => Promise<void>;
  connectSolana: () => Promise<void>;
  disconnectBase: () => Promise<void>;
  getEvmSigner: () => Promise<EvmSigner | null>;
  setConnectChainOverride: (v: "ethereum-only" | "solana-only" | null) => void;
  openLoginModal: () => void;
  isPrivyMounted: boolean;
  requestConnect: (option: "email" | "solana" | "base") => void;
  /** Which chain to show/use when both Solana and Base are connected (set when user picks in connect modal) */
  effectiveChain: "solana" | "base" | null;
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
  } catch {}
}

/** Known Privy SDK keys from @privy-io/react-auth (context-CcPjcQxY) – clear all so refresh stays disconnected. */
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

/** Clear any Privy-related IndexedDB databases (SDK or WalletConnect may use them). */
function clearPrivyIndexedDB(): void {
  try {
    if (typeof indexedDB === "undefined" || !indexedDB.databases) return;
    indexedDB.databases?.().then((dbs) => {
      dbs.forEach((db) => {
        if (db.name && (db.name.toLowerCase().includes("privy") || db.name.toLowerCase().includes("walletconnect"))) {
          indexedDB.deleteDatabase(db.name);
        }
      });
    }).catch(() => {});
  } catch {}
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

/** When set, user chose to disconnect; after refresh we force logout so wallet doesn't auto-reconnect. */
const DISCONNECTED_BY_USER_KEY = "syra_wallet_disconnected_by_user";
function setDisconnectedByUserFlag(): void {
  try {
    if (typeof sessionStorage !== "undefined")
      sessionStorage.setItem(DISCONNECTED_BY_USER_KEY, "1");
  } catch {}
}
function clearDisconnectedByUserFlag(): void {
  try {
    if (typeof sessionStorage !== "undefined")
      sessionStorage.removeItem(DISCONNECTED_BY_USER_KEY);
  } catch {}
}
function getDisconnectedByUserFlag(): boolean {
  try {
    return typeof sessionStorage !== "undefined" && sessionStorage.getItem(DISCONNECTED_BY_USER_KEY) === "1";
  } catch {
    return false;
  }
}

/** Check if any Privy auth token exists in storage (run before PrivyProvider mounts). If none, user cleared data or never logged in – treat as disconnected. */
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

const PREFERRED_CHAIN_KEY = "syra_wallet_preferred_chain";
function getStoredPreferredChain(): "solana" | "base" | null {
  try {
    if (typeof localStorage === "undefined") return null;
    const v = localStorage.getItem(PREFERRED_CHAIN_KEY);
    if (v === "solana" || v === "base") return v;
  } catch {}
  return null;
}
function setStoredPreferredChain(chain: "solana" | "base") {
  try {
    if (typeof localStorage !== "undefined") localStorage.setItem(PREFERRED_CHAIN_KEY, chain);
  } catch {}
}

type WalletChainOverride = "ethereum-only" | "solana-only" | null;
type ConnectOption = "email" | "solana" | "base";

const WalletContextInner: FC<{
  children: ReactNode;
  connectChainOverride: WalletChainOverride;
  setConnectChainOverride: (v: WalletChainOverride) => void;
  pendingConnectOption: ConnectOption | null;
  setPendingConnectOption: (v: ConnectOption | null) => void;
  preferredChain: "solana" | "base" | null;
  setPreferredChain: (v: "solana" | "base" | null) => void;
  /** When true, there was no Privy token in storage at page load (e.g. user cleared browser data) – force disconnected until user connects again. */
  noPrivyTokenOnLoad: boolean;
  /** Detected installed wallets; used to show only installed or fallback to metamask/phantom for new users. */
  installedWallets: { hasEthereum: boolean; hasSolana: boolean };
}> = ({
  children,
  connectChainOverride,
  setConnectChainOverride,
  pendingConnectOption,
  setPendingConnectOption,
  preferredChain,
  setPreferredChain,
  noPrivyTokenOnLoad,
  installedWallets,
}) => {
  const { ready: privyReady, authenticated, login, connectWallet } =
    usePrivy();
  const { logout } = useLogout({
    onSuccess: () => {
      clearPrivySessionStorage();
      // Clear again after delays – Privy may re-write storage async after logout
      setTimeout(clearPrivySessionStorage, 50);
      setTimeout(clearPrivySessionStorage, 200);
    },
  });
  const { generateSiwsMessage, loginWithSiws } = useLoginWithSiws();
  const { wallets: solanaWallets, ready: solanaWalletsReady } =
    usePrivySolanaWallets();
  const { wallets: evmWallets } = usePrivyEvmWallets();
  const { signTransaction: privySignTransaction } = useSignTransaction();
  const { signMessage: privySignMessage } = useSignMessage();

  const siwsAttemptedForRef = useRef<string | null>(null);
  const justDisconnectedRef = useRef(false);
  const loginModalJustOpenedRef = useRef(false);

  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [usdcBalance, setUsdcBalance] = useState<number | null>(null);
  const [baseUsdcBalance, setBaseUsdcBalance] = useState<number | null>(null);
  const [baseEthBalance, setBaseEthBalance] = useState<number | null>(null);
  /** When true, UI shows disconnected immediately; cleared when Privy authenticated becomes false */
  const [forceDisconnected, setForceDisconnected] = useState(false);
  /** Once user explicitly connects (auth + wallet), stop treating noPrivyTokenOnLoad as disconnected so they see connected. */
  const [noTokenOverriddenByConnect, setNoTokenOverriddenByConnect] = useState(false);

  const solanaWallet = solanaWallets?.[0] ?? null;
  const address = solanaWallet?.address ?? null;
  const publicKey = address ? new PublicKey(address) : null;
  const connected = !!(authenticated && solanaWallet);

  const evmWallet = evmWallets?.[0] ?? null;
  const baseAddress = evmWallet?.address ?? null;
  const baseConnected = !!(authenticated && baseAddress);
  const connecting =
    !privyReady || (authenticated && !solanaWalletsReady);
  const baseConnecting = false;

  const shortAddress = address
    ? `${address.slice(0, 4)}...${address.slice(-4)}`
    : null;
  const baseShortAddress = baseAddress
    ? `${baseAddress.slice(0, 6)}...${baseAddress.slice(-4)}`
    : null;

  // On mount: if user had disconnected before refresh, or there was no Privy token (e.g. cleared browser data), force logout so wallet doesn't auto-reconnect
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

  // Clear forceDisconnected when:
  // - Fully logged out (no auth + no wallets) so we don't keep it true forever, or
  // - User has connected (auth + wallets) so connect flow shows correctly
  useEffect(() => {
    const noWallets =
      (!solanaWallets || solanaWallets.length === 0) &&
      (!evmWallets || evmWallets.length === 0);
    if (!authenticated && noWallets) {
      setForceDisconnected(false);
    } else if (authenticated && !noWallets) {
      setForceDisconnected(false);
      setNoTokenOverriddenByConnect(true); // user connected; stop treating noPrivyTokenOnLoad as disconnected
      clearDisconnectedByUserFlag(); // user connected again; next refresh can stay connected
    }
  }, [authenticated, solanaWallets, evmWallets]);

  // When only one chain has a wallet, set preferredChain so UI shows that chain (e.g. Base-only user).
  // Do not overwrite stored preference with the "other" chain when only one list has loaded (race on refresh).
  useEffect(() => {
    if (!authenticated) return;
    const hasSolana = !!(solanaWallets?.length);
    const hasBase = !!(evmWallets?.length);
    const stored = getStoredPreferredChain();
    if (hasBase && !hasSolana) {
      if (stored !== "solana") {
        setPreferredChain("base");
        setStoredPreferredChain("base");
      }
    } else if (hasSolana && !hasBase) {
      if (stored !== "base") {
        setPreferredChain("solana");
        setStoredPreferredChain("solana");
      }
    }
  }, [authenticated, solanaWallets?.length, evmWallets?.length, setPreferredChain]);

  // When both chains connected, restore preferred from storage so Base stays selected after refresh
  useEffect(() => {
    if (!authenticated) return;
    const hasBoth = !!(solanaWallets?.length) && !!(evmWallets?.length);
    if (!hasBoth) return;
    const stored = getStoredPreferredChain();
    if (stored && stored !== preferredChain) setPreferredChain(stored);
  }, [authenticated, solanaWallets?.length, evmWallets?.length, preferredChain, setPreferredChain]);

  useEffect(() => {
    if (!publicKey || !connected) {
      setSolBalance(null);
      setUsdcBalance(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const balance = await connection.getBalance(publicKey, "confirmed");
        if (!cancelled) setSolBalance(balance / LAMPORTS_PER_SOL);
        const tokenAccounts =
          await connection.getParsedTokenAccountsByOwner(publicKey, {
            mint: USDC_MINT,
          });
        if (!cancelled) {
          if (tokenAccounts.value.length > 0) {
            const total = tokenAccounts.value.reduce(
              (sum, acc) =>
                sum +
                (Number(acc.account.data.parsed.info.tokenAmount.uiAmount) || 0),
              0
            );
            setUsdcBalance(total);
          } else setUsdcBalance(0);
        }
      } catch {
        if (!cancelled) setUsdcBalance(0);
      }
    })();
    const interval = setInterval(() => {
      if (!publicKey || !connected) return;
      connection
        .getBalance(publicKey, "confirmed")
        .then((b) => !cancelled && setSolBalance(b / LAMPORTS_PER_SOL));
      connection
        .getParsedTokenAccountsByOwner(publicKey, { mint: USDC_MINT })
        .then((ta) => {
          if (cancelled) return;
          if (ta.value.length > 0)
            setUsdcBalance(
              ta.value.reduce(
                (s, a) =>
                  s +
                  (Number(a.account.data.parsed.info.tokenAmount.uiAmount) ||
                    0),
                0
              )
            );
          else setUsdcBalance(0);
        });
    }, 30000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [publicKey, connected]);

  useEffect(() => {
    if (!baseAddress || typeof window === "undefined") {
      setBaseUsdcBalance(null);
      setBaseEthBalance(null);
      return;
    }
    const abi = [
      {
        type: "function",
        name: "balanceOf",
        inputs: [{ name: "account", type: "address" }],
        outputs: [{ type: "uint256" }],
      },
    ] as const;
    let cancelled = false;
    (async () => {
      try {
        const { createPublicClient, http, formatUnits, formatEther } = await import(
          "viem"
        );
        const client = createPublicClient({
          chain: base,
          transport: http(),
        });
        const [usdcRaw, ethWei] = await Promise.all([
          client.readContract({
            address: BASE_USDC as `0x${string}`,
            abi,
            functionName: "balanceOf",
            args: [getAddress(baseAddress)],
          }),
          client.getBalance({ address: getAddress(baseAddress) as `0x${string}` }),
        ]);
        if (!cancelled) {
          setBaseUsdcBalance(Number(formatUnits(usdcRaw, 6)));
          setBaseEthBalance(Number(formatEther(ethWei)));
        }
      } catch {
        if (!cancelled) {
          setBaseUsdcBalance(0);
          setBaseEthBalance(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [baseAddress]);

  useEffect(() => {
    const wallet = solanaWallets?.[0];
    if (!privyReady || authenticated || !wallet?.address) return;
    if (justDisconnectedRef.current) return;
    if (loginModalJustOpenedRef.current) return;
    if (siwsAttemptedForRef.current === wallet.address) return;
    // Don't trigger Phantom sign (SIWS) when user disconnected or cleared data – would open wallet on refresh
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
    if (!authenticated) {
      login(MINIMAL_LOGIN_OPTIONS);
      return;
    }
    connectWallet();
  }, [privyReady, authenticated, login, connectWallet]);

  const openLoginModal = useCallback(() => {
    if (privyReady) {
      loginModalJustOpenedRef.current = true;
      login(MINIMAL_LOGIN_OPTIONS);
      setTimeout(() => {
        loginModalJustOpenedRef.current = false;
      }, 25000);
    }
  }, [privyReady, login]);

  const connectForChain = useCallback(
    async (chain: "solana" | "base") => {
      setPreferredChain(chain);
      setStoredPreferredChain(chain);
      if (!privyReady) return;
      const walletList = getWalletListForChain(chain, installedWallets);

      if (!authenticated) {
        loginModalJustOpenedRef.current = true;
        login(MINIMAL_LOGIN_OPTIONS);
        setTimeout(() => {
          loginModalJustOpenedRef.current = false;
        }, 25000);
        return;
      }
      // Already have a wallet for this chain (e.g. from previous session) — don't open Privy modal
      if (chain === "solana" && solanaWallets?.[0]) return;
      if (chain === "base" && evmWallets?.[0]) return;
      const walletChainType =
        chain === "base" ? "ethereum-only" : "solana-only";
      connectWallet({ walletList, walletChainType });
    },
    [privyReady, authenticated, solanaWallets, evmWallets, login, connectWallet, setPreferredChain, installedWallets]
  );

  useEffect(() => {
    if (!pendingConnectOption || !privyReady) return;
    const option = pendingConnectOption;
    setPendingConnectOption(null);
    if (option === "email") {
      login(MINIMAL_LOGIN_OPTIONS);
      return;
    }
    connectForChain(option);
  }, [pendingConnectOption, privyReady, login, connectForChain, setPendingConnectOption]);

  const disconnect = useCallback(async () => {
    justDisconnectedRef.current = true;
    siwsAttemptedForRef.current = null;
    setSolBalance(null);
    setUsdcBalance(null);
    setBaseUsdcBalance(null);
    setForceDisconnected(true);
    setDisconnectedByUserFlag(); // so refresh stays disconnected
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

  const connectBase = useCallback(async () => {
    if (!authenticated) {
      login(MINIMAL_LOGIN_OPTIONS);
      return;
    }
    connectWallet({
      walletList: getWalletListForChain("base", installedWallets),
      walletChainType: "ethereum-only",
    });
  }, [authenticated, login, connectWallet, installedWallets]);

  const connectSolana = useCallback(async () => {
    if (!authenticated) {
      login(MINIMAL_LOGIN_OPTIONS);
      return;
    }
    connectWallet({
      walletList: getWalletListForChain("solana", installedWallets),
      walletChainType: "solana-only",
    });
  }, [authenticated, login, connectWallet, installedWallets]);

  const disconnectBase = useCallback(async () => {
    await disconnect();
  }, [disconnect]);

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
      if (!solanaWallet) throw new Error("No Solana wallet connected");
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
        }
      );
      return sig;
    },
    [solanaWallet, privySignTransaction, connection]
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

  const getEvmSigner = useCallback((): Promise<EvmSigner | null> => {
    if (!baseAddress || !evmWallet) return Promise.resolve(null);
    return (async () => {
      const provider = await evmWallet.getEthereumProvider();
      const walletClient = createWalletClient({
        chain: base,
        transport: custom(provider as import("viem").EIP1193Provider),
        account: getAddress(baseAddress) as import("viem").Address,
      });
      return {
        address: baseAddress,
        signTypedData: async (
          args: Parameters<EvmSigner["signTypedData"]>[0]
        ) => {
          const sig = await walletClient!.signTypedData({
            account: {
              address: getAddress(baseAddress) as import("viem").Address,
              type: "json-rpc",
            },
            domain: args.domain,
            types: args.types,
            primaryType: args.primaryType,
            message: args.message,
          });
          return sig;
        },
      };
    })();
  }, [baseAddress, evmWallet]);

  const effectivelyDisconnected = forceDisconnected || (noPrivyTokenOnLoad && !noTokenOverriddenByConnect);
  const effectiveChain: "solana" | "base" | null = (() => {
    if (effectivelyDisconnected) return null;
    const solanaConnected = !!(authenticated && solanaWallets?.[0]);
    const baseConnectedHere = !!(authenticated && evmWallets?.[0]);
    if (solanaConnected && baseConnectedHere) {
      // Prefer stored chain so Base stays selected after refresh
      return preferredChain ?? getStoredPreferredChain() ?? "solana";
    }
    if (solanaConnected) return "solana";
    if (baseConnectedHere) return "base";
    return null;
  })();
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
      baseConnected: effectivelyDisconnected ? false : baseConnected,
      baseConnecting: effectivelyDisconnected ? false : baseConnecting,
      baseAddress: effectivelyDisconnected ? null : baseAddress,
      baseShortAddress: effectivelyDisconnected ? null : baseShortAddress,
      baseUsdcBalance: effectivelyDisconnected ? null : baseUsdcBalance,
      baseEthBalance: effectivelyDisconnected ? null : baseEthBalance,
      connectBase,
      connectSolana,
      disconnectBase,
      getEvmSigner,
      setConnectChainOverride,
      openLoginModal,
      isPrivyMounted: true,
      requestConnect: () => {},
      effectiveChain,
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
      baseConnected,
      baseConnecting,
      baseAddress,
      baseShortAddress,
      baseUsdcBalance,
      baseEthBalance,
      connectBase,
      connectSolana,
      disconnectBase,
      getEvmSigner,
      setConnectChainOverride,
      openLoginModal,
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
  baseConnected: false,
  baseConnecting: false,
  baseAddress: null,
  baseShortAddress: null,
  baseUsdcBalance: null,
  baseEthBalance: null,
  connectBase: async () => {},
  connectSolana: async () => {},
  disconnectBase: async () => {},
  getEvmSigner: async () => null,
  setConnectChainOverride: () => {},
  openLoginModal: () => {},
  isPrivyMounted: false,
  requestConnect: () => {},
  effectiveChain: null,
};

export const WalletContextProvider: FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [connectChainOverride, setConnectChainOverride] =
    useState<WalletChainOverride>(null);
  // Check before any clear: if no Privy token in storage at load (e.g. user cleared browser data), force disconnected until they connect again
  const [noPrivyTokenOnLoad] = useState(
    () => typeof window !== "undefined" && !hasPrivyTokenInStorage()
  );
  // Clear Privy session before mount when user previously disconnected (per Privy docs: logout clears session; we clear storage before Privy reads it on refresh)
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

  const [preferredChain, setPreferredChainState] = useState<"solana" | "base" | null>(() => getStoredPreferredChain());
  const setPreferredChain = useCallback((v: "solana" | "base" | null) => {
    setPreferredChainState(v);
    if (v) setStoredPreferredChain(v);
  }, []);

  const installedWallets = useMemo(() => detectInstalledWallets(), []);
  const defaultWalletList = useMemo(
    () => getDefaultWalletList(installedWallets),
    [installedWallets]
  );

  const walletChainType = connectChainOverride ?? "ethereum-and-solana";
  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      {...(PRIVY_CLIENT_ID ? { clientId: PRIVY_CLIENT_ID } : {})}
      config={{
        appearance: {
          walletChainType,
          walletList: defaultWalletList,
        },
        embeddedWallets: {
          ethereum: { createOnLogin: "users-without-wallets" },
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
        connectChainOverride={connectChainOverride}
        setConnectChainOverride={setConnectChainOverride}
        pendingConnectOption={pendingConnectOption}
        setPendingConnectOption={setPendingConnectOption}
        preferredChain={preferredChain}
        setPreferredChain={setPreferredChain}
        noPrivyTokenOnLoad={noPrivyTokenOnLoad}
        installedWallets={installedWallets}
      >
        {children}
      </WalletContextInner>
    </PrivyProvider>
  );
};

export default WalletContextProvider;
