/**
 * Run: node --test api/libs/labs/labAlgorandFeeBuffer.test.js
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  FUNDER_SPARE_MICRO,
  FUNDER_SPARE_MIN_FEE_MICRO,
  AGENT_FEE_RESERVE_TARGET_MICRO,
  lendableAlgorandMicro,
  orderAlgorandAlgoFundersBySpendable,
  planAlgorandPartialBorrows,
  computeAlgorandAgentFeeReserveNeedMicro,
  ensurePayToAlgoForUsdcRefund,
  ensurePayToAlgoFromAgentFeeReserve,
  PAYTO_USDC_REFUND_MIN_FEE_MICRO,
  PAYTO_USDC_REFUND_FEE_NEED_MICRO,
} from './labAlgorandFeeBuffer.js';

describe('lendableAlgorandMicro', () => {
  test('returns 0 when spendable is at or below spare', () => {
    assert.equal(lendableAlgorandMicro(FUNDER_SPARE_MICRO, FUNDER_SPARE_MICRO), 0n);
    assert.equal(lendableAlgorandMicro(30_000n, FUNDER_SPARE_MICRO), 0n);
  });

  test('screenshot sibling 0.036 cannot lend under batch spare but can under min-fee spare', () => {
    const siblingSpendable = 36_000n; // 0.036 ALGO
    assert.equal(lendableAlgorandMicro(siblingSpendable, FUNDER_SPARE_MICRO), 0n);
    const lendableMin = lendableAlgorandMicro(siblingSpendable, FUNDER_SPARE_MIN_FEE_MICRO);
    assert.ok(lendableMin >= PAYTO_USDC_REFUND_MIN_FEE_MICRO);
  });
});

describe('planAlgorandPartialBorrows', () => {
  test('single rich funder fills deficit alone', () => {
    const plan = planAlgorandPartialBorrows({
      deficitMicro: PAYTO_USDC_REFUND_FEE_NEED_MICRO,
      spareMicro: FUNDER_SPARE_MICRO,
      funders: [{ address: 'RICH', spendableMicro: 2_000_000n }],
    });
    assert.equal(plan.filled, true);
    assert.equal(plan.parts.length, 1);
    assert.equal(plan.parts[0].address, 'RICH');
    assert.equal(plan.parts[0].amountMicro, PAYTO_USDC_REFUND_FEE_NEED_MICRO);
  });

  test('N siblings with 0.036 each fill batch together; none can alone', () => {
    const siblingSpendable = 36_000n;
    assert.equal(lendableAlgorandMicro(siblingSpendable, FUNDER_SPARE_MICRO), 0n);
    const lendableMin = lendableAlgorandMicro(siblingSpendable, FUNDER_SPARE_MIN_FEE_MICRO);
    assert.ok(lendableMin < PAYTO_USDC_REFUND_FEE_NEED_MICRO);

    const siblings = Array.from({ length: 8 }, (_, i) => ({
      address: `SIB${i}`,
      spendableMicro: siblingSpendable,
    }));
    const alone = planAlgorandPartialBorrows({
      deficitMicro: PAYTO_USDC_REFUND_FEE_NEED_MICRO,
      spareMicro: FUNDER_SPARE_MIN_FEE_MICRO,
      funders: [siblings[0]],
    });
    assert.equal(alone.filled, false);

    const together = planAlgorandPartialBorrows({
      deficitMicro: PAYTO_USDC_REFUND_FEE_NEED_MICRO,
      spareMicro: FUNDER_SPARE_MIN_FEE_MICRO,
      funders: siblings,
    });
    assert.equal(together.filled, true);
    assert.ok(together.parts.length >= 5);
    assert.equal(together.totalLentMicro, PAYTO_USDC_REFUND_FEE_NEED_MICRO);
  });

  test('skips receiver and zero-lendable funders', () => {
    const plan = planAlgorandPartialBorrows({
      deficitMicro: 10_000n,
      spareMicro: FUNDER_SPARE_MIN_FEE_MICRO,
      receiver: 'PAYTO',
      funders: [
        { address: 'PAYTO', spendableMicro: 100_000n },
        { address: 'DUST', spendableMicro: 500n },
        { address: 'OK', spendableMicro: 20_000n },
      ],
    });
    assert.equal(plan.filled, true);
    assert.deepEqual(
      plan.parts.map((p) => p.address),
      ['OK'],
    );
  });
});

describe('orderAlgorandAlgoFundersBySpendable', () => {
  test('sorts by spendableMicro descending', () => {
    const ordered = orderAlgorandAlgoFundersBySpendable([
      { address: 'A', spendableMicro: 1_000n },
      { address: 'B', spendableMicro: 50_000n },
      { address: 'C', spendableMicro: 5_000n },
    ]);
    assert.deepEqual(
      ordered.map((x) => x.address),
      ['B', 'C', 'A'],
    );
    assert.equal(ordered[0].spendableMicro, 50_000n);
  });

  test('ties break by address localeCompare', () => {
    const ordered = orderAlgorandAlgoFundersBySpendable([
      { address: 'ZED', spendableMicro: 10n },
      { address: 'ACE', spendableMicro: 10n },
      { address: 'MID', spendableMicro: 10n },
    ]);
    assert.deepEqual(
      ordered.map((x) => x.address),
      ['ACE', 'MID', 'ZED'],
    );
  });

  test('skips empty addresses and normalizes invalid spendable to 0', () => {
    const ordered = orderAlgorandAlgoFundersBySpendable([
      { address: '', spendableMicro: 999n },
      { address: 'OK', spendableMicro: 'not-a-bigint' },
      null,
      { address: 'RICH', spendableMicro: 100n },
    ]);
    assert.deepEqual(
      ordered.map((x) => x.address),
      ['RICH', 'OK'],
    );
    assert.equal(ordered[1].spendableMicro, 0n);
  });

  test('preserves extra fields for funder account objects', () => {
    const sk = new Uint8Array([1, 2, 3]);
    const ordered = orderAlgorandAlgoFundersBySpendable([
      { address: 'LOW', spendableMicro: 1n, sk },
      { address: 'HIGH', spendableMicro: 9n, sk },
    ]);
    assert.equal(ordered[0].address, 'HIGH');
    assert.equal(ordered[0].sk, sk);
  });

  test('empty / non-array input returns empty array', () => {
    assert.deepEqual(orderAlgorandAlgoFundersBySpendable([]), []);
    assert.deepEqual(orderAlgorandAlgoFundersBySpendable(null), []);
  });
});

describe('ensurePayToAlgoForUsdcRefund multi-funder consolidation', () => {
  test('multi siblings with 0.036 fill batch cushion via partial borrows', async () => {
    const payTo = 'PAYTOADDR';
    const minBal = 200_000;
    /** @type {Map<string, number>} */
    const amounts = new Map([
      [payTo, minBal], // 0 spendable
    ]);
    const funders = [];
    for (let i = 0; i < 8; i++) {
      const addr = `SIB${i}ADDR`;
      amounts.set(addr, minBal + 36_000);
      funders.push({ address: addr, sk: new Uint8Array(64) });
    }

    /** @type {Array<{ funder: string; amountMicro: bigint }>} */
    const sends = [];
    const client = {
      accountInformation(addr) {
        return {
          do: async () => ({
            amount: amounts.get(addr) ?? minBal,
            minBalance: minBal,
          }),
        };
      },
    };

    const result = await ensurePayToAlgoForUsdcRefund(payTo, {
      client,
      needMicro: PAYTO_USDC_REFUND_FEE_NEED_MICRO,
      minMicro: PAYTO_USDC_REFUND_MIN_FEE_MICRO,
      funders,
      sendPayment: async ({ funder, amountMicro }) => {
        sends.push({ funder: funder.address, amountMicro });
        const fromBal = amounts.get(funder.address) ?? minBal;
        amounts.set(funder.address, fromBal - Number(amountMicro));
        const toBal = amounts.get(payTo) ?? minBal;
        amounts.set(payTo, toBal + Number(amountMicro));
        return { txid: `TX-${funder.address}` };
      },
    });

    assert.equal(result.ok, true);
    assert.equal(result.funded, true);
    assert.ok(sends.length >= 5);
    assert.ok(amounts.get(payTo) - minBal >= Number(PAYTO_USDC_REFUND_FEE_NEED_MICRO));
  });
});

