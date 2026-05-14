import { Connection, VersionedTransaction } from "@solana/web3.js";

const RPC_FALLBACK = "https://api.mainnet-beta.solana.com";

let connectionSingleton: Connection | null = null;

export function getSolanaConnection(): Connection {
  if (!connectionSingleton) {
    const url =
      typeof import.meta.env.VITE_SOLANA_RPC_URL === "string" && import.meta.env.VITE_SOLANA_RPC_URL.trim()
        ? import.meta.env.VITE_SOLANA_RPC_URL.trim()
        : RPC_FALLBACK;
    connectionSingleton = new Connection(url, "confirmed");
  }
  return connectionSingleton;
}

export function deserializeVersionedTxFromBase64(base64: string): VersionedTransaction {
  const binary = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  return VersionedTransaction.deserialize(binary);
}

export async function submitSignedVersionedTx(connection: Connection, signed: VersionedTransaction): Promise<string> {
  const sig = await connection.sendRawTransaction(signed.serialize(), {
    skipPreflight: false,
    maxRetries: 5,
  });
  await connection.confirmTransaction(sig, "confirmed");
  return sig;
}

export async function submitBase64VersionedTx(
  base64: string,
  signTransaction: (tx: VersionedTransaction) => Promise<VersionedTransaction>,
  connection: Connection = getSolanaConnection(),
): Promise<string> {
  const tx = deserializeVersionedTxFromBase64(base64);
  const signed = await signTransaction(tx);
  return submitSignedVersionedTx(connection, signed);
}

/**
 * Sign all txs in one wallet prompt, then submit and confirm sequentially (e.g. Rise create flow).
 */
export async function submitOrderedBase64Txs(
  base64s: readonly string[],
  signAllTransactions: (txs: VersionedTransaction[]) => Promise<VersionedTransaction[]>,
  connection: Connection = getSolanaConnection(),
): Promise<string[]> {
  const unsigned = base64s.map(deserializeVersionedTxFromBase64);
  const signed = await signAllTransactions(unsigned);
  const sigs: string[] = [];
  for (const s of signed) {
    sigs.push(await submitSignedVersionedTx(connection, s));
  }
  return sigs;
}
