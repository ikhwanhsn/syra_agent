import { Navigate, useLocation } from "@/lib/navigation";

/** Legacy /internal-team-agents/* → /internal/* (preserves slug, query, hash). */
export function LegacyInternalTeamAgentsRedirect() {
  const { pathname, search, hash } = useLocation();
  const next = pathname.replace(/^\/internal-team-agents(\/|$)/, "/internal$1") || "/internal";
  return <Navigate to={`${next}${search}${hash}`} replace />;
}
