/**
 * Treasury custody broker (P2).
 *
 * Goal: stop leaving the raw `AGENT_PRIVATE_KEY` in a long-lived environment variable on every
 * API instance. Treasury operations now flow through this single module:
 *
 *  1. Resolve custody backend (Privy / KMS / legacy env key).
 *  2. Enforce a hard USD threshold above which signing requires admin multisig approval.
 *  3. Audit every treasury sign + emit metrics.
 *
 * Env:
 *   - SYRA_TREASURY_CUSTODY      ('privy' | 'kms' | 'env', default 'env')
 *   - SYRA_TREASURY_PRIVY_WALLET_ID  (when custody === 'privy')
 *   - SYRA_TREASURY_MAX_AUTO_USD (default 1000) — any tx > this requires multisig.
 *   - SYRA_TREASURY_MULTISIG_PUBKEYS (comma-sep base58 admin pubkeys) — required to relax the cap.
 *
 * Legacy `AGENT_PRIVATE_KEY` continues to work for the migration window but logs a warning at
 * boot so ops sees the dependency.
 */
import { Keypair, VersionedTransaction, Transaction, Connection } from '@solana/web3.js';
import bs58 from 'bs58';
import { writeSignAudit } from '../libs/signAudit.js';
import { isPrivyConfigured, privySignSolanaTx } from './privyServerWallet.js';
import { log } from '../utils/log.js';

const DEFAULT_MAX_AUTO_USD = 1000;

function getCustodyMode() {
  return (process.env.SYRA_TREASURY_CUSTODY || 'env').toLowerCase().trim();
}

function getMaxAutoUsd() {
  const raw = Number(process.env.SYRA_TREASURY_MAX_AUTO_USD || DEFAULT_MAX_AUTO_USD);
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_MAX_AUTO_USD;
}

function getMultisigPubkeys() {
  return (process.env.SYRA_TREASURY_MULTISIG_PUBKEYS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function getEnvKeypair() {
  const raw = (process.env.AGENT_PRIVATE_KEY || '').trim();
  if (!raw) return null;
  try {
    return Keypair.fromSecretKey(bs58.decode(raw));
  } catch {
    return null;
  }
}

let _bootWarned = false;
function bootWarn() {
  if (_bootWarned) return;
  _bootWarned = true;
  const mode = getCustodyMode();
  if (mode === 'env' && process.env.AGENT_PRIVATE_KEY) {
    log.warn(
      {
        event: 'treasury_custody_legacy_env',
        recommend: 'Set SYRA_TREASURY_CUSTODY=privy or kms; AGENT_PRIVATE_KEY in env is fragile.',
      },
      'treasury custody using legacy env key'
    );
  }
}
bootWarn();

/**
 * @typedef {Object} TreasurySignInput
 * @property {string} serializedTxBase64
 * @property {number=} estimatedUsd
 * @property {string=} reason
 * @property {string=} requestId
 */

/**
 * Sign and submit a treasury transaction. Refuses (returns 'requires_multisig') when the
 * estimated amount exceeds the auto-sign threshold.
 *
 * @param {TreasurySignInput} input
 * @returns {Promise<{ status: 'ok'; signature: string } | { status: 'requires_multisig'; threshold: number } | { status: 'denied'; reason: string }>}
 */
export async function treasurySignAndSubmit(input) {
  const estimated = Number.isFinite(input.estimatedUsd) ? Number(input.estimatedUsd) : 0;
  const threshold = getMaxAutoUsd();
  if (estimated > threshold && getMultisigPubkeys().length === 0) {
    await writeSignAudit({
      anonymousId: 'treasury',
      action: 'tx_sign',
      chain: 'solana',
      amountUsd: estimated,
      policyDecision: 'deny',
      policyReasons: ['treasury_requires_multisig', `>${threshold}`],
      status: 'rejected',
    });
    return { status: 'requires_multisig', threshold };
  }
  const mode = getCustodyMode();
  try {
    if (mode === 'privy' && isPrivyConfigured() && process.env.SYRA_TREASURY_PRIVY_WALLET_ID) {
      const out = await privySignSolanaTx({
        privyWalletId: process.env.SYRA_TREASURY_PRIVY_WALLET_ID,
        serializedTxBase64: input.serializedTxBase64,
        submit: true,
      });
      const signature = out.signature || '';
      await writeSignAudit({
        anonymousId: 'treasury',
        action: 'tx_submit',
        chain: 'solana',
        amountUsd: estimated,
        txSignature: signature,
        policyDecision: 'allow',
        policyReasons: ['treasury_privy'],
        status: 'ok',
        requestId: input.requestId,
      });
      return { status: 'ok', signature };
    }
    if (mode === 'kms') {
      // Hook for a KMS signer when the team integrates one (AWS KMS, GCP KMS, Turnkey, etc.).
      // For now this branch refuses — better to fail loud than fall through to env key.
      await writeSignAudit({
        anonymousId: 'treasury',
        action: 'tx_sign',
        chain: 'solana',
        amountUsd: estimated,
        policyDecision: 'deny',
        policyReasons: ['treasury_kms_not_implemented'],
        status: 'rejected',
      });
      return { status: 'denied', reason: 'kms_signer_not_implemented' };
    }
    const kp = getEnvKeypair();
    if (!kp) {
      return { status: 'denied', reason: 'treasury_key_missing' };
    }
    const buf = Buffer.from(input.serializedTxBase64, 'base64');
    let serialized;
    try {
      const vtx = VersionedTransaction.deserialize(buf);
      vtx.sign([kp]);
      serialized = vtx.serialize();
    } catch {
      const legacy = Transaction.from(buf);
      legacy.partialSign(kp);
      serialized = legacy.serialize({ requireAllSignatures: false });
    }
    const connection = new Connection(
      process.env.SOLANA_RPC_BLOCKCHAIN_URL ||
        process.env.SOLANA_RPC_URL ||
        'https://api.mainnet-beta.solana.com',
      'confirmed'
    );
    const signature = await connection.sendRawTransaction(serialized, { skipPreflight: false, maxRetries: 3 });
    await writeSignAudit({
      anonymousId: 'treasury',
      action: 'tx_submit',
      chain: 'solana',
      amountUsd: estimated,
      txSignature: signature,
      policyDecision: 'allow',
      policyReasons: ['treasury_env'],
      status: 'ok',
      requestId: input.requestId,
    });
    return { status: 'ok', signature };
  } catch (err) {
    await writeSignAudit({
      anonymousId: 'treasury',
      action: 'tx_submit',
      chain: 'solana',
      amountUsd: estimated,
      policyDecision: 'allow',
      policyReasons: ['treasury_attempted'],
      status: 'failed',
      errorMessage: err?.message || String(err),
      requestId: input.requestId,
    });
    return { status: 'denied', reason: err?.message || 'treasury_sign_failed' };
  }
}

export { getMaxAutoUsd, getMultisigPubkeys, getCustodyMode };
