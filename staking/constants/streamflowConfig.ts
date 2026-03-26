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

  /**
   * Preset lock durations (seconds). Shown in the Streamflow UI.
   * 30d, 90d, 365d
   */
  lockPresets: [
    { label: "30 days", seconds: 30 * 24 * 60 * 60 },
    { label: "90 days", seconds: 90 * 24 * 60 * 60 },
    { label: "1 year", seconds: 365 * 24 * 60 * 60 },
  ] as const,
} as const;

export type StreamflowLockPreset = (typeof STREAMFLOW_CONFIG.lockPresets)[number];
