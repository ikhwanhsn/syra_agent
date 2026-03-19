import type { ApiResponse } from '@/types/api';

/** Playground-visible lane: standard Syra x402 resources vs MPP-prefixed test routes (still x402 v2). */
export type PlaygroundPaymentLane = 'x402' | 'mpp';

const MPP_URL_PATH_MARKER = '/mpp/';

function getHeaderCaseInsensitive(
  headers: Record<string, string> | undefined,
  name: string
): string | undefined {
  if (!headers) return undefined;
  const want = name.toLowerCase();
  for (const [k, v] of Object.entries(headers)) {
    if (k.toLowerCase() === want) return v;
  }
  return undefined;
}

function isMppFromBody(body: string | undefined): boolean {
  if (!body?.trim()) return false;
  try {
    const j = JSON.parse(body) as { protocol?: string };
    return j.protocol === 'mpp-test';
  } catch {
    return false;
  }
}

function isMppFromHeaders(headers: Record<string, string> | undefined): boolean {
  const lane = getHeaderCaseInsensitive(headers, 'x-syra-payment-lane');
  return Boolean(lane?.toLowerCase().includes('mpp'));
}

/** Infer lane from request URL (path contains `/mpp/`). */
export function getPaymentLaneFromUrl(urlString: string): PlaygroundPaymentLane {
  try {
    const path = new URL(urlString).pathname.toLowerCase();
    if (path.includes(MPP_URL_PATH_MARKER)) return 'mpp';
  } catch {
    // invalid URL — treat as standard
  }
  return 'x402';
}

/**
 * MPP path in the URL always wins (so changing the URL updates the badge even if the
 * previous response was cached). For non-MPP URLs, infer MPP from the last response
 * (header / JSON body) when the server signals it.
 */
export function resolvePlaygroundPaymentLane(
  url: string,
  response: ApiResponse | undefined
): PlaygroundPaymentLane {
  if (getPaymentLaneFromUrl(url) === 'mpp') return 'mpp';
  if (response) {
    if (isMppFromHeaders(response.headers) || isMppFromBody(response.body)) {
      return 'mpp';
    }
  }
  return 'x402';
}
