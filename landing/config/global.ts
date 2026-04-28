const LINK_AGENT = "https://agent.syraa.fun";

/** Opens the Syra agent with a prefilled question (`?q=`). Agent app auto-sends after load. */
function getAgentAskUrl(question: string): string {
  const trimmed = question.trim();
  if (!trimmed) return LINK_AGENT;
  try {
    const url = new URL(LINK_AGENT);
    url.searchParams.set("q", trimmed);
    return url.toString();
  } catch {
    const sep = LINK_AGENT.includes("?") ? "&" : "?";
    return `${LINK_AGENT}${sep}q=${encodeURIComponent(trimmed)}`;
  }
}
const LINK_DOCS = "https://docs.syraa.fun";
const LINK_PLAYGROUND = "https://playground.syraa.fun";
// In dev, use /api so Vite proxies to localhost:3000 (run: cd api && npm run dev)
const API_BASE = import.meta.env.DEV ? "/api" : "https://api.syraa.fun";
const LINK_TELEGRAM = "https://t.me/syra_ai";
const LINK_X = "https://x.com/syra_agent";
const EMAIL_SUPPORT = "support@syraa.fun";

/** Base URL of the Up Only Fund app. */
const LINK_UPONLY_APP = "https://uponlyfund.com" as const;

/** Headers for Syra API. Do not embed API keys in client code; the API injects auth for trusted origins (syraa.fun). */
function getApiHeaders(): Record<string, string> {
  return {};
}

export {
  LINK_AGENT,
  getAgentAskUrl,
  LINK_DOCS,
  LINK_PLAYGROUND,
  API_BASE,
  EMAIL_SUPPORT,
  getApiHeaders,
  LINK_TELEGRAM,
  LINK_X,
  LINK_UPONLY_APP,
};
