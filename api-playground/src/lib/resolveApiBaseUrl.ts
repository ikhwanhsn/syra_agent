const PRODUCTION_DEFAULT = 'https://api.syraa.fun';
const LOCAL_DEFAULT = 'http://localhost:3000';

function isBrowserLocalhost(): boolean {
  return (
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  );
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
