import React, { createContext, useContext, useState, useEffect, useRef, ReactNode, useCallback } from 'react';
import { useWallet as useSolanaWallet, useConnection } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { LAMPORTS_PER_SOL, PublicKey, Transaction, SystemProgram } from '@solana/web3.js';

// SYRA Token Mint Address
const SYRA_TOKEN_MINT = '8a3sEw2kizHxVnT9oLEVLADx8fTMPkjbEGSraqNWpump';

/** Poll interval for confirmation (ms). Avoids signatureSubscribe which fails on HTTP-only RPCs. */
const CONFIRM_POLL_MS = 1500;
const CONFIRM_TIMEOUT_MS = 60_000;

/** Wait for tx confirmation using HTTP-only getSignatureStatuses (no WebSocket). */
async function confirmTransactionByPolling(
  connection: import('@solana/web3.js').Connection,
  signature: string,
  lastValidBlockHeight: number
): Promise<{ confirmed: boolean; err?: string }> {
  const start = Date.now();
  while (Date.now() - start < CONFIRM_TIMEOUT_MS) {
    try {
      const currentHeight = await connection.getBlockHeight('confirmed');
      if (currentHeight > lastValidBlockHeight) {
        return { confirmed: false, err: 'Signature expired' };
      }
      const { value } = await connection.getSignatureStatuses([signature]);
      const status = value?.[0];
      if (status?.err) return { confirmed: false, err: String(status.err) };
      if (
        status?.confirmationStatus === 'confirmed' ||
        status?.confirmationStatus === 'finalized' ||
        status?.confirmationStatus === 'processed'
      ) {
        return { confirmed: true };
      }
    } catch {
      // Transient RPC error; keep polling
    }
    await new Promise((r) => setTimeout(r, CONFIRM_POLL_MS));
  }
  return { confirmed: false, err: 'Confirmation timeout' };
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
          setSyraBalance(0);
        }
      } catch (error) {
        // Silently fail; balances may refresh on retry
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

  // Poll balances periodically instead of onAccountChange (avoids WebSocket signatureSubscribe/accountSubscribe on HTTP-only RPCs)
  const balancePollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (!publicKey || !connection) return;
    const poll = () => refreshBalances();
    poll();
    balancePollIntervalRef.current = setInterval(poll, 10_000);
    return () => {
      if (balancePollIntervalRef.current) {
        clearInterval(balancePollIntervalRef.current);
        balancePollIntervalRef.current = null;
      }
    };
  }, [publicKey, connection, refreshBalances]);

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

      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      const signature = await sendTransaction(transaction, connection);

      // Wait for confirmation via HTTP polling (avoids signatureSubscribe on HTTP-only RPCs)
      const { confirmed } = await confirmTransactionByPolling(connection, signature, lastValidBlockHeight);
      if (!confirmed) {
        // Tx may still land; refresh and return signature so user can check explorer
        await refreshBalances();
        return signature;
      }

      await refreshBalances();
      
      return signature;
    } catch (error) {
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
