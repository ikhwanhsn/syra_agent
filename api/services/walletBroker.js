/**
 * Wallet Broker — the ONLY module that authorizes wallet operations.
 *
 * Trust gate:
 *   1. Load wallet config (status, caps, allowlists, custody mode).
 *   2. Pull recent sign history for velocity / cap checks.
 *   3. Run the deterministic policyEngine.evaluate().
 *   4. If require_confirm → stage a WalletIntent, return { status: 'pending_confirmation' }.
 *   5. If allow → simulate tx (when applicable) → call custody adapter (Privy or legacy keypair).
 *   6. Always writeSignAudit() with the final decision + outcome.
 *
 * Callers (chat router, tool router, wallet route, withdraw lib) must use this broker — they
 * must NEVER load `getAgentKeypair` directly. This collapses the signing surface to one file.
 *
 * Legacy compatibility: while migration is in progress, the broker can fall back to the legacy
 * encrypted-key keypair path via custody === 'legacy'. New users default to 'privy' when
 * SYRA_CUSTODY_MODE=privy and Privy creds are present.
 */
import crypto from 'node:crypto';
import { Keypair, VersionedTransaction, Transaction, Connection } from '@solana/web3.js';
import bs58 from 'bs58';

import AgentWallet from '../models/agent/AgentWallet.js';
import SignAudit from '../models/agent/SignAudit.js';
import WalletIntent from '../models/agent/WalletIntent.js';
import { decryptAgentSecretFromStorage } from '../libs/agentWalletSecretCrypto.js';
import { evaluate as evaluatePolicy } from './policyEngine.js';
import { simulate as simulateTx } from './txSimulator.js';
import { writeSignAudit } from '../libs/signAudit.js';
import {
  isPrivyConfigured,
  privySignSolanaTx,
  privySignMessage,
  hashSerializedTx,
  getDefaultCustodyMode,
} from './privyServerWallet.js';
import { confirmSolanaTransaction } from '../libs/solanaConfirm.js';

const INTENT_TTL_MS = 90 * 1000; // 90s confirmation window
const HISTORY_LOOKBACK_MS = 24 * 60 * 60 * 1000;
const HISTORY_LIMIT = 200;

/**
 * @typedef {Object} ExecuteContext
 * @property {string} anonymousId
 * @property {string=} requestId
 * @property {string=} sessionId
 * @property {string=} ip
 * @property {string=} userAgent
 * @property {boolean=} guest
 */

/**
 * @typedef {Object} ExecuteIntent
 * @property {'x402_pay'|'tx_sign'|'withdraw'|'message_sign'} type
 * @property {'solana'|'base'|'tempo'} chain
 * @property {string=} toolId
 * @property {number=} estimatedUsd
 * @property {string=} toAddress
 * @property {string=} message              For message_sign
 * @property {string=} serializedTxBase64   For tx_sign / withdraw / x402_pay
 * @property {string=} summary              Human-readable description for confirmation card
 * @property {Object=} params
 */

/**
 * @typedef {Object} BrokerOk
 * @property {'ok'} status
 * @property {string=} signature
 * @property {string=} signedTxBase64
 */
/**
 * @typedef {Object} BrokerDenied
 * @property {'denied'} status
 * @property {string[]} reasons
 */
/**
 * @typedef {Object} BrokerPending
 * @property {'pending_confirmation'} status
 * @property {string} intentId
 * @property {Object} summary
 * @property {number} expiresAt
 */
/** @typedef {BrokerOk | BrokerDenied | BrokerPending} BrokerResult */

/**
 * Load wallet config row + recent history for the policy engine.
 *
 * @param {string} anonymousId
 */
async function loadConfigAndHistory(anonymousId) {
  const wallet = await AgentWallet.findOne({ anonymousId }).lean();
  if (!wallet) return { wallet: null, history: [] };
  const since = new Date(Date.now() - HISTORY_LOOKBACK_MS);
  const history = await SignAudit.find({ anonymousId, ts: { $gte: since }, status: 'ok' })
    .sort({ ts: -1 })
    .limit(HISTORY_LIMIT)
    .select('ts action amountUsd status')
    .lean();
  return { wallet, history };
}

