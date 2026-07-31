/**
 * Agent-to-agent SOL + SPL token sweep (e.g. retire :lp → :earn).
 * Unlike withdrawSolanaAgentToRecipient, the destination is another agent address,
 * not the linked user wallet — requires a temporary destinationAllowlist bump.
 */
import { PublicKey, Transaction, SystemProgram } from '@solana/web3.js';
import {
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
} from '@solana/spl-token';
import AgentWallet from '../models/agent/AgentWallet.js';
import { pickSolanaConnectionForReads } from './solanaServerRpc.js';
import { executeIntent } from '../services/walletBroker.js';

const LAMPORTS_PER_SOL = 1e9;
const MIN_AGENT_LAMPORTS = BigInt(Math.ceil(0.002 * 1e9));
const TX_FEE_BUFFER_LAMPORTS = 100_000n;
const WRAPPED_SOL_MINT = 'So11111111111111111111111111111111111111112';

/**
 * @param {import('@solana/web3.js').Connection} connection
 * @param {PublicKey} owner
 */
async function listNonZeroTokenAccounts(connection, owner) {
  const [legacy, token2022] = await Promise.all([
    connection.getParsedTokenAccountsByOwner(owner, { programId: TOKEN_PROGRAM_ID }),
    connection.getParsedTokenAccountsByOwner(owner, { programId: TOKEN_2022_PROGRAM_ID }),
  ]);

  /** @type {Array<{ sourceAta: PublicKey; mint: PublicKey; amount: bigint; decimals: number; tokenProgram: PublicKey }>} */
  const rows = [];
  for (const [resp, tokenProgram] of [
    [legacy, TOKEN_PROGRAM_ID],
    [token2022, TOKEN_2022_PROGRAM_ID],
  ]) {
    for (const row of resp?.value ?? []) {
      const info = row?.account?.data?.parsed?.info;
      const rawStr = info?.tokenAmount?.amount;
      const mintStr = info?.mint;
      if (!rawStr || !mintStr) continue;
      const amount = BigInt(rawStr);
      if (amount <= 0n) continue;
      if (mintStr === WRAPPED_SOL_MINT) continue;
      let mint;
      try {
        mint = new PublicKey(mintStr);
      } catch {
        continue;
      }
      rows.push({
        sourceAta: row.pubkey,
        mint,
        amount,
        decimals: Number(info?.tokenAmount?.decimals) || 0,
        tokenProgram,
      });
    }
  }
  return rows;
}

/**
 * Snapshot of SOL + SPL balances on an agent address (read-only).
 * @param {string} agentAddress
 */
export async function snapshotAgentBalances(agentAddress) {
  const pk = new PublicKey(String(agentAddress).trim());
  const { connection, lamports } = await pickSolanaConnectionForReads(pk);
  const tokens = await listNonZeroTokenAccounts(connection, pk);
  return {
    agentAddress: pk.toBase58(),
    sol: Number(lamports) / LAMPORTS_PER_SOL,
    lamports: Number(lamports),
    tokens: tokens.map((t) => ({
      mint: t.mint.toBase58(),
      amount: t.amount.toString(),
      uiAmount: Number(t.amount) / 10 ** t.decimals,
      decimals: t.decimals,
      tokenProgram: t.tokenProgram.toBase58(),
    })),
  };
}

/**
 * Sweep all SPL tokens + excess SOL from one agent wallet to another agent address.
 * Each token is its own tx (Token-2022 / transfer-hook failures are skipped); SOL is last and fatal.
 *
 * @param {string} fromAnonymousId
 * @param {string} toAgentAddress
 * @param {{ dryRun?: boolean; ip?: string; userAgent?: string; sessionId?: string }} [opts]
 */
