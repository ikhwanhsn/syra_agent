import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Type-safe interfaces
interface PublicKey {
  toBase58: () => string;
}

interface WalletContextType {
  isConnected: boolean;
  walletAddress: string | null;
  publicKey: PublicKey | null;
  syraBalance: number;
  solBalance: number;
  connecting: boolean;
  connect: () => void;
  disconnect: () => void;
  refreshBalances: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

// Check if Solana packages are available
let useSolanaWallet: any;
let useConnection: any;
let LAMPORTS_PER_SOL: number = 1000000000;
let hasSolanaPackages = false;

try {
  const walletAdapter = require('@solana/wallet-adapter-react');
  const web3 = require('@solana/web3.js');
  useSolanaWallet = walletAdapter.useWallet;
  useConnection = walletAdapter.useConnection;
  LAMPORTS_PER_SOL = web3.LAMPORTS_PER_SOL;
  hasSolanaPackages = true;
} catch (error) {
  console.warn('Solana wallet adapter packages not installed. Using mock wallet.');
  // Mock implementations
  useSolanaWallet = () => ({
    publicKey: null,
    connected: false,
    connecting: false,
    disconnect: () => {},
    wallet: null,
    select: () => {},
  });
  useConnection = () => ({ connection: null });
}

export const WalletProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [solBalance, setSolBalance] = useState<number>(0);
  const [syraBalance, setSyraBalance] = useState<number>(5_500_000); // Mock SYRA balance
  const [connecting, setConnecting] = useState(false);

  let solanaWallet: any = { publicKey: null, connected: false, connecting: false, disconnect: () => {}, wallet: null };
  let solanaConnection: any = { connection: null };

  if (hasSolanaPackages) {
    solanaWallet = useSolanaWallet();
    solanaConnection = useConnection();
  }

  const { publicKey, connected, disconnect: disconnectWallet, wallet } = solanaWallet;
  const { connection } = solanaConnection;

  // Fetch SOL balance when wallet connects
  const refreshBalances = async () => {
    if (hasSolanaPackages && publicKey && connection) {
      try {
        const balance = await connection.getBalance(publicKey);
        setSolBalance(balance / LAMPORTS_PER_SOL);
        
        // TODO: Add logic to fetch SYRA token balance
        // You'll need to fetch the SPL token account for your SYRA token
        // const syraTokenAccount = await connection.getTokenAccountBalance(syraTokenAddress);
        // setSyraBalance(syraTokenAccount.value.uiAmount || 0);
      } catch (error) {
        console.error('Error fetching balances:', error);
      }
    }
  };

  useEffect(() => {
    if (hasSolanaPackages) {
      setIsConnected(connected);
      setWalletAddress(publicKey ? publicKey.toBase58() : null);
      
      if (connected && publicKey) {
        refreshBalances();
      } else {
        setSolBalance(0);
      }
    }
  }, [connected, publicKey, connection]);

  const connect = () => {
    if (!hasSolanaPackages) {
      // Mock connection for development without packages
      setIsConnected(true);
      setWalletAddress('7xKX...9dFe');
      setSolBalance(12.5);
      return;
    }
    
    // If no wallet is selected, the WalletModal will handle wallet selection
    if (!wallet) {
      return;
    }
  };

  const disconnect = () => {
    if (!hasSolanaPackages) {
      setIsConnected(false);
      setWalletAddress(null);
      setSolBalance(0);
      return;
    }
    
    disconnectWallet();
  };

  return (
    <WalletContext.Provider
      value={{
        isConnected,
        walletAddress,
        publicKey,
        syraBalance,
        solBalance,
        connecting: hasSolanaPackages ? solanaWallet.connecting : connecting,
        connect,
        disconnect,
        refreshBalances,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};
