/**
 * Validates that a 402 response matches the format expected by the x402 API Playground.
 * Use this to test APIs before using them in the playground so requests don't error.
 */

import {
  parseX402Response,
  getBestPaymentOption,
  type X402Response,
  type X402PaymentOption,
} from './x402Client';

export interface X402FormatValidationResult {
  /** True if the response is valid and the playground can pay and retry without format errors. */
  valid: boolean;
  /** Human-readable errors (e.g. missing payTo, invalid JSON). */
  errors: string[];
  /** Warnings that don't block validity (e.g. optional fields missing). */
  warnings: string[];
  /** Parsed x402 response when body was valid x402. */
  parsed?: X402Response;
  /** Best payment option selected when parsed and accepts were valid. */
  paymentOption?: X402PaymentOption;
  /** Raw HTTP status. */
  statusCode: number;
}

/**
 * Validate an HTTP 402 response for x402 playground compatibility.
 * Checks: status 402, JSON body, x402Version + accepts, and that at least one
 * payment option has payTo, amount, and network so the playground can build a payment.
 */
export function validateX402Format(
  statusCode: number,
  bodyText: string,
  responseHeaders?: Record<string, string>
): X402FormatValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (statusCode !== 402) {
    return {
      valid: false,
      errors: [`Endpoint did not return 402 Payment Required (got ${statusCode}). Only x402 APIs return 402.`],
      warnings: [],
      statusCode,
    };
  }

  let jsonData: unknown;
  try {
    jsonData = JSON.parse(bodyText);
  } catch {
    return {
      valid: false,
      errors: ['Response body is not valid JSON. The playground expects a JSON 402 body.'],
      warnings: [],
      statusCode: 402,
    };
  }

  if (jsonData == null || typeof jsonData !== 'object') {
    return {
      valid: false,
      errors: ['Response body must be a JSON object.'],
      warnings: [],
      statusCode: 402,
    };
  }

  const parsed = parseX402Response(jsonData as Record<string, unknown>, responseHeaders);

  if (!parsed) {
    return {
      valid: false,
      errors: [
        'Response is not a valid x402 payload. Expected "x402Version" (1 or 2) and "accepts" array in the body, ' +
          'or "accepts" / "payment" / "price" fields, or Payment-Required header with payment options.',
      ],
      warnings: [],
      statusCode: 402,
    };
  }

  const option = getBestPaymentOption(parsed);

  if (!option) {
    return {
      valid: false,
      errors: ['No payment option could be selected. "accepts" must contain at least one option with network and payTo.'],
      warnings: [],
      parsed,
      statusCode: 402,
    };
  }

  if (!option.payTo?.trim()) {
    errors.push('Payment option is missing "payTo" (recipient address).');
  }
  if (!option.amount?.trim()) {
    errors.push('Payment option is missing "amount" (or maxAmountRequired / price for v1).');
  } else if (option.amount === '0') {
    warnings.push('Payment amount is 0; typically x402 endpoints require a positive amount.');
  }
  if (!option.network?.trim()) {
    errors.push('Payment option is missing "network" (e.g. solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp or eip155:8453).');
  }

  if (parsed.x402Version !== 1 && parsed.x402Version !== 2) {
    warnings.push(`x402Version ${parsed.x402Version} is non-standard; playground supports 1 and 2.`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    parsed,
    paymentOption: option,
    statusCode: 402,
  };
}
