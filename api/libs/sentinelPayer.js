/**
 * Optional Sentinel-wrapped payer.fetch for x402 route handlers (SENTINEL_ENABLED=true).
 * When off, returns plain payer.fetch (no Valeo audit/budget).
 */
import { payer } from "@faremeter/rides";
import { wrapWithSentinel, standardPolicy } from "@x402sentinel/x402";
import { getSentinelStorage } from "./sentinelStorage.js";
import { isSentinelEnabled } from "./sentinelConfig.js";

let cachedSentinelPayerFetch = null;

/**
 * Returns payer.fetch, or a Sentinel-wrapped version when SENTINEL_ENABLED=true.
 * NOTE: Do NOT use for Nansen header-based 402 — use getNansenPaymentFetch() instead.
 */
export function getSentinelPayerFetch() {
  if (!isSentinelEnabled()) {
    return payer.fetch.bind(payer);
  }
  if (cachedSentinelPayerFetch) return cachedSentinelPayerFetch;
  cachedSentinelPayerFetch = wrapWithSentinel(payer.fetch.bind(payer), {
    agentId: process.env.SENTINEL_AGENT_ID || "x402-api",
    budget: standardPolicy(),
    audit: { enabled: true, storage: getSentinelStorage() },
  });
  return cachedSentinelPayerFetch;
}

let cachedNansenPaymentFetch = null;

/**
 * Returns a Sentinel-wrapped x402-paying fetch for Nansen API calls.
 * Uses @x402/fetch (reads Payment-Required header) instead of @faremeter/rides (body only).
 * Requires PAYER_KEYPAIR: base58 secret key, or JSON byte array `[...]` (32+ bytes), optional wrapping quotes.
 */
export async function getNansenPaymentFetch() {
  if (cachedNansenPaymentFetch) return cachedNansenPaymentFetch;

  const { PAYER_KEYPAIR } = process.env;
  if (!PAYER_KEYPAIR) throw new Error("PAYER_KEYPAIR must be set");

  const bs58 = (await import("bs58")).default;
  const { createKeyPairSignerFromBytes } = await import("@solana/kit");
  const { wrapFetchWithPayment } = await import("@x402/fetch");
  const { x402Client } = await import("@x402/core/client");
  const { ExactSvmScheme } = await import("@x402/svm/exact/client");
  const { registerRequiredExtensionsHook } = await import("./agentX402Client.js");

  let s = String(PAYER_KEYPAIR).trim();
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.slice(1, -1).trim();
  }
  if (!s) throw new Error("PAYER_KEYPAIR is empty");

  /** @type {Uint8Array} */
  let secretBytes;
  if (s.startsWith("[")) {
    let arr;
    try {
      arr = JSON.parse(s);
    } catch (e) {
      throw new Error(`PAYER_KEYPAIR JSON parse failed: ${e instanceof Error ? e.message : String(e)}`);
    }
    if (!Array.isArray(arr) || arr.length < 32) {
      throw new Error("PAYER_KEYPAIR JSON must be an array of at least 32 byte values (0–255)");
    }
    for (let i = 0; i < arr.length; i++) {
      const n = arr[i];
      if (typeof n !== "number" || !Number.isInteger(n) || n < 0 || n > 255) {
        throw new Error(`PAYER_KEYPAIR JSON invalid byte at index ${i}`);
      }
    }
    secretBytes = Uint8Array.from(arr);
  } else {
    try {
      secretBytes = bs58.decode(s);
    } catch (e) {
      throw new Error(
        `PAYER_KEYPAIR base58 decode failed: ${e instanceof Error ? e.message : String(e)}. Use Phantom/Solana base58 export or a JSON [byte,...] array.`
      );
    }
  }

  const signer = await createKeyPairSignerFromBytes(secretBytes);
  const scheme = new ExactSvmScheme(signer);
  const config = { schemes: [{ network: "solana:*", client: scheme }] };
  const client = x402Client.fromConfig(config);
  registerRequiredExtensionsHook(client);
  const paymentFetch = wrapFetchWithPayment(globalThis.fetch, client);

  if (!isSentinelEnabled()) {
    cachedNansenPaymentFetch = paymentFetch;
    return cachedNansenPaymentFetch;
  }
  cachedNansenPaymentFetch = wrapWithSentinel(paymentFetch, {
    agentId: process.env.SENTINEL_AGENT_ID || "x402-api-nansen",
    budget: standardPolicy(),
    audit: { enabled: true, storage: getSentinelStorage() },
  });
  return cachedNansenPaymentFetch;
}

let cachedBaseX402PaymentFetch = null;

/**
 * x402-paying fetch for **Base (eip155) USDC** only — use in tester / probes that must exercise the EVM path.
 * Requires `CMC_PAYER_PRIVATE_KEY`: 32-byte hex, with or without `0x` prefix (same as viem `privateKeyToAccount`).
 * Unlike `getNansenPaymentFetch` (Solana), this registers only `eip155:*` + ExactEvmScheme so
 * 402 `accepts` with both Solana and Base will be paid on Base.
 */
export async function getBaseX402PaymentFetch() {
  if (cachedBaseX402PaymentFetch) return cachedBaseX402PaymentFetch;

  const raw0 = String(process.env.CMC_PAYER_PRIVATE_KEY || "").trim();
  if (!raw0) throw new Error("CMC_PAYER_PRIVATE_KEY must be set for Base x402 payment fetch");

  let hex = raw0;
  if (hex.startsWith("0x") || hex.startsWith("0X")) hex = hex.slice(2);
  if (!/^[0-9a-fA-F]{64}$/.test(hex)) {
    throw new Error("CMC_PAYER_PRIVATE_KEY must be 32-byte hex (64 hex chars, optional 0x prefix)");
  }

  const { privateKeyToAccount } = await import("viem/accounts");
  const { wrapFetchWithPayment } = await import("@x402/fetch");
  const { x402Client } = await import("@x402/core/client");
  const { ExactEvmScheme } = await import("@x402/evm/exact/client");
  const { registerRequiredExtensionsHook } = await import("./agentX402Client.js");

  const account = privateKeyToAccount(/** @type {`0x${string}`} */ (`0x${hex}`));
  const scheme = new ExactEvmScheme(account);
  const config = { schemes: [{ network: "eip155:*", client: scheme }] };
  const client = x402Client.fromConfig(config);
  registerRequiredExtensionsHook(client);
  const paymentFetch = wrapFetchWithPayment(globalThis.fetch, client);

  if (!isSentinelEnabled()) {
    cachedBaseX402PaymentFetch = paymentFetch;
    return cachedBaseX402PaymentFetch;
  }
  cachedBaseX402PaymentFetch = wrapWithSentinel(paymentFetch, {
    agentId: process.env.SENTINEL_AGENT_ID || "x402-api-tester-base",
    budget: standardPolicy(),
    audit: { enabled: true, storage: getSentinelStorage() },
  });
  return cachedBaseX402PaymentFetch;
}

export { payer };
