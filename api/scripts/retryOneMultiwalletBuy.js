import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import MultiWallet from '../models/multiWallet/MultiWallet.js';
import { executeAnsemBuy } from '../libs/multiWalletService.js';
import { DEFAULT_SWAP_SOL } from '../config/multiWallet.js';

const pk = process.argv[2];
if (!pk) {
  console.error('usage: node scripts/retryOneMultiwalletBuy.js <publicKey>');
  process.exit(1);
}

await mongoose.connect(process.env.MONGODB_URI);
const doc = await MultiWallet.findOne({ publicKey: pk, status: 'active' }).lean();
if (!doc) {
  console.error('wallet not found');
  process.exit(1);
}
const res = await executeAnsemBuy(doc.ownerWallet, [pk], DEFAULT_SWAP_SOL);
console.log(JSON.stringify(res, null, 2));
await mongoose.disconnect();
