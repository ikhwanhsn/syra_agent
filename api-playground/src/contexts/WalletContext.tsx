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
        console.error('[Wallet] Solana connection not available');
        return;
      }

      // Verify connection is working
      try {
        const version = await connection.getVersion();
        console.log('[Wallet] Connected to Solana:', version);
      } catch (connError: any) {
        console.error('[Wallet] Connection test failed:', connError);
        // Check if it's a 403 CORS error
        if (connError?.message?.includes('403') || connError?.message?.includes('forbidden')) {
          console.error('[Wallet] RPC endpoint is blocking browser requests (CORS issue)');
          console.error('[Wallet] Please update VITE_SOLANA_RPC_URL in .env to use a browser-friendly endpoint:');
          console.error('[Wallet] Options: https://rpc.ankr.com/solana or your own RPC provider');
        }
        return;
      }

      try {
        // Fetch SOL balance
        console.log('[Wallet] Fetching SOL balance for:', publicKey.toBase58());
        console.log('[Wallet] RPC endpoint:', MAINNET_RPC);
        
        const balance = await connection.getBalance(publicKey, 'confirmed');
        const solBalanceValue = balance / LAMPORTS_PER_SOL;
        console.log('[Wallet] SOL balance (lamports):', balance);
        console.log('[Wallet] SOL balance (SOL):', solBalanceValue);
        setSolBalance(solBalanceValue);

        // Fetch USDC balance using getParsedTokenAccountsByOwner
        // This finds USDC in ANY token account owned by the wallet, not just the associated one
        try {
          console.log('[Wallet] Fetching USDC balance for:', publicKey.toBase58());
          console.log('[Wallet] USDC mint:', USDC_MINT.toBase58());
          
          const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
            publicKey,
            { mint: USDC_MINT }
          );

          console.log('[Wallet] Found', tokenAccounts.value.length, 'USDC token account(s)');

          if (tokenAccounts.value.length > 0) {
            // Sum all USDC token accounts (in case user has multiple)
            const totalBalance = tokenAccounts.value.reduce((sum, account) => {
              const balance = account.account.data.parsed.info.tokenAmount.uiAmount;
              const balanceNum = Number(balance) || 0;
              console.log('[Wallet] USDC account:', account.pubkey.toBase58(), 'balance:', balanceNum);
              return sum + balanceNum;
            }, 0);
            console.log('[Wallet] Total USDC balance:', totalBalance);
            setUsdcBalance(totalBalance);
          } else {
            // No USDC token account found - user has 0 USDC
            console.log('[Wallet] No USDC token accounts found');
            setUsdcBalance(0);
          }
        } catch (tokenError) {
          console.error('[Wallet] Error fetching USDC token balance:', tokenError);
          console.error('[Wallet] Error details:', {
            message: tokenError instanceof Error ? tokenError.message : String(tokenError),
            stack: tokenError instanceof Error ? tokenError.stack : undefined
          });
          setUsdcBalance(0);
        }
      } catch (error) {
        console.error('[Wallet] Error fetching balances:', error);
        console.error('[Wallet] Error details:', {
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        });
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
  const endpoint = useMemo(() => {
    const rpcUrl = MAINNET_RPC;
    console.log('[Wallet] Using RPC endpoint:', rpcUrl);
    return rpcUrl;
  }, []);

  // Configure supported wallets with network
  const wallets = useMemo(
    () => {
      console.log('[Wallet] Initializing wallets for network:', network);
      return [
        new PhantomWalletAdapter({ network }),
        new SolflareWalletAdapter({ network }),
        new CoinbaseWalletAdapter({ network }),
      ];
    },
    [network]
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