export async function sweepAgentToAgent(fromAnonymousId, toAgentAddress, opts = {}) {
  const fromId = String(fromAnonymousId || '').trim();
  const toAddr = String(toAgentAddress || '').trim();
  if (!fromId || !toAddr) {
    throw new Error('fromAnonymousId and toAgentAddress are required');
  }

  let toPk;
  try {
    toPk = new PublicKey(toAddr);
  } catch {
    throw new Error('Invalid toAgentAddress');
  }

  const doc = await AgentWallet.findOne({ anonymousId: fromId }).lean();
  if (!doc?.agentAddress) throw new Error('Source agent wallet not found');
  if (doc.chain === 'base' || doc.chain === 'bsc') {
    throw new Error('Agent-to-agent sweep is Solana-only');
  }
  if (doc.status && doc.status !== 'active') {
    throw new Error(`Source wallet status is ${doc.status}; cannot sweep`);
  }
  if (doc.agentAddress === toAddr) {
    throw new Error('Source and destination agent addresses are identical');
  }

  const fromPk = new PublicKey(doc.agentAddress);
  const before = await snapshotAgentBalances(doc.agentAddress);
  const { connection, lamports } = await pickSolanaConnectionForReads(fromPk);
  const tokenRows = await listNonZeroTokenAccounts(connection, fromPk);

  const solSweepMax =
    BigInt(lamports) > MIN_AGENT_LAMPORTS + TX_FEE_BUFFER_LAMPORTS
      ? BigInt(lamports) - MIN_AGENT_LAMPORTS - TX_FEE_BUFFER_LAMPORTS
      : 0n;

  /** @type {Array<{ label: string; ixs: import('@solana/web3.js').TransactionInstruction[]; estimatedUsd: number }>} */
  const batches = [];

  for (const row of tokenRows) {
    const destAta = await getAssociatedTokenAddress(row.mint, toPk, false, row.tokenProgram);
    const destInfo = await connection.getAccountInfo(destAta, 'confirmed');
    /** @type {import('@solana/web3.js').TransactionInstruction[]} */
    const ixs = [];
    if (!destInfo) {
      ixs.push(
        createAssociatedTokenAccountInstruction(
          fromPk,
          destAta,
          toPk,
          row.mint,
          row.tokenProgram,
        ),
      );
    }
    ixs.push(
      createTransferInstruction(row.sourceAta, destAta, fromPk, row.amount, [], row.tokenProgram),
    );
    batches.push({
      label: `token:${row.mint.toBase58().slice(0, 8)}`,
      ixs,
      estimatedUsd: 1,
    });
  }

  if (solSweepMax > 0n) {
    // Placeholder — SOL amount is recomputed after token batches (ATA rent may consume SOL).
    batches.push({
      label: 'sol',
      ixs: [],
      estimatedUsd: Math.max(1, (Number(solSweepMax) / LAMPORTS_PER_SOL) * 150),
    });
  }

  if (batches.length === 0) {
    return {
      dryRun: Boolean(opts.dryRun),
      signatures: [],
      before,
      after: before,
      transferred: { tokens: 0, solLamports: '0' },
      skipped: 'nothing_to_sweep',
    };
  }

  if (opts.dryRun) {
    return {
      dryRun: true,
      signatures: [],
      before,
      after: null,
      transferred: {
        tokens: tokenRows.length,
        solLamports: solSweepMax.toString(),
      },
    };
  }

  const priorAllow = Array.isArray(doc.destinationAllowlist) ? [...doc.destinationAllowlist] : [];
  if (!priorAllow.includes(toAddr)) {
    await AgentWallet.updateOne(
      { anonymousId: fromId },
      { $addToSet: { destinationAllowlist: toAddr } },
    );
  }

  const signatures = [];
  const failures = [];
  let tokensMoved = 0;
  let solMoved = '0';

  try {
    for (const batch of batches) {
      try {
        let ixs = batch.ixs;
        let estimatedUsd = batch.estimatedUsd;
        let solLamportsThisTx = 0n;

        if (batch.label === 'sol') {
          const live = await pickSolanaConnectionForReads(fromPk);
          const liveSweep =
            BigInt(live.lamports) > MIN_AGENT_LAMPORTS + TX_FEE_BUFFER_LAMPORTS
              ? BigInt(live.lamports) - MIN_AGENT_LAMPORTS - TX_FEE_BUFFER_LAMPORTS
              : 0n;
          if (liveSweep <= 0n) {
            console.warn('[agentWalletSweep] no excess SOL left to sweep after token transfers');
            continue;
          }
          solLamportsThisTx = liveSweep;
          ixs = [
            SystemProgram.transfer({
              fromPubkey: fromPk,
              toPubkey: toPk,
              lamports: liveSweep,
            }),
          ];
          estimatedUsd = Math.max(1, (Number(liveSweep) / LAMPORTS_PER_SOL) * 150);
        }

        const { blockhash } = await connection.getLatestBlockhash('confirmed');
        const tx = new Transaction();
        tx.feePayer = fromPk;
        tx.recentBlockhash = blockhash;
        for (const ix of ixs) tx.add(ix);
        const serializedTxBase64 = tx
          .serialize({ requireAllSignatures: false, verifySignatures: false })
          .toString('base64');

        const result = await executeIntent(
          {
            anonymousId: fromId,
            ip: opts.ip,
            userAgent: opts.userAgent,
            sessionId: opts.sessionId,
          },
          {
            type: 'withdraw',
            chain: 'solana',
            toAddress: toAddr,
            toolId: 'lp_real_swap',
            estimatedUsd,
            serializedTxBase64,
            summary: `Sweep agent→agent (${fromId} → ${toAddr}) ${batch.label}`,
          },
        );

        if (result.status === 'pending_confirmation') {
          const err = new Error('user_confirmation_required');
          err.code = 'CONFIRMATION_REQUIRED';
          err.intentId = result.intentId;
          err.expiresAt = result.expiresAt;
          throw err;
        }
        if (result.status !== 'ok') {
          throw new Error(result.reasons?.join(';') || result.status);
        }
        if (result.signature) signatures.push(result.signature);
        if (batch.label === 'sol') solMoved = solLamportsThisTx.toString();
        else tokensMoved += 1;
      } catch (batchErr) {
        if (batch.label === 'sol' || batchErr?.code === 'CONFIRMATION_REQUIRED') throw batchErr;
        failures.push({
          label: batch.label,
          error: batchErr instanceof Error ? batchErr.message : String(batchErr),
        });
        console.warn(`[agentWalletSweep] skipped ${batch.label}:`, batchErr?.message || batchErr);
      }
    }
  } finally {
    if (!priorAllow.includes(toAddr)) {
      await AgentWallet.updateOne(
        { anonymousId: fromId },
        { $pull: { destinationAllowlist: toAddr } },
      ).catch((err) => {
        console.warn('[agentWalletSweep] failed to restore destinationAllowlist:', err?.message || err);
      });
    }
  }

  const after = await snapshotAgentBalances(doc.agentAddress);
  return {
    dryRun: false,
    signatures,
    before,
    after,
    transferred: {
      tokens: tokensMoved,
      solLamports: solMoved,
    },
    failures: failures.length ? failures : undefined,
  };
}
