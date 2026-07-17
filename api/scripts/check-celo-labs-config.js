/**
 * Smoke-check Celo Labs x402 configuration (no on-chain spend).
 * Asserts ERC-8021 Schema 2 builder-code suffix encodes/decodes with our `a` code.
 * Usage: node scripts/check-celo-labs-config.js
 */
import dotenv from 'dotenv';
dotenv.config();

import {
  getCeloRpcUrl,
  CELO_USDC_MAINNET,
  CELO_MAINNET_CAIP2,
  CELO_FACILITATOR_URL,
  getCeloFacilitatorApiKey,
} from '../config/celoX402Networks.js';
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
const facilitatorApiKey = getCeloFacilitatorApiKey();
const settleViaRaw = String(process.env.CELO_SETTLE_VIA_FACILITATOR || 'true')
  .trim()
  .toLowerCase();
const settleViaFacilitator = settleViaRaw !== '0' && settleViaRaw !== 'false' && settleViaRaw !== 'no';
const allowSelfRaw = String(process.env.CELO_ALLOW_SELF_SETTLE || 'false')
  .trim()
  .toLowerCase();
const allowSelfSettle =
  allowSelfRaw === '1' || allowSelfRaw === 'true' || allowSelfRaw === 'yes';
const selfSettleFallbackRaw = String(process.env.CELO_SELF_SETTLE_FALLBACK || 'true')
  .trim()
  .toLowerCase();
const selfSettleFallback =
  selfSettleFallbackRaw !== '0' &&
  selfSettleFallbackRaw !== 'false' &&
  selfSettleFallbackRaw !== 'no';
const selfSettleEnabled = allowSelfSettle || selfSettleFallback;

function hasValidSettlerKey() {
  let hex = settlerKey;
  if (!hex) return false;
  if (hex.startsWith('0x') || hex.startsWith('0X')) hex = hex.slice(2);
  return /^[0-9a-fA-F]{64}$/.test(hex);
}

console.log('Celo Labs config check');
console.log('----------------------');
console.log('CAIP-2:', CELO_MAINNET_CAIP2);
console.log('USDC:', CELO_USDC_MAINNET);
console.log('RPC:', getCeloRpcUrl());
console.log('Facilitator URL:', CELO_FACILITATOR_URL);
console.log(
  'CELO_FACILITATOR_API_KEY:',
  facilitatorApiKey
    ? `${facilitatorApiKey.slice(0, 12)}… (set — required for x402_* Dune metrics)`
    : '(MISSING — get key + credits at https://x402.celo.org)',
);
console.log(
  'CELO_BUILDER_CODE / CELO_ATTRIBUTION_TAG (a):',
  code || '(missing — register via celobuilders.xyz)',
);
console.log('CELO_FACILITATOR_WALLET_CODE (w):', walletCode || '(optional, unset)');
console.log('CELO_SETTLE_VIA_FACILITATOR:', settleViaFacilitator);
console.log('CELO_SELF_SETTLE_FALLBACK:', selfSettleFallback, '(default true)');
console.log('CELO_ALLOW_SELF_SETTLE:', allowSelfSettle);
console.log('Schema 2 dataSuffix (Track 1 tagged volume):', suffix || '(none)');

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

const track1Ok = Boolean(code && suffix && schema2Ok);
const track2Ok = Boolean(settleViaFacilitator && facilitatorApiKey);

if (settleViaFacilitator && !facilitatorApiKey) {
  console.warn(
    'WARNING: CELO_FACILITATOR_API_KEY missing — x402_settlements / x402_volume_usd will stay 0.',
  );
}

if (selfSettleEnabled) {
  if (!hasValidSettlerKey()) {
    console.warn(
      'WARNING: CELO_SELF_SETTLE_FALLBACK/CELO_ALLOW_SELF_SETTLE is on but CELO_SETTLER_PRIVATE_KEY is missing or invalid — facilitator failures will not fall back to self-settle.',
    );
    console.log('CELO_SETTLER_PRIVATE_KEY: (missing — needed for self-settle fallback)');
  } else {
    let hex = settlerKey;
    if (hex.startsWith('0x') || hex.startsWith('0X')) hex = hex.slice(2);
    const account = privateKeyToAccount(/** @type {`0x${string}`} */ (`0x${hex}`));
    const client = createPublicClient({ chain: celo, transport: http(getCeloRpcUrl()) });
    const bal = await client.getBalance({ address: account.address });
    console.log('Settler address:', account.address);
    console.log('Settler CELO balance:', formatEther(bal));
    if (bal === 0n) {
      console.warn(
        'WARNING: Settler CELO balance is 0 — self-settle fallback will fail until the wallet is funded with CELO for gas.',
      );
    }
  }
} else {
  console.log(
    'Self-settle: disabled (facilitator-only — set CELO_SELF_SETTLE_FALLBACK=true to auto-fallback when facilitator is dry)',
  );
}

// Ready when Track 1 tagging works AND Track 2 facilitator key is configured (when facilitator settle is on).
process.exitCode = track1Ok && (!settleViaFacilitator || track2Ok) ? 0 : 1;

console.log(
  process.exitCode === 0
    ? '\nOK — ready for Labs Celo runs (Track 1 Schema 2 tag + Track 2 facilitator API key)'
    : '\nNOT READY — fix missing CELO_FACILITATOR_API_KEY / tag / Schema 2 encoding',
);
