/**
 * Re-export x402 paid fetch from @syra-ai/sdk — single source of truth for MCP + SDK consumers.
 */
export { getPaidFetch, hasPaidFetchConfigured, getPaidFetchNetworkLabel, createPaidFetchFromKeypair, resetPaidFetchCache, } from "@syra-ai/sdk/payment";
/** @deprecated Use getPaidFetch — kept for tests */
export declare function createPaidFetch(keypairEnv: string): Promise<typeof fetch>;
