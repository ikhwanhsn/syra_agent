import { Navigate, useLocation } from "@/lib/navigation";

/** Old /marketplace and /marketplace/* → dashboard overview */
export function LegacyMarketplaceRedirect() {
  return <Navigate to="/overview" replace />;
}

/** Old /agent-wallet → /wallet (preserves query + hash). */
export function LegacyAgentWalletRedirect() {
  const { search, hash } = useLocation();
  return <Navigate to={`/wallet${search}${hash}`} replace />;
}

/** Old /dashboard/* routes -> top-level routes without prefix. */
export function LegacyDashboardPrefixRedirect() {
  const { pathname, search, hash } = useLocation();
  const nextPath = pathname.replace(/^\/dashboard(\/|$)/, "/");
  const resolvedPath = nextPath === "/" ? "/overview" : nextPath;
  return <Navigate to={`${resolvedPath}${search}${hash}`} replace />;
}
