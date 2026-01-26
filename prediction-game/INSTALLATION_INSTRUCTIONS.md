# Installation Instructions for Wallet Integration

## Issue: NPM Permission Error

If you're encountering `EPERM` errors during installation, follow these steps:

## Solution 1: Close All Applications and Reinstall

1. **Close all applications** that might be using the node_modules folder:
   - Close your IDE/Code editor
   - Stop the development server
   - Close any terminal windows

2. **Open a new terminal as Administrator**:
   - Right-click on PowerShell/Command Prompt
   - Select "Run as Administrator"

3. **Navigate to project directory**:
   ```bash
   cd d:\business\syra-monorepo\prediction-game
   ```

4. **Install the Solana wallet packages**:
   ```bash
   npm install @solana/wallet-adapter-base @solana/wallet-adapter-react @solana/wallet-adapter-react-ui @solana/wallet-adapter-wallets @solana/web3.js
   ```

## Solution 2: Delete node_modules and Reinstall

If Solution 1 doesn't work:

1. **Delete node_modules** (close all apps first):
   ```bash
   rmdir /s /q node_modules
   ```

2. **Reinstall all dependencies**:
   ```bash
   npm install
   ```

## Solution 3: Use Yarn (Alternative)

If npm continues to have issues:

1. **Install Yarn** (if not installed):
   ```bash
   npm install -g yarn
   ```

2. **Install dependencies with Yarn**:
   ```bash
   yarn install
   ```

## Verification

After successful installation, verify the packages are installed:

```bash
npm list @solana/wallet-adapter-react
```

You should see the wallet adapter packages listed.

## Running the Application

Once installed, start the development server:

```bash
npm run dev
```

## Testing Wallet Connection

1. Install [Phantom Wallet](https://phantom.app/) browser extension
2. Switch Phantom to **Devnet** (Settings > Developer Settings > Change Network > Devnet)
3. Get devnet SOL from [Solana Faucet](https://faucet.solana.com/)
4. Open the application and click "Connect Wallet"
5. Select Phantom and approve the connection
6. Your devnet SOL balance should appear in the wallet modal

## Configuration for Production

Before deploying to mainnet, update `src/contexts/SolanaWalletProvider.tsx`:

```typescript
// Change this line:
const network = 'devnet';

// To:
const network = 'mainnet-beta';
```

## Troubleshooting

### Wallet Not Detected
- Refresh the page
- Ensure Phantom extension is installed and unlocked
- Try a different browser

### TypeScript Errors
If you see TypeScript errors related to Solana packages, try:
```bash
npm install --save-dev @types/bn.js
```

### Build Errors
Clear the build cache:
```bash
rm -rf dist
npm run build
```

## Need Help?

Check the comprehensive [Wallet Integration Guide](./WALLET_INTEGRATION_GUIDE.md) for detailed documentation.
