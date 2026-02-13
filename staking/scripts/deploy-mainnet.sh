#!/bin/bash

# Deploy to mainnet (use with caution!)

echo "⚠️  WARNING: Deploying to MAINNET!"
echo "Make sure you have sufficient SOL for deployment."
read -p "Continue? (y/n) " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "Cancelled"
    exit 1
fi

# Set cluster to mainnet
solana config set --url mainnet-beta

# Check balance
echo "Wallet balance:"
solana balance

# Build first
anchor build

# Deploy
anchor deploy --provider.cluster mainnet-beta

if [ $? -eq 0 ]; then
    PROGRAM_ID=$(solana address -k target/deploy/staking-keypair.json)
    echo ""
    echo "✅ Deployment successful!"
    echo ""
    echo "Program ID: $PROGRAM_ID"
    echo ""
    echo "Update your .env.local:"
    echo "NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta"
    echo "NEXT_PUBLIC_STAKING_PROGRAM_ID=$PROGRAM_ID"
else
    echo "❌ Deployment failed"
    exit 1
fi
