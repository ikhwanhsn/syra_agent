/**
 * Wrap x402-paying fetch with transient 402/400 retries (stale blockhash, facilitator races).
 * Mirrors api/libs/agentX402Client.js retry behavior.
 */
export declare function wrapPaidFetchWithRetries(paymentFetch: typeof fetch): typeof fetch;
