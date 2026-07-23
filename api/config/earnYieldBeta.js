/**
 * Earn Yield beta config — back-compat re-exports from earnProducts.js.
 * Prefer importing from earnProducts.js for new code.
 */
export {
  EARN_PRODUCT_LP as EARN_YIELD_PRODUCT_ID,
  isEarnYieldBetaOpen,
  getEarnYieldBetaAllowlist,
  isEarnYieldBetaAllowed,
  EARN_PRODUCTS as EARN_YIELD_PRODUCTS,
} from "./earnProducts.js";
import { EARN_PRODUCTS, EARN_PRODUCT_LP } from "./earnProducts.js";

const lp = EARN_PRODUCTS.find((p) => p.id === EARN_PRODUCT_LP);

export const EARN_YIELD_PRODUCT_LABEL = lp?.label ?? "LP Auto (Meteora DLMM)";
export const EARN_YIELD_DEFAULT_PERFORMANCE_FEE_BPS = lp?.performanceFeeBps ?? 1000;
export const EARN_YIELD_MIN_DEPOSIT_SOL = lp?.minDeposit ?? 1;
export const EARN_YIELD_MAX_DEPOSIT_SOL = lp?.maxDeposit ?? 5;
export const EARN_YIELD_DEFAULT_MAX_POSITION_SOL = 1;
export const EARN_YIELD_DEFAULT_MAX_CONCURRENT = 3;
export const EARN_YIELD_MAX_ERROR_RATE = lp?.maxErrorRate ?? 0.05;
export const EARN_YIELD_KILL_ERROR_RATE = lp?.killErrorRate ?? 0.1;
export const EARN_YIELD_MIN_SETTLE_SUCCESS_RATE = lp?.minSettleSuccessRate ?? 0.95;
export const EARN_YIELD_MIN_SAMPLE_FOR_GUARDS = lp?.minSample ?? 10;
