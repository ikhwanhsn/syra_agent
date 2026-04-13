import { FC, ReactNode, useMemo, useCallback, createContext, useContext, useEffect, useRef, useState } from 'react';
import { PrivyProvider, usePrivy, useLoginWithSiws, useModalStatus } from '@privy-io/react-auth';
import { useWallets as usePrivyEvmWallets } from '@privy-io/react-auth';
import { useWallets as usePrivySolanaWallets, useSignTransaction, useSignMessage } from '@privy-io/react-auth/solana';
import { toSolanaWalletConnectors } from '@privy-io/react-auth/solana';
import { LAMPORTS_PER_SOL, PublicKey, VersionedTransaction } from '@solana/web3.js';
import { Connection } from '@solana/web3.js';
import type { EvmSigner } from '@/lib/x402Client';
import { createWalletClient, custom, getAddress } from 'viem';
import { base } from 'viem/chains';
import { toast } from '@/hooks/use-toast';
import { ConnectChainModal, type ConnectOption } from '@/components/ConnectChainModal';

// USDC token mint on mainnet
const USDC_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');

const MAINNET_RPC = import.meta.env.VITE_SOLANA_RPC_URL || 'https://rpc.ankr.com/solana';
const BASE_USDC = '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913' as const;

/**
 * Curated Privy wallets only (no detected_* / full WalletConnect registry).
 * Rabby has no supported named entry in current Privy SDK (rabby_wallet deprecated).
 */
const POPULAR_EVM_WALLET_LIST: string[] = [
  'metamask',
  'coinbase_wallet',
  'rainbow',
  'base_account',
  'okx_wallet',
];

const POPULAR_SOLANA_WALLET_LIST: string[] = ['phantom', 'solflare', 'backpack'];

const POPULAR_MULTICHAIN_WALLET_LIST: string[] = [
  'phantom',
  'metamask',
  'solflare',
  'backpack',
  'coinbase_wallet',
  'rainbow',
  'base_account',
  'okx_wallet',
];

/** Solana RPC connection (exported for useApiPlayground and x402Client). */
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
  /** Opens the in-app chain picker (Solana / Base / email), then Privy. */
  connect: () => void;
  /** Skip the picker and open Privy for a specific chain (e.g. programmatic connect). */
  connectForChain: (chain: 'solana' | 'base') => Promise<void>;
  disconnect: () => Promise<void>;
  signTransaction: (transaction: any) => Promise<any>;
  signMessage: (message: Uint8Array) => Promise<Uint8Array>;
  publicKey: PublicKey | null;
  baseConnected: boolean;
  baseConnecting: boolean;
  baseAddress: string | null;
  baseShortAddress: string | null;
  baseUsdcBalance: number | null;
  connectBase: () => Promise<void>;
  connectSolana: () => Promise<void>;
  disconnectBase: () => Promise<void>;
  getEvmSigner: () => Promise<EvmSigner | null>;
  /** Open Privy login modal (email, social, etc.) for web2 users. */
  openLoginModal: () => void;
  /** True when Privy is mounted. */
  isPrivyMounted: boolean;
  /** After user picks Solana/Base/email in the connect chain modal (before Privy). Used to sync payment rail. */
  setConnectChainPickListener: (handler: ((option: ConnectOption) => void) | null) => void;
  /** Internal: run Privy flow for an option from the chain modal (Solana/Base queue until `ready`). */
  requestConnect: (option: ConnectOption) => void;
}

const WalletContext = createContext<WalletContextState | null>(null);

export function useWalletContext() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWalletContext must be used within WalletContextProvider');
  }
  return context;
}

/** Encode Uint8Array signature to base64 for Privy loginWithSiws (matches Buffer.from(sig).toString('base64')) */
function signatureToBase64(sig: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < sig.length; i++) binary += String.fromCharCode(sig[i]);
  return btoa(binary);
}

