/**
 * Register Syra on Celo mainnet ERC-8004 Identity Registry.
 *
 * Mints an agent NFT on:
 *   IdentityRegistry 0x8004A169FB4a3325136EB29fA0ceB6D2e539a432 (eip155:42220)
 *
 * Required env (api/.env):
 *   CELO_SETTLER_PRIVATE_KEY  — EOA with CELO for gas (also used as agent owner)
 *   PINATA_JWT                — pin registration JSON to IPFS
 * Optional:
 *   CELO_RPC_URL
 *   CELO_ATTRIBUTION_TAG      — appended to register calldata (hackathon credit)
 *   SYRA_MCP_URL / BASE_URL
 *
 * Usage:
 *   cd api && node scripts/register-8004-celo-agent.js
 */
import dotenv from 'dotenv';
dotenv.config();

import {
  createPublicClient,
  createWalletClient,
  http,
  encodeFunctionData,
  decodeEventLog,
  parseAbiItem,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { celo } from 'viem/chains';
import { appendCeloDataSuffix, getCeloDataSuffix } from '../utils/celoAttribution.js';
import { getCeloRpcUrl } from '../config/celoX402Networks.js';

const IDENTITY_REGISTRY = '0x8004A169FB4a3325136EB29fA0ceB6D2e539a432';

const REGISTER_ABI = [
  {
    type: 'function',
    name: 'register',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'agentURI', type: 'string' }],
    outputs: [{ name: 'agentId', type: 'uint256' }],
  },
];

const TRANSFER_EVENT = parseAbiItem(
  'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
);

async function pinAgentRegistration(meta) {
  const pinataJwt = String(process.env.PINATA_JWT || '').trim();
  if (!pinataJwt) {
    throw new Error('Missing PINATA_JWT — required to host agent registration JSON on IPFS');
  }
  const res = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${pinataJwt}`,
    },
    body: JSON.stringify({
      pinataContent: meta,
      pinataMetadata: { name: `syra-celo-8004-${Date.now()}` },
    }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Pinata pin failed: ${body?.error || body?.message || res.status}`);
  }
  const cid = body.IpfsHash;
  if (!cid) throw new Error('Pinata response missing IpfsHash');
  return `ipfs://${cid}`;
}

function getAccount() {
  let hex = String(process.env.CELO_SETTLER_PRIVATE_KEY || '').trim();
  if (!hex) {
    throw new Error(
      'CELO_SETTLER_PRIVATE_KEY is required (funded Celo EOA that will own the agent NFT)',
    );
  }
  if (hex.startsWith('0x') || hex.startsWith('0X')) hex = hex.slice(2);
  if (!/^[0-9a-fA-F]{64}$/.test(hex)) {
    throw new Error('CELO_SETTLER_PRIVATE_KEY must be a 32-byte hex private key');
  }
  return privateKeyToAccount(/** @type {`0x${string}`} */ (`0x${hex}`));
}

async function main() {
  const account = getAccount();
  const rpcUrl = getCeloRpcUrl();
  const publicClient = createPublicClient({ chain: celo, transport: http(rpcUrl) });
  const walletClient = createWalletClient({
    account,
    chain: celo,
    transport: http(rpcUrl),
  });

  const bal = await publicClient.getBalance({ address: account.address });
  if (bal === 0n) {
    throw new Error(
      `Settler ${account.address} has 0 CELO — fund it with a little CELO for gas, then retry`,
    );
  }

  const mcpUrl = (process.env.SYRA_MCP_URL || process.env.BASE_URL || 'https://api.syraa.fun')
    .trim()
    .replace(/\/+$/, '');
  const webUrl = (process.env.SYRA_WEB_URL || 'https://syraa.fun').trim().replace(/\/+$/, '');

  const registration = {
    type: 'https://eips.ethereum.org/EIPS/eip-8004#registration-v1',
    name: 'Syra',
    description:
      'Agentic x402 payment rails with real on-chain volume on Celo, Solana, and Base. Self-settled Exact EIP-3009 USDC micropayments with ERC-8021 attribution tagging for the Celo Agentic Payments & DeFAI Hackathon.',
    image: `${webUrl}/images/logo.jpg`,
    endpoints: [
      { type: 'mcp', url: mcpUrl },
      { type: 'web', url: webUrl },
      { type: 'wallet', address: account.address, chainId: 42220 },
    ],
    supportedTrust: ['reputation'],
    x402Support: true,
    active: true,
    registrations: [],
    metadata: {
      attributionTag: process.env.CELO_ATTRIBUTION_TAG || 'celo_3ef93c3cb10b',
      product: 'syra',
      chains: ['celo', 'solana', 'base'],
    },
  };

  console.log('Owner:', account.address);
  console.log('CELO balance:', Number(bal) / 1e18);
  console.log('Pinning registration JSON…');
  const agentURI = await pinAgentRegistration(registration);
  console.log('agentURI:', agentURI);

  const encoded = encodeFunctionData({
    abi: REGISTER_ABI,
    functionName: 'register',
    args: [agentURI],
  });
  const data = appendCeloDataSuffix(encoded, getCeloDataSuffix());

  console.log('Submitting register() on Celo Identity Registry…');
  const hash = await walletClient.sendTransaction({
    to: IDENTITY_REGISTRY,
    data,
    account,
    chain: celo,
  });
  console.log('tx:', hash);
  console.log('celoscan:', `https://celoscan.io/tx/${hash}`);

  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  if (receipt.status !== 'success') {
    throw new Error(`Register tx reverted: ${hash}`);
  }

  let agentId = null;
  for (const log of receipt.logs) {
    try {
      if (log.address.toLowerCase() !== IDENTITY_REGISTRY.toLowerCase()) continue;
      const decoded = decodeEventLog({
        abi: [TRANSFER_EVENT],
        data: log.data,
        topics: log.topics,
      });
      if (decoded.eventName === 'Transfer') {
        agentId = decoded.args.tokenId.toString();
        break;
      }
    } catch {
      /* skip non-matching logs */
    }
  }

  if (!agentId) {
    console.warn('Could not decode agentId from logs — check celoscan Transfer event');
  } else {
    console.log('agentId:', agentId);
    console.log('8004scan:', `https://8004scan.io/agents/celo/${agentId}`);
    console.log(
      'celoscan nft:',
      `https://celoscan.io/nft/${IDENTITY_REGISTRY}/${agentId}`,
    );
  }

  console.log('\nAdd to hackathon submission customFields.erc8004Url once indexed.');
}

main().catch((e) => {
  console.error(e?.message || e);
  process.exit(1);
});
