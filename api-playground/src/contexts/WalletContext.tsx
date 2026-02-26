import { FC, ReactNode, useMemo, useCallback, createContext, useContext, useState, useEffect } from 'react';
import {
  ConnectionProvider,
  WalletProvider,
  useWallet,
  useConnection,
} from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  CoinbaseWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { WalletModalProviderFixed } from '@/components/WalletModalProviderFixed';
import type { EvmSigner } from '@/lib/x402Client';
import { createWalletClient, custom, getAddress } from 'viem';
import { base } from 'viem/chains';

// USDC token mint on mainnet
const USDC_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');

// Custom RPC endpoint (can be configured via env)
// Default to Ankr public endpoint which supports browser requests
// You can override this with VITE_SOLANA_RPC_URL in .env file
// Other browser-friendly options:
// - https://rpc.ankr.com/solana (free, supports browser)
// - https://solana-api.projectserum.com (free, may have CORS)
// - https://api.mainnet-beta.solana.com (official, but blocks browsers)
// For production, use a private RPC provider (Helius, QuickNode, Alchemy)
const MAINNET_RPC = import.meta.env.VITE_SOLANA_RPC_URL || 'https://rpc.ankr.com/solana';

const BASE_USDC = '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913' as const;

export interface WalletContextState {
  connected: boolean;
  connecting: boolean;
  address: string | null;
  shortAddress: string | null;
  solBalance: number | null;
  usdcBalance: number | null;
  network: string;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  signTransaction: (transaction: any) => Promise<any>;
  signMessage: (message: Uint8Array) => Promise<Uint8Array>;
  publicKey: PublicKey | null;
  /** Base (EVM) wallet */
  baseConnected: boolean;
  baseConnecting: boolean;
  baseAddress: string | null;
  baseShortAddress: string | null;
  baseUsdcBalance: number | null;
  connectBase: () => Promise<void>;
  disconnectBase: () => Promise<void>;
  getEvmSigner: () => Promise<EvmSigner | null>;
}

const WalletContext = createContext<WalletContextState | null>(null);

export function useWalletContext() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWalletContext must be used within WalletContextProvider');
  }
  return context;
}

