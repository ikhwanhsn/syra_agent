import React, { FC, useMemo } from 'react';

// Check if packages are available
let hasSolanaPackages = false;
let ConnectionProvider: any;
let WalletProvider: any;
let WalletModalProvider: any;
let PhantomWalletAdapter: any;
let SolflareWalletAdapter: any;
let TorusWalletAdapter: any;
let LedgerWalletAdapter: any;
let clusterApiUrl: any;

try {
  const walletAdapterReact = require('@solana/wallet-adapter-react');
  const walletAdapterReactUi = require('@solana/wallet-adapter-react-ui');
  const walletAdapterWallets = require('@solana/wallet-adapter-wallets');
  const web3 = require('@solana/web3.js');
  
  ConnectionProvider = walletAdapterReact.ConnectionProvider;
  WalletProvider = walletAdapterReact.WalletProvider;
  WalletModalProvider = walletAdapterReactUi.WalletModalProvider;
  PhantomWalletAdapter = walletAdapterWallets.PhantomWalletAdapter;
  SolflareWalletAdapter = walletAdapterWallets.SolflareWalletAdapter;
  TorusWalletAdapter = walletAdapterWallets.TorusWalletAdapter;
  LedgerWalletAdapter = walletAdapterWallets.LedgerWalletAdapter;
  clusterApiUrl = web3.clusterApiUrl;
  
  // Import wallet adapter CSS
  require('@solana/wallet-adapter-react-ui/styles.css');
  
  hasSolanaPackages = true;
} catch (error) {
  console.warn('Solana wallet adapter packages not installed. Please run: npm install');
  // Provide fallback component
  hasSolanaPackages = false;
}

interface SolanaWalletProviderProps {
  children: React.ReactNode;
}

export const SolanaWalletProvider: FC<SolanaWalletProviderProps> = ({ children }) => {
  // If Solana packages aren't installed, just pass through children
  if (!hasSolanaPackages) {
    return <>{children}</>;
  }

  // You can use 'devnet', 'testnet', or 'mainnet-beta'
  const network = 'devnet'; // Change to 'mainnet-beta' for production
  
  // You can also provide a custom RPC endpoint
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);

  // Initialize wallets
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new TorusWalletAdapter(),
      new LedgerWalletAdapter(),
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};
