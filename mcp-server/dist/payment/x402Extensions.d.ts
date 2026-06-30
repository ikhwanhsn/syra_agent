type ExtensionSpec = {
    info?: {
        id?: string;
        required?: boolean;
    };
    schema?: {
        required?: string[];
    };
};
export type X402ClientLike = {
    onBeforePaymentCreation: (hook: (context: {
        paymentRequired?: unknown;
    }) => void | Promise<void>) => unknown;
    onAfterPaymentCreation: (hook: (context: {
        paymentPayload?: {
            extensions?: Record<string, ExtensionSpec>;
        };
    }) => void | Promise<void>) => unknown;
    registerExtension?: (extension: unknown) => unknown;
};
/**
 * x402 v2 client hooks — mirrors api/libs/agentX402Client.js registerRequiredExtensionsHook.
 * - Prefer mainnet Solana accepts when multiple networks are offered
 * - Populate required payment-identifier extension (e.g. Birdeye)
 */
export declare function registerRequiredExtensionsHook(client: X402ClientLike): void;
export declare function registerBuilderCodeClientExtension(client: X402ClientLike): Promise<void>;
export {};
