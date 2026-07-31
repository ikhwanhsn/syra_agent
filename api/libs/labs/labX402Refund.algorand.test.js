/**
 * Run: node --test api/libs/labs/labX402Refund.algorand.test.js
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  classifyAlgorandRefundError,
  computeAlgorandSpendableMicro,
  ensurePayToAlgoForUsdcRefund,
  isAlgorandBelowMinBalanceError,
  PAYTO_USDC_REFUND_FEE_NEED_MICRO,
  spendableFromAccountInfo,
} from './labAlgorandFeeBuffer.js';
import { evaluateLowBalanceRefund, PAYTO_INSUFFICIENT_FUNDS } from './labX402Refund.js';
import {
  ALGO_MIN_FOR_USDC_OPT_IN,
  computeAlgorandUsdcOptInNeedMicro,
  evaluateAlgorandUsdcOptInAlgoGate,
} from './labWalletService.js';

describe('computeAlgorandSpendableMicro', () => {
  test('returns 0 when amount is below min-balance (PayTo MBR stuck)', () => {
    assert.equal(computeAlgorandSpendableMicro(199638n, 200000n), 0n);
  });

  test('returns amount - min when spendable', () => {
    assert.equal(computeAlgorandSpendableMicro(250000n, 200000n), 50000n);
  });

  test('accepts number inputs', () => {
    assert.equal(computeAlgorandSpendableMicro(210000, 200000), 10000n);
  });
});

describe('spendableFromAccountInfo', () => {
  test('reads camelCase and kebab-case min-balance', () => {
    assert.equal(
      spendableFromAccountInfo({ amount: 250000, minBalance: 200000 }).spendableMicro,
      50000n,
    );
    assert.equal(
      spendableFromAccountInfo({ amount: 199638, 'min-balance': 200000 }).spendableMicro,
      0n,
    );
  });
});

describe('isAlgorandBelowMinBalanceError / classifyAlgorandRefundError', () => {
  const sample =
    'Network request error. Received status 400 (Bad Request): TransactionPool.Remember: transaction IDG7BEILW6RY35FE7PZ2KFKWY3QDETGETUQWEY6C6CXJH46HNOJQ: account XJCCGGJ6FL6CFYNXCTO6Q5YQ7E2OIYVRX2G3BVZUF4JOL36HSJRPLYHW5E balance 199638 below min 200000 (1 assets)';

  test('detects Algod below-min message', () => {
    assert.equal(isAlgorandBelowMinBalanceError(new Error(sample)), true);
    assert.equal(isAlgorandBelowMinBalanceError(new Error('unrelated')), false);
  });

  test('maps below-min to PAYTO_INSUFFICIENT_FUNDS', () => {
    const classified = classifyAlgorandRefundError(new Error(sample), PAYTO_INSUFFICIENT_FUNDS);
    assert.match(classified.message, new RegExp(PAYTO_INSUFFICIENT_FUNDS));
    assert.match(classified.message, /below min-balance/i);
  });

  test('leaves existing PAYTO_INSUFFICIENT_FUNDS errors intact', () => {
    const original = new Error(`${PAYTO_INSUFFICIENT_FUNDS}: payTo USDC 0 < needed 0.1`);
    const classified = classifyAlgorandRefundError(original, PAYTO_INSUFFICIENT_FUNDS);
    assert.equal(classified, original);
  });
});

describe('evaluateLowBalanceRefund (regression)', () => {
  test('refunds when USDC is below max endpoint price', () => {
    const decision = evaluateLowBalanceRefund(0.01, 0.05, 0.02);
    assert.equal(decision.shouldRefund, true);
    assert.ok(decision.refundAmountUsd > 0);
  });

  test('skips refund when USDC covers max price', () => {
    const decision = evaluateLowBalanceRefund(0.2, 0.05, 0.02);
    assert.equal(decision.shouldRefund, false);
  });
});

describe('computeAlgorandUsdcOptInNeedMicro', () => {
  test('fresh account (min 100_000) needs ~0.202 ALGO', () => {
    assert.equal(computeAlgorandUsdcOptInNeedMicro(100_000n), 202_000n);
  });

  test('account already holding an ASA (min 200_000) needs ~0.302 ALGO', () => {
    assert.equal(computeAlgorandUsdcOptInNeedMicro(200_000n), 302_000n);
  });

  test('defaults to base min when min-balance omitted', () => {
    assert.equal(computeAlgorandUsdcOptInNeedMicro(), 202_000n);
  });

  test('floor constant is at least 0.21 ALGO', () => {
    assert.ok(ALGO_MIN_FOR_USDC_OPT_IN >= 0.21);
  });
});

describe('evaluateAlgorandUsdcOptInAlgoGate', () => {
  test('rejects 0.15 ALGO fresh account (old broken threshold)', () => {
    const gate = evaluateAlgorandUsdcOptInAlgoGate({
      amountMicro: 150_000n,
      minBalanceMicro: 100_000n,
    });
    assert.equal(gate.ok, false);
    assert.match(String(gate.error), /insufficient_algo_for_opt_in/);
    assert.match(String(gate.error), /0\.21 ALGO/);
    assert.match(String(gate.error), /0\.1500/);
  });

  test('accepts ~0.25 ALGO fresh account', () => {
    const gate = evaluateAlgorandUsdcOptInAlgoGate({
      amountMicro: 250_000n,
      minBalanceMicro: 100_000n,
    });
    assert.equal(gate.ok, true);
  });

  test('rejects when live min-balance already elevated and ALGO is short', () => {
    const gate = evaluateAlgorandUsdcOptInAlgoGate({
      amountMicro: 250_000n,
      minBalanceMicro: 200_000n,
    });
    assert.equal(gate.ok, false);
    assert.match(String(gate.error), /0\.30 ALGO/);
  });
});

describe('ensurePayToAlgoForUsdcRefund', () => {
  test('already ok when PayTo has spendable above need', async () => {
    const client = {
      accountInformation() {
        return {
          do: async () => ({ amount: 250000, minBalance: 200000 }),
        };
      },
    };
    const result = await ensurePayToAlgoForUsdcRefund('PAYTOADDR', {
      client,
      needMicro: PAYTO_USDC_REFUND_FEE_NEED_MICRO,
      funders: [],
    });
    assert.equal(result.ok, true);
    assert.equal(result.already, true);
    assert.ok(result.spendable > 0);
  });

  test('borrows ALGO from funder when PayTo spendable is short', async () => {
    const payTo = 'PAYTOADDR';
    const funderAddr = 'FUNDERADDR';
    /** @type {{ funder: string; amountMicro: bigint } | null} */
    let sent = null;

    const client = {
      accountInformation(addr) {
        return {
          do: async () => {
            if (addr === payTo) {
              return { amount: 199638, minBalance: 200000 };
            }
            return { amount: 1_000_000, minBalance: 200000 };
          },
        };
      },
    };

    const result = await ensurePayToAlgoForUsdcRefund(payTo, {
      client,
      needMicro: PAYTO_USDC_REFUND_FEE_NEED_MICRO,
      funders: [{ address: funderAddr, sk: new Uint8Array(64) }],
      sendPayment: async ({ funder, amountMicro }) => {
        sent = { funder: funder.address, amountMicro };
        return { txid: 'MOCKTXID' };
      },
    });

    assert.equal(result.ok, true);
    assert.equal(result.funded, true);
    assert.equal(result.from, funderAddr);
    assert.ok(result.amount > 0);
    assert.ok(sent);
    assert.equal(sent.funder, funderAddr);
    assert.equal(sent.amountMicro, PAYTO_USDC_REFUND_FEE_NEED_MICRO);
  });

  test('fails clearly when PayTo at MBR and no funders can lend', async () => {
    const client = {
      accountInformation() {
        return {
          do: async () => ({ amount: 199638, minBalance: 200000 }),
        };
      },
    };
    const result = await ensurePayToAlgoForUsdcRefund('PAYTOADDR', {
      client,
      needMicro: PAYTO_USDC_REFUND_FEE_NEED_MICRO,
      funders: [],
    });
    assert.equal(result.ok, false);
    assert.match(String(result.error), /insufficient_algo_for_usdc_refund/);
    assert.equal(result.spendable, 0);
  });
});
