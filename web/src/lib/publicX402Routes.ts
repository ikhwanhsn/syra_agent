import {
  isSyraX402DiscoveryPath,
  X402_DISCOVERY_RESOURCE_PATHS,
} from "@/lib/x402DiscoveryResourcePaths";
import {
  getPlaygroundSyraPathname,
  parsePlaygroundRequestUrl,
} from "@/lib/playgroundUrl";

export { X402_DISCOVERY_RESOURCE_PATHS, isSyraX402DiscoveryPath };

/**
 * Public Syra HTTP routes advertised in GET /.well-known/x402.
 * Partner gateway paths (/binance/*, most /nansen/*, etc.) and agent-direct tools
 * are x402 on the wire but not listed in discovery — use POST /agent/tools/call instead.
 *
 * Keep in sync with api/config/x402DiscoveryResourcePaths.js.
 */
export function isPublicSyraX402Path(pathname: string): boolean {
  return isSyraX402DiscoveryPath(pathname);
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
