/**
 * Centralized public env access for the Syra web app (Vite).
 */

function read(key: keyof ImportMetaEnv): string | undefined {
  const v = import.meta.env[key];
  return typeof v === "string" && v.trim() !== "" ? v.trim() : undefined;
}

const PRODUCTION_API_DEFAULT = "https://api.syraa.fun";

function isLocalApiHost(url: string): boolean {
  const lower = url.toLowerCase();
  if (lower === "/api" || lower.startsWith("/api/")) return true;
  try {
    const host = new URL(url, "http://localhost").hostname.toLowerCase();
    return host === "localhost" || host === "127.0.0.1" || host === "::1";
  } catch {
    return /localhost|127\.0\.0\.1/i.test(lower);
  }
}

function isBrowserLocalhost(): boolean {
  if (typeof window === "undefined") return false;
  const h = window.location.hostname;
  return h === "localhost" || h === "127.0.0.1" || h === "::1" || h === "[::1]";
}

function devUsesLocalApiGateway(): boolean {
  return read("VITE_USE_LOCAL_API") === "true";
}

/**
 * API origin for browser fetches.
 * - Local dev on localhost: /api (same-origin Vite proxy — avoids CORS to api.syraa.fun)
 * - VITE_USE_LOCAL_API=true: proxy targets local gateway (localhost:3000)
 * - Production: https://api.syraa.fun (or explicit VITE_SYRA_API_URL)
 */
function resolveApiBase(): string {
  if (import.meta.env.DEV && typeof window !== "undefined" && isBrowserLocalhost()) {
    return "/api";
  }

  const explicit = read("VITE_SYRA_API_URL") ?? read("VITE_API_URL");
  if (explicit) {
    if (isLocalApiHost(explicit)) {
      if (import.meta.env.DEV) {
        console.warn(
          "[Syra] VITE_SYRA_API_URL points at localhost — use VITE_USE_LOCAL_API=true with the /api dev proxy instead.",
        );
      }
      return PRODUCTION_API_DEFAULT;
    }
    return explicit.replace(/\/$/, "");
  }

  return PRODUCTION_API_DEFAULT;
}

export const env = {
  isDev: import.meta.env.DEV,

  syraApiUrl: resolveApiBase(),

  /** When true, Vite /api proxy targets local gateway (localhost:3000) instead of api.syraa.fun. */
  useLocalApi: devUsesLocalApiGateway(),

  solanaRpcUrl: read("VITE_SOLANA_RPC_URL") ?? "https://rpc.ankr.com/solana",

  privyAppId: read("VITE_PRIVY_APP_ID"),
  privyClientId: read("VITE_PRIVY_CLIENT_ID"),

  useProxy: read("VITE_USE_PROXY") === "true",
  nansenApiBaseUrl: read("VITE_NANSEN_API_BASE_URL"),
  purchVaultApiBaseUrl: read("VITE_PURCH_VAULT_API_BASE_URL"),

  solanaNetwork: read("VITE_SOLANA_NETWORK") ?? "mainnet-beta",
  stakingProgramId: read("VITE_STAKING_PROGRAM_ID"),
  stakingMint: read("VITE_STAKING_MINT"),
  rewardMint: read("VITE_REWARD_MINT"),
  rewardPerSecond: read("VITE_REWARD_PER_SECOND"),
  rewardDecimals: read("VITE_REWARD_DECIMALS"),
  stakingDecimals: read("VITE_STAKING_DECIMALS"),
  stakingTokenSymbol: read("VITE_STAKING_TOKEN_SYMBOL") ?? "SYRA",
  rewardTokenPriceUsd: read("VITE_REWARD_TOKEN_PRICE_USD"),
  stakingTokenPriceUsd: read("VITE_STAKING_TOKEN_PRICE_USD"),
  streamflowStakingMint: read("VITE_STREAMFLOW_STAKING_MINT"),
  adminDashboardWallet: read("VITE_ADMIN_DASHBOARD_WALLET"),
} as const;

/** Runtime API base — never uses localhost when the site is served from production. */
export function getApiBaseUrl(): string {
  const base = resolveApiBase();
  if (!isBrowserLocalhost() && !import.meta.env.DEV && isLocalApiHost(base)) {
    return PRODUCTION_API_DEFAULT;
  }
  return base;
}
