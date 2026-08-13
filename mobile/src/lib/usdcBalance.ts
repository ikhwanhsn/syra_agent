import {Connection, PublicKey} from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  getAccount,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import {USDC_MINT} from './env';

export async function fetchUsdcBalance(
  connection: Connection,
  owner: PublicKey,
): Promise<number> {
  try {
    const mint = new PublicKey(USDC_MINT);
    const ata = await getAssociatedTokenAddress(mint, owner, false, TOKEN_PROGRAM_ID);
    const account = await getAccount(connection, ata, 'confirmed');
    return Number(account.amount) / 1_000_000;
  } catch {
    return 0;
  }
}
