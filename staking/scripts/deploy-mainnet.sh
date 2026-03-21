#!/bin/bash

# Deploy SYRA staking program to Solana mainnet
# Token: $SYRA 8a3sEw2kizHxVnT9oLEVLADx8fTMPkjbEGSraqNWpump
# Line endings must be LF (Unix). If you see $'\r' errors on Windows, run:
#   sed -i 's/\r$//' scripts/deploy-mainnet.sh

echo "WARNING: Deploying to MAINNET!"
echo "Make sure you have sufficient SOL for deployment."
echo "SYRA Token Mint: 8a3sEw2kizHxVnT9oLEVLADx8fTMPkjbEGSraqNWpump"
read -p "Continue? (y/n) " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "Cancelled"
    exit 1
fi

solana config set --url mainnet-beta

echo "Wallet balance:"
solana balance

anchor build

anchor deploy --provider.cluster mainnet-beta

if [ $? -eq 0 ]; then
    PROGRAM_ID=$(solana address -k target/deploy/staking-keypair.json)
    echo ""
    echo "Deployment successful!"
    echo ""
    echo "Program ID: $PROGRAM_ID"
    echo ""
    echo "Next steps:"
    echo "1. Update .env.local with:"
    echo "   NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta"
    echo "   NEXT_PUBLIC_STAKING_PROGRAM_ID=$PROGRAM_ID"
    echo "   NEXT_PUBLIC_STAKING_MINT=8a3sEw2kizHxVnT9oLEVLADx8fTMPkjbEGSraqNWpump"
    echo "   NEXT_PUBLIC_REWARD_MINT=8a3sEw2kizHxVnT9oLEVLADx8fTMPkjbEGSraqNWpump"
    echo ""
    echo "2. Initialize the pool: npm run init-pool"
    echo "3. Fund the reward vault: npm run fund-reward-vault"
else
    echo "Deployment failed"
    exit 1
fi
