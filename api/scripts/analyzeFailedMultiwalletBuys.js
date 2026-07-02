import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import MultiWallet from '../models/multiWallet/MultiWallet.js';
import { withSolanaRpcFallback } from '../libs/solanaServerRpc.js';
import { executeAnsemBuy } from '../libs/multiWalletService.js';
import { DEFAULT_SWAP_SOL } from '../config/multiWallet.js';

await mongoose.connect(process.env.MONGODB_URI);
const failed = await MultiWallet.find({
  ansemBuyError: { $ne: null },
  status: 'active',
  ansemBought: { $ne: true },
})
  .select('publicKey ownerWallet ansemBuyError')
  .lean();

console.log('failed', failed.length);
const balances = [];
await withSolanaRpcFallback(async (conn) => {
  for (const w of failed.slice(0, 10)) {
    const bal = await conn.getBalance(new PublicKey(w.publicKey), 'confirmed');
    balances.push(bal);
    console.log(w.publicKey.slice(0, 8), bal, (bal / LAMPORTS_PER_SOL).toFixed(4));
  }
});
if (balances.length) {
  const min = Math.min(...balances);
  const max = Math.max(...balances);
  console.log('sample min/max lamports', min, max);
}

if (failed[0] && process.argv.includes('--buy-one')) {
  const w = failed[0];
  console.log('retry one', w.publicKey);
  const res = await executeAnsemBuy(w.ownerWallet, [w.publicKey], DEFAULT_SWAP_SOL);
  console.log(JSON.stringify(res, null, 2));
}

if (process.argv[2] && process.argv[2] !== '--buy-one') {
  const pk = process.argv[2];
  const w = failed.find((x) => x.publicKey.startsWith(pk)) ?? (await MultiWallet.findOne({ publicKey: pk }).lean());
  if (w) {
    console.log('retry arg', w.publicKey);
    const res = await executeAnsemBuy(w.ownerWallet, [w.publicKey], DEFAULT_SWAP_SOL);
    console.log(JSON.stringify(res, null, 2));
  }
}

await mongoose.disconnect();
