import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  DEXTER_X402_NETWORKS,
  getDexterNetworkByCaip2,
  getDexterNetworkDecimals,
  getDexterNetworkExtra,
  usdToDexterAtomic,
  getEnabledDexterNetworks,
} from '../config/dexterX402Networks.js';
import {
  applyDexterNetworkPriceFloor,
  applyDexterPriceFloor,
  X402_DEXTER_MIN_PAYMENT_USD,
  X402_TIER_1_USD,
} from '../config/x402Pricing.js';
import {
  getDexterNetworkFloorUsd,
  resetDexterSolanaFeePayerHealthCache,
  getDexterCachedFloorsByCaip2,
} from './dexterSolanaFeePayerHealth.js';

describe('dexterX402Networks — new chains + decimals', () => {
  it('includes world, monad, robinhood, and bnb', () => {
    const ids = DEXTER_X402_NETWORKS.map((n) => n.id);
    assert.ok(ids.includes('world'));
    assert.ok(ids.includes('monad'));
    assert.ok(ids.includes('robinhood'));
    assert.ok(ids.includes('bnb'));
  });

  it('BNB uses 18 decimals; others default to 6', () => {
    const bnb = getDexterNetworkByCaip2('eip155:56');
    assert.equal(getDexterNetworkDecimals(bnb), 18);
    const world = getDexterNetworkByCaip2('eip155:480');
    assert.equal(getDexterNetworkDecimals(world), 6);
    const monad = getDexterNetworkByCaip2('eip155:143');
    assert.equal(getDexterNetworkDecimals(monad), 6);
    const rh = getDexterNetworkByCaip2('eip155:4663');
    assert.equal(getDexterNetworkDecimals(rh), 6);
  });

  it('Robinhood carries Global Dollar EIP-712 extras', () => {
    const rh = getDexterNetworkByCaip2('eip155:4663');
    const extra = getDexterNetworkExtra(rh);
    assert.equal(extra?.name, 'Global Dollar');
    assert.equal(extra?.version, '1');
  });

  it('usdToDexterAtomic scales 18-dec BNB correctly', () => {
    // $0.001 → 1e15 atomic at 18 decimals
    assert.equal(usdToDexterAtomic(0.001, 18), '1000000000000000');
    // $0.001 → 1000 micro at 6 decimals
    assert.equal(usdToDexterAtomic(0.001, 6), '1000');
  });

  it('World/Monad/Robinhood appear in enabled mainnets (non-prod includes testnets)', () => {
    const enabled = getEnabledDexterNetworks();
    const caip2s = enabled.map((n) => n.caip2);
    assert.ok(caip2s.includes('eip155:480'));
    assert.ok(caip2s.includes('eip155:143'));
    assert.ok(caip2s.includes('eip155:4663'));
  });
});

describe('Dexter per-chain price floors', () => {
  it('applyDexterNetworkPriceFloor bumps below-floor prices', () => {
    assert.equal(applyDexterNetworkPriceFloor(0.001, 0.00447), 0.00447);
    assert.equal(applyDexterNetworkPriceFloor(0.01, 0.00447), 0.01);
  });

  it('Arbitrum / Robinhood floors bump Tier 1 price', () => {
    const arbFloor = 0.004466;
    const rhFloor = 0.008775;
    assert.ok(applyDexterNetworkPriceFloor(X402_TIER_1_USD, arbFloor) > X402_TIER_1_USD);
    assert.ok(applyDexterNetworkPriceFloor(X402_TIER_1_USD, rhFloor) > X402_TIER_1_USD);
    assert.equal(
      applyDexterNetworkPriceFloor(X402_TIER_1_USD, arbFloor),
      arbFloor,
    );
  });

  it('getDexterNetworkFloorUsd falls back to static floor when cache is cold', () => {
    resetDexterSolanaFeePayerHealthCache();
    assert.equal(getDexterCachedFloorsByCaip2()['eip155:42161'], undefined);
    const floor = getDexterNetworkFloorUsd('eip155:42161');
    assert.equal(floor, X402_DEXTER_MIN_PAYMENT_USD);
    assert.equal(applyDexterPriceFloor(0.001), X402_DEXTER_MIN_PAYMENT_USD);
  });
});
