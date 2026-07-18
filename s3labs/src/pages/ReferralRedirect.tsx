import { useEffect } from "react";
import { Navigate, useParams } from "react-router-dom";

import { persistPendingReferral } from "@/lib/referralCapture";

/**
 * `/r/:code` → persist ref and land on marketplace with `?ref=`.
 */
export default function ReferralRedirect() {
  const { code } = useParams<{ code: string }>();

  useEffect(() => {
    if (code) persistPendingReferral(code);
  }, [code]);

  const normalized = String(code || "")
    .trim()
    .toLowerCase()
    .replace(/^@/, "");

  if (!normalized) {
    return <Navigate to="/kol" replace />;
  }

  return <Navigate to={`/kol?ref=${encodeURIComponent(normalized)}`} replace />;
}
