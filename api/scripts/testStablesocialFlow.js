/**
 * End-to-end StableSocial: x402 trigger + SIWX poll (via agent client)
 * Usage: npm run test-stablesocial
 */
import { callX402V2WithTreasury } from '../libs/agentX402Client.js';
import { fetchWithSiwx } from '../libs/agentSiwxClient.js';

const BASE = (process.env.STABLESOCIAL_API_BASE_URL || 'https://stablesocial.dev').replace(/\/$/, '');

async function main() {
  const { getTreasuryKeypair } = await import('../libs/agentX402Client.js');
  const keypair = getTreasuryKeypair();
  if (!keypair) throw new Error('AGENT_PRIVATE_KEY not set');

  console.log('Trigger POST /api/tiktok/profile …');
  const trigger = await callX402V2WithTreasury({
    url: `${BASE}/api/tiktok/profile`,
    method: 'POST',
    body: { handle: 'tiktok' },
  });
  if (!trigger.success) {
    throw new Error(`Trigger failed: ${trigger.error}`);
  }
  const token = trigger.data?.token;
  if (!token) {
    console.log('trigger data', JSON.stringify(trigger.data).slice(0, 400));
    throw new Error('No token in trigger response');
  }
  console.log('token ok, polling jobs …');

  const jobsUrl = `${BASE}/api/jobs?token=${encodeURIComponent(token)}`;
  for (let i = 0; i < 24; i++) {
    const { status, data } = await fetchWithSiwx(keypair, jobsUrl);
    const jobStatus = data?.status;
    console.log(`poll ${i + 1}`, status, jobStatus, jobStatus === 'failed' ? data?.error : '');
    if (jobStatus === 'finished') {
      console.log('OK', JSON.stringify(data?.data ?? data).slice(0, 500));
      return;
    }
    if (jobStatus === 'failed') throw new Error(data?.error || 'job failed');
    await new Promise((r) => setTimeout(r, 2500));
  }
  throw new Error('poll timeout');
}

main().catch((e) => {
  console.error('FAILED', e.message || e);
  process.exit(1);
});
