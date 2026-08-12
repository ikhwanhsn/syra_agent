/**
 * On-chain $SYRA holder / market snapshot for public /api/metrics (holder funnel).
 *
 * Top-holder RPC reads use multi-URL fallbacks (can stack to tens of seconds).
 * Always race them with a short budget so public metrics stay snappy.
 */
import { isMongooseConnected } from "../config/mongoose.js";
import { fetchOnchainTokenPrice } from "./equityPriceFetchers.js";
import { fetchSplTokenTopHolders } from "./solanaTokenLargestHolders.js";
import { SYRA_TOKEN_MINT } from "./syraToken.js";
import { computeOperatorStats } from "../services/streamflowLockAggregates.js";
import { getDexscreenerTokenInfo } from "../scripts/getDexscreenerTokenInfo.js";

const TOP_HOLDERS_LIMIT = 20;
const STAKING_DECIMALS = Number(process.env.STAKING_DECIMALS) || 6;
const SLOW_READ_BUDGET_MS = Math.max(
  800,
  Number.parseInt(process.env.PUBLIC_METRICS_HOLDER_RPC_MS || "2000", 10) || 2_000,
);

/**
 * @template T
 * @param {Promise<T>} promise
 * @param {number} ms
 * @param {T} fallback
 * @returns {Promise<T>}
 */
function withBudget(promise, ms, fallback) {
  let timer;
  return Promise.race([
    Promise.resolve(promise).catch(() => fallback),
    new Promise((resolve) => {
      timer = setTimeout(() => resolve(fallback), ms);
      timer.unref?.();
    }),
  ]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

function formatStakedAmount(raw) {
  try {
    const n = BigInt(String(raw || "0"));
    const divisor = 10n ** BigInt(STAKING_DECIMALS);
    const whole = n / divisor;
    const frac = n % divisor;
    if (frac === 0n) return whole.toString();
    const fracStr = frac.toString().padStart(STAKING_DECIMALS, "0").replace(/0+$/, "");
    return `${whole}.${fracStr}`;
  } catch {
    return "0";
  }
}

export async function gatherHolderPulseSnapshot() {
  const mint = SYRA_TOKEN_MINT;

  const [holders, price, dexRaw, staking] = await Promise.all([
    withBudget(
      fetchSplTokenTopHolders(mint, { limit: TOP_HOLDERS_LIMIT }),
      SLOW_READ_BUDGET_MS,
      null,
    ),
    withBudget(fetchOnchainTokenPrice(mint), SLOW_READ_BUDGET_MS, null),
    withBudget(getDexscreenerTokenInfo(mint), SLOW_READ_BUDGET_MS, null),
    isMongooseConnected()
      ? withBudget(computeOperatorStats(mint, "mainnet"), SLOW_READ_BUDGET_MS, null)
      : Promise.resolve(null),
  ]);

  let marketCapUsd = null;
  const pairs = Array.isArray(dexRaw?.pairs) ? dexRaw.pairs : [];
  const best = [...pairs]
    .filter((p) => p?.chainId === "solana")
    .sort((a, b) => (Number(b?.liquidity?.usd) || 0) - (Number(a?.liquidity?.usd) || 0))[0];
  if (best) {
    marketCapUsd = Number(best.marketCap ?? best.fdv) || null;
  }

  const snapshot = {
    mint,
    updatedAt: new Date().toISOString(),
    holders: holders ?? { mint, holders: [], supplyHuman: 0, top10ConcentrationPct: null },
    price: price
      ? {
          priceUsd: price.priceUsd,
          liquidityUsd: price.liquidityUsd,
          volume24h: price.volume24h,
          priceChange24h: price.priceChange24h,
          source: price.source,
        }
      : null,
    marketCapUsd,
    staking: staking
      ? {
          uniqueWallets: staking.uniqueWallets,
          openLockCount: staking.openLockCount,
          totalStakedFormatted: formatStakedAmount(staking.totalAmountRawOpen),
          closedLockCount: staking.closedLockCount,
        }
      : null,
  };

  return { success: true, data: snapshot };
}
