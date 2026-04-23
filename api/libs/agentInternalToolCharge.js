/**
 * Internal tool charge: direct SPL-USDC transfer from Solana agent wallet → Syra receiver
 * (SOLANA_PAYTO / ADDRESS_PAYAI). Used by /agent/tools/call for tools that run fully in-process
 * (agentDirect) instead of going through a self-loop x402 HTTP route. Preserves revenue without
 * facilitator hop.
 *
 * Input: { anonymousId, priceUsd, toolId }
 * Output: { success: true, signature } | { success: false, error }
 *
 * Policy:
 * - Only charges when priceUsd > 0 (free tools no-op).
 * - Requires a Solana agent (Base agents are not supported here — they get an error to keep
 *   payment accounting deterministic).
 * - Amount is converted to USDC base units (6 decimals) via Math.round to match x402 pricing.
 * - Submits non-blocking; returns signature immediately and confirms in background (same pattern
 *   as withdraw helper).
 */
import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import AgentWallet from '../models/agent/AgentWallet.js';
import { getSolanaAgentKeypair } from './agentWallet.js';
import { pickSolanaConnectionForReads } from './solanaServerRpc.js';
import { recordPaidApiCall } from '../utils/recordPaidApiCall.js';

const USDC_MINT_ADDRESS =
  (process.env.SOLANA_USDC_MINT || process.env.USDC_MINT || 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v').trim();

function getReceiverAddress() {
  return (
    process.env.SOLANA_PAYTO ||
    process.env.ADDRESS_PAYAI ||
    process.env.ADDRESS ||
    ''
  ).trim();
}

/**
 * @param {number} usd
 * @returns {bigint}
 */
function usdToUsdcBaseUnits(usd) {
  if (!Number.isFinite(usd) || usd <= 0) return 0n;
  return BigInt(Math.round(usd * 1_000_000));
}

/**
 * Charge the agent wallet on-chain for an internal (agentDirect) tool call.
 * @param {{ anonymousId: string, priceUsd: number, toolId: string, toolPath?: string }} args
 * @returns {Promise<{ success: true, signature: string | null, amountUsd: number } | { success: false, error: string }>}
 */
export async function chargeAgentForInternalTool({ anonymousId, priceUsd, toolId, toolPath }) {
  const id = typeof anonymousId === 'string' ? anonymousId.trim() : '';
  if (!id) return { success: false, error: 'anonymousId is required' };

  const usd = Number(priceUsd);
  if (!Number.isFinite(usd) || usd <= 0) {
    return { success: true, signature: null, amountUsd: 0 };
  }

  const receiverStr = getReceiverAddress();
  if (!receiverStr) {
    return { success: false, error: 'Payment receiver is not configured (SOLANA_PAYTO)' };
  }

  let receiver;
  try {
    receiver = new PublicKey(receiverStr);
  } catch {
    return { success: false, error: 'Invalid SOLANA_PAYTO address' };
  }

  const doc = await AgentWallet.findOne({ anonymousId: id }).lean();
  if (!doc?.agentAddress) {
    return { success: false, error: 'Agent wallet not found' };
  }
  if (doc.chain === 'base') {
    return {
      success: false,
      error: 'Base agent wallets cannot settle Solana USDC tools. Connect a Solana wallet to use this tool.',
    };
  }

  const keypair = await getSolanaAgentKeypair(id);
  if (!keypair) {
    return { success: false, error: 'Could not load Solana agent wallet' };
  }
  const agentPk = keypair.publicKey;

  const amountRaw = usdToUsdcBaseUnits(usd);
  if (amountRaw <= 0n) {
    return { success: true, signature: null, amountUsd: 0 };
  }

  let connection;
  try {
    const picked = await pickSolanaConnectionForReads(agentPk);
    connection = picked.connection;
  } catch (err) {
    return {
      success: false,
      error: `Solana RPC unavailable: ${err?.message || String(err)}`,
    };
  }

  const usdcMint = new PublicKey(USDC_MINT_ADDRESS);
  const agentUsdcAta = await getAssociatedTokenAddress(usdcMint, agentPk, false, TOKEN_PROGRAM_ID);
  const receiverUsdcAta = await getAssociatedTokenAddress(
    usdcMint,
    receiver,
    true,
    TOKEN_PROGRAM_ID,
  );

  const instructions = [];
  const [agentAtaInfo, receiverAtaInfo] = await Promise.all([
    connection.getAccountInfo(agentUsdcAta, 'confirmed'),
    connection.getAccountInfo(receiverUsdcAta, 'confirmed'),
  ]);

  if (!agentAtaInfo) {
    return {
      success: false,
      error: 'Agent has no USDC account yet. Deposit USDC to your agent wallet to use paid tools.',
    };
  }
  if (!receiverAtaInfo) {
    instructions.push(
      createAssociatedTokenAccountInstruction(
        agentPk,
        receiverUsdcAta,
        receiver,
        usdcMint,
        TOKEN_PROGRAM_ID,
      ),
    );
  }

  instructions.push(
    createTransferInstruction(
      agentUsdcAta,
      receiverUsdcAta,
      agentPk,
      amountRaw,
      [],
      TOKEN_PROGRAM_ID,
    ),
  );

  let blockhash;
  let lastValidBlockHeight;
  try {
    const latest = await connection.getLatestBlockhash('confirmed');
    blockhash = latest.blockhash;
    lastValidBlockHeight = latest.lastValidBlockHeight;
  } catch (err) {
    return {
      success: false,
      error: `Failed to get recent blockhash: ${err?.message || String(err)}`,
    };
  }

  const tx = new Transaction();
  tx.feePayer = agentPk;
  tx.recentBlockhash = blockhash;
  for (const ix of instructions) tx.add(ix);
  tx.sign(keypair);

  let signature;
  try {
    signature = await connection.sendRawTransaction(tx.serialize(), {
      skipPreflight: false,
      maxRetries: 3,
    });
  } catch (err) {
    return {
      success: false,
      error: `Failed to submit USDC charge: ${err?.message || String(err)}`,
    };
  }

  void connection
    .confirmTransaction({ signature, blockhash, lastValidBlockHeight }, 'confirmed')
    .catch((err) => {
      console.warn(
        `[agentInternalToolCharge] post-send confirm failed (${toolId}):`,
        signature,
        err?.message || err,
      );
    });

  void recordPaidApiCall(
    { path: toolPath || `/agent/tools/${toolId}` },
    { source: 'agent' },
  ).catch(() => {});

  return { success: true, signature, amountUsd: usd };
}
