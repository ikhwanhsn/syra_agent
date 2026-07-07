import { createSyraClient, type SyraClientOptions } from "../index.js";
import { createPaidFetchFromKeypair, getPaidFetch, type CreatePaidFetchOptions } from "./createPaidFetch.js";

export type SyraPaidClientOptions = SyraClientOptions & {
  /** Inline payer credentials — prefer env vars in production. */
  payer?: CreatePaidFetchOptions;
};

/**
 * Create a Syra client with x402 auto-pay wired via @x402/fetch.
 * Reads SYRA_PAYER_KEYPAIR (Solana) or SYRA_EVM_PAYER_PRIVATE_KEY (Base) from env by default.
 */
export async function createSyraPaidClient(options: SyraPaidClientOptions = {}) {
  const { payer, ...clientOpts } = options;
  const fetchFn = payer
    ? await (async () => {
        if (payer.solanaKeypair) return createPaidFetchFromKeypair(payer.solanaKeypair, "solana");
        if (payer.evmPrivateKey) return createPaidFetchFromKeypair(payer.evmPrivateKey, "base");
        return getPaidFetch(payer);
      })()
    : await getPaidFetch();

  return createSyraClient({
    ...clientOpts,
    fetch: fetchFn,
    maxPaymentRetries: 0,
  });
}

export {
  createPaidFetchFromKeypair,
  getPaidFetch,
  hasPaidFetchConfigured,
  getPaidFetchNetworkLabel,
  resetPaidFetchCache,
  type CreatePaidFetchOptions,
} from "./createPaidFetch.js";
export { parseSolanaKeypairBytes, firstNonEmptyEnv } from "./parseKeypair.js";
export { wrapPaidFetchWithRetries } from "./paidFetchRetry.js";
