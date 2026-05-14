/**
 * Typed client for Rise program actions proxied through Syra (`/uponly-rise-market/*`, `/uponly-rise-create/*`).
 */
import { API_BASE, getApiHeaders } from "../../config/global";

export class RiseTradeApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "RiseTradeApiError";
    this.status = status;
  }
}

function getApiBase(): string {
  const fromEnv =
    typeof import.meta.env.VITE_SYRA_API_URL === "string" && import.meta.env.VITE_SYRA_API_URL.trim();
  return (fromEnv || `${API_BASE}/`).replace(/\/$/, "");
}

async function jsonFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const base = getApiBase();
  const url = `${base}${path}`;
  const { headers: initHeaders, ...rest } = init;
  const extraHeaders =
    initHeaders && typeof initHeaders === "object" && !(initHeaders instanceof Headers)
      ? (initHeaders as Record<string, string>)
      : {};
  const res = await fetch(url, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...getApiHeaders(),
      ...extraHeaders,
    },
  });
  const parsed = (await res.json().catch(() => null)) as { success?: boolean; error?: string } | null;
  if (!res.ok || !parsed || parsed.success === false) {
    const msg =
      (parsed && typeof parsed.error === "string" && parsed.error) ||
      `Request failed (${res.status} ${res.statusText})`;
    throw new RiseTradeApiError(msg, res.status);
  }
  return parsed as T;
}

export type RiseProgramTxResponse = {
  success: true;
  address: string;
  transaction: string;
  addresses?: Record<string, unknown>;
  updatedAt: string;
};

export type RiseDepositBorrowResponse = RiseProgramTxResponse & {
  depositAmount?: unknown;
  borrowAmount?: unknown;
  borrowAmountAfterFee?: unknown;
  includedDeposit?: unknown;
};

export type RiseRepayWithdrawResponse = RiseProgramTxResponse & {
  repayAmount?: unknown;
  withdrawAmount?: unknown;
  includedRepay?: unknown;
};

export function postRiseBuy(
  address: string,
  body: { wallet: string; cashIn: number; minTokenOut: number },
  signal?: AbortSignal,
): Promise<RiseProgramTxResponse> {
  return jsonFetch<RiseProgramTxResponse>(`/uponly-rise-market/${encodeURIComponent(address)}/buy`, {
    method: "POST",
    body: JSON.stringify(body),
    signal,
  });
}

export function postRiseSell(
  address: string,
  body: { wallet: string; tokenIn: number; minCashOut: number },
  signal?: AbortSignal,
): Promise<RiseProgramTxResponse> {
  return jsonFetch<RiseProgramTxResponse>(`/uponly-rise-market/${encodeURIComponent(address)}/sell`, {
    method: "POST",
    body: JSON.stringify(body),
    signal,
  });
}

export function postRiseDepositAndBorrow(
  address: string,
  body: { wallet: string; borrowAmount: number },
  signal?: AbortSignal,
): Promise<RiseDepositBorrowResponse> {
  return jsonFetch<RiseDepositBorrowResponse>(`/uponly-rise-market/${encodeURIComponent(address)}/deposit-and-borrow`, {
    method: "POST",
    body: JSON.stringify(body),
    signal,
  });
}

export function postRiseRepayAndWithdraw(
  address: string,
  body: { wallet: string; withdrawAmount: number },
  signal?: AbortSignal,
): Promise<RiseRepayWithdrawResponse> {
  return jsonFetch<RiseRepayWithdrawResponse>(`/uponly-rise-market/${encodeURIComponent(address)}/repay-and-withdraw`, {
    method: "POST",
    body: JSON.stringify(body),
    signal,
  });
}

export type RisePinataUploadResponse = {
  success: true;
  cid: string;
  url: string;
  updatedAt: string;
};

export function uploadRiseCreateImage(file: File, signal?: AbortSignal): Promise<RisePinataUploadResponse> {
  const base = getApiBase();
  const form = new FormData();
  form.append("file", file);
  return (async () => {
    const res = await fetch(`${base}/uponly-rise-create/upload-image`, {
      method: "POST",
      body: form,
      headers: getApiHeaders(),
      signal,
    });
    const parsed = (await res.json().catch(() => null)) as { success?: boolean; error?: string } | null;
    if (!res.ok || !parsed || parsed.success === false) {
      const msg =
        (parsed && typeof parsed.error === "string" && parsed.error) ||
        `Upload failed (${res.status} ${res.statusText})`;
      throw new RiseTradeApiError(msg, res.status);
    }
    return parsed as RisePinataUploadResponse;
  })();
}

export type RiseCreateMetadataBody = {
  name: string;
  symbol: string;
  description: string;
  image: string;
  external_url?: string;
  twitter?: string;
  telegram?: string;
};

export function uploadRiseCreateMetadata(body: RiseCreateMetadataBody, signal?: AbortSignal): Promise<RisePinataUploadResponse> {
  return jsonFetch<RisePinataUploadResponse>("/uponly-rise-create/upload-metadata", {
    method: "POST",
    body: JSON.stringify(body),
    signal,
  });
}

export type RiseCreateTxBody = {
  wallet: string;
  tokenName: string;
  tokenSymbol: string;
  tokenUri: string;
  mintMain: string;
  creatorFeePercent: number;
};

export type RiseCreateTxResponse = {
  success: true;
  transactions: string[];
  addresses: Record<string, unknown> & { mintToken?: string };
  updatedAt: string;
};

export function postRiseCreateTransactions(body: RiseCreateTxBody, signal?: AbortSignal): Promise<RiseCreateTxResponse> {
  return jsonFetch<RiseCreateTxResponse>("/uponly-rise-create/transaction", {
    method: "POST",
    body: JSON.stringify(body),
    signal,
  });
}
