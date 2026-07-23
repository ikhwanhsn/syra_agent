/**
 * Submit Rise program txs (deposit-and-borrow / repay-and-withdraw / buy/sell)
 * through walletBroker — unblocks leveraged LST loop real execution.
 */
import { executeIntent } from '../services/walletBroker.js';
import {
  risePostDepositAndBorrow,
  risePostRepayAndWithdraw,
  risePostBuyToken,
  risePostSellToken,
  hasRiseConfig,
} from './riseClient.js';

function extractTxBase64(payload) {
  if (!payload || typeof payload !== 'object') return null;
  const candidates = [
    payload.transaction,
    payload.serializedTxBase64,
    payload.tx,
    payload.data?.transaction,
    payload.data?.serializedTxBase64,
    payload.result?.transaction,
  ];
  for (const c of candidates) {
    if (typeof c === 'string' && c.trim().length > 20) return c.trim();
  }
  return null;
}

/**
 * @param {object} opts
 * @param {string} opts.anonymousId
 * @param {string} opts.toolId
 * @param {string} opts.serializedTxBase64
 * @param {number} [opts.estimatedUsd]
 * @param {string} [opts.summary]
 */
export async function submitRiseTxViaBroker({
  anonymousId,
  toolId,
  serializedTxBase64,
  estimatedUsd = 1,
  summary = 'Rise program tx',
}) {
  if (!serializedTxBase64) {
    return { ok: false, error: 'rise_tx_missing', signature: null };
  }
  const brokerResult = await executeIntent(
    { anonymousId, guest: false },
    {
      type: 'tx_sign',
      chain: 'solana',
      toolId,
      serializedTxBase64,
      estimatedUsd,
      summary,
    },
  );
  if (brokerResult.status !== 'ok') {
    return {
      ok: false,
      error: `rise_broker_failed:${(brokerResult.reasons || []).join(';')}`,
      signature: null,
      brokerResult,
    };
  }
  return { ok: true, signature: brokerResult.signature, brokerResult };
}

/**
 * Build deposit-and-borrow via Rise API, then sign+submit.
 * @param {object} body - Rise program body (must include wallet pubkey fields Rise expects)
 * @param {{ anonymousId: string, estimatedUsd?: number, summary?: string }} broker
 */
export async function executeRiseDepositAndBorrow(body, broker) {
  if (!hasRiseConfig()) {
    return { ok: false, error: 'rise_not_configured', signature: null };
  }
  const res = await risePostDepositAndBorrow(body);
  if (!res.ok) {
    return { ok: false, error: res.error || 'rise_deposit_borrow_failed', signature: null, rise: res };
  }
  const tx = extractTxBase64(res.data);
  if (!tx) {
    return { ok: false, error: 'rise_deposit_borrow_no_tx', signature: null, rise: res };
  }
  return submitRiseTxViaBroker({
    anonymousId: broker.anonymousId,
    toolId: 'rise-deposit-and-borrow',
    serializedTxBase64: tx,
    estimatedUsd: broker.estimatedUsd ?? 10,
    summary: broker.summary || 'Rise deposit and borrow',
  });
}

/**
 * Build repay-and-withdraw via Rise API, then sign+submit.
 */
export async function executeRiseRepayAndWithdraw(body, broker) {
  if (!hasRiseConfig()) {
    return { ok: false, error: 'rise_not_configured', signature: null };
  }
  const res = await risePostRepayAndWithdraw(body);
  if (!res.ok) {
    return { ok: false, error: res.error || 'rise_repay_withdraw_failed', signature: null, rise: res };
  }
  const tx = extractTxBase64(res.data);
  if (!tx) {
    return { ok: false, error: 'rise_repay_withdraw_no_tx', signature: null, rise: res };
  }
  return submitRiseTxViaBroker({
    anonymousId: broker.anonymousId,
    toolId: 'rise-repay-and-withdraw',
    serializedTxBase64: tx,
    estimatedUsd: broker.estimatedUsd ?? 10,
    summary: broker.summary || 'Rise repay and withdraw',
  });
}

export async function executeRiseBuyToken(body, broker) {
  if (!hasRiseConfig()) {
    return { ok: false, error: 'rise_not_configured', signature: null };
  }
  const res = await risePostBuyToken(body);
  if (!res.ok) {
    return { ok: false, error: res.error || 'rise_buy_failed', signature: null, rise: res };
  }
  const tx = extractTxBase64(res.data);
  if (!tx) {
    return { ok: false, error: 'rise_buy_no_tx', signature: null, rise: res };
  }
  return submitRiseTxViaBroker({
    anonymousId: broker.anonymousId,
    toolId: 'rise-buy-token',
    serializedTxBase64: tx,
    estimatedUsd: broker.estimatedUsd ?? 5,
    summary: broker.summary || 'Rise buy token',
  });
}

export async function executeRiseSellToken(body, broker) {
  if (!hasRiseConfig()) {
    return { ok: false, error: 'rise_not_configured', signature: null };
  }
  const res = await risePostSellToken(body);
  if (!res.ok) {
    return { ok: false, error: res.error || 'rise_sell_failed', signature: null, rise: res };
  }
  const tx = extractTxBase64(res.data);
  if (!tx) {
    return { ok: false, error: 'rise_sell_no_tx', signature: null, rise: res };
  }
  return submitRiseTxViaBroker({
    anonymousId: broker.anonymousId,
    toolId: 'rise-sell-token',
    serializedTxBase64: tx,
    estimatedUsd: broker.estimatedUsd ?? 5,
    summary: broker.summary || 'Rise sell token',
  });
}

export { hasRiseConfig, extractTxBase64 };
