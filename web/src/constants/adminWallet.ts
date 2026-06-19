/** Hardcoded admin wallet — internal dashboard + admin API routes. */
export const ADMIN_DASHBOARD_WALLETS = Object.freeze([
  "FiejqEgqQ8bxtUJpZMy5p1wVCcejKyy5PgZ4cwmLBvYD",
] as const);

/** Primary admin — shown in access-denied UI. */
export const ADMIN_DASHBOARD_WALLET = ADMIN_DASHBOARD_WALLETS[0];

/**
 * Internal dashboard is shown only when this wallet is connected.
 */
export function getAdminDashboardWallets(): string[] {
  return [...ADMIN_DASHBOARD_WALLETS];
}

export function isAdminWallet(
  connected: boolean,
  address: string | null | undefined,
): boolean {
  if (!connected || !address) return false;
  return ADMIN_DASHBOARD_WALLETS.some((w) => w === address);
}
