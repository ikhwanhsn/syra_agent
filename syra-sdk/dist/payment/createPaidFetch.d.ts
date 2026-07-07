export type CreatePaidFetchOptions = {
    /** Solana base58 or JSON byte array secret. Overrides env. */
    solanaKeypair?: string;
    /** EVM 32-byte hex private key. Overrides env. */
    evmPrivateKey?: string;
    /** algorand | base | solana — overrides X402_PREFERRED_NETWORK */
    network?: "solana" | "base" | "algorand";
};
export declare function getPaidFetch(options?: CreatePaidFetchOptions): Promise<typeof fetch>;
export declare function hasPaidFetchConfigured(options?: CreatePaidFetchOptions): boolean;
export declare function getPaidFetchNetworkLabel(): string;
/** Clear cached paid fetch (tests / key rotation). */
export declare function resetPaidFetchCache(): void;
export declare function createPaidFetchFromKeypair(keypair: string, network?: "solana" | "base"): Promise<typeof fetch>;
