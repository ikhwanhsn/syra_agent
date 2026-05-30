import type { ApiResponse } from '@/types/api';
import type { PlaygroundPaymentLane } from '@/lib/paymentLane';
import { responseSignalsMppLane } from '@/lib/paymentLane';

function getHeaderCaseInsensitive(
  headers: Record<string, string>,
  name: string
): string | undefined {
  const want = name.toLowerCase();
  for (const [k, v] of Object.entries(headers)) {
    if (k.toLowerCase() === want) return v;
  }
  return undefined;
}

function isValidJsonDocument(body: string): boolean {
  const t = body.trim();
  if (!t) return false;
  try {
    JSON.parse(body);
    return true;
  } catch {
    return false;
  }
}

/**
 * Show a hint when the user likely hit a gateway/docs/HTML page instead of an
 * x402 (402 + JSON) or MPP JSON endpoint. Valid JSON 2xx responses are treated as real API data.
 */
export function shouldShowNonX402Hint(
  response: ApiResponse | undefined,
  paymentLane: PlaygroundPaymentLane
): boolean {
  if (!response) return false;
  if (response.status === 402) return false;
  if (response.status < 200 || response.status >= 300) return false;

  const body = response.body ?? '';
  const trimmed = body.trim();
  if (!trimmed) return false;

  if (isValidJsonDocument(body)) {
    if (paymentLane === 'mpp' && responseSignalsMppLane(response)) return false;
    // Any parseable JSON 2xx — assume intentional API payload (x402-paid or other JSON APIs)
    return false;
  }

  if (paymentLane === 'mpp' && responseSignalsMppLane(response)) return false;

  const ct = getHeaderCaseInsensitive(response.headers, 'content-type') ?? '';
  if (/text\/html/i.test(ct)) return true;

  const start = trimmed.slice(0, 200).trimStart();
  if (/^<!DOCTYPE/i.test(start) || /^<html[\s>]/i.test(start)) return true;
  if (start.startsWith('<')) return true;

  // Plain text / ASCII landing (not JSON)
  if (trimmed.length >= 48) return true;

  return false;
}
