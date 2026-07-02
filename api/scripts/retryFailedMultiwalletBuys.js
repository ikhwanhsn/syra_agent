import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import MultiWallet from '../models/multiWallet/MultiWallet.js';
import { executeAnsemBuy } from '../libs/multiWalletService.js';
import { DEFAULT_SWAP_SOL } from '../config/multiWallet.js';

await mongoose.connect(process.env.MONGODB_URI);
const failed = await MultiWallet.find({
  ansemBuyError: { $ne: null },
  status: 'active',
  ansemBought: { $ne: true },
}).lean();

console.log('failed count', failed.length);
const byOwner = new Map();
for (const w of failed) {
  if (!byOwner.has(w.ownerWallet)) byOwner.set(w.ownerWallet, []);
  byOwner.get(w.ownerWallet).push(w.publicKey);
}

for (const [owner, pks] of byOwner) {
  console.log('retrying', pks.length, 'for', owner.slice(0, 8));
  const res = await executeAnsemBuy(owner, pks, DEFAULT_SWAP_SOL);
  console.log('succeeded', res.succeeded, 'failed', res.failed);
  for (const r of res.results.filter((x) => !x.success)) {
    console.log(' err', r.publicKey.slice(0, 8), r.error?.slice(0, 160));
  }
}

await mongoose.disconnect();
