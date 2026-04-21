/**
 * Check treasury (AGENT_PRIVATE_KEY) wallet USDC + SOL balance on Solana mainnet.
 */
import 'dotenv/config';
import { getTreasuryKeypair } from '../libs/agentX402Client.js';
import { Connection, PublicKey } from '@solana/web3.js';

const USDC_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');
const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');

function getAta(owner, mint) {
  const [ata] = PublicKey.findProgramAddressSync(
    [owner.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    ASSOCIATED_TOKEN_PROGRAM_ID
  );
  return ata;
}

async function main() {
  const kp = getTreasuryKeypair();
  if (!kp) {
    console.log('No AGENT_PRIVATE_KEY set');
    return;
  }
  const pubkey = kp.publicKey;
  console.log('Treasury pubkey:', pubkey.toBase58());
  const rpc =
    process.env.SOLANA_RPC_URL ||
    process.env.SOLANA_RPC_BLOCKCHAIN_URL ||
    'https://api.mainnet-beta.solana.com';
  console.log('RPC:', rpc);
  const conn = new Connection(rpc, 'confirmed');

  const solLamports = await conn.getBalance(pubkey);
  console.log(`SOL: ${(solLamports / 1e9).toFixed(6)} SOL`);

  const ata = getAta(pubkey, USDC_MINT);
  console.log('USDC ATA:', ata.toBase58());
  const info = await conn.getAccountInfo(ata);
  if (!info) {
    console.log('USDC ATA does not exist on-chain — treasury has no USDC account');
    return;
  }
  const bal = await conn.getTokenAccountBalance(ata);
  console.log(`USDC: ${bal?.value?.uiAmountString ?? 'unknown'}`);
}

main().catch((e) => {
  console.error('threw:', e?.message || e);
  process.exit(1);
});
