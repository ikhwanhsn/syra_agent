/**
 * Client-side mirror of api/libs/refund/failureClassifier.js.
 * Server classification is authoritative for payouts.
 */
export type CallOutcome = {
    refundable: boolean;
    reason: string;
};
export declare function classifyCallOutcome(input?: {
    httpStatus?: number | null;
    errorMessage?: string | null;
    hadPayment?: boolean;
}): CallOutcome;