function toWalletConfig(wallet) {
  if (!wallet) return null;
  return {
    anonymousId: wallet.anonymousId,
    status: wallet.status || 'active',
    dailySpendCapUsd: numOr(wallet.dailySpendCapUsd, 250),
    perTxCapUsd: numOr(wallet.perTxCapUsd, 50),
    hourlySpendCapUsd: numOr(wallet.hourlySpendCapUsd, 100),
    allowedTools: Array.isArray(wallet.allowedTools) ? wallet.allowedTools : [],
    destinationAllowlist: Array.isArray(wallet.destinationAllowlist) ? wallet.destinationAllowlist : [],
    destinationDenylist: Array.isArray(wallet.destinationDenylist) ? wallet.destinationDenylist : [],
    linkedUserWallet: wallet.walletAddress || null,
    custody: wallet.custody || 'legacy',
    privyWalletId: wallet.privyWalletId || null,
    agentAddress: wallet.agentAddress || null,
    chain: wallet.chain || 'solana',
  };
}

function numOr(v, fallback) {
  return Number.isFinite(v) && v > 0 ? Number(v) : fallback;
}

/**
 * Stage a WalletIntent row when policy returns require_confirm.
 *
 * @param {ExecuteContext} ctx
 * @param {ExecuteIntent} intent
 * @param {{ reasons: string[]; riskScore: number }} decision
 * @param {{ chain: string }} wallet
 */
async function stageIntent(ctx, intent, decision, wallet) {
  const intentId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + INTENT_TTL_MS);
  const serializedTxHash = intent.serializedTxBase64
    ? hashSerializedTx(intent.serializedTxBase64)
    : null;
  const summary = intent.summary || buildSummary(intent);
  const doc = await WalletIntent.create({
    intentId,
    anonymousId: ctx.anonymousId,
    walletAddress: wallet?.linkedUserWallet || null,
    chain: intent.chain,
    action: intent.type,
    toolId: intent.toolId || null,
    payload: {
      estimatedUsd: intent.estimatedUsd || 0,
      toAddress: intent.toAddress || null,
      summary,
      params: redactParams(intent.params || {}),
      serializedTxHash,
    },
    riskScore: decision.riskScore,
    policyReasons: decision.reasons,
    status: 'pending',
    expiresAt,
    requestId: ctx.requestId || null,
    createdBy: ctx.sessionId || null,
  });
  await writeSignAudit({
    anonymousId: ctx.anonymousId,
    walletAddress: wallet?.linkedUserWallet,
    chain: intent.chain,
    action: 'intent_stage',
    toolId: intent.toolId,
    intentId,
    amountUsd: intent.estimatedUsd,
    toAddress: intent.toAddress,
    policyDecision: 'require_confirm',
    policyReasons: decision.reasons,
    riskScore: decision.riskScore,
    status: 'ok',
    requestId: ctx.requestId,
    sessionId: ctx.sessionId,
    ip: ctx.ip,
    userAgent: ctx.userAgent,
  });
  return {
    status: 'pending_confirmation',
    intentId: doc.intentId,
    expiresAt: doc.expiresAt.getTime(),
    summary: {
      action: intent.type,
      toolId: intent.toolId,
      estimatedUsd: intent.estimatedUsd,
      toAddress: intent.toAddress,
      message: summary,
      reasons: decision.reasons,
      riskScore: decision.riskScore,
    },
  };
}

function buildSummary(intent) {
  if (intent.type === 'withdraw') {
    return `Withdraw $${(intent.estimatedUsd || 0).toFixed(2)} to ${intent.toAddress || 'unknown'}`;
  }
  if (intent.type === 'tx_sign') {
    return `Sign on-chain transaction for ${intent.toolId || 'agent action'} (~$${(intent.estimatedUsd || 0).toFixed(2)})`;
  }
  if (intent.type === 'x402_pay') {
    return `Pay $${(intent.estimatedUsd || 0).toFixed(2)} for ${intent.toolId || 'API call'}`;
  }
  return 'Sign message';
}

