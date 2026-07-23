/**
 * Public Earn Yield — multi-product dispatcher.
 * Aggregates adapters (LP, cbBTC, BTC3) for board / status / enable / kill.
 * Default product remains LP for back-compat of /yield/* routes without productId.
 */
import { isAdminWalletAddress } from "./adminWallet.js";
import {
  EARN_PRODUCT_LP,
  getEarnProduct,
  listEarnProducts,
  isEarnYieldBetaAllowed,
  isEarnYieldBetaOpen,
  resolvePublicProductStatus,
} from "../config/earnProducts.js";
import { getEarnAdapter, listEarnAdapters } from "./earnAdapters/index.js";

/**
 * @param {string} [productId]
 */
function requireAdapter(productId = EARN_PRODUCT_LP) {
  const id = String(productId || EARN_PRODUCT_LP).trim() || EARN_PRODUCT_LP;
  const adapter = getEarnAdapter(id);
  if (!adapter) {
    const err = new Error(`unknown_earn_product:${id}`);
    err.code = "unknown_earn_product";
    throw err;
  }
  return { productId: id, adapter, product: getEarnProduct(id) };
}

/** @deprecated prefer getEarnYieldProductStats(productId) */
export async function getEarnYieldPlatformStats() {
  return getEarnYieldProductStats(EARN_PRODUCT_LP);
}

/**
 * @param {string} [productId]
 */
export async function getEarnYieldProductStats(productId = EARN_PRODUCT_LP) {
  const { adapter } = requireAdapter(productId);
  return adapter.getStats();
}

/** @deprecated prefer getEarnYieldProductReadiness(productId) */
export async function getEarnYieldLaunchReadiness() {
  return getEarnYieldProductReadiness(EARN_PRODUCT_LP);
}

/**
 * @param {string} [productId]
 */
export async function getEarnYieldProductReadiness(productId = EARN_PRODUCT_LP) {
  const { adapter } = requireAdapter(productId);
  return adapter.getReadiness();
}

/**
 * Enforce kill switch for one product (default LP) or all.
 * @param {string|null} [productId] - null = all products
 */
export async function enforceEarnYieldKillSwitch(productId = null) {
  if (productId) {
    const { adapter } = requireAdapter(productId);
    return adapter.enforceKill();
  }
  const results = [];
  for (const adapter of listEarnAdapters()) {
    try {
      results.push(await adapter.enforceKill());
    } catch (e) {
      results.push({
        productId: adapter.productId,
        paused: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }
  return {
    paused: results.some((r) => r.paused),
    results,
  };
}

/**
 * Public board for Earn Yield tab — all products with per-product readiness.
 */
export async function getEarnYieldBoard({ ownerWallet = null, isAdmin = false } = {}) {
  const products = listEarnProducts();
  const betaOpen = isEarnYieldBetaOpen();
  const allowed = isEarnYieldBetaAllowed(ownerWallet, {
    isAdmin: isAdmin || isAdminWalletAddress(ownerWallet),
  });

  const productRows = await Promise.all(
    products.map(async (p) => {
      const adapter = getEarnAdapter(p.id);
      if (!adapter) {
        return {
          ...p,
          actionable: false,
          stats: null,
          readiness: { ready: false, blockers: ["no_adapter"], depositsPaused: true },
        };
      }
      const [stats, readiness] = await Promise.all([
        adapter.getStats().catch((e) => ({
          productId: p.id,
          denom: p.denom,
          error: e instanceof Error ? e.message : String(e),
        })),
        adapter.getReadiness().catch(() => ({
          ready: false,
          blockers: ["readiness_error"],
          depositsShouldPause: true,
        })),
      ]);

      const publicStatus = resolvePublicProductStatus(p, readiness);
      const actionable =
        publicStatus === "beta" &&
        betaOpen &&
        allowed &&
        readiness.ready &&
        !readiness.depositsShouldPause;

      return {
        id: p.id,
        label: p.label,
        status: publicStatus,
        declaredStatus: p.status,
        chain: p.chain,
        description: p.description,
        adapterKey: p.adapterKey,
        denom: p.denom,
        walletPurpose: p.walletPurpose,
        walletQuery: p.walletQuery,
        evidence: p.evidence,
        minDeposit: p.minDeposit,
        maxDeposit: p.maxDeposit,
        performanceFeeBps: p.performanceFeeBps,
        performanceFeePct: p.performanceFeeBps / 100,
        actionable,
        stats,
        readiness: {
          ready: Boolean(readiness.ready),
          blockers: readiness.blockers || [],
          depositsPaused: Boolean(readiness.depositsShouldPause || !readiness.ready),
        },
        disclosures: p.disclosures || [],
      };
    }),
  );

  // Platform stats: prefer LP for top-level back-compat
  const lpRow = productRows.find((r) => r.id === EARN_PRODUCT_LP);
  const platformStats = lpRow?.stats || null;
  const lpReadiness = lpRow?.readiness || { ready: false, blockers: [], depositsPaused: true };

  const disclosures = [
    "Non-custodial: you fund the matching agent wallet (LP or Invest). Syra does not take custody of your principal.",
    "Past lab performance is not a guarantee of future returns.",
    "Each product has its own deposit denom (SOL or USDC), caps, and kill switch.",
    "Products marked coming-soon stay non-actionable until real lab track record passes readiness guards.",
  ];

  return {
    products: productRows,
    platformStats,
    readiness: lpReadiness,
    beta: {
      open: betaOpen,
      allowed,
      // LP caps kept for back-compat fields
      minDepositSol: getEarnProduct(EARN_PRODUCT_LP)?.minDeposit ?? 1,
      maxDepositSol: getEarnProduct(EARN_PRODUCT_LP)?.maxDeposit ?? 5,
      performanceFeeBps: getEarnProduct(EARN_PRODUCT_LP)?.performanceFeeBps ?? 1000,
      performanceFeePct: (getEarnProduct(EARN_PRODUCT_LP)?.performanceFeeBps ?? 1000) / 100,
    },
    disclosures,
  };
}

/**
 * Enable Earn Yield for a product (default LP).
 */
export async function enableEarnYieldForUser({
  productId = EARN_PRODUCT_LP,
  anonymousId,
  ownerWallet,
  maxDepositSol,
  maxDeposit,
  enabledBy,
}) {
  const { adapter } = requireAdapter(productId);
  const cap = maxDeposit != null ? maxDeposit : maxDepositSol;
  return adapter.enableForUser({
    anonymousId,
    ownerWallet,
    maxDeposit: cap,
    enabledBy,
  });
}

/**
 * Disable Earn Yield for a product (default LP).
 */
export async function disableEarnYieldForUser({
  productId = EARN_PRODUCT_LP,
  anonymousId,
  closeAll = false,
}) {
  const { adapter } = requireAdapter(productId);
  return adapter.disableForUser({ anonymousId, closeAll });
}

/**
 * Per-user status for a product (default LP).
 */
export async function getEarnYieldUserStatus({
  productId = EARN_PRODUCT_LP,
  anonymousId,
  ownerWallet,
}) {
  const { adapter } = requireAdapter(productId);
  return adapter.getUserStatus({ anonymousId, ownerWallet });
}
