import { fetchWithX402Payment } from "@syra-ai/x402-payer";
import { wrapFetchWithSyraRefund } from "./wrapFetch.js";
const DEFAULT_BASE = "https://api.syraa.fun";
export function createSyraRefundClient(opts = {}) {
    const baseUrl = (opts.baseUrl ?? DEFAULT_BASE).replace(/\/$/, "");
    const paidFetch = opts.payer
        ? opts.payer
        : opts.signPayment
            ? async (input, init) => {
                const url = typeof input === "string" ? input : input instanceof URL ? input.href : String(input);
                const result = await fetchWithX402Payment(url, init ?? {}, {
                    signPayment: opts.signPayment,
                });
                return new Response(result.data == null ? null : JSON.stringify(result.data), {
                    status: result.status,
                    headers: { "content-type": "application/json" },
                });
            }
            : globalThis.fetch.bind(globalThis);
    return {
        wrapFetch(baseFetch = globalThis.fetch.bind(globalThis)) {
            return wrapFetchWithSyraRefund(baseFetch, { ...opts, baseUrl, payer: paidFetch });
        },
        async getStatus() {
            const res = await fetch(`${baseUrl}/refund/status`);
            return (await res.json());
        },
        async listClaims(input) {
            const wallet = encodeURIComponent(input.wallet);
            const limit = input.limit != null ? `&limit=${encodeURIComponent(String(input.limit))}` : "";
            const res = await fetch(`${baseUrl}/refund/claims?wallet=${wallet}${limit}`);
            return (await res.json());
        },
    };
}
