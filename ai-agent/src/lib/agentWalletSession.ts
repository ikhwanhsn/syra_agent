export const AGENT_ANONYMOUS_ID_STORAGE_KEY = "syra_agent_anonymous_id";
export const AGENT_WALLET_CACHE_KEY = "syra_agent_wallet_cache_v1";

/** Clear local agent wallet session so the next visit provisions fresh wallets. */
export function clearAgentWalletLocalSession(): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.removeItem(AGENT_ANONYMOUS_ID_STORAGE_KEY);
    localStorage.removeItem(AGENT_WALLET_CACHE_KEY);
  } catch {
    /* quota / private mode */
  }
}
