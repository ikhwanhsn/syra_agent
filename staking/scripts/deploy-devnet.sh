#!/bin/bash

# Deploy to devnet

echo "Deploying to devnet..."

# Set cluster to devnet
solana config set --url devnet

# Check balance
echo "Wallet balance:"
solana balance

# Build first
anchor build

# Deploy
anchor deploy --provider.cluster devnet

if [ $? -eq 0 ]; then
    PROGRAM_ID=$(solana address -k target/deploy/staking-keypair.json)
    echo ""
    echo "✅ Deployment successful!"
    echo ""
    echo "Program ID: $PROGRAM_ID"
    echo ""
    echo "Add this to your .env.local:"
    echo "NEXT_PUBLIC_STAKING_PROGRAM_ID=$PROGRAM_ID"
else
    echo "❌ Deployment failed"
    exit 1
fi