// Inner provider that uses the wallet hooks
const WalletContextInner: FC<{ children: ReactNode }> = ({ children }) => {
  const { connection } = useConnection();
  const { 
    publicKey, 
    connected, 
    connecting,
    disconnect: walletDisconnect,
    signTransaction,
    signMessage,
  } = useWallet();
  const { setVisible } = useWalletModal();
  
  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [usdcBalance, setUsdcBalance] = useState<number | null>(null);
  const [baseAddress, setBaseAddress] = useState<string | null>(() => {
    try {
      const stored = typeof window !== 'undefined' ? localStorage.getItem('x402_playground_base_address') : null;
      return stored || null;
    } catch {
      return null;
    }
  });
  const [baseUsdcBalance, setBaseUsdcBalance] = useState<number | null>(null);
  const [baseConnecting, setBaseConnecting] = useState(false);

  // Persist Base address
  useEffect(() => {
    try {
      if (baseAddress) localStorage.setItem('x402_playground_base_address', baseAddress);
      else localStorage.removeItem('x402_playground_base_address');
    } catch {}
  }, [baseAddress]);

  // Fetch Base USDC balance when Base wallet is set
  useEffect(() => {
    if (!baseAddress || typeof window === 'undefined' || !window.ethereum) {
      setBaseUsdcBalance(null);
      return;
    }
    const abi = [{ type: 'function', name: 'balanceOf', inputs: [{ name: 'account', type: 'address' }], outputs: [{ type: 'uint256' }] }] as const;
    let cancelled = false;
    (async () => {
      try {
        const { createPublicClient, http, formatUnits } = await import('viem');
        const { base: baseChain } = await import('viem/chains');
        const client = createPublicClient({ chain: baseChain, transport: http() });
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

  // Fetch balances when wallet connects
  useEffect(() => {
    async function fetchBalances() {
      if (!publicKey || !connected) {
        setSolBalance(null);
        setUsdcBalance(null);
        return;
      }

      // Validate connection is available
      if (!connection) {
        return;
      }

      // Verify connection is working
      try {
        await connection.getVersion();
      } catch {
        return;
      }

      try {
        // Fetch SOL balance
        const balance = await connection.getBalance(publicKey, 'confirmed');
        const solBalanceValue = balance / LAMPORTS_PER_SOL;
        setSolBalance(solBalanceValue);

        // Fetch USDC balance using getParsedTokenAccountsByOwner
        // This finds USDC in ANY token account owned by the wallet, not just the associated one
        try {
          const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
            publicKey,
            { mint: USDC_MINT }
          );

          if (tokenAccounts.value.length > 0) {
            // Sum all USDC token accounts (in case user has multiple)
            const totalBalance = tokenAccounts.value.reduce((sum, account) => {
              const balance = account.account.data.parsed.info.tokenAmount.uiAmount;
              const balanceNum = Number(balance) || 0;
              return sum + balanceNum;
            }, 0);
            setUsdcBalance(totalBalance);
          } else {
            setUsdcBalance(0);
          }
        } catch {
          setUsdcBalance(0);
        }
      } catch {
        // Don't reset balances on error, keep previous values
      }
    }

    fetchBalances();
    
    // Set up interval to refresh balances
    const interval = setInterval(fetchBalances, 30000);
    return () => clearInterval(interval);
  }, [publicKey, connected, connection]);

  const connect = useCallback(async () => {
    setVisible(true);
  }, [setVisible]);

  const disconnect = useCallback(async () => {
    await walletDisconnect();
    setSolBalance(null);
    setUsdcBalance(null);
  }, [walletDisconnect]);

  const connectBase = useCallback(async () => {
    const eth = (window as unknown as { ethereum?: { request: (args: { method: string; params?: unknown[] }) => Promise<unknown> } }).ethereum;
    if (!eth) {
      console.warn('No Ethereum provider (e.g. MetaMask, Coinbase Wallet). Install one to pay with Base.');
      return;
    }
    setBaseConnecting(true);
    try {
      const accounts = (await eth.request({ method: 'eth_requestAccounts' })) as string[];
      if (accounts?.length) {
        try {
          await eth.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x2105' }],
          });
        } catch {
          try {
            await eth.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: '0x2105',
                chainName: 'Base Mainnet',
                nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
                rpcUrls: ['https://mainnet.base.org'],
              }],
            });
          } catch {}
        }
        setBaseAddress(getAddress(accounts[0]));
      }
    } finally {
      setBaseConnecting(false);
    }
  }, []);

  const disconnectBase = useCallback(() => {
    setBaseAddress(null);
    setBaseUsdcBalance(null);
  }, []);

  const getEvmSigner = useCallback((): Promise<EvmSigner | null> => {
    const eth = (window as unknown as { ethereum?: unknown }).ethereum;
    if (!baseAddress || !eth) return Promise.resolve(null);
    return (async () => {
      const { createWalletClient, custom } = await import('viem');
      const { base: baseChain } = await import('viem/chains');
      const walletClient = createWalletClient({
        chain: baseChain,
        transport: custom(eth as import('viem').EIP1193Provider),
      });
      const account = { address: getAddress(baseAddress), type: 'json-rpc' as const };
      return {
        address: baseAddress,
        signTypedData: async (args: Parameters<EvmSigner['signTypedData']>[0]) => {
          const sig = await walletClient.signTypedData({
            account,
            domain: args.domain,
            types: args.types,
            primaryType: args.primaryType,
            message: args.message,
          });
          return sig;
        },
      };
    })();
  }, [baseAddress]);

  const address = publicKey?.toBase58() || null;
  const shortAddress = address ? `${address.slice(0, 4)}...${address.slice(-4)}` : null;
  const baseShortAddress = baseAddress ? `${baseAddress.slice(0, 6)}...${baseAddress.slice(-4)}` : null;

  const contextValue: WalletContextState = useMemo(
    () => ({
      connected,
      connecting,
      address,
      shortAddress,
      solBalance,
      usdcBalance,
      network: 'Solana Mainnet',
      connect,
      disconnect,
      signTransaction: signTransaction as any,
      signMessage: signMessage as any,
      publicKey,
      baseConnected: !!baseAddress,
      baseConnecting: baseConnecting,
      baseAddress,
      baseShortAddress,
      baseUsdcBalance,
      connectBase,
      disconnectBase,
      getEvmSigner,
    }),
    [
      connected,
      connecting,
      address,
      shortAddress,
      solBalance,
      usdcBalance,
      connect,
      disconnect,
      signTransaction,
      signMessage,
      publicKey,
      baseAddress,
      baseConnecting,
      baseShortAddress,
      baseUsdcBalance,
      connectBase,
      disconnectBase,
      getEvmSigner,
    ]
  );

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  );
};

// Main provider component
export const WalletContextProvider: FC<{ children: ReactNode }> = ({ children }) => {
  // Use mainnet for real payments
  const network = WalletAdapterNetwork.Mainnet;
  const endpoint = useMemo(() => MAINNET_RPC, []);

  // Configure supported wallets with network
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter({ network }),
      new SolflareWalletAdapter({ network }),
      new CoinbaseWalletAdapter({ network }),
    ],
    [network]
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProviderFixed>
          <WalletContextInner>
            {children}
          </WalletContextInner>
        </WalletModalProviderFixed>
      </WalletProvider>
    </ConnectionProvider>
  );
};

export default WalletContextProvider;
