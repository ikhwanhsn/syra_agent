import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useWallet as useSolanaWallet, useConnection } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { LAMPORTS_PER_SOL, PublicKey, Transaction, SystemProgram } from '@solana/web3.js';

// SYRA Token Mint Address
const SYRA_TOKEN_MINT = '8a3sEw2kizHxVnT9oLEVLADx8fTMPkjbEGSraqNWpump';

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
  sendSol: (amount: number, recipient?: string) => Promise<string | null>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [solBalance, setSolBalance] = useState<number>(0);
  const [syraBalance, setSyraBalance] = useState<number>(0);
  
  // Get wallet state from Solana wallet adapter
  const { 
    publicKey, 
    connected, 
    connecting,
    disconnect: disconnectWallet,
    sendTransaction,
    signTransaction,
  } = useSolanaWallet();
  
  const { connection } = useConnection();
  const { setVisible } = useWalletModal();

  // Fetch SOL and SYRA balance when wallet connects
  const refreshBalances = useCallback(async () => {
    if (publicKey && connection) {
      try {
        // Fetch SOL balance
        const balance = await connection.getBalance(publicKey);
        setSolBalance(balance / LAMPORTS_PER_SOL);
        
        // Fetch SYRA token balance
        try {
          const syraTokenMint = new PublicKey(SYRA_TOKEN_MINT);
          const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
            publicKey, 
            { mint: syraTokenMint }
          );
          
          if (tokenAccounts.value.length > 0) {
            const tokenBalance = tokenAccounts.value[0].account.data.parsed.info.tokenAmount.uiAmount;
            setSyraBalance(tokenBalance || 0);
          } else {
            // No SYRA token account found - user has 0 SYRA
            setSyraBalance(0);
          }
        } catch (tokenError) {
          console.warn('Error fetching SYRA token balance:', tokenError);
          setSyraBalance(0);
        }
      } catch (error) {
        console.error('Error fetching balances:', error);
      }
    } else {
      setSolBalance(0);
      setSyraBalance(0);
    }
  }, [publicKey, connection]);

  // Refresh balances when wallet connects or changes
  useEffect(() => {
    if (connected && publicKey) {
      refreshBalances();
    } else {
      setSolBalance(0);
      setSyraBalance(0);
    }
  }, [connected, publicKey, refreshBalances]);

  // Subscribe to SOL balance changes for real-time updates
  useEffect(() => {
    if (!publicKey || !connection) return;

    const subscriptionId = connection.onAccountChange(
      publicKey,
      (accountInfo) => {
        setSolBalance(accountInfo.lamports / LAMPORTS_PER_SOL);
      },
      'confirmed'
    );

    return () => {
      connection.removeAccountChangeListener(subscriptionId);
    };
  }, [publicKey, connection]);

  // Subscribe to SYRA token account changes
  useEffect(() => {
    if (!publicKey || !connection) return;

    const subscribeToTokenAccount = async () => {
      try {
        const syraTokenMint = new PublicKey(SYRA_TOKEN_MINT);
        const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
          publicKey, 
          { mint: syraTokenMint }
        );
        
        if (tokenAccounts.value.length > 0) {
          const tokenAccountPubkey = tokenAccounts.value[0].pubkey;
          
          const subscriptionId = connection.onAccountChange(
            tokenAccountPubkey,
            async () => {
              // Refresh SYRA balance when token account changes
              const updatedAccounts = await connection.getParsedTokenAccountsByOwner(
                publicKey, 
                { mint: syraTokenMint }
              );
              if (updatedAccounts.value.length > 0) {
                const balance = updatedAccounts.value[0].account.data.parsed.info.tokenAmount.uiAmount;
                setSyraBalance(balance || 0);
              }
            },
            'confirmed'
          );
          
          return () => {
            connection.removeAccountChangeListener(subscriptionId);
          };
        }
      } catch (error) {
        console.warn('Error subscribing to SYRA token account:', error);
      }
    };

    subscribeToTokenAccount();
  }, [publicKey, connection]);

  const connect = useCallback(() => {
    // Open the wallet modal to let user select a wallet
    setVisible(true);
  }, [setVisible]);

  const disconnect = useCallback(() => {
    disconnectWallet();
    setSolBalance(0);
    setSyraBalance(0);
  }, [disconnectWallet]);

  // Send SOL to a recipient (or treasury for event creation)
  const sendSol = useCallback(async (amount: number, recipient?: string): Promise<string | null> => {
    if (!publicKey || !connection || !sendTransaction) {
      throw new Error('Wallet not connected');
    }

    try {
      // Default recipient is a treasury/escrow address - you should set this to your actual treasury
      const recipientPubkey = recipient 
        ? new PublicKey(recipient) 
        : publicKey; // For now, sends to self as placeholder

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: recipientPubkey,
          lamports: Math.floor(amount * LAMPORTS_PER_SOL),
        })
      );

      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      const signature = await sendTransaction(transaction, connection);
      
      // Wait for confirmation
      await connection.confirmTransaction(signature, 'confirmed');
      
      // Refresh balances after transaction
      await refreshBalances();
      
      return signature;
    } catch (error) {
      console.error('Error sending SOL:', error);
      throw error;
    }
  }, [publicKey, connection, sendTransaction, refreshBalances]);

  return (
    <WalletContext.Provider
      value={{
        isConnected: connected,
        walletAddress: publicKey ? publicKey.toBase58() : null,
        publicKey,
        syraBalance,
        solBalance,
        connecting,
        connect,
        disconnect,
        refreshBalances,
        sendSol,
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
