import { type X402PayerOptions } from "@syra-ai/x402-payer";
import { type WrapFetchWithSyraRefundOptions } from "./wrapFetch.js";
export type SyraRefundClientOptions = WrapFetchWithSyraRefundOptions & {
    /** Optional x402 signer used when calling Syra ledger / premium endpoints. */
    signPayment?: X402PayerOptions["signPayment"];
};
export type RefundStatus = {
    success: boolean;
    data?: Record<string, unknown>;
    error?: string;
};
export type RefundClaims = {
    success: boolean;
    data?: {
        enabled?: boolean;
        refunds?: unknown[];
        count?: number;
    };
    error?: string;
};
export declare function createSyraRefundClient(opts?: SyraRefundClientOptions): {
    wrapFetch(baseFetch?: typeof fetch): typeof fetch;
    getStatus(): Promise<RefundStatus>;
    listClaims(input: {
        wallet: string;
        limit?: number;
    }): Promise<RefundClaims>;
};
