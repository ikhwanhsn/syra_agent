/**
 * Probe StableSocial SIWX header format for GET /api/jobs
 * Usage: node -r dotenv/config scripts/testStablesocialSiwx.js
 */
import bs58 from 'bs58';
import nacl from 'tweetnacl';
import { SiwxMessage } from '@didtools/siwx';
import { getTreasuryKeypair } from '../libs/agentX402Client.js';

const BASE = 'https://stablesocial.dev';

async function fetchSiwxChallenge(token) {
  const uri = `${BASE}/api/jobs?token=${encodeURIComponent(token)}`;
  const res = await fetch(uri, { headers: { Accept: 'application/json' } });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body, uri };
}

function buildMessageSiwx(info, address) {
  const msg = new SiwxMessage({
    domain: info.domain,
    network: 'Solana',
    address,
    statement: info.statement,
    uri: info.uri,
    version: info.version,
    chainId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
    type: 'ed25519',
    nonce: info.nonce,
    issuedAt: info.issuedAt,
    expirationTime: info.expirationTime,
  });
  return msg.toString();
}

function signEd25519(keypair, message) {
  const bytes = new TextEncoder().encode(message);
  const sig = nacl.sign.detached(bytes, keypair.secretKey);
  return bs58.encode(sig);
}

async function tryPoll(token, payload) {
  const uri = `${BASE}/api/jobs?token=${encodeURIComponent(token)}`;
  const headerVal =
    typeof payload === 'string' ? payload : Buffer.from(JSON.stringify(payload)).toString('base64');
  const res = await fetch(uri, {
    headers: { Accept: 'application/json', 'SIGN-IN-WITH-X': headerVal },
  });
  const text = await res.text();
  return { status: res.status, text: text.slice(0, 300) };
}

function buildSignedPayload(keypair, info, uri) {
  const address = keypair.publicKey.toBase58();
  const msg = new SiwxMessage({
    domain: info.domain,
    network: 'Solana',
    address,
    statement: info.statement,
    uri,
    version: info.version,
    chainId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
    nonce: info.nonce,
    issuedAt: info.issuedAt,
    expirationTime: info.expirationTime,
  });
  const text = msg.toString();
  const sigBytes = nacl.sign.detached(new TextEncoder().encode(text), keypair.secretKey);
  return {
    domain: msg.domain,
    address: msg.address,
    statement: msg.statement,
    uri: msg.uri,
    version: msg.version,
    chainId: msg.chainId,
    type: 'ed25519',
    nonce: msg.nonce,
    issuedAt: msg.issuedAt,
    expirationTime: msg.expirationTime,
    signature: Buffer.from(sigBytes).toString('base64'),
  };
}

async function main() {
  const keypair = getTreasuryKeypair();
  if (!keypair) throw new Error('AGENT_PRIVATE_KEY required');
  const token = 'fake-token-probe';

  const { body, uri } = await fetchSiwxChallenge(token);
  const info = body?.extensions?.['sign-in-with-x']?.info;
  if (!info) {
    console.error('No SIWX challenge', body);
    process.exit(1);
  }

  const signed = buildSignedPayload(keypair, info, uri);
  const out = await tryPoll(token, signed);
  console.log('poll', out.status, out.text);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
