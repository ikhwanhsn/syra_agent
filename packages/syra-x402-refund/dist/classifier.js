/**
 * Client-side mirror of api/libs/refund/failureClassifier.js.
 * Server classification is authoritative for payouts.
 */
const NETWORK_ERROR_RE = /timeout|timed out|econnreset|enotfound|econnrefused|network|fetch failed|socket|aborted|undici|gateway/i;
export function classifyCallOutcome(input = {}) {
    const hadPayment = Boolean(input.hadPayment);
    if (!hadPayment) {
        return { refundable: false, reason: "no_payment" };
    }
    const statusRaw = input.httpStatus;
    const status = statusRaw == null ? Number.NaN : Number(statusRaw);
    const msg = String(input.errorMessage || "");
    if (Number.isFinite(status) && status >= 200 && status < 400) {
        return { refundable: false, reason: "success" };
    }
    if (status === 402) {
        return { refundable: false, reason: "payment_layer" };
    }
    if (status === 408) {
        return { refundable: true, reason: "request_timeout" };
    }
    if (Number.isFinite(status) && status >= 400 && status < 500) {
        return { refundable: false, reason: "client_error" };
    }
    if (Number.isFinite(status) && status >= 500) {
        return { refundable: true, reason: "upstream_5xx" };
    }
    if (NETWORK_ERROR_RE.test(msg)) {
        return { refundable: true, reason: "network_error" };
    }
    return { refundable: true, reason: "unknown_after_payment" };
}
