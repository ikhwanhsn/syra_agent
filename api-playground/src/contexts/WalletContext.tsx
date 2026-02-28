import { FC, ReactNode, useMemo, useCallback, createContext, useContext, useState, useEffect, useRef } from 'react';
import { PrivyProvider, usePrivy, useLoginWithSiws } from '@privy-io/react-auth';
import { useWallets as usePrivyEvmWallets } from '@privy-io/react-auth';
import { useWallets as usePrivySolanaWallets, useSignTransaction, useSignMessage } from '@privy-io/react-auth/solana';
import { toSolanaWalletConnectors } from '@privy-io/react-auth/solana';
import { LAMPORTS_PER_SOL, PublicKey, VersionedTransaction } from '@solana/web3.js';
import { Connection } from '@solana/web3.js';
import type { EvmSigner } from '@/lib/x402Client';
import { createWalletClient, custom, getAddress } from 'viem';
import { base } from 'viem/chains';
import { toast } from '@/hooks/use-toast';

// USDC token mint on mainnet
const USDC_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');

const MAINNET_RPC = import.meta.env.VITE_SOLANA_RPC_URL || 'https://rpc.ankr.com/solana';
const BASE_USDC = '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913' as const;

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
  connect: () => Promise<void>;
  /** Connect for a specific chain so Phantom (and other multi-chain wallets) are used for that chain only. Use this for the main Connect button to avoid "Unsupported account" when Phantom is Solana. */
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
  /** Set before opening Privy connect so provider uses single chain and skips "Select network". Clear after connect flow. */
  setConnectChainOverride: (v: 'ethereum-only' | 'solana-only' | null) => void;
  /** Open Privy login modal (email, social, etc.) for web2 users. */
  openLoginModal: () => void;
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

type WalletChainOverride = 'ethereum-only' | 'solana-only' | null;

const WalletContextInner: FC<{ children: ReactNode; connectChainOverride: WalletChainOverride; setConnectChainOverride: (v: WalletChainOverride) => void }> = ({ children, connectChainOverride, setConnectChainOverride }) => {
  const { ready: privyReady, authenticated, login, logout, connectWallet } = usePrivy();
  const { generateSiwsMessage, loginWithSiws } = useLoginWithSiws();
  const { wallets: solanaWallets, ready: solanaWalletsReady } = usePrivySolanaWallets();
  const { wallets: evmWallets } = usePrivyEvmWallets();
  const { signTransaction: privySignTransaction } = useSignTransaction();
  const { signMessage: privySignMessage } = useSignMessage();

  /** Track which Solana address we already attempted SIWS for (avoid duplicate runs when unauthenticated) */
  const siwsAttemptedForRef = useRef<string | null>(null);

  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [usdcBalance, setUsdcBalance] = useState<number | null>(null);
  const [baseUsdcBalance, setBaseUsdcBalance] = useState<number | null>(null);

  // First Solana wallet (linked/connected)
  const solanaWallet = solanaWallets?.[0] ?? null;
  const address = solanaWallet?.address ?? null;
  const publicKey = address ? new PublicKey(address) : null;
  const connected = !!(authenticated && solanaWallet);

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
  useEffect(() => {
    const wallet = solanaWallets?.[0];
    if (!privyReady || authenticated || !wallet?.address) return;
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
          console.warn('[Privy] SIWS login failed:', e);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [privyReady, authenticated, solanaWallets, generateSiwsMessage, loginWithSiws, privySignMessage]);

  // Only open wallet/login when user explicitly triggers (e.g. Connect Wallet button). Never call login() or connectWallet() on mount.
  const connect = useCallback(async () => {
    if (!privyReady) return;
    if (!authenticated) {
      login();
      return;
    }
    connectWallet();
  }, [privyReady, authenticated, login, connectWallet]);

  const openLoginModal = useCallback(() => {
    if (privyReady) login();
  }, [privyReady, login]);

  /** Open connect/login. When unauthenticated call login() so the modal opens (connectWallet alone can error). When authenticated, use chain-specific wallet list + walletChainType so Privy links the wallet for the correct chain (e.g. MetaMask as Ethereum/Base, not Solana). See Privy docs: connectWallet({ walletList, walletChainType: 'ethereum' | 'solana' }). */
  const connectForChain = useCallback(
    async (chain: 'solana' | 'base') => {
      if (!privyReady) {
        if (import.meta.env.DEV) console.warn('[Privy] Connect skipped: SDK not ready yet. Wait a moment and try again.');
        return;
      }
      const solanaList = ['phantom', 'solflare', 'coinbase_wallet', 'detected_solana_wallets'];
      const evmList = ['metamask', 'coinbase_wallet', 'rainbow', 'detected_ethereum_wallets'];

      if (!authenticated) {
        login();
        return;
      }
      // Use 'ethereum-only' / 'solana-only' so Privy skips its "Select network" step (user already chose in our modal)
      const walletList = chain === 'base' ? evmList : solanaList;
      const walletChainType = chain === 'base' ? 'ethereum-only' : 'solana-only';
      connectWallet({ walletList, walletChainType });
    },
    [privyReady, authenticated, login, connectWallet]
  );

  const disconnect = useCallback(async () => {
    siwsAttemptedForRef.current = null;
    setSolBalance(null);
    setUsdcBalance(null);
    setBaseUsdcBalance(null);
    try {
      await logout();
    } catch (e) {
      console.error('Logout failed:', e);
    }
  }, [logout]);

  const connectBase = useCallback(async () => {
    if (!authenticated) {
      login();
      return;
    }
    connectWallet({ walletList: ['metamask', 'coinbase_wallet', 'rainbow', 'detected_ethereum_wallets'] });
  }, [authenticated, login, connectWallet]);

  const connectSolana = useCallback(async () => {
    if (!authenticated) {
      login();
      return;
    }
    connectWallet({ walletList: ['phantom', 'solflare', 'coinbase_wallet', 'detected_solana_wallets'] });
  }, [authenticated, login, connectWallet]);

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
      setConnectChainOverride,
      openLoginModal,
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
      setConnectChainOverride,
      openLoginModal,
    ]
  );

  return <WalletContext.Provider value={contextValue}>{children}</WalletContext.Provider>;
};

