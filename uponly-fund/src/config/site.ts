/** Canonical origin for OG URLs, JSON-LD, and meta. Set `VITE_PUBLIC_SITE_ORIGIN` in `.env` when deploying. */
const raw =
  typeof import.meta.env.VITE_PUBLIC_SITE_ORIGIN === "string"
    ? import.meta.env.VITE_PUBLIC_SITE_ORIGIN.trim()
    : "https://uponly.fund";

export const SITE_ORIGIN = raw.replace(/\/$/, "");
