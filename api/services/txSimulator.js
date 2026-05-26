/**
 * Transaction simulator for the wallet broker.
 *
 * Purpose: before any on-chain signing we simulate the transaction and apply guardrails. The
 * caller passes a serialized (base64) Solana transaction plus expectations; we return a typed
 * decision so the broker can refuse to sign anything that would drain the wallet or fail.
 *
 * P1.3 — Solana implementation. Base/EVM simulation is stubbed for parity (returns ok=true
 * with a flag) until Base signing is re-enabled (P0.7 disables Base custodial wallets).
 */
import {
  PublicKey,
  VersionedTransaction,
  Transaction,
} from '@solana/web3.js';
import { pickSolanaConnectionForReads } from '../libs/solanaServerRpc.js';

const LAMPORTS_PER_SOL = 1e9;
const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

/**
 * @typedef {Object} SimulateResult
 * @property {boolean} ok
 * @property {string[]} reasons
 * @property {Object} preBalances
 * @property {Object} postBalances
 * @property {string=} logs
 */

/**
 * Simulate a Solana transaction (base64) using the read RPC.
 *
 * Guardrails:
 *  - simulation must succeed (no `err`)
 *  - post SOL must be >= minSolKeepLamports (default 0.001 SOL kept as rent buffer)
 *  - post USDC must be >= maxUsdcSpend ? we don't fully decode token deltas — RPC sim doesn't
 *    expose token deltas reliably across all programs, so we instead rely on the policy engine's
 *    estimatedUsd + the dry-run logs for visibility. Hard refusal only on full-drain (SOL == 0
 *    after fees) which catches the worst footgun.
 *
 * @param {Object} input
 * @param {string} input.serializedTxBase64
 * @param {string} input.agentAddress     Solana base58 pubkey of the signer
 * @param {number=} input.minSolKeepLamports
 * @returns {Promise<SimulateResult>}
 */
export async function simulateSolanaTx({
  serializedTxBase64,
  agentAddress,
  minSolKeepLamports = 0.001 * LAMPORTS_PER_SOL,
}) {
  if (!serializedTxBase64 || typeof serializedTxBase64 !== 'string') {
    return { ok: false, reasons: ['missing_serialized_tx'], preBalances: {}, postBalances: {} };
  }
  let agentPubkey;
  try {
    agentPubkey = new PublicKey(agentAddress);
  } catch {
    return { ok: false, reasons: ['invalid_agent_address'], preBalances: {}, postBalances: {} };
  }

  const buf = Buffer.from(serializedTxBase64, 'base64');
  /** @type {VersionedTransaction | Transaction | null} */
  let txToSimulate = null;
  try {
    txToSimulate = VersionedTransaction.deserialize(buf);
  } catch {
    try {
      // Legacy txs (Meteora DLMM open/close) keep partial position signatures only if we do NOT
      // recompile via compileMessage() — recompiling drops sigs and sim fails (e.g. Custom:1).
      txToSimulate = Transaction.from(buf);
    } catch {
      return { ok: false, reasons: ['deserialize_failed'], preBalances: {}, postBalances: {} };
    }
  }

  const { connection, lamports: preLamports } = await pickSolanaConnectionForReads(agentPubkey);
  let sim;
  try {
    sim = await connection.simulateTransaction(txToSimulate, {
      sigVerify: false,
      replaceRecentBlockhash: true,
      accounts: { encoding: 'base64', addresses: [agentAddress] },
    });
  } catch (err) {
    return {
      ok: false,
      reasons: ['rpc_sim_threw', err?.message || String(err)],
      preBalances: { solLamports: preLamports },
      postBalances: {},
    };
  }

  if (sim?.value?.err) {
    return {
      ok: false,
      reasons: ['sim_returned_err', JSON.stringify(sim.value.err).slice(0, 200)],
      preBalances: { solLamports: preLamports },
      postBalances: {},
      logs: (sim.value.logs || []).slice(0, 20).join('\n'),
    };
  }

  // Post-sim balance for the signer account, if RPC returned it.
  const accountInfo = sim?.value?.accounts?.[0] || null;
  const postLamports =
    accountInfo && Number.isFinite(accountInfo.lamports) ? Number(accountInfo.lamports) : null;
  const reasons = [];
  if (postLamports !== null && postLamports < minSolKeepLamports) {
    reasons.push(`post_sol_too_low:${postLamports}<${minSolKeepLamports}`);
  }
  // Always fail the simulation if any compute units consumed but no logs — defensive (rare).
  if (sim?.value?.unitsConsumed === 0 && (sim?.value?.logs?.length ?? 0) === 0) {
    reasons.push('empty_sim_no_units_no_logs');
  }

  return {
    ok: reasons.length === 0,
    reasons,
    preBalances: { solLamports: preLamports },
    postBalances: { solLamports: postLamports },
    logs: (sim?.value?.logs || []).slice(0, 20).join('\n'),
  };
}

/**
 * Base/EVM simulation stub. Returns a typed shape so the broker doesn't branch on chain.
 *
 * @param {Object} input
 * @returns {Promise<SimulateResult>}
 */
export async function simulateBaseTx(_input) {
  return {
    ok: true,
    reasons: ['base_simulation_not_implemented'],
    preBalances: {},
    postBalances: {},
  };
}

/**
 * Dispatch helper. Chain-agnostic facade for the broker.
 *
 * @param {Object} input
 * @param {'solana'|'base'|'bsc'|'tempo'} input.chain
 * @param {string} input.serializedTxBase64
 * @param {string} input.agentAddress
 * @returns {Promise<SimulateResult>}
 */
export async function simulate(input) {
  if (input.chain === 'solana') return simulateSolanaTx(input);
  if (input.chain === 'base' || input.chain === 'bsc' || input.chain === 'tempo') {
    return simulateBaseTx(input);
  }
  return { ok: false, reasons: ['unsupported_chain'], preBalances: {}, postBalances: {} };
}

export { USDC_MINT };
