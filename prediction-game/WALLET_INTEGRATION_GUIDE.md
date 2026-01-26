# Solana Wallet Integration Guide

## Overview

This application now integrates real Solana wallet connectivity using the official `@solana/wallet-adapter` libraries. This provides seamless connection to popular Solana wallets like Phantom, Solflare, Torus, and Ledger.

## Architecture

### Key Components

1. **SolanaWalletProvider** (`src/contexts/SolanaWalletProvider.tsx`)
   - Main provider that wraps the entire app
   - Configures available wallets (Phantom, Solflare, Torus, Ledger)
   - Manages connection to Solana network (devnet/mainnet-beta)
   - Provides auto-connect functionality

2. **WalletContext** (`src/contexts/WalletContext.tsx`)
   - Custom context that wraps Solana wallet adapter hooks
   - Provides simplified API for components
   - Fetches and manages SOL balance
   - Placeholder for SYRA token balance (to be implemented)

3. **WalletModal** (`src/components/WalletModal.tsx`)
   - Custom UI for wallet selection and management
   - Shows available/installed wallets
   - Displays wallet info, balances, and tier status
   - Styled to match the Web3 theme

## Features

### Supported Wallets

- **Phantom** - Most popular Solana wallet
- **Solflare** - Secure Solana wallet with mobile support  
- **Torus** - Social login-based wallet
- **Ledger** - Hardware wallet support

### Current Functionality

✅ Wallet connection/disconnection
✅ Auto-detect installed wallets
✅ Real-time SOL balance fetching
✅ Wallet address display and copying
✅ Network configuration (devnet/mainnet-beta)
✅ Custom styled UI matching Web3 theme
✅ Connection status management

### Pending Implementation

⏳ SYRA token balance fetching (requires token mint address)
⏳ Transaction signing for prediction submissions
⏳ Smart contract integration
⏳ Event creation with on-chain transactions

## Configuration

### Network Selection

Edit `src/contexts/SolanaWalletProvider.tsx`:

```typescript
// For development (testnet)
const network = 'devnet';

// For production
const network = 'mainnet-beta';
```

### Custom RPC Endpoint

You can provide a custom RPC endpoint for better performance:

```typescript
const endpoint = useMemo(() => 
  'https://your-custom-rpc-endpoint.com', 
  []
);
```

Popular RPC providers:
- [Helius](https://helius.dev/)
- [QuickNode](https://www.quicknode.com/)
- [Alchemy](https://www.alchemy.com/)

## Usage in Components

### Basic Connection Check

```typescript
import { useWallet } from '@/contexts/WalletContext';

function MyComponent() {
  const { isConnected, walletAddress } = useWallet();
  
  if (!isConnected) {
    return <div>Please connect your wallet</div>;
  }
  
  return <div>Connected: {walletAddress}</div>;
}
```

### Access SOL Balance

```typescript
const { solBalance, refreshBalances } = useWallet();

// Display balance
<p>{solBalance} SOL</p>

// Refresh balance after transaction
await refreshBalances();
```

### Sign Transactions

```typescript
import { useWallet as useSolanaWallet } from '@solana/wallet-adapter-react';
import { Transaction } from '@solana/web3.js';

function TransactionComponent() {
  const { publicKey, sendTransaction } = useSolanaWallet();
  const { connection } = useConnection();
  
  const handleTransaction = async () => {
    if (!publicKey) return;
    
    const transaction = new Transaction().add(
      // Add your instructions here
    );
    
    const signature = await sendTransaction(transaction, connection);
    await connection.confirmTransaction(signature, 'confirmed');
  };
}
```

## Adding SYRA Token Balance

To fetch the SYRA token balance, you need:

1. **SYRA Token Mint Address**
2. **Update WalletContext.tsx**

```typescript
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { PublicKey } from '@solana/web3.js';

// Add SYRA token mint address
const SYRA_MINT_ADDRESS = new PublicKey('YOUR_SYRA_MINT_ADDRESS_HERE');

// In refreshBalances function:
const refreshBalances = async () => {
  if (publicKey && connection) {
    try {
      // Fetch SOL balance
      const balance = await connection.getBalance(publicKey);
      setSolBalance(balance / LAMPORTS_PER_SOL);
      
      // Fetch SYRA token balance
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
        publicKey,
        { mint: SYRA_MINT_ADDRESS }
      );
      
      if (tokenAccounts.value.length > 0) {
        const syraAmount = tokenAccounts.value[0].account.data.parsed.info.tokenAmount.uiAmount;
        setSyraBalance(syraAmount || 0);
      }
    } catch (error) {
      console.error('Error fetching balances:', error);
    }
  }
};
```

## Testing

### Local Development

1. Install Phantom wallet browser extension
2. Switch Phantom to Devnet
3. Get devnet SOL from https://faucet.solana.com/
4. Click "Connect Wallet" in the app
5. Select Phantom and approve connection
6. Your devnet SOL balance should appear

### Production Checklist

Before deploying to mainnet:

- [ ] Update network to 'mainnet-beta'
- [ ] Add SYRA token mint address
- [ ] Implement token balance fetching
- [ ] Test with small transactions first
- [ ] Add transaction confirmation UI
- [ ] Implement error handling for failed transactions
- [ ] Add loading states during transactions
- [ ] Test with multiple wallets
- [ ] Add Sentry or error tracking

## Security Best Practices

1. **Never request unnecessary permissions**
2. **Always show transaction details before signing**
3. **Validate all inputs before creating transactions**
4. **Use devnet for testing**
5. **Implement rate limiting for transaction submissions**
6. **Add transaction confirmation dialogs**
7. **Log all transaction errors**

## Troubleshooting

### Wallet Not Detected

- Ensure wallet extension is installed
- Refresh the page
- Check if wallet is unlocked
- Try a different browser

### Connection Fails

- Check network configuration
- Verify RPC endpoint is accessible
- Check browser console for errors
- Try disconnecting and reconnecting

### Balance Shows 0

- Ensure you're on the correct network
- Check if wallet has SOL
- Try refreshing balances manually
- Verify RPC endpoint is working

## Resources

- [Solana Wallet Adapter Docs](https://github.com/solana-labs/wallet-adapter)
- [Solana Web3.js Docs](https://solana-labs.github.io/solana-web3.js/)
- [Phantom Developer Docs](https://docs.phantom.app/)
- [Solana Cookbook](https://solanacookbook.com/)

## Next Steps

1. **Add Smart Contract Integration**
   - Connect to your Solana program
   - Implement prediction submission transactions
   - Add event creation logic

2. **Implement SYRA Token Features**
   - Token balance display
   - Tier calculation based on holdings
   - Token-gated features

3. **Enhanced Transaction Handling**
   - Transaction history
   - Pending transaction indicators
   - Transaction success/failure notifications

4. **Wallet Features**
   - Multi-wallet support (switch between wallets)
   - Account switching
   - Wallet activity log
