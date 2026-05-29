/** Canonical agent setup + app settings path for the current app shell. */
export function agentSettingsPath(pathname: string): string {
  return pathname === "/settings" ? "/settings" : "/agent-setup";
}

export function isAgentSettingsPath(pathname: string): boolean {
  return pathname === "/settings" || pathname === "/agent-setup";
}
