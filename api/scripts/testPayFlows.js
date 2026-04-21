/**
 * Quick smoke test for Zerion + Birdeye x402 payment flows with the treasury wallet.
 * Usage: `node -r dotenv/config scripts/testPayFlows.js` from the api/ folder.
 * Uses AGENT_PRIVATE_KEY (treasury) so we don't need a user anonymousId.
 */
import { callZerionWithTreasury } from '../libs/agentZerionClient.js';
import { callBirdeyeWithTreasury } from '../libs/agentBirdeyeClient.js';

async function run() {
  console.log('--- Zerion: /v1/gas-prices/ (no path params) ---');
  const zr = await callZerionWithTreasury('/v1/gas-prices/', 'GET', {});
  console.log('Zerion result:', zr.success ? 'OK' : `FAIL: ${zr.error}`);
  if (zr.success) {
    console.log('Zerion data keys:', Object.keys(zr.data || {}).slice(0, 5));
  }

  console.log('\n--- Birdeye: /x402/defi/price?address=So111...&chain=solana ---');
  const br = await callBirdeyeWithTreasury('/x402/defi/price', 'GET', {
    address: 'So11111111111111111111111111111111111111112',
    chain: 'solana',
  });
  console.log('Birdeye result:', br.success ? 'OK' : `FAIL: ${br.error}`);
  if (br.success) {
    console.log('Birdeye data keys:', Object.keys(br.data || {}).slice(0, 5));
  }
}

run().catch((e) => {
  console.error('TEST THREW:', e);
  process.exit(1);
});
