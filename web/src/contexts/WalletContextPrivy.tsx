/**
 * Lazy-loaded Privy wallet tree. Imported only after Connect or existing session.
 */
import {
  type FC,
  type ReactNode,
  useMemo,
  useCallback,
  useState,
  useEffect,
  useRef,
} from "react";
import { PrivyProvider, usePrivy, useLoginWithSiws, useLogout } from "@privy-io/react-auth";
import {
  useWallets as usePrivySolanaWallets,
  useSignTransaction,
  useSignAndSendTransaction,
  useSignMessage,
} from "@privy-io/react-auth/solana";
import { toSolanaWalletConnectors } from "@privy-io/react-auth/solana";
import {
  PublicKey,
  Transaction,
  VersionedTransaction,
} from "@solana/web3.js";
import { env, getPrivyClientIdForProvider } from "@/lib/env";
import { notify } from "@/lib/notify";
import { fetchUserWalletBalancesResilient } from "@/lib/userWalletBalance";
import { withRpcFallback } from "@/lib/solanaRpc";
import bs58 from "bs58";
import {
  WalletContext,
  connection,
  type ConnectOption,
  type WalletContextState,
  type PrivyWalletTreeProps,
  MINIMAL_LOGIN_OPTIONS,
  POPULAR_SOLANA_WALLET_LIST,
  signatureToBase64,
  privySignMessageResultToBytes,
  getSiws403Origin,
  setSiws403Origin,
  clearPrivySessionStorage,
  setDisconnectedByUserFlag,
  clearDisconnectedByUserFlag,
  getDisconnectedByUserFlag,
  hasPrivyTokenInStorage,
} from "./WalletContext";

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
  const { signAndSendTransaction: privySignAndSendTransaction } = useSignAndSendTransaction();
  const { signMessage: privySignMessage } = useSignMessage();

  const siwsAttemptedForRef = useRef<string | null>(null);
  const userRequestedWalletConnectRef = useRef(false);
  const justDisconnectedRef = useRef(false);
  const loginModalJustOpenedRef = useRef(false);

  const markUserInitiatedConnect = useCallback(() => {
    userRequestedWalletConnectRef.current = true;
    siwsAttemptedForRef.current = null;
    setForceDisconnected(false);
  }, []);

  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [usdcBalance, setUsdcBalance] = useState<number | null>(null);
  const [forceDisconnected, setForceDisconnected] = useState(false);

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
    if (!getDisconnectedByUserFlag()) return;
    didApplyDisconnectOnMountRef.current = true;
    setForceDisconnected(true);
    clearDisconnectedByUserFlag();
    logout()
      .then(() => {
        clearPrivySessionStorage();
        setTimeout(clearPrivySessionStorage, 50);
        setTimeout(clearPrivySessionStorage, 200);
      })
      .catch(() => {});
  }, [privyReady, logout]);

  useEffect(() => {
    const noWallets = !solanaWallets || solanaWallets.length === 0;
    if (!authenticated && noWallets) {
      setForceDisconnected(false);
    } else if (authenticated && !noWallets) {
      setForceDisconnected(false);
      clearDisconnectedByUserFlag();
    }
  }, [authenticated, solanaWallets]);

  const refreshSolanaBalances = useCallback(async () => {
    if (!address || !connected) {
      setSolBalance(null);
      setUsdcBalance(null);
      return;
    }
    try {
      const balances = await fetchUserWalletBalancesResilient(address);
      setSolBalance(balances.solBalance);
      setUsdcBalance(balances.usdcBalance);
    } catch {
      // Keep last known balances on transient RPC failure (avoid false "0 USDC").
    }
  }, [address, connected]);

  useEffect(() => {
    void refreshSolanaBalances();
    if (!publicKey || !connected) return;
    const interval = setInterval(() => {
      void refreshSolanaBalances();
    }, 30000);
    return () => clearInterval(interval);
  }, [publicKey, connected, refreshSolanaBalances]);

  /** Email / Privy login without a linked Solana wallet yet (keep connect ref for a later wallet link). */
  useEffect(() => {
    if (!authenticated || address) return;
    if (!userRequestedWalletConnectRef.current) return;
    notify.success("Signed in", "Connect a Solana wallet to trade and use agents.");
  }, [authenticated, address]);

  /** After explicit Connect wallet, notify Syra auth (one session sign-in if needed). */
  useEffect(() => {
    if (!authenticated || !address) return;
    if (!userRequestedWalletConnectRef.current) return;
    userRequestedWalletConnectRef.current = false;
    const short = `${address.slice(0, 4)}…${address.slice(-4)}`;
    notify.success("Wallet connected", short);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("syra-wallet-connected"));
    }
  }, [authenticated, address]);

  useEffect(() => {
    const wallet = solanaWallets?.[0];
    if (!privyReady || authenticated || !wallet?.address) return;
    if (!userRequestedWalletConnectRef.current) return;
    if (justDisconnectedRef.current) return;
    if (loginModalJustOpenedRef.current) return;
    if (siwsAttemptedForRef.current === wallet.address) return;
    if (forceDisconnected) return;
    if (noPrivyTokenOnLoad && !userRequestedWalletConnectRef.current) return;
    if (didApplyDisconnectOnMountRef.current && !userRequestedWalletConnectRef.current) return;
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
          const isOriginBlocked =
            msg.includes("403") ||
            msg.includes("not allowed") ||
            msg.includes("invalid_origin") ||
            msg.includes("Invalid origin") ||
            (e &&
              typeof e === "object" &&
              "status" in e &&
              (e as { status: number }).status === 403);
          if (isOriginBlocked && typeof window !== "undefined") {
            const currentOrigin = window.location.origin;
            setSiws403Origin(currentOrigin);
            const clientHint = env.privyClientId
              ? "Configuration → Clients → your app client → Allowed origins (or remove VITE_PRIVY_CLIENT_ID from production)"
              : "Configuration → Domains → Allowed origins";
            notify.error(
              "Solana login blocked",
              `Add "${currentOrigin}" in Privy Dashboard → ${clientHint}. Or sign in with email first, then connect your Solana wallet.`,
            );
          } else {
            notify.error(
              "Solana sign-in failed",
              msg || "Try logging in with email first, then connect your Solana wallet.",
            );
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
    connectWallet({
      walletList: [...POPULAR_SOLANA_WALLET_LIST],
      walletChainType: "solana-only",
    });
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

  const requestConnect = useCallback(
    (option: ConnectOption) => {
      setPendingConnectOption(option);
    },
    [setPendingConnectOption]
  );

  useEffect(() => {
    if (!pendingConnectOption || !privyReady) return;
    const option = pendingConnectOption;
    setPendingConnectOption(null);
    markUserInitiatedConnect();
    if (option === "email") {
      openLoginModal();
      return;
    }
    void connectForChain("solana");
  }, [
    pendingConnectOption,
    privyReady,
    connectForChain,
    setPendingConnectOption,
    markUserInitiatedConnect,
    openLoginModal,
  ]);

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
      notify.info("Wallet disconnected");
    } catch (e) {
      setForceDisconnected(false);
      const message = e instanceof Error ? e.message : "Disconnect failed";
      notify.error("Could not disconnect", message);
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
      return withRpcFallback(async (readConnection) => {
        const { blockhash } = await readConnection.getLatestBlockhash("finalized");
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
        return readConnection.sendRawTransaction(new Uint8Array(signedTransaction), {
          skipPreflight: options?.skipPreflight ?? false,
          maxRetries: options?.maxRetries ?? 3,
          preflightCommitment: "finalized",
        });
      });
    },
    [solanaWallet, publicKey, privySignTransaction]
  );

  const sendAllTransactions = useCallback(
    async (
      transactions: Transaction[],
      options?: { skipPreflight?: boolean; maxRetries?: number }
    ) => {
      if (!solanaWallet || !publicKey) throw new Error("No Solana wallet connected");
      if (transactions.length === 0) return [];

      return withRpcFallback(async (readConnection) => {
        const { blockhash } = await readConnection.getLatestBlockhash("finalized");
        const inputs = transactions.map((transaction) => {
          transaction.recentBlockhash = blockhash;
          transaction.feePayer = publicKey;
          const serialized = transaction.serialize({
            requireAllSignatures: false,
            verifySignatures: false,
          });
          return {
            transaction: new Uint8Array(serialized),
            wallet: solanaWallet,
            options: {
              skipPreflight: options?.skipPreflight ?? false,
              maxRetries: options?.maxRetries ?? 3,
            },
          };
        });

        const outputs =
          inputs.length === 1
            ? [await privySignAndSendTransaction(inputs[0])]
            : await privySignAndSendTransaction(...inputs);

        return outputs.map((output) => bs58.encode(output.signature));
      });
    },
    [solanaWallet, publicKey, privySignAndSendTransaction]
  );

  const signMessage = useCallback(
    async (message: Uint8Array) => {
      if (!solanaWallet) throw new Error("No Solana wallet connected");
      const result = await privySignMessage({ message, wallet: solanaWallet });
      const bytes = privySignMessageResultToBytes(result);
      if (bytes.length === 0) {
        throw new Error("Wallet did not return a signature");
      }
      return bytes;
    },
    [solanaWallet, privySignMessage]
  );

  const effectivelyDisconnected = forceDisconnected;
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
      sendAllTransactions,
      signMessage,
      publicKey: effectivelyDisconnected ? null : publicKey,
      connectSolana,
      openLoginModal,
      isPrivyMounted: true,
      privyBooting: !privyReady,
      requestConnect,
      effectiveChain,
      refreshSolanaBalances,
    }),
    [
      forceDisconnected,
      effectivelyDisconnected,
      connection,
      connected,
      connecting,
      privyReady,
      address,
      shortAddress,
      solBalance,
      usdcBalance,
      connect,
      connectForChain,
      disconnect,
      signTransaction,
      sendTransaction,
      sendAllTransactions,
      signMessage,
      publicKey,
      connectSolana,
      openLoginModal,
      requestConnect,
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

const PRIVY_APP_ID = env.privyAppId ?? "";
const PRIVY_CLIENT_ID = getPrivyClientIdForProvider() ?? "";

const PrivyWalletTree: FC<PrivyWalletTreeProps> = ({
  children,
  pendingConnectOption,
  setPendingConnectOption,
  noPrivyTokenOnLoad,
}) => {
  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      {...(PRIVY_CLIENT_ID ? { clientId: PRIVY_CLIENT_ID } : {})}
      config={{
        loginMethods: [...MINIMAL_LOGIN_OPTIONS.loginMethods],
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

export default PrivyWalletTree;
