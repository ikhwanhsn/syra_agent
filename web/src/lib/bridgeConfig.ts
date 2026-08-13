/**
 * Relay bridge config: app fee funds SYRA buybacks via the 24h queue.
 * Claim address must be EVM (Relay accrues off-chain USDC to this wallet).
 */

/** Public Base settler (same as api/config/settlement.js BASE_PAYTO). */
export const DEFAULT_BRIDGE_FEE_RECIPIENT =
  "0xF9dcBFF7EdDd76c58412fd46f4160c96312ce734";

/** App fee in basis points (25 = 0.25%). */
export const BRIDGE_APP_FEE_BPS = "25";

export const BRIDGE_APP_FEE_PERCENT_LABEL = "0.25%";

/** Relay Solana chain id. */
export const RELAY_SOLANA_CHAIN_ID = 792703809;

/** Base mainnet chain id. */
export const BASE_CHAIN_ID = 8453;

export const BASE_USDC_ADDRESS = "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913";
export const SOLANA_USDC_ADDRESS = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

export function getBridgeFeeRecipient(): string {
  const fromEnv = import.meta.env.VITE_BRIDGE_FEE_RECIPIENT?.trim();
  if (fromEnv && /^0x[a-fA-F0-9]{40}$/.test(fromEnv)) return fromEnv;
  return DEFAULT_BRIDGE_FEE_RECIPIENT;
}
