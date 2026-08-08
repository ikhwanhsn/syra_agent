/**
 * Run: node --test api/libs/labs/labX402Refund.algorand.test.js
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  classifyAlgorandRefundError,
  computeAlgorandPayerAlgoSeedNeedMicro,
  computeAlgorandSpendableMicro,
  ensureAlgorandPayerAlgoForOptInAndFees,
  ensurePayToAlgoForUsdcRefund,
  FUNDER_SPARE_MICRO,
  FUNDER_SPARE_MIN_FEE_MICRO,
  isAlgorandBelowMinBalanceError,
  PAYER_ALGO_SEED_FEE_CUSHION_MICRO,
  PAYTO_USDC_REFUND_BATCH_SIZE,
  PAYTO_USDC_REFUND_FEE_NEED_MICRO,
  PAYTO_USDC_REFUND_MIN_FEE_MICRO,
  spendableFromAccountInfo,
} from './labAlgorandFeeBuffer.js';
import {
  clampAlgorandPayToUsdcRefundAmount,
  classifyLabTopUpFailureReason,
  evaluateLowBalanceRefund,
  PAYTO_INSUFFICIENT_FUNDS,
} from './labX402Refund.js';
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

describe('PAYTO_USDC_REFUND_FEE_NEED_MICRO (batch cushion)', () => {
  test('covers multiple refunds per scheduler tick', () => {
    assert.ok(PAYTO_USDC_REFUND_BATCH_SIZE >= 8n);
    const singleRefund = 1_000n * 2n + 20_000n;
    assert.equal(PAYTO_USDC_REFUND_FEE_NEED_MICRO, singleRefund * PAYTO_USDC_REFUND_BATCH_SIZE);
    assert.ok(PAYTO_USDC_REFUND_FEE_NEED_MICRO > singleRefund);
  });

  test('single-fee floor is well below batch cushion', () => {
    assert.equal(PAYTO_USDC_REFUND_MIN_FEE_MICRO, 1_000n * 2n + 2_000n);
    assert.ok(PAYTO_USDC_REFUND_MIN_FEE_MICRO < PAYTO_USDC_REFUND_FEE_NEED_MICRO);
  });
});

describe('clampAlgorandPayToUsdcRefundAmount', () => {
  test('sends full amount when PayTo has enough USDC', () => {
    const clamp = clampAlgorandPayToUsdcRefundAmount({
      requestedUsd: 0.2,
      payToUsdcBalance: 0.71,
      minPriceUsd: 0.01,
    });
    assert.equal(clamp.ok, true);
    assert.equal(clamp.partial, false);
    assert.equal(clamp.amountUsd, 0.2);
    assert.equal(clamp.reason, 'full');
  });

  test('partial top-up when PayTo USDC is below request but above min call', () => {
    const clamp = clampAlgorandPayToUsdcRefundAmount({
      requestedUsd: 0.2,
      payToUsdcBalance: 0.05,
      minPriceUsd: 0.01,
    });
    assert.equal(clamp.ok, true);
    assert.equal(clamp.partial, true);
    assert.equal(clamp.amountUsd, 0.05);
    assert.equal(clamp.reason, 'partial');
  });

  test('underfunded only when PayTo USDC is below min call price', () => {
    const clamp = clampAlgorandPayToUsdcRefundAmount({
      requestedUsd: 0.2,
      payToUsdcBalance: 0.005,
      minPriceUsd: 0.01,
    });
    assert.equal(clamp.ok, false);
    assert.equal(clamp.amountUsd, 0);
    assert.equal(clamp.reason, 'payto_underfunded');
  });

  test('rejects invalid inputs', () => {
    const clamp = clampAlgorandPayToUsdcRefundAmount({
      requestedUsd: 0,
      payToUsdcBalance: 1,
      minPriceUsd: 0.01,
    });
    assert.equal(clamp.ok, false);
    assert.equal(clamp.reason, 'invalid');
  });
});

describe('computeAlgorandPayerAlgoSeedNeedMicro', () => {
  test('fresh empty payer needs opt-in floor + fee cushion', () => {
    const seed = computeAlgorandPayerAlgoSeedNeedMicro({
      amountMicro: 0n,
      minBalanceMicro: 100_000n,
    });
    assert.equal(seed.alreadyOk, false);
    assert.equal(seed.requiredForOptInMicro, 210_000n);
    assert.equal(seed.targetMicro, 210_000n + PAYER_ALGO_SEED_FEE_CUSHION_MICRO);
    assert.equal(seed.deficitMicro, seed.targetMicro);
  });

  test('alreadyOk when payer already holds target ALGO', () => {
    const seed = computeAlgorandPayerAlgoSeedNeedMicro({
      amountMicro: 300_000n,
      minBalanceMicro: 100_000n,
    });
    assert.equal(seed.alreadyOk, true);
    assert.equal(seed.deficitMicro, 0n);
  });

  test('deficit equals target minus have', () => {
    const seed = computeAlgorandPayerAlgoSeedNeedMicro({
      amountMicro: 150_000n,
      minBalanceMicro: 100_000n,
    });
    assert.equal(seed.alreadyOk, false);
    assert.equal(seed.deficitMicro, seed.targetMicro - 150_000n);
  });
});

describe('ensurePayToAlgoForUsdcRefund', () => {
  test('already ok when PayTo has spendable above need', async () => {
    const client = {
      accountInformation() {
        return {
          do: async () => ({ amount: 400000, minBalance: 200000 }),
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
            return { amount: 2_000_000, minBalance: 200000 };
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

  test('proceeds belowBatch when spendable covers single fee but not batch cushion', async () => {
    // Real Labs shape: ~0.259 ALGO total, 0.2 ALGO MBR → ~0.059 spendable
    // (enough for many single refunds, below 0.176 batch cushion).
    const client = {
      accountInformation() {
        return {
          do: async () => ({ amount: 259000, minBalance: 200000 }),
        };
      },
    };
    const result = await ensurePayToAlgoForUsdcRefund('PAYTOADDR', {
      client,
      needMicro: PAYTO_USDC_REFUND_FEE_NEED_MICRO,
      funders: [],
    });
    assert.equal(result.ok, true);
    assert.equal(result.belowBatch, true);
    assert.equal(result.funded, false);
    assert.ok(result.spendable > 0);
    assert.ok(result.spendable * 1e6 >= Number(PAYTO_USDC_REFUND_MIN_FEE_MICRO));
    assert.ok(result.spendable * 1e6 < Number(PAYTO_USDC_REFUND_FEE_NEED_MICRO));
  });

  test('still fails when spendable is below single-fee floor and no funders', async () => {
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
      minMicro: PAYTO_USDC_REFUND_MIN_FEE_MICRO,
      funders: [],
    });
    assert.equal(result.ok, false);
    assert.match(String(result.error), /insufficient_algo_for_usdc_refund/);
    assert.equal(result.spendable, 0);
  });

  test('min-fee borrow succeeds from sibling with 0.036 spendable (below batch spare)', async () => {
    const payTo = 'PAYTOADDR';
    const funderAddr = 'SIBLING036';
    /** @type {{ funder: string; amountMicro: bigint } | null} */
    let sent = null;
    const minBal = 200_000;
    // PayTo: 0 spendable. Sibling: 0.036 spendable (< FUNDER_SPARE ~0.051, > min fee).
    const siblingAmount = minBal + 36_000;

    const client = {
      accountInformation(addr) {
        return {
          do: async () => {
            if (addr === payTo) {
              return { amount: minBal - 362, minBalance: minBal };
            }
            return { amount: siblingAmount, minBalance: minBal };
          },
        };
      },
    };

    assert.ok(36_000n < FUNDER_SPARE_MICRO);
    assert.ok(36_000n - FUNDER_SPARE_MIN_FEE_MICRO >= PAYTO_USDC_REFUND_MIN_FEE_MICRO);

    const result = await ensurePayToAlgoForUsdcRefund(payTo, {
      client,
      needMicro: PAYTO_USDC_REFUND_FEE_NEED_MICRO,
      minMicro: PAYTO_USDC_REFUND_MIN_FEE_MICRO,
      funders: [{ address: funderAddr, sk: new Uint8Array(64) }],
      sendPayment: async ({ funder, amountMicro }) => {
        sent = { funder: funder.address, amountMicro };
        return { txid: 'MOCKTXID036' };
      },
    });

    assert.equal(result.ok, true);
    assert.equal(result.funded, true);
    assert.equal(result.belowBatch, true);
    assert.equal(result.from, funderAddr);
    assert.ok(sent);
    assert.equal(sent.funder, funderAddr);
    assert.equal(sent.amountMicro, PAYTO_USDC_REFUND_MIN_FEE_MICRO);
  });
});

