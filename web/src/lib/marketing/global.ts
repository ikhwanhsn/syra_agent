/** Agent chat — same web app at `/`. */
const LINK_AGENT = "/";

/** Opens the Syra agent with a prefilled question (`?q=`). Agent app auto-sends after load. */
function getAgentAskUrl(question: string): string {
  const trimmed = question.trim();
  if (!trimmed) return LINK_AGENT;
  const sep = LINK_AGENT.includes("?") ? "&" : "?";
  return `${LINK_AGENT}${sep}q=${encodeURIComponent(trimmed)}`;
}
const LINK_DOCS = "https://docs.syraa.fun";
const LINK_MARKETPLACE = "/marketplace";
const LINK_PLAYGROUND = "/marketplace";

/** Production Syra API gateway (landing preview, stats, leaderboard). */
const PRODUCTION_API_ORIGIN = "https://api.syraa.fun";

function isLocalApiHost(url: string): boolean {
  const lower = url.toLowerCase();
  if (lower === "/api" || lower.startsWith("/api/")) return true;
  try {
    const host = new URL(url, "http://localhost").hostname.toLowerCase();
    return host === "localhost" || host === "127.0.0.1" || host === "::1";
  } catch {
    return /localhost|127\.0\.0\.1/.test(lower);
  }
}

function devUsesLocalApiProxy(): boolean {
  return (
    import.meta.env.DEV &&
    String(import.meta.env.VITE_USE_LOCAL_API ?? "").toLowerCase() === "true"
  );
}

/**
 * API origin for browser fetches.
 * - Default (dev + prod): https://api.syraa.fun
 * - Local API: VITE_USE_LOCAL_API=true → /api (Vite proxies to localhost:3000)
 * - VITE_SYRA_API_URL is ignored when it points at localhost unless local mode is on
 *   (avoids accidental http://localhost:3000 in .env causing 502/503 spam)
 */
function resolveApiBase(): string {
  const useLocalProxy = devUsesLocalApiProxy();
  if (useLocalProxy) return "/api";

  const explicit = (import.meta.env.VITE_SYRA_API_URL as string | undefined)?.trim();
  if (explicit) {
    if (isLocalApiHost(explicit)) {
      if (import.meta.env.DEV) {
        console.warn(
          "[Syra] VITE_SYRA_API_URL points at localhost but VITE_USE_LOCAL_API is not true — using https://api.syraa.fun. For a local gateway use VITE_USE_LOCAL_API=true (proxied via /api).",
        );
      }
      return PRODUCTION_API_ORIGIN;
    }
    return explicit.replace(/\/$/, "");
  }

  return PRODUCTION_API_ORIGIN;
}

const API_BASE = resolveApiBase();

/** Trailing-slash base for preview routes (binance-ticker, preview/*). */
function getSyraApiBase(): string {
  return `${API_BASE.replace(/\/$/, "")}/`;
}

const LINK_TELEGRAM = "https://t.me/syra_ai";
const LINK_X = "https://x.com/syra_agent";
const EMAIL_SUPPORT = "support@syraa.fun";

/** Syra staking — same web app at `/staking`. */
const LINK_STAKING = "/staking";

/** Headers for Syra API. Do not embed API keys in client code; the API injects auth for trusted origins (syraa.fun). */
function getApiHeaders(): Record<string, string> {
  if (import.meta.env.DEV) {
    const leaked = (import.meta.env.VITE_API_KEY as string | undefined)?.trim();
    if (leaked) {
      console.warn(
        "[Syra] VITE_API_KEY is set but must not be sent from browser bundles. Remove it from .env — api.syraa.fun injects auth for trusted origins.",
      );
    }
  }
  return {};
}

export {
  LINK_AGENT,
  getAgentAskUrl,
  LINK_DOCS,
  LINK_PLAYGROUND,
  API_BASE,
  PRODUCTION_API_ORIGIN,
  getSyraApiBase,
  EMAIL_SUPPORT,
  getApiHeaders,
  LINK_TELEGRAM,
  LINK_X,
  LINK_STAKING,
};
