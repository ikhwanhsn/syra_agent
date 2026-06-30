export declare function getPaidFetch(): Promise<typeof fetch>;
/** True when any payer credential is configured for the active X402_PREFERRED_NETWORK rail. */
export declare function hasPaidFetchConfigured(): boolean;
export declare function getPaidFetchNetworkLabel(): string;
/** @deprecated Use getPaidFetch — kept for tests */
export declare function createPaidFetch(keypairEnv: string): Promise<typeof fetch>;
