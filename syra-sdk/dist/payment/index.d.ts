import { type SyraClientOptions } from "../index.js";
import { type CreatePaidFetchOptions } from "./createPaidFetch.js";
export type SyraPaidClientOptions = SyraClientOptions & {
    /** Inline payer credentials — prefer env vars in production. */
    payer?: CreatePaidFetchOptions;
};
/**
 * Create a Syra client with x402 auto-pay wired via @x402/fetch.
 * Reads SYRA_PAYER_KEYPAIR (Solana) or SYRA_EVM_PAYER_PRIVATE_KEY (Base) from env by default.
 */
export declare function createSyraPaidClient(options?: SyraPaidClientOptions): Promise<import("../index.js").SyraClient>;
export { createPaidFetchFromKeypair, getPaidFetch, hasPaidFetchConfigured, getPaidFetchNetworkLabel, resetPaidFetchCache, type CreatePaidFetchOptions, } from "./createPaidFetch.js";
export { parseSolanaKeypairBytes, firstNonEmptyEnv } from "./parseKeypair.js";
export { wrapPaidFetchWithRetries } from "./paidFetchRetry.js";
