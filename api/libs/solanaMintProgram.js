/**
 * Resolve SPL vs Token-2022 program for a mint (pump.fun new tokens use Token-2022).
 */
import { PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';

/**
 * @param {import('@solana/web3.js').Connection} connection
 * @param {import('@solana/web3.js').PublicKey} mintPk
 * @returns {Promise<import('@solana/spl-token').PublicKey>}
 */
export async function resolveSplTokenProgramId(connection, mintPk) {
  const info = await connection.getAccountInfo(mintPk, 'confirmed');
  if (!info) {
    throw new Error('Mint account not found on Solana');
  }
  if (info.owner.equals(TOKEN_2022_PROGRAM_ID)) return TOKEN_2022_PROGRAM_ID;
  if (info.owner.equals(TOKEN_PROGRAM_ID)) return TOKEN_PROGRAM_ID;
  throw new Error(`Unsupported token program: ${info.owner.toBase58()}`);
}

/** @param {unknown} err */
export function formatSolanaReadError(err, context = 'On-chain read') {
  if (err instanceof Error && err.message?.trim()) return err.message;
  if (typeof err === 'string' && err.trim()) return err.trim();
  return `${context} failed`;
}
