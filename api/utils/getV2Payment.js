/**
 * Load v2 payment utils via URL relative to this file. Use in every v2 route so
 * resolution always hits api/utils/x402PaymentV2.js (never api/utils/x402Payment.js).
 * Returns an explicit object so all expected exports (e.g. settlePaymentAndSetResponse) are always present.
 * Usage: const { requirePayment, settlePaymentAndSetResponse, ... } = await getV2Payment();
 */
export async function getV2Payment() {
  const mod = await import(new URL("./x402PaymentV2.js", import.meta.url).href);
  return {
    requirePayment: mod.requirePayment,
    settlePaymentAndSetResponse: mod.settlePaymentAndSetResponse,
    settlePaymentWithFallback: mod.settlePaymentWithFallback,
    encodePaymentResponseHeader: mod.encodePaymentResponseHeader,
    getX402ResourceServer: mod.getX402ResourceServer,
    runAfterResponse: mod.runAfterResponse,
    runBuybackForRequest: mod.runBuybackForRequest,
    usdToMicroUsdc: mod.usdToMicroUsdc,
    microUsdcToUsd: mod.microUsdcToUsd,
    getX402Handler: mod.getX402Handler,
  };
}
