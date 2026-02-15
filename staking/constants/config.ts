import { PublicKey } from "@solana/web3.js";

/**
 * Staking dApp configuration.
 * Change these values for devnet vs mainnet and your deployed program.
 */

export const IS_DEVNET = process.env.NEXT_PUBLIC_SOLANA_NETWORK !== "mainnet-beta";

export const CONFIG = {
  /** Solana RPC endpoint. Use .env for secrets. */
  rpcEndpoint:
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
    (IS_DEVNET
      ? "https://api.devnet.solana.com"
      : "https://api.mainnet.solana.com"),

  /** Your deployed Anchor staking program ID */
  programId: new PublicKey(
    process.env.NEXT_PUBLIC_STAKING_PROGRAM_ID ||
      "11111111111111111111111111111111"
  ),

  /** SPL token mint that users stake */
  stakingMint: new PublicKey(
    process.env.NEXT_PUBLIC_STAKING_MINT ||
      "11111111111111111111111111111111"
  ),

  /** SPL token mint used for rewards */
  rewardMint: new PublicKey(
    process.env.NEXT_PUBLIC_REWARD_MINT ||
      "11111111111111111111111111111111"
  ),

  /**
   * Reward emission per second (in reward token smallest units).
   * Used for APR display and must match program's reward_per_second.
   */
  rewardPerSecond:
    Number(process.env.NEXT_PUBLIC_REWARD_PER_SECOND || "0") ||
    1_000_000,

  /** Reward token decimals (for display). */
  rewardDecimals: Number(process.env.NEXT_PUBLIC_REWARD_DECIMALS || "6"),

  /** Staking token decimals. */
  stakingDecimals: Number(process.env.NEXT_PUBLIC_STAKING_DECIMALS || "6"),

  /** Display symbol for the staking token (e.g. SYRA). */
  stakingTokenSymbol:
    process.env.NEXT_PUBLIC_STAKING_TOKEN_SYMBOL || "SYRA",

  /** Seconds in a year for APR. */
  secondsPerYear: 365.25 * 24 * 60 * 60,

  /** Optional: reward token price for APR in USD. If not set, APR uses 1:1 with staking token. */
  rewardTokenPriceUsd: Number(
    process.env.NEXT_PUBLIC_REWARD_TOKEN_PRICE_USD || "1"
  ),

  /** Optional: staking token price in USD. */
  stakingTokenPriceUsd: Number(
    process.env.NEXT_PUBLIC_STAKING_TOKEN_PRICE_USD || "1"
  ),
} as const;

export type StakingConfig = typeof CONFIG;
