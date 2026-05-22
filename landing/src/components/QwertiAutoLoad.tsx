import { useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { closeQwertiBuyWidget } from "@/lib/qwerti";
import { injectQwertiHeadScript } from "@/lib/qwertiHeadScript";
import { isQwertiHiddenRoute } from "@/lib/qwertiRoutes";

/**
 * Ensures the Qwerti embed script is present on marketing routes.
 * Launcher + open() are handled by the official buy.js bundle.
 */
export function QwertiAutoLoad() {
  const { pathname } = useLocation();
  const hidden = useMemo(() => isQwertiHiddenRoute(pathname), [pathname]);

  useEffect(() => {
    if (hidden) {
      closeQwertiBuyWidget();
      return;
    }
    injectQwertiHeadScript();
  }, [hidden]);

  return null;
}
