import { Navigate, useParams, useSearchParams } from "react-router-dom";

/** Old /marketplace and /marketplace/* → dashboard overview */
export function LegacyMarketplaceRedirect() {
  return <Navigate to="/dashboard/overview" replace />;
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
