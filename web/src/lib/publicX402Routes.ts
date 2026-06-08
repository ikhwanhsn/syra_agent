import {
  getPlaygroundSyraPathname,
  parsePlaygroundRequestUrl,
} from "@/lib/playgroundUrl";

/**
 * Public Syra HTTP routes that accept x402 payment (mirrors api/index.js isX402Route).
 * Agent-direct tools (exa-search, crawl, pumpfun, 8004scan, heylol, quicknode, etc.)
 * were removed from HTTP — use POST /agent/tools/call instead.
 *
 * Keep in sync with api/config/x402DiscoveryResourcePaths.js and isX402Route in api/index.js.
 */
export function isPublicSyraX402Path(pathname: string): boolean {
  const p = pathname.toLowerCase();
  if (!p) return false;

  // Shares /binance prefix but is internal preview, not x402.
  if (p === "/binance-ticker" || p.startsWith("/binance-ticker/")) return false;

  if (p === "/brain" || p.startsWith("/brain/")) return true;
  if (p === "/news" || p.startsWith("/news/")) return true;
  if (p === "/signal" || p.startsWith("/signal/")) return true;
  if (p === "/sentiment" || p.startsWith("/sentiment/")) return true;
  if (p === "/event" || p.startsWith("/event/")) return true;
  if (p.startsWith("/trending-headline")) return true;
  if (p.startsWith("/sundown-digest")) return true;
  if (p === "/health" || p.startsWith("/health/")) return true;
  if (p.startsWith("/mpp/v1")) return true;
  if (p === "/arbitrage" || p.startsWith("/arbitrage/")) return true;
  if (p.startsWith("/analytics/summary")) return true;
  if (p === "/x" || p.startsWith("/x/")) return true;
  if (p === "/x-analyzer" || p.startsWith("/x-analyzer/")) return true;

  if (p.startsWith("/nansen/")) return true;
  if (p.startsWith("/binance/")) return true;
  if (p.startsWith("/bankr/")) return true;
  if (p.startsWith("/giza/")) return true;
  if (p.startsWith("/neynar/")) return true;
  if (p.startsWith("/siwa/")) return true;

  if (p === "/8004" || p.startsWith("/8004/")) return true;

  return false;
}

/** Whether a playground example flow targets a public x402 route (Syra or external origin). */
export function isPlaygroundX402FlowUrl(
  url: string,
  syraApiBase: string,
): boolean {
  const parsed = parsePlaygroundRequestUrl(url);
  if (!parsed) return false;

  const trimmed = url.trim();
  const isAbsoluteFlow =
    trimmed.startsWith("http://") || trimmed.startsWith("https://");

  const syraBase = syraApiBase.trim();
  const isAbsoluteSyraBase =
    syraBase.startsWith("http://") || syraBase.startsWith("https://");

  if (isAbsoluteFlow) {
    // Local dev uses `/api` proxy base — fully-qualified URLs are external x402 catalogs.
    if (!isAbsoluteSyraBase) return true;
    try {
      if (parsed.origin !== new URL(syraBase).origin) return true;
    } catch {
      return false;
    }
  }

  return isPublicSyraX402Path(getPlaygroundSyraPathname(url));
}
