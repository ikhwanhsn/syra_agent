/**
 * @syra-ai/x402-payer — minimal x402 v2 HTTP client utilities.
 * Open-source top-of-funnel (BlockRun ClawRouter playbook for Syra).
 */
export interface X402PaymentRequirement {
    network?: string;
    asset?: string;
    amount?: string;
    payTo?: string;
    resource?: string;
}
export interface X402PayerOptions {
    /** Sign a payment requirement and return the payment header value. */
    signPayment: (requirement: X402PaymentRequirement) => Promise<string>;
    /** Header name — Syra uses PAYMENT-SIGNATURE; some gateways use X-Payment. */
    paymentHeader?: "PAYMENT-SIGNATURE" | "X-Payment";
    /** Max automatic retries on safe errors. */
    maxRetries?: number;
}
export interface PaidFetchResult<T = unknown> {
    ok: boolean;
    status: number;
    data?: T;
    charged: boolean;
    retries: number;
    error?: string;
}
/** True when the response body indicates no USDC was settled (safe retry). */
export declare function isPaymentNotCharged(bodyText: string): boolean;
/** Parse x402 accepts[] from a 402 JSON body. */
export declare function parse402Accepts(body: unknown): X402PaymentRequirement[];
/**
 * Fetch with automatic x402 payment on HTTP 402.
 * Does not include chain-specific signing — inject via signPayment.
 */
export declare function fetchWithX402Payment<T = unknown>(url: string, init: RequestInit, options: X402PayerOptions): Promise<PaidFetchResult<T>>;
/** Quote price in USD from micro-USDC string when present. */
export declare function microUsdcToUsd(micro: string | number | undefined): number | null;
