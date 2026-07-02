# Syra ERC-20 on BNB Smart Chain

Minimal fixed-supply ERC-20 (`Syra` / `SYRA`) for DappBay listing. No mint, no fees, no blacklist — low risk profile for DappBay's scanner.

## Prerequisites

1. **BNB** on BSC Mainnet in your deployer wallet (~0.01 BNB is enough for deploy + verify).
2. **Private key** for the deployer wallet.
3. **Etherscan API key** (V2) from [etherscan.io/myapikey](https://etherscan.io/myapikey) — works for BscScan verification.

## Setup

```bash
cd contracts
npm install
cp .env.example .env
```

Edit `.env`:

```env
PRIVATE_KEY=your_private_key_without_0x_prefix_or_with_0x
ETHERSCAN_API_KEY=your_etherscan_api_key
```

## Compile

```bash
npm run compile
```

## Deploy to BSC Mainnet

```bash
npm run deploy:bsc
```

Output includes the contract address and a ready-to-run verify command.

Default token params:

| Field | Value |
|-------|-------|
| Name | Syra |
| Symbol | SYRA |
| Decimals | 18 |
| Supply | 1,000,000,000 SYRA (minted to deployer) |

## Verify on BscScan

After deploy, run (replace values from deploy output):

```bash
npx hardhat verify --network bsc <CONTRACT_ADDRESS> "1000000000000000000000000000" "<RECIPIENT_ADDRESS>"
```

Example:

```bash
npx hardhat verify --network bsc 0xYourContractAddress "1000000000000000000000000000" "0xYourWalletAddress"
```

Confirmed verified contract: green checkmark on [bscscan.com](https://bscscan.com).

## Submit to DappBay

1. Go to [dappbay.bnbchain.org/submit-dapp](https://dappbay.bnbchain.org/submit-dapp).
2. Connect the wallet you used to deploy.
3. Fill in project details (name, description, logo, GitHub, website).
4. Paste the **verified contract address** from deploy output.
5. Optional: run the address through DappBay's [risk scanner](https://dappbay.bnbchain.org/) first.

## Security

- Never commit `.env` or private keys.
- This is a listing token, not a production treasury contract.
- Full supply is minted once at deploy to the recipient address.
