import { Navigate, useLocation, useParams, useSearchParams } from "react-router-dom";

const MARKETPLACE_SEGMENTS = new Set(["prompts", "agents"]);

/** Old /marketplace and /marketplace/* → /dashboard/marketplace/… */
export function LegacyMarketplaceRedirect() {
  const { pathname } = useLocation();
  const tail = pathname.replace(/^\/marketplace\/?/, "").split("/").filter(Boolean)[0];
  const seg = tail && MARKETPLACE_SEGMENTS.has(tail) ? tail : "prompts";
  return <Navigate to={`/dashboard/marketplace/${seg}`} replace />;
}

/** Preserves ?suite= when redirecting old /experiment/trading-agent URLs. */
export function LegacyTradingExperimentPageRedirect() {
  const [sp] = useSearchParams();
  const suite = sp.get("suite");
  const suffix = suite ? `?suite=${encodeURIComponent(suite)}` : "";
  return <Navigate to={`/dashboard/trading-experiment${suffix}`} replace />;
}

/** Preserves ?suite= when redirecting old agent profile URLs. */
export function LegacyTradingExperimentAgentRedirect() {
  const { agentId } = useParams<{ agentId: string }>();
  const [sp] = useSearchParams();
  const suite = sp.get("suite");
  const suffix = suite ? `?suite=${encodeURIComponent(suite)}` : "";
  return <Navigate to={`/dashboard/trading-experiment/agent/${agentId ?? ""}${suffix}`} replace />;
}
