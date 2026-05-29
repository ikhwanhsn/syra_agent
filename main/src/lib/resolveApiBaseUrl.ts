import { env } from "@/lib/env";

const PRODUCTION_DEFAULT = "https://api.syraa.fun";
const LOCAL_DEFAULT = "http://localhost:3000";

function isBrowserLocalhost(): boolean {
  if (typeof window === "undefined") return false;
  const h = window.location.hostname;
  return h === "localhost" || h === "127.0.0.1" || h === "::1" || h === "[::1]";
}

function envApiBase(): string {
  return env.syraApiUrl.replace(/\/$/, "");
}

function looksLikeLocalhost(url: string): boolean {
  try {
    const host = new URL(url).hostname;
    return host === "localhost" || host === "127.0.0.1";
  } catch {
    return /localhost|127\.0\.0\.1/i.test(url);
  }
}

export function resolveApiBaseUrl(): string {
  const fromEnv = envApiBase();
  if (isBrowserLocalhost()) {
    return fromEnv || LOCAL_DEFAULT;
  }
  if (fromEnv && !looksLikeLocalhost(fromEnv)) {
    return fromEnv;
  }
  return PRODUCTION_DEFAULT;
}

export function resolvePurchVaultBaseUrl(): string {
  return (env.purchVaultApiBaseUrl?.trim()) || "https://api.purch.xyz";
}

const PROXY_PREFIX = "/api/proxy/";

export function resolveSyraBrowserFetchUrl(absoluteUrl: string): string {
  const useProxy = env.isDev || env.useProxy;
  if (!useProxy) return absoluteUrl;
  if (absoluteUrl.startsWith("/") || absoluteUrl.startsWith(PROXY_PREFIX)) return absoluteUrl;
  return `${PROXY_PREFIX}${encodeURIComponent(absoluteUrl)}`;
}
