// ../../internal/networks/src/types.ts
var Network = /* @__PURE__ */ ((Network2) => {
  Network2["BASE"] = "base";
  Network2["TEMPO"] = "tempo";
  Network2["SOLANA"] = "solana";
  return Network2;
})(Network || {});

// ../../internal/networks/src/configs.ts
import { base, tempo } from "viem/chains";
var EVM_CONFIGS = {
  ["base" /* BASE */]: {
    chain: base,
    name: "Base",
    caip2: "eip155:8453",
    usdcAddress: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
  },
  ["tempo" /* TEMPO */]: {
    chain: tempo.extend({
      feeToken: "0x20c000000000000000000000b9537d11c60e8b50"
    }),
    name: "Tempo",
    caip2: "eip155:4217",
    usdcAddress: "0x20c000000000000000000000b9537d11c60e8b50"
  }
};
var chainId = (network) => EVM_CONFIGS[network].chain.id;
var SOLANA_CONFIG = {
  name: "Solana",
  caip2: "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",
  usdcAddress: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
};
var ALL_NETWORK_CONFIGS = {
  ...EVM_CONFIGS,
  ["solana" /* SOLANA */]: SOLANA_CONFIG
};
var networkToCaip2 = (network) => {
  if (network === "solana" /* SOLANA */) {
    return SOLANA_CONFIG.caip2;
  }
  return EVM_CONFIGS[network].caip2;
};
var TX_EXPLORER_URLS = {
  ["base" /* BASE */]: "https://basescan.org/tx/",
  ["tempo" /* TEMPO */]: "https://testnet.tempo.xyz/tx/",
  ["solana" /* SOLANA */]: "https://solscan.io/tx/"
};
var getTxExplorerUrl = (txHash, network = "base" /* BASE */) => `${TX_EXPLORER_URLS[network]}${txHash}`;
var caip2ToNetwork = (caip2) => {
  if (caip2 === SOLANA_CONFIG.caip2) {
    return "solana" /* SOLANA */;
  }
  const evmNetwork = Object.entries(EVM_CONFIGS).find(
    ([, config]) => config.caip2 === caip2
  )?.[0];
  if (evmNetwork) {
    return evmNetwork;
  }
  return null;
};

// ../../internal/networks/src/schemas.ts
import z from "zod";
import { isAddress } from "viem";
import { isAddress as isSolanaAddress } from "@solana/kit";
var networkSchema = z.enum(Network);
var optionalNetworkSchema = networkSchema.optional();
var evmNetworkSchema = z.enum(
  Object.keys(EVM_CONFIGS)
);
var ethereumAddressSchema = z.string().refine(isAddress, "Invalid EVM address");
var solanaAddressSchema = z.string().refine(isSolanaAddress, "Invalid Solana address");
var mixedAddressSchema = z.union([ethereumAddressSchema, solanaAddressSchema]).transform((address) => address);
var typedAddressSchema = z.discriminatedUnion("network", [
  z.object({
    address: ethereumAddressSchema,
    network: evmNetworkSchema
  }),
  z.object({
    address: solanaAddressSchema,
    network: z.literal("solana" /* SOLANA */)
  })
]);

// ../../internal/networks/src/tokens.ts
var usdc = (network) => ({
  symbol: "USDC",
  name: "USD Coin",
  icon: "/usdc.png",
  decimals: 6,
  network,
  address: network === "solana" /* SOLANA */ ? SOLANA_CONFIG.usdcAddress : EVM_CONFIGS[network].usdcAddress
});

export {
  Network,
  EVM_CONFIGS,
  chainId,
  ALL_NETWORK_CONFIGS,
  networkToCaip2,
  getTxExplorerUrl,
  caip2ToNetwork,
  networkSchema,
  optionalNetworkSchema,
  ethereumAddressSchema,
  solanaAddressSchema,
  typedAddressSchema,
  usdc
};
//# sourceMappingURL=chunk-NPJV7AMV.js.map