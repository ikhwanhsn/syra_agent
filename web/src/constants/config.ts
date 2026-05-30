import { env } from "@/lib/env";
import { PublicKey } from "@solana/web3.js";

/**
 * Staking dApp configuration.
 * Mainnet: users stake $SYRA token and earn $SYRA rewards.
 */

export const IS_DEVNET = env.solanaNetwork !== "mainnet-beta";

/** $SYRA token mint on Solana mainnet */
const SYRA_MINT = "8a3sEw2kizHxVnT9oLEVLADx8fTMPkjbEGSraqNWpump";

export const CONFIG = {
  /** true on devnet, false on mainnet */
  IS_DEVNET,

  /** Solana RPC endpoint. Use .env for secrets. */
  rpcEndpoint:
    env.solanaRpcUrl ||
    (IS_DEVNET
      ? "https://api.devnet.solana.com"
      : "https://api.mainnet-beta.solana.com"),

  /** Your deployed Anchor staking program ID */
  programId: new PublicKey(
    env.stakingProgramId || "11111111111111111111111111111111",
  ),

  /** SPL token mint that users stake ($SYRA) */
  stakingMint: new PublicKey(env.stakingMint || SYRA_MINT),

  /** SPL token mint used for rewards ($SYRA) */
  rewardMint: new PublicKey(env.rewardMint || SYRA_MINT),

  /**
   * Reward emission per second (in reward token smallest units).
   * Used for APR display and must match program's reward_per_second.
   */
  rewardPerSecond: Number(env.rewardPerSecond || "0") || 1_000_000,

  /** Reward token decimals (for display). */
  rewardDecimals: Number(env.rewardDecimals || "6"),

  /** Staking token decimals. */
  stakingDecimals: Number(env.stakingDecimals || "6"),

  /** Display symbol for the staking token. */
  stakingTokenSymbol: env.stakingTokenSymbol || "SYRA",

  /** Seconds in a year for APR. */
  secondsPerYear: 365.25 * 24 * 60 * 60,

  /** Optional: reward token price for APR in USD. If not set, APR uses 1:1 with staking token. */
  rewardTokenPriceUsd: Number(env.rewardTokenPriceUsd || "1"),

  /** Optional: staking token price in USD. */
  stakingTokenPriceUsd: Number(env.stakingTokenPriceUsd || "1"),
} as const;

export type StakingConfig = typeof CONFIG;
