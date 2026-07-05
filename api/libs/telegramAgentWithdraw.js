/**
 * Telegram agent wallet withdraw — send SOL/USDC to any valid Solana address.
 * Used by the Syra Telegram bot (no linked user wallet required).
 */
import { PublicKey, Transaction, SystemProgram } from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import AgentWallet from '../models/agent/AgentWallet.js';
import { pickSolanaConnectionForReads } from './solanaServerRpc.js';
import { executeIntent } from '../services/walletBroker.js';

const USDC_MAINNET = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
const LAMPORTS_PER_SOL = 1e9;
const MIN_AGENT_LAMPORTS = BigInt(Math.ceil(0.002 * 1e9));
const TX_FEE_BUFFER_LAMPORTS = 80_000n;

/**
 * @param {string} anonymousId
 * @param {string} recipientBase58
 */
async function ensureDestinationAllowlisted(anonymousId, recipientBase58) {
  await AgentWallet.updateOne(
    { anonymousId, status: 'active' },
    { $addToSet: { destinationAllowlist: recipientBase58 } },
  );
}

/**
 * @param {string} anonymousId
 * @param {string} recipientBase58
 * @param {{ asset?: 'usdc' | 'sol'; usdcAmount?: number; solAmount?: number; ip?: string; userAgent?: string }} [opts]
 * @returns {Promise<{ signature: string }>}
 */
export async function withdrawTelegramAgentToAddress(anonymousId, recipientBase58, opts = {}) {
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

  const doc = await AgentWallet.findOne({ anonymousId: id, status: 'active' }).lean();
  if (!doc?.agentAddress) {
    throw new Error('Agent wallet not found');
  }
  if (doc.chain === 'base' || doc.chain === 'bsc') {
    throw new Error('Only Solana withdrawals are supported in Telegram for now.');
  }

  await ensureDestinationAllowlisted(id, recipientStr);

  const agentPk = new PublicKey(doc.agentAddress);
  const { connection, lamports: lamportsBalance } = await pickSolanaConnectionForReads(agentPk);

  const asset = opts.asset === 'usdc' || opts.asset === 'sol' ? opts.asset : 'usdc';
  const usdcCapHuman =
    typeof opts.usdcAmount === 'number' && Number.isFinite(opts.usdcAmount) && opts.usdcAmount > 0
      ? opts.usdcAmount
      : null;
  const solCapHuman =
    typeof opts.solAmount === 'number' && Number.isFinite(opts.solAmount) && opts.solAmount > 0
      ? opts.solAmount
      : null;

  const tokenResp = await connection.getParsedTokenAccountsByOwner(agentPk, { mint: USDC_MAINNET });
  const tokenAccounts = tokenResp?.value ?? [];
  const instructions = [];

  if (asset === 'usdc') {
    const userUsdcAta = await getAssociatedTokenAddress(
      USDC_MAINNET,
      recipient,
      false,
      TOKEN_PROGRAM_ID,
    );
    const userAtaInfo = await connection.getAccountInfo(userUsdcAta, 'confirmed');
    if (!userAtaInfo) {
      instructions.push(
        createAssociatedTokenAccountInstruction(
          agentPk,
          userUsdcAta,
          recipient,
          USDC_MAINNET,
          TOKEN_PROGRAM_ID,
        ),
      );
    }

    const capRaw =
      usdcCapHuman != null ? BigInt(Math.floor(usdcCapHuman * 1_000_000)) : null;

    for (const row of tokenAccounts) {
      const info = row?.account?.data?.parsed?.info;
      const rawStr = info?.tokenAmount?.amount;
      if (!rawStr) continue;
      const raw = BigInt(rawStr);
      if (raw <= 0n) continue;
      const toSend = capRaw != null ? (raw < capRaw ? raw : capRaw) : raw;
      if (toSend <= 0n) continue;
      instructions.push(
        createTransferInstruction(
          row.pubkey,
          userUsdcAta,
          agentPk,
          toSend,
          [],
          TOKEN_PROGRAM_ID,
        ),
      );
    }
  }

  if (asset === 'sol') {
    const maxUserSolLamports =
      BigInt(lamportsBalance) > TX_FEE_BUFFER_LAMPORTS
        ? BigInt(lamportsBalance) - TX_FEE_BUFFER_LAMPORTS
        : 0n;

    if (solCapHuman != null) {
      const capLamports = BigInt(Math.floor(solCapHuman * LAMPORTS_PER_SOL));
      if (capLamports > 0n && maxUserSolLamports > 0n) {
        const solToSend = capLamports > maxUserSolLamports ? maxUserSolLamports : capLamports;
        if (solToSend > 0n) {
          instructions.push(
            SystemProgram.transfer({
              fromPubkey: agentPk,
              toPubkey: recipient,
              lamports: solToSend,
            }),
          );
        }
      }
    } else {
      const solSweepMax =
        BigInt(lamportsBalance) > MIN_AGENT_LAMPORTS + TX_FEE_BUFFER_LAMPORTS
          ? BigInt(lamportsBalance) - MIN_AGENT_LAMPORTS - TX_FEE_BUFFER_LAMPORTS
          : 0n;
      if (solSweepMax > 0n) {
        instructions.push(
          SystemProgram.transfer({
            fromPubkey: agentPk,
            toPubkey: recipient,
            lamports: solSweepMax,
          }),
        );
      }
    }
  }

  if (instructions.length === 0) {
    throw new Error('Nothing to withdraw — check your balance.');
  }

  const { blockhash } = await connection.getLatestBlockhash('confirmed');
  const tx = new Transaction();
  tx.feePayer = agentPk;
  tx.recentBlockhash = blockhash;
  for (const ix of instructions) {
    tx.add(ix);
  }
  const serializedTxBase64 = tx
    .serialize({ requireAllSignatures: false, verifySignatures: false })
    .toString('base64');

  const usdcDelta = asset === 'usdc' && usdcCapHuman != null ? usdcCapHuman : 0;
  const solDelta = asset === 'sol' && solCapHuman != null ? solCapHuman : 0;
  const estimatedUsd = usdcDelta + solDelta * 150;

  const result = await executeIntent(
    {
      anonymousId: id,
      ip: opts.ip,
      userAgent: opts.userAgent,
    },
    {
      type: 'withdraw',
      chain: 'solana',
      toAddress: recipientStr,
      estimatedUsd,
      serializedTxBase64,
      summary: `Telegram withdraw ${asset} to ${recipientStr.slice(0, 8)}…`,
    },
  );

  if (result.status === 'pending_confirmation') {
    throw new Error('Withdraw requires confirmation — try a smaller amount.');
  }
  if (result.status !== 'ok') {
    throw new Error(`Withdraw refused: ${result.reasons?.join('; ') || 'policy_denied'}`);
  }
  return { signature: result.signature };
}
