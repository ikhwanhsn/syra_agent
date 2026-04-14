const PRODUCTION_DEFAULT = 'https://api.syraa.fun';
const LOCAL_DEFAULT = 'http://localhost:3000';

function isBrowserLocalhost(): boolean {
  if (typeof window === 'undefined') return false;
  const h = window.location.hostname;
  return h === 'localhost' || h === '127.0.0.1' || h === '::1' || h === '[::1]';
}

function envApiBase(): string {
  const raw = import.meta.env.VITE_API_BASE_URL;
  if (typeof raw !== 'string') return '';
  return raw.trim().replace(/\/$/, '');
}

function looksLikeLocalhost(url: string): boolean {
  try {
    const host = new URL(url).hostname;
    return host === 'localhost' || host === '127.0.0.1';
  } catch {
    return /localhost|127\.0\.0\.1/i.test(url);
  }
}

/**
 * Syra API base for playground requests.
 * On localhost: use VITE_API_BASE_URL if set, else LOCAL_DEFAULT.
 * On any other origin: use VITE_API_BASE_URL only when it does not point at localhost
 * (avoids production bundles baked with a dev .env).
 */
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

/** Purch Vault API base (agent marketplace). Override via VITE_PURCH_VAULT_API_BASE_URL. */
export function resolvePurchVaultBaseUrl(): string {
  const base = import.meta.env.VITE_PURCH_VAULT_API_BASE_URL as string | undefined;
  return (base && base.trim()) || 'https://api.purch.xyz';
}

const PROXY_PREFIX = '/api/proxy/';

/**
 * Browser fetch URL for a Syra API asset (e.g. `/mpp-openapi.json`).
 * In dev, the Vite server exposes `/api/proxy/<encoded-url>` so the browser stays same-origin
 * while Node fetches the Syra API — avoids CORS and some "private network request" failures
 * when the playground runs on another port than the API.
 */
export function resolveSyraBrowserFetchUrl(absoluteUrl: string): string {
  const useProxy = import.meta.env.DEV || import.meta.env.VITE_USE_PROXY === 'true';
  if (!useProxy) return absoluteUrl;
  if (absoluteUrl.startsWith('/') || absoluteUrl.startsWith(PROXY_PREFIX)) return absoluteUrl;
  return `${PROXY_PREFIX}${encodeURIComponent(absoluteUrl)}`;
}
