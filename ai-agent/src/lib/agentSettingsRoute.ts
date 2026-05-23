/** Canonical agent setup + app settings path for the current app shell. */
export function agentSettingsPath(pathname: string): string {
  return pathname.startsWith("/dashboard") ? "/dashboard/settings" : "/settings";
}

export function isAgentSettingsPath(pathname: string): boolean {
  return pathname === "/settings" || pathname === "/dashboard/settings";
}
