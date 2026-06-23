/** Hardcoded admin wallet — internal tools on S3 Labs (mirrors api/libs/adminWallet.js). */
export const ADMIN_DASHBOARD_WALLETS = Object.freeze([
  "FiejqEgqQ8bxtUJpZMy5p1wVCcejKyy5PgZ4cwmLBvYD",
] as const);

export function isAdminWallet(address: string | null | undefined): boolean {
  if (!address) return false;
  return ADMIN_DASHBOARD_WALLETS.includes(address as (typeof ADMIN_DASHBOARD_WALLETS)[number]);
}
