/**
 * Sweep Solana agent wallet USDC + excess SOL to the user's linked wallet (must match DB walletAddress).
 */
import { Connection, PublicKey, Transaction, SystemProgram } from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import AgentWallet from '../models/agent/AgentWallet.js';
import { getSolanaAgentKeypair } from './agentWallet.js';

const USDC_MAINNET = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
const RPC_URL = process.env.SOLANA_RPC_URL || process.env.VITE_SOLANA_RPC_URL || 'https://rpc.ankr.com/solana';
const RPC_TIMEOUT_MS = Number(process.env.SOLANA_RPC_TIMEOUT_MS) || 30_000;

function fetchWithTimeout(url, init = {}) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), RPC_TIMEOUT_MS);
  return fetch(url, { ...init, signal: init.signal || controller.signal }).finally(() =>
    clearTimeout(id)
  );
}

/** Keep a small SOL balance on the agent for rent and future fees. */
const MIN_AGENT_LAMPORTS = BigInt(Math.ceil(0.002 * 1e9));
const TX_FEE_BUFFER_LAMPORTS = 80_000n;

/**
 * @param {string} anonymousId
 * @param {string} recipientBase58 - Must equal AgentWallet.walletAddress for this anonymousId
 * @returns {Promise<{ signature: string }>}
 */
export async function withdrawSolanaAgentToRecipient(anonymousId, recipientBase58) {
  const id = String(anonymousId || '').trim();
  const recipientStr = String(recipientBase58 || '').trim();
  if (!id || !recipientStr) {
    throw new Error('anonymousId and recipient are required');
  }

  let recipient;
  try {
    recipient = new PublicKey(recipientStr);
  } catch {
    throw new Error('Invalid recipient address');
  }

  const doc = await AgentWallet.findOne({ anonymousId: id }).lean();
  if (!doc?.agentAddress) {
    throw new Error('Agent wallet not found');
  }
  if (doc.chain === 'base') {
    throw new Error('Withdraw for Base is not supported yet. Use Solana or contact support.');
  }
  if (!doc.walletAddress) {
    throw new Error('Connect your Solana wallet in Syra before withdrawing.');
  }
  if (doc.walletAddress !== recipientStr) {
    throw new Error('Withdraw only to your linked wallet.');
  }

  const agentKeypair = await getSolanaAgentKeypair(id);
  if (!agentKeypair) {
    throw new Error('Could not load agent wallet');
  }
  const agentPk = agentKeypair.publicKey;
  if (agentPk.toBase58() !== doc.agentAddress) {
    throw new Error('Agent wallet configuration error');
  }

  const connection = new Connection(RPC_URL, {
    commitment: 'confirmed',
    fetch: fetchWithTimeout,
  });

  const [lamportsBalance, tokenResp] = await Promise.all([
    connection.getBalance(agentPk, 'confirmed'),
    connection.getParsedTokenAccountsByOwner(agentPk, { mint: USDC_MAINNET }),
  ]);

  const tokenAccounts = tokenResp?.value ?? [];
  const instructions = [];

  const userUsdcAta = await getAssociatedTokenAddress(
    USDC_MAINNET,
    recipient,
    false,
    TOKEN_PROGRAM_ID
  );
  const userAtaInfo = await connection.getAccountInfo(userUsdcAta, 'confirmed');
  if (!userAtaInfo) {
    instructions.push(
      createAssociatedTokenAccountInstruction(
        agentPk,
        userUsdcAta,
        recipient,
        USDC_MAINNET,
        TOKEN_PROGRAM_ID
      )
    );
  }

  for (const row of tokenAccounts) {
    const info = row?.account?.data?.parsed?.info;
    const rawStr = info?.tokenAmount?.amount;
    if (!rawStr) continue;
    const raw = BigInt(rawStr);
    if (raw <= 0n) continue;
    const sourceAta = row.pubkey;
    instructions.push(
      createTransferInstruction(
        sourceAta,
        userUsdcAta,
        agentPk,
        raw,
        [],
        TOKEN_PROGRAM_ID
      )
    );
  }

  const solAfterTx =
    BigInt(lamportsBalance) > MIN_AGENT_LAMPORTS + TX_FEE_BUFFER_LAMPORTS
      ? BigInt(lamportsBalance) - MIN_AGENT_LAMPORTS - TX_FEE_BUFFER_LAMPORTS
      : 0n;

  if (solAfterTx > 0n) {
    instructions.push(
      SystemProgram.transfer({
        fromPubkey: agentPk,
        toPubkey: recipient,
        lamports: solAfterTx,
      })
    );
  }

  if (instructions.length === 0) {
    throw new Error('Nothing to withdraw');
  }

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
  const tx = new Transaction();
  tx.feePayer = agentPk;
  tx.recentBlockhash = blockhash;
  for (const ix of instructions) {
    tx.add(ix);
  }
  tx.sign(agentKeypair);

  const signature = await connection.sendRawTransaction(tx.serialize(), {
    skipPreflight: false,
    maxRetries: 3,
  });

  await connection.confirmTransaction(
    { signature, blockhash, lastValidBlockHeight },
    'confirmed'
  );

  return { signature };
}
