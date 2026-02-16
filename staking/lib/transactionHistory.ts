import type { Connection } from "@solana/web3.js";
import { PublicKey } from "@solana/web3.js";
import { CONFIG } from "@/constants/config";

/** Anchor instruction discriminators (first 8 bytes) from staking IDL */
const DISCRIMINATORS = {
  stake: new Uint8Array([206, 176, 202, 18, 200, 209, 179, 108]),
  unstake: new Uint8Array([90, 95, 107, 42, 205, 124, 50, 225]),
  claim: new Uint8Array([62, 198, 214, 193, 213, 159, 108, 210]),
} as const;

export type StakingTxType = "stake" | "unstake" | "claim" | "transaction";

export interface TransactionHistoryEntry {
  signature: string;
  blockTime: number | null;
  slot: number;
  err: unknown;
  type: StakingTxType;
}

function matchDiscriminator(data: Uint8Array): StakingTxType {
  if (data.length < 8) return "transaction";
  const first8 = data.slice(0, 8);
  for (const [type, disc] of Object.entries(DISCRIMINATORS)) {
    if (first8.every((b, i) => b === (disc as Uint8Array)[i])) {
      return type as StakingTxType;
    }
  }
  return "transaction";
}

/** Decode base58 to Uint8Array (no extra deps: simple base58 decode). */
function base58Decode(str: string): Uint8Array | null {
  const ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  const bytes: number[] = [];
  for (let i = 0; i < str.length; i++) {
    const idx = ALPHABET.indexOf(str[i]);
    if (idx < 0) return null;
    let carry = idx;
    for (let j = 0; j < bytes.length; j++) {
      carry += bytes[j] * 58;
      bytes[j] = carry & 0xff;
      carry >>= 8;
    }
    while (carry > 0) {
      bytes.push(carry & 0xff);
      carry >>= 8;
    }
  }
  for (let i = 0; i < str.length && str[i] === "1"; i++) bytes.push(0);
  return new Uint8Array(bytes.reverse());
}

const PROGRAM_ID_B58 = CONFIG.programId.toBase58();

function inferTypeFromTx(
  instructions: Array<{ programId: PublicKey; data?: string }>,
  innerInstructions: Array<{ instructions: Array<{ programId: PublicKey; data?: string }> }>
): StakingTxType {
  const check = (ix: { programId: PublicKey; data?: string }): StakingTxType | null => {
    if (ix.programId.toBase58() !== PROGRAM_ID_B58) return null;
    if (typeof ix.data !== "string") return "transaction";
    const decoded = base58Decode(ix.data);
    return decoded ? matchDiscriminator(decoded) : null;
  };
  for (const ix of instructions) {
    const t = check(ix);
    if (t) return t;
  }
  for (const block of innerInstructions) {
    for (const ix of block.instructions) {
      const t = check(ix as { programId: PublicKey; data?: string });
      if (t) return t;
    }
  }
  return "transaction";
}

export interface FetchHistoryResult {
  entries: TransactionHistoryEntry[];
  /** Cursor for next page (last signature). Null if no more pages. */
  nextCursor: string | null;
}

/**
 * Fetch transaction history for a wallet (recent signatures),
 * then parse each tx to detect staking instruction type (stake/unstake/claim).
 * Use before (signature) to load older transactions (next page).
 */
export async function fetchTransactionHistory(
  connection: Connection,
  walletPublicKey: PublicKey,
  options: { limit?: number; before?: string } = {}
): Promise<FetchHistoryResult> {
  const { limit = 10, before } = options;
  const sigs = await connection.getSignaturesForAddress(walletPublicKey, {
    limit,
    ...(before ? { before } : {}),
  });

  const entries: TransactionHistoryEntry[] = sigs.map((s) => ({
    signature: s.signature,
    blockTime: s.blockTime,
    slot: s.slot,
    err: s.err,
    type: "transaction" as StakingTxType,
  }));

  const nextCursor =
    sigs.length >= limit && sigs.length > 0
      ? sigs[sigs.length - 1].signature
      : null;

  if (sigs.length === 0) {
    return { entries: [], nextCursor: null };
  }

  const config = { maxSupportedTransactionVersion: 0 as const };
  const txs = await connection.getParsedTransactions(
    sigs.map((s) => s.signature),
    config
  );

  txs.forEach((tx, idx) => {
    const entry = entries[idx];
    if (!entry || !tx?.transaction) return;
    const msg = tx.transaction.message;
    const accountKeys = msg.accountKeys;
    const instructions = msg.instructions.filter(
      (ix): ix is { programId: PublicKey; accounts: PublicKey[]; data: string } =>
        "data" in ix && typeof (ix as { data?: string }).data === "string"
    ) as Array<{ programId: PublicKey; data?: string }>;
    const innerInstructions = (tx.meta?.innerInstructions ?? []).map(
      (block) => ({
        instructions: block.instructions.filter(
          (ix): ix is { programId: PublicKey; data: string } =>
            "data" in ix && typeof (ix as { data?: string }).data === "string"
        ) as Array<{ programId: PublicKey; data?: string }>,
      })
    );
    const hasStakingProgram = accountKeys.some(
      (k) => k.pubkey.toBase58() === PROGRAM_ID_B58
    );
    if (hasStakingProgram) {
      entry.type = inferTypeFromTx(instructions, innerInstructions);
    }
  });

  return { entries, nextCursor };
}
