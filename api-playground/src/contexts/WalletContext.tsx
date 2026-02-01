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
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { WalletModalProviderFixed } from '@/components/WalletModalProviderFixed';

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
