/**
 * B402 Permit2 signing (permit2-exact / permit2-upto) for USDC/USDT on BSC.
 * Phase 4 — not wired in playground until Permit2 witness flow is implemented.
 * @see https://developers.binance.com/docs/onchainpay-x402/open-apis-v2/permit2-signing-guide
 */
import type { X402PaymentOption, PaymentResult } from '@/lib/x402Client';

export function isPermit2PaymentOption(option: X402PaymentOption): boolean {
  const method = option.extra?.assetTransferMethod;
  return method === 'permit2-exact' || method === 'permit2-upto';
}

/** Placeholder — use EIP-3009 tokens (USD1, U) until implemented. */
export async function executePermit2Payment(
  _paymentOption: X402PaymentOption,
  _resourceUrl?: string
): Promise<PaymentResult> {
  return {
    success: false,
    error:
      'Permit2 payments (USDC/USDT on BSC) are not enabled yet. Use USD1 or U (EIP-3009) when the API offers BSC B402.',
  };
}
