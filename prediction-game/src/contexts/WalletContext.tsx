import React, { createContext, useContext, useState, ReactNode } from 'react';

interface WalletContextType {
  isConnected: boolean;
  walletAddress: string | null;
  syraBalance: number;
  solBalance: number;
  connect: () => void;
  disconnect: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [syraBalance] = useState(5_500_000); // Mock 5.5M SYRA
  const [solBalance] = useState(12.5); // Mock 12.5 SOL

  const connect = () => {
    // Mock wallet connection
    setIsConnected(true);
    setWalletAddress('7xKX...9dFe'); // Mock address
  };

  const disconnect = () => {
    setIsConnected(false);
    setWalletAddress(null);
  };

  return (
    <WalletContext.Provider
      value={{
        isConnected,
        walletAddress,
        syraBalance,
        solBalance,
        connect,
        disconnect,
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