const PRIVY_APP_ID = import.meta.env.VITE_PRIVY_APP_ID || '';
const PRIVY_CLIENT_ID = import.meta.env.VITE_PRIVY_CLIENT_ID || '';

// In dev, remind to add this exact origin in Privy Dashboard so Phantom (SIWS) login works
if (import.meta.env.DEV && typeof window !== 'undefined') {
  const origin = window.location.origin;
  if (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) {
    console.info(
      `[Privy] To fix Phantom login 403, add this EXACT origin in Privy Dashboard → Domains → Allowed origins:\n  ${origin}\n(127.0.0.1 and localhost are different — add both if you use both.) See api-playground/PRIVY_SETUP.md`
    );
  }
}

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
  connect: async () => {
    if (import.meta.env.DEV) console.warn('[Privy] Set VITE_PRIVY_APP_ID in .env to connect wallets.');
  },
  connectForChain: async () => {
    if (import.meta.env.DEV) console.warn('[Privy] Set VITE_PRIVY_APP_ID in .env to connect wallets.');
  },
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
  setConnectChainOverride: () => {},
  openLoginModal: () => {},
};

export const WalletContextProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [connectChainOverride, setConnectChainOverride] = useState<WalletChainOverride>(null);

  if (!PRIVY_APP_ID?.trim()) {
    if (import.meta.env.DEV) {
      console.warn('VITE_PRIVY_APP_ID is not set. Set it in api-playground/.env to use Privy (Solana + Base).');
    }
    return (
      <WalletContext.Provider value={FALLBACK_WALLET_STATE}>
        {children}
      </WalletContext.Provider>
    );
  }
  // When user picks chain in our modal we set connectChainOverride so Privy uses single chain and skips "Select network"
  const walletChainType = connectChainOverride ?? 'ethereum-and-solana';
  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      {...(PRIVY_CLIENT_ID ? { clientId: PRIVY_CLIENT_ID } : {})}
      config={{
        appearance: {
          walletChainType,
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
      <WalletContextInner connectChainOverride={connectChainOverride} setConnectChainOverride={setConnectChainOverride}>
        {children}
      </WalletContextInner>
    </PrivyProvider>
  );
};

export default WalletContextProvider;
