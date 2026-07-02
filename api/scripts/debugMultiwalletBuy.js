import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import { Keypair, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import bs58 from 'bs58';
import MultiWallet from '../models/multiWallet/MultiWallet.js';
import { withSolanaRpcFallback } from '../libs/solanaServerRpc.js';
import { decryptAgentSecretFromStorage } from '../libs/agentWalletSecretCrypto.js';
import { executeAnsemBuy } from '../libs/multiWalletService.js';
import { DEFAULT_FUND_SOL, DEFAULT_SWAP_SOL } from '../config/multiWallet.js';

await mongoose.connect(process.env.MONGODB_URI);
const doc = await MultiWallet.findOne({ ansemBuyError: { $ne: null }, status: 'active' })
  .select('+secretKey')
  .lean();
if (!doc) {
  console.log('no failed wallet');
  process.exit(0);
}

const pk = doc.publicKey;
await withSolanaRpcFallback(async (conn) => {
  const bal = await conn.getBalance(new PublicKey(pk));
  console.log('wallet', pk);
  console.log('balance', bal, 'SOL', bal / LAMPORTS_PER_SOL);
  console.log('fund target', DEFAULT_FUND_SOL, 'swap target', DEFAULT_SWAP_SOL);
  console.log('min needed estimate', DEFAULT_SWAP_SOL + 0.00204 + 0.001, 'SOL (swap+ATA+fees)');
  console.log('last error', doc.ansemBuyError?.slice(0, 200));
});

// dry-run simulate only if --buy flag
if (process.argv.includes('--buy') && doc.ownerWallet) {
  const res = await executeAnsemBuy(doc.ownerWallet, [pk], DEFAULT_SWAP_SOL);
  console.log('buy result', JSON.stringify(res, null, 2));
}

await mongoose.disconnect();
