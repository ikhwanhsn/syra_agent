import { env, getApiBaseUrl } from "@/lib/env";

const PROXY_PREFIX = "/api/proxy/";

export function resolveApiBaseUrl(): string {
  return getApiBaseUrl();
}

export function resolvePurchVaultBaseUrl(): string {
  return (env.purchVaultApiBaseUrl?.trim()) || "https://api.purch.xyz";
}

export function resolveSyraBrowserFetchUrl(absoluteUrl: string): string {
  const useProxy = env.isDev || env.useProxy;
  if (!useProxy) return absoluteUrl;
  if (absoluteUrl.startsWith("/") || absoluteUrl.startsWith(PROXY_PREFIX)) return absoluteUrl;
  return `${PROXY_PREFIX}${encodeURIComponent(absoluteUrl)}`;
}
