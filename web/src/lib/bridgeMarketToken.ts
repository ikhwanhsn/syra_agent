import type { Token } from "@relayprotocol/relay-kit-ui";
import type { SelectedSwapToken } from "@/components/swap/TokenSelectDialog";
import {
  BASE_CHAIN_ID,
  BASE_USDC_ADDRESS,
  RELAY_SOLANA_CHAIN_ID,
  SOLANA_USDC_ADDRESS,
} from "@/lib/bridgeConfig";
import {
  BONK_MINT,
  SWAP_PRESET_TOKENS,
  SYRA_MINT,
  USDC_MINT,
  WSOL_MINT,
} from "@/lib/swapPresets";

/** Default Relay from-token: Base USDC. */
export const DEFAULT_BRIDGE_FROM: Token = {
  chainId: BASE_CHAIN_ID,
  address: BASE_USDC_ADDRESS,
  decimals: 6,
  name: "USD Coin",
  symbol: "USDC",
  logoURI: "https://ethereum-optimism.github.io/data/USDC/logo.png",
};

/** Default Relay to-token: Solana USDC. */
export const DEFAULT_BRIDGE_TO: Token = {
  chainId: RELAY_SOLANA_CHAIN_ID,
  address: SOLANA_USDC_ADDRESS,
  decimals: 6,
  name: "USD Coin",
  symbol: "USDC",
  logoURI:
    "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png",
};

function presetByMint(mint: string): (typeof SWAP_PRESET_TOKENS)[number] | undefined {
  return SWAP_PRESET_TOKENS.find((t) => t.mint === mint);
}

/**
 * Map an EVM (or unknown) bridge symbol to a Solana mint for the market panel chart.
 * Falls back to $SYRA when there is no sensible Solana equivalent.
 */
function solanaMintForSymbol(symbol: string): string {
  const s = symbol.trim().toUpperCase();
  switch (s) {
    case "USDC":
    case "USDC.E":
    case "USDT":
      return USDC_MINT;
    case "SOL":
    case "WSOL":
    case "ETH":
    case "WETH":
      return WSOL_MINT;
    case "SYRA":
      return SYRA_MINT;
    case "BONK":
      return BONK_MINT;
    default:
      return SYRA_MINT;
  }
}

function syraFallback(token?: Token): SelectedSwapToken {
  const preset = presetByMint(SYRA_MINT)!;
  return {
    mint: SYRA_MINT,
    symbol: token?.symbol?.trim() || "SYRA",
    name: token?.name?.trim() || "SYRA",
    decimals: token?.decimals ?? preset.decimals,
    icon: token?.logoURI || preset.icon,
    isVerified: true,
  };
}

/**
 * Convert a Relay bridge token into a Solana-mint `SelectedSwapToken` for SwapMarketPanel.
 * Solana-side tokens pass through; EVM tokens map by symbol; unknown symbols fall back to $SYRA.
 */
export function relayTokenToSwapToken(token?: Token): SelectedSwapToken {
  if (!token) return syraFallback();

  if (token.chainId === RELAY_SOLANA_CHAIN_ID) {
    const mint = token.address.trim();
    const preset = presetByMint(mint);
    return {
      mint,
      symbol: token.symbol || preset?.label || "TOKEN",
      name: token.name || token.symbol || preset?.label || "Token",
      decimals: token.decimals ?? preset?.decimals ?? 9,
      icon: token.logoURI || preset?.icon || null,
      isVerified: token.verified ?? Boolean(preset),
    };
  }

  const mint = solanaMintForSymbol(token.symbol || "");
  const preset = presetByMint(mint);
  return {
    mint,
    symbol: token.symbol || preset?.label || "TOKEN",
    name: token.name || token.symbol || preset?.label || "Token",
    decimals: token.decimals ?? preset?.decimals ?? 9,
    icon: token.logoURI || preset?.icon || null,
    isVerified: token.verified ?? Boolean(preset),
  };
}
