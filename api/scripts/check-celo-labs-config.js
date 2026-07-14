/**
 * Smoke-check Celo Labs x402 configuration (no on-chain spend).
 * Asserts ERC-8021 Schema 2 builder-code suffix encodes/decodes with our `a` code.
 * Usage: node scripts/check-celo-labs-config.js
 */
import dotenv from 'dotenv';
dotenv.config();

import { getCeloRpcUrl, CELO_USDC_MAINNET, CELO_MAINNET_CAIP2 } from '../config/celoX402Networks.js';
import { getCeloBuilderCode, getCeloFacilitatorWalletCode } from '../config/celoBuilderCode.js';
import {
  getCeloDataSuffix,
  decodeCeloAttribution,
  parseBuilderCodeSuffixFromCalldata,
} from '../utils/celoAttribution.js';
import { createPublicClient, http, formatEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { celo } from 'viem/chains';

const code = getCeloBuilderCode();
const walletCode = getCeloFacilitatorWalletCode();
const suffix = getCeloDataSuffix();
const settlerKey = String(process.env.CELO_SETTLER_PRIVATE_KEY || '').trim();
const settleViaFacilitator = ['1', 'true', 'yes'].includes(
  String(process.env.CELO_SETTLE_VIA_FACILITATOR || '')
    .trim()
    .toLowerCase(),
);

console.log('Celo Labs config check');
console.log('----------------------');
console.log('CAIP-2:', CELO_MAINNET_CAIP2);
console.log('USDC:', CELO_USDC_MAINNET);
console.log('RPC:', getCeloRpcUrl());
console.log(
  'CELO_BUILDER_CODE / CELO_ATTRIBUTION_TAG (a):',
  code || '(missing — register via celobuilders.xyz)',
);
console.log('CELO_FACILITATOR_WALLET_CODE (w):', walletCode || '(optional, unset)');
console.log('CELO_SETTLE_VIA_FACILITATOR:', settleViaFacilitator);
console.log('Schema 2 dataSuffix:', suffix || '(none)');

let schema2Ok = false;
if (suffix) {
  const decoded = decodeCeloAttribution(suffix);
  const parsed = parseBuilderCodeSuffixFromCalldata(suffix);
  console.log('decoded:', decoded);
  console.log('parseBuilderCodeSuffixFromCalldata:', parsed);
  schema2Ok =
    Boolean(parsed?.a) &&
    parsed.a === code &&
    Boolean(decoded?.schemaId === 2) &&
    String(suffix).toLowerCase().includes('80218021802180218021802180218021') &&
    // Schema id byte 0x02 immediately before the 16-byte marker
    String(suffix).toLowerCase().includes('0280218021802180218021802180218021');
  console.log('Schema 2 ok:', schema2Ok);
  if (!schema2Ok) {
    console.warn(
      'WARNING: suffix is not a valid ERC-8021 Schema 2 builder-code with our app code `a`.',
    );
  }
}

if (!settlerKey) {
  console.log('CELO_SETTLER_PRIVATE_KEY: (missing — required for self-settlement gas)');
  process.exitCode = code && suffix && schema2Ok ? 0 : 1;
} else {
  let hex = settlerKey;
  if (hex.startsWith('0x') || hex.startsWith('0X')) hex = hex.slice(2);
  const account = privateKeyToAccount(/** @type {`0x${string}`} */ (`0x${hex}`));
  const client = createPublicClient({ chain: celo, transport: http(getCeloRpcUrl()) });
  const bal = await client.getBalance({ address: account.address });
  console.log('Settler address:', account.address);
  console.log('Settler CELO balance:', formatEther(bal));
  process.exitCode = Number(bal) > 0 && code && schema2Ok ? 0 : 1;
}

console.log(
  process.exitCode === 0
    ? '\nOK — ready for funded Labs Celo runs (Schema 2 attribution)'
    : '\nNOT READY — fix missing env / funding / Schema 2 encoding',
);
