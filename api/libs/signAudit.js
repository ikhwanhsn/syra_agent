/**
 * Sign-audit writer.
 *
 * P0.5 — every signing operation routes through here. The broker calls writeSignAudit() before
 * returning a result to its caller. Writes are append-only and tamper-evident via a SHA-256
 * hash chain (selfHash = sha256(prevHash || canonical(row))).
 *
 * P2 — periodic Merkle anchoring can be layered on top by walking selfHash in order over a window.
 *
 * This module deliberately keeps a single in-process mutex to serialize writes. Audit volume is
 * low (one row per sign event) so this is fine; correctness of the chain matters more than throughput.
 */
import crypto from 'node:crypto';
import SignAudit from '../models/agent/SignAudit.js';
import { recordSignAuditMetrics } from '../utils/metrics.js';
import { log } from '../utils/log.js';

const SECRET_FIELDS = new Set([
  'agentSecretKey',
  'secretKey',
  'privateKey',
  'mnemonic',
  'seed',
  'signature', // we store the *outer* signature field only when explicitly populated
]);

/**
 * Redact obviously sensitive fields from a value tree before persisting / logging.
 * @param {unknown} value
 * @returns {unknown}
 */
export function redact(value) {
  if (value == null) return value;
  if (Array.isArray(value)) return value.map(redact);
  if (typeof value !== 'object') return value;
  const out = {};
  for (const [k, v] of Object.entries(value)) {
    if (SECRET_FIELDS.has(k)) {
      out[k] = '[REDACTED]';
    } else if (typeof v === 'object') {
      out[k] = redact(v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

function canonicalize(row) {
  const keys = Object.keys(row).filter((k) => k !== 'selfHash').sort();
  const tuples = keys.map((k) => [k, row[k]]);
  return JSON.stringify(tuples);
}

/** Sequence counter for ordering writes within one process. Combined with ObjectId timestamp for global ordering. */
let _seq = 0;
let _writeChain = Promise.resolve();

async function _lastSelfHash() {
  const last = await SignAudit.findOne({})
    .sort({ seq: -1, _id: -1 })
    .select('selfHash seq')
    .lean();
  return {
    prevHash: last?.selfHash || null,
    prevSeq: last?.seq ?? 0,
  };
}

/**
 * Persist a sign-audit row. Serialized to maintain the hash chain.
 *
 * @param {object} input
 * @param {string} input.anonymousId
 * @param {string=} input.walletAddress
 * @param {string=} input.agentAddress
 * @param {'solana'|'base'|'tempo'|'other'=} input.chain
 * @param {'x402_pay'|'tx_sign'|'tx_submit'|'withdraw'|'message_sign'|'intent_stage'|'intent_confirm'|'intent_reject'} input.action
 * @param {string=} input.toolId
 * @param {string=} input.intentId
 * @param {number=} input.amountUsd
 * @param {string=} input.toAddress
 * @param {string=} input.txSignature
 * @param {'allow'|'deny'|'require_confirm'} input.policyDecision
 * @param {string[]=} input.policyReasons
 * @param {number=} input.riskScore
 * @param {'ok'|'failed'|'rejected'} input.status
 * @param {string=} input.errorCode
 * @param {string=} input.errorMessage
 * @param {string=} input.requestId
 * @param {string=} input.sessionId
 * @param {string=} input.ip
 * @param {string=} input.userAgent
 */
export async function writeSignAudit(input) {
  const job = _writeChain.then(() => doWrite(input)).catch(() => null);
  _writeChain = job;
  return job;
}

async function doWrite(input) {
  try {
    const { prevHash, prevSeq } = await _lastSelfHash();
    _seq = Math.max(_seq, prevSeq) + 1;
    const row = {
      seq: _seq,
      ts: new Date(),
      anonymousId: String(input.anonymousId || ''),
      walletAddress: input.walletAddress || null,
      agentAddress: input.agentAddress || null,
      chain: input.chain || 'solana',
      action: input.action,
      toolId: input.toolId || null,
      intentId: input.intentId || null,
      amountUsd: Number.isFinite(input.amountUsd) ? Number(input.amountUsd) : 0,
      toAddress: input.toAddress || null,
      txSignature: input.txSignature || null,
      policyDecision: input.policyDecision,
      policyReasons: Array.isArray(input.policyReasons) ? input.policyReasons.slice(0, 32) : [],
      riskScore: Number.isFinite(input.riskScore) ? Number(input.riskScore) : 0,
      status: input.status,
      errorCode: input.errorCode || null,
      errorMessage: input.errorMessage ? String(input.errorMessage).slice(0, 1000) : null,
      requestId: input.requestId || null,
      sessionId: input.sessionId || null,
      ip: input.ip || null,
      userAgent: input.userAgent ? String(input.userAgent).slice(0, 256) : null,
      prevHash,
    };
    const hasher = crypto.createHash('sha256');
    hasher.update(prevHash || '');
    hasher.update('|');
    hasher.update(canonicalize(row));
    row.selfHash = hasher.digest('hex');
    await SignAudit.create(row);
    try {
      recordSignAuditMetrics(row);
    } catch (e) {
      log.warn({ event: 'metrics_emit_failed', err: e?.message }, 'metrics emit failed');
    }
    // Alert-worthy events
    if (row.action === 'withdraw' || row.policyDecision === 'deny' || row.riskScore >= 30) {
      log.warn(
        {
          event: 'sign_audit',
          decision: row.policyDecision,
          status: row.status,
          action: row.action,
          amountUsd: row.amountUsd,
          riskScore: row.riskScore,
          reasons: row.policyReasons,
          intentId: row.intentId,
          anonymousId: row.anonymousId,
        },
        'sign_audit'
      );
    }
    return row;
  } catch (err) {
    // Audit failures are alarming but must not crash the request path.
    log.error({ event: 'sign_audit_write_failed', err: err?.message || String(err) }, 'sign_audit write failed');
    return null;
  }
}

/**
 * Verify the integrity of the entire chain (or the last N rows). Run in monitoring jobs.
 * @param {number=} limit
 * @returns {Promise<{ok: true} | {ok: false; brokenAt: number; expected: string; actual: string}>}
 */
export async function verifySignAuditChain(limit = 10000) {
  const rows = await SignAudit.find({})
    .sort({ seq: 1 })
    .limit(limit)
    .lean();
  let prev = null;
  for (const r of rows) {
    const { selfHash, _id, __v, ...rest } = r;
    const expected = (() => {
      const h = crypto.createHash('sha256');
      h.update(prev || '');
      h.update('|');
      h.update(canonicalize(rest));
      return h.digest('hex');
    })();
    if (expected !== selfHash) {
      return { ok: false, brokenAt: r.seq, expected, actual: selfHash };
    }
    prev = selfHash;
  }
  return { ok: true };
}
