#!/bin/bash

# Build the Anchor program

echo "Building staking program..."

anchor build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo "Program keypair: target/deploy/staking-keypair.json"
    echo "Program ID: $(solana address -k target/deploy/staking-keypair.json)"
else
    echo "❌ Build failed"
    exit 1
fi
