import { FC, ReactNode, useMemo, useCallback, createContext, useContext, useState, useEffect } from 'react';
import { 
  ConnectionProvider, 
  WalletProvider,
  useWallet,
  useConnection
} from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { 
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  CoinbaseWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { WalletModalProvider, useWalletModal } from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';

// Import wallet adapter styles
import '@solana/wallet-adapter-react-ui/styles.css';

// USDC token mint on mainnet
const USDC_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');

// Custom RPC endpoint (can be configured via env)
const MAINNET_RPC = import.meta.env.VITE_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';

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

  // Fetch balances when wallet connects
  useEffect(() => {
    async function fetchBalances() {
      if (!publicKey || !connected) {
        setSolBalance(null);
        setUsdcBalance(null);
        return;
      }

      try {
        // Fetch SOL balance
        const balance = await connection.getBalance(publicKey);
        setSolBalance(balance / LAMPORTS_PER_SOL);

        // Fetch USDC balance
        try {
          const { getAssociatedTokenAddress } = await import('@solana/spl-token');
          const usdcAccount = await getAssociatedTokenAddress(USDC_MINT, publicKey);
          const accountInfo = await connection.getTokenAccountBalance(usdcAccount);
          setUsdcBalance(Number(accountInfo.value.uiAmount) || 0);
        } catch {
          // No USDC account exists
          setUsdcBalance(0);
        }
      } catch (error) {
        console.error('Error fetching balances:', error);
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

  const address = publicKey?.toBase58() || null;
  const shortAddress = address ? `${address.slice(0, 4)}...${address.slice(-4)}` : null;

  const contextValue: WalletContextState = useMemo(() => ({
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
  }), [
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
    publicKey
  ]);

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

  // Configure supported wallets
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new CoinbaseWalletAdapter(),
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <WalletContextInner>
            {children}
          </WalletContextInner>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

export default WalletContextProvider;
