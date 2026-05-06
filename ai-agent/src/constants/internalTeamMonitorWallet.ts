/**
 * Solana wallet allowed to open the Internal team agents monitor on the agent dashboard.
 * Access is enforced in the UI; API `/internal/*` remains protected by server API key / trusted origin.
 */
export const INTERNAL_TEAM_MONITOR_SOLANA_WALLET =
  "FiejqEgqQ8bxtUJpZMy5p1wVCcejKyy5PgZ4cwmLBvYD" as const;

export function isInternalTeamMonitorWallet(
  address: string | null | undefined,
): boolean {
  if (!address || typeof address !== "string") return false;
  return address === INTERNAL_TEAM_MONITOR_SOLANA_WALLET;
}
