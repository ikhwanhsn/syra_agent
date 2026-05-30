/**
 * Lightweight Tempo chain stub for viem's barrel export.
 * The real definition imports ox tempo mining workers with dynamic `import(id)`,
 * which triggers webpack "Critical dependency" warnings and is unused by Syra (Solana).
 */
import { defineChain } from "viem";

export const tempo = defineChain({
  id: 4217,
  name: "Tempo Mainnet",
  nativeCurrency: { name: "USD", symbol: "USD", decimals: 6 },
  rpcUrls: { default: { http: ["https://rpc.tempo.xyz"] } },
});
