import { createSyraClient } from "../index.js";
import { createPaidFetchFromKeypair, getPaidFetch } from "./createPaidFetch.js";
/**
 * Create a Syra client with x402 auto-pay wired via @x402/fetch.
 * Reads SYRA_PAYER_KEYPAIR (Solana) or SYRA_EVM_PAYER_PRIVATE_KEY (Base) from env by default.
 */
export async function createSyraPaidClient(options = {}) {
    const { payer, ...clientOpts } = options;
    const fetchFn = payer
        ? await (async () => {
            if (payer.solanaKeypair)
                return createPaidFetchFromKeypair(payer.solanaKeypair, "solana");
            if (payer.evmPrivateKey)
                return createPaidFetchFromKeypair(payer.evmPrivateKey, "base");
            return getPaidFetch(payer);
        })()
        : await getPaidFetch();
    return createSyraClient({
        ...clientOpts,
        fetch: fetchFn,
        maxPaymentRetries: 0,
    });
}
export { createPaidFetchFromKeypair, getPaidFetch, hasPaidFetchConfigured, getPaidFetchNetworkLabel, resetPaidFetchCache, } from "./createPaidFetch.js";
export { parseSolanaKeypairBytes, firstNonEmptyEnv } from "./parseKeypair.js";
export { wrapPaidFetchWithRetries } from "./paidFetchRetry.js";
