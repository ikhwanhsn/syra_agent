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
export declare function registerRequiredExtensionsHook(client: X402ClientLike): void;
export declare function registerBuilderCodeClientExtension(client: X402ClientLike): Promise<void>;
export {};
