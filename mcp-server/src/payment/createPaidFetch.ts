/**
 * x402 auto-pay fetch using Solana keypair (SYRA_PAYER_KEYPAIR).
 * Same stack as api/libs/sentinelPayer.js — @x402/fetch + ExactSvmScheme.
 */
import bs58 from "bs58";

let cachedPaidFetch: typeof fetch | null = null;

function parseKeypairBytes(raw: string): Uint8Array {
  let s = raw.trim();
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.slice(1, -1).trim();
  }
  if (!s) throw new Error("SYRA_PAYER_KEYPAIR is empty");

  if (s.startsWith("[")) {
    const arr = JSON.parse(s) as unknown;
    if (!Array.isArray(arr) || arr.length < 32) {
      throw new Error("SYRA_PAYER_KEYPAIR JSON must be an array of at least 32 bytes");
    }
    return Uint8Array.from(arr as number[]);
  }

  return bs58.decode(s);
}

function getSvmRpcUrl(): string {
  return (
    process.env.SYRA_SOLANA_RPC_URL?.trim() ||
    process.env.SOLANA_RPC_URL?.trim() ||
    "https://api.mainnet-beta.solana.com"
  );
}

export async function createPaidFetch(keypairEnv: string): Promise<typeof fetch> {
  const secretBytes = parseKeypairBytes(keypairEnv);
  const { createKeyPairSignerFromBytes } = await import("@solana/kit");
  const { wrapFetchWithPayment } = await import("@x402/fetch");
  const { x402Client } = await import("@x402/core/client");
  const { ExactSvmScheme } = await import("@x402/svm/exact/client");

  const signer = await createKeyPairSignerFromBytes(secretBytes);
  const scheme = new ExactSvmScheme(signer, { rpcUrl: getSvmRpcUrl() });
  const client = x402Client.fromConfig({ schemes: [{ network: "solana:*", client: scheme }] });
  return wrapFetchWithPayment(globalThis.fetch, client);
}

export async function getPaidFetch(): Promise<typeof fetch> {
  const keypair = process.env.SYRA_PAYER_KEYPAIR?.trim();
  if (!keypair) return globalThis.fetch;
  if (!cachedPaidFetch) {
    cachedPaidFetch = await createPaidFetch(keypair);
  }
  return cachedPaidFetch;
}

export function hasPaidFetchConfigured(): boolean {
  return Boolean(process.env.SYRA_PAYER_KEYPAIR?.trim());
}