describe('classifyLabTopUpFailureReason', () => {
  test('maps ALGO fee failures to payto_native_underfunded', () => {
    assert.equal(
      classifyLabTopUpFailureReason(
        `${PAYTO_INSUFFICIENT_FUNDS}: insufficient_algo_for_usdc_refund (payTo spendable 0 ALGO; need ~0.176 above min-balance)`,
      ),
      'payto_native_underfunded',
    );
    assert.equal(
      classifyLabTopUpFailureReason(
        `${PAYTO_INSUFFICIENT_FUNDS}: funder ALGO insufficient for USDC refund fees`,
      ),
      'payto_native_underfunded',
    );
    assert.equal(
      classifyLabTopUpFailureReason(
        `${PAYTO_INSUFFICIENT_FUNDS}: payTo ALGO below min-balance (need spendable fees): balance 1 below min 2`,
      ),
      'payto_native_underfunded',
    );
  });

  test('maps true USDC shortfalls to payto_underfunded', () => {
    assert.equal(
      classifyLabTopUpFailureReason(
        `${PAYTO_INSUFFICIENT_FUNDS}: no lab wallet with enough USDC to fund payer`,
      ),
      'payto_underfunded',
    );
  });

  test('maps opt-in failures', () => {
    assert.equal(
      classifyLabTopUpFailureReason(
        `${PAYTO_INSUFFICIENT_FUNDS}: payer not opted into USDC ASA (opt-in required before refund)`,
      ),
      'usdc_opt_in_required',
    );
  });
});

