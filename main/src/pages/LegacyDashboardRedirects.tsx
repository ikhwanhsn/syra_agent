import { Navigate, useLocation, useParams, useSearchParams } from "@/lib/navigation";

/** Old /marketplace and /marketplace/* → dashboard overview */
export function LegacyMarketplaceRedirect() {
  return <Navigate to="/overview" replace />;
}

/** Preserves ?suite= when redirecting old /experiment/trading-agent URLs. */
export function LegacyTradingExperimentPageRedirect() {
  const [sp] = useSearchParams();
  const suite = sp.get("suite");
  const suffix = suite ? `?suite=${encodeURIComponent(suite)}` : "";
  return <Navigate to={`/trading-experiment${suffix}`} replace />;
}

/** Preserves ?suite= when redirecting old agent profile URLs. */
export function LegacyTradingExperimentAgentRedirect() {
  const { agentId } = useParams<{ agentId: string }>();
  const [sp] = useSearchParams();
  const suite = sp.get("suite");
  const suffix = suite ? `?suite=${encodeURIComponent(suite)}` : "";
  return <Navigate to={`/trading-experiment/agent/${agentId ?? ""}${suffix}`} replace />;
}

/** Old /dashboard/* routes -> top-level routes without prefix. */
export function LegacyDashboardPrefixRedirect() {
  const { pathname, search, hash } = useLocation();
  const nextPath = pathname.replace(/^\/dashboard(\/|$)/, "/");
  const resolvedPath = nextPath === "/" ? "/overview" : nextPath;
  return <Navigate to={`${resolvedPath}${search}${hash}`} replace />;
}
