export type SyraRefundMode = "relay" | "reprobe";
export type WrapFetchWithSyraRefundOptions = {
    /** Syra API origin. Default https://api.syraa.fun */
    baseUrl?: string;
    /**
     * Fetch used to call Syra (pays the coverage premium on HTTP 402).
     * Pass a paid fetch from @syra-ai/sdk/payment or @syra-ai/x402-payer.
     */
    payer?: typeof fetch;
    /** Wallet that should receive on-chain refunds. */
    refundTo?: string;
    /** Client-side host filter. Server allowlist is authoritative. */
    allowlist?: string[];
    /** Hint for premium bps: USDC value of the insured call. */
    coveredUsd?: number;
    /** Skip coverage when quoted premium would exceed this. */
    maxPremiumUsd?: number;
    mode?: SyraRefundMode;
    /** Extra predicate. Return false to pass the call to baseFetch untouched. */
    shouldCover?: (url: URL) => boolean;
};
/**
 * Route covered calls through Syra's hosted refund relay.
 * Non-covered calls pass to `baseFetch` unchanged.
 */
export declare function wrapFetchWithSyraRefund(baseFetch: typeof fetch, opts?: WrapFetchWithSyraRefundOptions): typeof fetch;
