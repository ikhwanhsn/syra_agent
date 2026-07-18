import { Navigate, useSearchParams } from "react-router-dom";

/**
 * Legacy `/kol/check` route — keep bookmarks working by landing on the
 * marketplace Check tab instead of a separate page.
 */
const KolEarningsCheck = () => {
  const [searchParams] = useSearchParams();
  const handle = searchParams.get("handle")?.trim();
  const next = new URLSearchParams();
  next.set("tab", "check");
  if (handle) next.set("handle", handle);
  return <Navigate to={`/kol?${next.toString()}`} replace />;
};

export default KolEarningsCheck;
