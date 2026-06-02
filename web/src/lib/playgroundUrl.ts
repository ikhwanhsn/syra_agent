/** Base for parsing relative playground URLs (dev Vite `/api` proxy). */
export function getPlaygroundUrlParseBase(): string {
  if (typeof window !== "undefined") return window.location.origin;
  return "https://api.syraa.fun";
}

/** Parse absolute or same-origin relative request URLs. */
export function parsePlaygroundRequestUrl(url: string): URL | null {
  const trimmed = url.trim();
  if (!trimmed) return null;
  try {
    return new URL(trimmed, getPlaygroundUrlParseBase());
  } catch {
    return null;
  }
}

/** Syra gateway path without the dev `/api` prefix (matches api/index.js routes). */
export function getPlaygroundSyraPathname(url: string): string {
  const parsed = parsePlaygroundRequestUrl(url);
  if (!parsed) return "";
  let path = parsed.pathname.toLowerCase();
  if (path.startsWith("/api/")) path = path.slice(4);
  else if (path === "/api") path = "/";
  if (!path.startsWith("/")) path = `/${path}`;
  return path;
}

export function isValidPlaygroundRequestUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) {
    return trimmed.length > 1;
  }
  const parsed = parsePlaygroundRequestUrl(trimmed);
  if (!parsed) return false;
  return parsed.protocol === "http:" || parsed.protocol === "https:";
}

/** Resolved absolute URL for fetch (relative `/api/...` stays relative for Vite proxy). */
export function toPlaygroundFetchUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) return trimmed;
  return trimmed;
}
