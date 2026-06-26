export function normalizeImageUrl(url: string | null | undefined): string | null {
  if (!url?.trim()) return null;

  const trimmed = url.trim();
  if (trimmed.startsWith("//")) return `https:${trimmed}`;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  return null;
}

export function faviconFromPageUrl(pageUrl: string | null | undefined): string | null {
  if (!pageUrl?.trim()) return null;

  try {
    const host = new URL(pageUrl).hostname;
    if (!host) return null;
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=128`;
  } catch {
    return null;
  }
}
