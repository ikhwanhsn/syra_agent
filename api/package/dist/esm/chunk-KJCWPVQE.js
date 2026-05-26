import {
  safeFetchJson
} from "./chunk-BFOYXXLG.js";
import {
  ALL_NETWORK_CONFIGS,
  EVM_CONFIGS,
  ethereumAddressSchema,
  networkSchema,
  solanaAddressSchema
} from "./chunk-NPJV7AMV.js";
import {
  getBaseUrl
} from "./chunk-U6FRXL3X.js";

// ../../internal/balance/src/index.ts
import { z } from "zod";
var evmNetworks = Object.keys(EVM_CONFIGS);
var getSolanaBalanceInputSchema = z.object({
  address: solanaAddressSchema,
  tokenAddress: solanaAddressSchema.optional()
});
var getEvmBalanceInputSchema = z.object({
  address: ethereumAddressSchema,
  tokenAddress: ethereumAddressSchema.optional()
});
var getBalanceInputSchema = z.discriminatedUnion("network", [
  getSolanaBalanceInputSchema.extend({
    network: z.literal("solana" /* SOLANA */)
  }),
  getEvmBalanceInputSchema.extend({
    network: z.enum(evmNetworks)
  })
]);
var getBalanceOutputSchema = z.object({
  balance: z.number(),
  // this should be deprecated in the future
  network: z.enum(
    Object.values(ALL_NETWORK_CONFIGS).map((config) => config.caip2)
  ),
  paymentNetwork: networkSchema,
  chainId: z.number()
});

// src/shared/balance.ts
var getBalance = async (surface, input, flags) => {
  return await safeFetchJson(
    surface,
    new Request(`${getBaseUrl(flags.dev)}/api/balance`, {
      method: "POST",
      body: JSON.stringify(input),
      headers: {
        accept: "application/json"
      }
    }),
    getBalanceOutputSchema
  );
};

export {
  getBalance
};
//# sourceMappingURL=chunk-KJCWPVQE.js.map