const PARAM_BLOCK_KEYS = new Set(['secretKey', 'privateKey', 'mnemonic']);
function redactParams(params) {
  const out = {};
  for (const [k, v] of Object.entries(params || {})) {
    if (PARAM_BLOCK_KEYS.has(k)) continue;
    if (typeof v === 'string' && v.length > 256) out[k] = v.slice(0, 256) + '…';
    else out[k] = v;
  }
  return out;
}

/**
 * Custody adapter — sign-and-submit for Solana. Returns a tx signature.
 *
 * @param {ReturnType<typeof toWalletConfig>} cfg
 * @param {string} serializedTxBase64
 * @returns {Promise<{ signature: string }>}
 */
async function custodySignSolanaTx(cfg, serializedTxBase64) {
  if (cfg.custody === 'privy') {
    if (!isPrivyConfigured()) throw new Error('privy_not_configured');
    if (!cfg.privyWalletId) throw new Error('missing_privy_wallet_id');
    const out = await privySignSolanaTx({
      privyWalletId: cfg.privyWalletId,
      serializedTxBase64,
      submit: true,
    });
    if (!out.signature) throw new Error('privy_sign_no_signature');
    const connection = new Connection(
      process.env.SOLANA_RPC_BLOCKCHAIN_URL ||
        process.env.SOLANA_RPC_URL ||
        'https://api.mainnet-beta.solana.com',
      'confirmed',
    );
    await confirmSolanaTransaction(connection, out.signature);
    return { signature: out.signature };
  }
  // legacy: load encrypted key from MongoDB and sign in-process (kept for backward compat
  // during P1 migration; refuses to operate when the wallet is marked retired).
  if (cfg.status === 'retired') throw new Error('wallet_retired');
  const doc = await AgentWallet.findOne({ anonymousId: cfg.anonymousId })
    .select('+agentSecretKey chain')
    .lean();
  if (!doc?.agentSecretKey) throw new Error('agent_wallet_missing_secret');
  const plain = decryptAgentSecretFromStorage(doc.agentSecretKey);
  const keypair = Keypair.fromSecretKey(bs58.decode(plain));
  const buf = Buffer.from(serializedTxBase64, 'base64');
  let serialized;
  try {
    const vtx = VersionedTransaction.deserialize(buf);
    vtx.sign([keypair]);
    serialized = vtx.serialize();
  } catch {
    const legacy = Transaction.from(buf);
    legacy.partialSign(keypair);
    serialized = legacy.serialize({ requireAllSignatures: false });
  }
  const connection = new Connection(
    process.env.SOLANA_RPC_BLOCKCHAIN_URL ||
      process.env.SOLANA_RPC_URL ||
      'https://api.mainnet-beta.solana.com',
    'confirmed'
  );
  const signature = await connection.sendRawTransaction(serialized, { skipPreflight: false, maxRetries: 3 });
  await confirmSolanaTransaction(connection, signature);
  return { signature };
}

/**
 * Execute an intent against the trust gate.
 *
 * @param {ExecuteContext} ctx
 * @param {ExecuteIntent} intent
 * @returns {Promise<BrokerResult>}
 */
