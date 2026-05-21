import { useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { isQwertiHiddenRoute } from "@/lib/qwertiRoutes";
import { qwertiClient } from "@/lib/qwerti";

/**
 * Injects the Qwerti embed on visit (no manual buy button).
 * Uses data-auto-open so the buy widget opens without an extra click.
 */
export function QwertiAutoLoad() {
  const { pathname } = useLocation();
  const hidden = useMemo(() => isQwertiHiddenRoute(pathname), [pathname]);

  useEffect(() => {
    if (hidden) return;
    void qwertiClient.init().catch(() => {
      // DNS/network: buy modal in Token section still opens the magic link.
    });
  }, [hidden]);

  return null;
}
