import { env } from "@/lib/env";

/**
 * Internal dashboard is shown only when this wallet is connected.
 * Override with VITE_ADMIN_DASHBOARD_WALLET for staging.
 */
export const ADMIN_DASHBOARD_WALLET =
  env.adminDashboardWallet || "Cp5yFGYx88EEuUjhDAaQzXHrgxvVeYEWixtRnLFE81K4";

export function isAdminWallet(
  connected: boolean,
  address: string | null | undefined,
): boolean {
  if (!connected || !address) return false;
  return address === ADMIN_DASHBOARD_WALLET;
}