export async function executeIntent(ctx, intent) {
  if (!ctx || !ctx.anonymousId) {
    return { status: 'denied', reasons: ['missing_anonymous_id'] };
  }
  const { wallet, history } = await loadConfigAndHistory(ctx.anonymousId);
  const cfg = toWalletConfig(wallet);

  const decision = evaluatePolicy(
    { ...intent, guest: !!ctx.guest },
    cfg || { status: 'missing' },
    history
  );

  // Deny
  if (decision.outcome === 'deny') {
    await writeSignAudit({
      anonymousId: ctx.anonymousId,
      walletAddress: cfg?.linkedUserWallet,
      agentAddress: cfg?.agentAddress,
      chain: intent.chain,
      action: intent.type === 'message_sign' ? 'message_sign' : intent.type,
      toolId: intent.toolId,
      amountUsd: intent.estimatedUsd,
      toAddress: intent.toAddress,
      policyDecision: 'deny',
      policyReasons: decision.reasons,
      riskScore: decision.riskScore,
      status: 'rejected',
      requestId: ctx.requestId,
      sessionId: ctx.sessionId,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });
    return { status: 'denied', reasons: decision.reasons };
  }

  // Confirm
  if (decision.outcome === 'require_confirm') {
    return stageIntent(ctx, intent, decision, cfg);
  }

  // Allow — simulate (if tx) then sign
  if (intent.serializedTxBase64 && intent.chain === 'solana' && cfg?.agentAddress) {
    const sim = await simulateTx({
      chain: 'solana',
      serializedTxBase64: intent.serializedTxBase64,
      agentAddress: cfg.agentAddress,
    });
    if (!sim.ok) {
      await writeSignAudit({
        anonymousId: ctx.anonymousId,
        walletAddress: cfg?.linkedUserWallet,
        agentAddress: cfg?.agentAddress,
        chain: 'solana',
        action: 'tx_sign',
        toolId: intent.toolId,
        amountUsd: intent.estimatedUsd,
        toAddress: intent.toAddress,
        policyDecision: 'deny',
        policyReasons: ['simulation_failed', ...sim.reasons],
        riskScore: decision.riskScore,
        status: 'rejected',
        errorCode: 'sim_failed',
        errorMessage: sim.reasons.join(';'),
        requestId: ctx.requestId,
        sessionId: ctx.sessionId,
        ip: ctx.ip,
        userAgent: ctx.userAgent,
      });
      return { status: 'denied', reasons: ['simulation_failed', ...sim.reasons] };
    }
  }

  try {
    let signature;
    if (intent.type === 'message_sign') {
      if (cfg.custody === 'privy' && cfg.privyWalletId) {
        const out = await privySignMessage({
          privyWalletId: cfg.privyWalletId,
          message: intent.message || '',
          chain: intent.chain === 'base' ? 'base' : 'solana',
        });
        signature = out.signature;
      } else {
        throw new Error('message_sign_legacy_unsupported');
      }
    } else if (intent.serializedTxBase64) {
      if (intent.chain !== 'solana') throw new Error('only_solana_signing_supported_in_p0');
      const out = await custodySignSolanaTx(cfg, intent.serializedTxBase64);
      signature = out.signature;
    } else {
      throw new Error('missing_payload');
    }
    await writeSignAudit({
      anonymousId: ctx.anonymousId,
      walletAddress: cfg?.linkedUserWallet,
      agentAddress: cfg?.agentAddress,
      chain: intent.chain,
      action: intent.type === 'message_sign' ? 'message_sign' : 'tx_submit',
      toolId: intent.toolId,
      amountUsd: intent.estimatedUsd,
      toAddress: intent.toAddress,
      txSignature: signature,
      policyDecision: 'allow',
      policyReasons: decision.reasons,
      riskScore: decision.riskScore,
      status: 'ok',
      requestId: ctx.requestId,
      sessionId: ctx.sessionId,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });
    return { status: 'ok', signature };
  } catch (err) {
    const msg = err?.message || String(err);
    await writeSignAudit({
      anonymousId: ctx.anonymousId,
      walletAddress: cfg?.linkedUserWallet,
      agentAddress: cfg?.agentAddress,
      chain: intent.chain,
      action: intent.type === 'message_sign' ? 'message_sign' : 'tx_submit',
      toolId: intent.toolId,
      amountUsd: intent.estimatedUsd,
      toAddress: intent.toAddress,
      policyDecision: 'allow',
      policyReasons: decision.reasons,
      riskScore: decision.riskScore,
      status: 'failed',
      errorMessage: msg,
      requestId: ctx.requestId,
      sessionId: ctx.sessionId,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });
    return { status: 'denied', reasons: ['execution_failed', msg] };
  }
}

