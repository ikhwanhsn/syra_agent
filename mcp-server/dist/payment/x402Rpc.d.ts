/** RPC for @x402/svm ExactSvmScheme — must allow getAccountInfo / getLatestBlockhash. */
export declare function getSvmRpcUrlForX402(): string;
export declare function isRpcBlockchainAccessError(error: unknown): boolean;
export declare function switchToFallbackRpc(): void;
