/**
 * Run: node --test api/libs/labs/labAlgorandFeeBuffer.test.js
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  FUNDER_SPARE_MICRO,
  FUNDER_SPARE_MIN_FEE_MICRO,
  lendableAlgorandMicro,
  orderAlgorandAlgoFundersBySpendable,
  PAYTO_USDC_REFUND_MIN_FEE_MICRO,
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
    assert.deepEqual(orderAlgorandAlgoFundersBySpendable(undefined), []);
  });
});