const SIWS_403_ORIGIN_KEY = 'privy_siws_403_origin';
function getSiws403Origin(): string | null {
  try {
    return typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(SIWS_403_ORIGIN_KEY) : null;
  } catch {
    return null;
  }
}
function setSiws403Origin(origin: string): void {
  try {
    if (typeof sessionStorage !== 'undefined') sessionStorage.setItem(SIWS_403_ORIGIN_KEY, origin);
  } catch {}
}

/** Avoid crashing the whole app if Privy/adapters ever surface a non–Solana-pubkey string. */
function tryPublicKey(address: string | undefined | null): PublicKey | null {
  if (!address) return null;
  try {
    return new PublicKey(address);
  } catch {
    return null;
  }
}

type WalletChainOverride = 'ethereum-only' | 'solana-only' | null;

const WalletContextInner: FC<{
  children: ReactNode;
  setConnectChainOverride: (v: WalletChainOverride) => void;
  pendingConnectOption: ConnectOption | null;
  setPendingConnectOption: (v: ConnectOption | null) => void;
  queueConnectFromChainModal: (option: 'solana' | 'base') => void;
}> = ({ children, setConnectChainOverride, pendingConnectOption, setPendingConnectOption, queueConnectFromChainModal }) => {
  const { ready: privyReady, authenticated, login, logout, connectWallet } = usePrivy();
  const { isOpen: privyModalOpen } = useModalStatus();
  const { generateSiwsMessage, loginWithSiws } = useLoginWithSiws();
  const { wallets: solanaWallets, ready: solanaWalletsReady } = usePrivySolanaWallets();
  const { wallets: evmWallets } = usePrivyEvmWallets();
  const { signTransaction: privySignTransaction } = useSignTransaction();
  const { signMessage: privySignMessage } = useSignMessage();

  /** Track which Solana address we already attempted SIWS for (avoid duplicate runs when unauthenticated) */
  const siwsAttemptedForRef = useRef<string | null>(null);
  /** When true, skip the SIWS effect so we don't call privySignMessage (which opens Phantom) right after disconnect */
  const justDisconnectedRef = useRef(false);
  /** When true, skip the SIWS effect so we don't open Phantom before the user has clicked a wallet in the login modal (e.g. "Last used" can pre-populate solanaWallets and trigger SIWS immediately) */
  const loginModalJustOpenedRef = useRef(false);
  /**
   * SIWS must not run on first paint / refresh: Privy can surface a linked Solana wallet while still
   * unauthenticated, which would call `privySignMessage` and pop Phantom. Set true only after we open
   * `login()` / `connectWallet()` from an explicit user action (never from opening the chain picker alone).
   */
  const allowSiwsRef = useRef(false);

  const connectPickListenerRef = useRef<((option: ConnectOption) => void) | null>(null);
  const setConnectChainPickListener = useCallback((handler: ((option: ConnectOption) => void) | null) => {
    connectPickListenerRef.current = handler;
  }, []);

  const [chainPickerOpen, setChainPickerOpen] = useState(false);

  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [usdcBalance, setUsdcBalance] = useState<number | null>(null);
  const [baseUsdcBalance, setBaseUsdcBalance] = useState<number | null>(null);

  // First Solana wallet (linked/connected)
  const solanaWallet = solanaWallets?.[0] ?? null;
  const address = solanaWallet?.address ?? null;
  const publicKey = useMemo(() => tryPublicKey(address), [address]);
  const connected = !!(authenticated && solanaWallet && publicKey);

  // First EVM wallet for Base
  const evmWallet = evmWallets?.[0] ?? null;
  const baseAddress = evmWallet?.address ?? null;
  const baseConnected = !!(authenticated && baseAddress);
  // When unauthenticated, only wait for privyReady so Connect button opens login modal; when authenticated, also wait for solanaWalletsReady
  const connecting = !privyReady || (authenticated && !solanaWalletsReady);
  const baseConnecting = false;

  const shortAddress = address ? `${address.slice(0, 4)}...${address.slice(-4)}` : null;
  const baseShortAddress = baseAddress ? `${baseAddress.slice(0, 6)}...${baseAddress.slice(-4)}` : null;

  // Fetch Solana balances
  useEffect(() => {
    if (!publicKey || !connected) {
      setSolBalance(null);
      setUsdcBalance(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const balance = await connection.getBalance(publicKey, 'confirmed');
        if (!cancelled) setSolBalance(balance / LAMPORTS_PER_SOL);
        const tokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKey, { mint: USDC_MINT });
        if (!cancelled) {
          if (tokenAccounts.value.length > 0) {
            const total = tokenAccounts.value.reduce((sum, acc) => sum + (Number(acc.account.data.parsed.info.tokenAmount.uiAmount) || 0), 0);
            setUsdcBalance(total);
          } else setUsdcBalance(0);
        }
      } catch {
        if (!cancelled) setUsdcBalance(0);
      }
    })();
    const interval = setInterval(() => {
      if (!publicKey || !connected) return;
      connection.getBalance(publicKey, 'confirmed').then((b) => !cancelled && setSolBalance(b / LAMPORTS_PER_SOL));
      connection.getParsedTokenAccountsByOwner(publicKey, { mint: USDC_MINT }).then((ta) => {
        if (cancelled) return;
        if (ta.value.length > 0) setUsdcBalance(ta.value.reduce((s, a) => s + (Number(a.account.data.parsed.info.tokenAmount.uiAmount) || 0), 0));
        else setUsdcBalance(0);
      });
    }, 30000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [publicKey, connected]);

  // Fetch Base USDC balance
  useEffect(() => {
    if (!baseAddress || typeof window === 'undefined') {
      setBaseUsdcBalance(null);
      return;
    }
    const abi = [{ type: 'function', name: 'balanceOf', inputs: [{ name: 'account', type: 'address' }], outputs: [{ type: 'uint256' }] }] as const;
    let cancelled = false;
    (async () => {
      try {
        const { createPublicClient, http, formatUnits } = await import('viem');
        const client = createPublicClient({ chain: base, transport: http() });
        const raw = await client.readContract({
          address: BASE_USDC as `0x${string}`,
          abi,
          functionName: 'balanceOf',
          args: [getAddress(baseAddress)],
        });
        if (!cancelled) setBaseUsdcBalance(Number(formatUnits(raw, 6)));
      } catch {
        if (!cancelled) setBaseUsdcBalance(0);
      }
    })();
    return () => { cancelled = true; };
  }, [baseAddress]);

  // When user connected a Solana wallet but is not yet authenticated, complete login via SIWS (Privy recipe: generateSiwsMessage → signMessage → loginWithSiws)
  // Use the Solana useSignMessage hook so signing works across Phantom, Solflare, etc. If origin is not allowlisted, we show workaround (email first, then connect).
  // Skip when we just disconnected: after logout, authenticated becomes false but solanaWallets can still be set briefly; running SIWS would call privySignMessage and open Phantom.
  // Skip while Privy's login UI is open: "Last used" Phantom can populate solanaWallets before the user picks a wallet — do not call signMessage yet.
  // Skip when we just opened the login modal (short overlap before `useModalStatus` flips).
  useEffect(() => {
    const wallet = solanaWallets?.[0];
    if (!privyReady || authenticated || !wallet?.address) return;
    if (!allowSiwsRef.current) return;
    if (privyModalOpen) return;
    if (justDisconnectedRef.current) return;
    if (loginModalJustOpenedRef.current) return;
    if (siwsAttemptedForRef.current === wallet.address) return;
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    if (origin && getSiws403Origin() === origin) return;
    siwsAttemptedForRef.current = wallet.address;

    let cancelled = false;
    (async () => {
      try {
        const message = await generateSiwsMessage({ address: wallet.address });
        const encodedMessage = new TextEncoder().encode(message);
        // Use Privy's Solana signMessage hook (takes { message, wallet }) so all Solana wallets work
        const result = await privySignMessage({ message: encodedMessage, wallet });
        const rawSig = result?.signature;
        const signatureBase64 =
          typeof rawSig === 'string'
            ? rawSig
            : rawSig instanceof Uint8Array
              ? signatureToBase64(rawSig)
              : ArrayBuffer.isView(rawSig)
                ? signatureToBase64(new Uint8Array((rawSig as ArrayBufferView).buffer, (rawSig as ArrayBufferView).byteOffset, (rawSig as ArrayBufferView).byteLength))
                : Array.isArray(rawSig)
                  ? signatureToBase64(new Uint8Array(rawSig))
                  : '';
        if (cancelled || !signatureBase64) return;
        await loginWithSiws({ message, signature: signatureBase64 });
      } catch (e: unknown) {
        if (!cancelled) {
          siwsAttemptedForRef.current = null;
          const msg = e && typeof e === 'object' && 'message' in e ? String((e as { message: unknown }).message) : String(e);
          const is403 = msg.includes('403') || msg.includes('not allowed') || (e && typeof e === 'object' && 'status' in e && (e as { status: number }).status === 403);
          if (is403 && typeof window !== 'undefined') {
            const currentOrigin = window.location.origin;
            setSiws403Origin(currentOrigin);
            toast({
              title: 'Solana login blocked (403)',
              description: `Add "${currentOrigin}" in Privy Dashboard → Configuration → Clients → your client → Allowed origins. Workaround: click Connect, choose "Log in with email", then after logging in click Connect again and choose Phantom/Solflare.`,
              variant: 'destructive',
            });
          } else {
            toast({
              title: 'Solana sign-in failed',
              description: msg || 'Try logging in with email first, then connect your Solana wallet.',
              variant: 'destructive',
            });
          }
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [privyReady, authenticated, privyModalOpen, solanaWallets, generateSiwsMessage, loginWithSiws, privySignMessage]);

  /** Show app chain picker (Solana / Base / email) before Privy wallet list. */
  const connect = useCallback(() => {
    setChainPickerOpen(true);
  }, []);

  const openLoginModal = useCallback(() => {
    if (privyReady) {
      loginModalJustOpenedRef.current = true;
      allowSiwsRef.current = true;
      login();
      // Long cooldown so we don't run SIWS and open the wallet popup again after Privy already opened it when the user clicked a wallet. One popup only.
      setTimeout(() => {
        loginModalJustOpenedRef.current = false;
      }, 25000);
    }
  }, [privyReady, login]);

  const requestConnect = useCallback(
    (option: ConnectOption) => {
      // Do not set `allowSiwsRef` here: chain pick runs before Privy's wallet step; enabling SIWS
      // too early races with `login()` and pops Phantom before the user chooses a wallet in Privy.
      if (option === 'email') {
        setConnectChainOverride(null);
        openLoginModal();
        return;
      }
      queueConnectFromChainModal(option);
    },
    [openLoginModal, queueConnectFromChainModal, setConnectChainOverride]
  );

  /** Open Privy for a specific chain (skips the in-app chain picker). */
  const connectForChain = useCallback(
    async (chain: 'solana' | 'base') => {
      if (!privyReady) return;
      const solanaList = POPULAR_SOLANA_WALLET_LIST;
      const evmList = POPULAR_EVM_WALLET_LIST;

      if (!authenticated) {
        if (chain === 'base') setConnectChainOverride('ethereum-only');
        else if (chain === 'solana') setConnectChainOverride('solana-only');
        loginModalJustOpenedRef.current = true;
        login();
        allowSiwsRef.current = true;
        setTimeout(() => {
          loginModalJustOpenedRef.current = false;
        }, 25000);
        return;
      }
      allowSiwsRef.current = true;
      const walletList = chain === 'base' ? evmList : solanaList;
      const walletChainType = chain === 'base' ? 'ethereum-only' : 'solana-only';
      connectWallet({ walletList, walletChainType });
    },
    [privyReady, authenticated, login, connectWallet, setConnectChainOverride]
  );

  // After user picks Solana/Base in our modal, run connect/login once Privy is ready (handles very fast clicks before `ready`).
  useEffect(() => {
    if (!pendingConnectOption || !privyReady) return;
    const option = pendingConnectOption;
    if (option === 'email') {
      setPendingConnectOption(null);
      return;
    }
    setPendingConnectOption(null);
    void connectForChain(option);
  }, [pendingConnectOption, privyReady, connectForChain, setPendingConnectOption]);

  const disconnect = useCallback(async () => {
    allowSiwsRef.current = false;
    justDisconnectedRef.current = true;
    siwsAttemptedForRef.current = null;
    setSolBalance(null);
    setUsdcBalance(null);
    setBaseUsdcBalance(null);
    try {
      await logout();
    } catch (e) {
      // Logout error not exposed to client
    } finally {
      // Stop skipping SIWS after a short delay so future connect flows still run SIWS
      setTimeout(() => {
        justDisconnectedRef.current = false;
      }, 3000);
    }
  }, [logout]);

  const connectBase = useCallback(async () => {
    await connectForChain('base');
  }, [connectForChain]);

  const connectSolana = useCallback(async () => {
    await connectForChain('solana');
  }, [connectForChain]);

  // Privy doesn't support disconnecting a single chain; use full logout so UI shows disconnected
  const disconnectBase = useCallback(async () => {
    await disconnect();
  }, [disconnect]);

  const signTransaction = useCallback(
    async (transaction: any) => {
      if (!solanaWallet) throw new Error('No Solana wallet connected');
      const txBytes = transaction.serialize ? transaction.serialize() : new Uint8Array(transaction);
      const { signedTransaction } = await privySignTransaction({
        transaction: txBytes,
        wallet: solanaWallet,
      });
      return VersionedTransaction.deserialize(signedTransaction);
    },
    [solanaWallet, privySignTransaction]
  );

  const signMessage = useCallback(
    async (message: Uint8Array) => {
      if (!solanaWallet) throw new Error('No Solana wallet connected');
      const result = await privySignMessage({ message, wallet: solanaWallet });
      return typeof result === 'object' && result?.signature ? new Uint8Array(result.signature as ArrayBuffer) : new Uint8Array(0);
    },
    [solanaWallet, privySignMessage]
  );

  const getEvmSigner = useCallback((): Promise<EvmSigner | null> => {
    if (!baseAddress || !evmWallet) return Promise.resolve(null);
    return (async () => {
      const provider = await evmWallet.getEthereumProvider();
      const walletClient = createWalletClient({
        chain: base,
        transport: custom(provider as import('viem').EIP1193Provider),
        account: getAddress(baseAddress) as import('viem').Address,
      });
      return {
        address: baseAddress,
        signTypedData: async (args: Parameters<EvmSigner['signTypedData']>[0]) => {
          const sig = await walletClient!.signTypedData({
            account: { address: getAddress(baseAddress) as import('viem').Address, type: 'json-rpc' },
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

  const contextValue: WalletContextState = useMemo(
    () => ({
      connection,
      connected,
      connecting,
      address,
      shortAddress,
      solBalance,
      usdcBalance,
      network: 'Solana Mainnet',
      connect,
      connectForChain,
      disconnect,
      signTransaction,
      signMessage,
      publicKey,
      baseConnected,
      baseConnecting,
      baseAddress,
      baseShortAddress,
      baseUsdcBalance,
      connectBase,
      connectSolana,
      disconnectBase,
      getEvmSigner,
      openLoginModal,
      isPrivyMounted: true,
      setConnectChainPickListener,
      requestConnect,
    }),
    [
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
      signMessage,
      publicKey,
      baseConnected,
      baseConnecting,
      baseAddress,
      baseShortAddress,
      baseUsdcBalance,
      connectBase,
      connectSolana,
      disconnectBase,
      getEvmSigner,
      openLoginModal,
      setConnectChainPickListener,
      requestConnect,
    ]
  );

  return (
    <>
      <WalletContext.Provider value={contextValue}>{children}</WalletContext.Provider>
      <ConnectChainModal
        isOpen={chainPickerOpen}
        onClose={() => setChainPickerOpen(false)}
        onPick={(option) => {
          connectPickListenerRef.current?.(option);
          requestConnect(option);
        }}
      />
    </>
  );
};

const PRIVY_APP_ID = import.meta.env.VITE_PRIVY_APP_ID || '';
const PRIVY_CLIENT_ID = import.meta.env.VITE_PRIVY_CLIENT_ID || '';

/** Fallback context when VITE_PRIVY_APP_ID is not set — avoids Privy SDK errors and allows app to load. */
const FALLBACK_WALLET_STATE: WalletContextState = {
  connection,
  connected: false,
  connecting: false,
  address: null,
  shortAddress: null,
  solBalance: null,
  usdcBalance: null,
  network: 'Solana Mainnet',
  connect: () => {},
  connectForChain: async () => {},
  disconnect: async () => {},
  signTransaction: async () => { throw new Error('Wallet not configured'); },
  signMessage: async () => { throw new Error('Wallet not configured'); },
  publicKey: null,
  baseConnected: false,
  baseConnecting: false,
  baseAddress: null,
  baseShortAddress: null,
  baseUsdcBalance: null,
  connectBase: async () => {},
  connectSolana: async () => {},
  disconnectBase: async () => {},
  getEvmSigner: async () => null,
  openLoginModal: () => {},
  isPrivyMounted: false,
  setConnectChainPickListener: () => {},
  requestConnect: () => {},
};

export const WalletContextProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [connectChainOverride, setConnectChainOverride] = useState<WalletChainOverride>(null);
  const [pendingConnectOption, setPendingConnectOption] = useState<ConnectOption | null>(null);

  const queueConnectFromChainModal = useCallback((option: 'solana' | 'base') => {
    if (option === 'base') setConnectChainOverride('ethereum-only');
    else setConnectChainOverride('solana-only');
    setPendingConnectOption(option);
  }, []);

  if (!PRIVY_APP_ID?.trim()) {
    return (
      <WalletContext.Provider value={FALLBACK_WALLET_STATE}>
        {children}
      </WalletContext.Provider>
    );
  }

  const walletChainType = connectChainOverride ?? 'ethereum-and-solana';
  const appearanceWalletList = useMemo(() => {
    if (connectChainOverride === 'ethereum-only') return [...POPULAR_EVM_WALLET_LIST];
    if (connectChainOverride === 'solana-only') return [...POPULAR_SOLANA_WALLET_LIST];
    return [...POPULAR_MULTICHAIN_WALLET_LIST];
  }, [connectChainOverride]);

  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      {...(PRIVY_CLIENT_ID ? { clientId: PRIVY_CLIENT_ID } : {})}
      config={{
        defaultChain: base,
        supportedChains: [base],
        appearance: {
          walletChainType,
          walletList: appearanceWalletList,
        },
        embeddedWallets: {
          ethereum: { createOnLogin: 'users-without-wallets' },
          solana: { createOnLogin: 'users-without-wallets' },
        },
        externalWallets: {
          solana: {
            connectors: toSolanaWalletConnectors({ shouldAutoConnect: false }),
          },
        },
      }}
    >
      <WalletContextInner
        setConnectChainOverride={setConnectChainOverride}
        pendingConnectOption={pendingConnectOption}
        setPendingConnectOption={setPendingConnectOption}
        queueConnectFromChainModal={queueConnectFromChainModal}
      >
        {children}
      </WalletContextInner>
    </PrivyProvider>
  );
};

export default WalletContextProvider;
