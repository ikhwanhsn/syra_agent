/**
 * Pure classifier: should this paid call be refunded?
 *
 * Refundable: 5xx, 408, network/timeout after a payment settled.
 * Not refundable: no payment, 2xx, 402, ordinary 4xx.
 */

const NETWORK_ERROR_RE =
  /timeout|timed out|econnreset|enotfound|econnrefused|network|fetch failed|socket|aborted|undici|gateway/i;

/**
 * @param {{
 *   httpStatus?: number | null;
 *   errorMessage?: string | null;
 *   hadPayment?: boolean;
 * }} input
 * @returns {{ refundable: boolean; reason: string }}
 */
export function classifyCallOutcome(input = {}) {
  const hadPayment = Boolean(input.hadPayment);
  if (!hadPayment) {
    return { refundable: false, reason: "no_payment" };
  }

  const statusRaw = input.httpStatus;
  const status = statusRaw == null || statusRaw === "" ? NaN : Number(statusRaw);
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
