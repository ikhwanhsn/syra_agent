/**
 * Earn Yield product adapter registry.
 */
import {
  EARN_PRODUCT_LP,
  EARN_PRODUCT_CBBTC,
  EARN_PRODUCT_BTC3,
  EARN_PRODUCT_MOMENTUM,
  EARN_PRODUCT_LST_LOOP,
  EARN_PRODUCT_SNIPER,
} from '../../config/earnProducts.js';
import lpEarnAdapter from './lpEarnAdapter.js';
import btcQuantEarnAdapter from './btcQuantEarnAdapter.js';
import btc3EarnAdapter from './btc3EarnAdapter.js';
import momentumRotatorEarnAdapter from './momentumRotatorEarnAdapter.js';
import lstLoopEarnAdapter from './lstLoopEarnAdapter.js';
import alphaSniperEarnAdapter from './alphaSniperEarnAdapter.js';

/** @type {Map<string, typeof lpEarnAdapter>} */
const ADAPTERS = new Map([
  [EARN_PRODUCT_LP, lpEarnAdapter],
  [EARN_PRODUCT_CBBTC, btcQuantEarnAdapter],
  [EARN_PRODUCT_BTC3, btc3EarnAdapter],
  [EARN_PRODUCT_MOMENTUM, momentumRotatorEarnAdapter],
  [EARN_PRODUCT_LST_LOOP, lstLoopEarnAdapter],
  [EARN_PRODUCT_SNIPER, alphaSniperEarnAdapter],
]);

/**
 * @param {string} productId
 * @returns {typeof lpEarnAdapter | null}
 */
export function getEarnAdapter(productId) {
  return ADAPTERS.get(String(productId || '').trim()) || null;
}

/**
 * @returns {typeof lpEarnAdapter[]}
 */
export function listEarnAdapters() {
  return [...ADAPTERS.values()];
}

export {
  lpEarnAdapter,
  btcQuantEarnAdapter,
  btc3EarnAdapter,
  momentumRotatorEarnAdapter,
  lstLoopEarnAdapter,
  alphaSniperEarnAdapter,
};
