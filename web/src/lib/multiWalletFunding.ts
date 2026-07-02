import { PublicKey, SystemProgram, Transaction } from "@solana/web3.js";

/** Solana legacy transaction packet size limit (bytes). */
const MAX_TX_PACKET_BYTES = 1232;
/** Leave headroom for signature set variance. */
const TX_SIZE_SAFETY_MARGIN = 32;

export interface BuildFundingTransactionsInput {
  from: PublicKey;
  recipients: string[];
  lamportsPerWallet: number;
  recentBlockhash: string;
}

function cloneTransaction(tx: Transaction): Transaction {
  const copy = new Transaction();
  copy.feePayer = tx.feePayer;
  copy.recentBlockhash = tx.recentBlockhash;
  for (const ix of tx.instructions) {
    copy.add(ix);
  }
  return copy;
}

function serializedUnsignedSize(tx: Transaction): number {
  return tx.serialize({
    requireAllSignatures: false,
    verifySignatures: false,
  }).length;
}

/**
 * Pack as many SOL transfers as possible per transaction, staying under the packet limit.
 */
export function buildFundingTransactionBatches(input: BuildFundingTransactionsInput): Transaction[] {
  const { from, recipients, lamportsPerWallet, recentBlockhash } = input;
  const maxBytes = MAX_TX_PACKET_BYTES - TX_SIZE_SAFETY_MARGIN;

  const batches: Transaction[] = [];
  let current = new Transaction();
  current.feePayer = from;
  current.recentBlockhash = recentBlockhash;

  for (const recipient of recipients) {
    const transfer = SystemProgram.transfer({
      fromPubkey: from,
      toPubkey: new PublicKey(recipient),
      lamports: lamportsPerWallet,
    });

    const trial = cloneTransaction(current);
    trial.add(transfer);
    const fits = serializedUnsignedSize(trial) <= maxBytes;

    if (!fits && current.instructions.length > 0) {
      batches.push(current);
      current = new Transaction();
      current.feePayer = from;
      current.recentBlockhash = recentBlockhash;
      current.add(transfer);
    } else {
      current.add(transfer);
    }
  }

  if (current.instructions.length > 0) {
    batches.push(current);
  }

  return batches;
}
