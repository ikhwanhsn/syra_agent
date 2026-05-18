import { PublicKey } from "@solana/web3.js";
import { CONFIG } from "./config";

/**
 * Streamflow-based token locks (replaces custom on-chain staking UX only in /streamflow).
 * Uses the same SPL mint as CONFIG; lock durations are wall-clock seconds until unlock.
 */

export const STREAMFLOW_CONFIG = {
  rpcEndpoint: CONFIG.rpcEndpoint,
  isDevnet: CONFIG.IS_DEVNET,

  /** SPL mint to lock (defaults to same as legacy staking mint) */
  tokenMint: new PublicKey(
    process.env.NEXT_PUBLIC_STREAMFLOW_STAKING_MINT ||
      CONFIG.stakingMint.toBase58()
  ),

  tokenSymbol: CONFIG.stakingTokenSymbol,
  tokenDecimals: CONFIG.stakingDecimals,

  /** Fixed lock: wall-clock seconds from creation until full unlock (30 days). */
  lockDurationSeconds: 30 * 24 * 60 * 60,
  lockDurationLabel: "1 month",
} as const;
