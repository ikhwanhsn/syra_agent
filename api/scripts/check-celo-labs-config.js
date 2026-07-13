/**
 * Smoke-check Celo Labs x402 configuration (no on-chain spend).
 * Usage: node scripts/check-celo-labs-config.js
 */
import dotenv from 'dotenv';
dotenv.config();

import { getCeloAttributionTag, getCeloRpcUrl, CELO_USDC_MAINNET, CELO_MAINNET_CAIP2 } from '../config/celoX402Networks.js';
import { getCeloDataSuffix, decodeCeloAttribution } from '../utils/celoAttribution.js';
import { createPublicClient, http, formatEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { celo } from 'viem/chains';

const tag = getCeloAttributionTag();
const suffix = getCeloDataSuffix();
const settlerKey = String(process.env.CELO_SETTLER_PRIVATE_KEY || '').trim();

console.log('Celo Labs config check');
console.log('----------------------');
console.log('CAIP-2:', CELO_MAINNET_CAIP2);
console.log('USDC:', CELO_USDC_MAINNET);
console.log('RPC:', getCeloRpcUrl());
console.log('CELO_ATTRIBUTION_TAG:', tag || '(missing — register via celobuilders.xyz)');
console.log('dataSuffix:', suffix || '(none)');
if (suffix) {
  console.log('decoded:', decodeCeloAttribution(suffix));
}

if (!settlerKey) {
  console.log('CELO_SETTLER_PRIVATE_KEY: (missing — required for self-settlement gas)');
  process.exitCode = tag && suffix ? 0 : 1;
} else {
  let hex = settlerKey;
  if (hex.startsWith('0x') || hex.startsWith('0X')) hex = hex.slice(2);
  const account = privateKeyToAccount(/** @type {`0x${string}`} */ (`0x${hex}`));
  const client = createPublicClient({ chain: celo, transport: http(getCeloRpcUrl()) });
  const bal = await client.getBalance({ address: account.address });
  console.log('Settler address:', account.address);
  console.log('Settler CELO balance:', formatEther(bal));
  process.exitCode = Number(bal) > 0 && tag ? 0 : 1;
}

console.log(process.exitCode === 0 ? '\nOK — ready for funded Labs Celo runs' : '\nNOT READY — fix missing env / funding');
