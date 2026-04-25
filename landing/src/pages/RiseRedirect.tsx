import { Navigate } from "react-router-dom";

/**
 * Client-side redirect from legacy /rise to /uponly.
 * Vercel also 301s /rise in production; this covers SPA dev and in-app navigation.
 */
export default function RiseRedirect() {
  return <Navigate to="/uponly" replace />;
}