describe('agent fee reserve', () => {
  test('target is max(batch cushion, 0.25 ALGO)', () => {
    const expected =
      PAYTO_USDC_REFUND_FEE_NEED_MICRO > 250_000n
        ? PAYTO_USDC_REFUND_FEE_NEED_MICRO
        : 250_000n;
    assert.equal(AGENT_FEE_RESERVE_TARGET_MICRO, expected);
  });

  test('computeAlgorandAgentFeeReserveNeedMicro fills deficit to target', () => {
    const need = computeAlgorandAgentFeeReserveNeedMicro({ spendableMicro: 0n });
    assert.equal(need.alreadyOk, false);
    assert.equal(need.needMicro, AGENT_FEE_RESERVE_TARGET_MICRO);
    const ok = computeAlgorandAgentFeeReserveNeedMicro({
      spendableMicro: AGENT_FEE_RESERVE_TARGET_MICRO,
    });
    assert.equal(ok.alreadyOk, true);
    assert.equal(ok.needMicro, 0n);
  });

  test('ensurePayToAlgoFromAgentFeeReserve tops up when siblings cannot lend', async () => {
    const payTo = 'PAYTOADDR';
    const agent = 'AGENTADDR';
    const minBal = 200_000;
    /** @type {Map<string, number>} */
    const amounts = new Map([
      [payTo, minBal],
      [agent, minBal + 5_000_000],
    ]);
    const client = {
      accountInformation(addr) {
        return {
          do: async () => ({
            amount: amounts.get(addr) ?? minBal,
            minBalance: minBal,
          }),
        };
      },
    };
    /** @type {Array<{ funder: string; amountMicro: bigint }>} */
    const sends = [];
    const result = await ensurePayToAlgoFromAgentFeeReserve(payTo, {
      client,
      agentAccount: { address: agent, sk: new Uint8Array(64) },
      sendPayment: async ({ funder, amountMicro }) => {
        sends.push({ funder: funder.address, amountMicro });
        amounts.set(funder.address, (amounts.get(funder.address) ?? 0) - Number(amountMicro));
        amounts.set(payTo, (amounts.get(payTo) ?? 0) + Number(amountMicro));
        return { txid: 'AGENTTX' };
      },
    });
    assert.equal(result.ok, true);
    assert.equal(result.funded, true);
    assert.equal(result.fromAgentReserve, true);
    assert.equal(sends.length, 1);
    assert.equal(sends[0].funder, agent);
    assert.equal(sends[0].amountMicro, AGENT_FEE_RESERVE_TARGET_MICRO);
  });

  test('ensurePayToAlgoForUsdcRefund falls back to agent when lab funders empty', async () => {
    const payTo = 'PAYTOADDR';
    const agent = 'AGENTADDR';
    const minBal = 200_000;
    /** @type {Map<string, number>} */
    const amounts = new Map([
      [payTo, minBal],
      [agent, minBal + 5_000_000],
    ]);
    const client = {
      accountInformation(addr) {
        return {
          do: async () => ({
            amount: amounts.get(addr) ?? minBal,
            minBalance: minBal,
          }),
        };
      },
    };
    const result = await ensurePayToAlgoForUsdcRefund(payTo, {
      client,
      needMicro: PAYTO_USDC_REFUND_FEE_NEED_MICRO,
      minMicro: PAYTO_USDC_REFUND_MIN_FEE_MICRO,
      funders: [], // no lab funders
      agentAccount: { address: agent, sk: new Uint8Array(64) },
      sendPayment: async ({ funder, amountMicro }) => {
        amounts.set(funder.address, (amounts.get(funder.address) ?? 0) - Number(amountMicro));
        amounts.set(payTo, (amounts.get(payTo) ?? 0) + Number(amountMicro));
        return { txid: 'FALLBACK' };
      },
    });
    assert.equal(result.ok, true);
    assert.equal(result.fromAgentReserve, true);
    assert.ok((amounts.get(payTo) ?? 0) - minBal >= Number(PAYTO_USDC_REFUND_MIN_FEE_MICRO));
  });
});
