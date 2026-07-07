export declare const SOLANA_MAINNET_CAIP2 = "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp";
export type X402PreferredNetwork = "solana" | "algorand" | "base" | string;
export declare function getPreferredX402Network(): X402PreferredNetwork;
export declare function shouldUseAlgorandX402(): boolean;
export declare function shouldUseBaseX402(): boolean;
export declare function preferMainnetSolanaAccepts(paymentRequired: {
    accepts?: Array<{
        network?: string;
    }>;
} | null | undefined): void;
