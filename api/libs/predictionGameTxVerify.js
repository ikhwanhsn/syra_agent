/**
 * On-chain verification for prediction-game join/create payments.
 * Rejects unverified / unconfirmed client-supplied tx signatures.
 */
import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { withSolanaRpcFallback } from "./solanaServerRpc.js";

/**
 * @param {string} txSignature
 * @param {{
 *   expectedSigner: string;
 *   minSol?: number;
 *   recipient?: string | null;
 * }} opts
 * @returns {Promise<{ ok: true; signature: string } | { ok: false; error: string }>}
 */
export async function verifyPredictionGameSolPayment(txSignature, opts) {
  const signature = String(txSignature || "").trim();
  if (!signature) {
    return { ok: false, error: "tx_signature_required" };
  }

  const expectedSigner = String(opts.expectedSigner || "").trim();
  if (!expectedSigner) {
    return { ok: false, error: "expected_signer_required" };
  }

  let signerPk;
  try {
    signerPk = new PublicKey(expectedSigner);
  } catch {
    return { ok: false, error: "invalid_signer_wallet" };
  }

  let recipientPk = null;
  if (opts.recipient) {
    try {
      recipientPk = new PublicKey(String(opts.recipient).trim());
    } catch {
      return { ok: false, error: "invalid_recipient_wallet" };
    }
  }

  let tx;
  try {
    tx = await withSolanaRpcFallback(
      (connection) =>
        connection.getParsedTransaction(signature, {
          maxSupportedTransactionVersion: 0,
          commitment: "confirmed",
        }),
      "prediction-game tx verify",
    );
  } catch (e) {
    return {
      ok: false,
      error: `tx_lookup_failed:${e instanceof Error ? e.message : String(e)}`.slice(0, 160),
    };
  }

  if (!tx) {
    return { ok: false, error: "tx_not_found_or_unconfirmed" };
  }
  if (tx.meta?.err) {
    return { ok: false, error: "tx_failed_onchain" };
  }

  const accountKeys = tx.transaction?.message?.accountKeys || [];
  const signerKeys = accountKeys
    .filter((k) => k.signer || k.signer === true)
    .map((k) => (typeof k.pubkey === "string" ? k.pubkey : k.pubkey?.toBase58?.() || String(k.pubkey)));

  const feePayer =
    typeof accountKeys[0]?.pubkey === "string"
      ? accountKeys[0].pubkey
      : accountKeys[0]?.pubkey?.toBase58?.() || null;

  const signerSet = new Set(
    [...signerKeys, feePayer].filter(Boolean).map((s) => String(s)),
  );
  if (!signerSet.has(signerPk.toBase58())) {
    return { ok: false, error: "tx_signer_mismatch" };
  }

  const minSol = opts.minSol != null ? Number(opts.minSol) : 0;
  if (minSol > 0 || recipientPk) {
    const minLamports = Math.floor(minSol * LAMPORTS_PER_SOL);
    const instructions = tx.transaction?.message?.instructions || [];
    let transferred = 0;
    let transferredToRecipient = 0;

    for (const ix of instructions) {
      const programId =
        typeof ix.programId === "string" ? ix.programId : ix.programId?.toBase58?.();
      if (programId !== "11111111111111111111111111111111") continue;
      const parsed = ix.parsed;
      if (!parsed || (parsed.type !== "transfer" && parsed.type !== "transferChecked")) continue;
      const info = parsed.info || {};
      const source = info.source || info.authority;
      const destination = info.destination;
      const lamports = Number(info.lamports ?? info.amount ?? 0);
      if (!source || source !== signerPk.toBase58()) continue;
      if (!Number.isFinite(lamports) || lamports <= 0) continue;
      transferred += lamports;
      if (recipientPk && destination === recipientPk.toBase58()) {
        transferredToRecipient += lamports;
      }
    }

    if (recipientPk) {
      if (transferredToRecipient < minLamports) {
        return { ok: false, error: "tx_amount_or_recipient_mismatch" };
      }
    } else if (minLamports > 0 && transferred < minLamports) {
      return { ok: false, error: "tx_amount_mismatch" };
    }
  }

  return { ok: true, signature };
}
