import {getApiBaseUrl} from './env';

export type ApiEnvelope<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

export async function apiGetJson<T = unknown>(
  path: string,
  init?: RequestInit & {payerAddress?: string},
): Promise<{status: number; json: T | null; headers: Headers; text: string}> {
  const base = getApiBaseUrl();
  const url = path.startsWith('http') ? path : `${base}${path.startsWith('/') ? '' : '/'}${path}`;
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(init?.headers as Record<string, string> | undefined),
  };
  if (init?.payerAddress) {
    headers['X-Payer-Address'] = init.payerAddress;
    headers['X-Connected-Wallet'] = init.payerAddress;
  }
  const res = await fetch(url, {
    ...init,
    method: init?.method || 'GET',
    headers,
  });
  const text = await res.text();
  let json: T | null = null;
  try {
    json = text ? (JSON.parse(text) as T) : null;
  } catch {
    json = null;
  }
  return {status: res.status, json, headers: res.headers, text};
}

export function headersToRecord(headers: Headers): Record<string, string> {
  const out: Record<string, string> = {};
  headers.forEach((value, key) => {
    out[key] = value;
  });
  return out;
}
