import { Connection, type Commitment } from "@solana/web3.js";
import { env } from "@/lib/env";

function isDevnetNetwork(): boolean {
  return env.solanaNetwork !== "mainnet-beta";
}

/** Public endpoints used when the configured RPC returns 403 / rate limits. */
const PUBLIC_MAINNET_RPCS = [
  "https://api.mainnet-beta.solana.com",
  "https://solana-rpc.publicnode.com",
  "https://rpc.ankr.com/solana",
] as const;

const PUBLIC_DEVNET_RPCS = ["https://api.devnet.solana.com"] as const;

/**
 * RPC errors we should retry on the next endpoint (403, restricted keys, rate limits).
 */
export function isSolanaRpcRetryableError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  return (
    /not allowed to access blockchain|API key is not allowed/i.test(msg) ||
    /json-rpc code:\s*-32052|-32052/i.test(msg) ||
    /\b403\b|\b401\b|\b429\b/i.test(msg) ||
    /access forbidden|forbidden|access denied|too many requests|rate limit/i.test(msg)
  );
}

/** @deprecated Use isSolanaRpcRetryableError */
export const isSolanaRpcAccessDeniedError = isSolanaRpcRetryableError;

/** Ordered RPC URLs: env first, then public fallbacks (deduped). */
export function getSolanaRpcUrlCandidates(): string[] {
  const primary = env.solanaRpcUrl?.trim();
  const fallbacks = isDevnetNetwork() ? [...PUBLIC_DEVNET_RPCS] : [...PUBLIC_MAINNET_RPCS];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const url of [primary, ...fallbacks].filter((u): u is string => Boolean(u))) {
    if (!seen.has(url)) {
      seen.add(url);
      out.push(url);
    }
  }
  return out;
}

export function getPrimarySolanaRpcUrl(): string {
  const candidates = getSolanaRpcUrlCandidates();
  return candidates[0] ?? "https://api.mainnet-beta.solana.com";
}

export function createSolanaConnection(
  rpcUrl: string,
  commitment: Commitment = "confirmed",
): Connection {
  return new Connection(rpcUrl, commitment);
}

let cachedReadRpcUrl: string | null = null;

export function clearSolanaRpcReadCache(): void {
  cachedReadRpcUrl = null;
}

/**
 * Run a read-only RPC operation, trying fallbacks when the primary endpoint fails.
 */
export async function withRpcFallback<T>(
  operation: (connection: Connection) => Promise<T>,
): Promise<T> {
  const candidates = getSolanaRpcUrlCandidates();

  if (cachedReadRpcUrl && candidates.includes(cachedReadRpcUrl)) {
    try {
      return await operation(createSolanaConnection(cachedReadRpcUrl));
    } catch (error) {
      if (!isSolanaRpcRetryableError(error)) throw error;
      cachedReadRpcUrl = null;
    }
  }

  let lastError: unknown;
  for (const rpcUrl of candidates) {
    try {
      const result = await operation(createSolanaConnection(rpcUrl));
      cachedReadRpcUrl = rpcUrl;
      return result;
    } catch (error) {
      lastError = error;
      // Try next endpoint for access/rate-limit errors and generic network failures.
      if (!isSolanaRpcRetryableError(error)) {
        const msg = error instanceof Error ? error.message : String(error);
        const isNetwork =
          /failed to fetch|network|timeout|ECONNREFUSED|ETIMEDOUT|Load failed/i.test(msg);
        if (!isNetwork) throw error;
      }
    }
  }

  const hint =
    "Could not read Solana data from any RPC. Set VITE_SOLANA_RPC_URL to a working endpoint (e.g. https://api.mainnet-beta.solana.com) or check your network.";
  throw new Error(
    lastError instanceof Error ? `${hint} Last error: ${lastError.message}` : hint,
  );
}
