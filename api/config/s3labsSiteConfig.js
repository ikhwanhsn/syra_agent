/**
 * Canonical S3 Labs public site URL.
 * Legacy hosts (s3labs.id, s3labs.fun) are rewritten so stale env vars cannot
 * keep Telegram / email links on the old domain after the move to s3labs.xyz.
 */

export const S3LABS_CANONICAL_HOST = "s3labs.xyz";
export const S3LABS_CANONICAL_ORIGIN = `https://${S3LABS_CANONICAL_HOST}`;

/** Hostnames that must never appear in outbound product links. */
const LEGACY_S3LABS_HOSTS = new Set([
  "s3labs.id",
  "www.s3labs.id",
  "s3labs.fun",
  "www.s3labs.fun",
]);

/**
 * @param {string | null | undefined} raw
 * @returns {string} Origin without trailing slash
 */
export function resolveS3labsSiteUrl(raw) {
  const fallback = S3LABS_CANONICAL_ORIGIN;
  const input = String(raw || "").trim();
  if (!input) return fallback;

  try {
    const withProtocol = /^https?:\/\//i.test(input) ? input : `https://${input}`;
    const url = new URL(withProtocol);
    const host = url.hostname.toLowerCase();

    if (LEGACY_S3LABS_HOSTS.has(host) || host.endsWith(".s3labs.id") || host.endsWith(".s3labs.fun")) {
      console.warn(
        `[s3labs-site] Rewrote legacy site URL ${input} → ${S3LABS_CANONICAL_ORIGIN}`,
      );
      return S3LABS_CANONICAL_ORIGIN;
    }

    // Production must stay on the public brand domain (ignore accidental localhost in prod).
    if (
      process.env.NODE_ENV === "production" &&
      (host === "localhost" || host === "127.0.0.1")
    ) {
      console.warn(
        `[s3labs-site] Ignoring localhost S3LABS_SITE_URL in production → ${S3LABS_CANONICAL_ORIGIN}`,
      );
      return S3LABS_CANONICAL_ORIGIN;
    }

    url.hash = "";
    url.search = "";
    // Keep path empty for site origin; callers append paths.
    url.pathname = "";
    return url.origin.replace(/\/$/, "");
  } catch {
    console.warn(
      `[s3labs-site] Invalid S3LABS_SITE_URL "${input}" — using ${S3LABS_CANONICAL_ORIGIN}`,
    );
    return fallback;
  }
}

export const S3LABS_SITE_URL = resolveS3labsSiteUrl(process.env.S3LABS_SITE_URL);

/**
 * @param {string} [path]
 * @returns {string}
 */
export function buildS3labsSiteUrl(path = "") {
  const normalized = String(path || "").trim();
  if (!normalized) return S3LABS_SITE_URL;
  const suffix = normalized.startsWith("/") ? normalized : `/${normalized}`;
  return `${S3LABS_SITE_URL}${suffix}`;
}
