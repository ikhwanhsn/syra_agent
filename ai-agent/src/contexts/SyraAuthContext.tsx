import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useWalletContext } from "@/contexts/WalletContext";
import {
  clearSyraSession,
  encodeSolanaSignature,
  ensureAccessToken,
  fetchAuthNonce,
  getSyraSessionWallet,
  refreshAccessToken,
  signInWithWallet,
  signOutSyraSession,
  type SyraSignInResult,
} from "@/lib/agentAuthApi";

const GUEST_ANONYMOUS_ID_KEY = "syra_agent_anonymous_id";

function readGuestAnonymousId(): string | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const id = localStorage.getItem(GUEST_ANONYMOUS_ID_KEY)?.trim();
    return id || null;
  } catch {
    return null;
  }
}

function persistGuestAnonymousId(anonymousId: string): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(GUEST_ANONYMOUS_ID_KEY, anonymousId);
  } catch {
    /* quota / private mode */
  }
}

export interface SyraAuthState {
  syraAuthReady: boolean;
  syraAuthenticated: boolean;
  lastSignIn: SyraSignInResult | null;
  /** Restore session from cookie/storage only — never opens the wallet signature popup. */
  ensureSyraAuth: () => Promise<SyraSignInResult | null>;
  /** Prompt wallet signature when needed (use on explicit user actions only). */
  requestSyraAuth: () => Promise<SyraSignInResult | null>;
  /** Per-wallet interactive sign-in (explicit user actions only). */
  requestSyraAuthForWallet: (walletAddress: string) => Promise<SyraSignInResult | null>;
}

const SyraAuthContext = createContext<SyraAuthState | null>(null);

export function useSyraAuth(): SyraAuthState {
  const ctx = useContext(SyraAuthContext);
  if (!ctx) throw new Error("useSyraAuth must be used within SyraAuthProvider");
  return ctx;
}

function walletMatchesSession(
  session: { address: string },
  address: string,
): boolean {
  return session.address === address;
}

function signInResultFromSession(
  accessToken: string,
  wallet: { address: string },
): SyraSignInResult {
  let expiresAt = Date.now() + 3_600_000;
  if (typeof sessionStorage !== "undefined") {
    try {
      const raw = sessionStorage.getItem("syra_access_expires");
      const parsed = raw ? Number.parseInt(raw, 10) : NaN;
      if (Number.isFinite(parsed)) expiresAt = parsed;
    } catch {
      /* ignore */
    }
  }
  return {
    accessToken,
    expiresAt,
    anonymousId: `wallet:${wallet.address}`,
    agentAddress: "",
    chain: "solana",
  };
}

export function SyraAuthProvider({ children }: { children: ReactNode }) {
  const {
    address: solanaAddress,
    connected,
    signMessage,
    authenticated,
  } = useWalletContext();

  const [syraAuthReady, setSyraAuthReady] = useState(false);
  const [syraAuthenticated, setSyraAuthenticated] = useState(false);
  const [lastSignIn, setLastSignIn] = useState<SyraSignInResult | null>(null);
  const signInFlightRef = useRef<Promise<SyraSignInResult | null> | null>(null);
  const lastSignedWalletRef = useRef<string | null>(null);
  const lastSignInRef = useRef<SyraSignInResult | null>(null);

  const activeWallet =
    connected && solanaAddress ? { address: solanaAddress, chain: "solana" as const } : null;

  useEffect(() => {
    lastSignInRef.current = lastSignIn;
  }, [lastSignIn]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const token = await refreshAccessToken();
      if (cancelled) return;
      setSyraAuthenticated(!!token);
      setSyraAuthReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const restoreSessionForWallet = useCallback(
    async (walletAddress: string): Promise<SyraSignInResult | null> => {
      const address = walletAddress.trim();
      if (!address) return null;

      const walletKey = `solana:${address}`;
      const token = await ensureAccessToken();
      const session = getSyraSessionWallet();
      if (!token || !session || !walletMatchesSession(session, address)) {
        return null;
      }

      setSyraAuthenticated(true);
      lastSignedWalletRef.current = walletKey;
      if (lastSignInRef.current?.accessToken === token) return lastSignInRef.current;
      const restored = signInResultFromSession(token, { address });
      lastSignInRef.current = restored;
      setLastSignIn(restored);
      return restored;
    },
    [],
  );

  const signInForWalletInteractive = useCallback(
    async (walletAddress: string): Promise<SyraSignInResult | null> => {
      const address = walletAddress.trim();
      if (!address) return null;

      const restored = await restoreSessionForWallet(address);
      if (restored) return restored;

      const walletKey = `solana:${address}`;
      if (signInFlightRef.current) return signInFlightRef.current;

      signInFlightRef.current = (async () => {
        try {
          const guestAnonymousId = readGuestAnonymousId();
          const { message } = await fetchAuthNonce("solana", address);

          if (!solanaAddress || solanaAddress !== address) {
            return null;
          }
          const sigBytes = await signMessage(new TextEncoder().encode(message));
          if (!sigBytes?.length) return null;
          const signature = encodeSolanaSignature(sigBytes);

          const signInResult = await signInWithWallet({
            chain: "solana",
            address,
            message,
            signature,
            anonymousId: guestAnonymousId,
          });
          persistGuestAnonymousId(signInResult.anonymousId);
          setLastSignIn(signInResult);
          lastSignInRef.current = signInResult;
          setSyraAuthenticated(true);
          lastSignedWalletRef.current = walletKey;
          return signInResult;
        } catch {
          setSyraAuthenticated(false);
          return null;
        } finally {
          signInFlightRef.current = null;
        }
      })();

      return signInFlightRef.current;
    },
    [restoreSessionForWallet, signMessage, solanaAddress],
  );

  const ensureSyraAuth = useCallback(async (): Promise<SyraSignInResult | null> => {
    if (!activeWallet) return null;
    return restoreSessionForWallet(activeWallet.address);
  }, [activeWallet, restoreSessionForWallet]);

  const requestSyraAuth = useCallback(async (): Promise<SyraSignInResult | null> => {
    if (!activeWallet) return null;
    return signInForWalletInteractive(activeWallet.address);
  }, [activeWallet, signInForWalletInteractive]);

  const requestSyraAuthForWallet = useCallback(
    (walletAddress: string) => signInForWalletInteractive(walletAddress),
    [signInForWalletInteractive],
  );

  useEffect(() => {
    if (!syraAuthReady) return;
    if (!authenticated || !activeWallet) {
      if (syraAuthenticated) {
        void signOutSyraSession();
      }
      setSyraAuthenticated(false);
      lastSignedWalletRef.current = null;
      return;
    }
    const walletKey = `solana:${activeWallet.address}`;
    if (lastSignedWalletRef.current === walletKey && syraAuthenticated) return;
    void restoreSessionForWallet(activeWallet.address);
  }, [syraAuthReady, authenticated, activeWallet, restoreSessionForWallet, syraAuthenticated]);

  useEffect(() => {
    if (!authenticated) {
      lastSignedWalletRef.current = null;
      lastSignInRef.current = null;
      setLastSignIn(null);
      clearSyraSession();
      setSyraAuthenticated(false);
    }
  }, [authenticated]);

  const value: SyraAuthState = {
    syraAuthReady,
    syraAuthenticated,
    lastSignIn,
    ensureSyraAuth,
    requestSyraAuth,
    requestSyraAuthForWallet,
  };

  return <SyraAuthContext.Provider value={value}>{children}</SyraAuthContext.Provider>;
}
