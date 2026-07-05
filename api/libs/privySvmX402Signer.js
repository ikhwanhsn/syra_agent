/**
 * Privy-backed @solana/kit TransactionPartialSigner for x402 ExactSvm payments.
 * Used when AgentWallet.custody === 'privy' (no local secret key).
 */
import { address } from '@solana/addresses';
import { getBase64EncodedWireTransaction } from '@solana/kit';
import { PublicKey, Transaction, VersionedTransaction } from '@solana/web3.js';
import { privySignSolanaTx } from '../services/privyServerWallet.js';

/**
 * Extract the 64-byte ed25519 signature for `agentAddress` from a signed Solana transaction.
 * @param {string} signedTxBase64
 * @param {string} agentAddress
 * @returns {Uint8Array}
 */
function extractSignatureBytesForAddress(signedTxBase64, agentAddress) {
  const buf = Buffer.from(signedTxBase64, 'base64');
  const target = new PublicKey(agentAddress);

  try {
    const vtx = VersionedTransaction.deserialize(buf);
    const keys = vtx.message.staticAccountKeys;
    const idx = keys.findIndex((k) => k.equals(target));
    if (idx >= 0) {
      const sig = vtx.signatures[idx];
      if (sig && !sig.every((b) => b === 0)) return sig;
    }
  } catch {
    // fall through to legacy
  }

  try {
    const legacy = Transaction.from(buf);
    const idx = legacy.signatures.findIndex((s) => s.publicKey.equals(target));
    if (idx >= 0 && legacy.signatures[idx]?.signature) {
      return legacy.signatures[idx].signature;
    }
  } catch {
    // ignore
  }

  throw new Error('privy_sign_signature_not_found');
}

/**
 * @param {{ privyWalletId: string; agentAddress: string }} input
 * @returns {import('@solana/signers').TransactionPartialSigner}
 */
export function createPrivyTransactionPartialSigner({ privyWalletId, agentAddress }) {
  const walletId = String(privyWalletId || '').trim();
  const addrStr = String(agentAddress || '').trim();
  if (!walletId || !addrStr) {
    throw new Error('missing_privy_wallet_id');
  }
  const addr = address(addrStr);

  return {
    address: addr,
    async signTransactions(transactions) {
      const out = [];
      for (const tx of transactions) {
        const wireTx = getBase64EncodedWireTransaction(tx);
        const signed = await privySignSolanaTx({
          privyWalletId: walletId,
          serializedTxBase64: wireTx,
          submit: false,
        });
        if (!signed.signedTxBase64) {
          throw new Error('privy_sign_no_signed_tx');
        }
        const signatureBytes = extractSignatureBytesForAddress(signed.signedTxBase64, addrStr);
        out.push({ [addr]: signatureBytes });
      }
      return out;
    },
  };
}
