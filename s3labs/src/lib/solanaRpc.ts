import { Connection, type Commitment } from "@solana/web3.js";

/** Public mainnet RPCs — ordered by browser reliability (avoid api.mainnet-beta 403s). */
const PUBLIC_MAINNET_RPCS = [
  "https://solana-rpc.publicnode.com",
  "https://api.mainnet-beta.solana.com",
  "https://rpc.ankr.com/solana",
] as const;

export function isSolanaRpcRetryableError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  return (
    /not allowed to access blockchain|API key is not allowed/i.test(msg) ||
    /json-rpc code:\s*-32052|-32052/i.test(msg) ||
    /\b403\b|\b401\b|\b429\b/i.test(msg) ||
    /access forbidden|forbidden|access denied|too many requests|rate limit/i.test(msg)
  );
}

export function getSolanaRpcUrlCandidates(): string[] {
  const envRpc = import.meta.env.VITE_SOLANA_RPC_URL;
  const primary = typeof envRpc === "string" ? envRpc.trim() : "";
  const out: string[] = [];
  const seen = new Set<string>();
  for (const url of [primary, ...PUBLIC_MAINNET_RPCS].filter(Boolean)) {
    if (!seen.has(url)) {
      seen.add(url);
      out.push(url);
    }
  }
  return out;
}

export function getPrimarySolanaRpcUrl(): string {
  return getSolanaRpcUrlCandidates()[0] ?? PUBLIC_MAINNET_RPCS[0];
}

export function createSolanaConnection(
  rpcUrl: string,
  commitment: Commitment = "confirmed",
): Connection {
  return new Connection(rpcUrl, commitment);
}

let cachedRpcUrl: string | null = null;

/**
 * Run an RPC operation with automatic fallback when the endpoint returns 403 / rate limits.
 */
export async function withRpcFallback<T>(
  operation: (connection: Connection) => Promise<T>,
): Promise<T> {
  const candidates = getSolanaRpcUrlCandidates();

  if (cachedRpcUrl && candidates.includes(cachedRpcUrl)) {
    try {
      return await operation(createSolanaConnection(cachedRpcUrl));
    } catch (error) {
      if (!isSolanaRpcRetryableError(error)) throw error;
      cachedRpcUrl = null;
    }
  }

  let lastError: unknown;
  for (const rpcUrl of candidates) {
    try {
      const result = await operation(createSolanaConnection(rpcUrl));
      cachedRpcUrl = rpcUrl;
      return result;
    } catch (error) {
      lastError = error;
      if (!isSolanaRpcRetryableError(error)) {
        const msg = error instanceof Error ? error.message : String(error);
        const isNetwork =
          /failed to fetch|network|timeout|ECONNREFUSED|ETIMEDOUT|Load failed/i.test(msg);
        if (!isNetwork) throw error;
      }
    }
  }

  const hint =
    "Could not reach Solana RPC. Set VITE_SOLANA_RPC_URL to a working endpoint or try again.";
  throw new Error(
    lastError instanceof Error ? `${hint} Last error: ${lastError.message}` : hint,
  );
}
