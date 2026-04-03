/**
 * Internal dashboard is shown only when this wallet is connected.
 * Override with NEXT_PUBLIC_ADMIN_DASHBOARD_WALLET for staging.
 */
export const ADMIN_DASHBOARD_WALLET =
  process.env.NEXT_PUBLIC_ADMIN_DASHBOARD_WALLET ||
  "Cp5yFGYx88EEuUjhDAaQzXHrgxvVeYEWixtRnLFE81K4";

export function isAdminWallet(
  connected: boolean,
  address: string | null | undefined
): boolean {
  if (!connected || !address) return false;
  return address === ADMIN_DASHBOARD_WALLET;
}
