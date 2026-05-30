import type { AssetClass } from "@/lib/assetsHub";

export type AssetPreset = {
  ref: string;
  label: string;
  assetClass: AssetClass;
};

export const ASSET_PRESETS: readonly AssetPreset[] = [
  { ref: "btc", label: "Bitcoin", assetClass: "crypto" },
  { ref: "sol", label: "Solana", assetClass: "crypto" },
  { ref: "eth", label: "Ethereum", assetClass: "crypto" },
  { ref: "bonk", label: "Bonk", assetClass: "crypto" },
  { ref: "jup", label: "Jupiter", assetClass: "crypto" },
  { ref: "tsla", label: "Tesla", assetClass: "equity" },
  { ref: "nvda", label: "NVIDIA", assetClass: "equity" },
  { ref: "aapl", label: "Apple", assetClass: "equity" },
  { ref: "msft", label: "Microsoft", assetClass: "equity" },
  { ref: "amzn", label: "Amazon", assetClass: "equity" },
] as const;