describe('ensureAlgorandPayerAlgoForOptInAndFees', () => {
  test('already ok when payer has opt-in + cushion ALGO', async () => {
    const client = {
      accountInformation() {
        return {
          do: async () => ({ amount: 300000, minBalance: 100000 }),
        };
      },
    };
    const result = await ensureAlgorandPayerAlgoForOptInAndFees('PAYERADDR', {
      client,
      funders: [],
    });
    assert.equal(result.ok, true);
    assert.equal(result.already, true);
  });

  test('borrows deficit from PayTo/funder when payer ALGO is short', async () => {
    const payer = 'PAYERADDR';
    const funderAddr = 'PAYTOADDR';
    /** @type {{ funder: string; amountMicro: bigint } | null} */
    let sent = null;

    const client = {
      accountInformation(addr) {
        return {
          do: async () => {
            if (addr === payer) {
              return { amount: 100000, minBalance: 100000 };
            }
            return { amount: 2_000_000, minBalance: 200000 };
          },
        };
      },
    };

    const expectedDeficit = computeAlgorandPayerAlgoSeedNeedMicro({
      amountMicro: 100_000n,
      minBalanceMicro: 100_000n,
    }).deficitMicro;

    const result = await ensureAlgorandPayerAlgoForOptInAndFees(payer, {
      client,
      funders: [{ address: funderAddr, sk: new Uint8Array(64) }],
      sendPayment: async ({ funder, amountMicro }) => {
        sent = { funder: funder.address, amountMicro };
        return { txid: 'MOCKSEEDTX' };
      },
    });

    assert.equal(result.ok, true);
    assert.equal(result.funded, true);
    assert.equal(result.from, funderAddr);
    assert.ok(sent);
    assert.equal(sent.funder, funderAddr);
    assert.equal(sent.amountMicro, expectedDeficit);
  });

  test('fails clearly when no funder can seed opt-in ALGO', async () => {
    const client = {
      accountInformation() {
        return {
          do: async () => ({ amount: 0, minBalance: 0 }),
        };
      },
    };
    const result = await ensureAlgorandPayerAlgoForOptInAndFees('PAYERADDR', {
      client,
      funders: [],
    });
    assert.equal(result.ok, false);
    assert.match(String(result.error), /insufficient_algo_for_opt_in_seed/);
  });
});

describe('clampAlgorandPayToUsdcRefundAmount (treasury floor)', () => {
  test('fails payto_underfunded when PayTo USDC is below min call price', () => {
    const clamp = clampAlgorandPayToUsdcRefundAmount({
      requestedUsd: 0.2,
      payToUsdcBalance: 0,
      minPriceUsd: 0.01,
    });
    assert.equal(clamp.ok, false);
    assert.equal(clamp.reason, 'payto_underfunded');
  });

  test('allows partial top-up when PayTo has enough for at least one call', () => {
    const clamp = clampAlgorandPayToUsdcRefundAmount({
      requestedUsd: 0.2,
      payToUsdcBalance: 0.05,
      minPriceUsd: 0.01,
    });
    assert.equal(clamp.ok, true);
    assert.equal(clamp.partial, true);
    assert.equal(clamp.amountUsd, 0.05);
  });
});
