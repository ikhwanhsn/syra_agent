/**
 * On-chain $SYRA holder / market snapshot for public /api/metrics (holder funnel).
 */
import { isMongooseConnected } from "../config/mongoose.js";
import { fetchOnchainTokenPrice } from "./equityPriceFetchers.js";
import { fetchSplTokenTopHolders } from "./solanaTokenLargestHolders.js";
import { SYRA_TOKEN_MINT } from "./syraToken.js";
import { computeOperatorStats } from "../services/streamflowLockAggregates.js";
import { getDexscreenerTokenInfo } from "../scripts/getDexscreenerTokenInfo.js";

const TOP_HOLDERS_LIMIT = 20;
const STAKING_DECIMALS = Number(process.env.STAKING_DECIMALS) || 6;

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
    fetchSplTokenTopHolders(mint, { limit: TOP_HOLDERS_LIMIT }).catch(() => null),
    fetchOnchainTokenPrice(mint).catch(() => null),
    getDexscreenerTokenInfo(mint).catch(() => null),
    isMongooseConnected()
      ? computeOperatorStats(mint, "mainnet").catch(() => null)
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