/**
 * Confirm a previously staged intent. Verifies SIWS signature and either executes or rejects.
 * NOTE: signature verification is delegated to the caller (auth middleware), which sets ctx.userVerifiedAddress.
 * This function only validates that the verified address equals the wallet's linkedUserWallet.
 *
 * @param {ExecuteContext & { userVerifiedAddress: string }} ctx
 * @param {string} intentId
 * @param {Object} options
 * @param {string=} options.signature  raw signature (stored on row)
 * @param {string=} options.signedMessage  exact message string the user signed
 */
export async function confirmIntent(ctx, intentId, options = {}) {
  const intent = await WalletIntent.findOne({ intentId }).lean();
  if (!intent) return { status: 'denied', reasons: ['intent_not_found'] };
  if (intent.anonymousId !== ctx.anonymousId) return { status: 'denied', reasons: ['intent_owner_mismatch'] };
  if (intent.status !== 'pending') return { status: 'denied', reasons: [`intent_status_${intent.status}`] };
  if (new Date(intent.expiresAt).getTime() < Date.now()) {
    await WalletIntent.updateOne({ intentId }, { $set: { status: 'expired' } });
    return { status: 'denied', reasons: ['intent_expired'] };
  }
  const { wallet } = await loadConfigAndHistory(ctx.anonymousId);
  const cfg = toWalletConfig(wallet);
  if (!cfg) return { status: 'denied', reasons: ['wallet_missing'] };
  if (ctx.userVerifiedAddress && cfg.linkedUserWallet && ctx.userVerifiedAddress !== cfg.linkedUserWallet) {
    return { status: 'denied', reasons: ['signer_mismatch'] };
  }

  // Single-use lock: atomically transition pending → confirmed
  const locked = await WalletIntent.findOneAndUpdate(
    { intentId, status: 'pending' },
    {
      $set: {
        status: 'confirmed',
        confirmedAt: new Date(),
        signature: options.signature || null,
        signedMessage: options.signedMessage || null,
      },
    },
    { new: true }
  ).lean();
  if (!locked) return { status: 'denied', reasons: ['intent_already_used'] };

  await writeSignAudit({
    anonymousId: ctx.anonymousId,
    walletAddress: cfg.linkedUserWallet,
    agentAddress: cfg.agentAddress,
    chain: intent.chain,
    action: 'intent_confirm',
    toolId: intent.toolId,
    intentId,
    amountUsd: intent.payload?.estimatedUsd,
    toAddress: intent.payload?.toAddress,
    policyDecision: 'allow',
    policyReasons: intent.policyReasons,
    riskScore: intent.riskScore,
    status: 'ok',
    requestId: ctx.requestId,
    sessionId: ctx.sessionId,
    ip: ctx.ip,
    userAgent: ctx.userAgent,
  });

  return {
    status: 'confirmed',
    intent: {
      intentId: locked.intentId,
      action: locked.action,
      toolId: locked.toolId,
      payload: locked.payload,
      chain: locked.chain,
    },
  };
}

/**
 * After a confirmed intent's action completes, mark executed + audit.
 *
 * @param {string} intentId
 * @param {{ txSignature?: string; errorMessage?: string }} outcome
 */
export async function markIntentExecuted(intentId, outcome = {}) {
  await WalletIntent.updateOne(
    { intentId },
    {
      $set: {
        status: outcome.errorMessage ? 'failed' : 'executed',
        executedAt: new Date(),
        txSignature: outcome.txSignature || null,
        errorMessage: outcome.errorMessage || null,
      },
    }
  );
}

/**
 * Diagnostic: count audit rows for a user. Used by ops dashboard / status checks.
 * @param {string} anonymousId
 */
export async function recentSignSummary(anonymousId) {
  const since = new Date(Date.now() - HISTORY_LOOKBACK_MS);
  const rows = await SignAudit.aggregate([
    { $match: { anonymousId, ts: { $gte: since } } },
    {
      $group: {
        _id: { policyDecision: '$policyDecision', status: '$status' },
        count: { $sum: 1 },
        usd: { $sum: '$amountUsd' },
      },
    },
  ]);
  return rows;
}

export { getDefaultCustodyMode };
