/** Human-readable title for the active dashboard route (sidebar chrome). */
export function dashboardPageTitle(pathname: string, _search = ""): string {
  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] === "about") return "About Syra";
  if (parts[0] === "earn") {
    if (parts[1] === "token") return "Earn token";
    if (parts[1] === "yield") return "Earn yield";
    return "Earn";
  }
  if (parts[0] === "treasury") return "Treasury";
  if (parts[0] === "invest") return "Invest";
  if (parts[0] === "spend") return "Spend";
  if (parts[0] === "grow") return "Grow";
  if (parts[0] === "overview") return "Overview";
  if (parts[0] === "agents" && parts[1]) return "Agent detail";
  if (parts[0] === "agents") return "Agents";
  if (parts[0] === "agent-setup") return "Agent setup";
  if (parts[0] === "wallet") return "Wallet";
  if (parts[0] === "assets" && parts[1]) return "Asset detail";
  if (parts[0] === "assets") return "Assets";
  if (parts[0] === "analyzer" || parts[0] === "pumpfun") return "Token Analyzer";
  if (parts[0] === "multiwallet" && parts[1] === "recover") return "Recover farm wallets";
  if (parts[0] === "lp-experiment") return "LP agent experiment";
  if (parts[0] === "meridian") return "Meridian DLMM lab";
  if (parts[0] === "stocks") return "Stocks news lab (paper)";
  if (parts[0] === "btc") return "Bitcoin";
  if (parts[0] === "labs") return "Labs";
  if (parts[0] === "llm") return "LLM";
  if (parts[0] === "organize") return "Organize";
  if (parts[0] === "settings") return "Settings";
  return "Overview";
}
