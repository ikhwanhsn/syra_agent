import { fetchWithX402Payment, type X402PayerOptions } from "@syra-ai/x402-payer";
import { wrapFetchWithSyraRefund, type WrapFetchWithSyraRefundOptions } from "./wrapFetch.js";

export type SyraRefundClientOptions = WrapFetchWithSyraRefundOptions & {
  /** Optional x402 signer used when calling Syra ledger / premium endpoints. */
  signPayment?: X402PayerOptions["signPayment"];
};

export type RefundStatus = {
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
};

export type RefundClaims = {
  success: boolean;
  data?: {
    enabled?: boolean;
    refunds?: unknown[];
    count?: number;
  };
  error?: string;
};

const DEFAULT_BASE = "https://api.syraa.fun";

export function createSyraRefundClient(opts: SyraRefundClientOptions = {}) {
  const baseUrl = (opts.baseUrl ?? DEFAULT_BASE).replace(/\/$/, "");

  const paidFetch: typeof fetch = opts.payer
    ? opts.payer
    : opts.signPayment
      ? async (input, init) => {
          const url = typeof input === "string" ? input : input instanceof URL ? input.href : String(input);
          const result = await fetchWithX402Payment(url, init ?? {}, {
            signPayment: opts.signPayment!,
          });
          return new Response(result.data == null ? null : JSON.stringify(result.data), {
            status: result.status,
            headers: { "content-type": "application/json" },
          });
        }
      : globalThis.fetch.bind(globalThis);

  return {
    wrapFetch(baseFetch: typeof fetch = globalThis.fetch.bind(globalThis)) {
      return wrapFetchWithSyraRefund(baseFetch, { ...opts, baseUrl, payer: paidFetch });
    },
    async getStatus(): Promise<RefundStatus> {
      const res = await fetch(`${baseUrl}/refund/status`);
      return (await res.json()) as RefundStatus;
    },
    async listClaims(input: { wallet: string; limit?: number }): Promise<RefundClaims> {
      const wallet = encodeURIComponent(input.wallet);
      const limit = input.limit != null ? `&limit=${encodeURIComponent(String(input.limit))}` : "";
      const res = await fetch(`${baseUrl}/refund/claims?wallet=${wallet}${limit}`);
      return (await res.json()) as RefundClaims;
    },
  };
}
