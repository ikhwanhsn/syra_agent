/**
 * Treasury Solana keypair from AGENT_PRIVATE_KEY (base58).
 * Shared by x402 client and Pact fetch composition (avoids circular imports).
 */
import bs58 from 'bs58';
import { Keypair } from '@solana/web3.js';

/**
 * @returns {import('@solana/web3.js').Keypair | null}
 */
export function getTreasuryKeypair() {
  const raw = process.env.AGENT_PRIVATE_KEY;
  if (!raw || typeof raw !== 'string' || !raw.trim()) return null;
  try {
    const secretKey = bs58.decode(raw.trim());
    return Keypair.fromSecretKey(secretKey);
  } catch {
    return null;
  }
}
