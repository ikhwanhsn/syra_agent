/**
 * V2-only re-export of x402 payment utils. Import from this file in v2 routes
 * so resolution always uses api/v2/utils/x402Payment.js (never api/utils/x402Payment.js).
 */
export {
  requirePayment,
  settlePaymentAndSetResponse,
  settlePaymentWithFallback,
  encodePaymentResponseHeader,
  getX402ResourceServer,
  runAfterResponse,
  usdToMicroUsdc,
  microUsdcToUsd,
  getX402Handler,
} from "./x402Payment.js";
