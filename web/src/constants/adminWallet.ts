import { env } from "@/lib/env";

const DEFAULT_ADMIN_WALLET = "FiejqEgqQ8bxtUJpZMy5p1wVCcejKyy5PgZ4cwmLBvYD";

/**
 * Internal dashboard is shown only when this wallet is connected.
 * Override with VITE_ADMIN_DASHBOARD_WALLET (comma-separated for multiple).
 */
export function getAdminDashboardWallets(): string[] {
  const raw = env.adminDashboardWallet || DEFAULT_ADMIN_WALLET;
  return [...new Set(raw.split(",").map((s) => s.trim()).filter(Boolean))];
}

/** Primary admin (first in list) — shown in access-denied UI. */
export const ADMIN_DASHBOARD_WALLET = getAdminDashboardWallets()[0] ?? DEFAULT_ADMIN_WALLET;

export function isAdminWallet(
  connected: boolean,
  address: string | null | undefined,
): boolean {
  if (!connected || !address) return false;
  return getAdminDashboardWallets().includes(address);
}
