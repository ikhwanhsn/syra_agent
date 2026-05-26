/**
 * Test if @x402/fetch auto-handles SIWX on GET /api/jobs after paid trigger.
 * Usage: node -r dotenv/config scripts/testStablesocialX402Fetch.js
 */
import { getTreasuryKeypair } from '../libs/agentX402Client.js';

const BASE = 'https://stablesocial.dev';

async function createPaymentFetch(keypair) {
  const { wrapFetchWithPayment } = await import('@x402/fetch');
  const { x402Client } = await import('@x402/core/client');
  const { ExactSvmScheme } = await import('@x402/svm/exact/client');
  const { createKeyPairSignerFromBytes } = await import('@solana/kit');
  const rpcUrl =
    process.env.SOLANA_RPC_BLOCKCHAIN_URL ||
    process.env.SOLANA_RPC_URL ||
    'https://api.mainnet-beta.solana.com';
  const signer = await createKeyPairSignerFromBytes(keypair.secretKey);
  const scheme = new ExactSvmScheme(signer, { rpcUrl });
  const client = x402Client.fromConfig({ schemes: [{ network: 'solana:*', client: scheme }] });
  return wrapFetchWithPayment(globalThis.fetch.bind(globalThis), client);
}

async function main() {
  const kp = getTreasuryKeypair();
  if (!kp) throw new Error('AGENT_PRIVATE_KEY required');
  const paymentFetch = await createPaymentFetch(kp);

  console.log('--- trigger ---');
  const tRes = await paymentFetch(`${BASE}/api/tiktok/profile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ handle: 'tiktok' }),
  });
  const tBody = await tRes.json().catch(() => ({}));
  console.log('trigger', tRes.status, tBody);

  const token = tBody?.token;
  if (!token) return;

  console.log('--- poll (payment fetch) ---');
  const jobsUrl = `${BASE}/api/jobs?token=${encodeURIComponent(token)}`;
  const pRes = await paymentFetch(jobsUrl, { headers: { Accept: 'application/json' } });
  const pBody = await pRes.json().catch(() => ({}));
  console.log('poll', pRes.status, JSON.stringify(pBody).slice(0, 400));
}

main().catch((e) => {
  console.error('FAILED', e.message || e);
  process.exit(1);
});
