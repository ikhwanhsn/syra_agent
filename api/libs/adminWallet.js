/**
 * Admin / internal-team wallet allowlist (mirrors web/src/constants/adminWallet.ts).
 */

/** Hardcoded admin wallet — internal dashboard + admin API routes. */
export const ADMIN_DASHBOARD_WALLETS = Object.freeze([
  "FiejqEgqQ8bxtUJpZMy5p1wVCcejKyy5PgZ4cwmLBvYD",
]);

/** @deprecated Use ADMIN_DASHBOARD_WALLETS */
const DEFAULT_ADMIN_WALLET = ADMIN_DASHBOARD_WALLETS[0];

/**
 * @returns {string[]}
 */
export function getAdminDashboardWallets() {
  return [...ADMIN_DASHBOARD_WALLETS];
}

/**
 * @param {string | null | undefined} address
 * @returns {boolean}
 */
export function isAdminWalletAddress(address) {
  if (!address || typeof address !== "string") return false;
  return ADMIN_DASHBOARD_WALLETS.includes(address.trim());
}

export { DEFAULT_ADMIN_WALLET };
